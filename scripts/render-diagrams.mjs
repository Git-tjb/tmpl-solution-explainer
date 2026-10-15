// Render every view in scenes.json to SVG from the system model, flows, view specs, and the fixed
// layout profile (_config/standards/). Deterministic: the same inputs give byte-identical files.
//   (default)   -> stages/05_build/output/site/assets/diagrams/  (fails when a scene's diagram would render
//                  below the 16px label floor, or text does not fit its shape)
//   --preview   -> stages/04_design/output/preview/  (warns instead of failing)
//   --out <dir> -> <dir> (used by verify to prove determinism)
import fs from 'node:fs';
import path from 'node:path';
import ELK from 'elkjs/lib/elk.bundled.js';
import { ROOT, P, out, main, shownName, elementLevel, elementKind, readJson, readYaml, loadModel, loadFlows, loadBefore, viewRelationships,
  defaultViewElements,
  viewElements, writeText, loadTokens, UserError, rel, FIGURE, LABEL_FLOOR, UPSCALE_CAP } from './lib/common.mjs';
import { loadViewSpecs, beforeViewElements, REQUIRED_TOKENS } from './check-design.mjs';

const profile = readJson(path.join(P.standards, 'layout-profile.json'));
const metrics = readJson(path.join(P.standards, 'font-metrics.json')).fonts;
const FONT = profile.node.font_px;
const LINE = (px) => Math.round(px * 1.3);
const f1 = (n) => (Math.round(n * 10) / 10).toString();
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------- measured text (iteration 002, D5) ----------
// Widths come from the bundled fonts (font-metrics.json), not an average glyph width, so text is wrapped and
// boxes are sized to what the browser will draw.
const FACE = { 400: 'sans-400', 600: 'sans-600', mono: 'mono-400' };
export function textWidth(text, px, face = 400) {
  const w = metrics[FACE[face]].widths;
  let sum = 0;
  for (const ch of String(text)) sum += w[ch] ?? 600;
  return (sum / 1000) * px;
}
// Split a word that is wider than the line: at '/' for paths, then by characters.
function breakWord(word, width, px, face) {
  if (textWidth(word, px, face) <= width) return [word];
  const parts = word.includes('/') ? word.split(/(?<=\/)/) : [...word];
  const o = [];
  let cur = '';
  for (const p of parts) {
    if (cur && textWidth(cur + p, px, face) > width) { o.push(cur); cur = p; }
    else cur += p;
  }
  if (cur) o.push(cur);
  return o;
}
// Wrap to a width. Never truncates: callers decide what too many lines means (R8).
export function wrap(text, width, px, face = 400) {
  const lines = [];
  let cur = '';
  for (const word of String(text).split(/\s+/).filter(Boolean)) {
    for (const piece of breakWord(word, width, px, face)) {
      const join = cur ? (cur.endsWith('/') ? cur + piece : cur + ' ' + piece) : piece;
      if (!cur || textWidth(join, px, face) <= width) cur = join;
      else { lines.push(cur); cur = piece; }
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// Text that needs more lines than its shape allows fails the render, naming who fixes it (R8).
const LIMITS = { name: 3, exact: 2, resp: 4, flow_label: 4, edge_label: 3 };
let tooLong = [];
function limit(lines, max, what) {
  if (lines.length > max) tooLong.push(`${what}: needs ${lines.length} lines (max ${max})`);
  return lines;
}

// ---------- node content: one layout of lines per box, read by the emitter ----------
// Each box is a list of text rows ({ cls, lines, px, face, anchor, x, y }) laid top to bottom, and its size.
function elementBox(e, structure, who) {
  const kind = elementKind(e);
  const w = profile.node.element.width_by_type?.[e.type] || profile.node.element.width;
  const inner = w - 28;
  const rows = [];
  rows.push({ cls: 'name', lines: limit(wrap(e.name, inner, FONT.name, 600), LIMITS.name, `${who} name "${e.name}" (stage 01)`), px: FONT.name, face: 600 });
  // The exact name goes on its own smaller line, in the monospace face, wrapping paths at '/' (A8).
  if (e.exact_name) rows.push({ cls: 'exact', lines: limit(wrap(e.exact_name, inner, FONT.type_label, 'mono'), LIMITS.exact, `${who} exact_name "${e.exact_name}" (stage 01)`), px: FONT.type_label, face: 'mono' });
  rows.push({ cls: 'type', lines: [`[${kind}]`], px: FONT.type_label, face: 400, gap: 2 });
  const items = structure ? (e.what_it_does || []).map((x) => x.text) : [];
  if (items.length) {
    // Bullets wrap fully; the box grows (A14).
    for (const t of items) rows.push({ cls: 'resp wid', bullet: true, lines: wrap(t, w - 46, FONT.responsibility), px: FONT.responsibility, face: 400, anchor: 'start', x: 32, gap: 6 });
  } else {
    rows.push({ cls: 'resp', lines: limit(wrap(e.responsibility, inner, FONT.responsibility), LIMITS.resp, `${who} responsibility (stage 01)`), px: FONT.responsibility, face: 400, gap: 6 });
  }
  let y = kind === 'store' ? 18 : 12;
  for (const r of rows) { y += r.gap || 0; r.y = y + r.px * 0.95; y += r.lines.length * LINE(r.px); }
  const h = Math.max(profile.node.element.height, Math.ceil(y + 14));
  return { w, h, rows, kind };
}
// A before-model element (system-model.md, The before model): its name, an exact name for a means, and its
// type. A pain's name is what hurt, so it may take a line more.
function beforeBox(e, who) {
  const w = profile.node.element.width;
  const inner = w - 28 - (e.type === 'pain' ? 22 : 0);
  const rows = [];
  rows.push({ cls: 'name', lines: limit(wrap(e.name, inner, FONT.name, 600), e.type === 'pain' ? 4 : LIMITS.name, `${who} name "${e.name}" (stage 01, before-model.yaml)`), px: FONT.name, face: 600 });
  if (e.exact_name) rows.push({ cls: 'exact', lines: limit(wrap(e.exact_name, inner, FONT.type_label, 'mono'), LIMITS.exact, `${who} exact_name "${e.exact_name}" (stage 01, before-model.yaml)`), px: FONT.type_label, face: 'mono' });
  rows.push({ cls: 'type', lines: [`[${e.type}]`], px: FONT.type_label, face: 400, gap: 2 });
  let y = 12;
  for (const r of rows) { y += r.gap || 0; r.y = y + r.px * 0.95; y += r.lines.length * LINE(r.px); }
  if (e.type === 'pain') for (const r of rows) r.x = (8 + w - 22) / 2; // centred between the tag's bar and its point
  const h = Math.max(profile.node.element.height - 20, Math.ceil(y + 14));
  return { w, h, rows, kind: e.type };
}
function flowBox(n, M, who) {
  const bound = n.on ? M.els.get(n.on) : null;
  const kind = n.type === 'store' && elementKind(bound) === 'file' ? 'file' : n.type;
  const decision = n.type === 'decision';
  // A decision's label must fit the diamond's inscribed rectangle, so it wraps narrower and the diamond grows.
  const inner = decision ? 150 : profile.node.flow_node.width - 32;
  const rows = [];
  rows.push({ cls: 'type', lines: [`[${kind}]`], px: FONT.type_label, face: 400 });
  // The bound element's name goes on its own line under the type, so the type line never overflows.
  if (bound) rows.push({ cls: 'type onname', lines: limit(wrap(bound.name, inner, FONT.type_label), 2, `${who} bound element name (stage 01)`), px: FONT.type_label, face: 400 });
  rows.push({ cls: 'lbl', lines: limit(wrap(n.label, inner, FONT.name - 2, 600), LIMITS.flow_label, `${who} label "${n.label}" (stage 01, flows.yaml)`), px: FONT.name - 2, face: 600, gap: 4 });
  let y = 0;
  for (const r of rows) { y += r.gap || 0; r.y = y + r.px * 0.95; y += r.lines.length * LINE(r.px); }
  const contentH = y;
  let w = profile.node.flow_node.width;
  let h = Math.max(profile.node.flow_node.height, Math.ceil(contentH + 44 + (n.type === 'store' ? 10 : 0)));
  let offY = 22 + (n.type === 'store' ? 10 : 0);
  if (decision) {
    const cw = Math.max(...rows.map((r) => Math.max(...r.lines.map((l) => textWidth(l, r.px, r.face))))) + 16;
    w = Math.ceil(Math.max(profile.node.flow_node.width, cw * 2));
    h = Math.ceil(Math.max(profile.node.flow_node.height, (contentH + 12) * 2));
    offY = (h - contentH) / 2;
  }
  for (const r of rows) r.y += offY;
  return { w, h, rows, kind };
}
// A boundary's or lane's title: "name (exact_name) [type]", wrapped to the narrowest the boundary can be (its
// widest part plus padding), so it never runs past the boundary (A10). ELK ignores a minimum size on a nested
// node, so the boundary reserves the lines in its top padding instead.
const TITLE_PX = 18, TITLE_LINE = 23;
function boundaryTitle(e, parts, rooms) {
  const room = rooms?.get(e.id) ?? Math.max(200, ...parts.map((c) => c.width)) + 40 - 32;
  const lines = wrap(`${shownName(e)} [${e.type}]`, room, TITLE_PX, 600);
  const w = Math.ceil(Math.max(...lines.map((l) => textWidth(l, TITLE_PX, 600))));
  return { lines, w, padTop: 14 + lines.length * TITLE_LINE + 12, type: `[${e.type}]` };
}
function titleSvg(t, x, y) {
  return `<rect class="tbg" x="${f1(x - 6)}" y="${f1(y + 10)}" width="${f1(t.w + 12)}" height="${f1(t.lines.length * TITLE_LINE + 8)}"/>` + t.lines.map((l, i) => {
    const typeAt = l.endsWith(t.type) ? l.length - t.type.length : -1;
    const body = typeAt >= 0 ? `${esc(l.slice(0, typeAt))}<tspan class="type">${esc(t.type)}</tspan>` : esc(l);
    return `<text x="${f1(x)}" y="${f1(y + 30 + i * TITLE_LINE)}">${body}</text>`;
  }).join('');
}

function labelSize(text, who) {
  const lines = limit(wrap(text, 220, FONT.edge_label), LIMITS.edge_label, `${who} line label "${text}"`);
  return { lines, w: Math.ceil(Math.max(...lines.map((l) => textWidth(l, FONT.edge_label)))) + 14, h: lines.length * LINE(FONT.edge_label) + 6 };
}

// ---------- shapes (notation.md) ----------
function shape(kind, w, h) {
  switch (kind) {
    case 'pain': { // a notched tag with a heavy bar at its left: one thing that hurt
      const k = 22;
      return `<path class="shape" d="M0 0 H${w - k} L${w} ${f1(h / 2)} L${w - k} ${h} H0 Z"/><rect class="bar" x="0" y="0" width="8" height="${h}"/>`;
    }
    case 'person':
      return `<rect class="shape" x="0" y="0" width="${w}" height="${h}" rx="${f1(Math.min(h / 2, 40))}"/>`;
    case 'task':
      return `<rect class="shape" x="0" y="0" width="${w}" height="${h}" rx="6"/>`;
    case 'actor': case 'trigger':
      return `<rect class="shape" x="0" y="0" width="${w}" height="${h}" rx="${f1(Math.min(h / 2, 40))}"/>` + (kind === 'trigger' ? `<rect class="bar" x="0" y="8" width="8" height="${h - 16}"/>` : '');
    case 'system':
      return `<rect class="shape" x="0" y="0" width="${w}" height="${h}"/><rect class="shape inner" x="5" y="5" width="${w - 10}" height="${h - 10}"/>`;
    case 'component': case 'step':
      return `<rect class="shape" x="0" y="0" width="${w}" height="${h}" rx="6"/>`;
    case 'file': { // a store that is one file: a page with a folded corner
      const k = 16;
      return `<path class="shape" d="M0 0 H${w - k} L${w} ${k} V${h} H0 Z"/><path class="shape rim" d="M${w - k} 0 V${k} H${w}"/>`;
    }
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
// The rows of a box as SVG text; a bullet row draws its dot.
function rowsSvg(b) {
  let o = '';
  for (const r of b.rows) {
    const anchor = r.anchor || 'middle', x = r.x ?? b.w / 2;
    if (r.bullet) o += `<circle class="bullet" cx="20" cy="${f1(r.y - r.px * 0.32)}" r="3"/>`;
    o += r.lines.map((l, i) => `<text class="${r.cls}" x="${f1(x)}" y="${f1(r.y + i * LINE(r.px))}" text-anchor="${anchor}">${esc(l)}</text>`).join('');
  }
  return o;
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
.diagram .exact{fill:${v('--text-muted')};font-size:${FONT.type_label}px;font-family:var(--font-mono, 'IBM Plex Mono', monospace);}
.diagram .type{fill:${v('--text-muted')};font-size:${FONT.type_label}px;}
.diagram .resp{fill:${v('--text')};font-size:${FONT.responsibility}px;}
.diagram .lbl{fill:${v('--text')};font-size:${FONT.name - 2}px;font-weight:600;}
.diagram .bullet{fill:${v('--text')};}
.diagram .edge .leader{fill:none;stroke:${v('--c-edge')};stroke-width:2px;stroke-dasharray:2 4;}
.diagram .shape{fill:${v('--surface')};stroke-width:2px;}
.diagram .t-system .shape{stroke:${v('--c-system')};}
.diagram .t-function .shape{stroke:${v('--c-internal')};stroke-width:3px;}
.diagram .t-component .shape,.diagram .t-store .shape,.diagram .t-file .shape,.diagram .n-decision .shape,.diagram .n-store .shape,.diagram .n-file .shape{stroke:${v('--c-internal')};}
.diagram .t-actor .shape,.diagram .on-actor .shape{stroke:${v('--c-actor')};}
.diagram .t-external .shape,.diagram .n-external .shape{stroke:${v('--c-external')};stroke-dasharray:8 6;}
.diagram .on-function .shape,.diagram .on-component .shape,.diagram .on-store .shape{stroke:${v('--c-internal')};}
.diagram .on-external .shape{stroke:${v('--c-external')};}
.diagram .n-step .shape{stroke:${v('--c-internal')};}
.diagram .n-trigger .shape{stroke:${v('--c-edge')};}
.diagram .n-trigger .bar{fill:${v('--c-edge')};}
.diagram .n-gate .shape{stroke:${v('--c-human')};stroke-width:3px;}
.diagram .n-output .shape{stroke:${v('--c-system')};}
.diagram .rim{fill:none;}
.diagram .boundary rect{fill:none;stroke-width:3px;stroke:${v('--c-internal')};}
.diagram .boundary.b-system rect{stroke:${v('--c-system')};stroke-dasharray:2 0;}
.diagram .boundary.b-lane rect{stroke:${v('--c-dim')};stroke-width:2px;stroke-dasharray:4 6;}
.diagram .boundary text{fill:${v('--text-muted')};font-size:18px;font-weight:600;}
.diagram .boundary rect.tbg{fill:${v('--bg')};stroke:none !important;}
.diagram .edge path.line{fill:none;stroke:${v('--c-edge')};stroke-width:2px;}
.diagram .edge.k-data path.line{stroke-dasharray:9 6;}
.diagram .edge.k-human path.line{stroke:${v('--c-human')};stroke-dasharray:2 5;stroke-linecap:round;}
.diagram .edge .lblbg{fill:${v('--bg')};}
.diagram .edge text{fill:${v('--text')};font-size:${FONT.edge_label}px;}
.diagram .stepno circle{fill:${v('--bg')};stroke:${v('--c-edge')};stroke-width:2px;}
.diagram .stepno text{fill:${v('--text')};font-size:${FONT.step_number}px;font-weight:600;}
.diagram .legend text{fill:${v('--text-muted')};font-size:16px;}
.diagram .legend .lgtitle{font-weight:600;}
.diagram .focus-swatch .shape{fill:none;stroke:${v('--c-highlight')};stroke-width:3px;}
.diagram .lvkey .shape{fill:none;stroke-width:3px;}
.diagram .node.lv-L1 .shape,.diagram .lvkey.lv-L1 .shape{stroke:${v('--lv-1')};}
.diagram .node.lv-L2 .shape,.diagram .lvkey.lv-L2 .shape{stroke:${v('--lv-2')};}
.diagram .node.lv-L3 .shape,.diagram .lvkey.lv-L3 .shape{stroke:${v('--lv-3')};}
.diagram .t-person .shape{stroke:${v('--c-actor')};}
.diagram .t-task .shape{stroke:${v('--c-internal')};}
.diagram .t-means .shape{stroke:${v('--c-external')};stroke-dasharray:8 6;}
.diagram .t-pain .shape{stroke:${v('--c-system')};}
.diagram .t-pain .bar{fill:${v('--c-system')};}
.diagram .node.hl.t-pain .bar{fill:${v('--c-highlight')};}
.diagram .edge.k-hurts path.line{stroke-dasharray:3 6;stroke-linecap:round;}
.diagram marker path{fill:${v('--c-edge')};}
.diagram marker.m-human path{fill:${v('--c-human')};}
</style>`;
}
// The title art (iteration 003, D4): a large schematic of the solution drawn from a view's laid-out geometry,
// with shapes and lines only, in the neutral structure colours.
function artStyle(tokens) {
  const v = (t) => `var(${t}, ${tokens[t] || '#888'})`;
  return `<style>
.title-art .grid circle{fill:${v('--c-dim')};}
.title-art .shape,.title-art .rim{fill:none;stroke:${v('--c-internal')};stroke-width:3px;}
.title-art .t-system .shape,.title-art .art-boundary rect{fill:none;stroke:${v('--c-system')};stroke-width:4px;}
.title-art .t-actor .shape{stroke:${v('--c-actor')};}
.title-art .t-external .shape{stroke:${v('--c-external')};stroke-dasharray:10 8;}
.title-art .art-node .shape{fill:${v('--surface')};}
.title-art .art-edge path{fill:none;stroke:${v('--c-edge')};stroke-width:3px;}
.title-art .art-edge.k-data path{stroke-dasharray:10 7;}
.title-art .art-edge.k-human path{stroke:${v('--c-human')};stroke-dasharray:2 7;stroke-linecap:round;}
.title-art marker path{fill:${v('--c-edge')};}
</style>`;
}

// ---------- graph building ----------
// `dir` is the layout candidate's direction (D4): DOWN or RIGHT.
function buildStructureGraph(M, view, spec, priorLayout, dir, rooms) {
  const structure = spec?.mode === 'structure';
  const els = viewElements(M, view, spec);
  // A structure view draws no lines (views.md, Modes).
  const rels = structure ? [] : viewRelationships(M, els, view.level, view.scope);
  const opts = { ...profile.structure, 'elk.direction': dir };
  const nodeOf = (id) => {
    const e = M.els.get(id);
    const b = elementBox(e, structure, `view ${view.id}, element "${id}"`);
    return { id, width: b.w, height: b.h, _box: b, _el: e };
  };
  let children;
  let boundary = null;
  if (view.level === 'L1') children = els.map(nodeOf);
  else {
    const inner = els.filter((id) => M.els.get(id).parent === view.scope);
    const outer = els.filter((id) => !inner.includes(id));
    const be = M.els.get(view.scope);
    const kids = inner.map(nodeOf);
    const title = boundaryTitle(be, kids, rooms);
    // Structure views lay the parts out as a grid inside the boundary (rectpacking), not as layers.
    const inside = structure ? { ...profile.structure_grid } : { ...spacing(profile.structure) };
    inside['elk.padding'] = `[top=${title.padTop},left=20,bottom=20,right=20]`;
    boundary = { id: `boundary:${view.scope}`, _boundary: be, _title: title, layoutOptions: inside, children: kids };
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
    // Plain labels (R15): one verb, or the spec's label for this line; never a count. The full list is in
    // the tooltip and the map panel. L1 lines carry no label.
    const key = `${r.from}--${r.to}`;
    const text = view.level === 'L1' ? null : (spec?.labels?.[key] || r.verbs[0]);
    const end = (id) => (boundary && id === view.scope ? boundary.id : id);
    const e = { id: `e${i}`, sources: [end(r.from)], targets: [end(r.to)], _rel: r };
    if (text) { const ls = labelSize(text, `view ${view.id}, line ${key}`); e._label = { text, width: ls.w, height: ls.h, _lines: ls.lines }; }
    return e;
  });
  // A structure view has no edges, so each level is laid out on its own (the grid needs its own algorithm).
  const rootOpts = { ...opts, 'elk.hierarchyHandling': structure ? 'SEPARATE_CHILDREN' : 'INCLUDE_CHILDREN', 'elk.json.edgeCoords': 'ROOT', 'elk.json.shapeCoords': 'ROOT' };
  // Pins (ported from trial run 1): ELK ignores layerChoiceConstraint in a nested layout, so pins use
  // partitioning. Each pinned top-level node's partition is its layer; unpinned top-level nodes and the
  // boundary go in the row after the last pinned one. Within a row, pins order the model order. Pins on
  // parts inside a boundary are not supported (check-design notes them).
  const pins = spec?.pins || [];
  const topId = (c) => (c._boundary ? c._boundary.id : c.id);
  const pinOf = (c) => pins.find((x) => x.target === topId(c));
  if (children.some(pinOf)) {
    rootOpts['elk.partitioning.activate'] = 'true';
    const after = Math.max(...pins.map((x) => x.layer)) + 1;
    for (const c of children) {
      const pin = pinOf(c);
      c.layoutOptions = { ...(c.layoutOptions || {}), 'elk.partitioning.partition': String(pin ? pin.layer : after) };
    }
    const key = (c) => { const pin = pinOf(c); return pin ? pin.layer * 1000 + pin.order : after * 1000 + 999; };
    children.sort((a, b) => key(a) - key(b));
  }
  return { id: 'root', layoutOptions: rootOpts, children, edges };
}
// Nested graphs (boundaries, lanes) take the same spacing as the root.
function spacing(opts) { return Object.fromEntries(Object.entries(opts).filter(([k]) => k.includes('spacing'))); }
function pinOpts(spec, id) {
  const p = (spec?.pins || []).find((x) => x.target === id);
  return p ? { 'elk.layered.layering.layerChoiceConstraint': String(p.layer), 'elk.layered.crossingMinimization.positionChoiceConstraint': String(p.order) } : {};
}
// `aspect` is the layout candidate's aspect-ratio target (D4).
function buildFlowGraph(M, view, spec, flow, aspect, rooms) {
  const nodes = [...flow.nodes].sort((a, b) => a.step - b.step);
  const nodeOf = (n) => { const b = flowBox(n, M, `view ${view.id}, step ${n.step}`); return { id: n.id, width: b.w, height: b.h, _box: b, _node: n, layoutOptions: pinOpts(spec, n.id) }; };
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
      const le = M.els.get(l);
      const title = boundaryTitle(le, members, rooms);
      return [{ id: `lane:${l}`, _lane: le, _title: title, layoutOptions: { ...spacing(profile.flow), 'elk.padding': `[top=${title.padTop},left=20,bottom=20,right=20]` }, children: members }];
    }).flat();
  } else children = nodes.map(nodeOf);
  // Lines leaving one node with the same label share one label, placed near the source (R12). A decision's
  // branch shows its condition alone ("pass"), short enough to sit on the line by the diamond; its verb is in
  // the line's tooltip.
  const types = new Map(flow.nodes.map((n) => [n.id, n.type]));
  const textOf = (x) => (types.get(x.from) === 'decision' && x.condition ? x.condition : x.label);
  // Lines into one node with the same label (a fan-in) likewise share one label, by the target.
  const seen = new Set();
  const edges = flow.edges.map((e, i) => {
    const text = textOf(e);
    const fanOut = flow.edges.filter((x) => x.from === e.from && textOf(x) === text).length > 1;
    const fanIn = !fanOut && flow.edges.filter((x) => x.to === e.to && textOf(x) === text).length > 1;
    const key = fanIn ? `in|${e.to}|${text}` : `out|${e.from}|${text}`;
    const o = { id: `e${i}`, sources: [e.from], targets: [e.to], _fedge: e };
    if (!seen.has(key)) {
      seen.add(key);
      const ls = labelSize(text, `view ${view.id}, line ${e.from}--${e.to}`);
      // A decision's branch labels and a fan-out's label sit on the line's first segment, by the source; a
      // fan-in's on its last, by the target.
      o._label = { text, width: ls.w, height: ls.h, _lines: ls.lines, first: fanOut || types.get(e.from) === 'decision', last: fanIn };
    }
    return o;
  });
  return { id: 'root', layoutOptions: { ...profile.flow, 'elk.aspectRatio': aspect, 'elk.layered.thoroughness': '20', 'elk.hierarchyHandling': 'INCLUDE_CHILDREN', 'elk.json.edgeCoords': 'ROOT', 'elk.json.shapeCoords': 'ROOT' }, children, edges };
}

// A before view (views.md): the before model's elements and relationships, and each pain's line to what it
// hurts. The user takes the first layer, so the picture leads with them (iteration 003, D4). A pain is laid out
// after what it hurts (the layout edge runs from the target to the pain); its line is drawn from the pain. A
// pain that hurts a relationship points at the relationship's target.
function buildBeforeGraph(B, view, spec, dir) {
  const els = beforeViewElements(B, spec);
  const has = new Set(els);
  const children = els.map((id) => {
    const e = B.els.get(id);
    const b = beforeBox(e, `view ${view.id}, element "${id}"`);
    return { id, width: b.w, height: b.h, _box: b, _bel: e };
  });
  const edges = [];
  for (const r of B.rels) {
    if (!has.has(r.from) || !has.has(r.to)) continue;
    const e = { id: `e${edges.length}`, sources: [r.from], targets: [r.to], _brel: r };
    const ls = labelSize(r.verb, `view ${view.id}, line ${r.from}--${r.to}`);
    e._label = { text: r.verb, width: ls.w, height: ls.h, _lines: ls.lines };
    edges.push(e);
  }
  for (const id of els) {
    const p = B.els.get(id);
    if (p.type !== 'pain') continue;
    const rel = B.rels.find((r) => r.id === p.hurts);
    const target = rel ? rel.to : p.hurts;
    if (!has.has(target)) continue;
    edges.push({ id: `e${edges.length}`, sources: [target], targets: [id], _hurts: { pain: p, target } });
  }
  const opts = { ...profile.structure, 'elk.direction': dir, 'elk.json.edgeCoords': 'ROOT', 'elk.json.shapeCoords': 'ROOT' };
  const pins = spec?.pins || [];
  if (pins.length) {
    opts['elk.partitioning.activate'] = 'true';
    const after = Math.max(...pins.map((x) => x.layer)) + 1;
    for (const c of children) { const pin = pins.find((x) => x.target === c.id); c.layoutOptions = { 'elk.partitioning.partition': String(pin ? pin.layer : after) }; }
  } else {
    opts['elk.partitioning.activate'] = 'true';
    for (const c of children) c.layoutOptions = { 'elk.partitioning.partition': c.id === B.data.user ? '0' : '1' };
  }
  return { id: 'root', layoutOptions: opts, children, edges };
}

// ---------- SVG emit ----------
// Level badge in every diagram's title row (notation.md, Level indicator).
const BADGE = { before: 'BEFORE', L1: 'L1 · CONTEXT', L2: 'L2 · FUNCTIONS', L3: 'L3 · COMPONENTS', flow: 'FLOW' };
const LEVEL_NAME = { L1: 'Context', L2: 'Functions', L3: 'Components' };
// The expand marker: a drawn plus in a circle at the box's top-right (no text, so it never counts as a label).
const expandMark = (w) => `<g class="expand-mark" aria-hidden="true" transform="translate(${f1(w - 18)},18)"><circle r="11"/><path d="M-6 0 H6 M0 -6 V6"/></g>`;
const PADX = 24, TOP = 52;
const LG_ORDER = ['person', 'task', 'means', 'pain', 'actor', 'system', 'external', 'function', 'component', 'store', 'file', 'trigger', 'step', 'gate', 'decision', 'output'];
// Line kinds, in legend order, and how the legend names them.
const LINE_KINDS = ['control', 'data', 'human', 'before', 'hurts'];
const LINE_LABEL = { before: 'relationship' };

function emit(view, spec, laid, tokens, M) {
  // A flow whose steps come from more than one level outlines each node in its level's colour and adds a level
  // key to the legend (notation.md, Level key). A context, functions, or components view is one level by
  // definition (views.md): its actors and externals are context, not a second level, so it needs neither.
  const nodeLevels = new Set();
  const collect = (n) => {
    if (n._el) nodeLevels.add(elementLevel(M, n._el));
    if (n._node?.on) nodeLevels.add(elementLevel(M, M.els.get(n._node.on)));
    for (const c of n.children || []) collect(c);
  };
  for (const c of laid.children) collect(c);
  nodeLevels.delete(null);
  const mixed = view.level === 'flow' && nodeLevels.size > 1;
  const lvClass = (e) => (mixed && elementLevel(M, e) ? ` lv-${elementLevel(M, e)}` : '');
  // A structure view shows what_it_does inside the box, so nothing there needs expanding.
  const canExpand = (e) => spec.mode !== 'structure' && (e?.what_it_does || []).length > 0;
  const legendTypes = new Set();
  const edgeKinds = new Set();
  const parts = { boundaries: [], nodes: [], edges: [] };
  const positions = {};
  const bounds = []; // boundaries and lanes: drawn after routing, so their titles can sit clear of the lines
  const retitle = []; // titles that found no gap between the lines crossing their strip
  const visit = (n) => {
    const x = n.x + PADX, y = n.y + TOP;
    if (n._boundary || n._lane) {
      const e = n._boundary || n._lane;
      bounds.push({ e, n, cls: n._lane ? 'b-lane' : `b-${e.type}` });
      positions[e.id] = { x: +f1(x), y: +f1(y), w: +f1(n.width), h: +f1(n.height) };
      if (!n._lane) legendTypes.add(e.type);
    }
    if (n._el) {
      const e = n._el, b = n._box;
      legendTypes.add(b.kind);
      const ex = canExpand(e);
      parts.nodes.push(`<g class="node el t-${b.kind}${lvClass(e)}" data-el="${esc(e.id)}"${ex ? ` data-expand="${esc(e.id)}"` : ''} transform="translate(${f1(x)},${f1(y)})">${shape(b.kind, b.w, b.h)}`
        + rowsSvg(b) + (ex ? expandMark(b.w) : '')
        + `<title>${esc(shownName(e))} [${b.kind}]: ${esc(e.responsibility)}</title></g>`);
      positions[e.id] = { x: +f1(x), y: +f1(y), w: b.w, h: b.h };
    }
    if (n._bel) {
      const e = n._bel, b = n._box;
      legendTypes.add(b.kind);
      parts.nodes.push(`<g class="node el t-${b.kind}" data-el="${esc(e.id)}" transform="translate(${f1(x)},${f1(y)})">${shape(b.kind, b.w, b.h)}`
        + rowsSvg(b) + `<title>${esc(shownName(e))} [${b.kind}]</title></g>`);
      positions[e.id] = { x: +f1(x), y: +f1(y), w: b.w, h: b.h };
    }
    if (n._node) {
      const fnode = n._node, b = n._box;
      const bound = fnode.on ? M.els.get(fnode.on) : null;
      legendTypes.add(b.kind);
      const ex = fnode.on && canExpand(bound);
      parts.nodes.push(`<g class="node fn n-${b.kind}${bound ? ` on-${bound.type}` : ''}${bound ? lvClass(bound) : ''}" data-node="${esc(fnode.id)}" data-step="${fnode.step}"${fnode.on ? ` data-on="${esc(fnode.on)}"` : ''}${ex ? ` data-expand="${esc(fnode.on)}"` : ''} transform="translate(${f1(x)},${f1(y)})">${shape(b.kind, b.w, b.h)}`
        + `<g class="stepno"><circle cx="0" cy="0" r="15"/><text x="0" y="6" text-anchor="middle">${fnode.step}</text></g>`
        + rowsSvg(b) + (ex ? expandMark(b.w) : '')
        + `<title>Step ${fnode.step} [${b.kind}]: ${esc(fnode.label)}</title></g>`);
      positions[fnode.id] = { x: +f1(x), y: +f1(y), w: b.w, h: b.h };
    }
    for (const c of n.children || []) visit(c);
  };
  for (const c of laid.children) visit(c);

  // Boxes labels must not cover: every node, and every boundary's title strip.
  const blocked = [];
  const addBlock = (n) => {
    if (n._el || n._node || n._bel) blocked.push({ x: n.x - 4, y: n.y - 4, w: n.width + 8, h: n.height + 8 });
    for (const c of n.children || []) addBlock(c);
  };
  for (const c of laid.children) addBlock(c);
  const overlaps = (r, b) => r.x < b.x + b.w && r.x + r.w > b.x && r.y < b.y + b.h && r.y + r.h > b.y;
  const hit = (r) => blocked.some((b) => overlaps(r, b));
  // Every routed line segment is an obstacle for every other edge's label.
  const segRects = laid.edges.map((e) => {
    const s = e.sections?.[0];
    if (!s) return [];
    const raw = [s.startPoint, ...(s.bendPoints || []), s.endPoint];
    const o = [];
    for (let k = 0; k < raw.length - 1; k++) {
      const p = raw[k], q = raw[k + 1];
      o.push({ x: Math.min(p.x, q.x) - 3, y: Math.min(p.y, q.y) - 3, w: Math.abs(q.x - p.x) + 6, h: Math.abs(q.y - p.y) + 6 });
    }
    return o;
  });
  // A boundary title goes in the first gap of its title strip that no routed line crosses (AC-28): at the left,
  // or just past a crossing. If there is no such gap it stays at the left.
  for (const bd of bounds) {
    const { n } = bd, t = n._title;
    const top = n.y, bottom = n.y + t.padTop - 6;
    const cross = [];
    for (const rs of segRects) for (const r of rs) if (r.y < bottom && r.y + r.h > top && r.x < n.x + n.width && r.x + r.w > n.x) cross.push([r.x - 6, r.x + r.w + 6]);
    const left = n.x + 16, right = n.x + n.width - 12;
    const free = (c) => c + t.w <= right && !cross.some(([a, b]) => a < c + t.w && b > c);
    let tx = [left, ...cross.map(([, b]) => b + 4).sort((a, b) => a - b)].find(free);
    if (tx === undefined) {
      // No gap fits: ask for another layout with the title wrapped to the widest gap (renderAll), and draw it at
      // the left meanwhile.
      const edges = [left, ...cross.map(([, b]) => b + 4)].sort((a, b) => a - b);
      let widest = 0;
      for (const c of edges) { const stop = Math.min(right, ...cross.map(([a]) => a).filter((a) => a > c)); widest = Math.max(widest, stop - c); }
      retitle.push({ id: bd.e.id, room: Math.floor(widest - 4) });
      tx = left;
    }
    blocked.push({ x: tx - 6, y: top, w: t.w + 12, h: t.padTop - 4 });
    parts.boundaries.push(`<g class="boundary ${bd.cls}" data-el="${esc(bd.e.id)}"><rect x="${f1(n.x + PADX)}" y="${f1(n.y + TOP)}" width="${f1(n.width)}" height="${f1(n.height)}"/>${titleSvg(t, tx + PADX, n.y + TOP)}</g>`);
  }
  const crossesLine = (r, own) => segRects.some((rs, j) => j !== own && rs.some((b) => overlaps(r, b)));
  const inside = (r) => r.x >= -PADX + 4 && r.y >= -TOP + 50;
  // The drawn content's bounds (D4): nodes and boundaries, then every placed label.
  let cx0 = 0, cy0 = 0, cx1 = laid.width, cy1 = laid.height;
  laid.edges.forEach((e, ei) => {
    const s = e.sections?.[0];
    if (!s) return;
    const pts = [s.startPoint, ...(s.bendPoints || []), s.endPoint].map((p) => `${f1(p.x + PADX)} ${f1(p.y + TOP)}`);
    if (e._hurts) pts.reverse(); // laid out from the target to the pain, drawn from the pain
    const kind = e._rel ? e._rel.kind : e._fedge ? e._fedge.kind : e._brel ? 'before' : 'hurts';
    edgeKinds.add(kind);
    const attrs = e._rel ? `data-rel="${esc(e._rel.ids.join(' '))}" data-edge="${esc(e._rel.from)}--${esc(e._rel.to)}"`
      : e._fedge ? `data-edge="${esc(e._fedge.from)}--${esc(e._fedge.to)}"`
      : e._brel ? `data-rel="${esc(e._brel.id)}" data-edge="${esc(e._brel.from)}--${esc(e._brel.to)}"`
      : `data-rel="${esc(e._hurts.pain.id)}" data-edge="${esc(e._hurts.pain.id)}--${esc(e._hurts.target)}"`;
    // Labels are placed here, not by the layout, so they never add a layer of height. In order: on the
    // line (longest segment first; the first segment first for a branch or shared label), then to either
    // side of it, avoiding boxes, other labels, and other lines; failing that, beside the line's start with
    // a leader, never over a box.
    const L = e._label;
    let label = '';
    if (L) {
      const raw = [s.startPoint, ...(s.bendPoints || []), s.endPoint];
      const segs = [];
      for (let k = 0; k < raw.length - 1; k++) segs.push({ a: raw[k], b: raw[k + 1], len: Math.hypot(raw[k + 1].x - raw[k].x, raw[k + 1].y - raw[k].y), k });
      if (L.first) segs.sort((p, q) => p.k - q.k); else if (L.last) segs.sort((p, q) => q.k - p.k); else segs.sort((p, q) => q.len - p.len);
      // Positions along each segment, then beside it at growing distances (item 4: try harder before a leader).
      const on = [], side = [];
      for (const g of segs) for (const t of [0.5, 0.35, 0.65, 0.2, 0.8, 0.1, 0.9]) {
        const mx = g.a.x + (g.b.x - g.a.x) * t, my = g.a.y + (g.b.y - g.a.y) * t;
        on.push({ x: mx - L.width / 2, y: my - L.height / 2, w: L.width, h: L.height });
        for (const d of [8, 22, 40]) {
          if (Math.abs(g.a.x - g.b.x) < 1) { side.push({ x: mx + d, y: my - L.height / 2, w: L.width, h: L.height }); side.push({ x: mx - d - L.width, y: my - L.height / 2, w: L.width, h: L.height }); }
          else { side.push({ x: mx - L.width / 2, y: my - d - L.height, w: L.width, h: L.height }); side.push({ x: mx - L.width / 2, y: my + d, w: L.width, h: L.height }); }
        }
      }
      let pick = [...on, ...side].find((r) => inside(r) && !hit(r) && !crossesLine(r, ei));
      let leader = '';
      if (!pick) {
        const p0 = raw[0], p1 = raw[1];
        const dx = Math.sign(p1.x - p0.x), dy = Math.sign(p1.y - p0.y);
        const ax = p0.x + dx * 20, ay = p0.y + dy * 20;
        const around = [];
        for (const d of [24, 48, 80, 120, 170]) for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
          const cx = ax + ox * d, cy = ay + oy * d;
          around.push({ x: cx - (ox < 0 ? L.width : ox > 0 ? 0 : L.width / 2), y: cy - (oy < 0 ? L.height : oy > 0 ? 0 : L.height / 2), w: L.width, h: L.height });
        }
        // Last resort: the spot that crosses the fewest other lines, never over a box.
        const crossings = (r) => segRects.reduce((a, rs, j) => a + (j !== ei && rs.some((b) => overlaps(r, b)) ? 1 : 0), 0);
        pick = around.find((r) => inside(r) && !hit(r) && !crossesLine(r, ei))
          || [...on, ...side, ...around].filter((r) => inside(r) && !hit(r)).sort((a, b) => crossings(a) - crossings(b))[0];
        // A leader only for a spot beside the line's start; a spot on or beside the line needs none.
        if (pick && around.includes(pick)) {
          const bx = Math.max(pick.x, Math.min(ax, pick.x + pick.w)), by = Math.max(pick.y, Math.min(ay, pick.y + pick.h));
          leader = `<path class="leader" d="M${f1(bx + PADX)} ${f1(by + TOP)} L${f1(ax + PADX)} ${f1(ay + TOP)}"/>`;
        } else if (!pick) pick = on[0];
      }
      blocked.push(pick);
      cx0 = Math.min(cx0, pick.x); cy0 = Math.min(cy0, pick.y); cx1 = Math.max(cx1, pick.x + pick.w); cy1 = Math.max(cy1, pick.y + pick.h);
      const lx = pick.x + PADX, ly = pick.y + TOP;
      label = leader + `<rect class="lblbg" x="${f1(lx)}" y="${f1(ly)}" width="${f1(L.width)}" height="${f1(L.height)}"/>` + L._lines.map((l, i) => `<text x="${f1(lx + L.width / 2)}" y="${f1(ly + 3 + (i + 0.78) * LINE(FONT.edge_label))}" text-anchor="middle">${esc(l)}</text>`).join('');
    }
    const tip = e._rel ? `<title>${esc(e._rel.verbs.join('; '))}</title>`
      : e._fedge ? `<title>${esc(e._fedge.condition ? `${e._fedge.label} (${e._fedge.condition})` : e._fedge.label)}</title>`
      : e._brel ? `<title>${esc(e._brel.verb)}</title>` : `<title>hurts</title>`;
    parts.edges.push(`<g class="edge k-${kind}" ${attrs}>${tip}<path class="line" d="M${pts.join(' L')}" marker-end="url(#se-arrow-${kind})"/>${label}</g>`);
  });
  const PAD = 10;
  const content = { x: +f1(cx0 + PADX - PAD), y: +f1(cy0 + TOP - PAD), w: Math.ceil(cx1 - cx0 + PAD * 2), h: Math.ceil(cy1 - cy0 + PAD * 2) };

  // Legend (views.md rule 2): generated from what is present. It is drawn in the SVG for standalone use and
  // the map; scenes show the same entries as one row in the page (layout.json `legend`), so the legend never
  // sets the diagram's extent (D4).
  const present = LG_ORDER.filter((t) => legendTypes.has(t));
  const isFlow = view.level === 'flow';
  const legend = [];
  for (const t of present) legend.push({ key: t, label: t, draw: `<g class="${isFlow ? `n-${t}` : `t-${t}`}">${shape(t, 44, 26)}</g>` });
  if (spec.mode !== 'structure') legend.push({ key: 'focus', label: 'focus', draw: `<g class="focus-swatch"><rect class="shape" x="0" y="0" width="44" height="26"/></g>` });
  if (mixed) for (const L of ['L1', 'L2', 'L3'].filter((x) => nodeLevels.has(x))) legend.push({ key: `lv-${L}`, label: LEVEL_NAME[L], draw: `<g class="lvkey lv-${L}"><rect class="shape" x="0" y="0" width="44" height="26"/></g>` });
  for (const k of LINE_KINDS.filter((x) => edgeKinds.has(x))) legend.push({ key: `k-${k}`, label: LINE_LABEL[k] || k, kind: k, draw: `<g class="edge k-${k}"><path class="line" d="M0 13 L44 13"/></g>` });

  const contentW = Math.max(laid.width + PADX * 2, cx1 + PADX);
  const contentH = Math.max(laid.height + TOP, cy1 + TOP + 8);
  const lg = [];
  let lx = PADX, ly = contentH + 34;
  lg.push(`<text class="lgtitle" x="${lx}" y="${ly}">Legend</text>`);
  lx += 84;
  const wrapAt = Math.max(contentW, 640);
  let lgRight = 0;
  for (const it of legend) {
    const tw = textWidth(it.label, 16);
    if (lx + 52 + tw > wrapAt) { lx = PADX + 84; ly += 40; }
    if (it.kind) lg.push(`<g class="edge k-${it.kind}"><path class="line" d="M${lx} ${ly - 6} L${lx + 44} ${ly - 6}" marker-end="url(#se-arrow-${it.kind})"/></g>`);
    else lg.push(`<g transform="translate(${lx},${ly - 19})">${it.draw}</g>`);
    lg.push(`<text x="${f1(lx + 52)}" y="${ly}">${esc(it.label)}</text>`);
    lgRight = Math.max(lgRight, lx + 52 + tw);
    lx += 52 + tw + 28;
  }
  const badgeW = Math.ceil(textWidth(BADGE[view.level], 16, 600) * 1.08 + 24);
  const W = Math.ceil(Math.max(contentW, 640, lgRight + PADX, PADX * 2 + badgeW + 14 + textWidth(spec.title, 22, 600)));
  const H = Math.ceil(ly + 16);
  const defs = `<defs>${LINE_KINDS.map((k) => `<marker id="se-arrow-${k}" class="m-${k}" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="10" markerHeight="10" orient="auto-start-reverse"><path d="M0 0 L12 6 L0 12 ${k === 'data' ? 'L4 6 ' : ''}Z"/></marker>`).join('')}</defs>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" class="diagram" data-view="${esc(view.id)}" data-level="${view.level}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="se-title-${esc(view.id)}">`
    + `<title id="se-title-${esc(view.id)}">${esc(spec.title)}</title>${styleBlock(tokens)}${defs}`
    + `<rect class="bg" x="0" y="0" width="${W}" height="${H}"/>`
    + `<g class="badge"><rect x="${PADX}" y="14" width="${badgeW}" height="30" rx="4"/><text x="${PADX + 12}" y="35">${BADGE[view.level]}</text></g>`
    + `<text class="title" x="${PADX + badgeW + 14}" y="36">${esc(spec.title)}</text>`
    + `<g class="edges">${parts.edges.join('')}</g><g class="boundaries">${parts.boundaries.join('')}</g><g class="nodes">${parts.nodes.join('')}</g>`
    + `<g class="legend">${lg.join('')}</g></svg>\n`;
  return { svg, retitle, layout: { w: W, h: H, content, legend: legend.map(({ key, label, draw }) => ({ key, label, draw })), nodes: positions } };
}

// ---------- title art (iteration 003, D4) ----------
// The title scene's default visual: a view's laid-out geometry drawn as a large schematic, shapes and lines
// only (no text, so no label floor applies), each shape carrying its model ID so the picture traces to the
// model. The page assembles it on entry: boundaries, then parts in model order, then lines (`assemble`).
const TITLE_ART_ASPECT = 1265 / 922; // the title figure at 1920x1080 (base.css)
// The art's graph: every default element of the view's level, no labels. The boundary's parts are laid out on
// their own, in their own direction, so the whole can be shaped to the title's figure; a line between a part and
// an outside element ends at the boundary.
function buildArtGraph(M, view, outerDir, innerDir) {
  const els = defaultViewElements(M, view.level, view.scope);
  const box = (id) => { const e = M.els.get(id); const b = elementBox(e, false, `title art, element "${id}"`); return { id, width: b.w, height: b.h, _box: b, _el: e }; };
  const rels = viewRelationships(M, els, view.level, view.scope);
  if (view.level === 'L1') {
    return { id: 'root', layoutOptions: { ...profile.structure, 'elk.direction': outerDir }, children: els.map(box),
      edges: rels.map((r, i) => ({ id: `e${i}`, sources: [r.from], targets: [r.to], _rel: r })) };
  }
  const innerIds = new Set(els.filter((id) => M.els.get(id).parent === view.scope));
  const bid = `boundary:${view.scope}`;
  const end = (id) => (innerIds.has(id) ? bid : id);
  const innerEdges = [], outerEdges = [], seen = new Set();
  rels.forEach((r, i) => {
    if (innerIds.has(r.from) && innerIds.has(r.to)) innerEdges.push({ id: `e${i}`, sources: [r.from], targets: [r.to], _rel: r });
    else {
      const a = end(r.from), b = end(r.to), k = `${a}>${b}`;
      if (a === b || seen.has(k)) return;
      seen.add(k);
      outerEdges.push({ id: `e${i}`, sources: [a], targets: [b], _rel: r });
    }
  });
  const boundary = { id: bid, _boundary: M.els.get(view.scope), children: [...innerIds].map(box), edges: innerEdges,
    layoutOptions: { ...profile.structure, 'elk.direction': innerDir, 'elk.padding': '[top=36,left=36,bottom=36,right=36]' } };
  return { id: 'root', layoutOptions: { ...profile.structure, 'elk.direction': outerDir, 'elk.hierarchyHandling': 'SEPARATE_CHILDREN' },
    children: [...els.filter((id) => !innerIds.has(id)).map(box), boundary], edges: outerEdges };
}
function emitArt(view, laid, tokens) {
  const PAD = 28, GRID = 36;
  const bounds = [], nodes = [], lines = [];
  let order = 0;
  const edgesOf = (list, ox, oy) => {
    for (const e of list || []) {
      const s = e.sections?.[0];
      if (!s || !e._rel) continue;
      const pts = [s.startPoint, ...(s.bendPoints || []), s.endPoint].map((p) => `${f1(p.x + ox)} ${f1(p.y + oy)}`);
      lines.push(`<g class="art-edge k-${e._rel.kind}" data-rel="${esc(e._rel.ids.join(' '))}"><path d="M${pts.join(' L')}" marker-end="url(#se-art-arrow)"/></g>`);
    }
  };
  const visit = (n, ox, oy) => {
    const x = n.x + ox, y = n.y + oy;
    if (n._boundary) bounds.push(`<g class="art-boundary" data-el="${esc(n._boundary.id)}"><rect x="${f1(x)}" y="${f1(y)}" width="${f1(n.width)}" height="${f1(n.height)}"/></g>`);
    if (n._el) nodes.push(`<g class="art-node t-${n._box.kind}" data-el="${esc(n._el.id)}" data-order="${order++}" transform="translate(${f1(x)},${f1(y)})">${shape(n._box.kind, n._box.w, n._box.h)}</g>`);
    if (n._boundary) edgesOf(n.edges, x, y);
    for (const c of n.children || []) visit(c, x, y);
  };
  for (const c of laid.children) visit(c, 0, 0);
  edgesOf(laid.edges, 0, 0);
  const x0 = -PAD, y0 = -PAD, w = Math.ceil(laid.width + PAD * 2), h = Math.ceil(laid.height + PAD * 2);
  const dots = [];
  for (let gx = Math.ceil(x0 / GRID) * GRID; gx <= x0 + w; gx += GRID) for (let gy = Math.ceil(y0 / GRID) * GRID; gy <= y0 + h; gy += GRID) dots.push(`<circle cx="${gx}" cy="${gy}" r="2"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" class="title-art" data-from="${esc(view.id)}" viewBox="${x0} ${y0} ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="The solution's structure, drawn from its model">`
    + `${artStyle(tokens)}<defs><marker id="se-art-arrow" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M0 0 L12 6 L0 12 Z"/></marker></defs>`
    + `<g class="grid" aria-hidden="true">${dots.join('')}</g><g class="art-boundaries">${bounds.join('')}</g><g class="art-edges">${lines.join('')}</g><g class="art-nodes">${nodes.join('')}</g></svg>\n`;
}

// ---------- layout candidates (D4) ----------
// The rendered label size of a content box in a figure area, at each viewport, and the worst of them as a
// fraction of that viewport's floor (1 or more meets it). Upscaling is capped (UPSCALE_CAP).
function fitScore(content, figures) {
  let worst = Infinity;
  const px = {};
  for (const { vp, box } of figures) {
    const p = 16 * Math.min(UPSCALE_CAP, box.w / content.w, box.h / content.h);
    px[vp] = Math.min(px[vp] ?? Infinity, p);
    worst = Math.min(worst, p / LABEL_FLOOR[vp]);
  }
  return { score: worst, px };
}
// The figure areas a view is shown in: every scene that uses it, at both viewports.
function figuresFor(viewId, S, SS) {
  const o = [];
  for (const s of S.scenes) {
    if (s.view !== viewId) continue;
    const layout = SS?.scenes?.[s.id]?.layout || 'diagram-with-text';
    for (const vp of Object.keys(FIGURE)) if (FIGURE[vp][layout]) o.push({ vp, box: FIGURE[vp][layout], scene: s.id, layout });
  }
  return o;
}

export async function renderAll(outDir, { strict = true } = {}) {
  const S = readJson(P.scenes);
  let SS = null;
  try { SS = readYaml(P.sceneSpecs); } catch { /* no scene specs yet */ }
  const M = loadModel();
  const { flows } = loadFlows();
  const specs = loadViewSpecs();
  const tokens = loadTokens();
  for (const t of REQUIRED_TOKENS) if (!tokens[t]) throw new UserError(`tokens.css is missing ${t}; run check-design.`);
  const elk = new ELK();
  const layouts = {};
  const report = [];
  const order = { before: -1, L1: 0, L2: 1, L3: 2, flow: 3 };
  const B = S.views.some((v) => v.level === 'before') ? loadBefore() : null;
  const views = [...S.views].sort((a, b) => order[a.level] - order[b.level] || a.id.localeCompare(b.id));
  fs.mkdirSync(outDir, { recursive: true });
  tooLong = [];
  for (const v of views) {
    const spec = specs.get(v.id);
    if (!spec) throw new UserError(`views/${v.id}.yaml is missing; run check-design.`);
    const figures = figuresFor(v.id, S, SS);
    // Candidates, in a fixed order; the first best one wins, so the output stays deterministic.
    let candidates;
    if (v.level === 'before') {
      if (!B) throw new UserError(`view ${v.id}: before-model.yaml is missing (stage 01)`);
      candidates = profile.structure_direction_candidates.map((d) => ({ name: d === 'DOWN' ? 'top-to-bottom' : 'left-to-right', graph: () => buildBeforeGraph(B, v, spec, d) }));
    } else if (v.level === 'flow') {
      const f = flows.get(v.scope);
      if (!f) throw new UserError(`view ${v.id}: flow ${v.scope} not found`);
      candidates = profile.flow_aspect_candidates.map((a) => ({ name: `aspect ${a}`, graph: (rooms) => buildFlowGraph(M, v, spec, f, a, rooms) }));
    } else {
      const prior = v.level === 'L3' && spec.inherit_from ? layouts[spec.inherit_from] : null;
      const dirs = spec.mode === 'structure' ? ['DOWN'] : profile.structure_direction_candidates;
      candidates = dirs.map((d) => ({ name: d === 'DOWN' ? 'top-to-bottom' : 'left-to-right', graph: (rooms) => buildStructureGraph(M, v, spec, prior, d, rooms) }));
    }
    let best = null;
    for (const c of candidates) {
      const before = tooLong.length;
      // A boundary title that found no gap between crossing lines is wrapped to the widest gap and the view
      // laid out again (AC-28); at most twice, so the output stays deterministic and bounded.
      const rooms = new Map();
      const fitOf = (x) => (figures.length ? fitScore(x.layout.content, figures) : { score: 1, px: {} });
      let r = null, rFit = null;
      for (let attempt = 0; ; attempt++) {
        const laid = await elk.layout(c.graph(rooms));
        const a = { ...emit(v, spec, laid, tokens, M), laid }, aFit = fitOf(a);
        // The label floor comes first: a narrower title that costs the view its floor is not taken.
        if (!r || aFit.score >= 1 - 1e-9) { r = a; rFit = aFit; } else break;
        const fixable = a.retitle.filter((x) => x.room >= 80 && x.room < (rooms.get(x.id) ?? Infinity));
        if (!fixable.length || attempt === 2) break;
        for (const x of fixable) rooms.set(x.id, x.room);
        tooLong.length = before;
      }
      if (best) tooLong.length = before; // text problems are the same in every candidate; report them once
      const fit = figures.length ? rFit : { score: 0, px: {} };
      if (!best || fit.score > best.fit.score + 1e-9) best = { ...r, fit, name: c.name };
      if (!figures.length) break; // a map-only view keeps the first candidate
    }
    best.layout.chosen = best.name;
    writeText(path.join(outDir, `${v.id}.svg`), best.svg);
    layouts[v.id] = best.layout;
    if (figures.length) {
      // What sets the extent: the elements at the two ends of the binding dimension (A11).
      const byHeight = figures.some((f) => f.box.h / best.layout.content.h < f.box.w / best.layout.content.w);
      const ns = Object.entries(best.layout.nodes).filter(([id]) => !M.els.get(id) || M.els.get(id).type !== 'system');
      const lo = ns.reduce((a, b) => ((byHeight ? b[1].y < a[1].y : b[1].x < a[1].x) ? b : a), ns[0]);
      const hi = ns.reduce((a, b) => ((byHeight ? b[1].y + b[1].h > a[1].y + a[1].h : b[1].x + b[1].w > a[1].x + a[1].w) ? b : a), ns[0]);
      report.push({ view: v.id, chosen: best.name, fit: best.fit, figures, content: best.layout.content, bound: byHeight ? 'height' : 'width', ends: [lo?.[0], hi?.[0]] });
    }
  }
  // The title scene's art, unless stage 04 chose an approved image (title_visual in scene-specs.yaml).
  const title = S.scenes.find((s) => s.section === 'title');
  const tv = title ? SS?.scenes?.[title.id]?.title_visual : null;
  if (title && (!tv || tv.kind === 'art')) {
    const from = tv?.from_view || S.views.find((v) => v.level === 'L2' && v.mode !== 'structure')?.id;
    const fv = S.views.find((v) => v.id === from);
    if (!fv || !['L1', 'L2'].includes(fv.level)) throw new UserError(`title art: "${from}" is not an L1 or L2 view; set title_visual.from_view in scene-specs.yaml (stage 04)`);
    // The whole solution, not the view's narrowing: every default element of its level, with no labels. Of the
    // layout directions, the one whose shape best fills the title's landscape figure wins (ties: the first).
    const want = Math.log(TITLE_ART_ASPECT), textProblems = tooLong.length;
    let art = null;
    for (const [outer, inner] of [['RIGHT', 'DOWN'], ['DOWN', 'RIGHT'], ['DOWN', 'DOWN'], ['RIGHT', 'RIGHT']]) {
      const laid = await elk.layout(buildArtGraph(M, fv, outer, inner));
      const off = Math.abs(Math.log(laid.width / laid.height) - want);
      if (!art || off < art.off - 1e-9) art = { laid, off };
    }
    tooLong.length = textProblems; // the art draws no text, so its boxes' text limits do not apply
    writeText(path.join(outDir, 'title-art.svg'), emitArt(fv, art.laid, tokens));
  }
  writeText(path.join(outDir, 'layout.json'), JSON.stringify(layouts, null, 1) + '\n');
  const problems = [...new Set(tooLong)].map((t) => `${t}: shorten it at that stage (text is never cut, R8)`);
  for (const r of report) if (r.fit.score < 1 - 1e-9) {
    const worst = Object.entries(r.fit.px).map(([vp, px]) => `${px.toFixed(1)}px at ${vp} (min ${LABEL_FLOOR[vp].toFixed(1)})`).join(', ');
    const scenes = [...new Set(r.figures.map((f) => `${f.scene} (${f.layout})`))].join(', ');
    problems.push(`view ${r.view} in ${scenes}: labels would render at ${worst}; best layout ${r.chosen}, content ${r.content.w}x${r.content.h}, limited by its ${r.bound}, which runs from "${r.ends[0]}" to "${r.ends[1]}". Narrow or split the view at stage 04, or give the scene the "diagram" layout`);
  }
  if (problems.length) {
    if (strict) throw new UserError(`render-diagrams: ${problems.length} problem(s):\n  - ${problems.join('\n  - ')}`);
    for (const p of problems) console.log(`WARN ${p}`);
  }
  return { layouts, report };
}

if (process.argv[1]?.endsWith('render-diagrams.mjs')) {
  main(async () => {
    const i = process.argv.indexOf('--out');
    const preview = process.argv.includes('--preview');
    const dir = i > 0 ? path.resolve(ROOT, process.argv[i + 1]) : preview ? out('04', 'preview') : path.join(P.site, 'assets', 'diagrams');
    fs.rmSync(dir, { recursive: true, force: true });
    const { layouts, report } = await renderAll(dir, { strict: !preview });
    console.log(`Rendered ${Object.keys(layouts).length} view(s) into ${rel(dir)}`);
    // Predicted label size per view, at both viewports (build-rules.md: labels >= 16px at 1080p).
    console.log(`  ${'view'.padEnd(28)} ${'layout'.padEnd(14)} ${'1920x1080'.padEnd(10)} ${'1440x900'.padEnd(10)} limited by`);
    for (const r of report) console.log(`  ${r.view.padEnd(28)} ${r.chosen.padEnd(14)} ${Object.keys(FIGURE).map((vp) => `${(r.fit.px[vp] ?? 0).toFixed(1)}px`.padEnd(10)).join(' ')} ${r.bound}: ${r.ends[0]} .. ${r.ends[1]}${r.fit.score < 1 - 1e-9 ? '  BELOW THE FLOOR' : ''}`);
  });
}
