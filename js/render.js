// ============================================================
// render.js — All app-screen rendering (not modal, not portfolio).
// Uses STATE and DOMAIN_CURRICULA. No API calls here.
// ============================================================

let currentTab = 'daily';

// ── Challenge helpers ─────────────────────────────────────────────────────────

function getTodayChallenges() {
  return (STATE.challenges || []).filter(c => c.day === STATE.currentDay);
}

function isChallengeCompleted(id) {
  return STATE.completedIds.some(cid => cid === id || cid === id + '_reviewed');
}

function canAdvanceDay() {
  const today = getTodayChallenges();
  if (!today.length) return false;
  const required = today.filter(c => c.required);
  const isDone = c => STATE.completedIds.some(id => id === c.id || id === c.id + '_reviewed');
  if (!required.length) return today.some(isDone); // All-optional day: complete any 1
  return required.every(isDone);
}

// ── Main app shell ────────────────────────────────────────────────────────────

function renderApp() {
  const rank   = getRankForXP(STATE.xp);
  const apiKey = getApiKey();
  const rl     = apiKey ? getRateLimitDisplay(apiKey) : null;
  // Rate limit badge — only shown for Groq keys with at least 1 call made today
  const rlBadge = (rl && rl.calls > 0)
    ? `<div class="rl-badge${rl.blocked ? ' rl-danger' : rl.warning ? ' rl-warn' : ''}"
          title="Groq API today: ${rl.calls}/${rl.maxCalls} calls · ${Math.round(rl.tokens/1000)}K/${Math.round(rl.maxTokens/1000)}K tokens">
          ${rl.calls}/${rl.maxCalls} calls
       </div>`
    : '';

  return `
<div class="app-shell">
  <div class="app-header">
    <div class="header-brand">
      <div class="header-logo">⬡</div>
      <div>
        <div class="header-title">${APP_CONFIG.APP_NAME}</div>
        <div style="font-family:var(--mono);font-size:9px;color:var(--text3);letter-spacing:0.14em;margin-top:2px;">${escapeHTML((STATE.profile?.role === '__other__' ? STATE.profile?.roleOther : STATE.profile?.role) || 'AI Mastery')}</div>
      </div>
    </div>
    <div class="header-actions">
      ${rlBadge}
      <div class="rank-display">${escapeHTML(rank.name)}</div>
      <span style="font-family:var(--mono);font-size:10px;color:var(--text3);letter-spacing:0.05em;">Day ${STATE.currentDay} · ${STATE.xp} XP</span>
      <button class="export-btn" onclick="exportSave()" title="Export save file">↓ Save</button>
      <button class="export-btn" onclick="triggerImport()" title="Import save file">↑ Load</button>
      <button class="header-btn" onclick="showSettingsPanel()" title="Settings &amp; reset" style="font-size:14px;padding:5px 10px;line-height:1;">⚙</button>
      <input type="file" id="importFile" class="import-input" accept=".json" onchange="importSave(event)">
    </div>
  </div>

  <div class="nav-tabs">
    <button class="nav-tab ${currentTab === 'daily'     ? 'active' : ''}" onclick="switchTab('daily')">Daily</button>
    <button class="nav-tab ${currentTab === 'brain'     ? 'active' : ''}" onclick="switchTab('brain')">Brain Map</button>
    <button class="nav-tab ${currentTab === 'log'       ? 'active' : ''}" onclick="switchTab('log')">Log</button>
    <button class="nav-tab ${currentTab === 'resources' ? 'active' : ''}" onclick="switchTab('resources')">Resources</button>
  </div>

  <div class="app-body">
    <aside class="sidebar">${renderSidebar()}</aside>
    <main class="main-panel">
      <div class="tab-panel ${currentTab === 'daily'     ? 'active' : ''}" id="panel-daily">${renderDaily()}</div>
      <div class="tab-panel ${currentTab === 'brain'     ? 'active' : ''}" id="panel-brain">${renderBrainMap()}</div>
      <div class="tab-panel ${currentTab === 'log'       ? 'active' : ''}" id="panel-log">${renderLog()}</div>
      <div class="tab-panel ${currentTab === 'resources' ? 'active' : ''}" id="panel-resources">${renderResourcesTab()}</div>
    </main>
  </div>
</div>
${renderModalOverlay()}`;
}

