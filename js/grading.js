// ============================================================
// grading.js — Semantic grading engine.
// Submissions are evaluated by Gemini against the challenge rubric.
// No keyword matching — concept understanding is what counts.
// ============================================================

let _lastGradingTime = 0; // Cooldown enforcement

// ── Grading prompt builder ────────────────────────────────────────────────────

function buildGradingPrompt(submission, challenge) {
  const rubric = (challenge.rubric || []).slice(0, 4);
  // Pad to 4 criteria if fewer were generated
  while (rubric.length < 4) rubric.push('Submission demonstrates engagement with the challenge task');

  return `You are a fair educational assessor for a professional AI mastery programme.

CHALLENGE: ${challenge.title}
SKILL BEING ASSESSED: ${challenge.skill}
WHAT THE USER WAS ASKED TO DO: ${(challenge.taskFrame || '').split('\\n').slice(1, 4).join(' | ')}

RUBRIC — assess against each criterion:
${rubric.map((r, i) => `${i + 1}. ${r}`).join('\\n')}

USER SUBMISSION (${submission.length} characters):
${submission.substring(0, 1800)}

CONTEXT: The user worked in Claude.ai and pasted their Claude conversation output and reflection here as text. Grade based on what they submitted — concept understanding matters more than surface completeness. Be encouraging but honest.

Return ONLY this exact JSON (no other text):
{"score":SCORE,"criteria":[{"text":"CRITERION_1","met":BOOL},{"text":"CRITERION_2","met":BOOL},{"text":"CRITERION_3","met":BOOL},{"text":"CRITERION_4","met":BOOL}],"feedback":"2-3 SENTENCES. What was good. What was missing. Specific to their submission.","suggestion":"1 SENTENCE. The single most impactful improvement they could make."}

Where SCORE = integer 0–100 (percentage of criteria met × 100).`;
}

const GRADING_SYSTEM_PROMPT = 'You are an educational assessor. Return valid JSON only. No markdown, no preamble.';

// ── Main grading function ─────────────────────────────────────────────────────

async function gradeWithGemini(submission, challenge) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { error: 'no_key', message: 'No API key available. Enter your key again to enable grading.' };
  }

  const prompt = buildGradingPrompt(submission, challenge);
  try {
    const result = await callAPI(GRADING_SYSTEM_PROMPT, prompt, apiKey, 800);
    // result should be a parsed object {score, criteria, feedback, suggestion}
    if (typeof result === 'object' && result !== null && typeof result.score === 'number') {
      return result;
    }
    // If parsed as array (shouldn't happen but handle it)
    if (Array.isArray(result) && result[0]) return result[0];
    throw new Error('Unexpected grading response shape');
  } catch (err) {
    return { error: 'api_error', message: err.message };
  }
}

// ── Submit handler ────────────────────────────────────────────────────────────

async function submitChallenge() {
  const c = MODAL.challenge;
  if (!c) return;

  // Steps 0, 1, 2 — just advance (Learn, Example, Task)
  if (MODAL.step < 3) {
    MODAL.step++;
    renderModal();
    return;
  }

  // Step 4 (Takeaways) — close modal
  if (MODAL.step === 4) {
    closeModal();
    return;
  }

  // Step 3 — grade submission
  if (STATE.gradingInProgress) return;

  // Cooldown enforcement
  const now = Date.now();
  const sinceLastGrade = now - _lastGradingTime;
  if (_lastGradingTime > 0 && sinceLastGrade < APP_CONFIG.GRADING_COOLDOWN_MS) {
    const wait = Math.ceil((APP_CONFIG.GRADING_COOLDOWN_MS - sinceLastGrade) / 1000);
    showToast('Please wait', 'You can resubmit in ' + wait + ' seconds');
    return;
  }

  const submission = MODAL.submission || '';
  if (submission.trim().length < APP_CONFIG.MIN_SUBMISSION_CHARS) {
    showToast('Submission too short', 'Paste your Claude output below your reflection — minimum ' + APP_CONFIG.MIN_SUBMISSION_CHARS + ' characters');
    return;
  }

  // Save reflection
  STATE.reflections[c.id] = submission;

  // Increment attempt counter
  const attempts = (STATE.attempts[c.id] || 0) + 1;
  STATE.attempts[c.id] = attempts;

  // Show grading state
  STATE.gradingInProgress = true;
  MODAL.gradingInProgress = true;
  renderModal(); // Shows loading state

  _lastGradingTime = now;

  // Call semantic grader
  const gradingResult = await gradeWithGemini(submission, c);

  STATE.gradingInProgress = false;
  MODAL.gradingInProgress = false;

  // Handle grading failure — don't count the attempt
  if (gradingResult.error) {
    STATE.attempts[c.id] = Math.max(0, attempts - 1); // Revert attempt count
    MODAL.gradingError = gradingResult.message;
    renderModal();
    return;
  }

  MODAL.gradingError = null;

  const score = gradingResult.score || 0;
  const pct = score / 100;

  MODAL.scored    = true;
  MODAL.scoreData = gradingResult;
  saveState();

  if (pct >= APP_CONFIG.PASS_THRESHOLD) {
    // ── PASS ──
    if (!STATE.completedIds.includes(c.id)) {
      STATE.completedIds.push(c.id);
      STATE.xp += c.xp;
      STATE.skillScores[c.domain] = Math.min(100, (STATE.skillScores[c.domain] || 0) + Math.round(15 * pct));
      STATE.log.push({
        date: new Date().toLocaleDateString(),
        title: c.title || c.skill,
        xp: c.xp,
        score: score,
        day: STATE.currentDay,
        domain: c.domain,
        assisted: false
      });
      addToPortfolio(c, submission, score, gradingResult.criteria || [], gradingResult.feedback || '', attempts, false);
      touchStreak();
      showToast('Challenge complete', '+' + c.xp + ' XP · ' + score + '% score');
    }
    saveState();
    MODAL.step = 4;
    MODAL.maxAttemptsReached = false;
    renderModal();
    refreshProgressUI();
    triggerBackgroundFetch();
    const panel = document.getElementById('panel-daily');
    if (panel && currentTab === 'daily') panel.innerHTML = renderDaily();

  } else if (attempts >= APP_CONFIG.MAX_ATTEMPTS) {
    // ── MAX ATTEMPTS ──
    MODAL.maxAttemptsReached = true;
    renderModal();

  } else {
    // ── RETRY AVAILABLE ──
    renderModal();
  }
}

