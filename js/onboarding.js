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
  // Healthcare & Wellbeing
  'Clinical Psychologist / Therapist / Counsellor',
  'Medical Doctor / GP / Specialist',
  'Nurse / Healthcare Professional / Allied Health',
  // Education
  'Teacher / Lecturer / Tutor / Trainer',
  // Finance & Accounting
  'Chartered Accountant / CPA / Finance Professional',
  'Financial Analyst / Investment Manager / Advisor',
  // Business & Operations
  'HR Professional / People Operations / Recruiter',
  'Marketing / Communications / PR Professional',
  'Operations Manager / Business Analyst',
  // Legal
  'Solicitor / Barrister / Legal Professional',
  // Tech & Data
  'Software Developer / Engineer',
  'Data Scientist / Data Analyst / BI Analyst',
  // Cybersecurity
  'GRC Consultant / Risk Manager / Compliance Officer',
  'SOC Analyst / Threat Intelligence',
  'Penetration Tester / Red Team',
  'CISO / Security Director',
  'Security Engineer / Architect',
  'Privacy Officer / DPO',
  // General
  'Student / Graduate / Career Changer',
  'Business Owner / Entrepreneur / Consultant',
  '__other__'
];

const OB_FRAMEWORKS = [
  'ISO 27001', 'ISO 42001', 'ISO 22301', 'NIST CSF', 'NIST RMF',
  'SOC 2', 'GDPR / UK GDPR', 'PCI DSS', 'DORA', 'CIS Controls',
  'MITRE ATT&CK', 'OWASP', 'COBIT', 'HIPAA', 'NICE Framework',
  'ICF (coaching)', 'BACP / BPS Guidelines', 'NHS Frameworks',
  'IFRS / UK GAAP', 'Sarbanes-Oxley', 'MiFID II', 'FCA Handbook',
  'None yet'
];

const OB_EXPERIENCE = [
  'Under 1 year', '1–2 years', '3–5 years', '6–10 years', 'Over 10 years'
];

const OB_CERTS = [
  // Cybersecurity
  'CISSP', 'CISM', 'CISA', 'CompTIA Security+', 'OSCP / CEH',
  'ISO 27001 Lead Auditor / Implementer', 'CRISC',
  // Finance & Accounting
  'CFA', 'ACCA / ACA', 'CPA / CIMA',
  // Management & Delivery
  'PMP', 'PRINCE2', 'ITIL', 'Agile / Scrum',
  // Cloud & Data
  'AWS Certified', 'Google Cloud / Azure Certified',
  'Google Analytics / Data Analytics Certificate',
  // People & HR
  'CIPD (L3, L5 or L7)',
  // Healthcare & Coaching
  'BPS Chartered Psychologist', 'ICF Coaching Credential',
  'RCN / NMC Registration',
  // Academic
  'PhD / Masters / Postgraduate Qualification',
  'None yet'
];

// ── Role-specific goals ────────────────────────────────────────────────────────

const OB_GOALS_DEFAULT = [
  'Save time on routine documentation and admin',
  'Produce higher-quality professional deliverables',
  'Learn and apply AI tools in my daily work',
  'Automate repetitive tasks and workflows',
  'Build AI-powered tools or processes for my team',
  'Get ahead of peers in AI capability',
  'Prepare for AI governance and responsible use',
  'Develop a portfolio of AI-assisted work'
];

