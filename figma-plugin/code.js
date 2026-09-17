// code.js — Figma Plugin Sandbox
// Storage goes through figma.clientStorage (async key-value, persists across sessions)
// Network calls happen in ui.html (fetch works there, not here)

figma.showUI(__html__, { width: 520, height: 760, title: 'LintAssist' });

// ── On load: send saved values to UI ─────────────────────────
async function init() {
  const token    = await figma.clientStorage.getAsync('la_token')    || '';
  const freeUsed = await figma.clientStorage.getAsync('la_free_used') || 0;
  const anonId   = await figma.clientStorage.getAsync('la_anon')     || randomId();

  await figma.clientStorage.setAsync('la_anon', anonId);

  figma.ui.postMessage({ type: 'init', token, freeUsed, anonId });

  // Also send current selection if anything is already selected
  const sel = figma.currentPage.selection;
  if (sel.length === 1) {
    const n = sel[0];
    figma.ui.postMessage({
      type: 'selection-changed',
      name: n.name, nodeType: n.type,
      width: Math.round('width' in n ? n.width : 0),
      height: Math.round('height' in n ? n.height : 0)
    });
  }
}
init();

// ── Selection changes ─────────────────────────────────────────
figma.on('selectionchange', () => {
  const sel = figma.currentPage.selection;
  if (sel.length === 1) {
    const n = sel[0];
    figma.ui.postMessage({
      type: 'selection-changed',
      name: n.name, nodeType: n.type,
      width: Math.round('width' in n ? n.width : 0),
      height: Math.round('height' in n ? n.height : 0)
    });
  } else {
    figma.ui.postMessage({ type: 'selection-changed', name: null });
  }
});

