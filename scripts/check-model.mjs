// Validate system-model.yaml and flows.yaml against their schemas and the integrity rules in
// _config/standards/system-model.md and flows.md. With --scope, also check stages/02_scope/output/scope.md.
import { P, main, Report, validate, readYaml, factIds, loadModel, frontmatter, words } from './lib/common.mjs';

export function checkModel(report) {
  const facts = factIds();
  report.check(facts.size > 0, 'fact-sheet.md has no fact IDs (rows starting "| F001 |").');
  const raw = readYaml(P.model);
  if (!validate('system-model.schema.json', raw, report, 'system-model.yaml')) return;
  const M = loadModel();
  const ids = new Set();
  for (const e of raw.elements) {
    report.check(!ids.has(e.id), `element id "${e.id}" is used twice`);
    ids.add(e.id);
  }
  const systems = raw.elements.filter((e) => e.type === 'system');
  report.check(systems.length === 1, `the model needs exactly one system element (found ${systems.length})`);
  const allowedParent = { container: ['system'], component: ['container'], store: ['system', 'container'] };
  const relIds = new Set();
  for (const e of raw.elements) {
    if (allowedParent[e.type]) {
      const p = M.els.get(e.parent);
      if (report.check(!!p, `element "${e.id}": parent "${e.parent}" does not exist`)) {
        report.check(allowedParent[e.type].includes(p.type), `element "${e.id}" (${e.type}): parent "${p.id}" is a ${p.type}; allowed: ${allowedParent[e.type].join(', ')}`);
      }
    }
    report.check(words(e.responsibility) <= 12, `element "${e.id}": responsibility has ${words(e.responsibility)} words (max 12)`);
    for (const f of e.sources) report.check(facts.has(f), `element "${e.id}" cites ${f}, which is not in the fact sheet`);
  }
  for (const r of raw.relationships) {
    report.check(!relIds.has(r.id), `relationship id "${r.id}" is used twice`);
    relIds.add(r.id);
    report.check(M.els.has(r.from), `relationship "${r.id}": from "${r.from}" does not exist`);
    report.check(M.els.has(r.to), `relationship "${r.id}": to "${r.to}" does not exist`);
    for (const f of r.sources) report.check(facts.has(f), `relationship "${r.id}" cites ${f}, which is not in the fact sheet`);
  }
  for (const e of raw.elements) {
    if (e.type === 'system') continue;
    const related = raw.relationships.some((r) => r.from === e.id || r.to === e.id);
    report.check(related || (M.children.get(e.id) || []).length > 0, `element "${e.id}" is an orphan: no relationship and no children`);
  }

  const flowsRaw = readYaml(P.flows);
  if (!validate('flow.schema.json', flowsRaw, report, 'flows.yaml')) return;
  const flowIds = new Set();
  const allowedOn = { step: null, gate: null, decision: null, store: ['store'], external: ['external'] };
  for (const f of flowsRaw.flows) {
    report.check(!flowIds.has(f.id), `flow id "${f.id}" is used twice`);
    flowIds.add(f.id);
    for (const s of f.sources) report.check(facts.has(s), `flow "${f.id}" cites ${s}, which is not in the fact sheet`);
    const nodeIds = new Set(f.nodes.map((n) => n.id));
    report.check(nodeIds.size === f.nodes.length, `flow "${f.id}": node ids must be unique`);
    report.check(f.nodes.filter((n) => n.type === 'trigger').length === 1, `flow "${f.id}": needs exactly one trigger`);
    report.check(f.nodes.some((n) => n.type === 'output'), `flow "${f.id}": needs at least one output`);
    const steps = f.nodes.map((n) => n.step).sort((a, b) => a - b);
    report.check(steps.every((s, i) => s === i + 1), `flow "${f.id}": steps must run 1..${f.nodes.length} with no gaps or repeats (got ${steps.join(',')})`);
    for (const n of f.nodes) {
      for (const s of n.sources) report.check(facts.has(s), `flow "${f.id}" node "${n.id}" cites ${s}, which is not in the fact sheet`);
      if (!n.on) continue;
      const el = M.els.get(n.on);
      if (!report.check(!!el, `flow "${f.id}" node "${n.id}": on "${n.on}" is not a model element`)) continue;
      const allowed = allowedOn[n.type];
      if (allowed) report.check(allowed.includes(el.type), `flow "${f.id}" node "${n.id}" (${n.type}) must bind to a ${allowed.join('/')} element; "${n.on}" is a ${el.type}`);
      else report.check(el.type !== 'system', `flow "${f.id}" node "${n.id}": bind to a part of the system, not the system itself`);
    }
    for (const e of f.edges) {
      report.check(nodeIds.has(e.from) && nodeIds.has(e.to), `flow "${f.id}": edge ${e.from} -> ${e.to} references a missing node`);
      const from = f.nodes.find((n) => n.id === e.from);
      if (from?.type === 'decision') report.check(!!e.condition, `flow "${f.id}": edge ${e.from} -> ${e.to} leaves a decision and needs a condition`);
    }
  }
  for (const f of flowsRaw.flows) if (f.continues) report.check(flowIds.has(f.continues), `flow "${f.id}": continues "${f.continues}", which does not exist`);
}

export function checkScope(report) {
  const M = loadModel();
  const flows = new Set((readYaml(P.flows)?.flows || []).map((f) => f.id));
  const { data } = frontmatter(P.scope);
  for (const k of ['core_message', 'opening', 'intents', 'in_scope', 'example_flows', 'excluded', 'target_scenes']) {
    report.check(data[k] !== undefined, `scope.md frontmatter is missing "${k}"`);
  }
  report.check(typeof data.core_message === 'string' && !/\n/.test(data.core_message), 'core_message must be one line');
  report.check(['outcome-first', 'story-first'].includes(data.opening), 'opening must be outcome-first or story-first');
  report.check(Array.isArray(data.intents) && data.intents.length >= 1 && data.intents.length <= 2
    && data.intents.every((i) => ['educate', 'how-to', 'persuade'].includes(i)), 'intents: one or two of educate, how-to, persuade');
  for (const id of data.in_scope || []) {
    const e = M.els.get(id);
    report.check(e?.type === 'container', `in_scope "${id}" must be a container in the model`);
  }
  const ef = data.example_flows || [];
  report.check(ef.length >= 1 && ef.length <= 2, 'example_flows: one or two flows');
  for (const id of ef) report.check(flows.has(id), `example_flows "${id}" is not in flows.yaml`);
  report.check(Number.isInteger(data.target_scenes) && data.target_scenes >= 8 && data.target_scenes <= 12, 'target_scenes must be 8-12');
}

if (process.argv[1]?.endsWith('check-model.mjs')) {
  main(() => {
    const report = new Report('check-model');
    checkModel(report);
    if (process.argv.includes('--scope')) checkScope(report);
    report.exit();
  });
}
