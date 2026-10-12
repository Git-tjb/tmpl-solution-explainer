// Render every view in scenes.json to SVG from the system model, flows, view specs, and the fixed
// layout profile (_config/standards/). Deterministic: the same inputs give byte-identical files.
//   (default)   -> stages/05_build/output/site/assets/diagrams/
//   --preview   -> stages/04_design/output/preview/
//   --out <dir> -> <dir> (used by verify to prove determinism)
import fs from 'node:fs';
import path from 'node:path';
import ELK from 'elkjs/lib/elk.bundled.js';
import { ROOT, P, out, main, shownName, readJson, readText, loadModel, loadFlows, viewElements, viewRelationships,
  writeText, loadTokens, UserError, rel } from './lib/common.mjs';
import { loadViewSpecs, REQUIRED_TOKENS } from './check-design.mjs';

const profile = readJson(path.join(P.standards, 'layout-profile.json'));
const FONT = profile.node.font_px;
const CHAR = 0.56; // average glyph width / font size for the bundled sans
const LINE = (px) => Math.round(px * 1.3);
const f1 = (n) => (Math.round(n * 10) / 10).toString();
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function wrap(text, width, px, maxLines = 99) {
  const max = Math.max(4, Math.floor(width / (px * CHAR)));
  const lines = [];
  let cur = '';
  for (const w of String(text).split(/\s+/).filter(Boolean)) {
    if (!cur) cur = w;
    else if ((cur + ' ' + w).length <= max) cur += ' ' + w;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) { const keep = lines.slice(0, maxLines); keep[maxLines - 1] += ' …'; return keep; }
  return lines;
}

// ---------- node content ----------
function elementBox(e) {
  const w = profile.node.element.width;
  const name = wrap(shownName(e), w - 28, FONT.name, 2);
  const resp = wrap(e.responsibility, w - 28, FONT.responsibility, 4);
  const h = Math.max(profile.node.element.height, 16 + name.length * LINE(FONT.name) + LINE(FONT.type_label) + 6 + resp.length * LINE(FONT.responsibility) + 14);
  return { w, h, name, resp };
}
function flowBox(n) {
  const w = profile.node.flow_node.width;
  const label = wrap(n.label, w - 32, FONT.name - 2, 3);
  const h = Math.max(profile.node.flow_node.height, 34 + (n.type === 'store' ? 10 : 0) + LINE(FONT.type_label) + label.length * LINE(FONT.name - 2) + 14);
  return { w, h, label };
}
function labelSize(text) {
  const lines = wrap(text, 220, FONT.edge_label, 3);
  return { lines, w: Math.ceil(Math.max(...lines.map((l) => l.length)) * FONT.edge_label * CHAR) + 12, h: lines.length * LINE(FONT.edge_label) + 6 };
}

// ---------- shapes (notation.md) ----------
function shape(kind, w, h) {
  switch (kind) {
    case 'actor': case 'trigger':
      return `<rect class="shape" x="0" y="0" width="${w}" height="${h}" rx="${f1(Math.min(h / 2, 40))}"/>` + (kind === 'trigger' ? `<rect class="bar" x="0" y="8" width="8" height="${h - 16}"/>` : '');
    case 'system':
      return `<rect class="shape" x="0" y="0" width="${w}" height="${h}"/><rect class="shape inner" x="5" y="5" width="${w - 10}" height="${h - 10}"/>`;
    case 'component': case 'step':
      return `<rect class="shape" x="0" y="0" width="${w}" height="${h}" rx="6"/>`;
    case 'store': {
      const ry = 10;
      return `<path class="shape" d="M0 ${ry} A${f1(w / 2)} ${ry} 0 0 1 ${w} ${ry} V${h - ry} A${f1(w / 2)} ${ry} 0 0 1 0 ${h - ry} Z"/><path class="shape rim" d="M0 ${ry} A${f1(w / 2)} ${ry} 0 0 0 ${w} ${ry}"/>`;
    }
    case 'gate': {
      const k = 18;
      return `<path class="shape" d="M${k} 0 H${w - k} L${w} ${f1(h / 2)} L${w - k} ${h} H${k} L0 ${f1(h / 2)} Z"/>`;
    }
    case 'decision':
      return `<path class="shape" d="M${f1(w / 2)} 0 L${w} ${f1(h / 2)} L${f1(w / 2)} ${h} L0 ${f1(h / 2)} Z"/>`;
    case 'output':
      return `<rect class="shape" x="0" y="0" width="${w}" height="${h}"/><path class="shape rim" d="M0 ${h - 6} H${w}"/>`;
    default: // function, external, flow external
      return `<rect class="shape" x="0" y="0" width="${w}" height="${h}"/>`;
  }
}
function textLines(lines, x, y, px, cls, anchor = 'middle') {
  return lines.map((l, i) => `<text class="${cls}" x="${f1(x)}" y="${f1(y + i * LINE(px))}" text-anchor="${anchor}">${esc(l)}</text>`).join('');
}

