// Builds the "Road to Spain" tracker box from src/content/settings/spain-tracker.json.
// Used by the Spain Diaries page and by the [[spain-tracker]] shortcode in stories.
import fs from 'node:fs';
import path from 'node:path';

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const usd = (n) => '$' + Math.round(n).toLocaleString('en-US');
const eur = (n) => '€' + Math.round(n).toLocaleString('en-US');

export function spainTrackerHtml() {
  const file = path.join(process.cwd(), 'src/content/settings/spain-tracker.json');
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const rate = Number(d.usd_per_eur) || 1.1;
  const streams = (d.streams || []).filter((s) => s && s.name);
  const income = streams.reduce((a, s) => a + (Number(s.usd_per_month) || 0), 0);
  const goal = Number(d.income_goal_usd) || 4000;
  const house = Math.max(0, Math.min(100, Number(d.house_saved_percent) || 0));
  const incPct = Math.max(0, Math.min(100, Math.round((income / goal) * 100)));
  const when = d.updated ? new Date(d.updated + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';
  const bar = (pct) => `<span class="rts-bar"><span style="width:${pct}%"></span></span>`;
  const list = streams
    .map((s) => `<li><span>${esc(s.name)}</span><strong>${Number(s.usd_per_month) ? usd(s.usd_per_month) : 'Building'}</strong></li>`)
    .join('');
  return `<aside class="rts" aria-label="Road to Spain tracker">
<p class="kick">The Road to Spain · Tracker</p>
<div class="rts-grid">
<div class="rts-item"><p class="rts-label">House fund</p><p class="rts-big">${house}%<span> saved</span></p>${bar(house)}<p class="rts-sub">Goal: buy our home in Spain outright</p></div>
<div class="rts-item"><p class="rts-label">Monthly income</p><p class="rts-big">${usd(income)}<span> of ${usd(goal)}</span></p>${bar(incPct)}<p class="rts-sub">${incPct}% of our goal · about ${eur(income / rate)} of ${eur(goal / rate)}</p></div>
</div>
${list ? `<ul class="rts-streams">${list}</ul>` : ''}
<p class="rts-foot">${when ? `Last updated ${esc(when)}. ` : ''}${esc(d.note || '')} Euro amounts at about $${rate.toFixed(2)} to €1.</p>
</aside>`;
}
