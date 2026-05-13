// ============================================================
// generation.js — Curriculum generation engine.
// buildGenerationPrompt() is the single prompt builder for all
// roles and all domains. No GRC special-casing.
// ============================================================

// ── Provider helpers ──────────────────────────────────────────────────────────

// Groq free tier: ~6K TPM. Keep each call well under that ceiling.
function isGroqKey(key) { return (key || '').trim().startsWith('gsk_'); }

// Max output tokens per call by provider
function genMaxTokens(key) { return isGroqKey(key) ? 3800 : 14000; }

// Days per background batch by provider (Groq: 2 days = 4 challenges; Gemini: 3 days = 6)
function batchDayCount(key) { return isGroqKey(key) ? 2 : 3; }

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildProfileString(profile) {
  const lines = [
    'ROLE: ' + (profile.role === '__other__' ? (profile.roleOther || 'Professional') : profile.role),
    'EXPERIENCE: ' + (profile.experience || 'Not specified'),
    'AI PROFICIENCY: ' + (profile.proficiency || 'Not specified'),
    'TECHNICAL COMFORT: ' + (profile.techLevel || 'none'),
    'FRAMEWORKS / TOOLS USED: ' + ([].concat(profile.frameworks || []).join(', ') || 'Not specified'),
    'CERTIFICATIONS: ' + ([].concat(profile.certs || []).join(', ') || 'None listed'),
    'GOALS: ' + ([].concat(profile.goals || []).join(', ') || 'Not specified'),
    'HARDEST PROFESSIONAL CHALLENGE (most important — personalise to this): ' + (profile.challenge || 'Not specified'),
  ];
  return lines.join('\n');
}

function buildCompletedDomainsContext(completedDomainIndices, profile) {
  if (!completedDomainIndices || completedDomainIndices.length === 0) return '';
  const names = completedDomainIndices.map(i => getDomainName(i, profile));
  return 'ALREADY COVERED — do not re-explain these: ' + names.join(', ') + '. Build on them.';
}

