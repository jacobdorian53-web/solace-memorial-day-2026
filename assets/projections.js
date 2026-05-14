// Projections page — renders the Moderate daily plan table.
const usd = n => n == null ? '—' : '$' + Math.round(n).toLocaleString();
const merFmt = n => n == null ? '—' : Number(n).toFixed(2) + 'x';

async function fetchJSON(p) { const r = await fetch(p + '?t=' + Date.now()); return r.json(); }

function fmtShortDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function renderDailyTable(targets) {
  const head = `<thead><tr>
    <th>Date</th>
    <th>Day</th>
    <th class="num">Paid Spend</th>
    <th class="num">Shopify Rev</th>
    <th class="num">Amazon</th>
    <th class="num">Total Rev</th>
    <th class="num">Shopify MER</th>
    <th class="num">Total MER</th>
  </tr></thead>`;
  const rows = targets.daily_targets.map(d => {
    const m = d.moderate;
    return `<tr>
      <td class="date-cell">${fmtShortDate(d.date)}</td>
      <td class="day-cell">${d.day}</td>
      <td class="num">${usd(m.paid_spend)}</td>
      <td class="num">${usd(m.shopify_revenue)}</td>
      <td class="num">${usd(m.amazon_base)}</td>
      <td class="num">${usd(m.total_revenue)}</td>
      <td class="num">${merFmt(m.shopify_mer)}</td>
      <td class="num">${merFmt(m.total_mer)}</td>
    </tr>`;
  }).join('');
  const tot = targets.scenarios.moderate;
  const totalRow = `<tr class="total">
    <td></td>
    <td>Total</td>
    <td class="num">${usd(tot.paid_spend)}</td>
    <td class="num">${usd(tot.shopify_revenue)}</td>
    <td class="num">${usd(tot.amazon_base)}</td>
    <td class="num">${usd(tot.total_revenue)}</td>
    <td class="num">${merFmt(tot.shopify_mer)}</td>
    <td class="num">${merFmt(tot.total_mer)}</td>
  </tr>`;
  document.getElementById('daily-breakdown').innerHTML = head + '<tbody>' + rows + totalRow + '</tbody>';
}

async function main() {
  const targets = await fetchJSON('data/targets.json');
  renderDailyTable(targets);
}

main().catch(e => {
  console.error(e);
  document.body.insertAdjacentHTML('beforeend', '<pre style="color:#b7322c;padding:20px;">Page failed to load: ' + e.message + '</pre>');
});
