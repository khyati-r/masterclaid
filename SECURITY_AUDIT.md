# Security Audit — Master.ClAId
Date: 2026-05-14
Auditor: Claude Security Agent (claude-sonnet-4-6)

## Summary

4 issues found and fixed: 0 critical, 1 high, 2 medium, 1 low.

Files audited: `index.html`, `js/config.js`, `js/state.js`, `js/utils.js`, `js/api.js`,
`js/generation.js`, `js/grading.js`, `js/onboarding.js`, `js/render.js`, `js/modal.js`,
`js/portfolio.js`, `js/resources.js`, `js/settings.js`, `js/app.js`, `css/styles.css`

All JS files pass syntax check (`node -e "new Function(require('fs').readFileSync(...))"`) after fixes.

---

## Findings

### Finding 1 — [LLM01] HIGH
**Grading prompt: submission not sanitized for control characters before injection-pattern stripping**

| Field | Value |
|-------|-------|
| File | `js/grading.js` — `buildGradingPrompt()` |
| Classification | LLM01 Prompt Injection |
| Severity | HIGH |

**What was wrong:** `buildGradingPrompt()` applied injection-pattern stripping directly to the raw submission string but did not first call `sanitizeForPrompt()`. This meant null bytes (`\x00`) and other control characters (U+0001–U+001F, U+007F) were not stripped before the submission entered the grading prompt. An adversary could paste control-character-encoded injection payloads that bypass the plaintext regex patterns.

Additionally, the `ACT AS IF YOU ARE NOW` injection pattern was stripped in `buildProfileString()` but was absent from the grading prompt's sanitization.

**Fix applied (`js/grading.js`):**
- Replaced `.substring(0, 1800)` raw truncation with `sanitizeForPrompt(submission, 1800)` as the first operation, ensuring null bytes and control characters are stripped before further processing.
- Added `.replace(/ACT\s+AS\s+(IF\s+)?YOU\s+ARE\s+NOW/gi, '[removed]')` to match the same pattern set used in `buildProfileString()`.

---

### Finding 2 — [LLM02] MEDIUM
**Grading prompt embeds AI-generated challenge fields without sanitization**

| Field | Value |
|-------|-------|
| File | `js/grading.js` — `buildGradingPrompt()` |
| Classification | LLM02 Insecure Output Handling (defense-in-depth for AI→prompt injection) |
| Severity | MEDIUM |

**What was wrong:** `challenge.title`, `challenge.skill`, and `challenge.taskFrame` were embedded directly into the grading prompt without any sanitization. These fields are AI-generated (not directly user-supplied), but a hallucinated or adversarially influenced generation output could contain injection patterns that would modify the grading prompt when that challenge is later graded.

**Fix applied (`js/grading.js`):**
- Introduced `safeTitle`, `safeSkill`, and `safeTaskLine` variables, each constructed via `sanitizeForPrompt()` with appropriate length caps (200, 200, 300 chars).
- The grading prompt template now uses these sanitized variables rather than the raw challenge fields.

---

### Finding 3 — [A08] MEDIUM
**importSave() does not clamp numeric fields — crafted save file can set arbitrary values**

| Field | Value |
|-------|-------|
| File | `js/state.js` — `importSave()` |
| Classification | A08 Software and Data Integrity |
| Severity | MEDIUM |

**What was wrong:** `importSave()` correctly bounded array fields (challenges ≤ 300, completedIds ≤ 600, etc.) but did not validate or clamp the six numeric fields: `currentDay`, `currentDomain`, `xp`, `streak`, `daysActive`, `lastGeneratedDay`. A crafted save file could set `currentDay: 999999`, causing `advanceDay()` to loop incorrectly, render failures in the day-counter display, or `currentDomain` out-of-range 0–9 causing undefined domain lookups.

**Fix applied (`js/state.js`):**
Added explicit clamping for all six numeric fields immediately after the array bounds are enforced:
- `currentDay` → clamped to [1, 35]
- `currentDomain` → clamped to [0, 9]
- `xp` → clamped to [0, 999999]
- `streak` → clamped to [0, 3650] (10 years max)
- `daysActive` → clamped to [0, 3650]
- `lastGeneratedDay` → clamped to [0, 35]

