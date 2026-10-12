// Stage 06: run the scripted acceptance criteria (stages/06_verify/references/acceptance-criteria.md)
// in Chromium, Edge, and Firefox, and capture screenshots. Always exits 0 unless it cannot run;
// results go to stages/06_verify/output/verify-results.json.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, firefox } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import { P, out, main, readJson, readText, loadTokens, loadModel, hexToRgb, contrast, Report, walk, sha256, rel, writeText } from './lib/common.mjs';
import { loadViewSpecs } from './check-design.mjs';
import { checkModel } from './check-model.mjs';
import { checkStoryboard } from './check-storyboard.mjs';
import { renderAll } from './render-diagrams.mjs';
import { buildSite } from './build-site.mjs';

const VIEWPORTS = [{ width: 1920, height: 1080 }, { width: 1440, height: 900 }];
const BROWSERS = [
  { name: 'chromium', type: chromium, opts: {} },
  { name: 'msedge', type: chromium, opts: { channel: 'msedge' } },
  { name: 'firefox', type: firefox, opts: {} },
];
const C = {};
const crit = (id) => (C[id] ||= { result: 'pass', details: [] });
const fail = (id, msg) => { const c = crit(id); c.result = 'fail'; if (c.details.length < 40) c.details.push(msg); };
const note = (id, msg) => { const c = crit(id); if (c.details.length < 40) c.details.push(msg); };

async function settle(page, ms = 6000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (await page.evaluate(() => window.__explainer.running() === 0)) return true;
    await page.waitForTimeout(50);
  }
  return false;
}
const st = (page) => page.evaluate(() => window.__explainer.state());

// Every action target of the current scene's steps up to the current step is in its end state.
async function endStateProblems(page) {
  return page.evaluate(() => {
    const D = window.EXPLAINER, s = window.__explainer.state();
    const sc = D.scenes.find((x) => x.id === s.scene);
    const el = document.querySelector(`.scene[data-scene="${s.scene}"]`);
    const find = (t) => {
      if (/^text-\d+$/.test(t)) return el.querySelectorAll(`.text p[data-text="${t.slice(5)}"]`);
      const svg = el.querySelector('svg.diagram'); if (!svg) return [];
      if (/^step-\d+$/.test(t)) return svg.querySelectorAll(`[data-step="${t.slice(5)}"]`);
      if (t.includes('--')) return svg.querySelectorAll(`[data-edge="${t}"]`);
      return svg.querySelectorAll(`[data-el="${t}"], [data-node="${t}"], [data-rel~="${t}"]`);
    };
    const probs = [];
    for (const step of sc.steps) {
      if (step.step > s.step) continue;
      for (const a of step.actions) for (const t of a.targets || []) {
        if (a.do === 'expand' || a.do === 'collapse') {
          const later = (what) => sc.steps.some((x) => x.step > step.step && x.step <= s.step && x.actions.some((y) => y.do === what && (y.targets || []).includes(t)));
          const open = window.__explainer.popovers().includes(t);
          if (a.do === 'expand' && !open && !later('collapse')) probs.push(`${s.scene}.${step.step}: "${t}" popover not open`);
          if (a.do === 'collapse' && open && !later('expand')) probs.push(`${s.scene}.${step.step}: "${t}" popover still open`);
          continue;
        }
        const nodes = find(t);
        if (!nodes.length) { probs.push(`${s.scene}.${step.step}: target "${t}" not found`); continue; }
        for (const n of nodes) {
          const hidden = n.classList.contains('is-hidden');
          if ((a.do === 'show' || a.do === 'show-text') && hidden && !sc.steps.some((x) => x.step > step.step && x.step <= s.step && x.actions.some((y) => y.do === 'hide' && (y.targets || []).includes(t)))) probs.push(`${s.scene}.${step.step}: "${t}" still hidden`);
          if (a.do === 'highlight' && !n.classList.contains('hl') && !sc.steps.some((x) => x.step > step.step && x.step <= s.step && x.actions.some((y) => y.do === 'clear-highlight'))) probs.push(`${s.scene}.${step.step}: "${t}" not highlighted`);
          if (a.do === 'trace' && !n.classList.contains('traced') && !sc.steps.some((x) => x.step > step.step && x.step <= s.step && x.actions.some((y) => y.do === 'clear-highlight'))) probs.push(`${s.scene}.${step.step}: "${t}" not traced`);
        }
      }
    }
    if (el.querySelector('.tracer')) probs.push(`${s.scene}: a trace dot is still on screen`);
    return probs;
  });
}

