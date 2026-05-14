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

function renderNotes(notes) {
  // Wholesale
  const ws = notes.wholesale || {};
  const wsEl = document.getElementById('wholesale-block');
  if (wsEl) {
    if (ws.dates && ws.dates.length) {
      wsEl.classList.remove('notes-empty');
      wsEl.innerHTML = ws.dates.map(d => `<div class="wholesale-row"><strong>${fmtShortDate(d.date)}</strong> &mdash; ${d.label || ''}</div>`).join('');
    } else {
      wsEl.textContent = ws.note || 'Dates TBD.';
    }
  }

  // Campaigns table
  const head = `<thead><tr>
    <th>Date</th>
    <th>Time</th>
    <th>Channel</th>
    <th>Campaign</th>
    <th>Audience</th>
  </tr></thead>`;
  const rows = (notes.campaigns || []).map(c => `<tr>
    <td class="date-cell">${fmtShortDate(c.date)}</td>
    <td>${c.time || ''}</td>
    <td><span class="channel-pill">${c.channel}</span></td>
    <td class="day-cell">${c.name}</td>
    <td class="muted-cell">${c.audience || ''}</td>
  </tr>`).join('');
  const tEl = document.getElementById('campaigns-table');
  if (tEl) tEl.innerHTML = head + '<tbody>' + rows + '</tbody>';

  // Pending list
  const pEl = document.getElementById('pending-list');
  if (pEl) pEl.innerHTML = (notes.pending || []).map(p => `<li>${p}</li>`).join('');
}

async function main() {
  const [targets, notes] = await Promise.all([
    fetchJSON('data/targets.json'),
    fetchJSON('data/notes.json').catch(() => ({ campaigns: [], pending: [], wholesale: {} }))
  ]);
  renderDailyTable(targets);
  renderNotes(notes);
}

main().catch(e => {
  console.error(e);
  document.body.insertAdjacentHTML('beforeend', '<pre style="color:#b7322c;padding:20px;">Page failed to load: ' + e.message + '</pre>');
});
