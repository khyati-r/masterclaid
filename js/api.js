// ============================================================
// api.js — Raw HTTP calls to Gemini and Claude APIs.
// No prompt building here — just transport and response parsing.
// ============================================================

let LAST_PROVIDER = 'Gemini';

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
    throw new Error('HTTP_' + response.status + ': ' + body);
  }

  const data = await response.json();
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

async function callGroqAPI(systemPrompt, userPrompt, apiKey, maxTokens) {
  LAST_PROVIDER = 'Groq';
  let response;
  try {
    response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt   }
        ],
        max_tokens:      maxTokens || 14000,
        temperature:     0.4,
        response_format: { type: 'json_object' }
      })
    });
  } catch (netErr) {
    throw new Error('NETWORK: ' + netErr.message);
  }

  if (!response.ok) {
    let body = '';
    try { const j = await response.json(); body = (j.error && j.error.message) || JSON.stringify(j); } catch (e) {}
    throw new Error('HTTP_' + response.status + ': ' + body);
  }

  const data = await response.json();
  if (data.choices?.[0]?.finish_reason === 'length') {
    throw new Error('JSON_PARSE: Groq response truncated (hit token limit).');
  }

  const text = data.choices?.[0]?.message?.content || '';
  if (!text) throw new Error('EMPTY_RESPONSE: Groq returned no content');

  return parseJSONResponse(text, 'Groq');
}

// ── Route to provider ─────────────────────────────────────────────────────────
// AIza → Gemini   |   gsk_ → Groq   |   anything else → Groq (forward-compat)

async function callAPI(systemPrompt, userPrompt, apiKey, maxTokens) {
  const key = (apiKey || '').trim();
  if (key.startsWith('AIza')) return callGeminiAPI(systemPrompt, userPrompt, key, maxTokens);
  return callGroqAPI(systemPrompt, userPrompt, key, maxTokens);
}

// ── JSON response parser ──────────────────────────────────────────────────────
// Since we use responseMimeType:'application/json' for Gemini, responses
// should always be clean JSON. Single parse with fallback bracket-extraction.

function parseJSONResponse(text, providerName) {
  if (!text) throw new Error('JSON_PARSE: ' + providerName + ' returned empty text');

  // Primary: direct parse
  try {
    const parsed = JSON.parse(text.trim());
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    if (parsed?.challenges && Array.isArray(parsed.challenges)) return parsed.challenges;
    if (typeof parsed === 'object' && parsed !== null) return parsed;
  } catch (e) { /* fall through */ }

  // Fallback: extract array between first [ and last ]
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start >= 0 && end > start) {
    try {
      const parsed = JSON.parse(text.substring(start, end + 1));
      if (Array.isArray(parsed)) return parsed;
    } catch (e) { /* fall through */ }
  }

  throw new Error('JSON_PARSE: ' + providerName + ' response is not valid JSON. Preview: ' + text.substring(0, 200));
}