// ── Tab switching ─────────────────────────────────────────────────────────────

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  const panel = document.getElementById('panel-' + tab);
  if (panel) panel.classList.add('active');
  const tabs = document.querySelectorAll('.nav-tab');
  const names = ['daily', 'brain', 'log', 'resources'];
  tabs.forEach((t, i) => { if (names[i] === tab) t.classList.add('active'); });
  if (tab === 'brain')     { const bp = document.getElementById('panel-brain');     if (bp) bp.innerHTML = renderBrainMap(); }
  if (tab === 'log')       { const lp = document.getElementById('panel-log');       if (lp) lp.innerHTML = renderLog(); }
  if (tab === 'resources') { const rp = document.getElementById('panel-resources'); if (rp) rp.innerHTML = renderResourcesTab(); initResourcesIfNeeded(); }
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function renderSidebar() {
  const domainNames = getAllDomainNames(STATE.profile);
  const skillBars = domainNames.map((name, i) => {
    const score      = STATE.skillScores[i] || 0;
    const isComplete = score >= 100;
    return `<div class="skill-row">
      <div class="skill-row-top">
        <span class="skill-name">${escapeHTML(name)}</span>
        <span class="skill-pct${isComplete ? ' skill-pct-done' : ''}">${score}%${isComplete ? ' ✓' : ''}</span>
      </div>
      <div class="skill-bar"><div class="skill-bar-fill" style="width:${score}%;${isComplete ? 'background:var(--green);' : ''}"></div></div>
    </div>`;
  }).join('');

  const done = STATE.completedIds.length;
  return `
<div style="font-family:var(--mono);font-size:9px;letter-spacing:0.18em;color:var(--text3);text-transform:uppercase;margin-bottom:12px;">
  🔥 ${STATE.streak} day streak · ${done} done today
</div>
<div class="sidebar-section-label">Skill Progress</div>
<div class="skill-list">${skillBars}</div>
<div class="stat-row">
  <div class="stat-card"><div class="stat-label">Total XP</div><div class="stat-val">${STATE.xp}</div></div>
  <div class="stat-card"><div class="stat-label">Done</div><div class="stat-val">${done}</div></div>
</div>
<div class="callout" style="margin-top:16px;font-family:var(--serif);font-style:italic;font-size:13px;border:none;background:none;padding:0;color:var(--text3);">
  The best way to learn Claude is to use Claude.
</div>`;
}

// ── Daily panel ───────────────────────────────────────────────────────────────

function renderDaily() {
  const day  = STATE.currentDay;
  const chs  = getTodayChallenges();
  const req  = chs.filter(c => c.required);
  const bon  = chs.filter(c => !c.required);
  const domainName = getDomainName(getDomainIndexFromDay(day), STATE.profile);
  const reqDone  = req.filter(c => isChallengeCompleted(c.id)).length;
  const allDone  = canAdvanceDay();

  let html = `<div class="daily-header">
    <div>
      <div class="daily-day-label">Day ${day} of 30</div>
      <div class="daily-domain">${escapeHTML(domainName)}</div>
    </div>
    <div class="daily-progress-pill">${reqDone}/${req.length} required</div>
  </div>`;

  if (!chs.length) {
    html += `<div class="empty-state">
      ${STATE.challengesFetching
        ? 'Generating your next challenges… refresh in a moment.'
        : 'No challenges loaded for Day ' + day + '. Your curriculum may still be generating — try refreshing.'}
    </div>`;
  } else {
    if (req.length) {
      html += `<div class="ch-section-label">Required — complete to unlock tomorrow</div>`;
      html += req.map(c => renderChallengeCard(c)).join('');
    }
    if (bon.length) {
      html += `<div class="ch-section-label" style="margin-top:24px;">Bonus challenges</div>`;
      html += bon.map(c => renderChallengeCard(c)).join('');
    }

    if (allDone) {
      html += `<div class="advance-panel">
        <div>
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:4px;">Day ${day} complete.</div>
          <div style="font-family:var(--serif);font-style:italic;font-size:13px;color:var(--text2);">Required challenges done. Day ${day + 1} is unlocked.</div>
        </div>
        <button class="btn-complete" onclick="advanceDay()">Day ${day + 1} →</button>
      </div>`;
    }
  }

  if (STATE.challengesFetching) {
    html += '<div class="fetch-indicator">● Preparing your next challenges…</div>';
  }

  return html;
}