function buildGenerationPrompt(profile, batchInfo, completedDomainIndices) {
  const { domainIndex, dayStart, dayEnd, isAdvanced } = batchInfo;
  const curriculum = DOMAIN_CURRICULA[domainIndex];
  const dayCount = (dayEnd - dayStart + 1) * 2; // 2 per day
  const roleApp = ROLE_APPLICATION_MAPS[profile.role] || buildCustomRoleApplication(profile);
  const techGuidance = TECH_LEVEL_GUIDANCE[profile.techLevel || 'none'];
  const completedContext = buildCompletedDomainsContext(completedDomainIndices, profile);

  // Domain name (role-specific for domains 5 and 6)
  const domainName = getDomainName(domainIndex, profile);

  // Skills to cover — from curriculum or role application map
  const skills = domainIndex === 5 ? roleApp.domain5Skills
    : domainIndex === 6 ? roleApp.domain6Skills
    : curriculum.skills;

  // Tools and frameworks
  const tools = (domainIndex === 5 || domainIndex === 6)
    ? roleApp.deliverables
    : curriculum.keyTools;
  const frameworks = roleApp.frameworks && roleApp.frameworks.length > 0
    ? 'FRAMEWORKS TO REFERENCE: ' + roleApp.frameworks.join(', ')
    : '';

  // Difficulty range
  const diffMin = isAdvanced ? 4 : Math.max(1, Math.floor(domainIndex / 3) + 1);
  const diffMax = isAdvanced ? 5 : Math.min(5, diffMin + 1);

  // Capstone instruction for domain 9
  const capstoneNote = domainIndex === 9
    ? '\nIMPORTANT — CAPSTONE: All 3 challenges must directly address the user\'s stated hardest challenge above. The day 28 challenge scopes the project. Day 29 builds it. Day 30 presents and reflects. The final deliverable must be something they are professionally proud of and could share with an employer.\n'
    : '';

  // Early domain note
  const earlyNote = domainIndex < 2
    ? '\nIMPORTANT: These are the first challenges users encounter. They may have NEVER used Claude. Every TASK_FRAME step must be fully explicit. Do not assume any prior knowledge.\n'
    : '';

  const userPrompt = `PROFESSIONAL PROFILE:
${buildProfileString(profile)}

${completedContext}

CURRENT DOMAIN: ${domainName} (Domain ${domainIndex + 1} of 10)
DOMAIN PURPOSE: ${curriculum.promptDescription}
SKILLS TO COVER: ${skills.join(', ')}
KEY TOOLS: ${tools.join(', ')}
${frameworks}
TECH LEVEL GUIDANCE: ${techGuidance}
${capstoneNote}${earlyNote}
GENERATE EXACTLY ${dayCount} challenges for days ${dayStart}–${dayEnd}.
Structure: 2 challenges per day. First = required:true (must complete to advance). Second = required:false (optional bonus). Both share the same day value.
Difficulty: ${diffMin}–${diffMax}. XP: scales 100–600 with difficulty.
${isAdvanced ? 'These are ADVANCED challenges. User has completed the full 30-day programme. Push complexity and expect mastery-level application.' : ''}

QUALITY STANDARDS — follow all word limits:
SCENARIO: 2–3 sentences, max 50 words. Specific moment in their working week. No generic company names (use "your organisation", "a client", "the firm you support"). Real problem. They recognise it.
CONCEPT: 2 sentences, max 45 words. Plain English. One key term defined.
WHY_MATTERS: 2 sentences, max 45 words. Concrete before/after. Reference their hardest challenge only where it genuinely fits — do not force it.
OUTCOME: 1 sentence, max 25 words. Start: "After this challenge, you will be able to..."
MINI_EXAMPLE: 80–100 words. ONE actual prompt the user would type + ONE actual Claude response. Role-specific, real-feeling details. No preamble.
TASK_FRAME: Numbered steps (\\n-separated). Min 5 steps, max 15 words each. Step 1 MUST always be: "1. Open claude.ai in a new browser tab. If you do not have a free account, create one at claude.ai — it takes 30 seconds."
TITLE: Concrete. References the actual deliverable being built.
HINT1: One guiding question, max 30 words.
HINT2: One concrete starting point for the hardest step, max 30 words.
TAKEAWAYS: Exactly 3 strings, each max 15 words. Immediately applicable.
REAL_WORLD_OUTPUT: Exact deliverable name, max 12 words.
BEGINNER_SCAFFOLD: 1–2 sentences, max 35 words. Plain English. What the user will actually DO. Start with a verb. Tell them they can only submit text — copy and paste Claude's responses as text, not screenshots.
RUBRIC: Array of exactly 4 strings. Each must be a specific, observable criterion evaluable as TRUE or FALSE from reading a text submission. Example good criterion: "Submission includes at least one actual Claude prompt in quotation marks." Example bad criterion: "Shows understanding of the concept." Make them specific to THIS challenge's task.

TOKEN BUDGET: Total output must not exceed 5000 tokens. Strictly follow all word limits above.

Return a JSON array of exactly ${dayCount} objects. Each must have these exact keys:
id (string, e.g. "D${dayStart}a", "D${dayStart}b" through "D${dayEnd}a", "D${dayEnd}b"),
domain (integer, 0-based, cycling through the 10 domains),
domainName (string, use "${domainName}"),
difficulty (integer ${diffMin}–${diffMax}),
xp (integer 100–600, scale with difficulty),
required (boolean),
day (integer ${dayStart}–${dayEnd}),
title, skill, scenario, concept, whyMatters, outcome, miniExample,
taskFrame (\\n-separated steps), hint1, hint2,
takeaways (array of 3 strings),
realWorldOutput, timeEst (e.g. "20–30 min"),
beginnerScaffold, rubric (array of 4 strings).

Return ONLY a valid JSON array. No markdown, no preamble. Start with [ and end with ].`;

  return userPrompt;
}

const GENERATION_SYSTEM_PROMPT = 'Return valid JSON only. No markdown fences, no preamble, no explanation. Array starts with [ and ends with ].';

// ── Initial curriculum generation ─────────────────────────────────────────────