// ---------- styles: token values from tokens.css become fallbacks so a standalone SVG renders ----------
function styleBlock(tokens) {
  const v = (t) => `var(${t}, ${tokens[t] || '#888'})`;
  return `<style>
.diagram{font-family:var(--font-sans, 'IBM Plex Sans', sans-serif);}
.diagram .bg{fill:${v('--bg')};}
.diagram .title{fill:${v('--text')};font-size:22px;font-weight:600;}
.diagram .badge rect{fill:none;stroke:${v('--text-muted')};stroke-width:2px;}
.diagram .badge text{fill:${v('--text')};font-size:16px;font-weight:600;letter-spacing:.06em;}
.diagram .expand-mark circle{fill:${v('--surface')};stroke:${v('--c-highlight')};stroke-width:2px;}
.diagram .expand-mark path{stroke:${v('--c-highlight')};stroke-width:2px;}
.diagram .name{fill:${v('--text')};font-size:${FONT.name}px;font-weight:600;}
.diagram .type{fill:${v('--text-muted')};font-size:${FONT.type_label}px;font-variant:small-caps;letter-spacing:.04em;}
.diagram .resp,.diagram .lbl{fill:${v('--text')};font-size:${FONT.responsibility}px;}
.diagram .shape{fill:${v('--surface')};stroke-width:2px;}
.diagram .t-system .shape{stroke:${v('--c-system')};}
.diagram .t-function .shape{stroke:${v('--c-internal')};stroke-width:3px;}
.diagram .t-component .shape,.diagram .t-store .shape,.diagram .n-decision .shape,.diagram .n-store .shape{stroke:${v('--c-internal')};}
.diagram .t-actor .shape,.diagram .on-actor .shape{stroke:${v('--c-actor')};}
.diagram .t-external .shape,.diagram .n-external .shape{stroke:${v('--c-external')};stroke-dasharray:8 6;}
.diagram .on-function .shape,.diagram .on-component .shape,.diagram .on-store .shape{stroke:${v('--c-internal')};}
.diagram .on-external .shape{stroke:${v('--c-external')};}
.diagram .n-step .shape{stroke:${v('--c-internal')};}
.diagram .n-trigger .shape{stroke:${v('--c-edge')};}
.diagram .type .onname{font-variant:normal;letter-spacing:0;}
.diagram .n-trigger .bar{fill:${v('--c-edge')};}
.diagram .n-gate .shape{stroke:${v('--c-human')};stroke-width:3px;}
.diagram .n-output .shape{stroke:${v('--c-system')};}
.diagram .rim{fill:none;}
.diagram .boundary rect{fill:none;stroke-width:3px;stroke:${v('--c-internal')};}
.diagram .boundary.b-system rect{stroke:${v('--c-system')};stroke-dasharray:2 0;}
.diagram .boundary.b-lane rect{stroke:${v('--c-dim')};stroke-width:2px;stroke-dasharray:4 6;}
.diagram .boundary text{fill:${v('--text-muted')};font-size:18px;font-weight:600;}
.diagram .edge path.line{fill:none;stroke:${v('--c-edge')};stroke-width:2px;}
.diagram .edge.k-data path.line{stroke-dasharray:9 6;}
.diagram .edge.k-human path.line{stroke:${v('--c-human')};stroke-dasharray:2 5;stroke-linecap:round;}
.diagram .edge .lblbg{fill:${v('--bg')};}
.diagram .edge text{fill:${v('--text')};font-size:${FONT.edge_label}px;}
.diagram .stepno circle{fill:${v('--bg')};stroke:${v('--c-edge')};stroke-width:2px;}
.diagram .stepno text{fill:${v('--text')};font-size:${FONT.step_number}px;font-weight:600;}
.diagram .legend text{fill:${v('--text-muted')};font-size:16px;}
.diagram .legend .lgtitle{font-weight:600;}
.diagram marker path{fill:${v('--c-edge')};}
.diagram marker.m-human path{fill:${v('--c-human')};}
</style>`;
}