// AC-16: the level indicator is on screen, in the one form notation.md defines, for the current scene.
async function indicatorProblems(page, scene) {
  return page.evaluate((scene) => {
    const el = document.querySelector('.chrome .level-indicator');
    if (!el) return ['no level indicator in the chrome'];
    const cs = getComputedStyle(el), r = el.getBoundingClientRect();
    const probs = [];
    if (cs.display === 'none' || cs.visibility !== 'visible' || parseFloat(cs.opacity) < 0.5 || r.width < 40 || r.height < 10) probs.push('level indicator is hidden');
    if (r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || r.left < -1) probs.push('level indicator is off screen');
    const want = scene.section === 'orientation' ? 'key' : scene.level;
    if (el.getAttribute('data-level') !== want) probs.push(`level indicator shows "${el.getAttribute('data-level')}", expected "${want}"`);
    const rungs = el.querySelectorAll('[data-rung]').length, on = el.querySelectorAll('[data-rung].on').length;
    if (rungs !== 4) probs.push(`level indicator has ${rungs} rungs (4)`);
    if (want === 'key' ? on !== 0 : want === 'flow' ? on < 1 : on !== 1) probs.push(`level indicator fills ${on} rung(s)`);
    return probs;
  }, scene);
}

// AC-17: every expandable element in the current scene opens its popover with its bullets, and closes.
async function expandProblems(page, sceneId) {
  const ids = await page.$$eval(`.scene[data-scene="${sceneId}"] svg.diagram [data-expand][role="button"]`, (els) => [...new Set(els.map((e) => e.getAttribute('data-expand')))]);
  const probs = [];
  for (const id of ids) {
    await page.keyboard.press('Escape');
    await page.locator(`.scene[data-scene="${sceneId}"] svg.diagram [data-expand="${id}"]`).first().click({ timeout: 3000 });
    await settle(page);
    const got = await page.evaluate((id) => {
      const p = document.querySelector(`.scene.current .popover[data-for="${id}"]`);
      if (!p) return null;
      const r = p.getBoundingClientRect();
      return { items: [...p.querySelectorAll('li')].map((l) => l.textContent), want: window.EXPLAINER.els[id]?.items || [],
        inView: r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1 };
    }, id);
    if (!got) { probs.push(`${sceneId}: "${id}" did not open its popover`); continue; }
    if (got.items.join('|') !== got.want.join('|')) probs.push(`${sceneId}: "${id}" popover shows different bullets than the model`);
    if (!got.inView) probs.push(`${sceneId}: "${id}" popover extends past the viewport`);
    await page.keyboard.press('Escape');
    if ((await page.evaluate(() => window.__explainer.popovers().length)) !== 0) probs.push(`${sceneId}: Escape did not close "${id}"`);
  }
  if (ids.length) {
    await page.locator(`.scene[data-scene="${sceneId}"] svg.diagram [data-expand="${ids[0]}"]`).first().focus();
    await page.keyboard.press('Enter');
    if (!(await page.evaluate((id) => window.__explainer.popovers().includes(id), ids[0]))) probs.push(`${sceneId}: Enter did not open "${ids[0]}"`);
    await page.keyboard.press('Escape');
  }
  return { probs, count: ids.length };
}

