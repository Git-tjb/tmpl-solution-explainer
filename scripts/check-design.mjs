// Validate stage 04 output: view specs, scene specs, and tokens.css, against views.md,
// build-rules.md, notation.md, and the schemas.
import fs from 'node:fs';
import path from 'node:path';
import { P, main, Report, validate, readJson, readYaml, readText, loadModel, loadFlows, runAnswers,
  defaultViewElements, viewElements, viewRelationships, loadTokens, hexToRgb, contrast, oklch, hueGap, walk } from './lib/common.mjs';

const TITLE = { L1: 'Context', L2: 'Functions', L3: 'Components', flow: 'Flow' };
export const REQUIRED_TOKENS = ['--bg', '--surface', '--text', '--text-muted', '--c-system', '--c-internal', '--c-actor',
  '--c-external', '--c-human', '--c-highlight', '--c-dim', '--c-edge', '--lv-1', '--lv-2', '--lv-3', '--lv-flow', '--text-dim'];
// Colour roles (notation.md, Colour): structure tokens are neutral; each role colour reads as its own hue.
export const STRUCTURE_TOKENS = ['--c-system', '--c-internal', '--c-actor', '--c-external', '--c-human', '--c-edge'];
export const ROLE_TOKENS = ['--c-highlight', '--lv-1', '--lv-2', '--lv-3', '--lv-flow'];
export const ROLE_LIMITS = { neutral_max_chroma: 0.04, role_min_chroma: 0.06, role_min_hue_gap: 30 };

export function loadViewSpecs() {
  const specs = new Map();
  if (!fs.existsSync(P.views)) return specs;
  for (const f of fs.readdirSync(P.views).filter((f) => /\.ya?ml$/.test(f)).sort()) specs.set(f.replace(/\.ya?ml$/, ''), readYaml(path.join(P.views, f)));
  return specs;
}

