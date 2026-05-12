// ============================================================
// utils.js — Shared utilities used across all modules.
// No state mutations here — pure helpers only.
// ============================================================

// ── HTML safety ───────────────────────────────────────────────────────────────

function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Async helpers ─────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Toast notifications ───────────────────────────────────────────────────────

function showToast(title, subtitle) {
  const existing = document.getElementById('toastEl');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.id = 'toastEl';
  el.style.cssText = [
    'position:fixed', 'bottom:24px', 'right:24px', 'z-index:400',
    'background:var(--bg2)', 'border:1px solid var(--border2)',
    'border-radius:10px', 'padding:14px 18px', 'max-width:320px',
    'box-shadow:0 4px 20px rgba(0,0,0,0.4)', 'animation:toastIn .2s ease'
  ].join(';');
  el.innerHTML =
    '<div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:2px;">' + escapeHTML(title) + '</div>' +
    (subtitle ? '<div style="font-size:12px;color:var(--text2);line-height:1.5;">' + escapeHTML(subtitle) + '</div>' : '');
  document.body.appendChild(el);
  setTimeout(() => { if (el.parentNode) el.remove(); }, 3500);
}

// ── Generating screen progress ────────────────────────────────────────────────

let GEN_ELAPSED_TIMER = null;
let GEN_ELAPSED_START = null;

function setGenProgress(pct, statusText) {
  const ring = document.getElementById('genRing');
  const statusEl = document.getElementById('genStatus');
  const elapsed = document.getElementById('genElapsed');
  if (ring) {
    const circumference = 2 * Math.PI * 36;
    const offset = circumference * (1 - Math.min(pct, 100) / 100);
    ring.style.strokeDashoffset = offset;
  }
  if (statusEl) statusEl.textContent = statusText || '';
  // Start elapsed timer on first progress call
  if (!GEN_ELAPSED_TIMER && elapsed) {
    GEN_ELAPSED_START = Date.now();
    GEN_ELAPSED_TIMER = setInterval(() => {
      const el = document.getElementById('genElapsed');
      if (el) el.textContent = 'Elapsed: ' + Math.round((Date.now() - GEN_ELAPSED_START) / 1000) + 's';
    }, 1000);
  }
}

function stopElapsedTimer() {
  if (GEN_ELAPSED_TIMER) {
    clearInterval(GEN_ELAPSED_TIMER);
    GEN_ELAPSED_TIMER = null;
  }
}

// ── DOM helpers ───────────────────────────────────────────────────────────────

function qs(selector) {
  return document.querySelector(selector);
}

function qsAll(selector) {
  return document.querySelectorAll(selector);
}

// ── Format helpers ────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return isNaN(d) ? dateStr : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Debounce ──────────────────────────────────────────────────────────────────

function debounce(fn, ms) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}