async function traverse(page, label, expected, { reduced = false } = {}) {
  for (let i = 1; i < expected.length; i++) {
    await page.keyboard.press('ArrowRight');
    if (reduced) {
      const n = await page.evaluate(() => window.__explainer.running());
      if (n) fail('AC-4', `${label}: reduced motion still animated at ${expected[i]}`);
    } else if (!(await settle(page))) fail('AC-4', `${label}: animation did not finish at ${expected[i]}`);
    const s = await st(page);
    if (`${s.scene}.${s.step}` !== expected[i]) { fail('AC-2', `${label}: forward step ${i} reached ${s.scene}.${s.step}, expected ${expected[i]}`); return; }
    for (const p of await endStateProblems(page)) fail('AC-4', `${label}: ${p}`);
  }
  if (reduced) return;
  for (let i = expected.length - 2; i >= 0; i--) {
    await page.keyboard.press('ArrowLeft');
    await settle(page);
    const s = await st(page);
    if (`${s.scene}.${s.step}` !== expected[i]) { fail('AC-2', `${label}: backward reached ${s.scene}.${s.step}, expected ${expected[i]}`); return; }
  }
}

async function checkMap(page, label, full) {
  try { await checkMapInner(page, label, full); }
  catch (e) { fail('AC-3', `${label}: map check stopped: ${e.message.split(/\r?\n/)[0]}`); }
  await page.keyboard.press('Escape');
}
async function checkMapInner(page, label, full) {
  await page.keyboard.press('m');
  const open = await page.evaluate(() => ({ open: document.getElementById('map').classList.contains('open'), s: window.__explainer.state(), active: document.activeElement?.tagName }));
  if (!open.open) { fail('AC-3', `${label}: M did not open the map (at ${open.s.scene}.${open.s.step}, focus on ${open.active})`); return; }
  const ids = await page.$$eval('#map .views [data-el].has-link', (els) => [...new Set(els.map((e) => e.getAttribute('data-el')))]);
  if (!ids.length) fail('AC-3', `${label}: the map has no clickable elements`);
  for (const id of full ? ids : ids.slice(0, 3)) {
    await page.locator(`#map .views [data-el="${id}"].has-link`).first().click({ timeout: 3000 });
    const ok = await page.evaluate((id) => document.documentElement.getAttribute('data-panel') === id
      && !document.querySelector(`#map [data-panel="${id}"]`).hidden, id);
    if (!ok) fail('AC-3', `${label}: clicking "${id}" did not open its panel`);
    if (!full) continue;
    const links = await page.$$eval(`#map [data-panel="${id}"] a[href^="#S"]`, (as) => as.map((a) => a.getAttribute('href')));
    for (const href of links) {
      await page.locator(`#map [data-panel="${id}"] a[href="${href}"]`).first().click({ timeout: 3000 });
      await settle(page);
      const s = await st(page);
      const open = await page.evaluate(() => document.getElementById('map').classList.contains('open'));
      if (`#${s.scene}` !== href.replace(/\.\d+$/, '') || open) fail('AC-3', `${label}: panel "${id}" link ${href} landed on ${s.scene} (map ${open ? 'still open' : 'closed'})`);
      await page.keyboard.press('m');
      await page.locator(`#map .views [data-el="${id}"].has-link`).first().click({ timeout: 3000 });
    }
  }
}

