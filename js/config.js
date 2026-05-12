// ============================================================
// config.js — Static configuration. Edit here to update
// domain curricula, role maps, ranks, or resource links.
// Never put logic here — only data.
// ============================================================

// ── 10 Universal Domains ─────────────────────────────────────────────────────
// Domains 0-4 and 7-9 are universal across all roles.
// Domains 5-6 are role-specific application (names/skills from ROLE_APPLICATION_MAPS).
// Each domain = 3 days × 2 challenges = 6 challenges per background fetch.

const DOMAIN_CURRICULA = [
  {
    index: 0,
    name: 'Claude Foundations',
    days: [1, 2, 3],
    skills: [
      'Context-setting and role assignment',
      'Multi-turn conversation structure and design',
      'Iterative refinement and critique loops',
      'Output quality evaluation',
      'Conversation memory and context management'
    ],
    keyTools: ['claude.ai'],
    concepts: [
      'What Claude is and how it processes context',
      'Hallucination awareness and verification habits',
      'When Claude excels vs when to use other tools',
      'Conversation design as a professional skill'
    ],
    beginnerNote: 'Users may be completely new to Claude. Every task step must be fully explicit. Assume zero prior AI experience.',
    techGate: 'none',
    promptDescription: 'Core conversation skills underpinning all Claude use. Build the habit of structured, iterative interaction rather than single-shot queries. Emphasis on professional-grade quality from the first conversation.'
  },
  {
    index: 1,
    name: 'Prompt Engineering',
    days: [4, 5, 6],
    skills: [
      'System prompt design and structure',
      'Few-shot prompting with annotated examples',
      'Chain-of-thought and structured reasoning prompts',
      'Output format specification and control',
      'Prompt debugging and systematic improvement'
    ],
    keyTools: ['claude.ai'],
    concepts: [
      'System vs user message roles',
      'Format control: JSON, markdown, tables, custom schemas',
      'Failure mode classification and remediation',
      'Prompt reusability and documentation'
    ],
    beginnerNote: 'Users are now comfortable with basic Claude interaction. Shift focus to precision, repeatability, and professional output quality.',
    techGate: 'none',
    promptDescription: 'Moving from conversation to engineered prompts. Building reliability, consistency, and professional-grade outputs through systematic design. Prompts as repeatable infrastructure, not one-off questions.'
  },
  {
    index: 2,
    name: 'Claude Products',
    days: [7, 8, 9],
    skills: [
      'Creating and iterating on Claude Artifacts',
      'Setting up and managing Claude Projects',
      'Knowledge upload and document integration',
      'Custom instructions and persistent personas',
      'Designing reusable specialist assistants'
    ],
    keyTools: ['Claude Artifacts', 'Claude Projects', 'Knowledge upload'],
    concepts: [
      'Artifact types: documents, code, SVG, React, HTML — when to use each',
      'Projects vs conversations: when persistence matters',
      'Knowledge base design for domain-specific assistants',
      'Artifact iteration and refinement patterns'
    ],
    beginnerNote: 'Users are moving beyond chat. Explain what each product feature does and why it matters before asking them to use it.',
    techGate: 'none',
    promptDescription: 'Expanding beyond chat into the Claude product ecosystem. Artifacts for reusable structured outputs, Projects for persistent domain-specific intelligence, knowledge upload for grounding Claude in professional context.'
  },
  {
    index: 3,
    name: 'MCP & Tool Integration',
    days: [10, 11, 12],
    skills: [
      'Understanding MCP architecture and purpose',
      'Connecting and configuring pre-built MCP servers',
      'Domain-relevant tool integration',
      'Cross-tool workflow design',
      'Security and access control considerations'
    ],
    keyTools: ['Claude Desktop', 'MCP servers', 'Notion MCP', 'GitHub MCP', 'Slack MCP'],
    concepts: [
      'What MCP is, why it was created, and what problem it solves',
      'MCP tools vs data sources: the distinction that matters',
      'Claude Desktop configuration and server setup',
      'The MCP server registry and available integrations',
      'When to use MCP vs Projects vs the API'
    ],
    beginnerNote: 'MCP is likely unfamiliar. Always start challenges with a plain-English explanation of what MCP is and why it matters in a professional context.',
    techGate: 'guided',
    promptDescription: 'Extending Claude\'s reach to external tools and live data. Connecting Claude to the tools professionals already use — calendars, project management, code repositories, communication platforms.'
  },
  {
    index: 4,
    name: 'Agentic Workflows',
    days: [13, 14, 15],
    skills: [
      'Designing multi-step autonomous task sequences',
      'Claude Code for file and system operations',
      'Claude in Chrome for browser-based automation',
      'Agentic pattern design and task decomposition',
      'Human-in-the-loop checkpoint design'
    ],
    keyTools: ['Claude Code', 'Claude in Chrome', 'Cowork'],
    concepts: [
      'Agentic AI: Claude as an actor, not just an advisor',
      'When to use agentic vs interactive Claude',
      'Task decomposition for multi-step automation',
      'Error handling and recovery in agentic workflows',
      'Cowork for non-technical desktop automation'
    ],
    beginnerNote: 'Agentic workflows are a conceptual shift. Start by explaining the difference between asking Claude a question and having Claude take actions on your behalf.',
    techGate: 'guided',
    promptDescription: 'Claude taking sequences of actions autonomously. Multi-step task execution, browser automation, file operations, and workflow orchestration. The shift from assistant to agent.'
  },
  {
    // Domain 5 — Role-specific core workflows. Names and skills from ROLE_APPLICATION_MAPS.
    index: 5,
    name: 'ROLE_APPLICATION_I',
    days: [16, 17, 18],
    skills: [], // Populated at runtime from ROLE_APPLICATION_MAPS
    keyTools: [],
    concepts: [],
    beginnerNote: 'Users have now covered all core Claude capabilities. Apply them rigorously to the user\'s specific professional context. Every challenge must produce a real, usable professional deliverable.',
    techGate: 'none',
    promptDescription: 'Core professional deliverables in the user\'s specific domain, accelerated and enhanced with Claude. Every challenge should produce something they could use at work tomorrow.'
  },
  {
    // Domain 6 — Role-specific advanced application.
    index: 6,
    name: 'ROLE_APPLICATION_II',
    days: [19, 20, 21],
    skills: [],
    keyTools: [],
    concepts: [],
    beginnerNote: 'Complex, high-stakes professional work. Users should be confident with Claude by now. Push for quality and specificity.',
    techGate: 'none',
    promptDescription: 'Advanced, complex, high-stakes outputs in the user\'s professional domain. Multi-capability approaches that combine prompting, artifacts, projects, and integrations.'
  },
  {
    index: 7,
    name: 'Building AI Systems',
    days: [22, 23, 24],
    skills: [
      'Designing prompt templates as reusable infrastructure',
      'Building and documenting personal prompt libraries',
      'AI workflow mapping and systematisation',
      'Quality gates and review process design',
      'Measuring and articulating AI impact on your work'
    ],
    keyTools: ['Claude Projects', 'Claude Artifacts', 'personal workflow tools'],
    concepts: [
      'The difference between ad-hoc AI use and systematic AI integration',
      'Prompt documentation and version thinking',
      'How to build AI workflows that colleagues can adopt',
      'Evaluating and communicating the value of AI investment'
    ],
    beginnerNote: 'Users are consolidating skills into systems. Focus on making their AI practice repeatable, transferable, and defensible.',
    techGate: 'none',
    promptDescription: 'Moving from ad-hoc AI use to systematic AI integration. Prompts as infrastructure, personal AI workflow design, and making individual excellence scalable and shareable.'
  },
  {
    index: 8,
    name: 'API & Custom Integration',
    days: [25, 26, 27],
    skills: [
      'Understanding the Claude API and its professional use cases',
      'No-code API integration via Zapier or Make',
      'Reading and applying API documentation',
      'Building simple programmatic integrations',
      'Custom tool development scaled to tech level'
    ],
    keyTools: ['Claude API', 'Zapier', 'Make.com', 'Anthropic SDK', 'Postman'],
    concepts: [
      'What an API is and why it matters for professional AI use',
      'Rate limits, token costs, and API vs claude.ai trade-offs',
      'Authentication and key management',
      'When to build vs use existing tools'
    ],
    beginnerNote: 'Scale technical depth strictly by techLevel. none=no-code tools only. guided=API concepts + Zapier. comfortable=guided API calls. developer=SDK and script building.',
    techGate: 'variable',
    promptDescription: 'Programmatic access to Claude. Depth scales strictly by tech level — no-code automation for non-technical professionals, SDK and custom tool building for developers. Same conceptual goals, different technical expressions.'
  },
  {
    index: 9,
    name: 'Capstone Project',
    days: [28, 29, 30],
    skills: [
      'Project scoping and brief writing',
      'Multi-capability Claude deployment',
      'Quality review and professional presentation',
      'Articulating AI capability growth over 30 days'
    ],
    keyTools: ['all tools covered in the programme'],
    concepts: [
      'Synthesis: applying the full programme to one real problem',
      'Building something portfolio-worthy and professionally presentable',
      'Honest reflection on where AI still falls short'
    ],
    beginnerNote: 'Users have completed 9 domains. They should feel genuinely capable. The capstone is their proof. Push for ambition and quality in equal measure.',
    techGate: 'variable',
    promptDescription: 'The culminating project. Must directly address the user\'s stated hardest professional challenge from onboarding. Must demonstrate at least three Claude capabilities working together. Produces a real, shareable professional artefact.'
  }
];

