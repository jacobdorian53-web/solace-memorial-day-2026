// Solace Memorial Day 2026 — Dashboard logic
const usd = n => n == null ? '—' : '$' + Math.round(n).toLocaleString();
const usdK = n => n == null ? '—' : '$' + (Math.round(n/1000)).toLocaleString() + 'K';
const num = n => n == null ? '—' : Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
const pct = n => n == null ? '—' : (n*100).toFixed(1) + '%';
const merFmt = n => n == null ? '—' : Number(n).toFixed(2) + 'x';

async function fetchJSON(path) {
  const r = await fetch(path + '?t=' + Date.now());
  return r.json();
}

function deltaClass(d) {
  if (d == null) return 'flat';
  if (d > 0) return 'up';
  if (d < 0) return 'down';
  return 'flat';
}

function deltaStr(actual, target, mode='currency') {
  if (actual == null || target == null) return '—';
  const d = actual - target;
  const pctVar = (d / target) * 100;
  const sign = d >= 0 ? '+' : '';
  const val = mode === 'mer' ? sign + d.toFixed(2) + 'x' : sign + Math.round(d).toLocaleString();
  return `${val} (${sign}${pctVar.toFixed(1)}%)`;
}

function renderHero(targets, actuals) {
  const primary = targets.scenarios[actuals.primary_scenario];
  const totals = actuals.days.reduce((acc, d) => {
    acc.spend += (d.paid_spend || 0);
    acc.shopify += (d.shopify_revenue || 0);
    acc.amazon += (d.amazon_revenue || 0);
    return acc;
  }, { spend: 0, shopify: 0, amazon: 0 });
  totals.total = totals.shopify + totals.amazon;
  const shopifyMer = totals.spend > 0 ? totals.shopify / totals.spend : null;
  const totalMer   = totals.spend > 0 ? totals.total   / totals.spend : null;

  // Target-to-date based on dates we have actuals for
  const targetedDates = new Set(actuals.days.map(d => d.date));
  const ttd = targets.daily_targets
    .filter(d => targetedDates.has(d.date))
    .reduce((acc, d) => {
      const s = d[actuals.primary_scenario];
      acc.spend += s.paid_spend;
      acc.shopify += s.shopify_revenue;
      acc.total += s.total_revenue;
      return acc;
    }, { spend: 0, shopify: 0, total: 0 });

  const cards = [
    { label: 'Shopify Revenue (sale-to-date)', value: usd(totals.shopify), delta: ttd.shopify ? deltaStr(totals.shopify, ttd.shopify) : null },
    { label: 'Amazon Revenue (sale-to-date)',  value: usd(totals.amazon),  delta: null },
    { label: 'Total Revenue (sale-to-date)',   value: usd(totals.total),   delta: ttd.total ? deltaStr(totals.total, ttd.total) : null },
    { label: 'Paid Spend (sale-to-date)',      value: usd(totals.spend),   delta: ttd.spend ? deltaStr(totals.spend, ttd.spend) : null },
    { label: 'Shopify MER (sale-to-date)',     value: merFmt(shopifyMer),  delta: null, hint: `Goal ${merFmt(primary.shopify_mer)}` },
    { label: 'Total MER (sale-to-date)',       value: merFmt(totalMer),    delta: null, hint: `Goal ${merFmt(primary.total_mer)}` },
    { label: `Plan: ${actuals.primary_scenario.toUpperCase()}`, value: usd(primary.total_revenue), delta: null, hint: `Spend ${usd(primary.paid_spend)} · MER ${merFmt(primary.total_mer)}` }
  ];

  document.getElementById('hero').innerHTML = cards.map(c => `
    <div class="card">
      <div class="label">${c.label}</div>
      <div class="value">${c.value}</div>
      <div class="delta ${deltaClass(c.delta && c.delta.startsWith('+') ? 1 : c.delta && c.delta.startsWith('-') ? -1 : 0)}">${c.delta || c.hint || ''}</div>
    </div>
  `).join('');
}

function buildLineDataset(label, data, color, dash=false) {
  return {
    label, data,
    borderColor: color,
    backgroundColor: color + '33',
    borderDash: dash ? [6, 6] : [],
    pointRadius: 2,
    tension: 0.25,
    fill: false
  };
}

