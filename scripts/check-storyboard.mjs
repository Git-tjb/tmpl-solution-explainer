// Validate stages/03_storyboard/output/scenes.json: schema, the (checked) rules in
// _config/information-architecture.md, talk time, views, and map coverage.
import fs from 'node:fs';
import path from 'node:path';
import { P, main, Report, validate, readJson, factIds, loadModel, loadFlows, frontmatter, runAnswers,
  defaultViewElements, ancestors, words } from './lib/common.mjs';

export function checkStoryboard(report) {
  const S = readJson(P.scenes);
  if (!validate('scenes.schema.json', S, report, 'scenes.json')) return;
  const M = loadModel();
  const { flows } = loadFlows();
  const facts = factIds();
  const scope = frontmatter(P.scope).data;
  const run = runAnswers();

  // Views
  const views = new Map();
  for (const v of S.views) {
    report.check(!views.has(v.id), `view "${v.id}" is declared twice`);
    views.set(v.id, v);
    if (v.level === 'L1' || v.level === 'L2') report.check(v.scope === M.system?.id, `view "${v.id}" (${v.level}) must be scoped to the system "${M.system?.id}"`);
    if (v.level === 'L3') report.check(M.els.get(v.scope)?.type === 'function', `view "${v.id}" (L3) must be scoped to a function`);
    if (v.level === 'flow') report.check(flows.has(v.scope), `view "${v.id}" (flow) scope "${v.scope}" is not a flow`);
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
    if (report.check(!!v, `${s.id}: view "${s.view}" is not declared in views[]`)) {
      report.check(v.level === s.level, `${s.id}: scene level ${s.level} but view "${v.id}" is ${v.level} (one level per scene)`);
    }
    report.check(s.mode === (s.section === 'in-use' ? 'how-to' : 'explanation'), `${s.id}: section "${s.section}" scenes are ${s.section === 'in-use' ? 'how-to' : 'explanation'} mode`);
    for (const f of s.facts) report.check(facts.has(f), `${s.id}: cites ${f}, which is not in the fact sheet`);
    s.text.forEach((t, i) => report.check(words(t) <= 12, `${s.id}: text line ${i + 1} has ${words(t)} words (max 12)`));
    for (const id of [...(s.highlight?.elements || []), ...(s.highlight?.relationships || [])]) report.check(allIds.has(id), `${s.id}: highlight "${id}" is not in the model`);
    const steps = s.reveals.map((r) => r.step);
    report.check(steps.every((x, i) => x === i + 1), `${s.id}: reveal steps must run 1..n (got ${steps.join(',')})`);
    if (s.animation) report.check(run.animation !== false, `${s.id}: proposes an animation, but run.md sets animation: false`);
    if (twoIntents && ['segmentation', 'build', 'in-use'].includes(s.section)) report.check(!!s.intent, `${s.id}: with two intents, scenes in ${s.section} name their intent`);

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
  const target = Math.min(S.target_minutes, run.target_minutes || 15);
  report.check(minutes <= target + 1e-9, `talk time ${minutes} min exceeds the target ${target} min`);
  if (scope.target_scenes) report.check(Math.abs(sc.length - scope.target_scenes) <= 2, `${sc.length} scenes vs target_scenes ${scope.target_scenes} in scope.md`);

  // Map
  for (const id of S.map.overview) report.check(['L1', 'L2'].includes(views.get(id)?.level), `map overview "${id}" must be an L1 or L2 view`);
  const panels = new Map(S.map.panels.map((p) => [p.element, p]));
  const inViews = new Set();
  for (const v of S.views) if (v.level !== 'flow') { for (const id of defaultViewElements(M, v.level, v.scope)) inViews.add(id); if (v.level === 'L3') inViews.add(v.scope); }
  for (const id of inViews) report.check(panels.has(id), `map: element "${id}" appears in a view but has no panel`);
  for (const p of S.map.panels) {
    report.check(M.els.has(p.element), `map panel "${p.element}" is not a model element`);
    if (p.view) report.check(views.get(p.view)?.level === 'L3' && views.get(p.view)?.scope === p.element, `map panel "${p.element}": view "${p.view}" must be its L3 view`);
    for (const d of p.detail || []) report.check(fs.existsSync(path.join(P.sources, d)), `map panel "${p.element}": detail path "${d}" is not in the snapshot`);
  }
  report.note(`${sc.length} scenes, ${minutes} of ${target} minutes`);
}

if (process.argv[1]?.endsWith('check-storyboard.mjs')) {
  main(() => { const r = new Report('check-storyboard'); checkStoryboard(r); r.exit(); });
}
