// ============================================================
// api.js — Raw HTTP calls to Gemini and Groq APIs.
// Includes rate-limit tracking, token usage accounting, and
// a separate grading route that uses a lighter Groq model.
// ============================================================

let LAST_PROVIDER = 'Gemini';

// ── Rate limit storage ────────────────────────────────────────────────────────
// Persisted in localStorage under this key (separate from STATE).
// Groq resets at midnight UTC; Gemini resets at midnight PT (UTC-8 for safety).

const RATE_LIMIT_KEY = 'mcl_rl_v1';

// Hard limits per provider (per 24 h window)
const RL_GROQ   = { calls: 300, tokens: 120000, warnCalls: 290, warnTokens: 110000 };
const RL_GEMINI = { calls: 1500, tokens: 1500000, warnCalls: 1400, warnTokens: 1400000 }; // effectively uncapped for free tier

function _nextMidnightUTC() {
  const n = new Date();
  return Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() + 1);
}

function _nextMidnightPT() {
  // PT = UTC-8 (use conservative PST offset so we never miss a reset)
  const PT_OFFSET_MS = 8 * 3600 * 1000;
  const nowPT = new Date(Date.now() - PT_OFFSET_MS);
  return Date.UTC(nowPT.getUTCFullYear(), nowPT.getUTCMonth(), nowPT.getUTCDate() + 1) + PT_OFFSET_MS;
}

function _defaultRL() {
  return {
    groq:   { calls: 0, tokens: 0, resetAt: _nextMidnightUTC() },
    gemini: { calls: 0, tokens: 0, resetAt: _nextMidnightPT()  }
  };
}

function _loadRL() {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return _defaultRL();
}

function _saveRL(data) {
  try { localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data)); } catch (e) {}
}

function _resetIfExpired(data) {
  const now = Date.now();
  if (now >= data.groq.resetAt)   data.groq   = { calls: 0, tokens: 0, resetAt: _nextMidnightUTC() };
  if (now >= data.gemini.resetAt) data.gemini = { calls: 0, tokens: 0, resetAt: _nextMidnightPT()  };
  return data;
}

// ── Public rate limit API ─────────────────────────────────────────────────────

// Returns { allowed: bool, warning: bool, message: string }
function checkRateLimit(apiKey) {
  const data = _resetIfExpired(_loadRL());
  const groq  = (apiKey || '').trim().startsWith('gsk_');
  const limits = groq ? RL_GROQ : RL_GEMINI;
  const d = groq ? data.groq : data.gemini;

  if (d.calls >= limits.calls || d.tokens >= limits.tokens) {
    const prov = groq ? 'Groq' : 'Gemini';
    const resetIn = Math.max(1, Math.ceil((d.resetAt - Date.now()) / 60000));
    return {
      allowed: false,
      warning: false,
      message: prov + ' daily limit reached (' + d.calls + '/' + limits.calls + ' calls, ' +
               Math.round(d.tokens / 1000) + 'K/' + Math.round(limits.tokens / 1000) +
               'K tokens). Resets in ~' + resetIn + ' min.'
    };
  }

  if (groq && (d.calls >= limits.warnCalls || d.tokens >= limits.warnTokens)) {
    const remaining = limits.calls - d.calls;
    return {
      allowed: true,
      warning: true,
      message: 'Almost at Groq daily limit (' + d.calls + '/300 calls). ' +
               remaining + ' call' + (remaining === 1 ? '' : 's') + ' remaining today — resets midnight UTC.'
    };
  }

  return { allowed: true, warning: false, message: '' };
}

// Track a completed API call. Call this after each successful (or attempted) request.
function trackApiUsage(apiKey, tokensUsed) {
  const data = _resetIfExpired(_loadRL());
  const groq  = (apiKey || '').trim().startsWith('gsk_');
  const d = groq ? data.groq : data.gemini;
  d.calls  += 1;
  d.tokens += Math.max(0, tokensUsed || 0);
  _saveRL(data);
}

// Returns display object for Groq key, or null for Gemini (no display needed)
function getRateLimitDisplay(apiKey) {
  if (!(apiKey || '').trim().startsWith('gsk_')) return null;
  const data = _resetIfExpired(_loadRL());
  const d = data.groq;
  return {
    calls:     d.calls,
    maxCalls:  RL_GROQ.calls,
    tokens:    d.tokens,
    maxTokens: RL_GROQ.tokens,
    pct:       Math.round((d.calls / RL_GROQ.calls) * 100),
    warning:   d.calls >= RL_GROQ.warnCalls || d.tokens >= RL_GROQ.warnTokens,
    blocked:   d.calls >= RL_GROQ.calls     || d.tokens >= RL_GROQ.tokens
  };
}

// ── Gemini ────────────────────────────────────────────────────────────────────

async function callGeminiAPI(systemPrompt, userPrompt, apiKey, maxTokens) {
  LAST_PROVIDER = 'Gemini';
  const model = 'gemini-2.5-flash';
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
    model + ':generateContent?key=' + encodeURIComponent(apiKey);

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: maxTokens || 14000,
          responseMimeType: 'application/json'
        }
      })
    });
  } catch (netErr) {
    throw new Error('NETWORK: ' + netErr.message);
  }

  if (!response.ok) {
    let body = '';
    try { const j = await response.json(); body = (j.error && j.error.message) || JSON.stringify(j); } catch (e) {}
    trackApiUsage(apiKey, 0); // Count the failed call
    throw new Error('HTTP_' + response.status + ': ' + body);
  }

  const data = await response.json();

  // Track actual token usage
  const tokensUsed = data.usageMetadata?.totalTokenCount || (maxTokens || 0);
  trackApiUsage(apiKey, tokensUsed);

  const candidate = data.candidates?.[0];
  if (!candidate) throw new Error('EMPTY_RESPONSE: Gemini returned no candidates');

  const reason = candidate.finishReason;
  if (reason === 'MAX_TOKENS') {
    throw new Error('JSON_PARSE: Gemini response truncated (hit token limit). Batch too large.');
  }
  if (reason === 'SAFETY' || reason === 'RECITATION') {
    throw new Error('HTTP_400: Gemini blocked the response (' + reason + '). Try regenerating.');
  }

  const text = candidate.content?.parts?.[0]?.text || '';
  if (!text) throw new Error('EMPTY_RESPONSE: Gemini returned no content');

  return parseJSONResponse(text, 'Gemini');
}