function renderChallengeCard(c) {
  const done      = STATE.completedIds.includes(c.id);
  const reviewed  = !done && STATE.completedIds.includes(c.id + '_reviewed');
  const assisted  = done && (STATE.assistedIds || []).includes(c.id);
  const anyDone   = done || reviewed;
  const attempts  = STATE.attempts[c.id] || 0;
  const diffLabel = ['', 'Foundational', 'Practitioner', 'Advanced', 'Expert', 'Master'][c.difficulty] || '';
  const diffClass = 'badge-diff-' + Math.min(c.difficulty, 3);

  return `<div class="challenge-card ${c.required ? 'required-card' : 'bonus-card'} ${anyDone ? 'completed' : ''}"
    onclick="openChallenge('${c.id}')" style="cursor:${anyDone ? 'default' : 'pointer'};">
  <div class="ch-top">
    <div class="ch-badges">
      <span class="badge badge-domain">${escapeHTML(c.domainName || '')}</span>
      <span class="badge ${c.required ? 'badge-required' : 'badge-bonus'}">${c.required ? 'Required' : 'Bonus'}</span>
      <span class="badge ${diffClass}">${escapeHTML(diffLabel)}</span>
      ${done && !assisted  ? '<span class="badge badge-done">✓ Complete</span>'    : ''}
      ${assisted           ? '<span class="badge badge-assist">✓ Reviewed</span>'  : ''}
      ${reviewed           ? '<span class="badge" style="color:var(--text3);background:var(--bg3);border:1px solid var(--border);">Reviewed</span>' : ''}
      ${attempts > 0 && !anyDone ? `<span class="badge" style="color:var(--orange);background:rgba(242,153,74,0.08);border:1px solid rgba(242,153,74,0.2);">Attempt ${attempts}/3</span>` : ''}
    </div>
    <div class="ch-xp">+${c.xp} XP</div>
  </div>
  <div class="ch-title">${escapeHTML(c.title || c.skill || '')}</div>
  <div class="ch-desc">${escapeHTML((c.scenario || c.taskFrame || '').substring(0, 180))}${(c.scenario || '').length > 180 ? '…' : ''}</div>
  <div class="ch-meta">
    <span>⏱ ${escapeHTML(c.timeEst || '20–30 min')}</span>
    ${c.realWorldOutput ? '<span>🎯 ' + escapeHTML(c.realWorldOutput) + '</span>' : ''}
    <span style="margin-left:auto;">→</span>
  </div>
</div>`;
}

// ── Day advance ───────────────────────────────────────────────────────────────

function advanceDay() {
  const hasAdvanced = STATE.challenges.filter(c => c.day > 30).length > 0;
  const maxDay = hasAdvanced ? 35 : 30;

  // Guard — don't advance past the real end
  if (STATE.currentDay > maxDay) {
    STATE.screen = 'complete';
    render();
    return;
  }

  captureSkillSnapshot();
  STATE.currentDay = Math.min(STATE.currentDay + 1, maxDay + 1);
  updateCurrentDomain();
  touchStreak();
  saveState();
  triggerBackgroundFetch();

  // Completion conditions:
  // 1. Finished core 30 days with no advanced challenges loaded
  // 2. Finished all 35 advanced days
  if ((STATE.currentDay > 30 && !hasAdvanced) || STATE.currentDay > 35) {
    STATE.screen = 'complete';
    render();
  } else {
    currentTab = 'daily';
    render();
  }
}

// ── Brain map ─────────────────────────────────────────────────────────────────