// ---------- graph building ----------
function buildStructureGraph(M, view, spec, priorLayout) {
  const els = viewElements(M, view, spec);
  const rels = viewRelationships(M, els, view.level, view.scope);
  const opts = { ...profile.structure };
  const nodeOf = (id) => {
    const e = M.els.get(id);
    const b = elementBox(e);
    return { id, width: b.w, height: b.h, _box: b, _el: e, layoutOptions: pinOpts(spec, id) };
  };
  let children;
  let boundary = null;
  if (view.level === 'L1') children = els.map(nodeOf);
  else {
    const boundaryId = view.level === 'L2' ? view.scope : view.scope;
    const inner = view.level === 'L2' ? els.filter((id) => M.els.get(id).parent === view.scope) : els.filter((id) => M.els.get(id).parent === view.scope);
    const outer = els.filter((id) => !inner.includes(id));
    boundary = { id: `boundary:${boundaryId}`, _boundary: M.els.get(boundaryId), layoutOptions: { ...spacing(profile.structure), 'elk.padding': '[top=48,left=20,bottom=20,right=20]', ...pinOpts(spec, boundaryId) }, children: inner.map(nodeOf) };
    children = [...outer.map(nodeOf)];
    // Keep neighbors and the zoomed function where the L2 view put them (views.md rule 5).
    if (view.level === 'L3' && priorLayout) {
      const x = (id) => priorLayout.nodes[id]?.x ?? 1e9;
      children.sort((a, b) => x(a.id) - x(b.id));
      const at = children.findIndex((c) => x(c.id) > x(view.scope));
      children.splice(at < 0 ? children.length : at, 0, boundary);
    } else children.push(boundary);
  }
  const edges = rels.map((r, i) => {
    const ls = labelSize(r.verb);
    const end = (id) => (boundary && id === view.scope ? boundary.id : id);
    return { id: `e${i}`, sources: [end(r.from)], targets: [end(r.to)], _label: { text: r.verb, width: ls.w, height: ls.h, _lines: ls.lines }, _rel: r };
  });
  const map = (n) => (n.id.startsWith('boundary:') ? n.id : n.id);
  return { graph: { id: 'root', layoutOptions: { ...opts, 'elk.hierarchyHandling': 'INCLUDE_CHILDREN', 'elk.json.edgeCoords': 'ROOT', 'elk.json.shapeCoords': 'ROOT' }, children, edges }, els, rels, map };
}
// Nested graphs (boundaries, lanes) take the same spacing as the root.
function spacing(opts) { return Object.fromEntries(Object.entries(opts).filter(([k]) => k.includes('spacing'))); }
function pinOpts(spec, id) {
  const p = (spec?.pins || []).find((x) => x.target === id);
  return p ? { 'elk.layered.layering.layerChoiceConstraint': String(p.layer), 'elk.layered.crossingMinimization.positionChoiceConstraint': String(p.order) } : {};
}
function buildFlowGraph(M, view, spec, flow) {
  const nodes = [...flow.nodes].sort((a, b) => a.step - b.step);
  const nodeOf = (n) => { const b = flowBox(n); return { id: n.id, width: b.w, height: b.h, _box: b, _node: n, layoutOptions: pinOpts(spec, n.id) }; };
  let children;
  if (spec?.lanes) {
    const laneOf = (n) => {
      if (!n.on) return '_edge';
      const chain = [n.on, ...(function anc() { const a = []; let e = M.els.get(n.on); while (e?.parent) { a.push(e.parent); e = M.els.get(e.parent); } return a; })()];
      const c = chain.find((x) => M.els.get(x)?.type === 'function');
      return c || n.on;
    };
    const lanes = [];
    for (const n of nodes) { const l = laneOf(n); if (!lanes.includes(l)) lanes.push(l); }
    children = lanes.map((l) => {
      const members = nodes.filter((n) => laneOf(n) === l).map(nodeOf);
      if (l === '_edge') return members;
      return [{ id: `lane:${l}`, _lane: M.els.get(l), layoutOptions: { ...spacing(profile.flow), 'elk.padding': '[top=48,left=20,bottom=20,right=20]' }, children: members }];
    }).flat();
  } else children = nodes.map(nodeOf);
  const edges = flow.edges.map((e, i) => {
    const text = e.condition ? `${e.label} [${e.condition}]` : e.label;
    const ls = labelSize(text);
    return { id: `e${i}`, sources: [e.from], targets: [e.to], _label: { text, width: ls.w, height: ls.h, _lines: ls.lines }, _fedge: e };
  });
  return { graph: { id: 'root', layoutOptions: { ...profile.flow, 'elk.hierarchyHandling': 'INCLUDE_CHILDREN', 'elk.json.edgeCoords': 'ROOT', 'elk.json.shapeCoords': 'ROOT' }, children, edges } };
}

