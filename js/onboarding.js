// ============================================================
// onboarding.js — 9-step onboarding flow (8 questions + landing).
// Steps: Landing → Role → Background → Experience →
//        Goals → Proficiency → TechLevel → Challenge → API Key
// ============================================================

let OB = {
  step: 0,
  _apiPath: 1,  // 1 = Gemini, 2 = Groq — must be initialised so first render is correct
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

// 9 broad role categories + "Other" — kept intentionally short
const OB_ROLES = [
  'Healthcare Professional',
  'Teacher or Educator',
  'Finance or Accounting Professional',
  'Legal Professional',
  'HR, Operations or Marketing',
  'Software Developer or Data Professional',
  'Cybersecurity or Risk Professional',
  'Business Owner or Manager',
  'Student or Career Changer',
  '__other__'
];

// Combined background step — 7 framework options + 6 cert options
const OB_BACKGROUND_FRAMEWORKS = [
  'GDPR / UK GDPR / Data Protection',
  'ISO Standards (27001 / 9001 / 42001)',
  'IFRS / UK GAAP / SOX / Financial Reporting',
  'HIPAA / NHS / Clinical Standards',
  'PRINCE2 / PMP / Agile & Scrum',
  'NIST / CIS / Security Frameworks',
  'None of the above'
];

const OB_BACKGROUND_CERTS = [
  'CISSP / CISM / CISA / Security+',
  'ACCA / ACA / CPA / CFA',
  'PMP / PRINCE2 / Agile Certified',
  'CIPD (HR & People)',
  'AWS / Azure / GCP Certified',
  'None yet'
];

const OB_EXPERIENCE = [
  'Under 1 year', '1–2 years', '3–5 years', '6–10 years', 'Over 10 years'
];

// ── Role-specific goals ────────────────────────────────────────────────────────

const OB_GOALS_DEFAULT = [
  'Learn to use Claude confidently in my daily work',
  'Save time on routine documentation and admin',
  'Produce higher-quality professional deliverables with Claude',
  'Build AI-powered workflows and automations for my team',
  'Understand how to integrate Claude into existing tools and systems',
  'Get ahead of peers in AI capability and confidence',
  'Prepare for AI governance, ethics, and responsible use',
  'Develop a portfolio of AI-assisted work I can showcase'
];

const OB_GOALS_MAP = {
  clinical: [
    'Reduce time spent on clinical documentation using Claude',
    'Improve quality of patient reports, letters and summaries with AI',
    'Use Claude for research synthesis and literature review',
    'Build workflows that protect patient confidentiality while using AI',
    'Prepare for AI regulation and governance requirements in healthcare',
    'Learn to use AI tools responsibly in a clinical setting',
    'Automate administrative tasks so I can focus on patient care',
    'Get ahead of peers in evidence-based AI adoption'
  ],
  education: [
    'Use Claude to plan lessons and design curriculum faster',
    'Generate assessments, rubrics and personalised feedback with AI',
    'Reduce administrative and marking workload with Claude',
    'Build a reusable toolkit of AI-powered teaching resources',
    'Understand how to teach AI literacy to students',
    'Prepare for AI governance in educational institutions',
    'Create differentiated learning materials faster',
    'Develop a portfolio of AI-assisted teaching materials'
  ],
  finance: [
    'Use Claude to draft financial reports and commentary faster',
    'Improve quality and consistency of client-facing deliverables',
    'Build AI workflows for analysis, audit and review processes',
    'Reduce time on routine compliance and regulatory documentation',
    'Prepare for AI governance and regulation in financial services',
    'Get ahead of peers in AI-enabled financial analysis',
    'Understand how to integrate Claude into advisory workflows',
    'Develop a portfolio of AI-assisted professional work'
  ],
  legal: [
    'Use Claude to speed up contract drafting and review',
    'Improve quality of legal documents, memos and client letters',
    'Build AI-powered research and case summarisation workflows',
    'Learn responsible AI use in a legal and compliance context',
    'Prepare for AI governance and regulation in legal services',
    'Get ahead of peers in AI-enabled legal practice',
    'Automate routine client correspondence with Claude',
    'Develop a portfolio of AI-assisted legal work'
  ],
  security: [
    'Use Claude to save time on security documentation and reporting',
    'Build AI-powered risk, compliance and audit workflows',
    'Produce higher-quality deliverables for clients and stakeholders',
    'Automate threat intelligence and incident reporting with Claude',
    'Prepare for AI governance and responsible AI adoption in security',
    'Build Claude-powered workflows my team can adopt',
    'Get ahead of peers in AI capability within cybersecurity',
    'Develop a portfolio of AI-assisted security work'
  ],
  developer: [
    'Accelerate code review, documentation and testing with Claude',
    'Use Claude as a pair programmer for complex technical problems',
    'Build AI-powered tools, automations and integrations',
    'Learn prompt engineering for technical and engineering tasks',
    'Build Claude-powered products and developer-facing features',
    'Understand MCP, APIs and agentic AI architecture',
    'Get ahead of peers in AI-native software development',
    'Develop a portfolio of AI-assisted engineering projects'
  ],
  data: [
    'Use Claude to accelerate data analysis and insight generation',
    'Automate data documentation, model reporting and commentary',
    'Build AI-assisted analytical workflows and pipelines',
    'Improve quality of stakeholder-facing data stories and reports',
    'Learn prompt engineering for data and analytical tasks',
    'Prepare for AI governance, model ethics and responsible AI',
    'Get ahead of peers in AI-augmented analytics',
    'Develop a portfolio of AI-assisted data projects'
  ],
  hr_ops_marketing: [
    'Use Claude to draft policies, job descriptions and communications faster',
    'Build AI-assisted content and campaign workflows',
    'Automate routine reporting, briefing and operational documentation',
    'Improve consistency and quality of all professional copy with Claude',
    'Understand how to integrate AI responsibly into people and ops workflows',
    'Prepare for AI governance across business functions',
    'Get ahead of peers in AI-enabled operations and marketing',
    'Develop a portfolio of AI-assisted professional work'
  ],
  business: [
    'Use Claude to produce strategic documents and business proposals faster',
    'Improve quality of client presentations and stakeholder communications',
    'Build AI-powered operational workflows and automations',
    'Understand how to plan and govern AI adoption across a business',
    'Use Claude to analyse and synthesise business information faster',
    'Get ahead of peers in AI-enabled business leadership',
    'Prepare for AI governance and responsible deployment in your organisation',
    'Develop a portfolio of AI-assisted strategic work'
  ],
  student: [
    'Learn to use Claude confidently for research and professional work',
    'Build a portfolio of AI-assisted projects to show employers',
    'Use AI to accelerate skill development and learning',
    'Understand how professionals use Claude in real roles',
    'Prepare for a career where AI capability is a competitive advantage',
    'Learn prompt engineering and AI workflow design from scratch',
    'Get ahead of peers entering the workforce with AI skills',
    'Develop a professional profile demonstrating AI competence'
  ]
};

function getGoalsForRole(role) {
  if (!role || role === '__other__') return OB_GOALS_DEFAULT;
  const r = role.toLowerCase();
  if (/healthcare|doctor|nurse|psych|therap|clinic|gp|medical|allied/.test(r)) return OB_GOALS_MAP.clinical;
  if (/teacher|lectur|tutor|train|educat/.test(r)) return OB_GOALS_MAP.education;
  if (/finance|account|cpa|cima|acca|aca|cfa|financial/.test(r)) return OB_GOALS_MAP.finance;
  if (/legal|solicitor|barrister/.test(r)) return OB_GOALS_MAP.legal;
  if (/hr|operations|marketing|comms|communic|recruit|people ops/.test(r)) return OB_GOALS_MAP.hr_ops_marketing;
  if (/developer|software|data scien|data analy|data prof/.test(r)) return OB_GOALS_MAP.developer;
  if (/security|risk|grc|compliance|cyber|privacy|dpo|soc|threat/.test(r)) return OB_GOALS_MAP.security;
  if (/business owner|manager|consultant|entrepreneur|director/.test(r)) return OB_GOALS_MAP.business;
  if (/student|graduate|career changer|transitioning/.test(r)) return OB_GOALS_MAP.student;
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
    renderLanding,       // 0
    renderRoleStep,      // 1
    renderBackgroundStep,// 2 (combined frameworks + certs)
    renderExperienceStep,// 3
    renderGoalsStep,     // 4
    renderProficiencyStep,// 5
    renderTechLevelStep, // 6
    renderChallengeStep, // 7
    renderApiKeyStep     // 8
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
    <p class="landing-sub">30 days to Claude mastery — personalised to your role.<br>Build real AI skills your employer will notice.</p>
    <div class="landing-features">
      <div class="feat">10 Claude skill domains · 60 hands-on challenges · semantic grading</div>
      <div class="feat">Foundations → Prompting → Products → MCP → Agentic → Mastery</div>
      <div class="feat">Every scenario, example and rubric built for your actual job</div>
    </div>
    <button class="btn-primary" onclick="obNext()">Build my learning profile →</button>
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
  return obShell('What is your professional role?', 'Step 1 of 8', `
    <p class="ob-hint">Every challenge, worked example and Claude prompt is written for your specific role. This single answer shapes the entire curriculum — be as specific as you can.</p>
    <div class="ob-options" id="roleOpts">
      ${OB_ROLES.map(r => r === '__other__'
        ? `<button class="ob-opt ${OB.answers.role === '__other__' ? 'selected' : ''}" onclick="selectRole('__other__')">Something else</button>`
        : `<button class="ob-opt ${OB.answers.role === r ? 'selected' : ''}" onclick="selectRole(${JSON.stringify(r).replace(/"/g,'&quot;')})">${escapeHTML(r)}</button>`
      ).join('')}
    </div>
    ${OB.answers.role === '__other__' ? `
    <div style="margin-top:16px;">
      <input type="text" class="ob-input" id="roleOtherInput" placeholder="e.g. Clinical Psychologist, Product Manager, Pharmacist"
        value="${escapeHTML(OB.answers.roleOther)}" oninput="OB.answers.roleOther=this.value; updateObContinueBtn(this.value.trim().length>2);" style="width:100%;">
    </div>` : ''}
  `, false, !!OB.answers.role && (OB.answers.role !== '__other__' || OB.answers.roleOther.trim().length > 2));
}

function selectRole(r) {
  OB.answers.role = r;
  OB.answers.goals = []; // Reset goals so role-specific options are fresh
  renderOnboarding();
}

// ── Background (frameworks + certs combined) ──────────────────────────────────

function renderBackgroundStep() {
  return obShell('Your professional background', 'Step 2 of 8', `
    <p class="ob-hint">Optional, but helpful — Claude uses this to reference the right standards, terminology and professional context in every challenge scenario and worked example.</p>

    <div class="ob-step-subsection">Standards &amp; frameworks you work with</div>
    <div class="ob-options ob-options-multi">
      ${OB_BACKGROUND_FRAMEWORKS.map(f =>
        `<button class="ob-opt ${OB.answers.frameworks.includes(f) ? 'selected' : ''}" onclick="toggleArr('frameworks', ${JSON.stringify(f).replace(/"/g,'&quot;')})">${escapeHTML(f)}</button>`
      ).join('')}
    </div>
    <input type="text" class="ob-input" placeholder="Others — e.g. Basel III, NICE Guidelines, Ofsted, FCA Handbook, ICF" style="margin-top:10px;width:100%;margin-bottom:20px;"
      value="${escapeHTML(OB.answers.frameworksOther)}" oninput="OB.answers.frameworksOther=this.value">

    <div class="ob-step-subsection">Qualifications &amp; certifications</div>
    <div class="ob-options ob-options-multi">
      ${OB_BACKGROUND_CERTS.map(c =>
        `<button class="ob-opt ${OB.answers.certs.includes(c) ? 'selected' : ''}" onclick="toggleArr('certs', ${JSON.stringify(c).replace(/"/g,'&quot;')})">${escapeHTML(c)}</button>`
      ).join('')}
    </div>
    <input type="text" class="ob-input" placeholder="Others — e.g. CIPD L5, BPS Chartered, OSCP, MSc, CFA Level 2" style="margin-top:10px;width:100%;"
      value="${escapeHTML(OB.answers.certsOther)}" oninput="OB.answers.certsOther=this.value">
  `, true, true);
}

// ── Experience ────────────────────────────────────────────────────────────────

function renderExperienceStep() {
  return obShell('Years of professional experience', 'Step 3 of 8', `
    <p class="ob-hint">Calibrates the depth and assumed knowledge in your challenge scenarios. A challenge for a new graduate should feel different to one for a 10-year specialist — even if they are learning the same Claude skill.</p>
    <div class="ob-options">
      ${OB_EXPERIENCE.map(e =>
        `<button class="ob-opt ${OB.answers.experience === e ? 'selected' : ''}" onclick="OB.answers.experience=${JSON.stringify(e).replace(/"/g,'&quot;')};renderOnboarding()">${escapeHTML(e)}</button>`
      ).join('')}
    </div>
  `, true, !!OB.answers.experience);
}

// ── Goals ─────────────────────────────────────────────────────────────────────

function renderGoalsStep() {
  const roleKey = OB.answers.role === '__other__' ? OB.answers.roleOther : OB.answers.role;
  const goals = getGoalsForRole(roleKey);
  return obShell('What do you want to achieve with Claude?', 'Step 4 of 8', `
    <p class="ob-hint">Select up to 3. These shape the "Why this matters" framing in every challenge and the direction of your Day 28–30 Capstone project.</p>
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
    'Never used Claude or any AI tool',
    'Tried it once or twice out of curiosity',
    'Use it occasionally — mainly for simple tasks',
    'Use Claude or AI tools regularly in my work',
    'AI is a core part of how I work every day'
  ];
  return obShell('How much have you used Claude or AI tools?', 'Step 5 of 8', `
    <p class="ob-hint">This calibrates where your curriculum starts. If you are brand new, Day 1 will be fully explicit — no assumed knowledge. If you are already experienced, we skip the basics and go straight to the skills that will stretch you.</p>
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
    { value: 'none',        label: 'No-code', description: 'I prefer visual tools — no terminals, no scripting' },
    { value: 'guided',      label: 'Guided technical', description: 'I can follow step-by-step technical instructions' },
    { value: 'comfortable', label: 'Comfortable with code', description: 'I can read and modify code given documentation' },
    { value: 'developer',   label: 'Developer', description: 'I write code professionally or as a regular practice' }
  ];
  return obShell('Your technical comfort level', 'Step 6 of 8', `
    <p class="ob-hint">Controls how technical your MCP, API integration, and Agentic Workflow challenges become. No-code users learn the same skills through visual tools — there is no less-than in any option.</p>
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
  return obShell('Your hardest professional challenge', 'Step 7 of 8', `
    <p class="ob-hint">The most important input in your profile. Describe a real, current, specific problem in your work — something that costs you time, creates risk, or you have been putting off. Your Day 28–30 Capstone project is built directly from this. The more specific you are, the more useful the entire curriculum becomes.</p>
    <textarea class="ob-textarea" id="challengeInput" placeholder="Example: I spend 3–4 hours every week drafting the same types of reports. I want to build a Claude workflow that handles the first draft while I focus on the judgement calls — but I do not know how to structure it, and I have concerns about confidentiality."
      oninput="OB.answers.challenge=this.value; document.getElementById('challengeCount').textContent=this.value.length+' / 600'; updateObContinueBtn(this.value.trim().length>30);">${escapeHTML(OB.answers.challenge)}</textarea>
    <div class="ob-charcount" id="challengeCount">${OB.answers.challenge.length} / 600</div>
  `, true, OB.answers.challenge.trim().length > 30);
}

