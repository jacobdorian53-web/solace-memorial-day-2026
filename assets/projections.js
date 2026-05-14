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
  const calEl = document.getElementById('send-calendar');
  if (calEl) {
    const window = notes.sale_window || { start: '2026-05-18', end: '2026-05-25' };
    const start = new Date(window.start + 'T00:00:00');
    const end = new Date(window.end + 'T00:00:00');
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Build a day-by-day list across the sale window
    const days = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const iso = d.toISOString().slice(0, 10);
      const sends = (notes.sends || []).filter(s => s.date === iso);
      days.push({
        iso,
        dow: dayNames[d.getDay()],
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sends
      });
    }

    calEl.innerHTML = days.map(d => {
      const hasSends = d.sends.length > 0;
      const sendItems = hasSends
        ? d.sends.map(s => {
            const chCls = (s.channel || '').toLowerCase() === 'sms' ? 'sms' : 'email';
            return `<div class="send-item">
              <span class="send-channel ${chCls}">${s.channel}</span>
              <span class="send-time">${s.time || ''}</span>
              <span class="send-name">${s.name}</span>
              ${s.audience ? `<span class="send-audience">${s.audience}</span>` : ''}
            </div>`;
          }).join('')
        : '<div class="send-empty">No sends scheduled</div>';

      return `<div class="cal-day ${hasSends ? 'has-sends' : ''}">
        <div class="cal-day-head">
          <div class="cal-dow">${d.dow}</div>
          <div class="cal-date">${d.label}</div>
        </div>
        <div class="cal-day-body">${sendItems}</div>
      </div>`;
    }).join('');
  }

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
