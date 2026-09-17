// ============================================================
// LintAssist — Backend Worker (Stripe edition)
// Created by Siva Tayi
//
// DEPLOY: npx wrangler deploy
// SECRETS: wrangler secret put ANTHROPIC_API_KEY
//          wrangler secret put ADMIN_SECRET
//          wrangler secret put STRIPE_WEBHOOK_SECRET
//          wrangler secret put OPENROUTER_API_KEY   (optional — enables cheaper
//                                                     Qwen/DeepSeek vision models
//                                                     with Claude as final fallback)
// ============================================================

// ── VISION MODEL PROVIDER CHAIN ────────────────────────────────
// /analyze tries these in order and falls back to the next on any
// failure (rate limit, outage, bad response). Configurable without a
// redeploy via wrangler vars if you want to swap models later.
const OPENROUTER_MODEL_PRIMARY  = 'qwen/qwen3-vl-32b-instruct';   // ~23x cheaper than Sonnet 5
const OPENROUTER_MODEL_FALLBACK = 'deepseek/deepseek-v4.1-flash'; // ~16x cheaper than Sonnet 5
const ANTHROPIC_MODEL_FALLBACK  = 'claude-sonnet-5';              // final fallback, known-good model id

// $ per token (not per million) — checked against OpenRouter's live model
// catalog and Anthropic's pricing page on 2026-09-13. Used only to compute
// an estimated cost per request for the admin panel; update if pricing
// changes upstream.
const MODEL_PRICING = {
  'qwen/qwen3-vl-32b-instruct':  { in: 0.104 / 1e6, out: 0.416 / 1e6 },
  'deepseek/deepseek-v4.1-flash':{ in: 0.15  / 1e6, out: 0.60  / 1e6 },
  'claude-sonnet-5':             { in: 2.00  / 1e6, out: 10.00 / 1e6 },
};
function estimateCost(model, inputTokens, outputTokens) {
  const p = MODEL_PRICING[model];
  if (!p) return 0;
  return inputTokens * p.in + outputTokens * p.out;
}

// ── FREE-SIGNUP ABUSE GUARDS ────────────────────────────────────
// POST /access can't verify email ownership, so someone (or a bot)
// could hammer it with fake addresses to mint unlimited 2-audit
// grants. These are the defenses, roughly cheapest-to-bypass first:
// disposable-domain blocklist, Gmail alias normalization (so
// name+1@gmail.com and name+2@gmail.com collapse to one signup), a
// per-IP daily cap, and a global daily cap — the last two are admin-
// configurable via the `settings` table / admin panel, no redeploy
// needed to tighten or loosen them.
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.info', '10minutemail.com',
  '10minutemail.net', 'tempmail.com', 'temp-mail.org', 'throwawaymail.com',
  'yopmail.com', 'trashmail.com', 'fakeinbox.com', 'getnada.com', 'sharklasers.com',
  'dispostable.com', 'mintemail.com', 'maildrop.cc', 'mailnesia.com', 'moakt.com',
  'discard.email', 'emailondeck.com', 'tempinbox.com', 'spamgourmet.com',
]);

// Collapses Gmail's dot-insensitivity and +tag convention so
// "j.doe+audit1@gmail.com" and "jdoe+audit2@gmail.com" are recognized
// as the same signer. Only applies to gmail.com/googlemail.com —
// other providers don't have this convention (or handle it
// differently), so leaving them untouched avoids false collisions.
function normalizeEmail(email) {
  const [local, domain] = email.split('@');
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return local.split('+')[0].replace(/\./g, '') + '@gmail.com';
  }
  return email;
}

async function getSetting(env, key, fallback) {
  if (!env.DB) return fallback;
  const row = await env.DB.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first();
  return row ? row.value : fallback;
}

function getDayKey() {
  return new Date().toISOString().slice(0, 10); // 2026-09-14
}

