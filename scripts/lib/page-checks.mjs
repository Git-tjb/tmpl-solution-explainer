// Checks of the current scene and step, run in the page (Playwright). Shared by verify.mjs (every scene, every
// step, both viewports, three browsers) and mockups.mjs (every scene's final step). Iteration 002, D7.
// Returns { problems: { 'AC-nn': [message, ...] }, minLabelPx }.
export async function stepChecks(page, { first = false } = {}) {
  return page.evaluate((first) => {
    const P = {};
    const add = (ac, msg) => { (P[ac] ||= []).push(msg); };
    const sc = document.querySelector('.scene.current');
    const sid = sc.id;
    const s = window.__explainer.state();
    const at = `${sid}.${s.step}`;
    const root = getComputedStyle(document.documentElement);
    const toRgb = (c) => { const d = document.createElement('div'); d.style.color = c; document.body.appendChild(d); const v = getComputedStyle(d).color; d.remove(); return v; };
    const nums = (c) => (c.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);
    const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const focus = toRgb(root.getPropertyValue('--c-highlight').trim());
    const bg = nums(toRgb(root.getPropertyValue('--bg').trim()));
    const shown = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
    const svg = sc.querySelector('.art svg.diagram');
    const opacity = (el) => { let o = 1; for (let e = el; e && e !== svg.parentElement; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity); return o; };
    const lines = (el) => Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight));
    let minLabelPx = null;

    if (svg) {
      const live = (el) => !el.closest('.is-hidden');
      // AC-19: what the step highlights or traces is at full strength in the focus colour.
      for (const n of svg.querySelectorAll('.node.hl')) {
        if (!live(n)) continue;
        const sh = n.querySelector('.shape');
        if (getComputedStyle(sh).stroke !== focus) add('AC-19', `${at}: highlighted "${n.dataset.el || n.dataset.node}" outline is ${getComputedStyle(sh).stroke}, not the focus colour`);
        if (opacity(sh) < 0.99) add('AC-19', `${at}: highlighted "${n.dataset.el || n.dataset.node}" is at opacity ${opacity(sh).toFixed(2)}`);
      }
      for (const e of svg.querySelectorAll('.edge.hl, .edge.traced')) {
        if (!live(e)) continue;
        const line = e.querySelector('path.line'), t = e.querySelector('text');
        if (getComputedStyle(line).stroke !== focus || opacity(line) < 0.99) add('AC-19', `${at}: ${e.classList.contains('traced') ? 'traced' : 'highlighted'} line ${e.dataset.edge} is ${getComputedStyle(line).stroke} at opacity ${opacity(line).toFixed(2)}`);
        if (t && (getComputedStyle(t).fill !== focus || opacity(t) < 0.99)) add('AC-19', `${at}: the label of ${e.dataset.edge} is not at full strength in the focus colour`);
      }
      // AC-20: expand markers are never dimmed; dimmed text keeps 4.5:1.
      for (const m of svg.querySelectorAll('.expand-mark')) if (live(m) && opacity(m) < 0.99) add('AC-20', `${at}: the expand marker on "${m.closest('[data-expand]').dataset.expand}" is dimmed (opacity ${opacity(m).toFixed(2)})`);
      if (svg.classList.contains('has-hl')) for (const t of svg.querySelectorAll('.node:not(.hl) text, .edge:not(.hl) text, .boundary:not(.hl) text')) {
        if (!live(t)) continue;
        // Contrast as drawn: the fill blended with the background by whatever opacity is left.
        const o = opacity(t), f = nums(getComputedStyle(t).fill);
        const c = contrast(f.map((v, i) => v * o + bg[i] * (1 - o)), bg);
        if (c < 4.5) add('AC-20', `${at}: dimmed text "${t.textContent.slice(0, 24)}" at ${c.toFixed(2)}:1 (min 4.5:1)`);
      }
      // AC-22: text stays inside its shape (a decision's inside its inscribed rectangle), boundary titles inside
      // their boundary, edge labels inside their backing.
      const inside = (r, b, tol = 1.5) => r.left >= b.left - tol && r.right <= b.right + tol && r.top >= b.top - tol && r.bottom <= b.bottom + tol;
      for (const n of svg.querySelectorAll('.node')) {
        if (!live(n)) continue;
        let box = n.querySelector('.shape').getBoundingClientRect();
        if (n.classList.contains('n-decision')) box = { left: box.left + box.width / 4, right: box.right - box.width / 4, top: box.top + box.height / 4, bottom: box.bottom - box.height / 4 };
        for (const t of n.querySelectorAll(':scope > text')) if (!inside(t.getBoundingClientRect(), box)) add('AC-22', `${at}: "${t.textContent.slice(0, 30)}" runs outside its ${n.classList.contains('n-decision') ? 'diamond' : 'box'}`);
      }
      for (const b of svg.querySelectorAll('.boundary')) {
        const t = b.querySelector('text');
        if (t && !inside(t.getBoundingClientRect(), b.querySelector('rect').getBoundingClientRect())) add('AC-22', `${at}: the boundary title "${t.textContent.slice(0, 30)}" runs outside its boundary`);
      }
      for (const e of svg.querySelectorAll('.edge')) {
        const bgr = e.querySelector('.lblbg');
        if (!bgr || !live(e)) continue;
        for (const t of e.querySelectorAll('text')) if (!inside(t.getBoundingClientRect(), bgr.getBoundingClientRect(), 3)) add('AC-22', `${at}: the label "${t.textContent}" runs outside its backing`);
      }
      // AC-28: no line runs through text other than its own label (sampled every 4 screen px).
      const texts = [...svg.querySelectorAll('.nodes text, .boundaries text, .edges text')].filter(live).map((t) => ({ t, r: t.getBoundingClientRect(), edge: t.closest('.edge') }));
      for (const e of svg.querySelectorAll('.edge')) {
        if (!live(e)) continue;
        const p = e.querySelector('path.line'), m = p.getScreenCTM(), len = p.getTotalLength();
        const k = Math.max(1, m.a);
        const hitText = new Set();
        for (let d = 0; d <= len; d += 4 / k) {
          const q = p.getPointAtLength(d), x = m.a * q.x + m.c * q.y + m.e, y = m.b * q.x + m.d * q.y + m.f;
          for (const o of texts) if (o.edge !== e && x > o.r.left + 1 && x < o.r.right - 1 && y > o.r.top + 1 && y < o.r.bottom - 1) hitText.add(o.t.textContent.slice(0, 30));
        }
        for (const h of hitText) add('AC-28', `${at}: the line ${e.dataset.edge} runs through "${h}"`);
      }
      // AC-6 at every step: diagram label size as rendered.
      const vb = svg.viewBox.baseVal, r = svg.getBoundingClientRect();
      const scale = Math.min(r.width / vb.width, r.height / vb.height);
      for (const t of svg.querySelectorAll('.nodes text, .edges text, .boundaries text')) {
        if (!live(t)) continue;
        const px = parseFloat(getComputedStyle(t).fontSize) * scale;
        minLabelPx = minLabelPx === null ? px : Math.min(minLabelPx, px);
      }
    }
    // AC-21: every control is one line high and inside the viewport.
    for (const b of document.querySelectorAll('.chrome button')) {
      const r = b.getBoundingClientRect(), cs = getComputedStyle(b);
      const inner = r.height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - parseFloat(cs.borderTopWidth) - parseFloat(cs.borderBottomWidth);
      if (inner > parseFloat(cs.lineHeight) * 1.5) add('AC-21', `${at}: the control "${b.textContent.trim()}" wraps`);
      if (r.left < 0 || r.right > innerWidth + 0.5 || r.bottom > innerHeight + 0.5) add('AC-21', `${at}: the control "${b.textContent.trim()}" is outside the viewport`);
    }
    // AC-23: no on-screen text is cut: no ellipsis in the scene's text or diagram, nothing clipped in its box.
    // (The chrome's scope label may shorten, with its full text in a tooltip: R6.)
    for (const el of sc.querySelectorAll('h2, .text p, .popover h3, .popover li, svg.diagram text')) {
      if (!shown(el) || el.closest('.is-hidden')) continue;
      if (/(…|\.\.\.)\s*$/.test(el.textContent)) add('AC-23', `${at}: "${el.textContent.slice(0, 30)}" is cut`);
      if (!(el instanceof SVGElement) && el.scrollWidth > el.clientWidth + 1) add('AC-23', `${at}: "${el.textContent.slice(0, 30)}" is clipped`);
    }
    // AC-24: step 0 shows content.
    if (s.step === 0 && svg && !svg.querySelector('.node:not(.is-hidden)')) add('AC-24', `${at}: the diagram is empty at step 0`);
    // AC-25: one visible scene title; the diagram's own title and the chrome show no second one.
    const titles = [...sc.querySelectorAll('h2')].filter(shown).length;
    if (titles !== 1) add('AC-25', `${at}: ${titles} scene titles visible`);
    if (svg) for (const t of svg.querySelectorAll(':scope > .title, :scope > .badge')) if (getComputedStyle(t).display !== 'none') add('AC-25', `${at}: the diagram shows its own title row`);
    if (document.querySelector('.chrome .title')) add('AC-25', `${at}: the control bar repeats the title`);
    // AC-26: titles and messages in at most two lines.
    const h2 = sc.querySelector('h2'), pt = sc.querySelector('.text p.point');
    if (h2 && lines(h2) > 2) add('AC-26', `${at}: the title takes ${lines(h2)} lines`);
    if (pt && shown(pt) && lines(pt) > 2) add('AC-26', `${at}: the message takes ${lines(pt)} lines`);
    // AC-27: the first screen says how to advance and where the viewer is.
    if (first) {
      if (!window.__explainer.hintShown()) add('AC-27', 'the first scene shows no hint on how to advance');
      const where = document.querySelector('.chrome .where');
      if (!where || !/\d+ \/ \d+/.test(where.textContent) || !shown(where)) add('AC-27', 'the first scene shows no position in the explainer');
      if (!document.querySelector('.progress li.current')) add('AC-27', 'the position strip marks no current scene');
    }
    return { problems: P, minLabelPx };
  }, first);
}
