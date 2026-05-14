// ============================================================
// resources.js — Dynamic resources tab.
// Curated Claude product links (hardcoded, no hallucination risk)
// + Gemini-generated role/domain recommendations (descriptions only, no URLs).
// Cached per domain. Regenerates when domain changes.
// ============================================================

const RESOURCES_SYSTEM_PROMPT = 'Return valid JSON only. No markdown, no preamble.';

function buildResourcesPrompt(profile, domainIndex) {
  const domainName = getDomainName(domainIndex, profile);
  const role = profile.role === '__other__' ? (profile.roleOther || 'Professional') : profile.role;
  const curriculum = DOMAIN_CURRICULA[domainIndex];

  return `You are a learning advisor for an AI mastery programme.

LEARNER: ${role}
CURRENT DOMAIN: ${domainName}
DOMAIN FOCUS: ${curriculum ? curriculum.promptDescription : 'Claude AI tools and workflows'}
TECH LEVEL: ${profile.techLevel || 'none'}

Generate exactly 5 resource recommendations for this learner at this point in their journey. These are books, articles, communities, courses, or search terms — NOT URLs (you may hallucinate URLs, so omit them entirely). Each recommendation is a name and a 1-sentence description of why it is useful RIGHT NOW for this specific domain.

Return ONLY this JSON:
{"recommendations":[{"title":"NAME","type":"TYPE (book/article/community/course/search term)","why":"1 sentence, max 20 words, specific to this learner and domain"}]}

Exactly 5 items. No URLs. No markdown.`;
}

async function generateResources() {
  const apiKey = getApiKey();
  if (!apiKey || !STATE.profile) return null;

  try {
    const prompt = buildResourcesPrompt(STATE.profile, STATE.currentDomain);
    const result = await callAPI(RESOURCES_SYSTEM_PROMPT, prompt, apiKey, 1000);
    if (result && result.recommendations) return result.recommendations;
    if (Array.isArray(result)) return result;
    return null;
  } catch (e) {
    console.warn('[Resources] Generation failed:', e.message);
    return null;
  }
}

async function initResourcesIfNeeded() {
  if (STATE.resources && STATE.resourcesDomain === STATE.currentDomain) return; // Cache hit

  const panel = document.getElementById('panel-resources');
  if (panel) panel.innerHTML = '<div class="panel-heading">Resources</div><div class="empty-state">Loading resources for this domain…</div>';

  const recs = await generateResources();
  STATE.resources = recs;
  STATE.resourcesDomain = STATE.currentDomain;
  saveState();

  if (panel && currentTab === 'resources') {
    panel.innerHTML = renderResourcesContent(recs);
  }
}

function renderResourcesContent(recommendations) {
  const domainName = getDomainName(STATE.currentDomain, STATE.profile);
  const domain = DOMAIN_CURRICULA[STATE.currentDomain];

  let html = `<div class="panel-heading">Resources</div>
<p style="font-size:13px;color:var(--text2);margin-bottom:20px;">Tools, references, and learning materials curated for <strong>${escapeHTML(domainName)}</strong>.</p>`;

  // ── Curated Claude product links ──
  html += '<div class="resource-section-label">Claude product links</div>';
  html += '<div class="resource-grid">';
  CURATED_RESOURCE_LINKS.forEach(link => {
    // isSafeUrl guards against javascript: or data: URIs (defence-in-depth — these are hardcoded)
    if (!isSafeUrl(link.url)) return;
    html += `<a href="${escapeHTML(link.url)}" target="_blank" rel="noopener noreferrer" class="resource-card">
      <div class="rc-title">${escapeHTML(link.title)}</div>
      <div class="rc-desc">${escapeHTML(link.description)}</div>
      <div class="rc-url">${escapeHTML(link.url)}</div>
    </a>`;
  });
  html += '</div>';

  // ── Domain-specific key tools ──
  if (domain && domain.keyTools && domain.keyTools.length > 0) {
    html += '<div class="resource-section-label" style="margin-top:20px;">Tools for this domain</div>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;">';
    domain.keyTools.forEach(t => {
      html += `<span class="tool-tag">${escapeHTML(t)}</span>`;
    });
    html += '</div>';
  }

  // ── Gemini-generated recommendations ──
  if (recommendations && recommendations.length > 0) {
    html += '<div class="resource-section-label" style="margin-top:20px;">Recommended for this domain</div>';
    html += '<div class="recommendation-list">';
    recommendations.forEach(rec => {
      html += `<div class="recommendation-card">
        <div class="rec-header">
          <div class="rec-title">${escapeHTML(rec.title || '')}</div>
          <span class="rec-type">${escapeHTML(rec.type || '')}</span>
        </div>
        <div class="rec-why">${escapeHTML(rec.why || '')}</div>
      </div>`;
    });
    html += '</div>';
  } else {
    html += '<div style="margin-top:16px;"><div class="empty-state">Personalised recommendations load when you open this tab for the first time in each domain.</div></div>';
  }

  return html;
}
