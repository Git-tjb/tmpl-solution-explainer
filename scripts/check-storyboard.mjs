// Validate stages/03_storyboard/output/scenes.json: schema, the (checked) rules in
// _config/information-architecture.md, the budget, talk time, views, on-screen lines, and map coverage.
// Run on its own, it also writes stages/03_storyboard/output/lines.md: every on-screen line beside the claims
// of the facts it cites, for the stage 03 gate.
import fs from 'node:fs';
import path from 'node:path';
import { P, out, main, Report, validate, readJson, factIds, factClaims, factPaths, loadModel, loadFlows, loadBefore, frontmatter,
  runAnswers, defaultViewElements, ancestors, words, writeText, rel } from './lib/common.mjs';

const SECTIONS = ['title', 'problem', 'answer', 'why', 'structure', 'segmentation', 'build', 'in-use', 'close'];
const BUDGET_SLACK = 0.25; // minutes a section may run over its allocation
const REPEAT_SHARE = 0.6;  // a line whose content words are mostly in the message is flagged (R7)

// Content words of a line, lower-cased and crudely stemmed, for the repeat test. A heuristic: it flags, the
// gate decides.
const STOP = new Set(('a an the and or but of to in on at by for with from as is are was were be been it its this that these those '
  + 'every each one all no not so than then there their they them we you your our his her he she i into onto over under up down out '
  + 'can will would should could do does did done has have had just only also very more most same').split(' '));
const stem = (w) => w.replace(/(ing|ed|es|s)$/, '') || w;
const contentWords = (s) => String(s).toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w)).map(stem);
export function repeatShare(line, point) {
  const lw = contentWords(line), pw = new Set(contentWords(point));
  return lw.length ? lw.filter((w) => pw.has(w)).length / lw.length : 0;
}
// A scene's picture: its view and what it highlights (R4, R6).
const picture = (s) => {
  const h = s.highlight || {};
  return `${s.view || ''}|${[...(h.elements || [])].sort()}|${[...(h.relationships || [])].sort()}|${[...(h.steps || [])].sort()}`;
};

