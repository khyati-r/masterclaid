// ============================================================
// modal.js — Challenge modal. 5-step flow:
// 0:Learn → 1:Example → 2:Task → 3:Submit → 4:Takeaways
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

const MODAL_STEPS = ['Learn', 'Example', 'Task', 'Submit', 'Takeaways'];

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

// ── Main render ───────────────────────────────────────────────────────────────

function renderModal() {
  const c = MODAL.challenge;
  if (!c) return;
  const attempts = STATE.attempts[c.id] || 0;

  // Header elements
  document.getElementById('modalEyebrow').textContent = (c.domainName || '') + ' · Day ' + c.day;
  document.getElementById('modalTitle').textContent   = c.title || c.skill || 'Challenge';
  document.getElementById('modalMeta').innerHTML =
    '<span class="badge badge-domain">' + escapeHTML(c.domainName || '') + '</span>' +
    '<span class="badge ' + (c.required ? 'badge-required' : 'badge-bonus') + '">' + (c.required ? 'Required' : 'Bonus') + '</span>' +
    '<span class="badge" style="color:var(--accent);font-family:var(--mono);">+' + c.xp + ' XP</span>';

  // Step progress
  document.getElementById('modalSteps').innerHTML =
    MODAL_STEPS.map((s, i) =>
      '<div class="modal-step-dot ' + (i < MODAL.step ? 'done' : i === MODAL.step ? 'current' : '') + '"></div>'
    ).join('') +
    '<div class="modal-step-label">Step ' + (MODAL.step + 1) + ' of ' + MODAL_STEPS.length + ' — ' + MODAL_STEPS[MODAL.step] + '</div>';

  // Footer adapts to state
  const attEl  = document.getElementById('attemptsLeft');
  const btnDiv = document.querySelector('.modal-footer > div:last-child');

  if (MODAL.gradingInProgress) {
    if (attEl) attEl.innerHTML = '<span style="color:var(--accent3);font-family:var(--mono);font-size:10px;">Evaluating your submission…</span>';
    if (btnDiv) btnDiv.innerHTML = '<button class="btn-submit" disabled style="opacity:0.6;">Evaluating… ●</button>';

  } else if (MODAL.gradingError) {
    if (attEl) attEl.innerHTML = '<span style="color:var(--red);font-family:var(--mono);font-size:10px;">Grading failed — no attempt counted</span>';
    if (btnDiv) btnDiv.innerHTML =
      '<button onclick="MODAL.gradingError=null;renderModal();" style="background:var(--accent);border:none;color:var(--bg);font-family:var(--mono);font-size:11px;padding:10px 20px;border-radius:6px;cursor:pointer;">Retry grading →</button>';

  } else if (MODAL.maxAttemptsReached && !MODAL.answerRevealed) {
    if (attEl) attEl.innerHTML = '<span style="color:var(--orange);font-family:var(--mono);font-size:10px;">3/3 attempts used</span>';
    if (btnDiv) btnDiv.innerHTML =
      '<button onclick="revealAnswer()" style="background:rgba(232,213,176,0.1);border:1px solid var(--accent3);color:var(--accent);font-family:var(--mono);font-size:11px;padding:10px 20px;border-radius:6px;cursor:pointer;letter-spacing:0.04em;">See Correct Approach →</button>' +
      '<button onclick="skipToTakeaways()" style="background:none;border:1px solid var(--border);color:var(--text3);font-family:var(--mono);font-size:11px;padding:10px 16px;border-radius:6px;cursor:pointer;letter-spacing:0.04em;">Skip →</button>';

  } else if (MODAL.answerRevealed) {
    if (attEl) attEl.innerHTML = '<span style="color:var(--green);font-family:var(--mono);font-size:10px;">✓ Correct approach shown</span>';
    if (btnDiv) btnDiv.innerHTML =
      '<button onclick="markAssistedComplete()" style="background:var(--green);border:none;color:var(--bg);font-family:var(--mono);font-size:12px;font-weight:600;padding:12px 24px;border-radius:8px;cursor:pointer;letter-spacing:0.05em;">Complete & Continue ✓</button>';

  } else {
    const h1 = MODAL.hintsUsed.includes(1);
    const h2 = MODAL.hintsUsed.includes(2);
    const isLast = MODAL.step === MODAL_STEPS.length - 1;
    if (attEl) attEl.textContent = attempts > 0 ? 'Attempt ' + (attempts + 1) + ' of 3' : '3 attempts available';
    if (btnDiv) btnDiv.innerHTML =
      '<button class="hint-btn' + (h1 ? ' hint-used' : '') + '" onclick="useHint(1)">' + (h1 ? 'Hint 1 Used' : '💡 Hint 1') + '</button>' +
      '<button class="hint-btn' + (h2 ? ' hint-used' : '') + '" onclick="useHint(2)">' + (h2 ? 'Hint 2 Used' : '💡 Hint 2') + '</button>' +
      '<button class="btn-submit" id="submitBtn" onclick="submitChallenge()">' + (isLast ? 'Finish Challenge ✓' : 'Next →') + '</button>';
  }

  renderModalBody(c);
}

