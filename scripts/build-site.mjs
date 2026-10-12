// Build the explainer page set from the storyboard, design, model, and rendered diagrams.
//   (default)   -> stages/05_build/output/site/
//   --out <dir> -> <dir> (used by verify to prove determinism; reads diagrams from <dir>/assets/diagrams)
// Run scripts/render-diagrams.mjs first. Deterministic: the same inputs give byte-identical files.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, P, main, shownName, readJson, readYaml, readText, loadModel, loadFlows, runAnswers, viewElements,
  writeText, walk, UserError, rel } from './lib/common.mjs';
import { loadViewSpecs } from './check-design.mjs';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const TEXT_EXT = new Set(['.md', '.txt', '.yml', '.yaml', '.json', '.ps1', '.psm1', '.js', '.mjs', '.ts', '.py', '.sh', '.toml', '.ini', '.cfg', '.css', '.xml', '.csv', '']);
const FONTS = [
  ['@fontsource/ibm-plex-sans', 'ibm-plex-sans-latin-400-normal.woff2'],
  ['@fontsource/ibm-plex-sans', 'ibm-plex-sans-latin-600-normal.woff2'],
  ['@fontsource/ibm-plex-mono', 'ibm-plex-mono-latin-400-normal.woff2'],
];

// Inline copies of one SVG need unique ids.
function inlineSvg(svg, prefix, extraClass = '') {
  return svg.trim()
    .replace(/ id="se-/g, ` id="${prefix}-se-`)
    .replace(/url\(#se-/g, `url(#${prefix}-se-`)
    .replace(/aria-labelledby="se-/g, `aria-labelledby="${prefix}-se-`)
    .replace(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" class="diagram"/, `<svg xmlns="http://www.w3.org/2000/svg" class="diagram${extraClass ? ' ' + extraClass : ''}"`);
}

function treeOf(dir, maxLines = 80) {
  const out = [];
  const visit = (d, prefix, depth) => {
    const entries = fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => (a.isDirectory() === b.isDirectory() ? a.name.localeCompare(b.name) : a.isDirectory() ? -1 : 1));
    entries.forEach((e, i) => {
      if (out.length >= maxLines) return;
      const last = i === entries.length - 1;
      out.push(`${prefix}${last ? '└── ' : '├── '}${e.name}${e.isDirectory() ? '/' : ''}`);
      if (e.isDirectory() && depth < 3) visit(path.join(d, e.name), prefix + (last ? '    ' : '│   '), depth + 1);
    });
  };
  visit(dir, '', 1);
  if (out.length >= maxLines) out.push('…');
  return out.join('\n');
}
function detailBlock(p) {
  const abs = path.join(P.sources, p);
  if (!fs.existsSync(abs)) return `<p>Not in the snapshot: <code>${esc(p)}</code></p>`;
  const name = p.replace(/^\d\d-/, '');
  if (fs.statSync(abs).isDirectory()) return `<h4><code>${esc(name)}/</code></h4><pre>${esc(treeOf(abs))}</pre>`;
  const ext = path.extname(abs).toLowerCase();
  if (!TEXT_EXT.has(ext) || fs.statSync(abs).size > 200 * 1024) return `<h4><code>${esc(name)}</code></h4><p>(binary or large file, not shown)</p>`;
  const lines = fs.readFileSync(abs, 'utf8').replace(/\r\n/g, '\n').split('\n');
  return `<h4><code>${esc(name)}</code></h4><pre>${esc(lines.slice(0, 60).join('\n'))}${lines.length > 60 ? '\n…' : ''}</pre>`;
}

export function buildSite(siteDir) {
  const S = readJson(P.scenes);
  const SS = readYaml(P.sceneSpecs);
  const M = loadModel();
  const { flows } = loadFlows();
  const run = runAnswers();
  const specs = loadViewSpecs();
  const diagDir = path.join(siteDir, 'assets', 'diagrams');
  const svgOf = (id) => {
    const f = path.join(diagDir, `${id}.svg`);
    if (!fs.existsSync(f)) throw new UserError(`${rel(f)} is missing; run scripts/render-diagrams.mjs first.`);
    return fs.readFileSync(f, 'utf8');
  };
  const layouts = readJson(path.join(diagDir, 'layout.json'));
  const views = new Map(S.views.map((v) => [v.id, v]));

  // Which scenes show each element (for panel deep links).
  const appearsIn = new Map();
  for (const s of S.scenes) {
    const v = views.get(s.view);
    if (!v) continue; // the orientation scene has no view
    let ids = [];
    if (v.level === 'flow') ids = flows.get(v.scope).nodes.map((n) => n.on).filter(Boolean);
    else ids = [...viewElements(M, v, specs.get(v.id)), ...(v.level === 'L3' ? [v.scope] : [])];
    for (const id of new Set(ids)) { if (!appearsIn.has(id)) appearsIn.set(id, []); appearsIn.get(id).push(s); }
  }

  // The orientation scene is drawn from data: the four levels, what each shows, and the scenes that use it.
  const RUNGS = [
    ['L1', 'Context', 'The solution as one box, with the people and outside things it touches'],
    ['L2', 'Functions', 'The major parts and how they relate'],
    ['L3', 'Components', 'What is inside one part'],
    ['L4', 'Code', 'Folders, files, and config, in the map only'],
  ];
  const ladderHtml = () => `<ol class="ladder">${RUNGS.map(([lvl, name, line]) => {
    const used = S.scenes.filter((x) => x.level === lvl);
    return `<li data-level="${lvl}"><strong>${name}</strong> <span class="line">${esc(line)}</span> <span class="uses">${used.length ? used.map((x) => `<a href="#${x.id}">${x.id}</a>`).join(' ') : 'Map only'}</span></li>`;
  }).join('')}</ol>`;

  // Scenes
  const sceneHtml = S.scenes.map((s) => {
    const spec = SS.scenes[s.id];
    const text = s.text.map((t, i) => `<p data-text="${i + 1}">${esc(t)}</p>`).join('');
    return `<section class="scene" id="${s.id}" data-scene="${s.id}" data-view="${esc(s.view || '')}" data-layout="${spec.layout}" data-mode="${s.mode}" data-level="${s.level}" aria-label="${esc(s.id + ': ' + s.title)}">`
      + `<header><h2>${esc(s.title)}</h2><span class="sid">${s.id}</span></header>`
      + `<div class="text">${text}</div>`
      + (spec.layout === 'statement' ? '' : spec.layout === 'orientation' ? `<div class="figure orientation">${ladderHtml()}</div>` : `<div class="figure">${inlineSvg(svgOf(s.view), s.id.toLowerCase())}</div>`)
      + `</section>`;
  }).join('\n');

  // Map: overview views plus a panel per element
  const panelIds = new Set(S.map.panels.map((p) => p.element));
  const linkify = (svg) => svg.replace(' role="img" ', ' role="group" ').replace(/<g class="(node el [^"]*|boundary [^"]*)" data-el="([^"]+)"/g, (m, cls, id) => (panelIds.has(id)
    ? `<g class="${cls} has-link" data-el="${id}" tabindex="0" role="button" aria-label="${esc((shownName(M.els.get(id)) || id) + ': open details')}"` : m));
  const overview = S.map.overview.map((id) => linkify(inlineSvg(svgOf(id), `map-${id}`))).join('\n');
  const panels = S.map.panels.map((p) => {
    const e = M.els.get(p.element);
    const relsOut = M.rels.filter((r) => r.from === e.id).map((r) => `<li>${esc(r.verb)} <strong>${esc(shownName(M.els.get(r.to)) || r.to)}</strong> <span class="type">(${r.kind})</span></li>`);
    const relsIn = M.rels.filter((r) => r.to === e.id).map((r) => `<li><strong>${esc(shownName(M.els.get(r.from)) || r.from)}</strong> ${esc(r.verb)} it <span class="type">(${r.kind})</span></li>`);
    const kids = (M.children.get(e.id) || []).map((c) => `<li>${esc(shownName(M.els.get(c)))} <span class="type">[${M.els.get(c).type}]</span></li>`);
    const scenesList = (appearsIn.get(e.id) || []).map((s) => `<li><a href="#${s.id}">${s.id}: ${esc(s.title)}</a></li>`);
    return `<section data-panel="${esc(e.id)}" hidden>`
      + `<h3>${esc(shownName(e))}</h3><div class="type">[${e.type}]${e.tech ? ` · ${esc(e.tech)}` : ''}</div>`
      + `<h4>Responsibility</h4><p>${esc(e.responsibility)}</p>`
      + `<h4>Why it is separate</h4><p>${esc(e.why_separate)}</p>`
      + (kids.length ? `<h4>Contains</h4><ul>${kids.join('')}</ul>` : '')
      + (relsOut.length + relsIn.length ? `<h4>Relationships</h4><ul>${[...relsOut, ...relsIn].join('')}</ul>` : '')
      + (p.view ? `<h4>Inside</h4>${linkify(inlineSvg(svgOf(p.view), `panel-${p.element}`))}` : '')
      + (p.detail?.length ? `<h4>Detail</h4>${p.detail.map(detailBlock).join('')}` : '')
      + `<h4>Appears in</h4>${scenesList.length ? `<ul>${scenesList.join('')}</ul>` : '<p>Map only.</p>'}`
      + `</section>`;
  }).join('\n');

  const data = {
    scenes: S.scenes.map((s) => ({ id: s.id, title: s.title, view: s.view, highlight: s.highlight || {}, enter: SS.scenes[s.id].enter, steps: SS.scenes[s.id].steps })),
    states: Object.fromEntries(S.views.map((v) => [v.id, specs.get(v.id)?.states || {}])),
    layouts,
  };
  const hasTheme = fs.existsSync(path.join(P.theme, 'theme.css'));
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(run.solution || 'Solution')}: explainer</title>
<link rel="stylesheet" href="assets/css/tokens.css">
<link rel="stylesheet" href="assets/css/base.css">
${hasTheme ? '<link rel="stylesheet" href="assets/theme/theme.css">' : ''}
</head>
<body>
<div class="frame" aria-hidden="true"><div class="frame-top"></div><div class="frame-side"></div></div>
<main class="deck" aria-live="polite">
${sceneHtml}
</main>
<div class="map" id="map" role="dialog" aria-label="Map: reference layer" aria-hidden="true">
<div class="views"><h2>Map</h2><p class="label">Reference layer. Select any element for its details. M or Escape closes the map.</p>
${overview}
</div>
<aside class="panel" aria-label="Element details"><p class="empty">Select an element to see its responsibility, why it is separate, its relationships, and where it appears.</p>
${panels}
</aside>
</div>
<nav class="chrome" aria-label="Presentation controls">
<button class="prev" type="button" aria-label="Previous step">&#8592;</button>
<span class="where" aria-live="polite"></span>
<span class="title"></span>
<button class="maptoggle" type="button">Map (M)</button>
<button class="rm" type="button" aria-pressed="false">Reduced motion (R)</button>
<button class="next" type="button" aria-label="Next step">&#8594;</button>
</nav>
<script>window.EXPLAINER = ${JSON.stringify(data)};</script>
<script src="assets/js/runtime.js"></script>
</body>
</html>
`;

  // Assets
  writeText(path.join(siteDir, 'index.html'), html);
  const siteSrc = path.join(ROOT, 'scripts', 'site');
  writeText(path.join(siteDir, 'assets', 'css', 'base.css'), readText(path.join(siteSrc, 'base.css')));
  writeText(path.join(siteDir, 'assets', 'js', 'runtime.js'), readText(path.join(siteSrc, 'runtime.js')));
  writeText(path.join(siteDir, 'assets', 'css', 'tokens.css'), readText(P.tokens));
  if (hasTheme) for (const f of walk(P.theme)) {
    const dest = path.join(siteDir, 'assets', 'theme', path.relative(P.theme, f));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(f, dest);
  }
  const fontDir = path.join(siteDir, 'assets', 'fonts');
  fs.mkdirSync(fontDir, { recursive: true });
  for (const [pkg, file] of FONTS) {
    const src = path.join(ROOT, 'node_modules', pkg, 'files', file);
    if (!fs.existsSync(src)) throw new UserError(`Font ${file} is missing; run npm ci.`);
    fs.copyFileSync(src, path.join(fontDir, file));
  }
  fs.copyFileSync(path.join(ROOT, 'node_modules', '@fontsource/ibm-plex-sans', 'LICENSE'), path.join(fontDir, 'LICENSE-ibm-plex.txt'));
  return { scenes: S.scenes.length, panels: S.map.panels.length };
}

if (process.argv[1]?.endsWith('build-site.mjs')) {
  main(() => {
    const i = process.argv.indexOf('--out');
    const dir = i > 0 ? path.resolve(ROOT, process.argv[i + 1]) : P.site;
    for (const e of fs.existsSync(dir) ? fs.readdirSync(dir) : []) {
      if (e === 'assets') { for (const a of fs.readdirSync(path.join(dir, e))) if (a !== 'diagrams') fs.rmSync(path.join(dir, e, a), { recursive: true, force: true }); }
      else fs.rmSync(path.join(dir, e), { recursive: true, force: true });
    }
    const r = buildSite(dir);
    console.log(`Built ${rel(path.join(dir, 'index.html'))}: ${r.scenes} scenes, ${r.panels} map panels.`);
  });
}