function renderCharts(targets, actuals) {
  const labels = targets.daily_targets.map(d => d.day.replace('Launch ', ''));
  const dates = targets.daily_targets.map(d => d.date);
  const actualsByDate = Object.fromEntries(actuals.days.map(d => [d.date, d]));

  const series = (key, scenario) => targets.daily_targets.map(d => d[scenario][key]);
  const actualSeries = (key) => dates.map(date => {
    const a = actualsByDate[date];
    if (!a) return null;
    if (key === 'paid_spend') return a.paid_spend ?? null;
    if (key === 'shopify_revenue') return a.shopify_revenue ?? null;
    if (key === 'total_revenue') {
      if (a.shopify_revenue == null) return null;
      return (a.shopify_revenue || 0) + (a.amazon_revenue || 0);
    }
    if (key === 'shopify_mer') {
      if (!a.paid_spend || !a.shopify_revenue) return null;
      return a.shopify_revenue / a.paid_spend;
    }
    if (key === 'total_mer') {
      if (!a.paid_spend || !a.shopify_revenue) return null;
      return ((a.shopify_revenue || 0) + (a.amazon_revenue || 0)) / a.paid_spend;
    }
    return null;
  });

  const commonOpts = (yFmt) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#cfd6df', font: { size: 11 } } },
      tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${yFmt(ctx.parsed.y)}` } }
    },
    scales: {
      x: { ticks: { color: '#8a95a3' }, grid: { color: 'rgba(255,255,255,0.04)' } },
      y: { ticks: { color: '#8a95a3', callback: v => yFmt(v) }, grid: { color: 'rgba(255,255,255,0.06)' } }
    }
  });

  new Chart(document.getElementById('chart-revenue'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        buildLineDataset('Conservative', series('total_revenue', 'conservative'), '#888', true),
        buildLineDataset('Moderate (Plan)', series('total_revenue', 'moderate'), '#4f9eff'),
        buildLineDataset('Aggressive', series('total_revenue', 'aggressive'), '#9b59ff', true),
        Object.assign(buildLineDataset('Actual Total Rev', actualSeries('total_revenue'), '#2ecc71'), { borderWidth: 3 })
      ]
    },
    options: Object.assign(commonOpts(usdK), { plugins: { title: { display: true, text: 'Total Revenue', color: '#e8edf2' }, legend: { labels: { color: '#cfd6df' } } } })
  });

  new Chart(document.getElementById('chart-spend'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        buildLineDataset('Conservative', series('paid_spend', 'conservative'), '#888', true),
        buildLineDataset('Moderate (Plan)', series('paid_spend', 'moderate'), '#4f9eff'),
        buildLineDataset('Aggressive', series('paid_spend', 'aggressive'), '#9b59ff', true),
        Object.assign(buildLineDataset('Actual Spend', actualSeries('paid_spend'), '#f1c40f'), { borderWidth: 3 })
      ]
    },
    options: Object.assign(commonOpts(usdK), { plugins: { title: { display: true, text: 'Paid Spend', color: '#e8edf2' }, legend: { labels: { color: '#cfd6df' } } } })
  });

  new Chart(document.getElementById('chart-mer'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        buildLineDataset('Shopify MER target (Mod)', series('shopify_mer', 'moderate'), '#4f9eff'),
        buildLineDataset('Total MER target (Mod)', series('total_mer', 'moderate'), '#9b59ff', true),
        Object.assign(buildLineDataset('Actual Shopify MER', actualSeries('shopify_mer'), '#2ecc71'), { borderWidth: 3 }),
        Object.assign(buildLineDataset('Actual Total MER', actualSeries('total_mer'), '#ff5b5b'), { borderWidth: 3 })
      ]
    },
    options: Object.assign(commonOpts(merFmt), { plugins: { title: { display: true, text: 'MER', color: '#e8edf2' }, legend: { labels: { color: '#cfd6df' } } } })
  });
}

function renderDailyTable(targets, actuals) {
  const scenario = actuals.primary_scenario;
  const actualsByDate = Object.fromEntries(actuals.days.map(d => [d.date, d]));
  const today = new Date().toISOString().slice(0, 10);

  const head = `<thead><tr>
    <th>Date</th><th>Day</th>
    <th class="num">Spend (T)</th><th class="num">Spend (A)</th><th class="num">Δ</th>
    <th class="num">Shopify Rev (T)</th><th class="num">Shopify Rev (A)</th><th class="num">Δ</th>
    <th class="num">Amazon (A)</th>
    <th class="num">Total Rev (T)</th><th class="num">Total Rev (A)</th><th class="num">Δ</th>
    <th class="num">Shopify MER</th><th class="num">Total MER</th>
    <th>Notes</th>
  </tr></thead>`;

  const rows = targets.daily_targets.map(d => {
    const t = d[scenario];
    const a = actualsByDate[d.date] || {};
    const totalA = (a.shopify_revenue != null) ? (a.shopify_revenue + (a.amazon_revenue || 0)) : null;
    const shopMerA = (a.paid_spend && a.shopify_revenue) ? a.shopify_revenue / a.paid_spend : null;
    const totMerA = (a.paid_spend && a.shopify_revenue != null) ? (a.shopify_revenue + (a.amazon_revenue || 0)) / a.paid_spend : null;

    const dCell = (act, tgt, mode='money') => {
      if (act == null || tgt == null) return '<td class="num">—</td>';
      const d = act - tgt;
      const cls = d >= 0 ? 'delta-pos' : 'delta-neg';
      const v = mode === 'mer' ? (d >= 0 ? '+' : '') + d.toFixed(2) + 'x' : (d >= 0 ? '+' : '') + Math.round(d).toLocaleString();
      return `<td class="num ${cls}">${v}</td>`;
    };

    const future = d.date > today;
    const partial = !!a.partial;
    const rowCls = [future ? 'future' : '', partial ? 'partial' : ''].filter(Boolean).join(' ');
    const dayCell = partial
      ? `${d.day} <span class="partial-tag">partial · as of ${(a.as_of || '').slice(11,16) || '—'} ET</span>`
      : d.day;
    return `<tr class="${rowCls}">
      <td>${d.date}</td>
      <td>${dayCell}</td>
      <td class="num">${usd(t.paid_spend)}</td>
      <td class="num">${a.paid_spend != null ? usd(a.paid_spend) : '—'}</td>
      ${dCell(a.paid_spend, t.paid_spend)}
      <td class="num">${usd(t.shopify_revenue)}</td>
      <td class="num">${a.shopify_revenue != null ? usd(a.shopify_revenue) : '—'}</td>
      ${dCell(a.shopify_revenue, t.shopify_revenue)}
      <td class="num">${a.amazon_revenue != null ? usd(a.amazon_revenue) : '—'}</td>
      <td class="num">${usd(t.total_revenue)}</td>
      <td class="num">${totalA != null ? usd(totalA) : '—'}</td>
      ${dCell(totalA, t.total_revenue)}
      <td class="num">${merFmt(shopMerA)} <span class="muted">/ ${merFmt(t.shopify_mer)}</span></td>
      <td class="num">${merFmt(totMerA)} <span class="muted">/ ${merFmt(t.total_mer)}</span></td>
      <td>${a.note || d.pacing_note}</td>
    </tr>`;
  }).join('');

  document.getElementById('daily-table').innerHTML = head + '<tbody>' + rows + '</tbody>';
}

function renderGuardrails(guardrails) {
  // Framework callout above the table
  const fw = guardrails.decision_framework;
  if (fw) {
    const callout = `<div class="framework-note">
      <strong>Shopify MER</strong> is the paid media decision metric. <strong>Total MER</strong> (Shopify + Amazon) is for broader business reporting only.
      <span class="muted">${fw.context || ''}</span>
    </div>`;
    const target = document.getElementById('guardrails-table');
    if (target && !target.previousElementSibling?.classList.contains('framework-note')) {
      target.insertAdjacentHTML('beforebegin', callout);
    }
  }

  const head = '<thead><tr><th>Action</th><th>Signal</th><th>Response</th></tr></thead>';
  const rows = guardrails.scaling.map(g => {
    const cls = g.action === 'Scale Up' ? 'up' : (g.action === 'Hold' ? 'hold' : 'down');
    return `<tr><td><span class="pill ${cls}">${g.action}</span></td><td>${g.signal}</td><td>${g.response}</td></tr>`;
  }).join('');
  document.getElementById('guardrails-table').innerHTML = head + '<tbody>' + rows + '</tbody>';

  const rhead = '<thead><tr><th>Risk</th><th>Mitigation</th><th>Owner</th><th>Status</th></tr></thead>';
  const rrows = guardrails.risks.map(r => `<tr>
    <td>${r.risk}</td>
    <td>${r.mitigation}</td>
    <td>${r.owner}</td>
    <td><span class="pill ${r.status}">${r.status.toUpperCase()}</span></td>
  </tr>`).join('');
  document.getElementById('risks-table').innerHTML = rhead + '<tbody>' + rrows + '</tbody>';
}

async function main() {
  const [targets, actuals, guardrails] = await Promise.all([
    fetchJSON('data/targets.json'),
    fetchJSON('data/actuals.json'),
    fetchJSON('data/guardrails.json')
  ]);

  document.getElementById('sale-window').textContent = `${targets.sale.start} → ${targets.sale.end}`;
  document.getElementById('offer').textContent = targets.sale.offer;
  document.getElementById('primary-scenario').textContent = actuals.primary_scenario.charAt(0).toUpperCase() + actuals.primary_scenario.slice(1);
  // Find the most recent partial day (if any) to show a mid-day banner
  const latestPartial = [...actuals.days].reverse().find(d => d.partial);
  const lastUpdatedEl = document.getElementById('last-updated');
  if (latestPartial) {
    const t = (latestPartial.as_of || '').slice(11,16);
    lastUpdatedEl.innerHTML = `${actuals.last_updated || '—'} &middot; <span style="color: var(--warn); font-weight: 600;">Includes intraday read for ${latestPartial.date} as of ${t} ET</span>`;
  } else {
    lastUpdatedEl.textContent = actuals.last_updated || '—';
  }

  renderHero(targets, actuals);
  renderCharts(targets, actuals);
  renderDailyTable(targets, actuals);
  renderGuardrails(guardrails);
}

main().catch(e => {
  console.error(e);
  document.body.insertAdjacentHTML('beforeend', '<pre style="color:#ff5b5b;padding:20px;">Dashboard failed to load: ' + e.message + '</pre>');
});