async function legibility(page, label, tokens) {
  const bg = hexToRgb(tokens['--bg']);
  // build-rules.md sizes are for 1920x1080; smaller viewports scale them by height.
  const res = await page.evaluate(() => {
    const k = Math.min(1, innerHeight / 1080);
    const px = (el) => parseFloat(getComputedStyle(el).fontSize);
    const rgb = (c) => (c.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);
    const sc = document.querySelector('.scene.current');
    const out = { small: [], colors: [], overflow: [] };
    for (const el of sc.querySelectorAll('h2, .text p, .popover h3, .popover li')) {
      if (px(el) < 20 * k - 0.05) out.small.push(`text "${el.textContent.slice(0, 30)}" is ${px(el)}px (min ${(20 * k).toFixed(1)})`);
      out.colors.push({ what: el.textContent.slice(0, 30), c: rgb(getComputedStyle(el).color) });
      if (el.scrollWidth > el.clientWidth + 1) out.overflow.push(`"${el.textContent.slice(0, 30)}" overflows its box`);
    }
    const svg = sc.querySelector('svg.diagram');
    if (svg) {
      const vb = svg.viewBox.baseVal, r = svg.getBoundingClientRect();
      const scale = r.width / vb.width;
      let min = 99;
      for (const t of svg.querySelectorAll('.nodes text, .edges text, .boundaries text')) {
        if (t.closest('.is-hidden')) continue;
        min = Math.min(min, parseFloat(getComputedStyle(t).fontSize) * scale);
        if (!t.closest('.node:not(.hl)') || !svg.classList.contains('has-hl')) out.colors.push({ what: `diagram label "${t.textContent.slice(0, 20)}"`, c: rgb(getComputedStyle(t).fill) });
      }
      if (min < 16 * k - 0.05) out.small.push(`diagram labels render at ${min.toFixed(1)}px (scale ${scale.toFixed(2)}); min ${(16 * k).toFixed(1)}px`);
      if (r.right > innerWidth + 1 || r.bottom > innerHeight + 1) out.overflow.push('diagram extends past the viewport');
    }
    if (document.documentElement.scrollWidth > innerWidth + 1) out.overflow.push('page scrolls horizontally');
    return out;
  });
  for (const m of [...res.small, ...res.overflow]) fail('AC-6', `${label}: ${m}`);
  const seen = new Set();
  for (const { what, c } of res.colors) {
    if (c.length < 3) continue;
    const ratio = contrast(c, bg);
    const key = c.join(',');
    if (ratio < 7 && !seen.has(key)) { seen.add(key); fail('AC-6', `${label}: ${what} contrast ${ratio.toFixed(2)}:1 (min 7:1)`); }
  }
}

