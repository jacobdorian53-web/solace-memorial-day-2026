// Solace Memorial Day 2026 — Projections page
const usd = n => n == null ? '—' : '$' + Math.round(n).toLocaleString();
const usdK = n => n == null ? '—' : '$' + Math.round(n/1000).toLocaleString() + 'K';
const merFmt = n => n == null ? '—' : Number(n).toFixed(2) + 'x';

async function fetchJSON(p) { const r = await fetch(p + '?t=' + Date.now()); return r.json(); }

function lineDS(label, data, color, dashed=false, width=2) {
  return {
    label, data,
    borderColor: color,
    backgroundColor: color + '22',
    borderDash: dashed ? [6, 6] : [],
    borderWidth: width,
    pointRadius: 3,
    pointBackgroundColor: color,
    tension: 0.3,
    fill: false
  };
}

function chartOpts(yFmt, title) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: !!title, text: title, color: '#e8edf2', font: { size: 14, weight: '600' }, padding: { bottom: 12 } },
      legend: { labels: { color: '#cfd6df', font: { size: 11 } }, position: 'bottom' },
      tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${yFmt(ctx.parsed.y)}` } }
    },
    scales: {
      x: { ticks: { color: '#8a95a3', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
      y: { ticks: { color: '#8a95a3', callback: v => yFmt(v) }, grid: { color: 'rgba(255,255,255,0.06)' } }
    }
  };
}

function renderCharts(targets) {
  const labels = targets.daily_targets.map(d => d.day.replace('Launch ', '').replace('Final ', ''));
  const series = (key, scenario) => targets.daily_targets.map(d => d[scenario][key]);

  new Chart(document.getElementById('chart-revenue'), {
    type: 'line',
    data: { labels, datasets: [
      lineDS('Conservative', series('total_revenue', 'conservative'), '#8a95a3', true, 2),
      lineDS('Moderate', series('total_revenue', 'moderate'), '#4f9eff', false, 3),
      lineDS('Aggressive', series('total_revenue', 'aggressive'), '#9b59ff', true, 2)
    ]},
    options: chartOpts(usdK, 'Total Revenue per Day')
  });

  new Chart(document.getElementById('chart-spend'), {
    type: 'line',
    data: { labels, datasets: [
      lineDS('Conservative', series('paid_spend', 'conservative'), '#8a95a3', true, 2),
      lineDS('Moderate', series('paid_spend', 'moderate'), '#f1c40f', false, 3),
      lineDS('Aggressive', series('paid_spend', 'aggressive'), '#9b59ff', true, 2)
    ]},
    options: chartOpts(usdK, 'Paid Spend per Day')
  });

  new Chart(document.getElementById('chart-mer'), {
    type: 'line',
    data: { labels, datasets: [
      lineDS('Conservative Shopify MER', series('shopify_mer', 'conservative'), '#8a95a3', true, 2),
      lineDS('Moderate Shopify MER', series('shopify_mer', 'moderate'), '#4f9eff', false, 3),
      lineDS('Aggressive Shopify MER', series('shopify_mer', 'aggressive'), '#9b59ff', true, 2),
      lineDS('Moderate Total MER', series('total_mer', 'moderate'), '#2ecc71', false, 2)
    ]},
    options: chartOpts(merFmt, 'MER per Day')
  });
}

function renderDailyTable(targets) {
  const head = `<thead><tr>
    <th>Date</th><th>Day</th>
    <th class="num">Paid Spend</th>
    <th class="num">Shopify Rev</th>
    <th class="num">Amazon (8%)</th>
    <th class="num">Total Rev</th>
    <th class="num">Shopify MER</th>
    <th class="num">Total MER</th>
    <th>Pacing</th>
  </tr></thead>`;
  const rows = targets.daily_targets.map(d => {
    const m = d.moderate;
    return `<tr>
      <td>${d.date}</td>
      <td><strong>${d.day}</strong></td>
      <td class="num">${usd(m.paid_spend)}</td>
      <td class="num">${usd(m.shopify_revenue)}</td>
      <td class="num">${usd(m.amazon_base)}</td>
      <td class="num"><strong>${usd(m.total_revenue)}</strong></td>
      <td class="num">${merFmt(m.shopify_mer)}</td>
      <td class="num">${merFmt(m.total_mer)}</td>
      <td class="pacing">${d.pacing_note}</td>
    </tr>`;
  }).join('');
  // Total row
  const tot = targets.scenarios.moderate;
  const totalRow = `<tr class="total-row">
    <td colspan="2"><strong>Total</strong></td>
    <td class="num"><strong>${usd(tot.paid_spend)}</strong></td>
    <td class="num"><strong>${usd(tot.shopify_revenue)}</strong></td>
    <td class="num"><strong>${usd(tot.amazon_base)}</strong></td>
    <td class="num"><strong>${usd(tot.total_revenue)}</strong></td>
    <td class="num"><strong>${merFmt(tot.shopify_mer)}</strong></td>
    <td class="num"><strong>${merFmt(tot.total_mer)}</strong></td>
    <td></td>
  </tr>`;
  document.getElementById('daily-breakdown').innerHTML = head + '<tbody>' + rows + totalRow + '</tbody>';
}

async function main() {
  const targets = await fetchJSON('data/targets.json');
  renderCharts(targets);
  renderDailyTable(targets);
}

main().catch(e => {
  console.error(e);
  document.body.insertAdjacentHTML('beforeend', '<pre style="color:#ff5b5b;padding:20px;">Page failed to load: ' + e.message + '</pre>');
});
