// ============================================================
// app.js — Main entry point. render() routes to the correct
// screen. Initialised on DOMContentLoaded.
// ============================================================

// ── Main render router ────────────────────────────────────────────────────────

function render() {
  const container = document.getElementById('app');
  if (!container) return;

  switch (STATE.screen) {
    case 'landing':
    case 'onboarding':
      if (OB.step === 0) {
        container.innerHTML = renderLanding();
      } else {
        container.innerHTML = renderOnboardingStep(OB.step);
      }
      break;

    case 'generating':
      container.innerHTML = renderGenerating();
      break;

    case 'app':
      container.innerHTML = renderApp();
      break;

    case 'complete':
      container.innerHTML = renderCompletionPage();
      // Auto-play progression map after a short delay
      setTimeout(() => {
        const btn = document.getElementById('progressionPlayBtn');
        if (btn) btn.click();
      }, 800);
      break;

    default:
      container.innerHTML = renderLanding();
  }
}

// ── Initialisation ────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const loaded = loadState();

  if (loaded && STATE.generated) {
    STATE.screen = 'app';
    updateCurrentDomain();
  } else if (loaded && STATE.screen === 'complete') {
    // keep as complete
  } else {
    STATE.screen = 'landing';
    OB.step = 0;
  }

  render();
});
