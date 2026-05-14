// ============================================================
// modal.js — Challenge modal. 3-step flow:
// 0:Brief (Learn + Example) → 1:Task → 2:Submit/Review
// Grading is delegated to grading.js (gradeWithGemini).
// ============================================================

let MODAL = {
  challenge:          null,
  step:               0,
  hintsUsed:          [],
  submission:         '',
  scored:             false,
  scoreData:          null,
  maxAttemptsReached: false,
  answerRevealed:     false,
  gradingInProgress:  false,
  gradingError:       null,
};

const MODAL_STEPS = ['Brief', 'Task', 'Submit'];

// ── Open / Close ──────────────────────────────────────────────────────────────

function openChallenge(id) {
  const c = (STATE.challenges || []).find(ch => ch.id === id);
  if (!c) return;
  MODAL = {
    challenge:          c,
    step:               0,
    hintsUsed:          [],
    submission:         STATE.reflections[id] || '',
    scored:             false,
    scoreData:          null,
    maxAttemptsReached: false,
    answerRevealed:     false,
    gradingInProgress:  false,
    gradingError:       null,
  };
  // If already completed, jump straight to review (step 2)
  if (STATE.completedIds.some(cid => cid === id || cid === id + '_reviewed')) {
    MODAL.step = 2;
  }
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.classList.add('open');
  renderModal();
}

function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.classList.remove('open');
  MODAL.challenge = null;
  MODAL.gradingInProgress = false;
  STATE.gradingInProgress = false;
}

function modalBack() {
  if (MODAL.step > 0) {
    MODAL.step--;
    renderModal();
  }
}

// ── Main render ───────────────────────────────────────────────────────────────