export function checkStoryboard(report) {
  const S = readJson(P.scenes);
  if (!validate('scenes.schema.json', S, report, 'scenes.json')) return null;
  const M = loadModel();
  const { flows } = loadFlows();
  const B = fs.existsSync(P.before) ? loadBefore() : null;
  const facts = factIds();
  const claims = factClaims();
  const scope = frontmatter(P.scope).data;
  const run = runAnswers();
  const depth = scope.depth || 'conceptual';

  // Views
  const views = new Map();
  for (const v of S.views) {
    report.check(!views.has(v.id), `view "${v.id}" is declared twice`);
    views.set(v.id, v);
    if (v.level === 'before') report.check(v.scope === 'before' && !!B && B.els.size > 0, `view "${v.id}" (before) must have scope "before", and before-model.yaml must exist (stage 01)`);
    if (v.level === 'L1' || v.level === 'L2') report.check(v.scope === M.system?.id, `view "${v.id}" (${v.level}) must be scoped to the system "${M.system?.id}"`);
    if (v.level === 'L3') report.check(M.els.get(v.scope)?.type === 'function', `view "${v.id}" (L3) must be scoped to a function`);
    if (v.level === 'flow') report.check(flows.has(v.scope), `view "${v.id}" (flow) scope "${v.scope}" is not a flow`);
    if (v.mode === 'structure') report.check(v.level === 'L2' || v.level === 'L3', `view "${v.id}": mode structure is for L2 and L3 views only`);
    if (v.level === 'L3') report.check(!M.mapOnly.has(v.scope), `L3 view "${v.id}" zooms into "${v.scope}", which scope.md lists as map_only`);
  }
  for (const lvl of ['before', 'L1', 'L2']) report.check(S.views.some((v) => v.level === lvl), `a${lvl === 'before' ? ' before' : 'n ' + lvl} view is mandatory`);
  for (const c of scope.in_scope || []) report.check(S.views.some((v) => v.level === 'L3' && v.scope === c), `in-scope function "${c}" has no L3 view`);
  for (const v of S.views) if (v.level === 'L3') report.check((scope.in_scope || []).includes(v.scope), `L3 view "${v.id}" is for "${v.scope}", which is not in scope`);

  // Scenes
  const sc = S.scenes;
  sc.forEach((s, i) => report.check(s.id === `S${String(i + 1).padStart(2, '0')}`, `scene ${i + 1} must have id S${String(i + 1).padStart(2, '0')} (got ${s.id})`));
  const allIds = new Set([...M.els.keys(), ...M.rels.map((r) => r.id), ...(B ? [...B.els.keys(), ...B.rels.map((r) => r.id)] : [])]);
  const shown = new Set();
  const twoIntents = (scope.intents || []).length === 2;
  const firstUse = new Map();
  const lines = [];
  let minutes = 0;
  for (const s of sc) {
    minutes += s.minutes;
    const v = views.get(s.view);
    if (s.section !== 'title' && report.check(!!v, `${s.id}: view "${s.view}" is not declared in views[]`)) {
      report.check(v.level === s.level, `${s.id}: scene level ${s.level} but view "${v.id}" is ${v.level} (one level per scene)`);
    }
    report.check(s.mode === (s.section === 'in-use' ? 'how-to' : 'explanation'), `${s.id}: section "${s.section}" scenes are ${s.section === 'in-use' ? 'how-to' : 'explanation'} mode`);
    for (const f of s.facts) report.check(facts.has(f), `${s.id}: cites ${f}, which is not in the fact sheet`);

    // On-screen lines carry facts (R18) and add to the message (R7).
    s.text.forEach((t, i) => {
      report.check(words(t.line) <= 12, `${s.id}: text line ${i + 1} has ${words(t.line)} words (max 12)`);
      for (const f of t.facts) report.check(facts.has(f), `${s.id}: text line ${i + 1} cites ${f}, which is not in the fact sheet`);
      const share = repeatShare(t.line, s.point);
      if (share > REPEAT_SHARE) report.note(`WARN ${s.id}: text line ${i + 1} mostly repeats the message (${Math.round(share * 100)}% of its words); make it add something, or remove it`);
      lines.push({ s, i, t, share });
    });

    for (const id of [...(s.highlight?.elements || []), ...(s.highlight?.relationships || [])]) {
      report.check(allIds.has(id), `${s.id}: highlight "${id}" is not in the model`);
      report.check(!M.excluded.has(id), `${s.id}: highlight "${id}" is excluded in scope.md`);
      report.check(!M.mapOnly.has(id), `${s.id}: highlight "${id}" is map_only in scope.md, so the linear path does not dwell on it`);
    }
    const steps = s.reveals.map((r) => r.step);
    report.check(steps.every((x, i) => x === i + 1), `${s.id}: reveal steps must run 1..n (got ${steps.join(',')})`);
    if (s.animation) report.check(run.animation !== false, `${s.id}: proposes an animation, but run.md sets animation: false`);
    if (twoIntents && ['structure', 'segmentation', 'build', 'in-use'].includes(s.section)) report.check(!!s.intent, `${s.id}: with two intents, scenes in ${s.section} name their intent`);

    // Problem scenes show the problem (R5): a before view, never the solution.
    if (s.section === 'problem' || s.about === 'problem') report.check(v?.level === 'before', `${s.id}: a scene about the problem shows a before view, not the solution (${s.view ? `"${s.view}" is ${v?.level}` : 'no view'})`);
    if (s.section === 'why') report.check(['L1', 'before'].includes(v?.level), `${s.id}: a why scene shows the L1 view or a before view`);
    report.check(s.section !== 'answer' || s.level === 'L1', `${s.id}: the answer scene shows the L1 view`);

    // Every scene earns its picture (R4): a view shown before needs to say what this scene adds.
    if (s.view) {
      if (firstUse.has(s.view)) report.check(!!s.adds, `${s.id}: shows view "${s.view}" again (first in ${firstUse.get(s.view)}); say what it adds in "adds", or show a different picture`);
      else firstUse.set(s.view, s.id);
    }

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
    } else if (v && v.level !== 'before') {
      for (const id of defaultViewElements(M, v.level, v.scope)) shown.add(id);
      if (v.level === 'L3') shown.add(v.scope);
    }
  }

  // The arc (R1-R3, R6): title, then the user and the problem, then the answer; the close shows something new.
  const count = (sec) => sc.filter((s) => s.section === sec).length;
  report.check(sc[0].section === 'title', 'S01 must be the title scene (section "title")');
  report.check(count('title') === 1, `exactly one title scene (found ${count('title')})`);
  let at = 1;
  while (sc[at]?.section === 'problem') at++;
  const nProblem = at - 1;
  report.check(nProblem >= 1 && nProblem <= 2, `the title is followed by one or two problem scenes (found ${nProblem} before ${sc[at]?.id || 'the end'})`);
  report.check(count('problem') === nProblem, 'problem scenes come together, right after the title');
  const answer = sc[at];
  report.check(answer?.section === 'answer', `${answer?.id || 'the scene after the problem'} must be the answer scene: the solution comes as the answer to the problem`);
  report.check(count('answer') === 1, `exactly one answer scene (found ${count('answer')})`);
  const firstProblem = sc[1];
  if (firstProblem?.section === 'problem' && B?.user) {
    const pv = views.get(firstProblem.view);
    report.check(pv?.level === 'before', `${firstProblem.id}: the first problem scene shows the user, on a before view`);
  }
  if (typeof scope.purpose_line === 'string') report.check(sc[0].point === scope.purpose_line, `${sc[0].id}: the title scene's message is scope.md purpose_line`);
  const last = sc[sc.length - 1];
  report.check(last.section === 'close' && count('close') === 1, 'the last scene, and only it, is section "close"');
  if (answer) report.check(last.returns_to === answer.id, `${last.id}: the close returns_to the answer scene (${answer.id})`);
  const opening = new Set(sc.slice(0, at + 1).filter((s) => s.view).map(picture));
  report.check(!opening.has(picture(last)), `${last.id}: the close shows a picture the opening already showed; show something the audience has learned since (R6)`);
  for (let i = 1; i < sc.length; i++) report.check(SECTIONS.indexOf(sc[i].section) >= SECTIONS.indexOf(sc[i - 1].section) || ['structure', 'segmentation', 'build', 'in-use'].includes(sc[i].section),
    `${sc[i].id}: section "${sc[i].section}" comes after "${sc[i - 1].section}"; follow the arc in narrative-arc.md`);

  // Structure before wiring: the first L2 scene shows structure, and no flow scene precedes a structure scene.
  const isStructure = (s) => views.get(s.view)?.mode === 'structure';
  const firstStructure = sc.findIndex(isStructure);
  const firstL2 = sc.find((s) => s.level === 'L2');
  report.check(firstStructure >= 0, 'at least one scene must show a structure view (what each function does) before the wiring');
  if (firstL2) report.check(isStructure(firstL2), `${firstL2.id}: the first L2 scene must be a structure view, with wiring after it`);
  const firstFlow = sc.findIndex((s) => s.level === 'flow');
  if (firstFlow >= 0 && firstStructure >= 0) report.check(firstStructure < firstFlow, `${sc[firstFlow].id}: a flow scene comes before the first structure scene (${sc[firstStructure].id})`);

  // Budget first (R18): minutes per section, allocated before the scenes; the scenes keep to it.
  const target = Math.min(S.target_minutes, run.target_minutes || 15);
  const budget = new Map();
  for (const b of S.budget) { report.check(!budget.has(b.section), `budget: section "${b.section}" is listed twice`); budget.set(b.section, b); }
  const planned = S.budget.reduce((a, b) => a + b.minutes, 0);
  report.check(planned <= target + 1e-9, `budget: ${planned} min allocated, over the target ${target} min`);
  for (const sec of new Set(sc.map((s) => s.section))) {
    const b = budget.get(sec);
    if (!report.check(!!b, `budget: section "${sec}" has scenes but no allocation`)) continue;
    const used = sc.filter((s) => s.section === sec).reduce((a, s) => a + s.minutes, 0);
    report.check(used <= b.minutes + BUDGET_SLACK + 1e-9, `budget: section "${sec}" runs ${used} min, over its ${b.minutes} min`);
    const n = count(sec);
    if (n !== b.scenes) report.note(`budget: section "${sec}" planned ${b.scenes} scene(s), has ${n}`);
  }
  report.check(minutes <= target + 1e-9, `talk time ${minutes} min exceeds the target ${target} min`);
  if (scope.target_scenes) report.check(Math.abs(sc.length - scope.target_scenes) <= 2, `${sc.length} scenes vs target_scenes ${scope.target_scenes} in scope.md`);

  // Map
  for (const id of S.map.overview) report.check(['L1', 'L2'].includes(views.get(id)?.level), `map overview "${id}" must be an L1 or L2 view`);
  const panels = new Map(S.map.panels.map((p) => [p.element, p]));
  const inViews = new Set();
  for (const v of S.views) if (v.level !== 'flow' && v.level !== 'before') { for (const id of defaultViewElements(M, v.level, v.scope)) inViews.add(id); if (v.level === 'L3') inViews.add(v.scope); }
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
  if (S.map.panels.length > 25) report.note(`the map has ${S.map.panels.length} panels (over 25 gets hard to use live); consider excluding by depth in scope.md or moving low-level parts out of the views`);
  report.note(`${sc.length} scenes, ${minutes} of ${target} minutes (${planned} allocated)`);
  return linesMd(sc, lines, claims);
}

