/* CrowdLens – Frontend Application Logic */

/* ============================================================
   Utility helpers
   ============================================================ */

function sentimentClass(label) {
  return label === 'positive' ? 'positive' : label === 'negative' ? 'negative' : 'neutral';
}

function sentimentBadgeHtml(label) {
  const cls = `badge-${sentimentClass(label)}`;
  const emoji = label === 'positive' ? '👍' : label === 'negative' ? '👎' : '😐';
  return `<span class="sentiment-badge ${cls}">${emoji} ${label.charAt(0).toUpperCase() + label.slice(1)}</span>`;
}

function rankMedal(rank) {
  if (rank === 1) return '<span class="gold">🥇</span>';
  if (rank === 2) return '<span class="silver">🥈</span>';
  if (rank === 3) return '<span class="bronze">🥉</span>';
  return `#${rank}`;
}

function compoundToPercent(compound) {
  // compound is in [-1, 1]; map to [0, 100] for the bar
  return Math.round((compound + 1) / 2 * 100);
}

/* ============================================================
   Search / Analyse
   ============================================================ */

const searchInput = document.getElementById('searchInput');
const searchBtn   = document.getElementById('searchBtn');
const searchResult = document.getElementById('searchResult');

function renderAnalysis(data) {
  const s = data.sentiment;
  const cls = sentimentClass(s.overall_label);
  const compoundPct = compoundToPercent(s.average_compound);
  const scoreDisplay = s.average_compound >= 0 ? `+${s.average_compound.toFixed(3)}` : s.average_compound.toFixed(3);

  const reviewsHtml = (data.reviews || [])
    .slice(0, 10)
    .map(r => `<li>${escapeHtml(r.length > 220 ? r.slice(0, 220) + '…' : r)}</li>`)
    .join('');

  searchResult.innerHTML = `
    <div class="result-title">${escapeHtml(data.title)}</div>
    <div class="sentiment-summary">
      ${sentimentBadgeHtml(s.overall_label)}
      <span class="sentiment-badge" style="background:transparent;border:1px solid var(--border);color:var(--text-muted);">
        📝 ${s.review_count} reviews analysed
      </span>
    </div>

    <div class="score-bar-wrap">
      <div class="score-label">
        <span>Sentiment Score</span>
        <span class="compound-score ${cls}">${scoreDisplay}</span>
      </div>
      <div class="score-bar">
        <div class="score-fill fill-compound" style="width:${compoundPct}%"></div>
      </div>
    </div>

    <div class="score-bar-wrap">
      <div class="score-label"><span>👍 Positive</span><span>${s.positive_pct}%</span></div>
      <div class="score-bar"><div class="score-fill fill-pos" style="width:${s.positive_pct}%"></div></div>
    </div>
    <div class="score-bar-wrap">
      <div class="score-label"><span>👎 Negative</span><span>${s.negative_pct}%</span></div>
      <div class="score-bar"><div class="score-fill fill-neg" style="width:${s.negative_pct}%"></div></div>
    </div>

    ${reviewsHtml ? `<p class="reviews-heading">Sample reviews</p><ul class="reviews-list">${reviewsHtml}</ul>` : ''}
  `;
  searchResult.classList.remove('hidden');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function doSearch() {
  const title = searchInput.value.trim();
  if (!title) return;

  searchResult.classList.remove('hidden');
  searchResult.innerHTML = `<span class="spinner"></span> Analyzing <strong>${escapeHtml(title)}</strong>…`;

  try {
    const resp = await fetch(`/api/analyze?title=${encodeURIComponent(title)}`);
    const data = await resp.json();
    if (!resp.ok) {
      searchResult.innerHTML = `<p class="error-msg">⚠️ ${escapeHtml(data.error || 'Unknown error')}</p>`;
      return;
    }
    renderAnalysis(data);
  } catch (err) {
    searchResult.innerHTML = `<p class="error-msg">⚠️ Network error. Please try again.</p>`;
  }
}

searchBtn.addEventListener('click', doSearch);
searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

/* ============================================================
   Trending Rankings
   ============================================================ */

const rankingsContainer = document.getElementById('rankingsContainer');
const refreshBtn        = document.getElementById('refreshBtn');

function renderRankings(data) {
  if (!data.rankings || data.rankings.length === 0) {
    rankingsContainer.innerHTML = '<p class="error-msg">No rankings available.</p>';
    return;
  }

  rankingsContainer.innerHTML = data.rankings.map(item => {
    const s = item.sentiment;
    const cls = sentimentClass(s.overall_label);
    const scoreDisplay = s.average_compound >= 0
      ? `+${s.average_compound.toFixed(3)}`
      : s.average_compound.toFixed(3);

    return `
      <div class="rank-card ${cls}" onclick="loadTitle(${JSON.stringify(item.title)})">
        <span class="rank-number">${rankMedal(item.rank)}</span>
        <div class="rank-card-title">${escapeHtml(item.title)}</div>
        <div class="rank-meta">
          ${sentimentBadgeHtml(s.overall_label)}
        </div>
        <div class="compound-score ${cls}">${scoreDisplay}</div>
        <div class="pct-row">
          <span class="pct-pos">👍 ${s.positive_pct}%</span>
          <span class="pct-sep">·</span>
          <span class="pct-neg">👎 ${s.negative_pct}%</span>
        </div>
        <div class="review-count">Based on ${s.review_count} reviews</div>
      </div>
    `;
  }).join('');
}

async function loadRankings() {
  rankingsContainer.innerHTML = '<div class="skeleton-loader"><span class="spinner"></span> Computing rankings…</div>';
  try {
    const resp = await fetch('/api/trending');
    const data = await resp.json();
    if (!resp.ok) {
      rankingsContainer.innerHTML = `<p class="error-msg">⚠️ ${escapeHtml(data.error || 'Failed to load rankings')}</p>`;
      return;
    }
    renderRankings(data);
  } catch (err) {
    rankingsContainer.innerHTML = '<p class="error-msg">⚠️ Network error. Please try again.</p>';
  }
}

function loadTitle(title) {
  searchInput.value = title;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  doSearch();
}

refreshBtn.addEventListener('click', loadRankings);

// Load rankings on page load
loadRankings();