function renderModal() {
  const c = MODAL.challenge;
  if (!c) return;
  const attempts = STATE.attempts[c.id] || 0;
  const alreadyDone = STATE.completedIds.some(cid => cid === c.id || cid === c.id + '_reviewed');

  // Header
  document.getElementById('modalEyebrow').textContent = (c.domainName || '') + ' · Day ' + c.day;
  document.getElementById('modalTitle').textContent   = c.title || c.skill || 'Challenge';
  document.getElementById('modalMeta').innerHTML =
    '<span class="badge badge-domain">' + escapeHTML(c.domainName || '') + '</span>' +
    '<span class="badge ' + (c.required ? 'badge-required' : 'badge-bonus') + '">' + (c.required ? 'Required' : 'Bonus') + '</span>' +
    '<span class="badge" style="color:var(--accent);font-family:var(--mono);">+' + c.xp + ' XP</span>';

  // Step progress dots (step 4 = takeaways view, shown as "Review")
  const stepLabel = MODAL_STEPS[MODAL.step] || 'Review';
  const stepDisplay = Math.min(MODAL.step + 1, MODAL_STEPS.length);
  document.getElementById('modalSteps').innerHTML =
    MODAL_STEPS.map((s, i) =>
      '<div class="modal-step-dot ' + (i < MODAL.step ? 'done' : i === MODAL.step ? 'current' : '') + '"></div>'
    ).join('') +
    '<div class="modal-step-label">Step ' + stepDisplay + ' of ' + MODAL_STEPS.length + ' — ' + stepLabel + '</div>';

  // Footer
  const attEl  = document.getElementById('attemptsLeft');
  const btnDiv = document.querySelector('.modal-footer > div:last-child');
  const canGoBack = MODAL.step > 0 && !MODAL.gradingInProgress && !alreadyDone;
  const backBtn   = canGoBack ? '<button class="btn-ghost" onclick="modalBack()" style="margin-right:4px;">← Back</button>' : '';

  if (MODAL.gradingInProgress) {
    if (attEl) attEl.innerHTML = '<span style="color:var(--accent3);font-family:var(--mono);font-size:10px;">Evaluating your submission…</span>';
    if (btnDiv) btnDiv.innerHTML = '<button class="btn-submit" disabled style="opacity:0.6;">Evaluating… ●</button>';

  } else if (MODAL.gradingError) {
    if (attEl) attEl.innerHTML =
      '<span style="color:var(--red);font-family:var(--mono);font-size:10px;">' +
      escapeHTML(MODAL.gradingError) + '</span>';
    if (btnDiv) btnDiv.innerHTML =
      backBtn +
      '<button onclick="MODAL.gradingError=null;renderModal();" style="background:var(--accent);border:none;color:var(--bg);font-family:var(--mono);font-size:11px;padding:10px 20px;border-radius:6px;cursor:pointer;">Retry →</button>';

  } else if (MODAL.maxAttemptsReached && !MODAL.answerRevealed) {
    if (attEl) attEl.innerHTML = '<span style="color:var(--orange);font-family:var(--mono);font-size:10px;">3/3 attempts used</span>';
    if (btnDiv) btnDiv.innerHTML =
      '<button onclick="revealAnswer()" style="background:rgba(232,213,176,0.1);border:1px solid var(--accent3);color:var(--accent);font-family:var(--mono);font-size:11px;padding:10px 20px;border-radius:6px;cursor:pointer;letter-spacing:0.04em;">See Correct Approach →</button>' +
      '<button onclick="skipToTakeaways()" style="background:none;border:1px solid var(--border);color:var(--text3);font-family:var(--mono);font-size:11px;padding:10px 16px;border-radius:6px;cursor:pointer;letter-spacing:0.04em;">Acknowledge →</button>';

  } else if (MODAL.answerRevealed) {
    if (attEl) attEl.innerHTML = '<span style="color:var(--green);font-family:var(--mono);font-size:10px;">✓ Correct approach shown</span>';
    if (btnDiv) btnDiv.innerHTML =
      '<button onclick="markAssistedComplete()" style="background:var(--green);border:none;color:var(--bg);font-family:var(--mono);font-size:12px;font-weight:600;padding:12px 24px;border-radius:8px;cursor:pointer;letter-spacing:0.05em;">Mark complete ✓</button>';

  } else if (alreadyDone) {
    if (attEl) attEl.textContent = (STATE.assistedIds || []).includes(c.id) ? 'Completed with review' : 'Completed';
    if (btnDiv) btnDiv.innerHTML = '<button class="btn-complete" onclick="closeModal()">Close ✓</button>';

  } else if (MODAL.step === 4) {
    // Takeaways view (after skipToTakeaways)
    if (attEl) attEl.innerHTML = '<span style="color:var(--green);font-family:var(--mono);font-size:10px;">✓ Acknowledged</span>';
    if (btnDiv) btnDiv.innerHTML = '<button class="btn-complete" onclick="closeModal()">Close ✓</button>';

  } else if (MODAL.step === 0) {
    if (attEl) attEl.textContent = '';
    if (btnDiv) btnDiv.innerHTML = '<button class="btn-submit" onclick="submitChallenge()">Let\'s begin →</button>';

  } else if (MODAL.step === 1) {
    const h1 = MODAL.hintsUsed.includes(1);
    const h2 = MODAL.hintsUsed.includes(2);
    if (attEl) attEl.textContent = '';
    if (btnDiv) btnDiv.innerHTML =
      backBtn +
      '<button class="hint-btn' + (h1 ? ' hint-used' : '') + '" onclick="useHint(1)">' + (h1 ? 'Hint 1 ✓' : '💡 Hint 1') + '</button>' +
      '<button class="hint-btn' + (h2 ? ' hint-used' : '') + '" onclick="useHint(2)">' + (h2 ? 'Hint 2 ✓' : '💡 Hint 2') + '</button>' +
      '<button class="btn-submit" onclick="submitChallenge()">Submit work →</button>';

  } else if (MODAL.step === 2) {
    const passed = MODAL.scored && MODAL.scoreData && (MODAL.scoreData.score / 100) >= APP_CONFIG.PASS_THRESHOLD;
    if (passed) {
      if (attEl) attEl.innerHTML = '<span style="color:var(--green);font-family:var(--mono);font-size:10px;">✓ Challenge complete</span>';
      if (btnDiv) btnDiv.innerHTML = '<button class="btn-complete" onclick="closeModal()">Close ✓</button>';
    } else {
      if (attEl) attEl.textContent = attempts > 0 ? 'Attempt ' + (attempts + 1) + ' of 3' : '3 attempts available';
      if (btnDiv) btnDiv.innerHTML =
        backBtn +
        '<button class="btn-submit" id="submitBtn" onclick="submitChallenge()">Submit for grading →</button>';
    }
  }

  renderModalBody(c);
}

// ── Modal body by step ────────────────────────────────────────────────────────