// ── Messages from UI ──────────────────────────────────────────
figma.ui.onmessage = async (msg) => {

  // ── Persist token ──
  if (msg.type === 'save-token') {
    await figma.clientStorage.setAsync('la_token', msg.token || '');
    figma.ui.postMessage({ type: 'token-saved' });
  }

  // ── Persist free usage count ──
  if (msg.type === 'save-free-used') {
    await figma.clientStorage.setAsync('la_free_used', msg.count);
  }

  // ── Export selected frame → send bytes to UI for analysis ──
  if (msg.type === 'export-selection') {
    const selection = figma.currentPage.selection;
    if (selection.length === 0) {
      figma.ui.postMessage({ type: 'error', message: 'No frame selected. Click a frame first.' });
      return;
    }
    if (selection.length > 1) {
      figma.ui.postMessage({ type: 'error', message: 'Select only one frame.' });
      return;
    }

    const node = selection[0];
    try {
      const bytes = await node.exportAsync({
        format: 'PNG',
        constraint: { type: 'WIDTH', value: 600 }
      });
      // Send raw bytes to UI — btoa / fetch both work in the iframe
      figma.ui.postMessage({
        type: 'encode-and-send',
        imageData: bytes,
        name: node.name,
        width: Math.round(node.width),
        height: Math.round(node.height)
      });
    } catch (err) {
      figma.ui.postMessage({ type: 'error', message: 'Export failed: ' + err.message });
    }
  }

  // ── Notify toast ──
  if (msg.type === 'notify') {
    figma.notify(msg.message);
  }

  if (msg.type === 'open-external' && msg.url) {
    figma.openExternal(String(msg.url));
  }

  // ── Place report beside frame ──
  if (msg.type === 'paste-to-figma') {
    try {
      await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
      await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
      await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
    } catch(e) {
      try { await figma.loadFontAsync({ family: 'Roboto', style: 'Regular' }); } catch(e2) {}
    }

    try {
      const { score, name, summary, findings } = msg;
      const sel = figma.currentPage.selection;
      const refNode = sel.length > 0 ? sel[0] : null;

      const BG      = { r:0.96, g:0.98, b:1.00 };
      const SURFACE = { r:1,    g:1,    b:1    };
      const BORDER  = { r:0.82, g:0.89, b:0.97 };
      const TEXT    = { r:0.09, g:0.13, b:0.18 };
      const MUTED   = { r:0.40, g:0.50, b:0.60 };
      const C_CRIT  = { r:0.96, g:0.38, b:0.43 };
      const C_WARN  = { r:0.96, g:0.67, b:0.24 };
      const C_MINOR = { r:0.34, g:0.72, b:0.98 };
      const C_PASS  = { r:0.23, g:0.74, b:0.52 };
      const scoreColor = score >= 75 ? C_PASS : score >= 50 ? C_WARN : C_CRIT;

      function solid(c, a) { return [{ type:'SOLID', color:c, opacity:a||1 }]; }

      function makeText(t, size, weight, color, w) {
        const n = figma.createText();
        try { n.fontName = { family:'Inter', style:weight||'Regular' }; } catch(e) {}
        n.characters = String(t || '');
        n.fontSize = size;
        n.fills = solid(color || TEXT);
        if (w) { n.textAutoResize = 'HEIGHT'; n.resize(w, 20); }
        return n;
      }
      function makeFrame(w, h, bg, radius, nm) {
        const f = figma.createFrame();
        f.resize(w, h); f.fills = solid(bg||SURFACE);
        if (radius) f.cornerRadius = radius;
        if (nm) f.name = nm;
        return f;
      }

      const CARD_W = 440, PAD = 20, INNER = 440 - 40;

      const scoreCard = makeFrame(CARD_W, 110, SURFACE, 10, 'Score');
      scoreCard.strokeWeight = 1; scoreCard.strokes = solid(BORDER);
      const sn = makeText(String(score), 40, 'Bold', scoreColor);
      sn.x = PAD; sn.y = PAD - 2;
      const sl = makeText('UX SCORE / 100', 9, 'Medium', MUTED, 104);
      sl.letterSpacing = {value:0.8,unit:'PIXELS'}; sl.x = PAD; sl.y = 64;
      const nt = makeText(name, 12, 'Medium', TEXT, INNER - 96);
      nt.x = PAD + 96; nt.y = PAD + 1;
      const st = makeText(summary||'', 11, 'Regular', MUTED, INNER - 96);
      st.x = PAD + 96; st.y = PAD + 22;
      scoreCard.appendChild(sn); scoreCard.appendChild(sl);
      scoreCard.appendChild(nt); scoreCard.appendChild(st);
      scoreCard.resize(CARD_W, Math.max(118, st.y + st.height + PAD));

      const cnts = {critical:0,warning:0,minor:0,pass:0};
      (findings||[]).forEach(function(f){ if(cnts[f.severity]!==undefined)cnts[f.severity]++; });
      const statsFrame = makeFrame(CARD_W, 60, SURFACE, 10, 'Stats');
      statsFrame.strokeWeight=1; statsFrame.strokes=solid(BORDER);
      [['critical','Critical',C_CRIT],['warning','Warning',C_WARN],['minor','Minor',C_MINOR],['pass','Passed',C_PASS]].forEach(function(item,i){
        const cellW = CARD_W/4;
        const num = makeText(String(cnts[item[0]]),18,'Bold',item[2]);
        num.x = i*cellW+(cellW-num.width)/2; num.y=10;
        const lbl = makeText(item[1],8,'Medium',MUTED);
        lbl.x = i*cellW+(cellW-lbl.width)/2; lbl.y=34;
        statsFrame.appendChild(num); statsFrame.appendChild(lbl);
      });

      const reportFrame = figma.createFrame();
      reportFrame.name = '📊 Audit — ' + name;
      reportFrame.fills = solid(BG);
      reportFrame.cornerRadius = 14;

      scoreCard.x = PAD; scoreCard.y = PAD;
      reportFrame.appendChild(scoreCard);
      statsFrame.x = PAD; statsFrame.y = scoreCard.y + scoreCard.height + 10;
      reportFrame.appendChild(statsFrame);

      let yPos = statsFrame.y + statsFrame.height + 14;
      const disclaimer = makeText('Note: This is generated with AI and AI can make mistakes - use Visual Design and ADA compliance expertise to validate and take this as a starting point.', 9, 'Regular', MUTED, INNER);
      disclaimer.x = PAD; disclaimer.y = yPos; yPos += disclaimer.height + 14;
      reportFrame.appendChild(disclaimer);

      const secLbl = makeText('FINDINGS', 8, 'Bold', MUTED);
      secLbl.letterSpacing = {value:1.5,unit:'PIXELS'};
      secLbl.x = PAD; secLbl.y = yPos; yPos += 22;
      reportFrame.appendChild(secLbl);

      const order = ['critical','warning','minor','pass'];
      const sorted = (findings||[]).slice().sort(function(a,b){ return order.indexOf(a.severity)-order.indexOf(b.severity); });

      sorted.forEach(function(f) {
        const sevColor = f.severity==='critical'?C_CRIT:f.severity==='warning'?C_WARN:f.severity==='minor'?C_MINOR:C_PASS;
        const card = makeFrame(CARD_W, 120, SURFACE, 8, f.title||'');
        card.strokeWeight=1; card.strokes=solid(BORDER);
        const bar = figma.createRectangle();
        bar.resize(4,120); bar.fills=solid(sevColor); bar.x=0; bar.y=0;
        card.appendChild(bar);
        const title = makeText(f.title||'',11,'Medium',TEXT,INNER-90);
        title.x=PAD; title.y=10;
        const badge = makeText(f.severity.toUpperCase(),8,'Medium',sevColor);
        badge.x=CARD_W-badge.width-PAD; badge.y=12;
        const cat = makeText((f.category||'').toUpperCase(),8,'Regular',MUTED,INNER);
        cat.letterSpacing={value:0.5,unit:'PIXELS'}; cat.x=PAD; cat.y=28;
        card.appendChild(title); card.appendChild(badge); card.appendChild(cat);
        let yy=46;
        if(f.description){
          const desc=makeText(f.description,10,'Regular',MUTED,INNER);
          desc.x=PAD; desc.y=yy; card.appendChild(desc); yy+=Math.max(desc.height, 48)+6;
        }
        if(f.recommendation&&f.severity!=='pass'){
          const rec=makeText('→ '+f.recommendation,10,'Regular',C_PASS,INNER);
          rec.x=PAD; rec.y=yy; card.appendChild(rec); yy+=rec.height+6;
        }
        card.resize(CARD_W, yy+PAD);
        bar.resize(4, yy+PAD);
        card.x=PAD; card.y=yPos; yPos+=card.height+8;
        reportFrame.appendChild(card);
      });

      reportFrame.resize(CARD_W+PAD*2, yPos+PAD);

      if (refNode && 'x' in refNode) {
        reportFrame.x = refNode.x + refNode.width + 40;
        reportFrame.y = refNode.y;
      } else {
        reportFrame.x = figma.viewport.center.x;
        reportFrame.y = figma.viewport.center.y;
      }

      figma.currentPage.appendChild(reportFrame);
      figma.currentPage.selection = [reportFrame];
      figma.viewport.scrollAndZoomIntoView([reportFrame]);
      figma.ui.postMessage({ type: 'paste-complete' });
      figma.notify('📊 Report placed!');
    } catch (e) {
      figma.ui.postMessage({ type: 'paste-error', message: e.message || 'Could not place report' });
      figma.notify('Report placement failed');
    }
  }

  if (msg.type === 'close') figma.closePlugin();
};

function randomId() {
  return Math.random().toString(36).slice(2, 12);
}
