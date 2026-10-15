/* Solution explainer page runtime. Plain script (no modules, no fetch) so it runs from file://.
   Data comes from window.EXPLAINER, written by scripts/build-site.mjs. Motion vocabulary: build-rules.md. */
(function () {
  'use strict';
  var D = window.EXPLAINER;
  var root = document.documentElement;
  var scenes = Array.prototype.slice.call(document.querySelectorAll('.scene'));
  var mapEl = document.getElementById('map');
  var where = document.querySelector('.chrome .where');
  var rmBtn = document.querySelector('.chrome .rm');
  var state = { si: -1, step: 0 };
  var running = [];
  var lastSet = '';
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var reducedToggle = false;

  function reduced() { return mq.matches || reducedToggle; }
  function spec(si) { return D.scenes[si]; }
  function maxStep(si) { var s = spec(si).steps; return s.length ? s[s.length - 1].step : 0; }

  // ---------- targets ----------
  function find(sceneEl, t) {
    var svg = sceneEl.querySelector('svg.diagram');
    if (/^text-\d+$/.test(t)) return sceneEl.querySelectorAll('.text p[data-text="' + t.slice(5) + '"]');
    if (!svg) return [];
    if (/^step-\d+$/.test(t)) return svg.querySelectorAll('[data-step="' + t.slice(5) + '"]');
    if (t.indexOf('--') > 0) return svg.querySelectorAll('[data-edge="' + t + '"]');
    var q = '[data-el="' + t + '"], [data-node="' + t + '"], [data-rel~="' + t + '"]';
    return svg.querySelectorAll(q);
  }
  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  function animate(el, frames, ms) {
    if (reduced() || !ms || !el.animate) return null;
    var a = el.animate(frames, { duration: ms, easing: 'ease-in-out' });
    running.push(a);
    a.finished.then(function () { running.splice(running.indexOf(a), 1); }, function () { running.splice(running.indexOf(a), 1); });
    return a;
  }

  // ---------- expand: "what it does" popovers (HTML over the diagram, so the layout never moves) ----------
  function expandTargets(sceneEl, id) {
    var svg = sceneEl.querySelector('svg.diagram');
    return svg ? svg.querySelectorAll('[data-expand="' + id + '"]') : [];
  }
  function openIds(sceneEl) {
    return Array.prototype.map.call(sceneEl.querySelectorAll('.popover'), function (p) { return p.getAttribute('data-for'); });
  }
  function expand(sceneEl, id, ms) {
    var data = D.els[id], node = expandTargets(sceneEl, id)[0], box = sceneEl.querySelector('.popovers');
    if (!data || !node || !box || sceneEl.querySelector('.popover[data-for="' + id + '"]')) return;
    var p = document.createElement('div');
    p.className = 'popover';
    p.setAttribute('data-for', id);
    p.setAttribute('role', 'note');
    p.setAttribute('aria-label', data.name + ': what it does');
    var x = document.createElement('button');
    x.type = 'button'; x.className = 'popclose'; x.textContent = '\u00d7';
    x.setAttribute('aria-label', 'Close'); x.title = 'Close (Escape)';
    x.addEventListener('click', function (ev) { ev.stopPropagation(); collapse(sceneEl, id); });
    p.appendChild(x);
    var h = document.createElement('h3'); h.textContent = data.name; p.appendChild(h);
    var ul = document.createElement('ul');
    data.items.forEach(function (t) { var li = document.createElement('li'); li.textContent = t; ul.appendChild(li); });
    p.appendChild(ul);
    p.style.visibility = 'hidden';
    box.appendChild(p);
    place(sceneEl, node, p);
    p.style.visibility = '';
    each(expandTargets(sceneEl, id), function (n) { n.setAttribute('aria-expanded', 'true'); n.classList.add('expanded'); });
    animate(p, [{ opacity: 0 }, { opacity: 1 }], ms);
  }
  // Beside the box, then below or above it; never over its expand marker, so the marker can close it again.
  function place(sceneEl, node, p) {
    var sr = sceneEl.getBoundingClientRect(), r = node.getBoundingClientRect(), pw = p.offsetWidth, ph = p.offsetHeight, gap = 14;
    var mk = node.querySelector('.expand-mark'), m = mk ? mk.getBoundingClientRect() : r;
    var bx = { l: r.left - sr.left, t: r.top - sr.top, r: r.right - sr.left, b: r.bottom - sr.top };
    var mm = { l: m.left - sr.left - 6, t: m.top - sr.top - 6, r: m.right - sr.left + 6, b: m.bottom - sr.top + 6 };
    var clampX = function (x) { return Math.max(gap, Math.min(sr.width - pw - gap, x)); };
    var clampY = function (y) { return Math.max(gap, Math.min(sr.height - ph - gap, y)); };
    var tries = [
      [bx.r + gap, clampY(bx.t)], [bx.l - gap - pw, clampY(bx.t)],
      [clampX(bx.l), bx.b + gap], [clampX(bx.l), bx.t - gap - ph],
    ];
    var fits = function (c) { return c[0] >= gap - 0.5 && c[1] >= gap - 0.5 && c[0] + pw <= sr.width - gap + 0.5 && c[1] + ph <= sr.height - gap + 0.5; };
    var clear = function (c) { return c[0] >= mm.r || c[0] + pw <= mm.l || c[1] >= mm.b || c[1] + ph <= mm.t; };
    var pick = tries.filter(fits).filter(clear)[0] || tries.map(function (c) { return [clampX(c[0]), clampY(c[1])]; }).filter(clear)[0] || [clampX(bx.r + gap), clampY(bx.t)];
    p.style.left = pick[0] + 'px';
    p.style.top = pick[1] + 'px';
  }
  function collapse(sceneEl, id) {
    each(sceneEl.querySelectorAll('.popover' + (id ? '[data-for="' + id + '"]' : '')), function (p) { p.remove(); });
    each(sceneEl.querySelectorAll(id ? '[data-expand="' + id + '"]' : '[data-expand].expanded'), function (n) { n.setAttribute('aria-expanded', 'false'); n.classList.remove('expanded'); });
  }
  function toggle(id) {
    var sceneEl = scenes[state.si];
    if (sceneEl.querySelector('.popover[data-for="' + id + '"]')) collapse(sceneEl, id); else expand(sceneEl, id, 300);
  }

  // ---------- level indicator (notation.md): one element in the chrome, updated per scene ----------
  var lvEl = document.querySelector('.chrome .level-indicator');
  var RUNG_NAME = { L1: 'Context', L2: 'Functions', L3: 'Components', L4: 'Code' };
  function indicate(si) {
    if (!lvEl) return;
    var lv = spec(si).lv || { level: '', rungs: [], scope: '', tag: null };
    lvEl.setAttribute('data-level', lv.level);
    each(lvEl.querySelectorAll('[data-rung]'), function (r) {
      var on = lv.rungs.indexOf(r.getAttribute('data-rung')) >= 0;
      r.classList.toggle('on', on);
      if (on) r.setAttribute('aria-current', 'true'); else r.removeAttribute('aria-current');
    });
    lvEl.querySelector('.lv-tag').textContent = lv.tag || '';
    var scopeEl = lvEl.querySelector('.lv-scope');
    scopeEl.textContent = lv.scope ? '· ' + lv.scope : '';
    scopeEl.title = lv.scope || ''; // the full scope when the bar shortens it (R6)
    var names = lv.rungs.map(function (x) { return RUNG_NAME[x]; }).join(', ');
    lvEl.setAttribute('aria-label', 'Level: ' + (lv.tag ? lv.tag + (names ? ' (' + names + ')' : '') : names) + (lv.scope ? ', ' + lv.scope : ''));
  }

  // ---------- state ----------
  function highlight(sceneEl, ids, ms) {
    var svg = sceneEl.querySelector('svg.diagram');
    if (!svg) return;
    svg.classList.add('has-hl');
    ids.forEach(function (t) { each(find(sceneEl, t), function (el) { el.classList.add('hl'); animate(el, [{ opacity: 0.6 }, { opacity: 1 }], ms); }); });
  }
  function apply(sceneEl, si, a, animated) {
    var ms = animated ? (a.duration_ms || 0) : 0;
    var targets = a.targets || [];
    if (a.do === 'show' || a.do === 'show-text') targets.forEach(function (t) { each(find(sceneEl, t), function (el) { el.classList.remove('is-hidden'); animate(el, [{ opacity: 0 }, { opacity: 1 }], ms); }); });
    else if (a.do === 'hide') targets.forEach(function (t) { each(find(sceneEl, t), function (el) { el.classList.add('is-hidden'); animate(el, [{ opacity: 1 }, { opacity: 0 }], ms); }); });
    else if (a.do === 'highlight') highlight(sceneEl, targets, ms);
    else if (a.do === 'clear-highlight') {
      var svg = sceneEl.querySelector('svg.diagram');
      if (svg) { svg.classList.remove('has-hl'); each(svg.querySelectorAll('.hl, .traced'), function (el) { el.classList.remove('hl'); el.classList.remove('traced'); }); }
    } else if (a.do === 'state') {
      var st = (D.states[spec(si).view] || {})[a.state] || {};
      highlight(sceneEl, [].concat(st.elements || [], st.relationships || [], (st.steps || []).map(function (n) { return 'step-' + n; })), ms);
    } else if (a.do === 'trace') targets.forEach(function (t) { each(find(sceneEl, t), function (edge) { trace(edge, ms); }); });
    else if (a.do === 'expand') targets.forEach(function (t) { expand(sceneEl, t, ms); });
    else if (a.do === 'collapse') targets.forEach(function (t) { collapse(sceneEl, t); });
  }
  // A traced edge is part of what the step is about: it stays highlighted at full strength (notation.md).
  function trace(edge, ms) {
    edge.classList.add('traced', 'hl');
    var path = edge.querySelector('path.line');
    if (!path || reduced() || !ms || !path.getTotalLength) return;
    var len = path.getTotalLength(), frames = [];
    for (var i = 0; i <= 24; i++) { var p = path.getPointAtLength(len * i / 24); frames.push({ transform: 'translate(' + p.x + 'px,' + p.y + 'px)' }); }
    var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('r', '9'); dot.setAttribute('class', 'tracer');
    edge.appendChild(dot);
    var a = animate(dot, frames, ms);
    if (a) a.finished.then(function () { dot.remove(); }, function () { dot.remove(); });
    else dot.remove();
  }
  function reset(sceneEl, si) {
    var s = spec(si);
    each(sceneEl.querySelectorAll('.is-hidden, .hl, .traced'), function (el) { el.classList.remove('is-hidden', 'hl', 'traced'); });
    each(sceneEl.querySelectorAll('.tracer'), function (el) { el.remove(); });
    collapse(sceneEl);
    var svg = sceneEl.querySelector('svg.diagram');
    if (svg) svg.classList.remove('has-hl');
    s.steps.forEach(function (st) { st.actions.forEach(function (a) {
      if (a.do === 'show' || a.do === 'show-text') (a.targets || []).forEach(function (t) { each(find(sceneEl, t), function (el) { el.classList.add('is-hidden'); }); });
    }); });
    var h = s.highlight || {};
    var ids = [].concat(h.elements || [], h.relationships || [], (h.steps || []).map(function (n) { return 'step-' + n; }));
    if (ids.length) highlight(sceneEl, ids, 0);
  }
  // The title art assembles (build-rules.md, Motion): the boundary forms, then the parts appear in model order,
  // then the lines, in 1200 ms. Reduced motion shows the finished picture at once.
  function assemble(sceneEl) {
    var art = sceneEl.querySelector('svg.title-art');
    if (!art || reduced() || !art.animate) return;
    var parts = Array.prototype.slice.call(art.querySelectorAll('.art-node'))
      .sort(function (a, b) { return a.getAttribute('data-order') - b.getAttribute('data-order'); });
    var at = function (el, delay, ms) {
      var a = el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms, delay: delay, easing: 'ease-out', fill: 'backwards' });
      running.push(a);
      a.finished.then(function () { running.splice(running.indexOf(a), 1); }, function () { running.splice(running.indexOf(a), 1); });
    };
    each(art.querySelectorAll('.art-boundary'), function (el) { at(el, 0, 400); });
    parts.forEach(function (el, i) { at(el, 300 + Math.round(i * 500 / Math.max(1, parts.length)), 300); });
    each(art.querySelectorAll('.art-edge'), function (el) { at(el, 900, 300); });
  }
  function enter(sceneEl, si) {
    var e = spec(si).enter || { kind: 'cut' };
    var fig = sceneEl.querySelector('.figure') || sceneEl;
    if (e.kind === 'fade') animate(sceneEl, [{ opacity: 0 }, { opacity: 1 }], 600);
    else if (e.kind === 'assemble') assemble(sceneEl);
    else if ((e.kind === 'zoom-in' || e.kind === 'zoom-out') && D.layouts[e.from_view]) {
      // Positions are in the full diagram's coordinates; the scene shows its content box (layout.json).
      var L = D.layouts[e.from_view], n = L.nodes[e.target], c = L.content;
      if (!n) return;
      var s = Math.max(0.15, n.w / c.w);
      var origin = ((n.x + n.w / 2 - c.x) / c.w * 100).toFixed(1) + '% ' + ((n.y + n.h / 2 - c.y) / c.h * 100).toFixed(1) + '%';
      var from = e.kind === 'zoom-in' ? 'scale(' + s.toFixed(3) + ')' : 'scale(' + (1 / s).toFixed(3) + ')';
      animate(fig, [{ transformOrigin: origin, transform: from, opacity: 0.2 }, { transformOrigin: origin, transform: 'scale(1)', opacity: 1 }], 1000);
    }
  }

  // ---------- titles and messages in two lines (R18), measured here so a run theme's fonts and column count ----------
  function linesOf(el) { return Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)); }
  function fitText(sceneEl) {
    each(sceneEl.querySelectorAll('h2, .text p.point'), function (el) {
      if (!el.offsetParent) return;
      el.classList.remove('fit-2', 'fit-3');
      if (linesOf(el) > 2) el.classList.add('fit-2');
      if (linesOf(el) > 2) { el.classList.remove('fit-2'); el.classList.add('fit-3'); }
    });
  }

  // ---------- legend: one row; behind a "Legend" control when it would not fit (D4) ----------
  function fitLegend(sceneEl) {
    var lg = sceneEl.querySelector('.figure div.legend');
    if (!lg) return;
    lg.classList.remove('collapsed', 'open');
    if (lg.scrollWidth > lg.clientWidth + 1) lg.classList.add('collapsed');
  }
  each(document.querySelectorAll('.figure div.legend'), function (lg) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'lgtoggle'; b.textContent = 'Legend';
    b.setAttribute('aria-expanded', 'false');
    b.addEventListener('click', function () { var on = !lg.classList.contains('open'); lg.classList.toggle('open', on); b.setAttribute('aria-expanded', String(on)); });
    lg.insertBefore(b, lg.firstChild);
  });
  window.addEventListener('resize', function () { if (state.si >= 0) { fitLegend(scenes[state.si]); fitText(scenes[state.si]); } });
  // Text widths change when the bundled fonts arrive, so measure again then.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (state.si >= 0) { fitLegend(scenes[state.si]); fitText(scenes[state.si]); } });

  // ---------- position strip and first-screen hint (R21) ----------
  var progress = document.querySelectorAll('.progress li');
  var hint = document.querySelector('.hint');
  var hintDone = false;
  function hideHint() { hintDone = true; if (hint) hint.hidden = true; }

  // ---------- navigation ----------
  function go(si, step, how) {
    si = Math.max(0, Math.min(scenes.length - 1, si));
    step = Math.max(0, Math.min(maxStep(si), step));
    running.slice().forEach(function (a) { try { a.finish(); } catch (e) { /* already done */ } });
    var sceneEl = scenes[si];
    if (si !== state.si) {
      if (state.si >= 0) { collapse(scenes[state.si]); scenes[state.si].classList.remove('current'); }
      sceneEl.classList.add('current');
      indicate(si);
      reset(sceneEl, si);
      for (var k = 1; k <= step; k++) runStep(sceneEl, si, k, false);
      // The title art also assembles when the explainer opens on it, once per arrival; never on a step back.
      if (how === 'forward' || (how === 'jump' && (spec(si).enter || {}).kind === 'assemble')) enter(sceneEl, si);
    } else if (step === state.step + 1 && how === 'forward') {
      runStep(sceneEl, si, step, true);
    } else {
      reset(sceneEl, si);
      for (var j = 1; j <= step; j++) runStep(sceneEl, si, j, false);
    }
    state.si = si; state.step = step;
    var id = spec(si).id;
    root.setAttribute('data-scene', id);
    root.setAttribute('data-step', String(step));
    // Position in the explainer (R21): scene of total, then the step when the scene has steps.
    where.textContent = (si + 1) + ' / ' + scenes.length + (maxStep(si) ? ' · step ' + step + ' of ' + maxStep(si) : '');
    each(progress, function (li, i) { li.classList.toggle('current', i === si); li.classList.toggle('done', i < si); });
    if (si > 0 || step > 0) hideHint(); // anywhere but the very start, by any route
    fitLegend(sceneEl);
    fitText(sceneEl);
    var h = '#' + id + (step ? '.' + step : '');
    lastSet = h;
    if (location.hash !== h) location.hash = h;
  }
  function runStep(sceneEl, si, n, animated) {
    spec(si).steps.forEach(function (st) { if (st.step === n) st.actions.forEach(function (a) { apply(sceneEl, si, a, animated); }); });
  }
  function next() { if (state.step < maxStep(state.si)) go(state.si, state.step + 1, 'forward'); else if (state.si < scenes.length - 1) go(state.si + 1, 0, 'forward'); }
  function prev() { if (state.step > 0) go(state.si, state.step - 1, 'back'); else if (state.si > 0) go(state.si - 1, maxStep(state.si - 1), 'back'); }

  // ---------- map ----------
  function openMap(panelId) {
    mapEl.classList.add('open');
    mapEl.setAttribute('aria-hidden', 'false');
    root.setAttribute('data-map', 'open');
    if (panelId) showPanel(panelId);
  }
  function closeMap() { mapEl.classList.remove('open'); mapEl.setAttribute('aria-hidden', 'true'); root.removeAttribute('data-map'); }
  function showPanel(id) {
    var found = false;
    each(mapEl.querySelectorAll('.panel section'), function (s) { var on = s.getAttribute('data-panel') === id; s.hidden = !on; if (on) found = true; });
    var empty = mapEl.querySelector('.panel .empty');
    if (empty) empty.hidden = found;
    root.setAttribute('data-panel', found ? id : '');
  }
  each(mapEl.querySelectorAll('a[href^="#S"]'), function (a) {
    a.addEventListener('click', function (ev) {
      ev.preventDefault();
      var s = /^#(S\d\d)(?:\.(\d+))?$/.exec(a.getAttribute('href'));
      var si = -1;
      D.scenes.forEach(function (x, i) { if (s && x.id === s[1]) si = i; });
      closeMap();
      if (si >= 0) go(si, s[2] ? parseInt(s[2], 10) : 0, 'jump');
    });
  });
  each(mapEl.querySelectorAll('svg.diagram [data-el].has-link'), function (el) {
    var id = el.getAttribute('data-el');
    el.addEventListener('click', function () { showPanel(id); });
    el.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); showPanel(id); } });
  });

  // ---------- hash ----------
  function fromHash() {
    var h = decodeURIComponent(location.hash.slice(1));
    var m = /^map:([a-z0-9-]+)$/.exec(h);
    if (m) { openMap(m[1]); return; }
    var s = /^(S\d\d)(?:\.(\d+))?$/.exec(h);
    if (!s) return;
    var si = -1;
    D.scenes.forEach(function (x, i) { if (x.id === s[1]) si = i; });
    if (si < 0) return;
    closeMap();
    go(si, s[2] ? parseInt(s[2], 10) : 0, 'jump');
  }
  window.addEventListener('hashchange', function () { if (location.hash === lastSet) return; fromHash(); });

  // ---------- keys and buttons ----------
  // The scene's message: shown by default; P or the Message button hides or shows it.
  var pointBtn = document.querySelector('.chrome .pointtoggle');
  function setPoints(on) { root.classList.toggle('hide-points', !on); if (pointBtn) pointBtn.setAttribute('aria-pressed', String(on)); }
  if (pointBtn) pointBtn.addEventListener('click', function () { setPoints(root.classList.contains('hide-points')); });
  function setReduced(on) { reducedToggle = on; root.classList.toggle('reduced', reduced()); rmBtn.setAttribute('aria-pressed', String(reducedToggle)); }
  document.addEventListener('keydown', function (ev) {
    if (ev.altKey || ev.ctrlKey || ev.metaKey) return;
    var k = ev.key;
    if (k === 'm' || k === 'M') { if (mapEl.classList.contains('open')) closeMap(); else openMap(); ev.preventDefault(); return; }
    if (k === 'Escape') {
      if (!mapEl.classList.contains('open') && state.si >= 0 && scenes[state.si].querySelector('.popover')) { collapse(scenes[state.si]); return; }
      closeMap(); return;
    }
    if (k === 'r' || k === 'R') { setReduced(!reducedToggle); return; }
    if (k === 'p' || k === 'P') { setPoints(root.classList.contains('hide-points')); return; }
    if (mapEl.classList.contains('open')) return;
    if (k === 'ArrowRight' || k === ' ' || k === 'PageDown') { ev.preventDefault(); next(); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { ev.preventDefault(); prev(); }
    else if (k === 'Home') { ev.preventDefault(); go(0, 0, 'jump'); }
    else if (/^[0-9]$/.test(k)) { var n = k === '0' ? 9 : parseInt(k, 10) - 1; if (n < scenes.length) go(n, 0, 'forward'); }
  });
  each(document.querySelectorAll('.scene svg.diagram [data-expand][role="button"]'), function (el) {
    var id = el.getAttribute('data-expand');
    el.addEventListener('click', function (ev) { ev.stopPropagation(); toggle(id); });
    el.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); toggle(id); } });
  });
  document.querySelector('.chrome .next').addEventListener('click', next);
  document.querySelector('.chrome .prev').addEventListener('click', prev);
  document.querySelector('.chrome .maptoggle').addEventListener('click', function () { if (mapEl.classList.contains('open')) closeMap(); else openMap(); });
  rmBtn.addEventListener('click', function () { setReduced(!reducedToggle); });
  if (mq.addEventListener) mq.addEventListener('change', function () { root.classList.toggle('reduced', reduced()); });

  // For automated checks (verify.mjs).
  window.__explainer = {
    state: function () { return { scene: spec(state.si).id, step: state.step }; },
    maxStep: function (i) { return maxStep(i); },
    running: function () { return running.length; },
    popovers: function () { return state.si >= 0 ? openIds(scenes[state.si]) : []; },
    sceneCount: scenes.length,
    hintShown: function () { return !!hint && !hint.hidden; },
    pointsShown: function () { return !root.classList.contains('hide-points'); },
  };

  root.classList.toggle('reduced', reduced());
  closeMap();
  if (location.hash) fromHash();
  if (state.si < 0) go(0, 0, 'jump');
  // The hint shows once, on the first scene, until the first advance.
  if (hint && !hintDone && state.si === 0 && state.step === 0) hint.hidden = false;
})();