// A run theme (build-rules.md, Run theme): theme/theme.css plus fonts and their licences, nothing else.
const THEME_FILES = /\.(css|woff2?|ttf|otf)$|(^|\/)(licen[cs]e|ofl|copying)[^/]*$/i;
const FONT_FILE = /\.(woff2?|ttf|otf)$/i;
export function checkTheme(report, run) {
  if (!fs.existsSync(P.theme)) return;
  const files = walk(P.theme).map((f) => path.relative(P.theme, f).split(path.sep).join('/'));
  const css = files.includes('theme.css') ? readText(path.join(P.theme, 'theme.css')) : null;
  report.check(css !== null, 'theme/ exists but has no theme.css');
  report.check(!!run.visual && run.visual !== 'default', 'theme/ exists but run.md sets visual: default; describe the run\'s look in run.md');
  for (const f of files) report.check(THEME_FILES.test(f), `theme/${f}: a theme holds theme.css, fonts, and their licences only (no scripts, markup, or images)`);
  if (files.some((f) => FONT_FILE.test(f))) report.check(files.some((f) => /(^|\/)(licen[cs]e|ofl|copying)/i.test(f)), 'theme/ has font files but no licence file');
  if (css === null) return;
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, '');
  report.check(!/@import/i.test(bare), 'theme.css: @import is not allowed (zero network requests; bundle everything)');
  report.check(!/https?:\/\/|(^|[\s(:"'])\/\/[a-z]/i.test(bare), 'theme.css: no remote or protocol-relative URLs');
  for (const m of bare.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi)) {
    const u = m[2].trim();
    if (u.startsWith('data:')) continue;
    if (!report.check(!/^([a-z]+:|\/)/i.test(u), `theme.css: url(${u}) must be a relative path inside theme/`)) continue;
    report.check(fs.existsSync(path.join(P.theme, u.split(/[?#]/)[0])), `theme.css: url(${u}) points to a file that is not in theme/`);
  }
}

export function checkDesign(report) {
  const S = readJson(P.scenes);
  const M = loadModel();
  const { flows } = loadFlows();
  const run = runAnswers();
  const specs = loadViewSpecs();
  const views = new Map(S.views.map((v) => [v.id, v]));

  for (const v of S.views) {
    const spec = specs.get(v.id);
    if (!report.check(!!spec, `views/${v.id}.yaml is missing`)) continue;
    if (!validate('view.schema.json', spec, report, `views/${v.id}.yaml`)) continue;
    report.check(spec.id === v.id && spec.level === v.level && spec.scope === v.scope, `views/${v.id}.yaml: id, level, and scope must match scenes.json`);
    report.check(spec.title.startsWith(`${TITLE[v.level]}: `), `views/${v.id}.yaml: title must start "${TITLE[v.level]}: "`);
    let ids;
    if (v.level === 'flow') {
      const f = flows.get(v.scope);
      ids = new Set(f ? f.nodes.map((n) => n.id) : []);
      report.check((f?.nodes.length || 0) <= 12, `view "${v.id}": flow has more than 12 nodes`);
      for (const st of Object.values(spec.states || {})) for (const n of st.steps || []) report.check(n >= 1 && n <= (f?.nodes.length || 0), `view "${v.id}": state step ${n} is out of range`);
    } else {
      const def = defaultViewElements(M, v.level, v.scope);
      for (const id of spec.elements || []) report.check(def.includes(id), `view "${v.id}": "${id}" is not at level ${v.level} for this scope`);
      const els = viewElements(M, v, spec);
      report.check(els.length <= 9, `view "${v.id}": ${els.length} elements (max 9); narrow it with "elements" or split it`);
      ids = new Set([...els, ...(v.level === 'L3' ? [v.scope] : [])]);
      const rels = viewRelationships(M, els, v.level, v.scope);
      const relIds = new Set(rels.flatMap((r) => r.ids));
      // Plain line labels (views.md, Relationships): a merged line shows one verb unless the spec gives it a label.
      const lines = new Set(rels.map((r) => `${r.from}--${r.to}`));
      for (const k of Object.keys(spec.labels || {})) report.check(lines.has(k), `view "${v.id}": labels."${k}" is not a line in the view`);
      if (v.level !== 'L1' && spec.mode !== 'structure') for (const r of rels) if (r.verbs.length > 1 && !spec.labels?.[`${r.from}--${r.to}`]) report.note(`view "${v.id}": the line ${r.from}--${r.to} stands for ${r.verbs.length} relationships and shows only "${r.verbs[0]}"; give it a plain label in labels`);
      for (const [name, st] of Object.entries(spec.states || {})) {
        for (const id of st.elements || []) report.check(ids.has(id), `view "${v.id}" state "${name}": "${id}" is not in the view`);
        for (const id of st.relationships || []) report.check(relIds.has(id), `view "${v.id}" state "${name}": relationship "${id}" is not in the view`);
      }
      if (v.level === 'L3') report.check(!spec.inherit_from || views.get(spec.inherit_from)?.level === 'L2', `view "${v.id}": inherit_from must name an L2 view`);
    }
    if (spec.mode === 'structure') {
      report.check(v.level === 'L2' || v.level === 'L3', `view "${v.id}": mode structure is for L2 and L3 views only`);
      report.check(!(spec.pins || []).length, `view "${v.id}": a structure view has no pins`);
      for (const [name, st] of Object.entries(spec.states || {})) report.check(!(st.relationships || []).length, `view "${v.id}" state "${name}": a structure view has no relationship highlights`);
    }
    for (const p of spec.pins || []) {
      const isScope = (v.level === 'L2' || v.level === 'L3') && p.target === v.scope; // the boundary itself can be pinned
      report.check(ids.has(p.target) || isScope, `view "${v.id}": pin target "${p.target}" is not in the view`);
      // Pins work on top-level nodes only (the layout engine ignores them on parts inside a boundary or lane).
      const inBoundary = (v.level === 'L2' || v.level === 'L3') && M.els.get(p.target)?.parent === v.scope;
      if (inBoundary || (v.level === 'flow' && spec.lanes)) report.note(`view "${v.id}": pin on "${p.target}" has no effect (pins inside a boundary or lane are not supported)`);
    }
  }

  // Scene specs
  const SS = readYaml(P.sceneSpecs);
  if (validate('scene-spec.schema.json', SS, report, 'scene-specs.yaml')) {
    for (const s of S.scenes) {
      const spec = SS.scenes[s.id];
      if (!report.check(!!spec, `scene-specs.yaml: no spec for ${s.id}`)) continue;
      report.check((spec.layout === 'orientation') === (s.section === 'orientation'), `${s.id}: layout "orientation" is for the orientation scene, and only for it`);
      const want = s.reveals.map((r) => r.step).join(',');
      const got = spec.steps.map((x) => x.step).join(',');
      report.check(want === got, `${s.id}: scene-spec steps (${got}) must match the storyboard's reveal steps (${want})`);
      const v = views.get(s.view);
      const vs = specs.get(s.view);
      const targets = new Set();
      if (v?.level === 'flow') { const f = flows.get(v.scope); f?.nodes.forEach((n) => { targets.add(n.id); targets.add(`step-${n.step}`); }); f?.edges.forEach((e) => targets.add(`${e.from}--${e.to}`)); }
      else if (v) {
        const els = viewElements(M, v, vs);
        els.forEach((e) => targets.add(e));
        if (v.level === 'L3') targets.add(v.scope);
        viewRelationships(M, els, v.level, v.scope).forEach((r) => r.ids.forEach((id) => targets.add(id)));
      }
      s.text.forEach((_, i) => targets.add(`text-${i + 1}`));
      let moving = false;
      // expand / collapse targets: elements in this view with what_it_does (a flow's bound elements).
      const canExpand = (id) => (M.els.get(id)?.what_it_does || []).length > 0;
      const expandable = new Set(v?.level === 'flow' ? (flows.get(v.scope)?.nodes || []).map((n) => n.on).filter(canExpand)
        : vs?.mode === 'structure' ? [] : [...targets].filter(canExpand));
      for (const st of spec.steps) for (const a of st.actions) {
        if (a.duration_ms) moving = true;
        if (a.do === 'expand' || a.do === 'collapse') {
          moving = true; // an open popover is part of the end state
          report.check((a.targets || []).length > 0, `${s.id} step ${st.step}: "${a.do}" needs targets`);
          for (const t of a.targets || []) report.check(expandable.has(t), `${s.id} step ${st.step}: "${a.do}" target "${t}" is not an element with what_it_does in view "${s.view}"${vs?.mode === 'structure' ? ' (a structure view shows it already)' : ''}`);
          continue;
        }
        if (a.do === 'state') report.check(!!vs?.states?.[a.state], `${s.id} step ${st.step}: state "${a.state}" is not defined in views/${s.view}.yaml`);
        else report.check((a.targets || []).length > 0 || a.do === 'clear-highlight', `${s.id} step ${st.step}: "${a.do}" needs targets`);
        for (const t of a.targets || []) report.check(targets.has(t), `${s.id} step ${st.step}: target "${t}" is not in view "${s.view}" or the scene's text`);
      }
      if (['zoom-in', 'zoom-out'].includes(spec.enter.kind)) {
        report.check(!!spec.enter.from_view && views.has(spec.enter.from_view), `${s.id}: ${spec.enter.kind} needs from_view naming a declared view`);
        report.check(!!spec.enter.target, `${s.id}: ${spec.enter.kind} needs a target function`);
      }
      if (spec.enter.kind !== 'cut') moving = true;
      if (moving) report.check(!!spec.end_state, `${s.id}: has motion, so it needs end_state`);
      if (run.animation === false) report.check(!moving, `${s.id}: run.md sets animation: false, so use cut entries and duration_ms: 0`);
    }
  }

  checkTheme(report, run);

  // Tokens and contrast (build-rules.md); a run theme's :root values win over tokens.css
  const tokens = loadTokens();
  for (const t of REQUIRED_TOKENS) report.check(!!tokens[t], `tokens.css is missing ${t}`);
  const rgb = (t) => (tokens[t] ? hexToRgb(tokens[t]) : null);
  const pairs = [['--text', '--bg', 7], ['--text-muted', '--bg', 7], ['--text', '--surface', 7], ['--text-muted', '--surface', 7],
    // Dimmed text is quiet but readable (build-rules.md); highlighted labels are text in the focus colour.
    ['--text-dim', '--bg', 4.5], ['--text-dim', '--surface', 4.5], ['--c-highlight', '--bg', 7]];
  for (const t of REQUIRED_TOKENS.filter((t) => (t.startsWith('--c-') && t !== '--c-dim') || t.startsWith('--lv-'))) pairs.push([t, '--bg', 3]);
  for (const [a, b, min] of pairs) {
    const ca = rgb(a), cb = rgb(b);
    if (!report.check(!!ca && !!cb, `tokens ${a} and ${b} must be 3- or 6-digit hex colors`)) continue;
    const c = contrast(ca, cb);
    report.check(c >= min, `contrast ${a} on ${b} is ${c.toFixed(2)}:1 (min ${min}:1)`);
  }
  const lch = (t) => (rgb(t) ? oklch(rgb(t)) : null);
  for (const t of STRUCTURE_TOKENS) {
    const c = lch(t);
    if (c) report.check(c.C <= ROLE_LIMITS.neutral_max_chroma, `${t} is a structure colour and must be neutral (OKLCH chroma ${c.C.toFixed(3)}, max ${ROLE_LIMITS.neutral_max_chroma}); types differ by shape and line, not colour`);
  }
  for (const t of ROLE_TOKENS) {
    const c = lch(t);
    if (c) report.check(c.C >= ROLE_LIMITS.role_min_chroma, `${t} must read as a colour (OKLCH chroma ${c.C.toFixed(3)}, min ${ROLE_LIMITS.role_min_chroma})`);
  }
  for (let i = 0; i < ROLE_TOKENS.length; i++) for (let j = i + 1; j < ROLE_TOKENS.length; j++) {
    const a = lch(ROLE_TOKENS[i]), b = lch(ROLE_TOKENS[j]);
    if (a && b) report.check(hueGap(a.h, b.h) >= ROLE_LIMITS.role_min_hue_gap, `${ROLE_TOKENS[i]} and ${ROLE_TOKENS[j]} are ${hueGap(a.h, b.h).toFixed(0)} degrees apart in hue (min ${ROLE_LIMITS.role_min_hue_gap}): one colour would mean two things`);
  }
}

if (process.argv[1]?.endsWith('check-design.mjs')) {
  main(() => { const r = new Report('check-design'); checkDesign(r); r.exit(); });
}