// ---------- SVG emit ----------
// Level badge in every diagram's title row (notation.md, Level indicator).
const BADGE = { L1: 'L1 · CONTEXT', L2: 'L2 · FUNCTIONS', L3: 'L3 · COMPONENTS', flow: 'FLOW' };
// The expand marker: a drawn plus in a circle at the box's top-right (no text, so it never counts as a label).
const expandMark = (w) => `<g class="expand-mark" aria-hidden="true" transform="translate(${f1(w - 18)},18)"><circle r="11"/><path d="M-6 0 H6 M0 -6 V6"/></g>`;

function emit(view, spec, laid, tokens, M) {
  const PADX = 24, TOP = 52;
  // A structure view shows what_it_does inside the box, so nothing there needs expanding.
  const canExpand = (e) => spec.mode !== 'structure' && (e?.what_it_does || []).length > 0;
  const legendTypes = new Set();
  const edgeKinds = new Set();
  const parts = { boundaries: [], nodes: [], edges: [] };
  const positions = {};
  const visit = (n) => {
    const x = n.x + PADX, y = n.y + TOP;
    if (n._boundary || n._lane) {
      const e = n._boundary || n._lane;
      const cls = n._lane ? 'b-lane' : `b-${e.type}`;
      parts.boundaries.push(`<g class="boundary ${cls}" data-el="${esc(e.id)}"><rect x="${f1(x)}" y="${f1(y)}" width="${f1(n.width)}" height="${f1(n.height)}"/><text x="${f1(x + 16)}" y="${f1(y + 30)}">${esc(shownName(e))} <tspan class="type">[${e.type}]</tspan></text></g>`);
      positions[e.id] = { x: +f1(x), y: +f1(y), w: +f1(n.width), h: +f1(n.height) };
      if (!n._lane) legendTypes.add(e.type);
    }
    if (n._el) {
      const e = n._el, b = n._box;
      legendTypes.add(e.type);
      const cy = 16 + LINE(FONT.name) * 0.8;
      const ex = canExpand(e);
      parts.nodes.push(`<g class="node el t-${e.type}" data-el="${esc(e.id)}"${ex ? ` data-expand="${esc(e.id)}"` : ''} transform="translate(${f1(x)},${f1(y)})">${shape(e.type, b.w, b.h)}`
        + textLines(b.name, b.w / 2, cy + (e.type === 'store' ? 8 : 0), FONT.name, 'name')
        + `<text class="type" x="${f1(b.w / 2)}" y="${f1(cy + (e.type === 'store' ? 8 : 0) + (b.name.length - 1) * LINE(FONT.name) + LINE(FONT.type_label))}" text-anchor="middle">[${e.type}]</text>`
        + textLines(b.resp, b.w / 2, cy + (e.type === 'store' ? 8 : 0) + (b.name.length - 1) * LINE(FONT.name) + LINE(FONT.type_label) + 6 + LINE(FONT.responsibility), FONT.responsibility, 'resp')
        + (ex ? expandMark(b.w) : '')
        + `<title>${esc(shownName(e))} [${e.type}]: ${esc(e.responsibility)}</title></g>`);
      positions[e.id] = { x: +f1(x), y: +f1(y), w: b.w, h: b.h };
    }
    if (n._node) {
      const fnode = n._node, b = n._box;
      legendTypes.add(fnode.type);
      const onType = fnode.on ? M.els.get(fnode.on)?.type : null;
      const dy = fnode.type === 'store' ? 10 : 0;
      const ex = fnode.on && canExpand(M.els.get(fnode.on));
      parts.nodes.push(`<g class="node fn n-${fnode.type}${onType ? ` on-${onType}` : ''}" data-node="${esc(fnode.id)}" data-step="${fnode.step}"${fnode.on ? ` data-on="${esc(fnode.on)}"` : ''}${ex ? ` data-expand="${esc(fnode.on)}"` : ''} transform="translate(${f1(x)},${f1(y)})">${shape(fnode.type === 'external' ? 'external' : fnode.type, b.w, b.h)}`
        + `<g class="stepno"><circle cx="0" cy="0" r="15"/><text x="0" y="6" text-anchor="middle">${fnode.step}</text></g>`
        + `<text class="type" x="${f1(b.w / 2)}" y="${30 + dy}" text-anchor="middle">[${fnode.type}]${fnode.on ? `<tspan class="onname"> ${esc(M.els.get(fnode.on)?.name || fnode.on)}</tspan>` : ''}</text>`
        + textLines(b.label, b.w / 2, 30 + dy + LINE(FONT.name - 2), FONT.name - 2, 'lbl')
        + (ex ? expandMark(b.w) : '')
        + `<title>Step ${fnode.step} [${fnode.type}]: ${esc(fnode.label)}</title></g>`);
      positions[fnode.id] = { x: +f1(x), y: +f1(y), w: b.w, h: b.h };
    }
    for (const c of n.children || []) visit(c);
  };
  for (const c of laid.children) visit(c);

  // Boxes labels must not cover: every node, and every boundary's title strip.
  const blocked = [];
  const addBlock = (n) => {
    if (n._el || n._node) blocked.push({ x: n.x - 4, y: n.y - 4, w: n.width + 8, h: n.height + 8 });
    if (n._boundary || n._lane) blocked.push({ x: n.x, y: n.y, w: Math.min(n.width, 420), h: 44 });
    for (const c of n.children || []) addBlock(c);
  };
  for (const c of laid.children) addBlock(c);
  const hit = (r) => blocked.some((b) => r.x < b.x + b.w && r.x + r.w > b.x && r.y < b.y + b.h && r.y + r.h > b.y);
  for (const e of laid.edges) {
    const s = e.sections?.[0];
    if (!s) continue;
    const pts = [s.startPoint, ...(s.bendPoints || []), s.endPoint].map((p) => `${f1(p.x + PADX)} ${f1(p.y + TOP)}`);
    const kind = e._rel ? e._rel.kind : e._fedge.kind;
    edgeKinds.add(kind);
    const attrs = e._rel ? `data-rel="${esc(e._rel.ids.join(' '))}" data-edge="${esc(e._rel.from)}--${esc(e._rel.to)}"` : `data-edge="${esc(e._fedge.from)}--${esc(e._fedge.to)}"`;
    // Labels are placed here, not by the layout: centered on the edge's longest segment, over a
    // background patch, so they never add a layer of height.
    const L = e._label;
    let label = '';
    if (L) {
      const raw = [s.startPoint, ...(s.bendPoints || []), s.endPoint];
      const segs = [];
      for (let k = 0; k < raw.length - 1; k++) segs.push({ a: raw[k], b: raw[k + 1], len: Math.hypot(raw[k + 1].x - raw[k].x, raw[k + 1].y - raw[k].y) });
      segs.sort((p, q) => q.len - p.len);
      const cands = [];
      for (const g of segs) for (const t of [0.5, 0.35, 0.65, 0.2, 0.8]) {
        const mx = g.a.x + (g.b.x - g.a.x) * t, my = g.a.y + (g.b.y - g.a.y) * t;
        cands.push({ x: mx - L.width / 2, y: my - L.height / 2, w: L.width, h: L.height });
        if (Math.abs(g.a.x - g.b.x) < 1) { cands.push({ x: mx + 6, y: my - L.height / 2, w: L.width, h: L.height }); cands.push({ x: mx - 6 - L.width, y: my - L.height / 2, w: L.width, h: L.height }); }
      }
      const pick = cands.find((r) => !hit(r)) || cands[0];
      blocked.push(pick);
      const lx = pick.x + PADX, ly = pick.y + TOP;
      label = `<rect class="lblbg" x="${f1(lx)}" y="${f1(ly)}" width="${f1(L.width)}" height="${f1(L.height)}"/>` + L._lines.map((l, i) => `<text x="${f1(lx + L.width / 2)}" y="${f1(ly + 3 + (i + 0.78) * LINE(FONT.edge_label))}" text-anchor="middle">${esc(l)}</text>`).join('');
    }
    parts.edges.push(`<g class="edge k-${kind}" ${attrs}><path class="line" d="M${pts.join(' L')}" marker-end="url(#se-arrow-${kind})"/>${label}</g>`);
  }

  // Legend (views.md rule 2): generated from what is present.
  const order = ['actor', 'system', 'external', 'function', 'component', 'store', 'trigger', 'step', 'gate', 'decision', 'output'];
  const present = order.filter((t) => legendTypes.has(t));
  const contentW = laid.width + PADX * 2;
  const contentH = laid.height + TOP;
  const lg = [];
  let lx = PADX, ly = contentH + 34;
  lg.push(`<text class="lgtitle" x="${lx}" y="${ly}">Legend</text>`);
  lx += 84;
  const isFlow = view.level === 'flow';
  const wrapAt = Math.max(contentW, 640);
  for (const t of present) {
    const w = 44, h = 26;
    if (lx + w + 8 + t.length * 16 * CHAR > wrapAt) { lx = PADX + 84; ly += 40; }
    const cls = isFlow ? `n-${t}` : `t-${t}`;
    lg.push(`<g class="${cls}" transform="translate(${lx},${ly - 19})">${shape(t === 'external' ? 'external' : t, w, h)}</g><text x="${lx + w + 8}" y="${ly}">${t}</text>`);
    lx += w + 8 + t.length * 16 * CHAR + 28;
  }
  for (const k of ['control', 'data', 'human'].filter((k) => edgeKinds.has(k))) {
    if (lx + 52 + k.length * 16 * CHAR > wrapAt) { lx = PADX + 84; ly += 40; }
    lg.push(`<g class="edge k-${k}"><path class="line" d="M${lx} ${ly - 6} L${lx + 44} ${ly - 6}" marker-end="url(#se-arrow-${k})"/></g><text x="${lx + 52}" y="${ly}">${k}</text>`);
    lx += 52 + k.length * 16 * CHAR + 28;
  }
  const badgeW = Math.ceil(BADGE[view.level].length * 16 * 0.62 + 24);
  const W = Math.ceil(Math.max(contentW, 640, PADX * 2 + badgeW + 14 + spec.title.length * 22 * CHAR));
  const H = Math.ceil(ly + 16);
  const defs = `<defs>${['control', 'data', 'human'].map((k) => `<marker id="se-arrow-${k}" class="m-${k}" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="10" markerHeight="10" orient="auto-start-reverse"><path d="M0 0 L12 6 L0 12 ${k === 'data' ? 'L4 6 ' : ''}Z"/></marker>`).join('')}</defs>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" class="diagram" data-view="${esc(view.id)}" data-level="${view.level}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="se-title-${esc(view.id)}">`
    + `<title id="se-title-${esc(view.id)}">${esc(spec.title)}</title>${styleBlock(tokens)}${defs}`
    + `<rect class="bg" x="0" y="0" width="${W}" height="${H}"/>`
    + `<g class="badge"><rect x="${PADX}" y="14" width="${badgeW}" height="30" rx="4"/><text x="${PADX + 12}" y="35">${BADGE[view.level]}</text></g>`
    + `<text class="title" x="${PADX + badgeW + 14}" y="36">${esc(spec.title)}</text>`
    + `<g class="boundaries">${parts.boundaries.join('')}</g><g class="edges">${parts.edges.join('')}</g><g class="nodes">${parts.nodes.join('')}</g>`
    + `<g class="legend">${lg.join('')}</g></svg>\n`;
  return { svg, layout: { w: W, h: H, nodes: positions } };
}