function renderModalBody(c) {
  const body = document.getElementById('modalBody');
  if (!body) return;
  const s = MODAL.step;
  const alreadyDone = STATE.completedIds.some(cid => cid === c.id || cid === c.id + '_reviewed');

  // ── Step 4: TAKEAWAYS (after skipToTakeaways / acknowledge) ──────────────────
  if (s === 4) {
    const takeaways = c.takeaways || [];
    body.innerHTML =
      '<div class="learn-tag">Key takeaways</div>' +
      (takeaways.length
        ? takeaways.map((t, i) =>
            '<div style="display:flex;gap:14px;align-items:flex-start;margin-bottom:12px;">' +
              '<div style="width:22px;height:22px;border-radius:50%;background:var(--accent3);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:var(--mono);font-size:10px;font-weight:600;color:var(--bg);">' + (i + 1) + '</div>' +
              '<div style="font-size:14px;color:var(--text);line-height:1.7;">' + escapeHTML(t) + '</div>' +
            '</div>'
          ).join('')
        : '<div class="callout">No takeaways available for this challenge.</div>') +
      '<div class="callout" style="margin-top:16px;border-left-color:var(--text3);font-size:12px;color:var(--text3);">This challenge was acknowledged. Review the answer and try again to earn XP.</div>';
    return;
  }

  // ── Step 0: BRIEF (Learn + Example combined) ───────────────────────────────
  if (s === 0) {
    const concept    = c.concept    || 'This challenge develops your ability to: ' + (c.skill || 'work effectively with Claude');
    const whyMatters = c.whyMatters || 'Mastering this skill makes Claude a genuine professional accelerant for your work.';
    const outcome    = c.outcome    || 'After this challenge, you will be able to apply this skill in real professional situations.';

    body.innerHTML =
      '<div class="learn-section">' +
        '<div class="learn-tag">What you are learning today</div>' +
        '<div class="learn-concept">' + escapeHTML(c.title || c.skill || 'Challenge') + '</div>' +

        (c.beginnerScaffold
          ? '<div class="beginner-scaffold">' +
              '<div class="beginner-scaffold-label">In plain English — what you will actually do</div>' +
              escapeHTML(c.beginnerScaffold) +
              '<div style="margin-top:10px;font-family:var(--mono);font-size:10px;color:var(--blue);letter-spacing:0.06em;">▸ Open <a href="https://claude.ai" target="_blank" rel="noopener noreferrer" style="color:var(--blue);">claude.ai</a> in a new tab. Submit text — do not paste screenshots.</div>' +
            '</div>'
          : '<div class="callout" style="margin-bottom:16px;">▸ Open <a href="https://claude.ai" target="_blank" rel="noopener noreferrer" style="color:var(--blue);">claude.ai</a> in a new tab. Copy and paste Claude\'s responses as text when you submit.</div>') +

        '<div class="learn-block"><div class="learn-block-label">What this skill is</div><div class="learn-block-body">' + escapeHTML(concept) + '</div></div>' +
        '<div class="learn-block"><div class="learn-block-label">Why it matters in your work</div><div class="learn-block-body">' + escapeHTML(whyMatters) + '</div></div>' +
        '<div class="learn-block"><div class="learn-block-label">What you will be able to do after this</div><div class="learn-block-body">' + escapeHTML(outcome) + '</div></div>' +
        '<div class="callout" style="margin-top:14px;border-left-color:var(--text3);">⏱ Time needed: ' + escapeHTML(c.timeEst || '20–30 minutes') + '</div>' +

        // Inline example
        (c.miniExample
          ? '<div class="learn-tag" style="margin-top:24px;">Worked example</div>' +
            '<div class="example-card">' + escapeHTML(c.miniExample).replace(/\n/g, '<br>') + '</div>'
          : '') +

      '</div>';
  }

  // ── Step 1: TASK ────────────────────────────────────────────────────────────
  else if (s === 1) {
    body.innerHTML =
      '<div class="learn-tag">Your task</div>' +
      renderTaskFrame(c.taskFrame || '') +
      '<div class="callout" style="margin-top:16px;">' +
        '<strong>Remember:</strong> Copy and paste Claude\'s full output as text when you submit — do not upload screenshots.' +
      '</div>';

    // Render any already-used hints
    MODAL.hintsUsed.forEach(n => {
      const hintText = n === 1 ? c.hint1 : c.hint2;
      if (!hintText) return;
      const box = document.createElement('div');
      box.className = 'hint-box';
      box.innerHTML = '<div class="hint-box-label">Hint ' + n + '</div>' + escapeHTML(hintText);
      body.insertBefore(box, body.firstChild);
    });
  }

  // ── Step 2: SUBMIT / REVIEW ─────────────────────────────────────────────────
  else if (s === 2) {
    if (alreadyDone && !MODAL.scored) {
      // Review mode — previously completed challenge
      const prev = STATE.reflections[c.id] || '';
      body.innerHTML =
        '<div class="learn-tag">Previously completed — reviewing your work</div>' +
        '<div class="callout success" style="margin-bottom:16px;">Challenge complete. Your submission is shown below.</div>' +
        (prev
          ? '<div class="example-card" style="white-space:pre-wrap;font-size:13px;">' + escapeHTML(prev).substring(0, 1200) + (prev.length > 1200 ? '\n… [truncated]' : '') + '</div>'
          : '<div class="callout">No submission recorded.</div>');
      return;
    }

    const passed = MODAL.scored && MODAL.scoreData && (MODAL.scoreData.score / 100) >= APP_CONFIG.PASS_THRESHOLD;

    if (passed) {
      // Score + takeaways inline
      const takeaways = c.takeaways || [];
      body.innerHTML =
        renderScoreResult(MODAL.scoreData, c) +
        (takeaways.length
          ? '<div class="learn-tag" style="margin-top:24px;">Key takeaways</div>' +
            takeaways.map((t, i) =>
              '<div style="display:flex;gap:14px;align-items:flex-start;margin-bottom:12px;">' +
                '<div style="width:22px;height:22px;border-radius:50%;background:var(--accent3);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:var(--mono);font-size:10px;font-weight:600;color:var(--bg);">' + (i + 1) + '</div>' +
                '<div style="font-size:14px;color:var(--text);line-height:1.7;">' + escapeHTML(t) + '</div>' +
              '</div>'
            ).join('')
          : '');
      return;
    }

    // Not yet passed — show score (if any prior attempt) + textarea
    body.innerHTML =
      (MODAL.scored && MODAL.scoreData ? renderScoreResult(MODAL.scoreData, c) : '') +
      (!MODAL.scored
        ? '<div class="callout" style="margin-bottom:16px;">Paste your Claude output and your own reflection below. Minimum ' + APP_CONFIG.MIN_SUBMISSION_CHARS + ' characters. Grade is based on AI evaluation against the challenge rubric.</div>'
        : '') +
      '<textarea class="submit-textarea" id="submissionText" placeholder="Paste your Claude output and your own reflection here. Include the prompts you used and Claude\'s responses."' +
        ' oninput="MODAL.submission=this.value; var _cc=document.getElementById(\'subCharCount\'); if(_cc) _cc.textContent=this.value.length+\' / min ' + APP_CONFIG.MIN_SUBMISSION_CHARS + ' chars\';">' + escapeHTML(MODAL.submission) + '</textarea>' +
      '<div id="subCharCount" style="font-family:var(--mono);font-size:10px;color:var(--text3);margin-top:6px;text-align:right;">' + (MODAL.submission || '').length + ' / min ' + APP_CONFIG.MIN_SUBMISSION_CHARS + ' chars</div>' +
      (MODAL.answerRevealed
        ? '<div class="reveal-answer-panel"><div class="reveal-answer-label">✓ Correct Approach — Worked Example</div><div class="reveal-answer-body">' +
            escapeHTML(c.miniExample || 'No worked example available.').replace(/\n/g, '<br>') +
          '</div></div>'
        : '');
  }
}

