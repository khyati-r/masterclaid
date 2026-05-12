// ============================================================
// settings.js — Settings overlay: reset progress, reset all.
// ============================================================

function showSettingsPanel() {
  const existing = document.getElementById('settingsOverlay');
  if (existing) { existing.remove(); return; }

  const el = document.createElement('div');
  el.id = 'settingsOverlay';
  el.setAttribute('style',
    'position:fixed;inset:0;background:rgba(0,0,0,0.78);backdrop-filter:blur(8px);' +
    'z-index:300;display:flex;align-items:center;justify-content:center;padding:24px;');
  el.onclick = e => { if (e.target === el) closeSettings(); };

  el.innerHTML =
    '<div style="background:var(--bg2);border:1px solid var(--border2);border-radius:18px;width:100%;max-width:520px;padding:36px;">' +
      '<div style="font-family:var(--mono);font-size:10px;letter-spacing:0.18em;color:var(--text3);text-transform:uppercase;margin-bottom:8px;">Settings</div>' +
      '<div style="font-size:20px;font-weight:600;color:var(--text);margin-bottom:24px;">Profile &amp; Reset</div>' +
      '<div style="display:flex;flex-direction:column;gap:14px;">' +

        // Reset progress only
        '<div style="background:var(--bg3);border:1px solid rgba(242,153,74,0.2);border-radius:12px;padding:20px 24px;">' +
          '<div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px;">Reset progress only</div>' +
          '<div style="font-size:13px;color:var(--text2);line-height:1.7;margin-bottom:16px;">Wipes XP, streak, challenges, and log. <strong style="color:var(--accent);">Keeps your profile.</strong> Regenerates your curriculum from saved answers.</div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
            '<button onclick="exportSave()" style="background:none;border:1px solid var(--border2);color:var(--text2);font-family:var(--mono);font-size:10px;padding:8px 14px;border-radius:6px;cursor:pointer;letter-spacing:0.04em;">↓ Export save first</button>' +
            '<button onclick="resetProgressOnly()" style="background:rgba(242,153,74,0.1);border:1px solid rgba(242,153,74,0.4);color:var(--orange);font-family:var(--mono);font-size:10px;padding:8px 14px;border-radius:6px;cursor:pointer;letter-spacing:0.04em;">Reset Progress →</button>' +
          '</div>' +
        '</div>' +

        // Reset everything
        '<div style="background:var(--bg3);border:1px solid rgba(248,113,113,0.2);border-radius:12px;padding:20px 24px;">' +
          '<div style="font-size:14px;font-weight:600;color:var(--red);margin-bottom:6px;">Reset everything</div>' +
          '<div style="font-size:13px;color:var(--text2);line-height:1.7;margin-bottom:16px;">Deletes profile, curriculum, and all progress. Returns to landing. <strong style="color:var(--red);">Cannot be undone.</strong></div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
            '<button onclick="exportSave()" style="background:none;border:1px solid var(--border2);color:var(--text2);font-family:var(--mono);font-size:10px;padding:8px 14px;border-radius:6px;cursor:pointer;letter-spacing:0.04em;">↓ Export save first</button>' +
            '<button onclick="resetEverything()" style="background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.4);color:var(--red);font-family:var(--mono);font-size:10px;padding:8px 14px;border-radius:6px;cursor:pointer;letter-spacing:0.04em;">Delete Everything →</button>' +
          '</div>' +
        '</div>' +

      '</div>' +
      '<button onclick="closeSettings()" style="margin-top:20px;background:none;border:1px solid var(--border);color:var(--text3);font-family:var(--mono);font-size:11px;padding:10px 20px;border-radius:8px;cursor:pointer;width:100%;">Close</button>' +
    '</div>';

  document.body.appendChild(el);
}

function closeSettings() {
  const el = document.getElementById('settingsOverlay');
  if (el) el.remove();
}

function resetProgressOnly() {
  if (!confirm(
    'Reset all progress?\n\nYour profile answers are kept. XP, streak, challenges, and log are cleared. You will regenerate your curriculum.'
  )) return;
  closeSettings();

  const profile = STATE.profile;
  const key = getApiKey();

  STATE.completedIds = []; STATE.assistedIds = []; STATE.scores = {};
  STATE.attempts = {}; STATE.skillScores = {}; STATE.skillHistory = [];
  STATE.xp = 0; STATE.streak = 0; STATE.lastActiveDate = null;
  STATE.daysActive = 0; STATE.currentDay = 1; STATE.currentDomain = 0;
  STATE.log = []; STATE.reflections = {}; STATE.portfolio = [];
  STATE.generated = false; STATE.challenges = [];
  STATE.lastGeneratedDay = 0; STATE.challengesFetching = false;
  STATE.resources = null; STATE.resourcesDomain = -1;
  STATE.profile = profile;
  saveState();

  if (profile && key) {
    OB.answers = Object.assign({}, profile);
    OB.apiKey  = key;
    OB.step    = 9; // Jump to API key step
    generateCurriculum();
  } else {
    OB.answers = Object.assign({}, profile || OB.answers);
    OB.step = 9;
    STATE.screen = 'onboarding';
    render();
    showToast('Enter your API key to regenerate', 'Your profile is intact');
  }
}

function resetEverything() {
  if (!confirm(
    'Delete everything — profile, curriculum, and all progress — and return to the start?\n\nThis cannot be undone.'
  )) return;
  closeSettings();

  try { localStorage.removeItem(APP_CONFIG.STORAGE_KEY); } catch (e) {}
  clearApiKeySession();
  resetStateToDefaults();
  OB = {
    step: 0, _apiPath: 1, apiKey: '',
    answers: {
      role: '', roleOther: '', frameworks: [], frameworksOther: '',
      experience: '', certs: [], certsOther: '', goals: [], goalsOther: '',
      proficiency: '', techLevel: 'none', challenge: ''
    }
  };
  render();
}
