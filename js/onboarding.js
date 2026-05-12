// ============================================================
// onboarding.js — 10-step onboarding flow.
// Steps: Landing → Role → Frameworks → Experience → Certs →
//        Goals → Proficiency → TechLevel → Challenge → API Key
// ============================================================

let OB = {
  step: 0,
  answers: {
    role: '', roleOther: '',
    frameworks: [], frameworksOther: '',
    experience: '',
    certs: [], certsOther: '',
    goals: [], goalsOther: '',
    proficiency: '',
    techLevel: 'none',
    challenge: ''
  },
  apiKey: ''
};

const OB_ROLES = [
  'GRC Consultant / Risk Manager / Risk Analyst / Information Security Auditor',
  'SOC Analyst / Threat Intelligence',
  'Penetration Tester / Red Team',
  'CISO / Security Director / vCISO',
  'Security Engineer / Architect',
  'Privacy Officer / DPO',
  'Business Continuity / Resilience Manager',
  'Security Student / Career Transitioning',
  '__other__'
];

const OB_FRAMEWORKS = [
  'ISO 27001', 'ISO 42001', 'ISO 22301', 'NIST CSF', 'NIST RMF',
  'SOC 2', 'GDPR / UK GDPR', 'PCI DSS', 'DORA', 'CIS Controls',
  'MITRE ATT&CK', 'OWASP', 'COBIT', 'None yet'
];

const OB_EXPERIENCE = [
  'Under 1 year', '1–2 years', '3–5 years', '6–10 years', 'Over 10 years'
];

const OB_CERTS = [
  'CISSP', 'CISM', 'CISA', 'CompTIA Security+', 'CEH', 'OSCP',
  'ISO 27001 Lead Auditor', 'ISO 27001 Lead Implementer',
  'CRISC', 'CDPSE', 'CIPM / CIPPE', 'AWS / Azure / GCP Security',
  'None yet'
];

const OB_GOALS = [
  'Save time on routine documentation',
  'Produce higher-quality professional deliverables',
  'Learn and apply AI tools in my daily work',
  'Automate repetitive tasks',
  'Build Claude-powered workflows for my team',
  'Prepare for AI governance responsibilities',
  'Develop a portfolio of AI-assisted work',
  'Get ahead of peers in AI capability'
];

const OB_PROFICIENCY = [
  'Never used an AI tool before',
  'Tried it once or twice out of curiosity',
  'Use it occasionally for simple tasks',
  'Use AI tools regularly in my work',
  'AI is a core part of how I work every day'
];

const OB_TECH_LEVEL = [
  { value: 'none',        label: 'No-code', description: 'I prefer visual tools — no terminals or scripting' },
  { value: 'guided',      label: 'Guided technical', description: 'I can follow step-by-step technical tutorials' },
  { value: 'comfortable', label: 'Comfortable with code', description: 'I can read and modify code with documentation' },
  { value: 'developer',   label: 'Developer', description: 'I write code professionally or as a regular hobby' }
];

// ── Render ────────────────────────────────────────────────────────────────────

function renderOnboarding() {
  const container = document.getElementById('app');
  if (!container) return;
  container.innerHTML = renderOnboardingStep(OB.step);
}

function renderOnboardingStep(step) {
  const steps = [
    renderLanding,
    renderRoleStep,
    renderFrameworksStep,
    renderExperienceStep,
    renderCertsStep,
    renderGoalsStep,
    renderProficiencyStep,
    renderTechLevelStep,
    renderChallengeStep,
    renderApiKeyStep
  ];
  const fn = steps[step];
  return fn ? fn() : '';
}

// ── Landing ───────────────────────────────────────────────────────────────────

function renderLanding() {
  return `<div class="landing">
  <div class="landing-inner">
    <div class="logo-mark">⬡</div>
    <h1 class="landing-title">Master.CLAID</h1>
    <p class="landing-sub">Claude &plus; AI &plus; Domain.<br>30 days. 60 challenges. Personalised to your role, graded by AI, built around your hardest professional problem.</p>
    <div class="landing-features">
      <div class="feat">10 domains · 60 challenges · semantic grading</div>
      <div class="feat">Foundations → Products → MCP → Agentic → Mastery</div>
      <div class="feat">Every scenario built for your role and real-world context</div>
    </div>
    <button class="btn-primary" onclick="obNext()">Build my profile →</button>
    ${STATE.generated ? '<button class="btn-secondary" style="margin-top:12px;" onclick="STATE.screen=\'app\';render();">Continue where I left off</button>' : ''}
    <div style="margin-top:20px;display:flex;gap:12px;justify-content:center;">
      <button class="btn-ghost" onclick="triggerImport()">↑ Import save</button>
    </div>
    <input type="file" id="importFile" class="import-input" accept=".json" onchange="importSave(event)">
  </div>
</div>`;
}