// ── Groq ──────────────────────────────────────────────────────────────────────
// OpenAI-compatible endpoint. Free tier. Keys start with gsk_.
// model: defaults to llama-3.3-70b-versatile (generation).
//        Pass 'llama-3.1-8b-instant' for grading (cheaper, faster).

async function callGroqAPI(systemPrompt, userPrompt, apiKey, maxTokens, model) {
  LAST_PROVIDER = 'Groq';
  const chosenModel = model || 'llama-3.3-70b-versatile';

  let response;
  try {
    response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: chosenModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt   }
        ],
        max_tokens:  maxTokens || 4000,
        temperature: 0.4
        // No response_format — generation returns arrays; json_object mode conflicts
      })
    });
  } catch (netErr) {
    throw new Error('NETWORK: ' + netErr.message);
  }

  if (!response.ok) {
    let body = '';
    try { const j = await response.json(); body = (j.error && j.error.message) || JSON.stringify(j); } catch (e) {}
    trackApiUsage(apiKey, 0); // Count the failed call
    throw new Error('HTTP_' + response.status + ': ' + body);
  }

  const data = await response.json();

  // Track actual token usage (Groq returns usage.total_tokens)
  const tokensUsed = data.usage?.total_tokens || (maxTokens || 0);
  trackApiUsage(apiKey, tokensUsed);

  if (data.choices?.[0]?.finish_reason === 'length') {
    throw new Error('JSON_PARSE: Groq response truncated (hit token limit).');
  }

  const text = data.choices?.[0]?.message?.content || '';
  if (!text) throw new Error('EMPTY_RESPONSE: Groq returned no content');

  return parseJSONResponse(text, 'Groq');
}

// ── Route to provider ─────────────────────────────────────────────────────────
// AIza → Gemini   |   gsk_ → Groq   |   anything else → Groq (forward-compat)
// Checks rate limit BEFORE calling. Throws RATE_LIMIT: … if blocked.

async function callAPI(systemPrompt, userPrompt, apiKey, maxTokens) {
  const key = (apiKey || '').trim();
  const rl = checkRateLimit(key);
  if (!rl.allowed) throw new Error('RATE_LIMIT: ' + rl.message);
  if (key.startsWith('AIza')) return callGeminiAPI(systemPrompt, userPrompt, key, maxTokens);
  return callGroqAPI(systemPrompt, userPrompt, key, maxTokens);
}

// ── Grading-specific route ────────────────────────────────────────────────────
// Uses the lighter llama-3.1-8b-instant for Groq grading calls.
// Grading prompts are small (~1500 tokens) — 8b handles them well and costs
// only ~1/4 the tokens of 70b, preserving the daily budget for generation.

async function callAPIForGrading(systemPrompt, userPrompt, apiKey, maxTokens) {
  const key = (apiKey || '').trim();
  const rl = checkRateLimit(key);
  if (!rl.allowed) throw new Error('RATE_LIMIT: ' + rl.message);
  if (key.startsWith('AIza')) return callGeminiAPI(systemPrompt, userPrompt, key, maxTokens || 1500);
  return callGroqAPI(systemPrompt, userPrompt, key, maxTokens || 1500, 'llama-3.1-8b-instant');
}

// ── JSON response parser ──────────────────────────────────────────────────────
// Multi-stage parser: strips fences, direct parse, single-key unwrap, bracket extract.

function parseJSONResponse(text, providerName) {
  if (!text) throw new Error('JSON_PARSE: ' + providerName + ' returned empty text');

  // Stage 1: strip markdown fences (```json ... ``` or ``` ... ```)
  const stripped = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // Stage 2: direct parse
  try {
    const parsed = JSON.parse(stripped);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    if (parsed && typeof parsed === 'object') {
      // Unwrap known wrapper keys
      if (Array.isArray(parsed.challenges) && parsed.challenges.length > 0) return parsed.challenges;
      if (Array.isArray(parsed.recommendations)) return parsed;  // resources returns full object
      // Unwrap single-key object wrapping an array (e.g. {"items":[...]})
      const vals = Object.values(parsed);
      if (vals.length === 1 && Array.isArray(vals[0]) && vals[0].length > 0) return vals[0];
      return parsed; // grading result or other plain object
    }
  } catch (e) { /* fall through */ }

  // Stage 3: bracket extraction — last resort for malformed wrapping
  const arrStart = stripped.indexOf('[');
  const arrEnd   = stripped.lastIndexOf(']');
  if (arrStart >= 0 && arrEnd > arrStart) {
    try {
      const parsed = JSON.parse(stripped.substring(arrStart, arrEnd + 1));
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) { /* fall through */ }
  }

  // Stage 4: object extraction
  const objStart = stripped.indexOf('{');
  const objEnd   = stripped.lastIndexOf('}');
  if (objStart >= 0 && objEnd > objStart) {
    try {
      const parsed = JSON.parse(stripped.substring(objStart, objEnd + 1));
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (e) { /* fall through */ }
  }

  throw new Error('JSON_PARSE: ' + providerName + ' response is not valid JSON. Preview: ' + stripped.substring(0, 200));
}
