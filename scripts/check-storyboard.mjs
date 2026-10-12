// Validate stages/03_storyboard/output/scenes.json: schema, the (checked) rules in
// _config/information-architecture.md, talk time, views, and map coverage.
import fs from 'node:fs';
import path from 'node:path';
import { P, main, Report, validate, readJson, factIds, factPaths, loadModel, loadFlows, frontmatter, runAnswers,
  defaultViewElements, ancestors, words } from './lib/common.mjs';

export function checkStoryboard(report) {
  const S = readJson(P.scenes);
  if (!validate('scenes.schema.json', S, report, 'scenes.json')) return;
  const M = loadModel();
  const { flows } = loadFlows();
  const facts = factIds();
  const scope = frontmatter(P.scope).data;
  const run = runAnswers();
  const depth = scope.depth || 'conceptual';

  // Views
  const views = new Map();
  for (const v of S.views) {
    report.check(!views.has(v.id), `view "${v.id}" is declared twice`);
    views.set(v.id, v);
    if (v.level === 'L1' || v.level === 'L2') report.check(v.scope === M.system?.id, `view "${v.id}" (${v.level}) must be scoped to the system "${M.system?.id}"`);
    if (v.level === 'L3') report.check(M.els.get(v.scope)?.type === 'function', `view "${v.id}" (L3) must be scoped to a function`);
    if (v.level === 'flow') report.check(flows.has(v.scope), `view "${v.id}" (flow) scope "${v.scope}" is not a flow`);
    if (v.mode === 'structure') report.check(v.level === 'L2' || v.level === 'L3', `view "${v.id}": mode structure is for L2 and L3 views only`);
    if (v.level === 'L3') report.check(!M.mapOnly.has(v.scope), `L3 view "${v.id}" zooms into "${v.scope}", which scope.md lists as map_only`);
  }
  for (const lvl of ['L1', 'L2']) report.check(S.views.some((v) => v.level === lvl), `an ${lvl} view is mandatory`);
  for (const c of scope.in_scope || []) report.check(S.views.some((v) => v.level === 'L3' && v.scope === c), `in-scope function "${c}" has no L3 view`);
  for (const v of S.views) if (v.level === 'L3') report.check((scope.in_scope || []).includes(v.scope), `L3 view "${v.id}" is for "${v.scope}", which is not in scope`);

  // Scenes
  const sc = S.scenes;
  sc.forEach((s, i) => report.check(s.id === `S${String(i + 1).padStart(2, '0')}`, `scene ${i + 1} must have id S${String(i + 1).padStart(2, '0')} (got ${s.id})`));
  const allIds = new Set([...M.els.keys(), ...M.rels.map((r) => r.id)]);
  const shown = new Set();
  const twoIntents = (scope.intents || []).length === 2;
  let minutes = 0;
  for (const s of sc) {
    minutes += s.minutes;
    const v = views.get(s.view);
    if (s.section !== 'orientation' && report.check(!!v, `${s.id}: view "${s.view}" is not declared in views[]`)) {
      report.check(v.level === s.level, `${s.id}: scene level ${s.level} but view "${v.id}" is ${v.level} (one level per scene)`);
    }
    report.check(s.mode === (s.section === 'in-use' ? 'how-to' : 'explanation'), `${s.id}: section "${s.section}" scenes are ${s.section === 'in-use' ? 'how-to' : 'explanation'} mode`);
    for (const f of s.facts) report.check(facts.has(f), `${s.id}: cites ${f}, which is not in the fact sheet`);
    s.text.forEach((t, i) => report.check(words(t) <= 12, `${s.id}: text line ${i + 1} has ${words(t)} words (max 12)`));
    for (const id of [...(s.highlight?.elements || []), ...(s.highlight?.relationships || [])]) {
      report.check(allIds.has(id), `${s.id}: highlight "${id}" is not in the model`);
      report.check(!M.excluded.has(id), `${s.id}: highlight "${id}" is excluded in scope.md`);
      report.check(!M.mapOnly.has(id), `${s.id}: highlight "${id}" is map_only in scope.md, so the linear path does not dwell on it`);
    }
    const steps = s.reveals.map((r) => r.step);
    report.check(steps.every((x, i) => x === i + 1), `${s.id}: reveal steps must run 1..n (got ${steps.join(',')})`);
    if (s.animation) report.check(run.animation !== false, `${s.id}: proposes an animation, but run.md sets animation: false`);
    if (twoIntents && ['structure', 'segmentation', 'build', 'in-use'].includes(s.section)) report.check(!!s.intent, `${s.id}: with two intents, scenes in ${s.section} name their intent`);

    if (v && v.level === 'flow') {
      const flow = flows.get(v.scope);
      if (s.section === 'in-use' && flow) {
        for (const n of flow.nodes) {
          if (!n.on || shown.has(n.on)) continue;
          if (ancestors(M, n.on).some((a) => shown.has(a))) report.note(`${s.id}: "${n.on}" appears first in this example; only its parent was shown before`);
          else report.fail(`${s.id}: usage example uses "${n.on}", which no earlier scene showed (examples introduce nothing new)`);
        }
      }
      if (flow) for (const n of flow.nodes) if (n.on) shown.add(n.on);
    } else if (v) {
      for (const id of defaultViewElements(M, v.level, v.scope)) shown.add(id);
      if (v.level === 'L3') shown.add(v.scope);
    }
  }
  const first = sc[0], last = sc[sc.length - 1];
  report.check(first.section === 'answer' && first.level === 'L1', 'S01 must be the answer scene at L1 (answer first)');
  report.check(last.section === 'close' && last.returns_to === 'S01' && last.view === first.view, `the last scene must be section "close", returns_to S01, and show S01's view`);

  // Orientation: exactly one, after the answer and before the first L2 or L3 scene.
  const orient = sc.filter((s) => s.section === 'orientation');
  if (report.check(orient.length === 1, `exactly one orientation scene is required (found ${orient.length})`)) {
    const at = sc.indexOf(orient[0]);
    const firstDeep = sc.findIndex((s) => s.level === 'L2' || s.level === 'L3');
    report.check(at >= 1, 'the orientation scene must come after the answer scene');
    report.check(firstDeep < 0 || at < firstDeep, `the orientation scene (${orient[0].id}) must come before the first L2 or L3 scene (${sc[firstDeep]?.id})`);
  }

  // Structure before wiring: the first L2 scene shows structure, and no flow scene precedes a structure scene.
  const isStructure = (s) => views.get(s.view)?.mode === 'structure';
  const firstStructure = sc.findIndex(isStructure);
  const firstL2 = sc.find((s) => s.level === 'L2');
  report.check(firstStructure >= 0, 'at least one scene must show a structure view (what each function does) before the wiring');
  if (firstL2) report.check(isStructure(firstL2), `${firstL2.id}: the first L2 scene must be a structure view, with wiring after it`);
  const firstFlow = sc.findIndex((s) => s.level === 'flow');
  if (firstFlow >= 0 && firstStructure >= 0) report.check(firstStructure < firstFlow, `${sc[firstFlow].id}: a flow scene comes before the first structure scene (${sc[firstStructure].id})`);

  const target = Math.min(S.target_minutes, run.target_minutes || 15);
  report.check(minutes <= target + 1e-9, `talk time ${minutes} min exceeds the target ${target} min`);
  if (scope.target_scenes) report.check(Math.abs(sc.length - scope.target_scenes) <= 2, `${sc.length} scenes vs target_scenes ${scope.target_scenes} in scope.md`);

  // Map
  for (const id of S.map.overview) report.check(['L1', 'L2'].includes(views.get(id)?.level), `map overview "${id}" must be an L1 or L2 view`);
  const panels = new Map(S.map.panels.map((p) => [p.element, p]));
  const inViews = new Set();
  for (const v of S.views) if (v.level !== 'flow') { for (const id of defaultViewElements(M, v.level, v.scope)) inViews.add(id); if (v.level === 'L3') inViews.add(v.scope); }
  for (const id of inViews) report.check(panels.has(id), `map: element "${id}" appears in a view but has no panel`);

  // Detail paths cited only by excluded elements are refused.
  const paths = factPaths();
  const pathsOf = (e) => [...e.sources, ...(e.what_it_does || []).flatMap((w) => w.sources)].map((f) => paths.get(f)).filter(Boolean);
  const keep = new Set(), drop = new Set();
  for (const e of M.els.values()) for (const p of pathsOf(e)) (M.excluded.has(e.id) ? drop : keep).add(p);
  const refused = [...drop].filter((p) => !keep.has(p));

  for (const p of S.map.panels) {
    report.check(M.els.has(p.element), `map panel "${p.element}" is not a model element`);
    report.check(!M.excluded.has(p.element), `map panel "${p.element}" is for an excluded element`);
    if (p.view) report.check(views.get(p.view)?.level === 'L3' && views.get(p.view)?.scope === p.element, `map panel "${p.element}": view "${p.view}" must be its L3 view`);
    if ((p.detail || []).length) report.check(depth !== 'conceptual', `map panel "${p.element}": detail paths (L4) need depth logical or physical in scope.md; it is conceptual`);
    for (const d of p.detail || []) {
      report.check(fs.existsSync(path.join(P.sources, d)), `map panel "${p.element}": detail path "${d}" is not in the snapshot`);
      const norm = d.replace(/\/+$/, '');
      report.check(!refused.some((r) => norm === r || norm.startsWith(`${r}/`)), `map panel "${p.element}": detail path "${d}" belongs to an excluded element`);
    }
  }
  report.note(`${sc.length} scenes, ${minutes} of ${target} minutes`);
}

if (process.argv[1]?.endsWith('check-storyboard.mjs')) {
  main(() => { const r = new Report('check-storyboard'); checkStoryboard(r); r.exit(); });
}