const OB_GOALS_MAP = {
  clinical: [
    'Reduce time spent on clinical documentation and notes',
    'Improve quality of patient reports, letters and summaries',
    'Use AI for research synthesis and literature review',
    'Support evidence-based clinical decision making',
    'Build workflows that protect patient confidentiality',
    'Prepare for AI regulation and governance in healthcare',
    'Automate administrative and scheduling tasks',
    'Get ahead of peers in responsible AI adoption'
  ],
  education: [
    'Automate lesson planning and curriculum design',
    'Create personalised learning materials faster',
    'Generate assessments, rubrics and detailed feedback',
    'Reduce administrative and marking workload',
    'Use AI to support and differentiate student learning',
    'Build a reusable toolkit of AI resources for educators',
    'Prepare for AI governance in educational institutions',
    'Develop a portfolio of AI-assisted teaching materials'
  ],
  finance: [
    'Automate financial report drafting and commentary',
    'Improve quality of client-facing deliverables',
    'Use AI for data interpretation and variance analysis',
    'Reduce time spent on compliance documentation',
    'Build AI workflows for audit and review processes',
    'Prepare for AI governance in financial services',
    'Get ahead of peers in AI-enabled financial analysis',
    'Develop a portfolio of AI-assisted work'
  ],
  security: [
    'Save time on routine security documentation',
    'Produce higher-quality professional deliverables',
    'Learn and apply AI tools in security workflows',
    'Automate repetitive tasks and threat reporting',
    'Build Claude-powered workflows for my team',
    'Prepare for AI governance responsibilities',
    'Develop a portfolio of AI-assisted security work',
    'Get ahead of peers in AI capability'
  ],
  developer: [
    'Accelerate code review, documentation and testing',
    'Use AI as a pair programmer for complex problems',
    'Build AI-powered tools, APIs and automations',
    'Learn prompt engineering for technical tasks',
    'Improve quality of technical architecture and design docs',
    'Build Claude-powered products and features',
    'Get ahead of peers in AI-native engineering',
    'Develop a portfolio of AI-assisted projects'
  ],
  data: [
    'Accelerate exploratory data analysis and insight generation',
    'Automate data documentation and model reporting',
    'Use AI for natural language querying and summarisation',
    'Improve quality of stakeholder-facing data stories',
    'Build AI-assisted data pipelines and workflows',
    'Get ahead of peers in AI-augmented analytics',
    'Prepare for AI governance and model ethics',
    'Develop a portfolio of AI-assisted data projects'
  ],
  hr: [
    'Automate HR documentation, policy writing and templates',
    'Improve quality of job descriptions and job adverts',
    'Use AI to support employee relations and guidance',
    'Build workflows for onboarding, training and development content',
    'Save time on routine HR admin and correspondence',
    'Prepare for AI governance in people operations',
    'Get ahead of peers in AI-enabled HR',
    'Develop a portfolio of AI-assisted HR work'
  ],
  marketing: [
    'Produce more content, faster without sacrificing quality',
    'Use AI for audience research and competitive analysis',
    'Build AI-assisted content and campaign workflows',
    'Improve consistency and quality across all copy',
    'Automate reporting, briefing and internal communications',
    'Get ahead of peers in AI-enabled marketing',
    'Prepare for AI governance and brand safety',
    'Develop a portfolio of AI-assisted campaigns'
  ],
  legal: [
    'Reduce time on contract drafting and review',
    'Improve quality of legal documents, memos and letters',
    'Use AI for legal research and case summarisation',
    'Build workflows for document management and due diligence',
    'Prepare for AI governance in legal services',
    'Get ahead of peers in AI-enabled legal practice',
    'Automate routine client correspondence',
    'Develop a portfolio of AI-assisted legal work'
  ]
};

function getGoalsForRole(role) {
  if (!role || role === '__other__') return OB_GOALS_DEFAULT;
  const r = role.toLowerCase();
  if (/psych|therap|counsel|clinic|nurse|doctor|gp|health|medical|allied/.test(r)) return OB_GOALS_MAP.clinical;
  if (/teach|lectur|tutor|train|educat/.test(r)) return OB_GOALS_MAP.education;
  if (/account|cpa|cima|acca|aca|finance|financial|invest|cfa/.test(r)) return OB_GOALS_MAP.finance;
  if (/security|soc|threat|pentest|ciso|grc|risk|privacy|compliance|dpo|resilience/.test(r)) return OB_GOALS_MAP.security;
  if (/developer|software engineer|engineer(?!.*security)/.test(r)) return OB_GOALS_MAP.developer;
  if (/data scien|data analy|bi analy/.test(r)) return OB_GOALS_MAP.data;
  if (/hr |human res|people ops|recruiter/.test(r)) return OB_GOALS_MAP.hr;
  if (/market|communic|pr pro/.test(r)) return OB_GOALS_MAP.marketing;
  if (/legal|solicitor|barrister|law/.test(r)) return OB_GOALS_MAP.legal;
  return OB_GOALS_DEFAULT;
}

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
  // Clear goals when role changes so role-specific options are fresh
  OB.answers.goals = [];
  renderOnboarding();
}

// ── Frameworks ────────────────────────────────────────────────────────────────

