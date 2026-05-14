// ============================================================
// state.js — Central application state, persistence, and
// session management. All STATE mutations go through here.
// ============================================================

let STATE = {
  screen: 'landing',          // landing | onboarding | generating | app | complete
  profile: null,              // Saved onboarding answers (no API key)
  apiKey: null,               // Never persisted — session only
  challenges: [],             // All generated challenge objects
  completedIds: [],           // IDs of completed challenges (plain = clean pass)
  assistedIds: [],            // IDs completed after viewing answer
  scores: {},                 // { challengeId: score% }
  attempts: {},               // { challengeId: attemptCount }
  skillScores: {},            // { domainIndex: 0-100 }
  skillHistory: [],           // [ { day, scores: { 0: n, 1: n, ... } } ]
  xp: 0,
  streak: 0,
  lastActiveDate: null,
  daysActive: 0,
  currentDay: 1,
  currentDomain: 0,           // 0-9, which domain user is currently in
  log: [],                    // Activity log entries
  reflections: {},            // { challengeId: submissionText }
  portfolio: [],              // Passed challenge portfolio entries
  resources: null,            // Cached resources for current domain
  resourcesDomain: -1,        // Domain index when resources were last generated
  generated: false,
  profileLocked: false,
  lastGeneratedDay: 0,        // Highest day number in STATE.challenges
  challengesFetching: false,
  gradingInProgress: false,
};

// ── Persistence ───────────────────────────────────────────────────────────────

function saveState() {
  // Never persist apiKey to localStorage
  const save = Object.assign({}, STATE);
  delete save.apiKey;
  delete save.gradingInProgress; // Transient flag — always reset on load
  try {
    localStorage.setItem(APP_CONFIG.STORAGE_KEY, JSON.stringify(save));
  } catch (e) {
    console.warn('[State] Save failed:', e.message);
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(APP_CONFIG.STORAGE_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    STATE = Object.assign({}, STATE, saved);
    // Always reset transient flags on load
    STATE.apiKey = null;
    STATE.gradingInProgress = false;
    STATE.challengesFetching = false;
    // Ensure new fields exist (forward-compatibility)
    STATE.assistedIds    = STATE.assistedIds    || [];
    STATE.portfolio      = STATE.portfolio      || [];
    STATE.skillHistory   = STATE.skillHistory   || [];
    STATE.resources      = STATE.resources      || null;
    STATE.resourcesDomain = STATE.resourcesDomain !== undefined ? STATE.resourcesDomain : -1;
    STATE.currentDomain  = STATE.currentDomain  || 0;
    return true;
  } catch (e) {
    console.warn('[State] Load failed:', e.message);
    return false;
  }
}

function resetStateToDefaults() {
  STATE = {
    screen: 'landing', profile: null, apiKey: null, challenges: [],
    completedIds: [], assistedIds: [], scores: {}, attempts: {},
    skillScores: {}, skillHistory: [], xp: 0, streak: 0,
    lastActiveDate: null, daysActive: 0, currentDay: 1, currentDomain: 0,
    log: [], reflections: {}, portfolio: [], resources: null, resourcesDomain: -1,
    generated: false, profileLocked: false, lastGeneratedDay: 0,
    challengesFetching: false, gradingInProgress: false,
  };
}

// ── Session API key management ────────────────────────────────────────────────

function storeApiKeyForSession(key) {
  if (!key) return;
  STATE.apiKey = key;
  try { sessionStorage.setItem(APP_CONFIG.SESSION_KEY, key); } catch (e) {}
}

function getApiKey() {
  if (STATE.apiKey) return STATE.apiKey;
  try { return sessionStorage.getItem(APP_CONFIG.SESSION_KEY) || null; } catch (e) { return null; }
}

function clearApiKeySession() {
  STATE.apiKey = null;
  try { sessionStorage.removeItem(APP_CONFIG.SESSION_KEY); } catch (e) {}
}

// ── Streak management ─────────────────────────────────────────────────────────

function touchStreak() {
  const today = new Date().toDateString();
  if (STATE.lastActiveDate === today) return;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  STATE.streak = STATE.lastActiveDate === yesterday ? STATE.streak + 1 : 1;
  STATE.lastActiveDate = today;
  STATE.daysActive = (STATE.daysActive || 0) + 1;
}

// ── Rank lookup ───────────────────────────────────────────────────────────────

function getRankForXP(xp) {
  let rank = RANK_THRESHOLDS[0];
  for (const r of RANK_THRESHOLDS) {
    if (xp >= r.minXP) rank = r;
  }
  return rank;
}

// ── Domain tracking ───────────────────────────────────────────────────────────

function updateCurrentDomain() {
  const newDomain = getDomainIndexFromDay(STATE.currentDay);
  if (newDomain !== STATE.currentDomain) {
    STATE.currentDomain = newDomain;
    // Invalidate resources cache when domain changes
    if (STATE.resourcesDomain !== newDomain) {
      STATE.resources = null;
    }
  }
}

// ── Skill score recalculation ─────────────────────────────────────────────────
// Completion-based: score = (required challenges passed / total required) × 100.
// A domain reaches 100% only when ALL required challenges in it are completed.
// Assisted completions (answer-revealed) do NOT count toward the score.

function recalculateSkillScores() {
  const scores = {};
  for (let d = 0; d < 10; d++) {
    const required = (STATE.challenges || []).filter(c => c.domain === d && c.required === true);
    if (!required.length) {
      // No required challenges generated yet — preserve existing score
      scores[d] = STATE.skillScores[d] || 0;
      continue;
    }
    // Only clean passes (not assisted) count for the 100% threshold
    const passed = required.filter(c => STATE.completedIds.includes(c.id)).length;
    scores[d] = Math.round((passed / required.length) * 100);
  }
  return scores;
}

// ── Skill history snapshot ────────────────────────────────────────────────────
// Called every time the user advances a day

function captureSkillSnapshot() {
  const snapshot = {
    day: STATE.currentDay,
    scores: Object.assign({}, STATE.skillScores)
  };
  STATE.skillHistory.push(snapshot);
}

// ── Import/Export ─────────────────────────────────────────────────────────────

const SAFE_IMPORT_FIELDS = [
  'screen', 'profile', 'challenges', 'completedIds', 'assistedIds',
  'scores', 'attempts', 'skillScores', 'skillHistory', 'xp', 'streak',
  'lastActiveDate', 'daysActive', 'currentDay', 'currentDomain', 'log',
  'reflections', 'portfolio', 'resources', 'resourcesDomain', 'generated',
  'profileLocked', 'lastGeneratedDay'
];

function exportSave() {
  const data = {};
  SAFE_IMPORT_FIELDS.forEach(f => { if (STATE[f] !== undefined) data[f] = STATE[f]; });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'masterclaid-save-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Save exported', 'Keep this file to restore your progress');
}