function renderBrainMap() {
  const names  = getAllDomainNames(STATE.profile);
  const scores = names.map((n, i) => ({ name: n, score: STATE.skillScores[i] || 0 }));
  const n = scores.length; // 10
  const cx = 240, cy = 240, r = 165;
  const angle = i => (i / n) * Math.PI * 2 - Math.PI / 2;
  const pt = (i, radius) => {
    const a = angle(i);
    return [cx + radius * Math.cos(a), cy + radius * Math.sin(a)];
  };

  // Grid rings
  let gridSvg = '';
  [0.25, 0.5, 0.75, 1].forEach(frac => {
    const pts = Array.from({ length: n }, (_, i) => pt(i, r * frac).join(',')).join(' ');
    gridSvg += `<polygon points="${pts}" fill="none" stroke="var(--border)" stroke-width="1" opacity="0.5"/>`;
  });
  // Spokes
  for (let i = 0; i < n; i++) {
    const [x, y] = pt(i, r);
    gridSvg += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--border)" stroke-width="1" opacity="0.5"/>`;
  }

  // Score polygon
  const skillPts = scores.map((s, i) => pt(i, r * (s.score / 100)).join(',')).join(' ');

  // Labels — placed outside the data ring, with overflow:visible to prevent clipping
  let labelsSvg = '';
  scores.forEach((s, i) => {
    const [x, y] = pt(i, r + 36);
    const anchor = x < cx - 8 ? 'end' : x > cx + 8 ? 'start' : 'middle';
    // Two-line label: wrap at 16 chars
    const name = s.name;
    const line1 = name.length <= 16 ? name : name.substring(0, 16);
    const line2 = name.length > 16 ? name.substring(16, 30) : '';
    const dy2 = line2 ? 13 : 0;
    labelsSvg += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" font-family="'JetBrains Mono','Courier New',monospace" font-size="10.5" fill="var(--text2)" letter-spacing="0.02em">` +
      `<tspan x="${x.toFixed(1)}" dy="0">${escapeHTML(line1)}</tspan>` +
      (line2 ? `<tspan x="${x.toFixed(1)}" dy="13">${escapeHTML(line2)}</tspan>` : '') +
      `</text>`;
  });

  return `<div class="brain-map-wrap">
  <div class="panel-heading">Brain Map</div>
  <p style="font-size:13px;color:var(--text2);margin-bottom:20px;">Your skill coverage across all 10 domains. Updates as you complete challenges.</p>
  <div style="overflow:visible;padding:0 48px;">
  <svg viewBox="0 0 480 480" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:560px;display:block;margin:0 auto;overflow:visible;">
    ${gridSvg}
    <polygon points="${skillPts}" fill="rgba(232,213,176,0.12)" stroke="var(--accent)" stroke-width="2"/>
    ${scores.map((s, i) => {
      const [x, y] = pt(i, r * (s.score / 100));
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="var(--accent)"/>`;
    }).join('')}
    ${labelsSvg}
  </svg>
  </div>
  <div class="domain-score-list">
    ${scores.map((s, i) => `
      <div class="domain-score-row">
        <span class="domain-score-name">${escapeHTML(s.name)}</span>
        <div class="domain-score-bar"><div class="domain-score-fill" style="width:${s.score}%"></div></div>
        <span class="domain-score-pct">${s.score}%</span>
      </div>`).join('')}
  </div>
</div>`;
}

// ── Activity log ──────────────────────────────────────────────────────────────

function renderLog() {
  const log = [...(STATE.log || [])].reverse();
  if (!log.length) return `<div class="empty-state">No activity yet. Complete your first challenge to see your log.</div>`;

  return `<div class="panel-heading">Activity Log</div>
  <div class="log-list">
    ${log.map(e => `
      <div class="log-entry">
        <div class="log-meta">
          <span class="log-date">${escapeHTML(e.date || '')}</span>
          <span class="log-day">Day ${e.day || 1}</span>
        </div>
        <div class="log-title">${escapeHTML(e.title || '')}</div>
        <div class="log-right">
          ${e.score === 'reviewed'
            ? '<div class="log-score" style="color:var(--accent2);">reviewed</div>'
            : e.score ? `<div class="log-score">${e.score}%</div>` : ''}
          <div class="log-xp">+${e.xp || 0} XP</div>
        </div>
      </div>`).join('')}
  </div>`;
}

// ── Generating screen ─────────────────────────────────────────────────────────

function renderGenerating() {
  const circumference = 2 * Math.PI * 36;
  return `<div class="generating-screen">
  <div class="gen-inner">
    <div class="gen-ring-wrap">
      <svg viewBox="0 0 80 80" class="gen-ring-svg">
        <circle cx="40" cy="40" r="36" fill="none" stroke="var(--bg3)" stroke-width="6"/>
        <circle id="genRing" cx="40" cy="40" r="36" fill="none" stroke="var(--accent)" stroke-width="6"
          stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}"
          stroke-linecap="round"
          style="transition:stroke-dashoffset 0.5s ease;"/>
      </svg>
      <div id="genPct" class="gen-pct-text">0%</div>
    </div>
    <div id="genStatus" class="gen-status">Preparing…</div>
    <div class="gen-sub">Generating your first 3 days of challenges.<br>Optimised for speed — typically 45–70 seconds.</div>
    <div style="margin-top:20px;display:flex;flex-direction:column;align-items:center;gap:8px;">
      <div id="genElapsed" style="font-family:var(--mono);font-size:11px;color:var(--text3);letter-spacing:0.08em;">Elapsed: 0s</div>
      <div style="font-family:var(--mono);font-size:10px;color:var(--text3);letter-spacing:0.06em;max-width:460px;text-align:center;line-height:1.7;">
        Your first 3 days generate now. The rest load silently as you progress.
      </div>
    </div>
  </div>
</div>`;
}

// ── Resources tab (shell — content loaded by resources.js) ───────────────────

function renderResourcesTab() {
  if (STATE.resources) {
    return renderResourcesContent(STATE.resources);
  }
  return `<div class="panel-heading">Resources</div>
  <div id="resources-loading" class="empty-state">Loading resources for this domain…</div>`;
}