function renderFrameworksStep() {
  return obShell('Frameworks, standards and guidelines', 'Step 2 of 9', `
    <p class="ob-hint">These appear directly in your challenge scenarios and worked examples. Select everything relevant — including what you aspire to work with.</p>
    <div class="ob-options ob-options-multi">
      ${OB_FRAMEWORKS.map(f =>
        `<button class="ob-opt ${OB.answers.frameworks.includes(f) ? 'selected' : ''}" onclick="toggleArr('frameworks', ${JSON.stringify(f).replace(/"/g,'&quot;')})">${escapeHTML(f)}</button>`
      ).join('')}
    </div>
    <input type="text" class="ob-input" placeholder="Any others? (e.g. internal standards, sector-specific frameworks)" style="margin-top:14px;width:100%;"
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
  return obShell('Qualifications and certifications', 'Step 4 of 9', `
    <p class="ob-hint">Optional — helps your curriculum reference the right standards, terminology, and professional context in examples and rubrics.</p>
    <div class="ob-options ob-options-multi">
      ${OB_CERTS.map(c =>
        `<button class="ob-opt ${OB.answers.certs.includes(c) ? 'selected' : ''}" onclick="toggleArr('certs', ${JSON.stringify(c).replace(/"/g,'&quot;')})">${escapeHTML(c)}</button>`
      ).join('')}
    </div>
    <input type="text" class="ob-input" placeholder="Others not listed (e.g. CIPD L5, MSc, sector licence)" style="margin-top:14px;width:100%;"
      value="${escapeHTML(OB.answers.certsOther)}" oninput="OB.answers.certsOther=this.value">
  `, true, true);
}

// ── Goals ─────────────────────────────────────────────────────────────────────

function renderGoalsStep() {
  const roleKey = OB.answers.role === '__other__' ? OB.answers.roleOther : OB.answers.role;
  const goals = getGoalsForRole(roleKey);
  return obShell('What do you want to achieve with AI?', 'Step 5 of 9', `
    <p class="ob-hint">Select up to 3. These shape every "Why this matters" section and your Capstone project direction.</p>
    <div class="ob-options ob-options-multi" id="goalsOpts">
      ${goals.map(g =>
        `<button class="ob-opt ${OB.answers.goals.includes(g) ? 'selected' : ''}" onclick="toggleGoal(${JSON.stringify(g).replace(/"/g,'&quot;')})">${escapeHTML(g)}</button>`
      ).join('')}
    </div>
    <input type="text" class="ob-input" id="goalsOtherInput" placeholder="Something specific not listed above?" style="margin-top:14px;width:100%;"
      value="${escapeHTML(OB.answers.goalsOther)}" oninput="OB.answers.goalsOther=this.value; updateObContinueBtn(this.value.trim().length>2||OB.answers.goals.length>0)">
  `, true, OB.answers.goals.length > 0 || OB.answers.goalsOther.trim().length > 2);
}

function toggleGoal(g) {
  if (OB.answers.goals.includes(g)) {
    OB.answers.goals = OB.answers.goals.filter(x => x !== g);
  } else if (OB.answers.goals.length < 3) {
    OB.answers.goals.push(g);
  }
  // Partial update: only re-render the options, preserve the text input
  const opts = document.getElementById('goalsOpts');
  if (opts) {
    const roleKey = OB.answers.role === '__other__' ? OB.answers.roleOther : OB.answers.role;
    const goalList = getGoalsForRole(roleKey);
    opts.innerHTML = goalList.map(g2 =>
      `<button class="ob-opt ${OB.answers.goals.includes(g2) ? 'selected' : ''}" onclick="toggleGoal(${JSON.stringify(g2).replace(/"/g,'&quot;')})">${escapeHTML(g2)}</button>`
    ).join('');
    updateObContinueBtn(OB.answers.goals.length > 0 || OB.answers.goalsOther.trim().length > 2);
  } else {
    renderOnboarding();
  }
}

// ── Proficiency ───────────────────────────────────────────────────────────────

function renderProficiencyStep() {
  const OB_PROFICIENCY = [
    'Never used an AI tool before',
    'Tried it once or twice out of curiosity',
    'Use it occasionally for simple tasks',
    'Use AI tools regularly in my work',
    'AI is a core part of how I work every day'
  ];
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
  const OB_TECH_LEVEL = [
    { value: 'none',        label: 'No-code', description: 'I prefer visual tools — no terminals or scripting' },
    { value: 'guided',      label: 'Guided technical', description: 'I can follow step-by-step technical tutorials' },
    { value: 'comfortable', label: 'Comfortable with code', description: 'I can read and modify code with documentation' },
    { value: 'developer',   label: 'Developer', description: 'I write code professionally or as a regular hobby' }
  ];
  return obShell('Technical comfort level', 'Step 7 of 9', `
    <p class="ob-hint">Controls how technical MCP, API, and Agentic Workflow challenges become. Be honest — there is no wrong answer and you can always ask Claude to simplify.</p>
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
    <textarea class="ob-textarea" id="challengeInput" placeholder="Example: I spend 3–4 hours every week on routine reports that nobody reads in full. I want to build a process where Claude handles the data aggregation and first draft while I focus only on judgement calls — but I do not know where to start."
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

// canContinue: true = enabled button, false = disabled button, null = hide button
function obShell(title, stepLabel, bodyHtml, showBack, canContinue) {
  const continueBtn = canContinue === null
    ? ''
    : canContinue
      ? '<button id="obContinueBtn" class="btn-primary" onclick="obNext()">Continue →</button>'
      : '<button id="obContinueBtn" class="btn-primary" onclick="obNext()" disabled>Continue →</button>';

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
  // Validate before advancing
  if (OB.step === 1) {
    const canGo = !!OB.answers.role && (OB.answers.role !== '__other__' || OB.answers.roleOther.trim().length > 2);
    if (!canGo) return;
  }
  if (OB.step === 5) {
    const canGo = OB.answers.goals.length > 0 || OB.answers.goalsOther.trim().length > 2;
    if (!canGo) return;
  }
  if (OB.step === 8) {
    const canGo = OB.answers.challenge.trim().length > 30;
    if (!canGo) return;
  }
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