async function generateCurriculum() {
  STATE.screen = 'generating';
  STATE.profile = Object.assign({}, OB.answers);
  storeApiKeyForSession(OB.apiKey);
  render();

  setGenProgress(8, 'Reading your profile…');
  await sleep(350);
  setGenProgress(18, 'Preparing your personalised brief…');
  await sleep(300);
  setGenProgress(28, 'Sending to AI…');
  await sleep(200);

  // Smooth animation toward 88% while API call runs
  let _animPct = 30;
  let _animMsgIdx = 0;
  const _animMsgs = [
    'Generating Day 1 scenarios for your role…',
    'Writing challenge concepts and examples…',
    'Calibrating difficulty to your experience level…',
    'Crafting worked examples and hints…',
    'Tailoring tasks to your goals…',
    'Structuring your first three days…',
    'Writing assessment rubrics…',
    'Finalising beginner guides…',
    'Almost ready…',
  ];
  const _animTimer = setInterval(() => {
    _animPct = _animPct + (88 - _animPct) * 0.028;
    setGenProgress(
      Math.round(_animPct * 10) / 10,
      _animMsgs[Math.floor(_animMsgIdx / 6) % _animMsgs.length]
    );
    _animMsgIdx++;
  }, 500);

  const groq = isGroqKey(OB.apiKey);
  const batchInfo = {
    domainIndex: 0,
    dayStart: APP_CONFIG.INITIAL_BATCH_DAYS[0],
    dayEnd: groq ? 2 : APP_CONFIG.INITIAL_BATCH_DAYS[1], // Groq: 2 days (4 ch); Gemini: 3 days (6 ch)
    isAdvanced: false
  };

  try {
    const prompt = buildGenerationPrompt(STATE.profile, batchInfo, []);
    const result = await callAPI(GENERATION_SYSTEM_PROMPT, prompt, OB.apiKey, genMaxTokens(OB.apiKey));
    clearInterval(_animTimer);

    if (!Array.isArray(result) || result.length === 0) {
      throw new Error('EMPTY_RESPONSE: No challenges returned from API');
    }

    setGenProgress(94, 'Saving your curriculum…');
    await sleep(150);

    let maxDay = 0;
    result.forEach(c => { if ((c.day || 0) > maxDay) maxDay = c.day; });

    STATE.challenges       = result;
    STATE.lastGeneratedDay = maxDay || batchInfo.dayEnd;
    STATE.generated        = true;
    STATE.profileLocked    = true;
    STATE.currentDay       = 1;
    STATE.currentDomain    = 0;
    STATE.xp               = 0;
    STATE.streak           = 0;
    STATE.skillScores      = {};
    STATE.skillHistory     = [];
    STATE.portfolio        = [];
    STATE.assistedIds      = [];
    STATE.challengesFetching = false;
    // Initialise skill scores to 0 for all 10 domains
    for (let i = 0; i < 10; i++) STATE.skillScores[i] = 0;
    saveState();

    setGenProgress(100, result.length + ' challenges ready — your first ' + (groq ? '2' : '3') + ' days. More load silently as you progress.');
    stopElapsedTimer();
    await sleep(1000);
    STATE.screen = 'app';
    render();

  } catch (err) {
    clearInterval(_animTimer);
    stopElapsedTimer();
    diagnoseFail(err);
  }
}

// ── Background fetch ──────────────────────────────────────────────────────────
// Called silently after day advance and challenge completion.
// Fetches the next domain's challenges when buffer < BUFFER_DAYS_TRIGGER.

async function triggerBackgroundFetch() {
  if (STATE.challengesFetching) return;
  const lastDay = STATE.lastGeneratedDay || 0;
  if (lastDay >= 30) return; // Core complete
  if ((lastDay - STATE.currentDay) >= APP_CONFIG.BUFFER_DAYS_TRIGGER) return; // Enough buffer

  const apiKey = getApiKey();
  if (!apiKey || !STATE.profile) return;

  STATE.challengesFetching = true;
  saveState();

  const fromDay = lastDay + 1;
  const days    = batchDayCount(apiKey); // Groq: 2 days, Gemini: 3 days
  const toDay   = Math.min(fromDay + days - 1, 30);
  const nextDomainIndex = getDomainIndexFromDay(fromDay);

  const completedDomains = [];
  for (let d = 0; d < nextDomainIndex; d++) completedDomains.push(d);

  const batchInfo = {
    domainIndex: nextDomainIndex,
    dayStart:    fromDay,
    dayEnd:      toDay,
    isAdvanced:  false
  };

  try {
    const prompt = buildGenerationPrompt(STATE.profile, batchInfo, completedDomains);
    const result = await callAPI(GENERATION_SYSTEM_PROMPT, prompt, apiKey, genMaxTokens(apiKey));

    if (Array.isArray(result) && result.length > 0) {
      const existingIds = new Set(STATE.challenges.map(c => c.id));
      const fresh = result.filter(c => !existingIds.has(c.id));
      STATE.challenges = STATE.challenges.concat(fresh);
      let maxDay = STATE.lastGeneratedDay;
      STATE.challenges.forEach(c => { if ((c.day || 0) > maxDay) maxDay = c.day; });
      STATE.lastGeneratedDay = maxDay;
      saveState();
      const panel = document.getElementById('panel-daily');
      if (panel && currentTab === 'daily') panel.innerHTML = renderDaily();
    }
  } catch (err) {
    console.warn('[Generation] Background fetch failed (silent):', err.message);
  } finally {
    STATE.challengesFetching = false;
    saveState();
  }
}

// ── Advanced mode ─────────────────────────────────────────────────────────────