Each uses `parseInt(..., 10)` to reject non-integer imports (e.g., `"currentDay": "../../etc/passwd"`).

---

### Finding 4 — [LLM09] LOW
**No disclaimer that AI grading is indicative, not authoritative**

| Field | Value |
|-------|-------|
| File | `js/grading.js` — `renderScoreResult()` |
| Classification | LLM09 Overreliance |
| Severity | LOW |

**What was wrong:** The grading result panel presented AI-generated scores and feedback with no indication that these are AI assessments that may be inaccurate. OWASP LLM09 recommends surfacing appropriate caveats to prevent users from overrelying on LLM outputs for consequential assessments.

**Fix applied (`js/grading.js`):**
Added a small, unobtrusive disclaimer in the `renderScoreResult()` return value:
`"AI-graded assessment — indicative feedback only. Use your own professional judgement."`
Styled as `var(--text3)` monospace at 10px — visible but not alarming for genuinely useful feedback.

---

## Items Reviewed and Found Acceptable (No Action)

### A01 Broken Access Control
`profileLocked` is a client-side UI gate only, not a security boundary. A user can bypass it via console to re-enter onboarding. This is acceptable: the static app has no server, no backend data store, and no multi-user access control requirements. Bypassing `profileLocked` harms only the bypassing user's own learning experience.

### A02 Cryptographic Failures
- `apiKey` is never written to `localStorage` — confirmed in `saveState()` which explicitly deletes it before saving.
- API key is stored only in `sessionStorage` under `APP_CONFIG.SESSION_KEY` and in `STATE.apiKey` (in-memory, reset on page load).
- `clearApiKeySession()` removes both the in-memory reference and the sessionStorage entry.
- `apiKey` does not appear in any `console.log`, `innerHTML`, or URL param display.
- Gemini API key appears in the fetch URL query string (`?key=...`) which is standard for the Google AI Studio API; this is sent over HTTPS only and is not logged to console.

### A03 Injection
All user-supplied content rendered to the DOM passes through `escapeHTML()`. Reviewed:
- `render.js`: role name (line 48), all challenge card fields, sidebar domain names, log entries — all escaped.
- `modal.js`: `c.domainName` (line 75 — escaped), challenge metadata, grading error (line 101 — escaped), hints (line 229 — escaped), all `body.innerHTML` assignments use `escapeHTML()` on every user/AI-sourced string.
- `portfolio.js`: `entry.title`, `entry.feedback`, `entry.criteria[].text`, `scoreDisplay` — all escaped.
- `resources.js`: `link.url`, `link.title`, `link.description`, `rec.title`, `rec.type`, `rec.why` — all escaped.
- `grading.js` `renderScoreResult()`: `cr.text`, `scoreData.feedback`, `scoreData.suggestion` — all escaped.

No raw user-content interpolation found in any innerHTML assignment.

### A04 Insecure Design
Rate limiting is enforced client-side only (localStorage counter). For a fully static app with no server component this is the only available approach. The trade-off is documented in the code comments. A user could clear localStorage to reset the counter; this would only increase their own API costs, not harm other users.

### A05 Security Misconfiguration
- CSP is present in `index.html` with: `default-src 'self'`, `script-src 'self' 'unsafe-inline'`, `connect-src` restricted to Gemini and Groq endpoints only, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`.
- `unsafe-inline` for `script-src` is a known trade-off for a fully static app using inline `onclick` handlers without a build pipeline. This is documented in a code comment.
- No `eval()`, `Function()` constructor calls, or `dangerouslySetInnerHTML` equivalents found.
- No `javascript:` URIs found in link `href` attributes or event handlers.
- `isSafeUrl()` is applied to all `CURATED_RESOURCE_LINKS` before rendering as `<a href>` anchors.

### A06 Vulnerable and Outdated Components
No npm dependencies. No CDN resources loaded. Google Fonts and external CDN scripts are absent from `index.html`. Font loading uses `font-src 'self' data:` only.

### A07 Authentication Failures
No authentication system. API key validation checks `startsWith('AIza')` or `startsWith('gsk_')` as a format guard to prevent accidental paste of wrong values. This is not a security boundary — it is a UX guard. The actual key validation is performed by the provider API on each call.

### A08 (remaining) — Profile object from import
The `profile` object imported via `importSave()` is stored to `STATE.profile` and later consumed by `buildProfileString()` (which calls `sanitizeForPrompt()` on every field with length caps) and `escapeHTML()` in DOM rendering. No unsanitized profile field reaches the DOM or any LLM prompt.

### A09 Logging and Monitoring
Searched all JS files for `console.log`, `console.warn`, `console.error` calls. No API key value is logged. Error messages log `err.message` only, which contains HTTP status codes and API error text, not credentials. The only place an API key is used is inside `callGeminiAPI()` (in a URL) and `callGroqAPI()` (in an `Authorization` header) — neither path logs the key.

### A10 Server-Side Request Forgery
Not applicable (static app with no server). `connect-src` CSP restricts all `fetch()` calls to `https://generativelanguage.googleapis.com` and `https://api.groq.com` only. An attacker who gains XSS execution cannot exfiltrate data to arbitrary hosts via the fetch API.

