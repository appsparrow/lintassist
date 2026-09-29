(() => {
  const WORKER = 'https://ux-audit-worker.domain-sparrow.workers.dev';
  const labels = {heuristics:"Nielsen's 10 Usability Heuristics",visual_hierarchy:'Visual Hierarchy & Layout',gestalt:'Gestalt Principles',typography:'Typography',color_contrast:'Color & Contrast (WCAG)',accessibility:'Accessibility',cta:'CTA & Conversion',mobile:'Mobile Readiness'};
  const $ = (id) => document.getElementById(id);
  let token = '', anonymousId = '', reportText = '', capturedImage = '', capturedPageName = '';
  chrome.storage.local.get(['la_token','la_anon'], (v) => {
    token = v.la_token || '';
    anonymousId = v.la_anon || crypto.randomUUID().replaceAll('-','');
    if (!v.la_anon) chrome.storage.local.set({la_anon:anonymousId});
    $('token').value = token;
    refreshUsage(token || 'free_' + anonymousId, !token);
  });
  $('settings-toggle').addEventListener('click', () => $('settings').hidden = !$('settings').hidden);
  $('save-token').addEventListener('click', async () => {
    const value = $('token').value.trim();
    if (!value) return;
    try {
      const res = await fetch(WORKER + '/status', {headers:{'x-ux-token':value}});
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Token could not be verified.');
      token = value; chrome.storage.local.set({la_token:token}); renderUsage(data, false);
      showTokenFeedback('Access verified.', 'success');
    } catch (e) { showTokenFeedback(e.message + (token ? ' Your previously saved token is still active.' : ' Your free trial remains available.'), 'error'); }
  });
  document.querySelectorAll('.chip').forEach((chip) => chip.addEventListener('click', () => chip.classList.toggle('on')));
  $('capture').addEventListener('click', capturePage);
  $('analyze').addEventListener('click', analyze);
  $('copy').addEventListener('click', async () => { await navigator.clipboard.writeText(reportText); $('copy').textContent='Copied'; setTimeout(()=>$('copy').textContent='Copy report',1500); });

  async function capturePage() {
    $('error').hidden = true;
    $('capture').disabled = true;
    try {
      const active = await chrome.tabs.query({active:true,lastFocusedWindow:true});
      try { capturedImage = await chrome.tabs.captureVisibleTab(active[0]?.windowId,{format:'png'}); }
      catch (captureError) { throw new Error('Chrome could not capture this tab. Click the LintAssist toolbar button for this tab, then try again. '+captureError.message); }
      capturedPageName = active[0]?.title || active[0]?.url || 'Current page';
      $('preview-image').src = capturedImage;
      $('capture-preview').hidden = false;
      $('capture').textContent = 'Replace screenshot';
      $('analyze').hidden = false;
      setStep(2);
    } catch (e) { showError(e.message); }
    finally { $('capture').disabled = false; }
  }

  async function analyze() {
    const frameworks = [...document.querySelectorAll('.chip.on')].map((c)=>c.dataset.val);
    if (!frameworks.length) return showError('Select at least one framework.');
    if (!capturedImage) return showError('Capture the visible page first.');
    $('error').hidden = true; $('report').hidden = true; $('loading').hidden = false; $('analyze').disabled = true; $('capture').disabled = true; setStep(3);
    try {
      const image = capturedImage.slice(capturedImage.indexOf(',') + 1);
      const pageName = capturedPageName;
      const system = 'You are a senior UX designer. Return ONLY valid JSON:\n{"score":<0-100>,"executive_summary":"<2-3 sentences>","findings":[{"title":"<title>","severity":"critical|warning|minor|pass","category":"<framework>","description":"<observation>","recommendation":"<fix>"}]}\nEvaluate against:\n' + frameworks.map((f)=>'- '+labels[f]).join('\n') + '\nInclude 8-14 findings.';
      const useToken = token || 'free_' + anonymousId;
      const response = await fetch(WORKER + '/analyze', {method:'POST',headers:{'Content-Type':'application/json','x-ux-token':useToken},body:JSON.stringify({model:'claude-sonnet-5',max_tokens:4000,system,messages:[{role:'user',content:[{type:'image',source:{type:'base64',media_type:'image/png',data:image}},{type:'text',text:'Analyze "'+pageName+'" and return the UX audit JSON.'}]}]})});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Analysis request failed.');
      const raw = (data.content || []).map((b)=>b.text||'').join('').replace(/```json|```/g,'').trim();
      let parsed;
      try { parsed = JSON.parse(raw); } catch { throw new Error('The AI response was incomplete. Please try again.'); }
      render(parsed,pageName);
      setStep(3,true);
      await refreshUsage(useToken, !token);
    } catch (e) { showError(e.message); }
    finally { $('loading').hidden = true; $('analyze').disabled = false; $('capture').disabled = false; }
  }
  function render(data,name) {
    $('score').textContent = Number(data.score)||0; $('page-name').textContent=name; $('summary').textContent=data.executive_summary||'';
    const counts={critical:0,warning:0,minor:0,pass:0};
    const findings=Array.isArray(data.findings)?data.findings:[];
    findings.forEach(f=>{if(counts[f.severity]!==undefined)counts[f.severity]++;});
    Object.keys(counts).forEach(k=>$('count-'+k).textContent=counts[k]);
    const root=$('findings'); root.replaceChildren();
    findings.sort((a,b)=>['critical','warning','minor','pass'].indexOf(a.severity)-['critical','warning','minor','pass'].indexOf(b.severity)).forEach((f)=>{
      const card=document.createElement('article'); card.className='finding '+(counts[f.severity]!==undefined?f.severity:'minor');
      const head=document.createElement('div'); head.className='fhead'; const title=document.createElement('div'); title.className='ftitle'; title.textContent=f.title||'Finding';
      const badge=document.createElement('span'); badge.className='fbadge'; badge.textContent=f.severity||'note'; head.append(title,badge);
      const cat=document.createElement('div'); cat.className='fcat'; cat.textContent=f.category||'';
      const body=document.createElement('div'); body.className='fbody'; const desc=document.createElement('div'); desc.textContent=f.description||''; body.append(desc);
      if(f.recommendation&&f.severity!=='pass'){const rec=document.createElement('div');rec.className='frec';rec.textContent='→ '+f.recommendation;body.append(rec);}
      head.addEventListener('click',()=>body.classList.toggle('open')); if(f.severity==='critical')body.classList.add('open'); card.append(head,cat,body); root.append(card);
    });
    reportText='LINTASSIST — '+name+'\nScore: '+(data.score||0)+'/100\n\n'+(data.executive_summary||'')+'\n\nFindings:\n'+findings.map(f=>'\n• '+(f.title||'')+' ['+(f.category||'')+']\n  '+(f.description||'')+(f.recommendation?'\n  → '+f.recommendation:'')).join('\n');
    $('report').hidden=false;
  }
  function showError(message){$('error').textContent=message;$('error').hidden=false;}
  async function refreshUsage(value, isTrial) {
    try {
      const response = await fetch(WORKER + '/status', {headers:{'x-ux-token':value}});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Usage unavailable');
      renderUsage(data, isTrial);
    } catch (_) {
      $('usage-value').textContent = 'Usage unavailable';
      $('bonus-value').hidden = true;
      $('coffee-link').hidden = true;
    }
  }
  function renderUsage(data, isTrial) {
    const period = data.plan === 'free' ? 'today' : 'this month';
    $('plan-tag').textContent = isTrial ? 'TRY' : 'ACTIVE';
    $('usage-value').textContent = Math.max(0, data.remaining || 0) + ' / ' + (data.limit_this_month || 0) + ' ' + period;
    const bonus = Number(data.extra_credits || 0);
    $('bonus-value').textContent = bonus ? bonus + ' bonus audits included' : '';
    $('bonus-value').hidden = bonus <= 0;
    $('coffee-link').hidden = bonus > 0;
  }
  function showTokenFeedback(message, kind) {
    const feedback = $('token-feedback');
    feedback.textContent = message;
    feedback.className = 'token-feedback ' + kind;
    feedback.hidden = false;
  }
  function setStep(step,complete=false) {
    $('step-label').textContent = complete ? 'Audit complete' : 'Step '+step+' of 3';
    $('progress-fill').style.width = (complete ? 100 : (step-1)*100/3)+'%';
    ['criteria','capture','analyze'].forEach((name,index)=>{
      const item=$('step-'+name);
      item.classList.toggle('active',!complete && index+1===step);
      item.classList.toggle('done',complete || index+1<step);
    });
  }
})();