function triggerImport() {
  document.getElementById('importFile')?.click();
}

function importSave(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!data || typeof data !== 'object') throw new Error('Invalid format');
      SAFE_IMPORT_FIELDS.forEach(f => {
        if (data[f] !== undefined) STATE[f] = data[f];
      });
      // Sanitise and bound array fields to prevent memory exhaustion or injection
      if (!Array.isArray(STATE.challenges))   STATE.challenges   = [];
      if (!Array.isArray(STATE.completedIds)) STATE.completedIds = [];
      if (!Array.isArray(STATE.assistedIds))  STATE.assistedIds  = [];
      if (!Array.isArray(STATE.portfolio))    STATE.portfolio    = [];
      if (!Array.isArray(STATE.log))          STATE.log          = [];
      if (!Array.isArray(STATE.skillHistory)) STATE.skillHistory = [];
      // Hard size caps — imported files over these limits are likely corrupted or crafted
      if (STATE.challenges.length   > 300) STATE.challenges   = STATE.challenges.slice(0, 300);
      if (STATE.completedIds.length > 600) STATE.completedIds = STATE.completedIds.slice(0, 600);
      if (STATE.assistedIds.length  > 300) STATE.assistedIds  = STATE.assistedIds.slice(0, 300);
      if (STATE.portfolio.length    > 300) STATE.portfolio    = STATE.portfolio.slice(0, 300);
      if (STATE.log.length          > 500) STATE.log          = STATE.log.slice(0, 500);
      if (STATE.skillHistory.length > 100) STATE.skillHistory = STATE.skillHistory.slice(0, 100);
      // [A08] Clamp numeric fields to valid ranges to prevent crafted saves from
      // causing rendering failures, infinite loops, or unexpected UI states.
      STATE.currentDay        = Math.max(1, Math.min(35,   parseInt(STATE.currentDay, 10)        || 1));
      STATE.currentDomain     = Math.max(0, Math.min(9,    parseInt(STATE.currentDomain, 10)     || 0));
      STATE.xp                = Math.max(0, Math.min(999999, parseInt(STATE.xp, 10)              || 0));
      STATE.streak            = Math.max(0, Math.min(3650, parseInt(STATE.streak, 10)            || 0));
      STATE.daysActive        = Math.max(0, Math.min(3650, parseInt(STATE.daysActive, 10)        || 0));
      STATE.lastGeneratedDay  = Math.max(0, Math.min(35,   parseInt(STATE.lastGeneratedDay, 10)  || 0));
      STATE.apiKey = null;
      STATE.challengesFetching = false;
      STATE.gradingInProgress = false;
      saveState();
      render();
      showToast('Save imported', 'Your progress has been restored');
    } catch (err) {
      showToast('Import failed', 'File format invalid — check you selected the right file');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ── Progress UI refresh ───────────────────────────────────────────────────────
// Called after any state change that should reflect in persistent UI elements

function refreshProgressUI() {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) sidebar.innerHTML = renderSidebar();
  const xpEl = document.querySelector('.header-actions > span');
  if (xpEl) xpEl.textContent = 'Day ' + STATE.currentDay + ' · ' + STATE.xp + ' XP';
  if (currentTab === 'brain') {
    const bp = document.getElementById('panel-brain');
    if (bp) bp.innerHTML = renderBrainMap();
  }
  if (currentTab === 'log') {
    const lp = document.getElementById('panel-log');
    if (lp) lp.innerHTML = renderLog();
  }
}