### LLM01 (remaining) — Generation prompt injection
`buildGenerationSystemPrompt()` and `buildProfileString()` apply `sanitizeForPrompt()` to all user-supplied fields, wrap the highest-risk `challenge` field in `<challenge>…</challenge>` delimiters, and strip all known injection patterns (`IGNORE PREVIOUS INSTRUCTIONS`, `DISREGARD PREVIOUS`, `ACT AS IF YOU ARE NOW`). The system prompt also contains an explicit security instruction to the model.

### LLM03 Training Data Poisoning
Not applicable — the app does not train any model.

### LLM04 Model Denial of Service
- Submission capped at 1800 chars in `buildGradingPrompt()`.
- All profile free-text fields individually capped via `sanitizeForPrompt()` maxLen parameter.
- Generation prompt total output capped at 5000 tokens via the prompt instruction; API `maxTokens` set per-provider (`genMaxTokens()`).
- Rate limiting (client-side) tracks daily call and token counts per provider.

### LLM05 Supply Chain Vulnerabilities
API endpoint URLs are hardcoded in `api.js` — `https://generativelanguage.googleapis.com` and `https://api.groq.com`. There is no dynamic URL construction from localStorage or user input. CSP `connect-src` would block redirected calls to other hosts even if XSS were achieved.

### LLM06 Sensitive Information Disclosure
Generation and grading prompts contain the user's professional profile (role, challenge description) but no credentials or PII beyond what the user explicitly entered. The prompts are sent to the user's own API key over HTTPS. No API responses are logged to console. There is no shared backend that could expose one user's data to another.

### LLM07 Insecure Plugin Design
Not applicable — no plugin system.

### LLM08 Excessive Agency
The "Agentic Workflows" domain teaches the user about Claude Code and Claude in Chrome but does not itself execute any agentic actions. The app only calls the Gemini/Groq text generation APIs. No tool-use, code execution, browser automation, or file system access is performed by the app itself.

### LLM10 Model Theft
API keys are session-only (sessionStorage + in-memory STATE). They are never written to localStorage, never appear in URLs displayed to users, and are cleared on tab close. The key format validation prevents accidental exposure of wrong credentials.

---

## Accepted Risks

| Risk | Rationale |
|------|-----------|
| Client-side rate limiting | Static app with no server — no alternative. User can clear localStorage to reset their own counter; this only increases their own API costs. |
| `unsafe-inline` for `script-src` | Required for inline `onclick` handlers throughout the app. Mitigation: CSP `connect-src` limits exfiltration even if XSS occurs. Accepted trade-off for a vanilla-JS static app. |
| `profileLocked` is client-bypassable | No server to enforce it. Users can only harm their own experience. Not a security boundary — only a UX coherence guard. |
| AI grading accuracy | LLM graders can be wrong. Mitigated by: local fallback grader (keyword-matching), the new disclaimer in the UI, and the educational context (stakes are low — no certification with external consequences). |
| API key format validation (prefix only) | `startsWith('AIza')` and `startsWith('gsk_')` are format guards, not cryptographic validation. The provider API validates the key on each call. Accepted: adding stronger format validation would be security theater on a static app. |