async function enterAdvancedMode() {
  const existing = STATE.challenges.filter(c => c.day > 30);
  if (existing.length > 0) {
    STATE.currentDay = 31;
    STATE.screen = 'app';
    render();
    return;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    showToast('Session expired', 'Reload the page and re-enter your API key to unlock advanced mode');
    return;
  }

  showToast('Generating advanced challenges…', 'One API call — usually 30–40 seconds');

  const batchInfo = {
    domainIndex: 6, // Extend domain application
    dayStart: 31,
    dayEnd: 35,
    isAdvanced: true
  };

  const completedDomains = Array.from({ length: 10 }, (_, i) => i);

  try {
    const prompt = buildGenerationPrompt(STATE.profile, batchInfo, completedDomains);
    const result = await callAPI(GENERATION_SYSTEM_PROMPT, prompt, apiKey, genMaxTokens(apiKey));

    if (Array.isArray(result) && result.length > 0) {
      STATE.challenges = STATE.challenges.concat(result);
      STATE.currentDay = 31;
      saveState();
      STATE.screen = 'app';
      render();
      showToast('Advanced mode unlocked', result.length + ' challenges for Days 31–35');
    } else {
      showToast('Generation returned empty', 'Try again in a moment');
    }
  } catch (err) {
    showToast('Generation failed', err.message.substring(0, 80));
  }
}

// ── Error diagnosis ───────────────────────────────────────────────────────────

function diagnoseFail(err) {
  const msg      = (err && err.message) ? err.message : String(err);
  const provider = LAST_PROVIDER || 'AI';
  const isGroq   = provider === 'Groq';
  const consoleUrl = isGroq ? 'console.groq.com/keys' : 'aistudio.google.com/app/apikey';
  const keyPrefix  = isGroq ? 'gsk_' : 'AIza';

  let title = 'Generation failed';
  let detail = '';

  if (msg.startsWith('NETWORK:')) {
    title  = 'Network error — cannot reach ' + provider;
    detail = 'Check your internet connection. Browser extensions (ad-blockers) can block API calls — try disabling them for this page. If on a corporate network or VPN, try disabling it.';
  } else if (msg.startsWith('HTTP_401') || msg.startsWith('HTTP_403')) {
    title  = 'Invalid API key';
    detail = 'Your ' + provider + ' key was rejected. Check: (1) You copied it in full including the prefix (' + keyPrefix + '). (2) It has not been deleted at ' + consoleUrl + '. (3) No extra spaces.';
  } else if (msg.startsWith('HTTP_429')) {
    title  = 'Rate limit reached — ' + provider + ' free tier';
    detail = isGroq
      ? 'Groq free tier: ~6,000 tokens/min. Wait 60 seconds and try again. For heavier use, switch to a Gemini key (250K tokens/day free).'
      : 'Gemini free tier quota reached. Wait 60 seconds and try again, or check your quota at ' + consoleUrl + '.';
  } else if (msg.startsWith('JSON_PARSE')) {
    title  = 'Response parsing failed';
    detail = 'The AI returned content that could not be parsed as challenges. This is usually temporary — try again.';
  } else if (msg.startsWith('EMPTY_RESPONSE')) {
    title  = 'Empty response received';
    detail = 'The API responded but returned no challenges. Usually temporary — try again.';
  } else {
    title  = 'Unexpected error';
    detail = msg.substring(0, 200);
  }

  const statusEl = document.getElementById('genStatus');
  const subEl    = document.querySelector('.gen-sub');
  if (statusEl) { statusEl.textContent = title; statusEl.style.color = 'var(--red)'; }
  if (subEl) {
    subEl.innerHTML =
      '<div style="max-width:520px;text-align:left;background:var(--bg3);border:1px solid rgba(248,113,113,0.3);border-radius:10px;padding:16px 20px;margin:12px auto 0;">' +
        '<div style="font-family:var(--mono);font-size:10px;color:var(--red);letter-spacing:0.1em;margin-bottom:10px;text-transform:uppercase;">Provider: ' + provider + '</div>' +
        '<div style="font-size:13px;color:var(--text2);line-height:1.7;margin-bottom:14px;">' + escapeHTML(detail) + '</div>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
          '<button onclick="retryGeneration()" style="background:var(--accent);border:none;color:var(--bg);font-family:var(--mono);font-size:11px;padding:10px 20px;border-radius:6px;cursor:pointer;">Try Again</button>' +
          '<button onclick="goBackToApiKey()" style="background:none;border:1px solid var(--border2);color:var(--text2);font-family:var(--mono);font-size:11px;padding:10px 20px;border-radius:6px;cursor:pointer;">← Change Key</button>' +
        '</div>' +
      '</div>';
  }
}

function retryGeneration() { generateCurriculum(); }

function goBackToApiKey() {
  STATE.screen = 'onboarding';
  OB.step = 8; // API key step (0-indexed, step 8 of 8)
  render();
}