// ── Modal body by step ────────────────────────────────────────────────────────

function renderModalBody(c) {
  const body = document.getElementById('modalBody');
  if (!body) return;
  const s = MODAL.step;

  // ── Step 0: LEARN ──────────────────────────────────────────────────────────
  if (s === 0) {
    const concept    = c.concept    || 'This challenge develops your ability to: ' + (c.skill || 'work effectively with Claude');
    const whyMatters = c.whyMatters || 'Mastering this skill makes Claude a genuine professional accelerant for your work.';
    const outcome    = c.outcome    || 'After this challenge, you will be able to apply this skill in real professional situations.';

    body.innerHTML =
      '<div class="learn-section">' +
        '<div class="learn-tag">What you are learning today</div>' +
        '<div class="learn-concept">' + escapeHTML(c.title || c.skill || 'Challenge') + '</div>' +

        // Beginner scaffold (plain-English "what you'll do")
        (c.beginnerScaffold
          ? '<div class="beginner-scaffold">' +
              '<div class="beginner-scaffold-label">In plain English — what you will actually do</div>' +
              escapeHTML(c.beginnerScaffold) +
              '<div style="margin-top:10px;font-family:var(--mono);font-size:10px;color:var(--blue);letter-spacing:0.06em;">▸ Open <a href="https://claude.ai" target="_blank" style="color:var(--blue);">claude.ai</a> in a new tab. Copy and paste Claude\'s responses as text — do not submit screenshots.</div>' +
            '</div>'
          : '<div class="callout" style="margin-bottom:16px;">▸ Open <a href="https://claude.ai" target="_blank" style="color:var(--blue);">claude.ai</a> in a new tab. Copy and paste Claude\'s responses as text when you submit.</div>') +

        '<div class="learn-block"><div class="learn-block-label">What this skill is</div><div class="learn-block-body">' + escapeHTML(concept) + '</div></div>' +
        '<div class="learn-block"><div class="learn-block-label">Why it matters in your work</div><div class="learn-block-body">' + escapeHTML(whyMatters) + '</div></div>' +
        '<div class="learn-block"><div class="learn-block-label">What you will be able to do after this</div><div class="learn-block-body">' + escapeHTML(outcome) + '</div></div>' +
        '<div class="callout" style="margin-top:14px;border-left-color:var(--text3);">⏱ Time needed: ' + escapeHTML(c.timeEst || '20–30 minutes') + '</div>' +
      '</div>';
  }

  // ── Step 1: EXAMPLE ────────────────────────────────────────────────────────
  else if (s === 1) {
    const ex = c.miniExample || null;
    body.innerHTML =
      '<div class="learn-tag">See it in action first</div>' +
      '<div class="learn-concept" style="font-size:18px;margin-bottom:16px;">A worked example</div>' +
      (ex
        ? '<div class="example-card">' + escapeHTML(ex).replace(/\n/g, '<br>') + '</div>'
        : '<div class="callout">No example was generated for this challenge. Proceed to the task.</div>');
  }

  // ── Step 2: TASK ────────────────────────────────────────────────────────────
  else if (s === 2) {
    body.innerHTML = '<div class="learn-tag">Your task for today</div>' + renderTaskFrame(c.taskFrame || '') +
      '<div class="callout" style="margin-top:16px;">' +
        '<strong>Remember:</strong> Copy and paste Claude\'s full output as text when you submit — do not upload screenshots.' +
      '</div>';
  }

  // ── Step 3: SUBMIT ──────────────────────────────────────────────────────────
  else if (s === 3) {
    const alreadyDone = STATE.completedIds.includes(c.id) || STATE.completedIds.includes(c.id + '_reviewed');

    if (alreadyDone) {
      // Review mode — read-only
      const prev = STATE.reflections[c.id] || '';
      body.innerHTML =
        '<div class="learn-tag">Challenge completed — reviewing your work</div>' +
        '<div class="callout success" style="margin-bottom:16px;">This challenge is complete. Your previous submission is shown below.</div>' +
        (prev
          ? '<div class="example-card" style="white-space:pre-wrap;font-size:13px;">' + escapeHTML(prev).substring(0, 1200) + (prev.length > 1200 ? '\n… [truncated]' : '') + '</div>'
          : '<div class="callout">No submission recorded.</div>') +
        (MODAL.scoreData ? renderScoreResult(MODAL.scoreData, c) : '');
      // Replace footer with close button
      const bd = document.querySelector('.modal-footer > div:last-child');
      if (bd) bd.innerHTML = '<button class="btn-complete" onclick="closeModal()">Close ✓</button>';
      const ae = document.getElementById('attemptsLeft');
      if (ae) ae.textContent = (STATE.assistedIds || []).includes(c.id) ? 'Completed with review' : 'Completed';
      return;
    }

    // Active submit mode
    body.innerHTML =
      '<div class="learn-tag">Submit your work for grading</div>' +
      // Show rubric AFTER grading (not before)
      (MODAL.scored && MODAL.scoreData
        ? renderScoreResult(MODAL.scoreData, c)
        : '<div class="callout" style="margin-bottom:16px;">Paste your Claude output + your reflection below. Minimum ' + APP_CONFIG.MIN_SUBMISSION_CHARS + ' characters. Your work is graded by AI — focus on demonstrating concept understanding.</div>') +

      '<textarea class="submit-textarea" id="submissionText" placeholder="Paste your Claude output and your own reflection here. Include the actual prompts you used and Claude\'s responses. The more you include, the better the grading."' +
        ' oninput="MODAL.submission=this.value">' + escapeHTML(MODAL.submission) + '</textarea>' +
      '<div style="font-family:var(--mono);font-size:10px;color:var(--text3);margin-top:6px;">' + (MODAL.submission || '').length + ' chars</div>' +

      // Reveal answer panel (after 3 failures)
      (MODAL.answerRevealed
        ? '<div class="reveal-answer-panel"><div class="reveal-answer-label">✓ Correct Approach — Worked Example</div><div class="reveal-answer-body">' +
            escapeHTML(c.miniExample || 'No worked example available.').replace(/\n/g, '<br>') +
          '</div></div>'
        : '');
  }

  // ── Step 4: TAKEAWAYS ───────────────────────────────────────────────────────
  else if (s === 4) {
    const takeaways = c.takeaways || [];
    body.innerHTML =
      '<div class="learn-tag">Key takeaways</div>' +
      '<div class="learn-concept" style="font-size:18px;margin-bottom:20px;">What to carry forward</div>' +
      takeaways.map((t, i) =>
        '<div style="display:flex;gap:16px;align-items:flex-start;margin-bottom:14px;">' +
          '<div style="width:24px;height:24px;border-radius:50%;background:var(--accent3);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:var(--mono);font-size:10px;font-weight:600;color:var(--bg);">' + (i + 1) + '</div>' +
          '<div style="font-size:14px;color:var(--text);line-height:1.7;">' + escapeHTML(t) + '</div>' +
        '</div>'
      ).join('') +
      '<div class="callout success" style="margin-top:20px;">✓ Challenge complete. Great work.</div>';
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
    if (MODAL.step < 2) MODAL.step = 2;
    renderModal();
    const c = MODAL.challenge;
    if (!c) return;
    const hintText = n === 1 ? c.hint1 : c.hint2;
    if (!hintText) return;
    const body = document.getElementById('modalBody');
    if (!body) return;
    const box = document.createElement('div');
    box.className = 'hint-box';
    box.innerHTML = '<div class="hint-box-label">Hint ' + n + '</div>' + escapeHTML(hintText);
    body.insertBefore(box, body.firstChild);
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
