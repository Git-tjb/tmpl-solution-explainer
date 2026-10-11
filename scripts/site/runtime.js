/* Solution explainer page runtime. Plain script (no modules, no fetch) so it runs from file://.
   Data comes from window.EXPLAINER, written by scripts/build-site.mjs. Motion vocabulary: build-rules.md. */
(function () {
  'use strict';
  var D = window.EXPLAINER;
  var root = document.documentElement;
  var scenes = Array.prototype.slice.call(document.querySelectorAll('.scene'));
  var mapEl = document.getElementById('map');
  var where = document.querySelector('.chrome .where');
  var titleEl = document.querySelector('.chrome .title');
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

  // ---------- state ----------
  function highlight(sceneEl, ids, ms) {
    var svg = sceneEl.querySelector('svg.diagram');
    if (!svg) return;
    svg.classList.add('has-hl');
    ids.forEach(function (t) { each(find(sceneEl, t), function (el) { el.classList.add('hl'); animate(el, [{ opacity: 0.35 }, { opacity: 1 }], ms); }); });
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
  }
  function trace(edge, ms) {
    edge.classList.add('traced');
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
    var svg = sceneEl.querySelector('svg.diagram');
    if (svg) svg.classList.remove('has-hl');
    s.steps.forEach(function (st) { st.actions.forEach(function (a) {
      if (a.do === 'show' || a.do === 'show-text') (a.targets || []).forEach(function (t) { each(find(sceneEl, t), function (el) { el.classList.add('is-hidden'); }); });
    }); });
    var h = s.highlight || {};
    var ids = [].concat(h.elements || [], h.relationships || [], (h.steps || []).map(function (n) { return 'step-' + n; }));
    if (ids.length) highlight(sceneEl, ids, 0);
  }
  function enter(sceneEl, si) {
    var e = spec(si).enter || { kind: 'cut' };
    var fig = sceneEl.querySelector('.figure') || sceneEl;
    if (e.kind === 'fade') animate(sceneEl, [{ opacity: 0 }, { opacity: 1 }], 600);
    else if ((e.kind === 'zoom-in' || e.kind === 'zoom-out') && D.layouts[e.from_view]) {
      var L = D.layouts[e.from_view], n = L.nodes[e.target];
      if (!n) return;
      var s = Math.max(0.15, n.w / L.w);
      var origin = ((n.x + n.w / 2) / L.w * 100).toFixed(1) + '% ' + ((n.y + n.h / 2) / L.h * 100).toFixed(1) + '%';
      var from = e.kind === 'zoom-in' ? 'scale(' + s.toFixed(3) + ')' : 'scale(' + (1 / s).toFixed(3) + ')';
      animate(fig, [{ transformOrigin: origin, transform: from, opacity: 0.2 }, { transformOrigin: origin, transform: 'scale(1)', opacity: 1 }], 1000);
    }
  }

  // ---------- navigation ----------
  function go(si, step, how) {
    si = Math.max(0, Math.min(scenes.length - 1, si));
    step = Math.max(0, Math.min(maxStep(si), step));
    running.slice().forEach(function (a) { try { a.finish(); } catch (e) { /* already done */ } });
    var sceneEl = scenes[si];
    if (si !== state.si) {
      if (state.si >= 0) scenes[state.si].classList.remove('current');
      sceneEl.classList.add('current');
      reset(sceneEl, si);
      for (var k = 1; k <= step; k++) runStep(sceneEl, si, k, false);
      if (how === 'forward') enter(sceneEl, si);
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
    where.textContent = id + ' · ' + step + '/' + maxStep(si);
    titleEl.textContent = spec(si).title;
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
  function setReduced(on) { reducedToggle = on; root.classList.toggle('reduced', reduced()); rmBtn.setAttribute('aria-pressed', String(reducedToggle)); }
  document.addEventListener('keydown', function (ev) {
    if (ev.altKey || ev.ctrlKey || ev.metaKey) return;
    var k = ev.key;
    if (k === 'm' || k === 'M') { if (mapEl.classList.contains('open')) closeMap(); else openMap(); ev.preventDefault(); return; }
    if (k === 'Escape') { closeMap(); return; }
    if (k === 'r' || k === 'R') { setReduced(!reducedToggle); return; }
    if (mapEl.classList.contains('open')) return;
    if (k === 'ArrowRight' || k === ' ' || k === 'PageDown') { ev.preventDefault(); next(); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { ev.preventDefault(); prev(); }
    else if (k === 'Home') { ev.preventDefault(); go(0, 0, 'jump'); }
    else if (/^[0-9]$/.test(k)) { var n = k === '0' ? 9 : parseInt(k, 10) - 1; if (n < scenes.length) go(n, 0, 'forward'); }
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
    sceneCount: scenes.length,
  };

  root.classList.toggle('reduced', reduced());
  closeMap();
  if (location.hash) fromHash();
  if (state.si < 0) go(0, 0, 'jump');
})();
