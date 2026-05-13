// ============================================================
// portfolio.js — Portfolio data collection, completion page,
// autoplay progression map, PDF export (@media print).
// ============================================================

// ── Portfolio entry creation ──────────────────────────────────────────────────

function addToPortfolio(challenge, submission, score, criteria, feedback, attemptNumber, assisted) {
  if (!challenge) return;
  const entry = {
    id:              challenge.id,
    title:           challenge.title || challenge.skill || '',
    skill:           challenge.skill || '',
    domain:          challenge.domain,
    domainName:      challenge.domainName || getDomainName(challenge.domain, STATE.profile),
    day:             challenge.day,
    submission:      submission.substring(0, 3000), // Cap at 3000 chars for storage
    score:           score,
    criteria:        criteria,
    feedback:        feedback,
    attemptNumber:   attemptNumber,
    firstAttemptPass: attemptNumber === 1 && score >= APP_CONFIG.PASS_THRESHOLD * 100,
    assisted:        assisted,
    completedAt:     new Date().toISOString(),
    xp:              challenge.xp,
  };
  // Remove any existing entry for this challenge (re-completion)
  STATE.portfolio = (STATE.portfolio || []).filter(p => p.id !== challenge.id);
  STATE.portfolio.push(entry);
}

// ── Completion screen ─────────────────────────────────────────────────────────

function renderCompletionPage() {
  const profile    = STATE.profile || {};
  const role       = profile.role === '__other__' ? (profile.roleOther || 'Professional') : (profile.role || 'Professional');
  const totalXP    = STATE.xp;
  const done       = STATE.completedIds.length;
  const firstPasses = (STATE.portfolio || []).filter(p => p.firstAttemptPass).length;
  const streak     = STATE.streak;
  const domains    = getAllDomainNames(profile);
  const dominated  = domains.filter((_, i) => (STATE.skillScores[i] || 0) >= 60).length;
  const dateStr    = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return `<div class="completion-page" id="completionPage">

  <!-- Certificate header -->
  <div class="certificate-header">
    <div class="cert-logo">⬡</div>
    <div class="cert-label">Certificate of Completion</div>
    <h1 class="cert-title">${APP_CONFIG.APP_NAME}</h1>
    <p class="cert-subtitle">30-Day AI Mastery Programme</p>
    <div class="cert-meta">
      <span class="cert-role">${escapeHTML(role)}</span>
      <span class="cert-date">${escapeHTML(dateStr)}</span>
    </div>
  </div>

  <!-- Stats -->
  <div class="completion-stats">
    <div class="c-stat"><div class="c-stat-val">${totalXP}</div><div class="c-stat-label">Total XP</div></div>
    <div class="c-stat"><div class="c-stat-val">${done}</div><div class="c-stat-label">Challenges completed</div></div>
    <div class="c-stat"><div class="c-stat-val">${firstPasses}</div><div class="c-stat-label">First-attempt passes</div></div>
    <div class="c-stat"><div class="c-stat-val">${dominated}/10</div><div class="c-stat-label">Domains mastered</div></div>
    <div class="c-stat"><div class="c-stat-val">${streak}</div><div class="c-stat-label">Day streak</div></div>
  </div>

  <!-- Progression map -->
  <div class="section-block">
    <div class="section-heading">Your 30-day growth</div>
    <p class="section-sub">Watch your Brain Map fill out as you progressed through the programme.</p>
    <div id="progressionMapContainer">${renderProgressionMap()}</div>
  </div>

  <!-- Final brain map -->
  <div class="section-block">
    <div class="section-heading">Final Brain Map</div>
    ${renderBrainMap()}
  </div>

  <!-- Portfolio -->
  <div class="section-block">
    <div class="section-heading">Your Portfolio</div>
    <p class="section-sub">${done} completed challenges across 10 domains. First-attempt passes are highlighted with ★.</p>
    ${renderPortfolioByDomain()}
  </div>

  <!-- Actions -->
  <div class="completion-actions no-print">
    <button class="btn-primary" onclick="exportPortfolioPDF()">↓ Download Portfolio PDF</button>
    ${STATE.challenges.filter(c => c.day > 30).length === 0
      ? '<button class="btn-secondary" onclick="enterAdvancedMode()">Continue to Advanced →</button>'
      : '<button class="btn-secondary" onclick="STATE.screen=\'app\';render();">Review your work</button>'}
  </div>

</div>`;
}

// ── Portfolio by domain ───────────────────────────────────────────────────────

function renderPortfolioByDomain() {
  const portfolio = STATE.portfolio || [];
  if (!portfolio.length) return '<div class="empty-state">No portfolio entries yet.</div>';

  const domains = getAllDomainNames(STATE.profile);
  let html = '';

  // Domains 0–8: regular entries. Domain 9 (Capstone, days 28–30) gets its own section below.
  for (let d = 0; d < 9; d++) {
    const entries = portfolio.filter(p => p.domain === d);
    if (!entries.length) continue;
    html += `<div class="portfolio-domain">
      <div class="portfolio-domain-header">${escapeHTML(domains[d] || 'Domain ' + (d + 1))}</div>
      ${entries.map(e => renderPortfolioEntry(e)).join('')}
    </div>`;
  }

  // Capstone section — domain 9 / days 28–30
  const capstone = portfolio.filter(p => p.domain === 9 || p.day >= 28);
  if (capstone.length) {
    html += `<div class="portfolio-domain portfolio-capstone">
      <div class="portfolio-domain-header">⬡ Capstone Project</div>
      ${capstone.map(e => renderPortfolioEntry(e, true)).join('')}
    </div>`;
  }

  return html;
}

