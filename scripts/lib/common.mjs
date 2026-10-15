// Shared helpers for the solution-explainer scripts. Every script runs from the workspace root.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import YAML from 'yaml';
import Ajv2020 from 'ajv/dist/2020.js';

export const ROOT = process.cwd();
if (!fs.existsSync(path.join(ROOT, 'AGENTS.md')) || !fs.existsSync(path.join(ROOT, 'stages'))) {
  console.error('Run this script from the workspace root (the folder with AGENTS.md and stages/).');
  process.exit(2);
}

export const STAGES = {
  '01': 'stages/01_discover',
  '02': 'stages/02_scope',
  '03': 'stages/03_storyboard',
  '04': 'stages/04_design',
  '05': 'stages/05_build',
  '06': 'stages/06_verify',
  '07': 'stages/07_retro',
};
export const out = (nn, ...p) => path.join(ROOT, STAGES[nn], 'output', ...p);
export const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');

// Paths every script uses. A dry run points SE_RUN_MD at fixture answers.
export const P = {
  runMd: path.resolve(ROOT, process.env.SE_RUN_MD || '_config/run.md'),
  standards: path.join(ROOT, '_config/standards'),
  sources: out('01', 'sources'),
  factSheet: out('01', 'fact-sheet.md'),
  model: out('01', 'system-model.yaml'),
  before: out('01', 'before-model.yaml'),
  visualRefs: out('01', 'visual-refs'),
  flows: out('01', 'flows.yaml'),
  inventory: out('01', 'inventory.md'),
  scope: out('02', 'scope.md'),
  scenes: out('03', 'scenes.json'),
  views: out('04', 'views'),
  sceneSpecs: out('04', 'scene-specs.yaml'),
  tokens: out('04', 'tokens.css'),
  theme: out('04', 'theme'),
  site: out('05', 'site'),
};

// ---------- files ----------
export function readText(p) {
  if (!fs.existsSync(p)) throw new UserError(`Missing file: ${rel(p)}`);
  return fs.readFileSync(p, 'utf8');
}
export function readYaml(p) {
  try { return YAML.parse(readText(p)); }
  catch (e) { if (e instanceof UserError) throw e; throw new UserError(`${rel(p)} is not valid YAML: ${e.message}`); }
}
export function readJson(p) {
  try { return JSON.parse(readText(p)); }
  catch (e) { if (e instanceof UserError) throw e; throw new UserError(`${rel(p)} is not valid JSON: ${e.message}`); }
}
export function writeText(p, text) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text.replace(/\r\n/g, '\n'));
}
export function frontmatter(p) {
  const text = readText(p).replace(/\r\n/g, '\n');
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) throw new UserError(`${rel(p)} has no YAML frontmatter.`);
  try { return { data: YAML.parse(m[1]) || {}, body: text.slice(m[0].length) }; }
  catch (e) { throw new UserError(`${rel(p)} frontmatter is not valid YAML: ${e.message}`); }
}
export function walk(dir, { skipDirs = [] } = {}) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  const visit = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) { if (!skipDirs.includes(e.name)) visit(full); }
      else if (e.isFile()) files.push(full);
    }
  };
  visit(dir);
  return files;
}
export const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

// ---------- errors and reports ----------
export class UserError extends Error {}
export function main(fn) {
  Promise.resolve().then(fn).catch((e) => {
    if (e instanceof UserError) { console.error(`ERROR: ${e.message}`); process.exit(1); }
    console.error(e); process.exit(3);
  });
}
export class Report {
  constructor(title) { this.title = title; this.errors = []; this.notes = []; }
  fail(msg) { this.errors.push(msg); }
  note(msg) { this.notes.push(msg); }
  check(cond, msg) { if (!cond) this.fail(msg); return cond; }
  print() {
    console.log(`${this.title}: ${this.errors.length ? `FAIL (${this.errors.length})` : 'PASS'}`);
    for (const e of this.errors) console.log(`  - ${e}`);
    for (const n of this.notes) console.log(`  note: ${n}`);
  }
  exit() { this.print(); process.exit(this.errors.length ? 1 : 0); }
}