// ── Role ──────────────────────────────────────────────────────────────────────

function renderRoleStep() {
  return obShell('Your professional role', 'Step 1 of 9', `
    <p class="ob-hint">Every scenario, deliverable, and worked example is built for your specific role. This is the most important context signal in your curriculum.</p>
    <div class="ob-options" id="roleOpts">
      ${OB_ROLES.map(r => r === '__other__'
        ? `<button class="ob-opt ${OB.answers.role === '__other__' ? 'selected' : ''}" onclick="selectRole('__other__')">Other / Custom role</button>`
        : `<button class="ob-opt ${OB.answers.role === r ? 'selected' : ''}" onclick="selectRole(${JSON.stringify(r).replace(/"/g,'&quot;')})">${escapeHTML(r)}</button>`
      ).join('')}
    </div>
    ${OB.answers.role === '__other__' ? `
    <div style="margin-top:16px;">
      <input type="text" class="ob-input" id="roleOtherInput" placeholder="e.g. Clinical Psychologist, HR Business Partner, Financial Controller"
        value="${escapeHTML(OB.answers.roleOther)}" oninput="OB.answers.roleOther=this.value; updateObContinueBtn(this.value.trim().length>2);" style="width:100%;">
    </div>` : ''}
  `, false, !!OB.answers.role && (OB.answers.role !== '__other__' || OB.answers.roleOther.trim().length > 2));
}

function selectRole(r) {
  OB.answers.role = r;
  renderOnboarding();
}

// ── Frameworks ────────────────────────────────────────────────────────────────

function renderFrameworksStep() {
  return obShell('Frameworks and technologies', 'Step 2 of 9', `
    <p class="ob-hint">These appear directly in your challenge scenarios and worked examples. Select everything relevant — including what you aspire to work with.</p>
    <div class="ob-options ob-options-multi">
      ${OB_FRAMEWORKS.map(f =>
        `<button class="ob-opt ${OB.answers.frameworks.includes(f) ? 'selected' : ''}" onclick="toggleArr('frameworks', ${JSON.stringify(f).replace(/"/g,'&quot;')})">${escapeHTML(f)}</button>`
      ).join('')}
    </div>
    <input type="text" class="ob-input" placeholder="Any others? (e.g. HIPAA, SOX, internal frameworks)" style="margin-top:14px;width:100%;"
      value="${escapeHTML(OB.answers.frameworksOther)}" oninput="OB.answers.frameworksOther=this.value">
  `, true, true);
}

// ── Experience ────────────────────────────────────────────────────────────────

function renderExperienceStep() {
  return obShell('Years of professional experience', 'Step 3 of 9', `
    <p class="ob-hint">Calibrates challenge depth and the assumed sophistication of your domain knowledge.</p>
    <div class="ob-options">
      ${OB_EXPERIENCE.map(e =>
        `<button class="ob-opt ${OB.answers.experience === e ? 'selected' : ''}" onclick="OB.answers.experience=${JSON.stringify(e).replace(/"/g,'&quot;')};renderOnboarding()">${escapeHTML(e)}</button>`
      ).join('')}
    </div>
  `, true, !!OB.answers.experience);
}

// ── Certifications ────────────────────────────────────────────────────────────

function renderCertsStep() {
  return obShell('Qualifications and training', 'Step 4 of 9', `
    <p class="ob-hint">Optional — helps Claude reference the right standards, terminology, and frameworks in examples and rubrics.</p>
    <div class="ob-options ob-options-multi">
      ${OB_CERTS.map(c =>
        `<button class="ob-opt ${OB.answers.certs.includes(c) ? 'selected' : ''}" onclick="toggleArr('certs', ${JSON.stringify(c).replace(/"/g,'&quot;')})">${escapeHTML(c)}</button>`
      ).join('')}
    </div>
    <input type="text" class="ob-input" placeholder="Others not listed" style="margin-top:14px;width:100%;"
      value="${escapeHTML(OB.answers.certsOther)}" oninput="OB.answers.certsOther=this.value">
  `, true, true);
}

// ── Goals ─────────────────────────────────────────────────────────────────────

function renderGoalsStep() {
  return obShell('What do you want to achieve with AI?', 'Step 5 of 9', `
    <p class="ob-hint">Select up to 3. These appear in every "Why this matters" section and shape your Capstone direction.</p>
    <div class="ob-options ob-options-multi">
      ${OB_GOALS.map(g =>
        `<button class="ob-opt ${OB.answers.goals.includes(g) ? 'selected' : ''}" onclick="toggleGoal(${JSON.stringify(g).replace(/"/g,'&quot;')})">${escapeHTML(g)}</button>`
      ).join('')}
    </div>
    <input type="text" class="ob-input" placeholder="Something else?" style="margin-top:14px;width:100%;"
      value="${escapeHTML(OB.answers.goalsOther)}" oninput="OB.answers.goalsOther=this.value; updateObContinueBtn(this.value.trim().length>2||OB.answers.goals.length>0)">
  `, true, OB.answers.goals.length > 0 || OB.answers.goalsOther.trim().length > 2);
}

function toggleGoal(g) {
  if (OB.answers.goals.includes(g)) {
    OB.answers.goals = OB.answers.goals.filter(x => x !== g);
  } else if (OB.answers.goals.length < 3) {
    OB.answers.goals.push(g);
  }
  renderOnboarding();
}

// ── Proficiency ───────────────────────────────────────────────────────────────

function renderProficiencyStep() {
  return obShell('Current AI usage', 'Step 6 of 9', `
    <p class="ob-hint">How regularly you use AI tools in your work — not your technical level, that comes next.</p>
    <div class="ob-options">
      ${OB_PROFICIENCY.map(p =>
        `<button class="ob-opt ${OB.answers.proficiency === p ? 'selected' : ''}" onclick="OB.answers.proficiency=${JSON.stringify(p).replace(/"/g,'&quot;')};renderOnboarding()">${escapeHTML(p)}</button>`
      ).join('')}
    </div>
  `, true, !!OB.answers.proficiency);
}

// ── Tech Level ────────────────────────────────────────────────────────────────

function renderTechLevelStep() {
  return obShell('Technical comfort level', 'Step 7 of 9', `
    <p class="ob-hint">Controls how technical MCP, API, and Agentic Workflow challenges become. Be honest — there is no wrong answer and you can always ask Claude to simplify further.</p>
    <div class="ob-options" style="flex-direction:column;gap:10px;">
      ${OB_TECH_LEVEL.map(t =>
        `<button class="ob-opt ob-opt-wide ${OB.answers.techLevel === t.value ? 'selected' : ''}" onclick="OB.answers.techLevel='${t.value}';renderOnboarding()">
          <strong>${escapeHTML(t.label)}</strong>
          <span style="font-size:12px;opacity:0.75;display:block;margin-top:3px;">${escapeHTML(t.description)}</span>
        </button>`
      ).join('')}
    </div>
  `, true, !!OB.answers.techLevel);
}

// ── Challenge ─────────────────────────────────────────────────────────────────

function renderChallengeStep() {
  return obShell('Your hardest professional challenge', 'Step 8 of 9', `
    <p class="ob-hint">The most critical input in your profile. This directly shapes your Capstone project. Describe a real, current, specific problem in 2–4 sentences — something that costs you time, creates risk, or you have been putting off. The more concrete, the more useful your curriculum becomes.</p>
    <textarea class="ob-textarea" id="challengeInput" placeholder="Example: I spend 3–4 hours every week producing risk register updates that nobody reads in full. I want to build a process where Claude handles the data aggregation and formatting while I focus only on judgement calls — but I do not know where to start, and I have concerns about data security."
      oninput="OB.answers.challenge=this.value; document.getElementById('challengeCount').textContent=this.value.length+' / 600'; updateObContinueBtn(this.value.trim().length>30);">${escapeHTML(OB.answers.challenge)}</textarea>
    <div class="ob-charcount" id="challengeCount">${OB.answers.challenge.length} / 600</div>
  `, true, OB.answers.challenge.trim().length > 30);
}

// ── API Key ───────────────────────────────────────────────────────────────────

function renderApiKeyStep() {
  return obShell('Connect your API', 'Step 9 of 9', `
    <p class="ob-hint">Your curriculum generates directly via your API key — it goes to the provider and never passes through our servers. Stored only in browser session memory; cleared automatically when you close the tab.</p>
    <div class="api-options" id="apiOptions">
      <button class="api-path-btn ${OB._apiPath === 1 || !OB._apiPath ? 'active' : ''}" onclick="setObApiPath(1)">Gemini API key <span class="badge-free">Free</span></button>
      <button class="api-path-btn ${OB._apiPath === 2 ? 'active' : ''}" onclick="setObApiPath(2)">Claude API key</button>
    </div>
    <div id="apiSection1" style="display:${!OB._apiPath || OB._apiPath === 1 ? 'block' : 'none'}">
      <p class="ob-hint" style="margin-top:12px;">Get a free Gemini key at <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:var(--blue);">aistudio.google.com</a>. Keys start with <code>AIza</code>.</p>
      <input type="password" class="ob-input" id="geminiKey" placeholder="AIza…" style="width:100%;"
        value="${escapeHTML(OB.apiKey)}" oninput="OB.apiKey=this.value.trim(); updateObApiKeyBtns(this.value);">
    </div>
    <div id="apiSection2" style="display:${OB._apiPath === 2 ? 'block' : 'none'}">
      <p class="ob-hint" style="margin-top:12px;">Get a Claude key at <a href="https://console.anthropic.com" target="_blank" style="color:var(--blue);">console.anthropic.com</a>. Keys start with <code>sk-ant-</code>.</p>
      <input type="password" class="ob-input" id="claudeKey" placeholder="sk-ant-…" style="width:100%;"
        value="${escapeHTML(OB.apiKey)}" oninput="OB.apiKey=this.value.trim(); updateObApiKeyBtns(this.value);">
    </div>
    <div style="margin-top:20px;">
      <button id="genBtn" class="btn-primary" onclick="startGeneration()" ${OB.apiKey.length > 10 ? '' : 'disabled'}>Generate my curriculum →</button>
    </div>
    <p style="font-size:11px;color:var(--text3);margin-top:14px;font-family:var(--mono);letter-spacing:0.04em;line-height:1.7;">Your key is sent directly to the API. Not stored on any server, not in localStorage — session memory only.</p>
  `, true, null);
}

function setObApiPath(n) {
  OB._apiPath = n;
  renderOnboarding();
}

function startGeneration() {
  if (!OB.apiKey || OB.apiKey.length < 10) {
    showToast('API key required', 'Paste your API key before generating');
    return;
  }
  generateCurriculum();
}

// ── Shared helpers ────────────────────────────────────────────────────────────

// canContinue: true = enabled, false = disabled, null = hide the button
function obShell(title, stepLabel, bodyHtml, showBack, canContinue) {
  const continueBtn = canContinue === null
    ? ''
    : canContinue
      ? '<button id="obContinueBtn" class="btn-primary" onclick="obNext()">Continue →</button>'
      : '<button id="obContinueBtn" class="btn-primary" disabled>Continue →</button>';

  return `<div class="ob-shell">
  <div class="ob-inner">
    <div class="ob-step-label">${escapeHTML(stepLabel)}</div>
    <h2 class="ob-title">${escapeHTML(title)}</h2>
    ${bodyHtml}
    <div class="ob-actions">
      ${showBack ? '<button class="btn-ghost" onclick="obBack()">← Back</button>' : ''}
      ${continueBtn}
    </div>
  </div>
</div>`;
}

function obNext() {
  if (OB.step === 9) { startGeneration(); return; }
  OB.step = Math.min(OB.step + 1, 9);
  renderOnboarding();
}

function obBack() {
  OB.step = Math.max(OB.step - 1, 1);
  renderOnboarding();
}

function updateObContinueBtn(enabled) {
  var btn = document.getElementById('obContinueBtn');
  if (btn) btn.disabled = !enabled;
}

function updateObApiKeyBtns(val) {
  var enabled = val.trim().length > 10;
  var genBtn = document.getElementById('genBtn');
  if (genBtn) genBtn.disabled = !enabled;
}

function toggleArr(field, value) {
  const arr = OB.answers[field];
  const idx = arr.indexOf(value);
  if (idx >= 0) arr.splice(idx, 1);
  else arr.push(value);
  renderOnboarding();
}
