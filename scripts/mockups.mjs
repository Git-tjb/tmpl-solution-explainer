// Stage 04, last step: scene mockups for the operator's review at the design gate.
// Renders the diagrams and builds the page into stages/04_design/output/mockup/, then captures every scene
// at its final reveal step at 1920x1080 and 1440x900 into stages/04_design/output/mockups/NN-SXX-<title>-<w>.png,
// in storyboard order. It measures each capture in the browser (label size, text fit, and the other page
// checks), so a run theme's fonts are measured too, and writes mockups/index.html (a contact sheet with the
// numbers) and mockups/measurements.json.
//   node scripts/mockups.mjs
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { out, P, main, readJson, writeText, rel, UserError } from './lib/common.mjs';
import { renderAll } from './render-diagrams.mjs';
import { stepChecks } from './lib/page-checks.mjs';
import { buildSite } from './build-site.mjs';

const VIEWPORTS = [{ width: 1920, height: 1080 }, { width: 1440, height: 900 }];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = (t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40).replace(/-$/, '');

main(async () => {
  const S = readJson(P.scenes);
  const site = out('04', 'mockup');
  const shots = out('04', 'mockups');
  for (const d of [site, shots]) fs.rmSync(d, { recursive: true, force: true });
  await renderAll(path.join(site, 'assets', 'diagrams'), { strict: false });
  buildSite(site);
  fs.mkdirSync(shots, { recursive: true });

  let browser;
  try { browser = await chromium.launch(); }
  catch (e) { throw new UserError(`Chromium could not start (${e.message.split('\n')[0]}). Install it with: npx playwright install chromium`); }
  const url = pathToFileURL(path.join(site, 'index.html')).href;
  const rows = S.scenes.map((s) => ({ s, shots: {}, m: {} }));
  for (const vp of VIEWPORTS) {
    // Reduced motion: every step lands on its end state at once, which is what a mockup shows.
    const ctx = await browser.newContext({ viewport: vp, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    const key = `${vp.width}x${vp.height}`;
    const floor = 16 * Math.min(1, vp.height / 1080);
    for (const [i, s] of S.scenes.entries()) {
      const last = Math.max(0, ...s.reveals.map((r) => r.step));
      await page.goto(`${url}#${s.id}${last ? '.' + last : ''}`);
      await page.waitForFunction(() => !!window.__explainer && window.__explainer.running() === 0);
      await page.evaluate(() => document.fonts.ready);
      const file = `${String(i + 1).padStart(2, '0')}-${s.id}-${slug(s.title)}-${vp.width}.png`;
      await page.screenshot({ path: path.join(shots, file) });
      const r = await stepChecks(page);
      const problems = Object.entries(r.problems).filter(([id]) => id !== 'AC-27').flatMap(([id, ms]) => ms.map((m) => `${id} ${m}`));
      if (r.minLabelPx !== null && r.minLabelPx < floor - 0.05) problems.unshift(`AC-6 labels ${r.minLabelPx.toFixed(1)}px (min ${floor.toFixed(1)})`);
      rows[i].shots[key] = file;
      rows[i].m[key] = { min_label_px: r.minLabelPx === null ? null : +r.minLabelPx.toFixed(1), floor_px: +floor.toFixed(1), problems };
      rows[i].layout = await page.evaluate((id) => document.querySelector(`.scene[data-scene="${id}"]`)?.getAttribute('data-layout'), s.id);
    }
    await ctx.close();
  }
  await browser.close();
  writeText(path.join(shots, 'measurements.json'), JSON.stringify(rows.map(({ s, layout, m }) => ({ scene: s.id, layout, ...m })), null, 1) + '\n');

  const meas = (m) => `${m.min_label_px === null ? 'no diagram' : `labels ${m.min_label_px}px (min ${m.floor_px})`}${m.problems.length ? ` · <b>${m.problems.length} problem(s)</b>` : ''}`;
  const cards = rows.map(({ shots: f, m, s, layout }) => `<figure><a href="${esc(f['1920x1080'])}"><img src="${esc(f['1920x1080'])}" alt="${esc(`${s.id}: ${s.title}`)}"></a>`
    + `<figcaption><strong>${esc(s.id)}</strong> ${esc(s.title)}<br><span>${esc(s.section)} · ${esc(s.level)} · ${esc(layout || '')} · ${s.minutes} min</span>`
    + `<br><span>1920x1080: ${meas(m['1920x1080'])} · <a href="${esc(f['1440x900'])}">1440x900</a>: ${meas(m['1440x900'])}</span>`
    + [...m['1920x1080'].problems.map((x) => `1920: ${x}`), ...m['1440x900'].problems.map((x) => `1440: ${x}`)].map((x) => `<br><span class="prob">${esc(x)}</span>`).join('')
    + `</figcaption></figure>`).join('\n');
  writeText(path.join(shots, 'index.html'), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mockups: ${esc(S.core_message)}</title>
<style>
body { margin: 0; padding: 24px 32px; background: #14161a; color: #eceae4; font-family: 'Segoe UI', sans-serif; }
h1 { font-size: 24px; margin: 0 0 4px; }
p { color: #b9b6ad; margin: 0 0 24px; }
main { display: grid; grid-template-columns: repeat(auto-fill, minmax(560px, 1fr)); gap: 28px; }
figure { margin: 0; }
img { width: 100%; height: auto; aspect-ratio: 16 / 9; display: block; border: 2px solid #5d6068; }
figcaption { margin-top: 8px; font-size: 18px; }
figcaption span { color: #b9b6ad; font-size: 15px; }
figcaption .prob { color: #e88f8f; }
a { color: inherit; }
</style>
</head>
<body>
<h1>Scene mockups</h1>
<p>${esc(S.core_message)} · ${rows.length} scenes at their final step, in storyboard order, measured at 1920x1080 and 1440x900 (measurements.json). Select one to open it full size.</p>
<main>
${cards}
</main>
</body>
</html>
`);
  console.log(`Wrote ${rows.length} mockup(s) and ${rel(path.join(shots, 'index.html'))}; the page they show is in ${rel(site)}.`);
});
