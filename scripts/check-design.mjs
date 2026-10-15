// Validate stage 04 output: view specs, scene specs, and tokens.css, against views.md,
// build-rules.md, notation.md, and the schemas.
import fs from 'node:fs';
import path from 'node:path';
import { P, main, Report, validate, readJson, readYaml, readText, loadModel, loadFlows, loadBefore, runAnswers,
  defaultViewElements, viewElements, viewRelationships, loadTokens, hexToRgb, contrast, oklch, hueGap, walk } from './lib/common.mjs';

const TITLE = { before: 'Before', L1: 'Context', L2: 'Functions', L3: 'Components', flow: 'Flow' };

// What a problem figure draws (iteration 003, D8; notation.md, Problem figures), and what it lacks. Every
// figure leads with the user, joined to its subject by the shortest chain of relationships (at most one element
// between), and shows the pains on what it draws.
export const FIGURES = ['map', 'repeat', 'drift', 'scatter', 'gap', 'wait', 'cost'];
const MAX_PAINS = 3, MAX_SATELLITES = 6;
function chainTo(B, target) {
  const user = B.data.user;
  if (target === user) return { els: [user], rels: [] };
  const next = (id) => B.rels.filter((r) => r.from === id || r.to === id).map((r) => ({ r, to: r.from === id ? r.to : r.from }))
    .filter((x) => B.els.get(x.to)?.type !== 'pain');
  for (const a of next(user)) if (a.to === target) return { els: [user, target], rels: [a.r.id] };
  for (const a of next(user)) for (const b of next(a.to)) if (b.to === target) return { els: [user, a.to, target], rels: [a.r.id, b.r.id] };
  return { els: [user, target], rels: [] };
}
export function figureContent(B, spec) {
  const figure = spec?.figure || 'map';
  const problems = [];
  const sub = spec?.subject;
  const S = B.els.get(sub), R = B.rels.find((r) => r.id === sub);
  let els = [], rels = [], measures = [], satellites = [];
  const need = (ok, msg) => { if (!ok) problems.push(msg); return ok; };
  if (figure === 'map') {
    els = spec?.elements?.length ? spec.elements.filter((id) => B.els.has(id)) : [...B.els.keys()];
    const has = new Set(els);
    rels = B.rels.filter((r) => has.has(r.from) && has.has(r.to)).map((r) => r.id);
    return { figure, els, rels, measures, satellites, pains: els.filter((id) => B.els.get(id).type === 'pain'), problems };
  }
  if (figure === 'cost') {
    measures = spec?.measures || [];
    const known = new Set((B.data.measures || []).map((m) => m.id));
    if (need(measures.length >= 1 && measures.length <= 3, 'the cost figure shows one to three measures (measures in the view spec)')) for (const m of measures) need(known.has(m), `measure "${m}" is not in the before model`);
    if (spec?.compare) for (const m of measures) need((B.data.measures || []).find((x) => x.id === m)?.after, `measure "${m}" has no after value to compare`);
    els = [B.data.user];
  } else if (figure === 'gap') {
    if (need(!!R, `the gap figure's subject must be a relationship (got "${sub}")`)) {
      const c = chainTo(B, R.from);
      els = [...c.els, R.to]; rels = [...c.rels, R.id];
      need([...B.els.values()].some((p) => p.type === 'pain' && p.hurts === R.id), `the gap figure needs a pain that hurts "${R.id}"`);
    }
  } else {
    const want = { repeat: ['task'], drift: ['means'], scatter: ['task', 'person'], wait: ['person', 'task'] }[figure];
    if (need(!!S && want.includes(S.type), `the ${figure} figure's subject must be a ${want.join(' or ')} (got "${sub}")`)) {
      const c = chainTo(B, sub);
      els = [...c.els]; rels = [...c.rels];
      if (figure === 'repeat') need(!!S.recurs, `"${sub}" has no recurs; the repeat figure draws its runs`);
      if (figure === 'drift') need(!!S.versions, `"${sub}" has no versions; the drift figure draws them`);
      if (figure === 'wait') need(!!S.queue, `"${sub}" has no queue; the wait figure draws it`);
      if (figure === 'scatter') {
        const links = B.rels.filter((r) => (r.from === sub || r.to === sub) && !rels.includes(r.id))
          .map((r) => ({ r, to: r.from === sub ? r.to : r.from })).filter((x) => !els.includes(x.to) && B.els.get(x.to)?.type !== 'pain');
        satellites = links.slice(0, MAX_SATELLITES).map((x) => x.to);
        need(satellites.length >= 3, `"${sub}" draws on ${satellites.length} place(s); the scatter figure needs at least 3`);
        els.push(...satellites); rels.push(...links.slice(0, MAX_SATELLITES).map((x) => x.r.id));
      }
    }
  }
  // The pains on what the figure draws, in model order, at most three.
  const drawn = new Set([...els, ...rels]);
  const pains = [...B.els.values()].filter((p) => p.type === 'pain' && drawn.has(p.hurts)).map((p) => p.id);
  if (pains.length > MAX_PAINS) problems.push(`${pains.length} pains fall on this figure; it shows the first ${MAX_PAINS} (${pains.slice(MAX_PAINS).join(', ')} left out)`);
  const shown = pains.slice(0, MAX_PAINS);
  need(shown.length > 0 || measures.length > 0, `the ${figure} figure shows no pain or measure, so it does not show the problem`);
  need(els.length + shown.length <= 9, `the ${figure} figure draws ${els.length + shown.length} elements (max 9)`);
  return { figure, els: [...els, ...shown], rels, measures, satellites, pains: shown, problems };
}
// The elements a before view draws, and its relationships (highlight targets).
export function beforeViewElements(B, spec) { return figureContent(B, spec).els; }
export function beforeViewRelationships(B, els, spec) {
  if (spec?.figure && spec.figure !== 'map') return figureContent(B, spec).rels;
  const has = new Set(els);
  return B.rels.filter((r) => has.has(r.from) && has.has(r.to)).map((r) => r.id);
}
// What a scene does to its picture, for the repeat rule (R4): its highlight and its reveal actions.
function pictureActions(s, spec) {
  const h = s.highlight || {};
  const acts = (spec?.steps || []).flatMap((st) => st.actions.map((a) => `${a.do}:${[...(a.targets || [])].sort()}:${a.state || ''}`)).sort();
  return JSON.stringify([s.view, [...(h.elements || [])].sort(), [...(h.relationships || [])].sort(), [...(h.steps || [])].sort(), acts]);
}
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