// ── Role-specific application maps (domains 5 and 6) ─────────────────────────
// Each entry: domain5Name, domain6Name, focus, domain5Skills[], domain6Skills[],
// deliverables[], frameworks[]
// For unlisted roles, buildCustomRoleApplication(profile) constructs a generic version.

const ROLE_APPLICATION_MAPS = {
  'GRC Consultant / Risk Manager / Risk Analyst / Information Security Auditor': {
    domain5Name: 'GRC Core Workflows',
    domain6Name: 'Advanced GRC & Risk Mastery',
    focus: 'Risk registers, gap analyses, control frameworks, audit reports, compliance policies, board-level risk reporting',
    domain5Skills: ['Risk identification and assessment with Claude', 'Compliance gap analysis workflows', 'Control framework documentation', 'Audit workpaper generation', 'Regulatory mapping and alignment'],
    domain6Skills: ['Board-level risk communication', 'Complex multi-framework GRC programme design', 'Crisis and incident response documentation', 'Regulatory examination preparation', 'Integrated risk reporting'],
    deliverables: ['risk registers', 'gap analyses', 'audit reports', 'compliance policies', 'board papers', 'control frameworks', 'SOAs', 'BCPs'],
    frameworks: ['ISO 27001', 'ISO 27005', 'ISO 42001', 'ISO 22301', 'NIST CSF', 'NIST RMF', 'SOC 2', 'GDPR', 'PCI DSS', 'DORA', 'CIS Controls']
  },
  'SOC Analyst / Threat Intelligence': {
    domain5Name: 'SOC Operations with Claude',
    domain6Name: 'Advanced Threat & Intelligence',
    focus: 'Alert triage automation, threat intelligence products, detection engineering, incident response workflows, SIEM/SOAR integration',
    domain5Skills: ['Alert triage workflow automation', 'Threat intel report generation', 'Detection rule documentation', 'Incident timeline construction', 'IOC enrichment and contextualisation'],
    domain6Skills: ['Advanced threat hunting with Claude', 'Attack campaign analysis and attribution', 'Strategic intelligence products', 'MITRE ATT&CK mapping workflows', 'Executive threat briefing creation'],
    deliverables: ['triage runbooks', 'threat intel reports', 'detection logic', 'IR playbooks', 'SIEM queries', 'executive briefings'],
    frameworks: ['MITRE ATT&CK', 'Cyber Kill Chain', 'Diamond Model', 'STIX/TAXII', 'NIST CSF']
  },
  'Penetration Tester / Red Team': {
    domain5Name: 'Pentest Operations with Claude',
    domain6Name: 'Advanced Red Team Application',
    focus: 'Pentest report writing, finding documentation, scoping, recon workflow design, client communication',
    domain5Skills: ['Finding documentation and classification', 'Pentest report structure and writing', 'Scope and rules of engagement documentation', 'Client communication drafting', 'Methodology documentation'],
    domain6Skills: ['Comprehensive pentest report creation', 'Executive summary and risk communication', 'Remediation roadmap development', 'Red team planning documentation', 'Complex multi-vector finding analysis'],
    deliverables: ['pentest reports', 'scoping documents', 'finding templates', 'client briefings', 'methodology docs', 'remediation roadmaps'],
    frameworks: ['OWASP', 'PTES', 'MITRE ATT&CK', 'CVSS', 'OSSTMM']
  },
  'CISO / Security Director / vCISO': {
    domain5Name: 'Security Leadership with Claude',
    domain6Name: 'Advanced Security Strategy',
    focus: 'Board communication, security strategy, vendor risk, budget justification, programme design, executive reporting',
    domain5Skills: ['Board paper and executive report creation', 'Security metrics and KPI communication', 'Vendor and third-party risk documentation', 'Security programme roadmap development', 'Budget justification and ROI analysis'],
    domain6Skills: ['Strategic security programme design', 'AI governance and oversight frameworks', 'Security risk appetite statements', 'Multi-year security strategy documents', 'Crisis communication and incident briefings'],
    deliverables: ['board papers', 'security strategies', 'risk appetite statements', 'vendor risk reports', 'programme roadmaps', 'executive briefings'],
    frameworks: ['NIST CSF', 'ISO 27001', 'COBIT', 'CIS Controls', 'DORA', 'AI governance frameworks']
  },
  'Security Engineer / Architect': {
    domain5Name: 'Security Engineering with Claude',
    domain6Name: 'Advanced Architecture & Design',
    focus: 'Architecture documentation, threat modelling, security requirements, code/config review, technical writing',
    domain5Skills: ['Architecture documentation with Claude', 'Threat model creation and documentation', 'Security requirements specification', 'Technical writing and standards documentation', 'Control design and specification'],
    domain6Skills: ['Complex architecture review documentation', 'Multi-tier threat modelling', 'Security design pattern documentation', 'Cross-domain technical specification writing', 'Code and configuration review workflows'],
    deliverables: ['architecture documents', 'threat models', 'security requirements', 'technical specs', 'review reports', 'control designs'],
    frameworks: ['STRIDE', 'MITRE ATT&CK', 'OWASP', 'NIST SP 800-53', 'CIS Benchmarks', 'TOGAF']
  },
  'Privacy Officer / DPO': {
    domain5Name: 'Privacy Operations with Claude',
    domain6Name: 'Advanced Privacy & AI Governance',
    focus: 'DPIA, privacy notices, data mapping, regulatory response, DSR management, AI privacy',
    domain5Skills: ['DPIA creation and documentation', 'Privacy notice and policy drafting', 'Data mapping and inventory workflows', 'Data subject request response templates', 'Breach notification drafting'],
    domain6Skills: ['Complex DPIA for AI and automated systems', 'Regulatory response and authority communication', 'Privacy-by-design framework documentation', 'AI governance and ISO 42001 application', 'Cross-border data transfer documentation'],
    deliverables: ['DPIAs', 'privacy notices', 'data maps', 'DSR templates', 'breach notifications', 'AI impact assessments'],
    frameworks: ['GDPR', 'UK GDPR', 'ISO 27701', 'ISO 42001', 'CCPA', 'ePrivacy']
  },
  'Business Continuity / Resilience Manager': {
    domain5Name: 'BC & Resilience with Claude',
    domain6Name: 'Advanced Resilience Programme Design',
    focus: 'BIA, BCP writing, crisis communication, exercising, ISO 22301 implementation',
    domain5Skills: ['Business impact analysis documentation', 'BCP structure and writing', 'Crisis communication plan creation', 'Exercise design and documentation', 'Recovery strategy documentation'],
    domain6Skills: ['Full BCMS documentation suite', 'Complex multi-site BCP design', 'ISO 22301 implementation programme', 'Resilience programme audit preparation', 'Executive crisis communication'],
    deliverables: ['BIAs', 'BCPs', 'exercise materials', 'crisis comms plans', 'BCMS documentation', 'readiness assessments'],
    frameworks: ['ISO 22301', 'ISO 31000', 'BCI GPG', 'NIST SP 800-34']
  },
  'Security Student / Career Transitioning': {
    domain5Name: 'Security Foundations with Claude',
    domain6Name: 'Career Portfolio & Certification Prep',
    focus: 'Portfolio building, foundational security analysis, certification study, interview preparation',
    domain5Skills: ['Security concept documentation and study aids', 'Practice analysis reports with Claude', 'Portfolio-quality deliverable creation', 'CVE and vulnerability documentation', 'Foundational security framework application'],
    domain6Skills: ['Comprehensive portfolio project creation', 'Certification study material generation', 'Interview preparation and scenario practice', 'Professional resume and profile writing', 'Job application and cover letter creation'],
    deliverables: ['portfolio pieces', 'study guides', 'practice analyses', 'sample reports', 'certification prep', 'career documents'],
    frameworks: ['CompTIA Security+', 'CEH', 'CISSP', 'NIST CSF', 'ISO 27001 foundations']
  }
};