export async function renderAll(outDir) {
  const S = readJson(P.scenes);
  const M = loadModel();
  const { flows } = loadFlows();
  const specs = loadViewSpecs();
  const tokens = loadTokens();
  for (const t of REQUIRED_TOKENS) if (!tokens[t]) throw new UserError(`tokens.css is missing ${t}; run check-design.`);
  const elk = new ELK();
  const layouts = {};
  const order = { L1: 0, L2: 1, L3: 2, flow: 3 };
  const views = [...S.views].sort((a, b) => order[a.level] - order[b.level] || a.id.localeCompare(b.id));
  fs.mkdirSync(outDir, { recursive: true });
  for (const v of views) {
    const spec = specs.get(v.id);
    if (!spec) throw new UserError(`views/${v.id}.yaml is missing; run check-design.`);
    let graph;
    if (v.level === 'flow') {
      const f = flows.get(v.scope);
      if (!f) throw new UserError(`view ${v.id}: flow ${v.scope} not found`);
      graph = buildFlowGraph(M, v, spec, f).graph;
    } else {
      const prior = v.level === 'L3' && spec.inherit_from ? layouts[spec.inherit_from] : null;
      graph = buildStructureGraph(M, v, spec, prior).graph;
    }
    const laid = await elk.layout(graph);
    const { svg, layout } = emit(v, spec, laid, tokens, M);
    writeText(path.join(outDir, `${v.id}.svg`), svg);
    layouts[v.id] = layout;
  }
  writeText(path.join(outDir, 'layout.json'), JSON.stringify(layouts, null, 1) + '\n');
  return layouts;
}