// ── Task frame renderer ───────────────────────────────────────────────────────

function renderTaskFrame(taskFrame) {
  if (!taskFrame) return '<div class="empty-state">No task instructions generated.</div>';
  const parts = taskFrame.split('\n').filter(Boolean);
  let html = '<div class="task-steps">';
  parts.forEach(part => {
    const match = part.match(/^(\d+)\.\s+(.+)$/);
    if (match) {
      html += '<div class="task-step-card"><div class="task-step-num">' + match[1] + '</div><div class="task-step-body">' + escapeHTML(match[2].trim()) + '</div></div>';
    } else {
      html += '<div style="font-size:14px;color:var(--text);line-height:1.75;margin-bottom:10px;">' + escapeHTML(part) + '</div>';
    }
  });
  html += '</div>';
  return html;
}

// ── Hints ─────────────────────────────────────────────────────────────────────

function useHint(n) {
  if (!MODAL.hintsUsed.includes(n)) {
    MODAL.hintsUsed.push(n);
    if (MODAL.step < 1) MODAL.step = 1;
    // renderModal already re-renders all hints via MODAL.hintsUsed loop — no manual DOM insertion
    renderModal();
  }
}

// ── Modal overlay HTML (static shell rendered once in renderApp) ──────────────

function renderModalOverlay() {
  return `<div class="modal-overlay" id="modalOverlay" onclick="handleModalOverlayClick(event)">
  <div class="modal-box">
    <div class="modal-header">
      <div>
        <div id="modalEyebrow" class="modal-eyebrow"></div>
        <div id="modalTitle" class="modal-title"></div>
        <div id="modalMeta" class="modal-meta"></div>
      </div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-steps" id="modalSteps"></div>
    <div class="modal-body" id="modalBody"></div>
    <div class="modal-footer">
      <div id="attemptsLeft" style="font-family:var(--mono);font-size:10px;color:var(--text3);"></div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;"></div>
    </div>
  </div>
</div>`;
}

function handleModalOverlayClick(e) {
  if (e.target.id === 'modalOverlay') closeModal();
}