// ── PRICING CONFIG ────────────────────────────────────────────
// Update intro prices here when you move to normal pricing.
// Just change price_usd — everything else is automatic.
// `period` controls which usage bucket a plan resets against: 'day'
// resets every midnight (UTC), 'month' resets on the 1st.
//
// free.audits_per_period is just the code-level default — the actual
// live limit is admin-configurable without a redeploy via the
// `free_plan_daily_limit` setting (see getFreeLimit() below and the
// admin panel's Free Signup Controls card). Deliberately daily (not
// monthly) while paid plans are still "coming soon": generous enough
// to be genuinely useful, resets often enough to bring people back
// and see real usage patterns/collect emails before real subscriptions
// are wired up. Cost per audit is fractions of a cent (see
// MODEL_PRICING), so this costs little either way.
const PLANS = {
  free:    { name: 'Free',    audits_per_period: 5,  period: 'day',   price_usd: 0  },
  starter: { name: 'Starter', audits_per_period: 20, period: 'month', price_usd: 8  }, // intro (was $10)
  pro:     { name: 'Pro',     audits_per_period: 50, period: 'month', price_usd: 16 }, // intro (was $20)
};

async function getFreeLimit(env) {
  const v = await getSetting(env, 'free_plan_daily_limit', String(PLANS.free.audits_per_period));
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : PLANS.free.audits_per_period;
}

// Top-up pack — subscribers only, always more expensive per audit than any plan
const TOPUP = {
  audits:    10,
  price_usd: 5,
  // $0.50/audit > Starter $0.40 > Pro $0.32 — incentive to stay subscribed
};

// Map Stripe price IDs → plan keys (fill after creating products in Stripe)
const STRIPE_PRICE_MAP = {
  'price_STARTER_ID': 'starter',  // replace with real Stripe price ID
  'price_PRO_ID':     'pro',      // replace with real Stripe price ID
  'price_TOPUP_ID':   'topup',    // one-time top-up price
};

// ── CORS ──────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-ux-token, x-admin-secret, stripe-signature',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}
function err(msg, status = 400) { return json({ error: msg }, status); }

// ── Vision model call, with provider fallback ──────────────────
// The client always sends an Anthropic-shaped body ({model, max_tokens,
// system, messages: [{role:'user', content:[image, text]}]}) — that
// contract stays the same for every caller (web app, Figma plugin).
// This function tries OpenRouter (Qwen, then DeepSeek) first since
// they're far cheaper, and falls back to Anthropic directly if both
// fail or no OpenRouter key is configured. It always resolves to the
// same Anthropic-shaped response ({content:[{type:'text',text}]}) so
// callers don't need to know which provider actually served it.
async function callVisionModel(env, body, token) {
  const userContent = (body.messages && body.messages[0] && body.messages[0].content) || [];
  const imageBlock = userContent.find(c => c.type === 'image');
  const textBlock  = userContent.find(c => c.type === 'text');
  if (!imageBlock || !imageBlock.source) {
    return { ok: false, error: 'Missing image in request' };
  }

  const openaiMessages = [
    { role: 'system', content: body.system || '' },
    { role: 'user', content: [
        { type: 'image_url', image_url: { url: `data:${imageBlock.source.media_type};base64,${imageBlock.source.data}` } },
        { type: 'text', text: (textBlock && textBlock.text) || 'Analyze this screen and return the UX audit JSON.' },
      ] },
  ];
  const maxTokens = body.max_tokens || 4000;

  // 'engine' is a one-letter tag surfaced back to the client (Q/D/C) so
  // the UI can show which provider actually served each request.
  const attempts = [];
  if (env.OPENROUTER_API_KEY) {
    attempts.push({ engine: 'Q', model: OPENROUTER_MODEL_PRIMARY,  call: () => callOpenRouter(env, OPENROUTER_MODEL_PRIMARY, openaiMessages, maxTokens) });
    attempts.push({ engine: 'D', model: OPENROUTER_MODEL_FALLBACK, call: () => callOpenRouter(env, OPENROUTER_MODEL_FALLBACK, openaiMessages, maxTokens) });
  }
  if (env.ANTHROPIC_API_KEY) {
    attempts.push({ engine: 'C', model: ANTHROPIC_MODEL_FALLBACK, call: () => callAnthropic(env, body) });
  }
  if (!attempts.length) return { ok: false, error: 'No AI provider configured' };

  let lastError = 'Unknown error';
  for (const attempt of attempts) {
    try {
      const result = await attempt.call();
      if (result.ok) {
        const usage = result.usage || {};
        const cost = estimateCost(attempt.model, usage.input_tokens || 0, usage.output_tokens || 0);
        // Fire-and-forget — never let logging failure break the actual
        // response the user is waiting on.
        logRequest(env, token, attempt.engine, attempt.model, usage, cost)
          .catch(e => console.error('[request_log] insert failed: ' + e.message));
        return { ok: true, body: injectEngineTag(result.body, attempt.engine) };
      }
      lastError = result.error || 'Provider request failed';
      console.error('[vision] ' + attempt.model + ' failed: ' + lastError);
    } catch (e) {
      lastError = e.message;
      console.error('[vision] ' + attempt.model + ' threw: ' + lastError);
    }
  }
  return { ok: false, error: 'All AI providers failed: ' + lastError };
}