if (process.argv[1]?.endsWith('render-diagrams.mjs')) {
  main(async () => {
    const i = process.argv.indexOf('--out');
    const dir = i > 0 ? path.resolve(ROOT, process.argv[i + 1])
      : process.argv.includes('--preview') ? out('04', 'preview') : path.join(P.site, 'assets', 'diagrams');
    fs.rmSync(dir, { recursive: true, force: true });
    const layouts = await renderAll(dir);
    console.log(`Rendered ${Object.keys(layouts).length} view(s) into ${rel(dir)}`);
    // Predicted label size on a 1920x1080 screen, per scene layout (build-rules.md: labels >= 16px).
    const FIG = { 'diagram-with-text': { w: 1265, h: 968 }, diagram: { w: 1824, h: 898 }, 'diagram-wide': { w: 1824, h: 820 } };
    let SS = null;
    try { SS = (await import('./lib/common.mjs')).readYaml(P.sceneSpecs); } catch { /* no scene specs yet */ }
    const S = readJson(P.scenes);
    for (const s of S.scenes) {
      const L = layouts[s.view], layout = SS?.scenes?.[s.id]?.layout || 'diagram-with-text';
      if (!L || !FIG[layout]) continue;
      const scale = Math.min(1, FIG[layout].w / L.w, FIG[layout].h / L.h);
      if (scale < 1) console.log(`WARN ${s.id} (${s.view}, ${layout}): labels would render at ${(16 * scale).toFixed(1)}px at 1920x1080 (min 16). Narrow or split the view, or use layout "diagram".`);
    }
  });
}