// lines.md: each on-screen line beside the claims of the facts it cites, for the operator to judge at the
// gate whether the facts carry it (A17).
function linesMd(sc, lines, claims) {
  const cell = (s) => String(s).replace(/\|/g, '\\|');
  const o = ['# On-screen lines', '',
    'Written by `check-storyboard`; do not edit. Read each line beside the claims of the facts it cites: do they carry',
    `it? "Repeats" marks a line whose words are mostly in the scene's message (over ${Math.round(REPEAT_SHARE * 100)}%); make it add something, or`,
    'remove it.', ''];
  for (const s of sc) {
    o.push(`## ${s.id}: ${s.title}`, '', `Message: ${s.point}`, '');
    const mine = lines.filter((l) => l.s === s);
    if (!mine.length) { o.push('No on-screen lines.', ''); continue; }
    o.push('| # | Line | Facts | Check |', '| --- | --- | --- | --- |');
    for (const l of mine) {
      const fs_ = l.t.facts.map((f) => `${f}: ${claims.get(f) ?? '(not in the fact sheet)'}`).join('<br>');
      o.push(`| ${l.i + 1} | ${cell(l.t.line)} | ${cell(fs_)} | ${l.share > REPEAT_SHARE ? `Repeats (${Math.round(l.share * 100)}%)` : ''} |`);
    }
    o.push('');
  }
  return o.join('\n');
}

if (process.argv[1]?.endsWith('check-storyboard.mjs')) {
  main(() => {
    const r = new Report('check-storyboard');
    const md = checkStoryboard(r);
    if (md !== null) { const f = out('03', 'lines.md'); writeText(f, md); r.note(`wrote ${rel(f)}`); }
    r.exit();
  });
}
