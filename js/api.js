// ============================================================
// api.js — Raw HTTP calls to Gemini and Groq APIs.
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
        max_tokens:  maxTokens || 4000,
        temperature: 0.4
        // No response_format — generation returns arrays; json_object mode would conflict
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