function renderPortfolioEntry(entry, isCapstone) {
  const score = entry.score;
  const scoreDisplay = entry.assisted ? 'Reviewed' : (score + '%');
  const passed = entry.assisted || score >= APP_CONFIG.PASS_THRESHOLD * 100;

  return `<div class="portfolio-entry ${isCapstone ? 'capstone-entry' : ''}">
  <div class="pe-header">
    <div class="pe-title">
      ${entry.firstAttemptPass ? '<span class="first-pass-star">★</span> ' : ''}
      ${escapeHTML(entry.title)}
    </div>
    <div class="pe-meta">
      <span class="pe-day">Day ${entry.day}</span>
      <span class="pe-score ${passed ? 'pe-score-pass' : 'pe-score-partial'}">${escapeHTML(scoreDisplay)}</span>
      <span class="pe-xp">+${entry.xp} XP</span>
    </div>
  </div>
  ${entry.feedback
    ? '<div class="pe-feedback">' + escapeHTML(entry.feedback) + '</div>'
    : ''}
  ${entry.criteria && entry.criteria.length
    ? '<div class="pe-criteria">' +
        entry.criteria.map(cr =>
          '<span class="pe-criterion ' + (cr.met ? 'met' : 'unmet') + '">' + (cr.met ? '✓' : '✗') + ' ' + escapeHTML(cr.text) + '</span>'
        ).join('') +
      '</div>'
    : ''}
</div>`;
}

// ── Progression map (autoplay radar animation) ────────────────────────────────

function renderProgressionMap() {
  return `<div id="progressionMap" class="progression-map">
  <svg id="progressionSVG" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:380px;display:block;margin:0 auto;"></svg>
  <div style="text-align:center;margin-top:10px;">
    <div id="progressionDay" style="font-family:var(--mono);font-size:11px;color:var(--text3);letter-spacing:0.08em;">Day 1</div>
    <button onclick="playProgression()" id="progressionPlayBtn" class="btn-ghost" style="margin-top:8px;font-size:11px;">▶ Play</button>
  </div>
</div>`;
}

function playProgression() {
  const history = STATE.skillHistory || [];
  if (!history.length) return;

  const svg  = document.getElementById('progressionSVG');
  const dayEl = document.getElementById('progressionDay');
  const btn  = document.getElementById('progressionPlayBtn');
  if (!svg) return;

  btn.disabled = true;
  btn.textContent = '● Playing…';

  const n  = 10;
  const cx = 200, cy = 200, r = 150;
  const angle = i => (i / n) * Math.PI * 2 - Math.PI / 2;
  const pt = (i, radius) => {
    const a = angle(i);
    return [cx + radius * Math.cos(a), cy + radius * Math.sin(a)];
  };

  // Build static grid once
  const circumference = 2 * Math.PI * 36;
  const gridLines = [];
  [0.25, 0.5, 0.75, 1].forEach(frac => {
    const pts = Array.from({ length: n }, (_, i) => pt(i, r * frac).join(',')).join(' ');
    gridLines.push(`<polygon points="${pts}" fill="none" stroke="var(--border)" stroke-width="1" opacity="0.4"/>`);
  });
  for (let i = 0; i < n; i++) {
    const [x, y] = pt(i, r);
    gridLines.push(`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--border)" stroke-width="1" opacity="0.4"/>`);
  }
  const names = getAllDomainNames(STATE.profile);
  const labels = names.map((name, i) => {
    const [x, y] = pt(i, r + 22);
    const anchor = x < cx - 10 ? 'end' : x > cx + 10 ? 'start' : 'middle';
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="var(--mono)" font-size="7.5" fill="var(--text3)">${escapeHTML(name.substring(0, 16))}</text>`;
  }).join('');

  let frameIndex = 0;
  // Include a day-0 "empty" frame
  const frames = [{ day: 0, scores: {} }, ...history];

  function drawFrame(frame) {
    const scores = frame.scores || {};
    const skillPts = Array.from({ length: n }, (_, i) => {
      return pt(i, r * ((scores[i] || 0) / 100)).join(',');
    }).join(' ');
    const dots = Array.from({ length: n }, (_, i) => {
      const [x, y] = pt(i, r * ((scores[i] || 0) / 100));
      return `<circle cx="${x}" cy="${y}" r="3.5" fill="var(--accent)"/>`;
    }).join('');

    svg.innerHTML =
      gridLines.join('') +
      `<polygon points="${skillPts}" fill="rgba(232,213,176,0.1)" stroke="var(--accent)" stroke-width="2"/>` +
      dots + labels;

    if (dayEl) dayEl.textContent = frame.day === 0 ? 'Start' : ('Day ' + frame.day);
  }

  // Play all frames with 120ms interval
  const interval = setInterval(() => {
    drawFrame(frames[frameIndex]);
    frameIndex++;
    if (frameIndex >= frames.length) {
      clearInterval(interval);
      btn.disabled = false;
      btn.textContent = '▶ Replay';
    }
  }, 120);
}

// ── PDF export (@media print) ─────────────────────────────────────────────────

function exportPortfolioPDF() {
  window.print();
}