// ── Answer reveal (after 3 failures) ─────────────────────────────────────────

function revealAnswer() {
  MODAL.answerRevealed = true;
  renderModal();
}

function markAssistedComplete() {
  const c = MODAL.challenge;
  if (!c) return;

  if (!STATE.completedIds.includes(c.id)) {
    STATE.completedIds.push(c.id);
    STATE.assistedIds.push(c.id);
    STATE.xp += c.xp;
    STATE.skillScores[c.domain] = Math.min(100, (STATE.skillScores[c.domain] || 0) + 8);
    STATE.log.push({
      date: new Date().toLocaleDateString(),
      title: c.title || c.skill,
      xp: c.xp,
      score: 'reviewed',
      day: STATE.currentDay,
      domain: c.domain,
      assisted: true
    });
    addToPortfolio(c, MODAL.submission || '', 0, [], '', STATE.attempts[c.id] || 3, true);
    touchStreak();
    showToast('Completed — reviewed', '+' + c.xp + ' XP · Learning by reviewing counts');
  }

  saveState();
  refreshProgressUI();
  MODAL.step = 4;
  MODAL.maxAttemptsReached = false;
  MODAL.answerRevealed = false;
  renderModal();
  const panel = document.getElementById('panel-daily');
  if (panel && currentTab === 'daily') panel.innerHTML = renderDaily();
}

function skipToTakeaways() {
  const c = MODAL.challenge;
  if (c && !STATE.completedIds.includes(c.id) && !STATE.completedIds.includes(c.id + '_reviewed')) {
    STATE.completedIds.push(c.id + '_reviewed');
    saveState();
  }
  MODAL.step = 4;
  MODAL.maxAttemptsReached = false;
  MODAL.answerRevealed = false;
  renderModal();
  const panel = document.getElementById('panel-daily');
  if (panel && currentTab === 'daily') panel.innerHTML = renderDaily();
}

// ── Score result renderer ─────────────────────────────────────────────────────

function renderScoreResult(scoreData, challenge) {
  if (!scoreData) return '';
  const score = scoreData.score || 0;
  const passed = score >= (APP_CONFIG.PASS_THRESHOLD * 100);
  const criteria = scoreData.criteria || [];

  const criteriaHtml = criteria.map(cr =>
    '<div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:8px;">' +
      '<span style="font-size:14px;flex-shrink:0;margin-top:1px;">' + (cr.met ? '✓' : '✗') + '</span>' +
      '<span style="font-size:13px;color:' + (cr.met ? 'var(--green)' : 'var(--text2)') + ';line-height:1.55;">' + escapeHTML(cr.text) + '</span>' +
    '</div>'
  ).join('');

  return '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:20px 24px;margin-bottom:16px;">' +
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">' +
      '<div style="font-size:32px;font-weight:700;color:' + (passed ? 'var(--green)' : 'var(--orange)') + ';">' + score + '%</div>' +
      '<div>' +
        '<div style="font-size:14px;font-weight:600;color:var(--text);">' + (passed ? '✓ Passed' : 'Needs more work') + '</div>' +
        '<div style="font-size:12px;color:var(--text2);font-family:var(--mono);">' + (STATE.attempts[challenge?.id] || 1) + ' attempt(s) · ' + (challenge?.xp || 0) + ' XP available</div>' +
      '</div>' +
    '</div>' +
    (criteriaHtml ? '<div style="margin-bottom:14px;">' + criteriaHtml + '</div>' : '') +
    (scoreData.feedback ?
      '<div style="font-size:13px;color:var(--text);line-height:1.7;margin-bottom:10px;">' + escapeHTML(scoreData.feedback) + '</div>'
    : '') +
    (scoreData.suggestion && !passed ?
      '<div style="background:rgba(232,213,176,0.07);border-left:3px solid var(--accent3);padding:10px 14px;border-radius:4px;font-size:13px;color:var(--accent);line-height:1.65;">' +
        '<strong>Next step:</strong> ' + escapeHTML(scoreData.suggestion) +
      '</div>'
    : '') +
  '</div>';
}