// A title image (iteration 003, D4): a picture file with its licence in title/, safe to inline, and approved in
// design-spec.md. Stage 04 copies it from 01_discover/output/visual-refs/.
const TITLE_IMAGE = /\.(png|jpe?g|webp|svg)$/i;
export const TITLE_IMAGE_MAX = 2 * 1024 * 1024;
function checkTitleImage(report, sid, tv) {
  if (!report.check(!!tv.image && !!tv.alt, `${sid}: a title image needs title_visual.image (a file in title/) and alt text`)) return;
  const f = path.join(P.title, tv.image);
  if (!report.check(fs.existsSync(f), `${sid}: title image title/${tv.image} is missing; copy it from 01_discover/output/visual-refs/`)) return;
  report.check(TITLE_IMAGE.test(tv.image), `${sid}: the title image must be PNG, JPEG, WebP, or SVG (got ${tv.image})`);
  report.check(fs.statSync(f).size <= TITLE_IMAGE_MAX, `${sid}: the title image is ${fs.statSync(f).size} bytes (max ${TITLE_IMAGE_MAX})`);
  if (/\.svg$/i.test(tv.image)) {
    const svg = readText(f);
    report.check(!/<script\b/i.test(svg), `${sid}: the title SVG has a script`);
    report.check(!/\son[a-z]+\s*=/i.test(svg), `${sid}: the title SVG has an event attribute (on...=)`);
    report.check(!/(href|src)\s*=\s*["']\s*(https?:|\/\/|file:)/i.test(svg) && !/url\(\s*["']?\s*(https?:|\/\/)/i.test(svg), `${sid}: the title SVG references a remote file`);
    report.check(!/<foreignObject\b/i.test(svg), `${sid}: the title SVG embeds foreign content`);
  }
  report.check(fs.readdirSync(P.title).some((x) => /(licen[cs]e|copying)/i.test(x)), `${sid}: title/ has no licence file for the image`);
  const ds = path.join(P.title, '..', 'design-spec.md');
  report.check(fs.existsSync(ds) && /^#+\s*Title image\b/im.test(readText(ds)), `${sid}: design-spec.md needs a "Title image" section recording the image, its licence, and the operator's approval`);
}

export function checkDesign(report) {
  const S = readJson(P.scenes);
  const M = loadModel();
  const { flows } = loadFlows();
  const run = runAnswers();
  const specs = loadViewSpecs();
  const views = new Map(S.views.map((v) => [v.id, v]));
  const B = fs.existsSync(P.before) ? loadBefore() : null;

  for (const v of S.views) {
    const spec = specs.get(v.id);
    if (!report.check(!!spec, `views/${v.id}.yaml is missing`)) continue;
    if (!validate('view.schema.json', spec, report, `views/${v.id}.yaml`)) continue;
    report.check(spec.id === v.id && spec.level === v.level && spec.scope === v.scope, `views/${v.id}.yaml: id, level, and scope must match scenes.json`);
    report.check(spec.title.startsWith(`${TITLE[v.level]}: `), `views/${v.id}.yaml: title must start "${TITLE[v.level]}: "`);
    let ids;
    if (v.level === 'before') {
      if (!report.check(!!B, `view "${v.id}": before-model.yaml is missing (stage 01)`)) continue;
      for (const id of spec.elements || []) report.check(B.els.has(id), `view "${v.id}": "${id}" is not in the before model`);
      // Problem figures (D8): the figure named in scenes.json, with the data it needs.
      const fig = figureContent(B, spec);
      report.check((v.figure || 'map') === fig.figure, `views/${v.id}.yaml: figure "${fig.figure}" must match scenes.json ("${v.figure || 'map'}")`);
      for (const p of fig.problems) (/ left out\)$/.test(p) ? report.note : report.fail).call(report, `view "${v.id}": ${p}`);
      report.check(fig.figure === 'map' || !(spec.elements || []).length, `view "${v.id}": "elements" narrows a map only; a figure draws what its subject needs`);
      report.check(fig.figure === 'cost' ? !spec.subject : !!spec.subject || fig.figure === 'map', `view "${v.id}": the ${fig.figure} figure ${fig.figure === 'cost' ? 'takes measures, not a subject' : 'needs a subject'}`);
      report.check(!spec.compare || fig.figure === 'cost', `view "${v.id}": compare is for the cost figure`);
      if (spec.compare) for (const s of S.scenes.filter((x) => x.view === v.id)) report.check(s.section === 'why', `${s.id}: view "${v.id}" compares before with after, so it belongs in a why scene; a problem scene shows no solution`);
      const els = fig.els;
      report.check(els.length <= 9, `view "${v.id}": ${els.length} elements (max 9)`);
      report.check(els.includes(B.data.user), `view "${v.id}": the before picture leads with the user ("${B.data.user}"); keep it in the view`);
      ids = new Set([...els, ...fig.measures.map((m) => `measure:${m}`)]);
      const relIds = new Set(fig.rels);
      for (const [name, st] of Object.entries(spec.states || {})) {
        for (const id of st.elements || []) report.check(ids.has(id), `view "${v.id}" state "${name}": "${id}" is not in the view`);
        for (const id of st.relationships || []) report.check(relIds.has(id), `view "${v.id}" state "${name}": relationship "${id}" is not in the view`);
        report.check(!(st.steps || []).length, `view "${v.id}" state "${name}": a before view has no steps`);
      }
      report.check(!spec.mode || spec.mode === 'wired', `view "${v.id}": a before view is wired`);
      report.check(!spec.lanes && !spec.inherit_from, `view "${v.id}": lanes and inherit_from are not for before views`);
    } else if (v.level === 'flow') {
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
      report.check((spec.layout === 'title') === (s.section === 'title'), `${s.id}: layout "title" is for the title scene, and only for it`);
      // The first frame has content (R9): step 0 must not hide every element of the scene's view.
      const v0 = views.get(s.view);
      if (v0) {
        const shown = new Set(spec.steps.flatMap((x) => x.actions.filter((a) => a.do === 'show').flatMap((a) => a.targets || [])));
        let all;
        if (v0.level === 'flow') { const f = flows.get(v0.scope); all = (f?.nodes || []).map((n) => [n.id, `step-${n.step}`]); }
        else if (v0.level === 'before') all = B ? beforeViewElements(B, specs.get(v0.id)).map((id) => [id]) : [];
        else all = viewElements(M, v0, specs.get(v0.id)).map((id) => [id]);
        if (all.length && all.every((alts) => alts.some((t) => shown.has(t)))) report.fail(`${s.id}: step 0 shows an empty diagram (every element appears later); show at least one element from the start`);
      }
      const want = s.reveals.map((r) => r.step).join(',');
      const got = spec.steps.map((x) => x.step).join(',');
      report.check(want === got, `${s.id}: scene-spec steps (${got}) must match the storyboard's reveal steps (${want})`);
      const v = views.get(s.view);
      const vs = specs.get(s.view);
      const targets = new Set();
      if (v?.level === 'flow') { const f = flows.get(v.scope); f?.nodes.forEach((n) => { targets.add(n.id); targets.add(`step-${n.step}`); }); f?.edges.forEach((e) => targets.add(`${e.from}--${e.to}`)); }
      else if (v?.level === 'before') {
        if (B) { const fig = figureContent(B, vs); fig.els.forEach((e) => targets.add(e)); fig.rels.forEach((r) => targets.add(r)); fig.measures.forEach((m) => targets.add(`measure:${m}`)); }
      } else if (v) {
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
      // The title visual (iteration 003, D4): art drawn from a wired L1 or L2 view, or an approved image.
      if (s.section === 'title') {
        const tv = spec.title_visual || { kind: 'art' };
        const runFrom = run.title_visual?.from || 'model';
        report.check((tv.kind === 'image') === (runFrom === 'image'), `${s.id}: title_visual is ${tv.kind}, but run.md title_visual.from is ${runFrom}`);
        if (tv.kind === 'art' && tv.from_view) {
          const fv = views.get(tv.from_view);
          report.check(['L1', 'L2'].includes(fv?.level) && specs.get(tv.from_view)?.mode !== 'structure', `${s.id}: title_visual.from_view "${tv.from_view}" must be a wired L1 or L2 view`);
        }
        if (tv.kind === 'image') checkTitleImage(report, s.id, tv);
      } else report.check(!spec.title_visual, `${s.id}: title_visual is for the title scene only`);
      if (spec.enter.kind === 'assemble') report.check(s.section === 'title' && (spec.title_visual?.kind || 'art') === 'art', `${s.id}: the assemble entry is for the title scene with title art`);
      if (['zoom-in', 'zoom-out'].includes(spec.enter.kind)) {
        report.check(!!spec.enter.from_view && views.has(spec.enter.from_view), `${s.id}: ${spec.enter.kind} needs from_view naming a declared view`);
        report.check(!!spec.enter.target, `${s.id}: ${spec.enter.kind} needs a target function`);
      }
      // One reveal behaviour for on-screen lines (R8): per-step shows line n in its own step, in order;
      // with-scene shows every line from step 0.
      const textSteps = spec.steps.map((st) => ({ step: st.step, lines: st.actions.filter((a) => a.do === 'show-text').flatMap((a) => a.targets || []) }))
        .filter((x) => x.lines.length);
      if (SS.text_reveal === 'with-scene') report.check(!textSteps.length, `${s.id}: text_reveal is with-scene, so on-screen lines show from step 0 (no show-text)`);
      else if (s.text.length) {
        const order = textSteps.map((x) => x.lines.join('+')).join(',');
        const want = s.text.map((_, i) => `text-${i + 1}`).join(',');
        report.check(order === want, `${s.id}: text_reveal is per-step, so each line shows in its own step, in order (want ${want}, got ${order || 'none'})`);
      }
      if (spec.enter.kind !== 'cut') moving = true;
      if (moving) report.check(!!spec.end_state, `${s.id}: has motion, so it needs end_state`);
      if (run.animation === false) report.check(!moving, `${s.id}: run.md sets animation: false, so use cut entries and duration_ms: 0`);
    }
    // A repeated picture must add something (R4): the same view, highlight, and reveal actions as an earlier
    // scene is the same picture twice, whatever "adds" says.
    const seen = new Map();
    for (const s of S.scenes) {
      if (!s.view || !SS.scenes[s.id]) continue;
      const key = pictureActions(s, SS.scenes[s.id]);
      if (seen.has(key)) report.fail(`${s.id}: shows the same picture as ${seen.get(key)} (same view, highlight, and reveals); make it add what "adds" says`);
      else seen.set(key, s.id);
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