async function logRequest(env, token, engine, model, usage, cost) {
  if (!env.DB) return;
  await env.DB.prepare(`
    INSERT INTO request_log (token, engine, model, input_tokens, output_tokens, cost_usd, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(token, engine, model, usage.input_tokens || 0, usage.output_tokens || 0, cost).run();
}

// Stamps which engine served the request onto the response JSON, without
// disturbing the Anthropic-shaped `content` array the frontend parses.
function injectEngineTag(bodyText, engine) {
  try {
    const parsed = JSON.parse(bodyText);
    parsed._engine = engine;
    return JSON.stringify(parsed);
  } catch {
    return bodyText;
  }
}

async function callOpenRouter(env, model, messages, maxTokens) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': 'Bearer ' + env.OPENROUTER_API_KEY,
      'HTTP-Referer':  'https://lintassist.com',
      'X-Title':       'LintAssist',
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, messages }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) {
    return { ok: false, error: (data && data.error && (data.error.message || data.error)) || ('OpenRouter ' + model + ' returned ' + res.status) };
  }
  const text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!text) return { ok: false, error: 'OpenRouter ' + model + ' returned no content' };
  const u = data.usage || {};
  // Normalize to the Anthropic response shape the frontend already parses.
  return {
    ok: true,
    body: JSON.stringify({ content: [{ type: 'text', text }] }),
    usage: { input_tokens: u.prompt_tokens || 0, output_tokens: u.completion_tokens || 0 },
  };
}

async function callAnthropic(env, body) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    // Force a known-good model id — the client's `model` field may be
    // stale (old cached page, old Figma plugin build) and OpenRouter
    // model ids obviously aren't valid Anthropic model ids.
    body: JSON.stringify({ ...body, model: ANTHROPIC_MODEL_FALLBACK }),
  });
  const text = await res.text();
  if (!res.ok) {
    const data = JSON.parse(text || '{}');
    return { ok: false, error: (data.error && data.error.message) || 'Anthropic returned ' + res.status };
  }
  const data = JSON.parse(text);
  const u = data.usage || {};
  return {
    ok: true,
    body: text,
    usage: { input_tokens: u.input_tokens || 0, output_tokens: u.output_tokens || 0 },
  };
}

// ── MAIN ──────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }
    try {
      return await route(request, env);
    } catch (e) {
      console.error('Worker crash:', e.message, e.stack);
      return err('Internal server error: ' + e.message, 500);
    }
  }
};

async function route(request, env) {
  const url    = new URL(request.url);
  const path   = url.pathname;
  const method = request.method;

  // ── GET /health ───────────────────────────────────────────
  if (method === 'GET' && path === '/health') {
    if (!env.DB) return err('D1 not bound. Check wrangler.toml', 500);
    await env.DB.prepare('SELECT 1').run();
    return json({ ok: true, message: 'Worker and D1 are healthy' });
  }

  // ── GET /plans — public pricing info ─────────────────────
  if (method === 'GET' && path === '/plans') {
    return json({ plans: PLANS, topup: TOPUP });
  }

  // ── GET /image-proxy?url=... — fetch remote images server-side ──
  if (method === 'GET' && path === '/image-proxy') {
    const target = url.searchParams.get('url');
    if (!target) return err('Missing url', 400);

    let remote;
    try {
      remote = new URL(target);
    } catch {
      return err('Invalid url', 400);
    }
    if (remote.protocol !== 'http:' && remote.protocol !== 'https:') {
      return err('Only http/https URLs are allowed', 400);
    }

    const upstream = await fetch(remote.toString(), {
      headers: { 'User-Agent': 'LintAssistImageProxy/1.0' },
    });
    if (!upstream.ok) return err('Could not fetch image URL', 400);

    const contentType = upstream.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      return err('URL did not return an image', 400);
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        ...CORS,
      },
    });
  }

  // ── GET /status — token check + usage ────────────────────
  if (method === 'GET' && path === '/status') {
    const token = request.headers.get('x-ux-token');
    if (!token) return err('No token', 401);
    if (!env.DB) return err('Database not configured', 500);

    const sub = await getSubscriber(env, token);
    if (!sub) return err('Invalid token', 403);

    const plan       = PLANS[sub.plan] || PLANS.free;
    const periodKey  = getPeriodKey(plan);
    const used       = await getUsage(env, token, periodKey);
    const baseLimit  = sub.plan === 'free' ? await getFreeLimit(env) : plan.audits_per_period;
    const limit      = baseLimit + (sub.extra_credits || 0);
    const isSubscriber = sub.plan !== 'free';

    return json({
      ok:              true,
      email:           sub.email,
      plan:            sub.plan,
      plan_name:       plan.name,
      used_this_month: used,
      limit_this_month:limit,
      remaining:       Math.max(0, limit - used),
      extra_credits:   sub.extra_credits || 0,
      is_subscriber:   isSubscriber,   // UI uses this to show/hide top-up
      topup_available: isSubscriber,   // explicit flag for clarity
    });
  }

  // ── POST /access — self-serve free-tier signup (no email verification) ──
  //
  // Interim path until real Stripe checkout is wired up. Anyone can call
  // this with an email — there's no way to verify ownership, which is
  // exactly why it only ever grants the `free` plan (2 audits/month,
  // same limit as the anonymous trial). Idempotent: calling again with an
  // email that already has a token just hands that same token back
  // ("enter your email to get your access back" on another device),
  // it never re-grants a fresh 2 audits.
  if (method === 'POST' && path === '/access') {
    if (!env.DB) return err('Database not configured', 500);
    let body;
    try { body = await request.json(); }
    catch { return err('Invalid JSON'); }

    let email = (body.email || '').trim().toLowerCase();
    const firstName = (body.first_name || '').trim();
    const lastName  = (body.last_name || '').trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return err('A valid email is required');
    }
    email = normalizeEmail(email);

    const domain = email.split('@')[1];
    if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
      return err('Please use a real email address — disposable/temporary email domains are not accepted', 400);
    }

    // Idempotent lookup first: a returning user is never rate-limited or
    // capped, since they're not consuming a fresh grant.
    const existing = await env.DB.prepare('SELECT token, plan FROM subscribers WHERE email = ?').bind(email).first();
    if (existing) {
      return json({ ok: true, token: existing.token, plan: existing.plan, is_new: false });
    }

    // ── New-signup guards (admin-configurable via settings table) ──
    const enabled = await getSetting(env, 'free_signup_enabled', 'true');
    if (enabled !== 'true') {
      return err('Free signups are temporarily paused — please check back later or contact us for access', 403);
    }

    const dayKey = getDayKey();
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const ipCap = parseInt(await getSetting(env, 'free_signup_ip_daily_cap', '2'), 10);
    if (ipCap > 0) {
      const ipRow = await env.DB.prepare('SELECT count FROM signup_ip_log WHERE ip = ? AND day_key = ?').bind(ip, dayKey).first();
      if (ipRow && ipRow.count >= ipCap) {
        return err('Too many signups from this network today — please try again tomorrow', 429);
      }
    }

    const dailyCap = parseInt(await getSetting(env, 'free_signup_daily_cap', '20'), 10);
    if (dailyCap > 0) {
      const totalToday = await env.DB.prepare(
        `SELECT COUNT(*) as n FROM subscribers WHERE plan = 'free' AND date(created_at) = ?`
      ).bind(dayKey).first();
      if (totalToday && totalToday.n >= dailyCap) {
        return err('Free signups have hit today\'s limit — please check back tomorrow or subscribe for guaranteed access', 429);
      }
    }

    const token = 'tok_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    await env.DB.prepare(`
      INSERT INTO subscribers (token, email, first_name, last_name, plan, extra_credits, active, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'free', 0, 1, datetime('now'), datetime('now'))
    `).bind(token, email, firstName, lastName).run();

    await env.DB.prepare(`
      INSERT INTO signup_ip_log (ip, day_key, count) VALUES (?, ?, 1)
      ON CONFLICT(ip, day_key) DO UPDATE SET count = count + 1
    `).bind(ip, dayKey).run();

    return json({ ok: true, token, plan: 'free', is_new: true });
  }

  // ── POST /analyze ─────────────────────────────────────────
  if (method === 'POST' && path === '/analyze') {
    const token = request.headers.get('x-ux-token');
    if (!token) return err('No token provided', 401);
    if (!env.DB) return err('Database not configured', 500);

    const sub = await getSubscriber(env, token);
    if (!sub) return err('Invalid token', 403);

    const plan      = PLANS[sub.plan] || PLANS.free;
    const periodKey = getPeriodKey(plan);
    const used      = await getUsage(env, token, periodKey);
    const baseLimit = sub.plan === 'free' ? await getFreeLimit(env) : plan.audits_per_period;
    const limit     = baseLimit + (sub.extra_credits || 0);

    if (used >= limit) {
      const periodLabel = plan.period === 'day' ? 'Daily' : 'Monthly';
      return err(
        `${periodLabel} limit reached (${limit} audits on ${plan.name} plan). Top up or upgrade.`,
        429
      );
    }

    let body;
    try { body = await request.json(); }
    catch { return err('Invalid request body'); }

    const result = await callVisionModel(env, body, token);
    if (!result.ok) return err(result.error, 502);

    await incrementUsage(env, token, periodKey);

    return new Response(result.body, {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  // ── ADMIN AUTH helper ─────────────────────────────────────
  function requireAdmin() {
    const s = request.headers.get('x-admin-secret');
    if (!env.ADMIN_SECRET || s !== env.ADMIN_SECRET) return err('Unauthorized', 401);
    return null;
  }

  // ── ADMIN: GET /admin/subscribers ────────────────────────
  if (method === 'GET' && path === '/admin/subscribers') {
    const denied = requireAdmin(); if (denied) return denied;
    const { results } = await env.DB.prepare(`
      SELECT s.*,
        COALESCE(u.cnt, 0) as used_this_month
      FROM subscribers s
      LEFT JOIN (
        SELECT token, SUM(count) as cnt
        FROM usage WHERE month_key = ?
        GROUP BY token
      ) u ON s.token = u.token
      ORDER BY s.created_at DESC
    `).bind(getMonthKey()).all();
    return json({ ok: true, subscribers: results, total: results.length });
  }

  // ── ADMIN: POST /admin/subscribers ───────────────────────
  if (method === 'POST' && path === '/admin/subscribers') {
    const denied = requireAdmin(); if (denied) return denied;
    let body;
    try { body = await request.json(); }
    catch { return err('Invalid JSON'); }

    const { token, plan, email, extra_credits = 0, first_name = '', last_name = '' } = body;
    if (!token || !plan || !email) return err('token, plan, email required');
    if (!PLANS[plan]) return err('Unknown plan: ' + plan);

    await env.DB.prepare(`
      INSERT INTO subscribers (token, email, plan, extra_credits, active, first_name, last_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, 1, ?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(token) DO UPDATE SET
        plan=excluded.plan, email=excluded.email,
        extra_credits=excluded.extra_credits,
        first_name=excluded.first_name, last_name=excluded.last_name,
        updated_at=datetime('now')
    `).bind(token, email, plan, extra_credits, first_name, last_name).run();

    return json({ ok: true, message: `Subscriber ${email} saved on ${plan} plan`, token });
  }

  // ── ADMIN: DELETE /admin/subscribers/:token ──────────────
  if (method === 'DELETE' && path.startsWith('/admin/subscribers/')) {
    const denied = requireAdmin(); if (denied) return denied;
    const t = decodeURIComponent(path.split('/').pop());
    await env.DB.prepare('DELETE FROM subscribers WHERE token = ?').bind(t).run();
    return json({ ok: true });
  }

  // ── ADMIN: POST /admin/add-credits ───────────────────────
  if (method === 'POST' && path === '/admin/add-credits') {
    const denied = requireAdmin(); if (denied) return denied;
    let body;
    try { body = await request.json(); }
    catch { return err('Invalid JSON'); }

    const { token, credits } = body;
    if (!token || !credits) return err('token and credits required');

    const result = await env.DB.prepare(`
      UPDATE subscribers SET extra_credits = extra_credits + ?, updated_at = datetime('now')
      WHERE token = ?
    `).bind(credits, token).run();

    if (result.changes === 0) return err('Token not found', 404);
    return json({ ok: true, message: `Added ${credits} credits to ${token}` });
  }

  // ── ADMIN: GET /admin/settings — free-signup abuse controls ──
  if (method === 'GET' && path === '/admin/settings') {
    const denied = requireAdmin(); if (denied) return denied;
    const { results } = await env.DB.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    results.forEach(r => { settings[r.key] = r.value; });

    const dayKey = getDayKey();
    const todaySignups = await env.DB.prepare(
      `SELECT COUNT(*) as n FROM subscribers WHERE plan = 'free' AND date(created_at) = ?`
    ).bind(dayKey).first();

    return json({ ok: true, settings, today_free_signups: (todaySignups && todaySignups.n) || 0 });
  }

  // ── ADMIN: POST /admin/settings — update one or more settings ──
  if (method === 'POST' && path === '/admin/settings') {
    const denied = requireAdmin(); if (denied) return denied;
    let body;
    try { body = await request.json(); }
    catch { return err('Invalid JSON'); }

    const allowedKeys = ['free_signup_enabled', 'free_signup_daily_cap', 'free_signup_ip_daily_cap', 'free_plan_daily_limit'];
    const writes = Object.entries(body).filter(([k]) => allowedKeys.includes(k));
    if (!writes.length) return err('No recognized settings in request body');

    for (const [key, value] of writes) {
      await env.DB.prepare(`
        INSERT INTO settings (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `).bind(key, String(value)).run();
    }
    return json({ ok: true, updated: writes.map(([k]) => k) });
  }

  // ── ADMIN: GET /admin/stats — cost & usage per token ─────
  // One row per token that has ever made a request (paying subscribers
  // AND anonymous free_ tokens — free trials cost real money too), with
  // request count, estimated total cost, and a per-engine breakdown so
  // you can see how much Qwen/DeepSeek/Claude usage each user cost.
  if (method === 'GET' && path === '/admin/stats') {
    const denied = requireAdmin(); if (denied) return denied;
    const { results } = await env.DB.prepare(`
      SELECT
        r.token,
        s.email,
        s.plan,
        COUNT(*)                                          as requests,
        SUM(r.cost_usd)                                    as total_cost,
        SUM(CASE WHEN r.engine = 'Q' THEN 1 ELSE 0 END)    as qwen_count,
        SUM(CASE WHEN r.engine = 'D' THEN 1 ELSE 0 END)    as deepseek_count,
        SUM(CASE WHEN r.engine = 'C' THEN 1 ELSE 0 END)    as claude_count,
        MIN(r.created_at)                                  as first_request,
        MAX(r.created_at)                                  as last_request
      FROM request_log r
      LEFT JOIN subscribers s ON r.token = s.token
      GROUP BY r.token
      ORDER BY total_cost DESC
      LIMIT 500
    `).all();
    return json({ ok: true, users: results, total: results.length });
  }

  // ── ADMIN: GET /admin/requests — recent raw log, one token ─
  if (method === 'GET' && path === '/admin/requests') {
    const denied = requireAdmin(); if (denied) return denied;
    const t = url.searchParams.get('token');
    if (!t) return err('token query param required');
    const { results } = await env.DB.prepare(`
      SELECT engine, model, input_tokens, output_tokens, cost_usd, created_at
      FROM request_log WHERE token = ? ORDER BY created_at DESC LIMIT 100
    `).bind(t).all();
    return json({ ok: true, requests: results });
  }

  // ── POST /webhook/stripe ──────────────────────────────────
  //
  // Events handled:
  //   checkout.session.completed  → new subscriber OR top-up
  //   customer.subscription.deleted → downgrade to free
  //
  if (method === 'POST' && path === '/webhook/stripe') {
    if (!env.DB) return json({ ok: true, skipped: 'no db' });

    // Read raw body for signature verification
    const rawBody = await request.text();
    let event;

    // Verify Stripe signature if secret is set (skip in dev if not set)
    if (env.STRIPE_WEBHOOK_SECRET) {
      const sig = request.headers.get('stripe-signature');
      if (!sig) return err('Missing stripe-signature', 400);
      try {
        event = await verifyStripeSignature(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
      } catch (e) {
        return err('Webhook signature invalid: ' + e.message, 400);
      }
    } else {
      try { event = JSON.parse(rawBody); }
      catch { return err('Invalid JSON', 400); }
    }

    const type = event.type;
    const obj  = event.data?.object || {};

    // ── Subscription created / completed checkout ──
    if (type === 'checkout.session.completed') {
      const email    = obj.customer_email || obj.customer_details?.email;
      const priceId  = obj.line_items?.data?.[0]?.price?.id
                    || obj.metadata?.price_id;
      const planKey  = STRIPE_PRICE_MAP[priceId];
      // client_reference_id is the existing token if user sent it
      const existingToken = obj.client_reference_id || null;

      if (!email) return json({ ok: true, skipped: 'no email' });

      if (planKey === 'topup') {
        // ── Top-up purchase — add 10 credits to existing subscriber ──
        if (existingToken) {
          await env.DB.prepare(`
            UPDATE subscribers
            SET extra_credits = extra_credits + ?, updated_at = datetime('now')
            WHERE token = ?
          `).bind(TOPUP.audits, existingToken).run();
        } else {
          // fallback: find by email
          await env.DB.prepare(`
            UPDATE subscribers
            SET extra_credits = extra_credits + ?, updated_at = datetime('now')
            WHERE email = ?
          `).bind(TOPUP.audits, email).run();
        }
        return json({ ok: true, action: 'topup_added' });
      }

      if (planKey && planKey !== 'topup') {
        // ── New subscription ──
        const stripeSubId = obj.subscription || String(obj.id);
        // Reuse existing token if subscriber is upgrading, otherwise new
        const token = existingToken || 'tok_' + stripeSubId.slice(-12);

        await env.DB.prepare(`
          INSERT INTO subscribers (token, email, plan, extra_credits, active, stripe_subscription_id, created_at, updated_at)
          VALUES (?, ?, ?, 0, 1, ?, datetime('now'), datetime('now'))
          ON CONFLICT(email) DO UPDATE SET
            plan=excluded.plan,
            token=CASE WHEN excluded.token != '' THEN excluded.token ELSE token END,
            stripe_subscription_id=excluded.stripe_subscription_id,
            updated_at=datetime('now')
        `).bind(token, email, planKey, stripeSubId).run();

        return json({ ok: true, action: 'subscriber_created', token, plan: planKey });
      }
    }

    // ── Subscription cancelled ──
    if (type === 'customer.subscription.deleted') {
      const subId = obj.id;
      await env.DB.prepare(`
        UPDATE subscribers SET plan = 'free', updated_at = datetime('now')
        WHERE stripe_subscription_id = ?
      `).bind(subId).run();
      return json({ ok: true, action: 'downgraded_to_free' });
    }

    // Unhandled event — still return 200 so Stripe doesn't retry
    return json({ ok: true, skipped: type });
  }

  return err('Not found', 404);
}

// ── D1 helpers ────────────────────────────────────────────────
async function getSubscriber(env, token) {
  const row = await env.DB.prepare(
    'SELECT * FROM subscribers WHERE token = ? AND active = 1'
  ).bind(token).first();
  if (row) return row;

  // Anonymous free_ tokens — 2 audits, no DB entry needed
  if (token.startsWith('free_') && token.length >= 10) {
    return { token, email: 'anon', plan: 'free', extra_credits: 0, active: 1 };
  }
  return null;
}

async function getUsage(env, token, monthKey) {
  const row = await env.DB.prepare(
    'SELECT count FROM usage WHERE token = ? AND month_key = ?'
  ).bind(token, monthKey).first();
  return row?.count || 0;
}

async function incrementUsage(env, token, monthKey) {
  await env.DB.prepare(`
    INSERT INTO usage (token, month_key, count) VALUES (?, ?, 1)
    ON CONFLICT(token, month_key) DO UPDATE SET count = count + 1
  `).bind(token, monthKey).run();
}

function getMonthKey() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

// Resolves the right usage-bucket key for a plan: daily for `free`,
// monthly for paid plans. Reuses the same `usage` table/column either
// way — it's just an opaque period key to that table.
function getPeriodKey(plan) {
  return plan.period === 'day' ? getDayKey() : getMonthKey();
}

// ── Stripe webhook signature verification ────────────────────
// Cloudflare Workers has no crypto.subtle.timingSafeEqual, use manual HMAC
async function verifyStripeSignature(payload, sigHeader, secret) {
  const parts    = sigHeader.split(',');
  const tPart    = parts.find(p => p.startsWith('t='));
  const v1Part   = parts.find(p => p.startsWith('v1='));
  if (!tPart || !v1Part) throw new Error('Malformed signature header');

  const timestamp = tPart.slice(2);
  const expected  = v1Part.slice(3);
  const signed    = `${timestamp}.${payload}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signed));
  const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');

  if (hex !== expected) throw new Error('Signature mismatch');

  // Reject if timestamp is >5 min old (replay protection)
  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp);
  if (age > 300) throw new Error('Webhook timestamp too old');

  return JSON.parse(payload);
}
