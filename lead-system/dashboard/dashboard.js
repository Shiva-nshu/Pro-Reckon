(function () {
  const API_BASE = window.location.origin;
  const content = document.getElementById('content');
  const errorEl = document.getElementById('error');

  function getTierClass(tier) {
    if (tier === 'Hot Lead') return 'badge-hot';
    if (tier === 'Qualified Lead') return 'badge-qualified';
    return 'badge-low';
  }

  function getTierShort(tier) {
    if (tier === 'Hot Lead') return 'Hot';
    if (tier === 'Qualified Lead') return 'Qualified';
    return 'Low';
  }

  function buildQuery() {
    const minScore = document.querySelector('input[name="filter"]:checked')?.value;
    const source = document.getElementById('sourceFilter').value;
    const params = new URLSearchParams();
    if (minScore) params.set('minScore', minScore);
    if (source) params.set('source', source);
    return params.toString();
  }

  function renderTable(leads) {
    if (!leads.length) {
      content.innerHTML = '<div class="loading">No leads found. Run scraping to fetch leads.</div>';
      return;
    }
    content.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Company</th>
            <th>Industry</th>
            <th>Location</th>
            <th>Source</th>
            <th>Score</th>
            <th>Tier</th>
            <th>Website</th>
            <th>Email</th>
            <th>Phone</th>
            <th>LinkedIn</th>
          </tr>
        </thead>
        <tbody>
          ${leads.map(function (l) {
            const tier = l.tier || (l.qualificationScore >= 70 ? 'Hot Lead' : l.qualificationScore >= 60 ? 'Qualified Lead' : 'Low Priority');
            const score = l.qualificationScore ?? l.score ?? 0;
            const emailCell = l.email ? '<a href="mailto:' + escapeAttr(l.email) + '">' + escapeHtml(l.email) + '</a>' : '—';
            const linkedInCell = l.linkedIn ? '<a href="' + escapeAttr(l.linkedIn) + '" target="_blank" rel="noopener">LinkedIn</a>' : '—';
            return `
              <tr>
                <td>${escapeHtml(l.companyName || '—')}</td>
                <td>${escapeHtml(l.industry || '—')}</td>
                <td>${escapeHtml(l.location || '—')}</td>
                <td>${escapeHtml(l.source || '—')}</td>
                <td>${score}</td>
                <td><span class="badge ${getTierClass(tier)}">${getTierShort(tier)}</span></td>
                <td>${l.website ? '<a href="' + escapeAttr(l.website) + '" target="_blank" rel="noopener">' + escapeHtml(l.website) + '</a>' : '—'}</td>
                <td>${emailCell}</td>
                <td>${escapeHtml(l.phone || '—')}</td>
                <td>${linkedInCell}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }
  function escapeAttr(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML.replace(/"/g, '&quot;');
  }

  function showError(msg) {
    errorEl.textContent = msg;
  }
  function clearError() {
    errorEl.textContent = '';
  }

  function loadLeads() {
    clearError();
    content.innerHTML = '<div class="loading">Loading leads…</div>';
    const qs = buildQuery();
    fetch(API_BASE + '/api/leads?' + qs)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.error) {
          showError(data.error);
          renderTable([]);
          return;
        }
        renderTable(data.leads || []);
      })
      .catch(function (err) {
        showError('Failed to load leads: ' + err.message);
        renderTable([]);
      });
  }

  document.getElementById('refresh').addEventListener('click', loadLeads);
  document.querySelectorAll('input[name="filter"]').forEach(function (el) {
    el.addEventListener('change', loadLeads);
  });
  document.getElementById('sourceFilter').addEventListener('change', loadLeads);

  document.getElementById('runScrape').addEventListener('click', function () {
    const btn = this;
    btn.disabled = true;
    fetch(API_BASE + '/api/leads/scrape/run', { method: 'POST' })
      .then(function (res) { return res.json(); })
      .then(function () {
        alert('Scraping started in background. Refresh the list in a minute.');
        btn.disabled = false;
      })
      .catch(function () {
        alert('Failed to start scraper');
        btn.disabled = false;
      });
  });

  loadLeads();
})();