// ── API Key ───────────────────────────────────────────────────────────────────

function renderApiKeyStep() {
  return obShell('Connect your AI provider', 'Step 8 of 8', `
    <p class="ob-hint">Your curriculum generates directly via your API key — sent to the provider and never stored on our servers. Kept only in browser session memory; cleared automatically when you close the tab.</p>
    <div class="api-options" id="apiOptions">
      <button class="api-path-btn ${OB._apiPath === 1 || !OB._apiPath ? 'active' : ''}" onclick="setObApiPath(1)">Gemini API key <span class="badge-free">Free</span></button>
      <button class="api-path-btn ${OB._apiPath === 2 ? 'active' : ''}" onclick="setObApiPath(2)">Groq API key <span class="badge-free">Free</span></button>
    </div>
    <div id="apiSection1" style="display:${!OB._apiPath || OB._apiPath === 1 ? 'block' : 'none'}">
      <p class="ob-hint" style="margin-top:12px;">Get a free Gemini key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style="color:var(--blue);">aistudio.google.com</a>. Keys start with <code>AIza</code>.</p>
      <input type="password" class="ob-input" id="geminiKey" placeholder="AIza…" style="width:100%;"
        value="${escapeHTML(OB.apiKey)}" oninput="OB.apiKey=this.value.trim(); updateObApiKeyBtns(this.value);">
    </div>
    <div id="apiSection2" style="display:${OB._apiPath === 2 ? 'block' : 'none'}">
      <p class="ob-hint" style="margin-top:12px;">Get a free Groq key at <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" style="color:var(--blue);">console.groq.com</a>. Keys start with <code>gsk_</code>.</p>
      <input type="password" class="ob-input" id="groqKey" placeholder="gsk_…" style="width:100%;"
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
  const key = (OB.apiKey || '').trim();
  if (!key || key.length < 10) {
    showToast('API key required', 'Paste your API key before generating');
    return;
  }
  // Validate key format — prevents accidental pasting of the wrong value
  if (!key.startsWith('AIza') && !key.startsWith('gsk_')) {
    showToast('Unrecognised key format', 'Gemini keys start with AIza · Groq keys start with gsk_');
    return;
  }
  OB.apiKey = key; // Ensure trimmed value is stored
  generateCurriculum();
}

// ── Shared helpers ────────────────────────────────────────────────────────────

// canContinue: true = enabled button, false = disabled button (onclick still present), null = hide
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
  // API key step (8) — trigger generation
  if (OB.step === 8) { startGeneration(); return; }

  // Validate steps with required inputs
  if (OB.step === 1) {
    if (!OB.answers.role || (OB.answers.role === '__other__' && OB.answers.roleOther.trim().length <= 2)) return;
  }
  if (OB.step === 4) {
    if (OB.answers.goals.length === 0 && OB.answers.goalsOther.trim().length <= 2) return;
  }
  if (OB.step === 7) {
    if (OB.answers.challenge.trim().length <= 30) return;
  }

  OB.step = Math.min(OB.step + 1, 8);
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