// ── Rank system ───────────────────────────────────────────────────────────────
const RANK_THRESHOLDS = [
  { name: 'Beginner',       minXP: 0 },
  { name: 'Practitioner',   minXP: 500 },
  { name: 'Specialist',     minXP: 1500 },
  { name: 'Expert',         minXP: 3500 },
  { name: 'Master',         minXP: 7000 },
  { name: 'Distinguished',  minXP: 12000 }
];

// ── Curated Claude product resource links ─────────────────────────────────────
// Update these when Anthropic changes URLs. Gemini generates role/domain descriptions
// alongside these, but these URLs are hardcoded to avoid hallucination.
const CURATED_RESOURCE_LINKS = [
  { title: 'Claude.ai', url: 'https://claude.ai', description: 'The main Claude interface — where you do all challenge work' },
  { title: 'Claude Docs', url: 'https://docs.anthropic.com', description: 'Official Anthropic documentation' },
  { title: 'Claude Projects', url: 'https://claude.ai/projects', description: 'Build persistent, context-rich Claude assistants' },
  { title: 'Claude Code', url: 'https://docs.anthropic.com/en/docs/claude-code/overview', description: 'Agentic coding in your terminal' },
  { title: 'MCP Registry', url: 'https://github.com/modelcontextprotocol/servers', description: 'Browse available MCP servers to connect to Claude' },
  { title: 'Claude API', url: 'https://docs.anthropic.com/en/api/getting-started', description: 'Programmatic Claude access — build custom integrations' },
  { title: 'Prompt Engineering Guide', url: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview', description: 'Official Anthropic prompt engineering techniques' },
  { title: 'MCP Quickstart', url: 'https://modelcontextprotocol.io/quickstart', description: 'Get MCP working in 15 minutes' }
];

// ── App-wide settings ─────────────────────────────────────────────────────────
const APP_CONFIG = {
  PASS_THRESHOLD: 0.6,          // 60% to pass a challenge
  MIN_SUBMISSION_CHARS: 50,     // Minimum characters before grading fires
  GRADING_COOLDOWN_MS: 30000,   // 30 seconds between grading attempts
  MAX_ATTEMPTS: 3,              // Attempts before reveal-answer option shows
  BUFFER_DAYS_TRIGGER: 3,       // Background fetch when fewer than N days buffered
  INITIAL_BATCH_DAYS: [1, 3],   // dayStart, dayEnd for initial generation
  ADVANCED_DAYS: 5,             // Days in advanced mode
  ADVANCED_CHALLENGES: 10,      // Challenges in advanced mode (2/day)
  XP_ASSIST_MULTIPLIER: 1.0,    // Full XP even when assisted (reviewing answer)
  STORAGE_KEY: 'masterclaid_v3',// localStorage key (bumped from v1)
  SESSION_KEY: 'mcl_ak_s',      // sessionStorage key for API key
  APP_NAME: 'Master.ClAId',
};

// ── Tech level guidance injected into generation prompts ─────────────────────
const TECH_LEVEL_GUIDANCE = {
  none:        'User prefers no-code tools. Never suggest terminal, scripts, or code. Use Claude Projects, Artifacts, Zapier, Make.com, and visual MCP tools exclusively.',
  guided:      'User can follow technical step-by-step tutorials. May introduce simple MCP setup and guided API concepts. Avoid raw code; use Postman-style examples.',
  comfortable: 'User can read and modify code. May include code snippets to review or adapt. Explain what the code does before showing it.',
  developer:   'User writes code professionally. Include actual code examples, SDK usage, scripting, and custom MCP server concepts where relevant.'
};

// ── Domain name helpers ───────────────────────────────────────────────────────
// Returns the display name for a given domain index, accounting for role-specific domains.
function getDomainName(index, profile) {
  if (!profile) return DOMAIN_CURRICULA[index]?.name || `Domain ${index + 1}`;
  const roleApp = ROLE_APPLICATION_MAPS[profile.role] || buildCustomRoleApplication(profile);
  if (index === 5) return roleApp.domain5Name;
  if (index === 6) return roleApp.domain6Name;
  return DOMAIN_CURRICULA[index]?.name || `Domain ${index + 1}`;
}

// Returns all 10 domain names for a profile (used in sidebar, brain map, etc.)
function getAllDomainNames(profile) {
  return DOMAIN_CURRICULA.map((d, i) => getDomainName(i, profile));
}

// Returns current domain index from current day
function getDomainIndexFromDay(day) {
  return Math.min(Math.floor((day - 1) / 3), 9);
}

// Builds a role application object for custom (unlisted) roles
function buildCustomRoleApplication(profile) {
  const role = (profile && (profile.roleOther || profile.role)) || 'Professional';
  return {
    domain5Name: `${role} Core Workflows`,
    domain6Name: `Advanced ${role} Practice`,
    focus: `Core professional deliverables for ${role}, enhanced with Claude`,
    domain5Skills: [
      `Core ${role} documentation and analysis with Claude`,
      'Professional report and deliverable generation',
      'Research synthesis and summarisation',
      'Client and stakeholder communication drafting',
      'Domain-specific template and framework creation'
    ],
    domain6Skills: [
      `Advanced ${role} analysis with Claude`,
      'Complex, high-stakes deliverable creation',
      'Quality frameworks and review processes',
      'Strategic application and planning documents',
      'Portfolio-quality professional work'
    ],
    deliverables: ['professional reports', 'client deliverables', 'analysis outputs', 'strategic documents'],
    frameworks: []
  };
}