// ---------- schemas ----------
let ajv;
export function validate(schemaFile, data, report, label) {
  if (!ajv) {
    ajv = new Ajv2020({ allErrors: true, strict: false });
    for (const f of fs.readdirSync(P.standards).filter((f) => f.endsWith('.schema.json')).sort()) {
      ajv.addSchema(readJson(path.join(P.standards, f)), f);
    }
  }
  const v = ajv.getSchema(schemaFile);
  if (!v(data)) for (const e of v.errors) report.fail(`${label}${e.instancePath || ''}: ${e.message}${e.params?.allowedValues ? ` (${e.params.allowedValues.join(', ')})` : ''}${e.params?.additionalProperty ? ` (\"${e.params.additionalProperty}\"; quote values that contain commas)` : ''}`);
  return !v.errors;
}

// ---------- run answers ----------
export function runAnswers() { return frontmatter(P.runMd).data; }

// ---------- fact sheet ----------
export function factIds() {
  const ids = new Set();
  for (const m of readText(P.factSheet).matchAll(/^\|\s*(F\d{3,})\s*\|/gm)) ids.add(m[1]);
  return ids;
}

// Snapshot-relative path each fact cites (the first `backticked` path in its Source cell, without the
// "sources/" prefix and the section). Used to refuse map detail under an excluded element.
export function factPaths() {
  const map = new Map();
  for (const m of readText(P.factSheet).matchAll(/^\|\s*(F\d{3,})\s*\|[^|]*\|\s*`([^`]+)`/gm)) map.set(m[1], m[2].replace(/^sources\//, ''));
  return map;
}

// ---------- model ----------
export function loadModel() {
  const model = readYaml(P.model) || {};
  const els = new Map((model.elements || []).map((e) => [e.id, e]));
  const rels = model.relationships || [];
  const children = new Map();
  for (const e of els.values()) if (e.parent) {
    if (!children.has(e.parent)) children.set(e.parent, []);
    children.get(e.parent).push(e.id);
  }
  const system = [...els.values()].find((e) => e.type === 'system');
  const M = { model, els, rels, children, system, excluded: new Set(), mapOnly: new Set() };
  // scope.md (stage 02) says what is excluded; everything downstream honours it, descendants included.
  if (fs.existsSync(P.scope)) {
    const scope = frontmatter(P.scope).data || {};
    for (const id of scope.excluded || []) if (els.has(id)) { M.excluded.add(id); for (const d of descendants(M, id)) M.excluded.add(d); }
    for (const id of scope.map_only || []) if (els.has(id)) M.mapOnly.add(id);
  }
  return M;
}
// The before model (system-model.md, The before model): the user and the old way, with no solution in it.
export function loadBefore() {
  const data = readYaml(P.before) || {};
  const els = new Map((data.elements || []).map((e) => [e.id, e]));
  return { data, els, rels: data.relationships || [], user: els.get(data.user) };
}
export function loadFlows() {
  const data = readYaml(P.flows) || {};
  return { data, flows: new Map((data.flows || []).map((f) => [f.id, f])) };
}
export function ancestors(M, id) {
  const out = [];
  let e = M.els.get(id);
  while (e && e.parent) { out.push(e.parent); e = M.els.get(e.parent); }
  return out;
}
export function descendants(M, id) {
  const out = [];
  const visit = (x) => { for (const c of M.children.get(x) || []) { out.push(c); visit(c); } };
  visit(id);
  return out;
}

// The default element set of a view (views.md), before a view spec narrows it.
export function defaultViewElements(M, level, scope) {
  return rawViewElements(M, level, scope).filter((id) => !M.excluded.has(id));
}
function rawViewElements(M, level, scope) {
  const sys = M.system?.id;
  const outside = [...M.els.values()].filter((e) => e.type === 'actor' || e.type === 'external').map((e) => e.id);
  const touching = (inner) => {
    const inSet = new Set(inner);
    return outside.filter((o) => M.rels.some((r) => (r.from === o && inSet.has(r.to)) || (r.to === o && inSet.has(r.from))));
  };
  if (level === 'L1') return [sys, ...touching([sys, ...descendants(M, sys)])];
  if (level === 'L2') {
    const kids = M.children.get(sys) || [];
    return [...kids, ...touching([sys, ...descendants(M, sys)])];
  }
  if (level === 'L3') {
    const kids = M.children.get(scope) || [];
    const inner = new Set([scope, ...descendants(M, scope)]);
    const neighbors = new Set();
    for (const r of M.rels) {
      for (const [a, b] of [[r.from, r.to], [r.to, r.from]]) {
        if (inner.has(a) && !inner.has(b)) neighbors.add(liftTo(M, b, 'L2'));
      }
    }
    neighbors.delete(scope);
    neighbors.delete(sys);
    return [...kids, ...[...neighbors].filter(Boolean).sort()];
  }
  return [];
}
// The ancestor of id that is visible at a level's granularity.
export function liftTo(M, id, level) {
  const e = M.els.get(id);
  if (!e) return undefined;
  if (e.type === 'actor' || e.type === 'external') return id;
  const chain = [id, ...ancestors(M, id)];
  if (level === 'L1') return M.system?.id;
  if (level === 'L2') return chain.find((x) => M.els.get(x)?.parent === M.system?.id) || id;
  return id;
}
// Relationships of a view: lifted to visible ends and merged (views.md).
// For L2 and L3, a relationship ending at the scope itself is drawn to its boundary. For L3, only
// relationships with at least one end inside the function are drawn.
export function viewRelationships(M, elementIds, level, scope) {
  const visible = new Set(elementIds);
  if (level === 'L2' || level === 'L3') visible.add(scope);
  const inner = level === 'L3' ? new Set([scope, ...descendants(M, scope)]) : null;
  const resolve = (id) => {
    let x = id;
    while (x && !visible.has(x)) x = M.els.get(x)?.parent;
    if (x) return x;
    if (level === 'L3') { const l = liftTo(M, id, 'L2'); if (visible.has(l)) return l; }
    return undefined;
  };
  const merged = new Map();
  for (const r of M.rels) {
    if (M.excluded.has(r.from) || M.excluded.has(r.to)) continue;
    if (inner && !inner.has(r.from) && !inner.has(r.to)) continue;
    const a = resolve(r.from), b = resolve(r.to);
    if (!a || !b || a === b) continue;
    const key = `${a}>${b}`;
    if (!merged.has(key)) merged.set(key, { from: a, to: b, ids: [], verbs: [], kinds: [] });
    const m = merged.get(key);
    m.ids.push(r.id);
    if (!m.verbs.includes(r.verb)) m.verbs.push(r.verb);
    if (!m.kinds.includes(r.kind)) m.kinds.push(r.kind);
  }
  return [...merged.values()].map((m) => ({
    ...m, verb: m.verbs.join('; '), kind: m.kinds.length === 1 ? m.kinds[0] : (m.kinds.includes('control') ? 'control' : m.kinds[0]),
  }));
}

// The element set of a view after a view spec (if any) narrows it.
export function viewElements(M, view, spec) {
  const def = defaultViewElements(M, view.level, view.scope);
  if (spec?.elements) return spec.elements.filter((id) => def.includes(id));
  return def;
}

// ---------- tokens ----------
export function readTokens(cssText, { rootOnly = false } = {}) {
  const tokens = {};
  const text = rootOnly ? [...cssText.matchAll(/:root\s*\{([^}]*)\}/g)].map((m) => m[1]).join(' ') : cssText;
  for (const m of text.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) tokens[m[1]] = m[2].trim();
  return tokens;
}
// The run's tokens: tokens.css, then the :root values in theme/theme.css (a run theme's values win).
export function loadTokens() {
  const tokens = readTokens(readText(P.tokens));
  const themeCss = path.join(P.theme, 'theme.css');
  if (fs.existsSync(themeCss)) Object.assign(tokens, readTokens(readText(themeCss), { rootOnly: true }));
  return tokens;
}
export function hexToRgb(hex) {
  const h = hex.replace('#', '').trim();
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  if (!/^[0-9a-f]{6}$/i.test(f)) return null;
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16));
}
export function luminance([r, g, b]) {
  const c = [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export function contrast(a, b) {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// OKLCH lightness, chroma, and hue (degrees) of an sRGB colour, for the colour-role checks (build-rules.md).
export function oklch([r, g, b]) {
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { L, C: Math.hypot(a, bb), h: ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360 };
}
export const hueGap = (h1, h2) => { const d = Math.abs(h1 - h2) % 360; return d > 180 ? 360 - d : d; };

export const words = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;

// How an element's name is shown everywhere: "name (exact_name)", or just the name (system-model.md).
// The area a scene's diagram gets, per viewport and scene layout, in CSS px, after the legend row below it.
// Derived from scripts/site/base.css (scene padding, text column, control bar, header); keep the two in step.
// render-diagrams uses it to choose a layout and to predict label size (iteration 002, D4).
export const FIGURE = {
  '1920x1080': { 'diagram-with-text': { w: 1265, h: 922 }, diagram: { w: 1824, h: 852 }, 'diagram-wide': { w: 1824, h: 774 } },
  '1440x900': { 'diagram-with-text': { w: 896, h: 761 }, diagram: { w: 1344, h: 691 }, 'diagram-wide': { w: 1344, h: 613 } },
};
// The width a scene's title and message get at 1440x900, the tighter viewport, per layout (base.css), and the
// size steps build-site may use to fit each in two lines (R18). Sizes are fractions of --size-title and
// --size-point.
export const TEXT_COLUMN = { 'diagram-with-text': 400, orientation: 400, diagram: 1260, 'diagram-wide': 1260, statement: 1260 };
export const FIT_STEPS = [1, 0.86, 0.78];
// Diagram labels must render at 16px at 1080p, scaled with viewport height below it (build-rules.md).
export const LABEL_FLOOR = { '1920x1080': 16, '1440x900': 16 * (900 / 1080) };
// A small diagram scales up to fill its figure, but no more than this (iteration 002, D4).
export const UPSCALE_CAP = 1.6;

// The level an element belongs to, from the model's hierarchy (system-model.md, Levels): actors, externals,
// and the system are L1; functions, and stores held by the system, are L2; components, and stores held by a
// function, are L3.
export function elementLevel(M, e) {
  if (!e) return null;
  if (['actor', 'external', 'system'].includes(e.type)) return 'L1';
  if (e.type === 'function') return 'L2';
  if (e.type === 'component') return 'L3';
  return M.els.get(e.parent)?.type === 'system' ? 'L2' : 'L3';
}
// The drawn kind of an element: its type, or `file` for a store that is one file.
export const elementKind = (e) => (e?.type === 'store' && e.form === 'file' ? 'file' : e?.type);
export const shownName = (e) => (e?.exact_name ? `${e.name} (${e.exact_name})` : e?.name);
