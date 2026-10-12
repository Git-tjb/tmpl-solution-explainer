// Validate stage 04 output: view specs, scene specs, and tokens.css, against views.md,
// build-rules.md, notation.md, and the schemas.
import fs from 'node:fs';
import path from 'node:path';
import { P, main, Report, validate, readJson, readYaml, readText, loadModel, loadFlows, runAnswers,
  defaultViewElements, viewElements, viewRelationships, readTokens, hexToRgb, contrast } from './lib/common.mjs';

const TITLE = { L1: 'Context', L2: 'Functions', L3: 'Components', flow: 'Flow' };
export const REQUIRED_TOKENS = ['--bg', '--surface', '--text', '--text-muted', '--c-system', '--c-internal', '--c-actor',
  '--c-external', '--c-human', '--c-highlight', '--c-dim', '--c-edge'];

export function loadViewSpecs() {
  const specs = new Map();
  if (!fs.existsSync(P.views)) return specs;
  for (const f of fs.readdirSync(P.views).filter((f) => /\.ya?ml$/.test(f)).sort()) specs.set(f.replace(/\.ya?ml$/, ''), readYaml(path.join(P.views, f)));
  return specs;
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
    for (const p of spec.pins || []) report.check(ids.has(p.target), `view "${v.id}": pin target "${p.target}" is not in the view`);
  }

  // Scene specs
  const SS = readYaml(P.sceneSpecs);
  if (validate('scene-spec.schema.json', SS, report, 'scene-specs.yaml')) {
    for (const s of S.scenes) {
      const spec = SS.scenes[s.id];
      if (!report.check(!!spec, `scene-specs.yaml: no spec for ${s.id}`)) continue;
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
      for (const st of spec.steps) for (const a of st.actions) {
        if (a.duration_ms) moving = true;
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

  // Tokens and contrast (build-rules.md)
  const tokens = readTokens(readText(P.tokens));
  for (const t of REQUIRED_TOKENS) report.check(!!tokens[t], `tokens.css is missing ${t}`);
  const rgb = (t) => (tokens[t] ? hexToRgb(tokens[t]) : null);
  const pairs = [['--text', '--bg', 7], ['--text-muted', '--bg', 7], ['--text', '--surface', 7], ['--text-muted', '--surface', 7]];
  for (const t of REQUIRED_TOKENS.filter((t) => t.startsWith('--c-') && t !== '--c-dim')) pairs.push([t, '--bg', 3]);
  for (const [a, b, min] of pairs) {
    const ca = rgb(a), cb = rgb(b);
    if (!report.check(!!ca && !!cb, `tokens ${a} and ${b} must be 3- or 6-digit hex colors`)) continue;
    const c = contrast(ca, cb);
    report.check(c >= min, `contrast ${a} on ${b} is ${c.toFixed(2)}:1 (min ${min}:1)`);
  }
}

if (process.argv[1]?.endsWith('check-design.mjs')) {
  main(() => { const r = new Report('check-design'); checkDesign(r); r.exit(); });
}