main(async () => {
  const S = readJson(P.scenes);
  const tokens = loadTokens();
  const indexFile = path.join(P.site, 'index.html');
  if (!fs.existsSync(indexFile)) throw new Error('No site. Run stage 05 first.');
  const url = pathToFileURL(indexFile).href;
  const expected = [];
  S.scenes.forEach((s) => { for (let k = 0; k <= Math.max(0, ...s.reveals.map((r) => r.step)); k++) expected.push(`${s.id}.${k}`); });
  const shots = out('06', 'screenshots');
  fs.rmSync(shots, { recursive: true, force: true });
  fs.mkdirSync(shots, { recursive: true });
  const browsersRun = [];
  for (const id of ['AC-1', 'AC-2', 'AC-3', 'AC-4', 'AC-5', 'AC-6', 'AC-13', 'AC-16', 'AC-17']) crit(id);
  let expandCount = 0;

  for (const B of BROWSERS) {
    let browser;
    try { browser = await B.type.launch(B.opts); }
    catch (e) { fail('AC-1', `${B.name}: could not launch (${e.message.split('\n')[0]}). Install with: npx playwright install`); continue; }
    browsersRun.push(B.name);
    for (const vp of VIEWPORTS) {
      const label = `${B.name} ${vp.width}x${vp.height}`;
      const ctx = await browser.newContext({ viewport: vp });
      const page = await ctx.newPage();
      page.on('console', (m) => { if (m.type() === 'error') fail('AC-1', `${label}: console error: ${m.text()}`); });
      page.on('pageerror', (e) => fail('AC-1', `${label}: page error: ${e.message}`));
      page.on('request', (r) => { if (!/^(file|data|blob):/.test(r.url())) fail('AC-1', `${label}: network request to ${r.url()}`); });
      await page.goto(url);
      await page.waitForFunction(() => !!window.__explainer);
      const first = vp.width === 1920;
      if (first) {
        await traverse(page, label, expected);
        await checkMap(page, label, B.name === 'chromium');
        // Hash deep links
        for (const target of [expected[Math.min(3, expected.length - 1)], expected[expected.length - 1]]) {
          await page.goto(`${url}#${target.replace(/\.0$/, '')}`);
          await page.waitForFunction(() => !!window.__explainer);
          const s = await st(page);
          if (`${s.scene}.${s.step}` !== target) fail('AC-3', `${label}: #${target} opened ${s.scene}.${s.step}`);
        }
        const pid = S.map.panels[0]?.element;
        if (pid) {
          await page.goto(`${url}#map:${pid}`);
          await page.waitForFunction(() => !!window.__explainer);
          const ok = await page.evaluate((id) => document.getElementById('map').classList.contains('open') && document.documentElement.getAttribute('data-panel') === id, pid);
          if (!ok) fail('AC-3', `${label}: #map:${pid} did not open the panel`);
        }
        // Links and anchors
        const hrefs = await page.$$eval('a[href^="#"]', (as) => as.map((a) => a.getAttribute('href')));
        const ids = new Set(S.scenes.map((s) => s.id));
        for (const h of new Set(hrefs)) if (!ids.has(h.slice(1).replace(/\.\d+$/, '')) && !/^#map:/.test(h)) fail('AC-5', `${label}: link ${h} has no target`);
      }
      // Legibility, screenshots, accessibility: every scene at its final step
      for (const s of S.scenes) {
        const last = Math.max(0, ...s.reveals.map((r) => r.step));
        await page.goto(`${url}#${s.id}${last ? '.' + last : ''}`);
        await page.waitForFunction(() => !!window.__explainer);
        await settle(page);
        await legibility(page, `${label} ${s.id}`, tokens);
        for (const p of await indicatorProblems(page, s)) fail('AC-16', `${label} ${s.id}: ${p}`);
        if (B.name === 'chromium') {
          await page.screenshot({ path: path.join(shots, `${s.id}-${vp.width}x${vp.height}.png`) });
          if (first) {
            const r = await new AxeBuilder({ page }).options({ preload: false }).include('.scene.current').include('.chrome').analyze();
            for (const v of r.violations) if (['critical', 'serious'].includes(v.impact)) fail('AC-13', `${s.id}: ${v.id} (${v.impact}): ${v.help} [${v.nodes.length} node(s)]`);
            const ex = await expandProblems(page, s.id);
            expandCount += ex.count;
            for (const p of ex.probs) fail('AC-17', `${label} ${p}`);
          }
        }
      }
      if (B.name === 'chromium' && first) {
        await page.goto(`${url}#map:${S.map.panels[0]?.element || ''}`);
        await page.waitForFunction(() => !!window.__explainer);
        await page.screenshot({ path: path.join(shots, `map-${vp.width}x${vp.height}.png`) });
        const r = await new AxeBuilder({ page }).options({ preload: false }).include('#map').analyze();
        for (const v of r.violations) if (['critical', 'serious'].includes(v.impact)) fail('AC-13', `map: ${v.id} (${v.impact}): ${v.help} [${v.nodes.length} node(s)]`);
      }
      await ctx.close();
    }
    // Reduced motion
    const rctx = await browser.newContext({ viewport: VIEWPORTS[0], reducedMotion: 'reduce' });
    const rpage = await rctx.newPage();
    await rpage.goto(url);
    await rpage.waitForFunction(() => !!window.__explainer);
    await traverse(rpage, `${B.name} reduced-motion`, expected, { reduced: true });
    await rctx.close();
    await browser.close();
  }

  // AC-7 length
  const minutes = S.scenes.reduce((a, s) => a + s.minutes, 0);
  crit('AC-7');
  if (S.scenes.length < 8 || S.scenes.length > 14) fail('AC-7', `${S.scenes.length} scenes (8-14)`);
  if (minutes > Math.min(15, S.target_minutes)) fail('AC-7', `${minutes} minutes exceeds ${Math.min(15, S.target_minutes)}`);
  note('AC-7', `${S.scenes.length} scenes, ${minutes} minutes`);

  // AC-8 model, AC-10 IA (scripted part)
  const r8 = new Report('check-model'); checkModel(r8);
  crit('AC-8'); r8.errors.forEach((e) => fail('AC-8', e));
  const r10 = new Report('check-storyboard'); checkStoryboard(r10);
  crit('AC-10'); r10.errors.forEach((e) => fail('AC-10', e));
  C['AC-10'].result = C['AC-10'].result === 'pass' ? 'review' : 'fail';
  note('AC-10', 'Scripted IA rules checked; "problem before design" and one point per scene need review.');

  // AC-9 diagrams, AC-11 scene IDs (from the built page)
  const html = readText(indexFile);
  crit('AC-9');
  const declared = new Set(S.views.map((v) => v.id));
  const files = fs.readdirSync(path.join(P.site, 'assets', 'diagrams')).filter((f) => f.endsWith('.svg')).map((f) => f.slice(0, -4));
  for (const f of files) if (!declared.has(f)) fail('AC-9', `diagram ${f}.svg is not a declared view`);
  for (const m of html.matchAll(/<svg\b[^>]*>/g)) if (!/class="diagram/.test(m[0]) || !/data-view="([^"]+)"/.test(m[0]) || !declared.has(m[0].match(/data-view="([^"]+)"/)[1])) fail('AC-9', `an <svg> in the page is not a rendered view: ${m[0].slice(0, 80)}`);
  for (const id of declared) {
    const svg = readText(path.join(P.site, 'assets', 'diagrams', `${id}.svg`));
    if (!/<title id="se-title-/.test(svg)) fail('AC-9', `${id}: no title`);
    if (!/<g class="legend"><text class="lgtitle"/.test(svg)) fail('AC-9', `${id}: no legend`);
    const nodes = [...svg.matchAll(/<g class="node el [^"]*" data-el="([^"]+)"/g)].length;
    const fnodes = [...svg.matchAll(/<g class="node fn n-([a-z]+)[^"]*" data-node="[^"]+" data-step="\d+"( data-on="[^"]+")?/g)];
    if (nodes > 9) fail('AC-9', `${id}: ${nodes} elements (max 9)`);
    if (fnodes.length > 12) fail('AC-9', `${id}: ${fnodes.length} flow nodes (max 12)`);
    for (const m of fnodes) if (!['trigger', 'output'].includes(m[1]) && !m[2]) fail('AC-9', `${id}: a ${m[1]} node is not bound to an element`);
    const typed = [...svg.matchAll(/<g class="node el [^"]*"[^>]*>(.*?)<\/g>/g)].every((m) => /class="type"/.test(m[1]));
    if (!typed) fail('AC-9', `${id}: an element has no type label`);
  }
  // AC-16 level shown in the one defined form (the chrome part ran in the browsers above)
  crit('AC-16');
  for (const id of declared) if (!/<g class="badge"><rect /.test(readText(path.join(P.site, 'assets', 'diagrams', `${id}.svg`)))) fail('AC-16', `${id}.svg has no level badge in its title row`);
  const orientAt = S.scenes.findIndex((s) => s.section === 'orientation');
  const firstDeep = S.scenes.findIndex((s) => s.level === 'L2' || s.level === 'L3');
  if (orientAt < 0) fail('AC-16', 'no orientation scene');
  else if (firstDeep >= 0 && orientAt > firstDeep) fail('AC-16', `the orientation scene comes after ${S.scenes[firstDeep].id}`);

  // AC-17 every element with what_it_does can be expanded (the browser part ran in Chromium above)
  crit('AC-17');
  const M = loadModel();
  const vspecs = loadViewSpecs();
  const viewOf = new Map(S.views.map((v) => [v.id, v]));
  for (const s of S.scenes) {
    const v = viewOf.get(s.view);
    if (!v || vspecs.get(v.id)?.mode === 'structure') continue;
    const svg = readText(path.join(P.site, 'assets', 'diagrams', `${v.id}.svg`));
    const shown = v.level === 'flow' ? [...svg.matchAll(/data-on="([^"]+)"/g)].map((m) => m[1]) : [...svg.matchAll(/<g class="node el [^"]*" data-el="([^"]+)"/g)].map((m) => m[1]);
    for (const id of new Set(shown)) if ((M.els.get(id)?.what_it_does || []).length && !svg.includes(`data-expand="${id}"`)) fail('AC-17', `${s.id}: "${id}" has what_it_does but no expand marker in ${v.id}.svg`);
  }
  note('AC-17', `${expandCount} popover(s) opened and closed in Chromium; the bullets' facts are checked by check-model (AC-8).`);

  // AC-18 structure before any flow
  crit('AC-18');
  const firstStruct = S.scenes.findIndex((s) => vspecs.get(s.view)?.mode === 'structure');
  const firstFlowScene = S.scenes.findIndex((s) => s.level === 'flow');
  if (firstStruct < 0) fail('AC-18', 'no scene shows a structure view');
  else if (firstFlowScene >= 0 && firstFlowScene < firstStruct) fail('AC-18', `${S.scenes[firstFlowScene].id} shows a flow before the first structure scene ${S.scenes[firstStruct].id}`);

  crit('AC-11');
  const domIds = [...html.matchAll(/<section class="scene" id="(S\d\d)"/g)].map((m) => m[1]);
  if (domIds.join() !== S.scenes.map((s) => s.id).join()) fail('AC-11', `page scenes ${domIds.join(',')} differ from scenes.json`);
  const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
  for (const s of S.scenes) for (const t of s.text) if (!decode(html).includes(t)) fail('AC-11', `${s.id}: text "${t}" is not on the page`);
  if (C['AC-11'].result === 'pass') { C['AC-11'].result = 'review'; note('AC-11', 'Scene IDs and text match; each claim against its facts needs review.'); }

  // AC-14 determinism: render and build again into this stage's output and compare byte for byte.
  crit('AC-14');
  const tmp = out('06', 'rebuild');
  fs.rmSync(tmp, { recursive: true, force: true });
  await renderAll(path.join(tmp, 'assets', 'diagrams'));
  buildSite(tmp);
  const hashes = (dir) => Object.fromEntries(walk(dir).map((f) => [path.relative(dir, f).split(path.sep).join('/'), sha256(fs.readFileSync(f))]));
  const a = hashes(P.site), b = hashes(tmp);
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) if (a[k] !== b[k]) fail('AC-14', `${k} differs on rebuild${!a[k] || !b[k] ? ' (missing on one side)' : ''}`);
  fs.rmSync(tmp, { recursive: true, force: true });

  crit('AC-12').result = 'review'; note('AC-12', 'Review the screenshots against _config/banned-patterns.md.');
  crit('AC-15').result = 'review'; note('AC-15', "Recorded once in the template's docs/design.md.");
  if (!browsersRun.length) for (const id of ['AC-2', 'AC-3', 'AC-4', 'AC-5', 'AC-6', 'AC-13', 'AC-16', 'AC-17']) fail(id, 'no browser ran');

  const order = Object.keys(C).sort((x, y) => parseInt(x.slice(3)) - parseInt(y.slice(3)));
  const result = { browsers: browsersRun, viewports: VIEWPORTS.map((v) => `${v.width}x${v.height}`), criteria: Object.fromEntries(order.map((k) => [k, C[k]])) };
  writeText(out('06', 'verify-results.json'), JSON.stringify(result, null, 1) + '\n');
  for (const k of order) {
    console.log(`${k.padEnd(6)} ${C[k].result.toUpperCase()}`);
    for (const d of C[k].details.slice(0, 8)) console.log(`         ${d}`);
    if (C[k].details.length > 8) console.log(`         … ${C[k].details.length - 8} more in verify-results.json`);
  }
  console.log(`Wrote ${rel(out('06', 'verify-results.json'))} and ${walk(shots).length} screenshot(s).`);
});
