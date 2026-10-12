// Stage 04, last step: scene mockups for the operator's review at the design gate.
// Renders the diagrams and builds the page into stages/04_design/output/mockup/, then captures every scene
// at its final reveal step at 1920x1080 into stages/04_design/output/mockups/NN-SXX-<title>.png, in
// storyboard order, with mockups/index.html as a contact sheet in the same order.
//   node scripts/mockups.mjs
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { out, P, main, readJson, writeText, rel, UserError } from './lib/common.mjs';
import { renderAll } from './render-diagrams.mjs';
import { buildSite } from './build-site.mjs';

const VIEWPORT = { width: 1920, height: 1080 };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = (t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40).replace(/-$/, '');

main(async () => {
  const S = readJson(P.scenes);
  const site = out('04', 'mockup');
  const shots = out('04', 'mockups');
  for (const d of [site, shots]) fs.rmSync(d, { recursive: true, force: true });
  await renderAll(path.join(site, 'assets', 'diagrams'));
  buildSite(site);
  fs.mkdirSync(shots, { recursive: true });

  let browser;
  try { browser = await chromium.launch(); }
  catch (e) { throw new UserError(`Chromium could not start (${e.message.split('\n')[0]}). Install it with: npx playwright install chromium`); }
  // Reduced motion: every step lands on its end state at once, which is what a mockup shows.
  const ctx = await browser.newContext({ viewport: VIEWPORT, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const url = pathToFileURL(path.join(site, 'index.html')).href;
  const rows = [];
  for (const [i, s] of S.scenes.entries()) {
    const last = Math.max(0, ...s.reveals.map((r) => r.step));
    await page.goto(`${url}#${s.id}${last ? '.' + last : ''}`);
    await page.waitForFunction(() => !!window.__explainer && window.__explainer.running() === 0);
    await page.evaluate(() => document.fonts.ready);
    const file = `${String(i + 1).padStart(2, '0')}-${s.id}-${slug(s.title)}.png`;
    await page.screenshot({ path: path.join(shots, file) });
    rows.push({ file, s, layout: await page.evaluate((id) => document.querySelector(`.scene[data-scene="${id}"]`)?.getAttribute('data-layout'), s.id) });
  }
  await browser.close();

  const cards = rows.map(({ file, s, layout }) => `<figure><a href="${esc(file)}"><img src="${esc(file)}" alt="${esc(`${s.id}: ${s.title}`)}"></a>`
    + `<figcaption><strong>${esc(s.id)}</strong> ${esc(s.title)}<br><span>${esc(s.section)} · ${esc(s.level)} · ${esc(layout || '')} · ${s.minutes} min</span></figcaption></figure>`).join('\n');
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
a { color: inherit; }
</style>
</head>
<body>
<h1>Scene mockups</h1>
<p>${esc(S.core_message)} · ${rows.length} scenes at their final step, 1920x1080, in storyboard order. Select one to open it full size.</p>
<main>
${cards}
</main>
</body>
</html>
`);
  console.log(`Wrote ${rows.length} mockup(s) and ${rel(path.join(shots, 'index.html'))}; the page they show is in ${rel(site)}.`);
});
