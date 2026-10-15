# Build Rules

Technical constraints on the explainer. Stage 04 designs within them, stage 05 builds to them, stage 06
checks them.

## Format and delivery
- A static HTML page set: `index.html` plus `assets/`, in `stages/05_build/output/site/`.
- Opens by double-clicking `index.html` (`file://`), with no server, no build step, and nothing to install.
  That means no ES modules, no `fetch()` or XHR, and only relative paths.
- Zero network requests while presented: nothing remotely hosted, fonts included. Everything is bundled.
- Diagrams ship as prerendered SVG. No layout is computed while the explainer is shown.
- The page runtime is the template's own (`scripts/site/`), copied in by `build-site`. A run adds no other
  runtime library unless `design-spec.md` justifies it.

## Run theme
The template ships one default look and no themes. A run may bring its own: stage 04 writes `theme/` into
its output, `build-site` copies it to `assets/theme/`, and the page loads `theme.css` after `base.css`.

- `theme/` holds `theme.css`, any fonts, and their licence files. Nothing else (no scripts, markup, or
  images). Fonts are bundled with an open licence; `theme.css` has no `@import` and no remote URLs, and every
  `url()` is a relative path to a file inside `theme/`.
- A theme restyles; it does not replace the runtime or its markup. The hooks it may style:

| Hook | What it is |
| --- | --- |
| `:root` tokens | every token in `tokens.css` (colors, type scale, spacing, motion); `:root` values in `theme.css` win |
| `.frame`, `.frame-top`, `.frame-side` | an empty, invisible frame over the page; a theme may draw bars in it |
| `--frame-top`, `--frame-right`, `--frame-left` | space a theme reserves for its frame; the scene area and map keep inside it |
| `.chrome` and its buttons | the control bar at the bottom |
| `.scene header`, `.scene h2`, `.scene .sid` | the scene title row |
| `.scene .text p` | the on-screen text lines |
| `.scene .text p.point` | the scene's message, under the title (P hides it); `--lv` is the scene's level colour |
| `.level-indicator` (and its `.rungs li`, `.lv-tag`, `.lv-scope`) | the level indicator; a theme may restyle it but not hide it |
| `.popover` | the "what it does" popover |
| `.map`, `.map .panel` | the map and its detail panel |

- Space a theme reserves for its frame shrinks the scene area, so keep it small: diagram labels must still
  render at 16px (a 14px reservation was enough to fail the fixture).
- Every check still applies to a themed page: contrast is read from `tokens.css` then the `:root` values in
  `theme.css`, and legibility, motion, and accessibility criteria are unchanged. A theme's `:root` color
  tokens are hex values, like the default's.
- A theme's exceptions to `banned-patterns.md` (for example a gradient the look needs) are listed in
  `design-spec.md`; stage 06's review accepts only those.

## Motion
- Built-in CSS and SVG transitions and the Web Animations API only.
- Animations are presenter-triggered (a key or a click), never autoplay loops.
- Slow and large enough to survive screen-share compression: 400-1200 ms per action, moving or changing
  shapes at least 40px across.
- Every animation ends in a static state that makes sense on its own. With reduced motion requested by the
  system (`prefers-reduced-motion`) or toggled by the presenter (R), every step jumps straight to its end
  state.
- Only these actions exist (`scene-spec.schema.json`): `show`, `hide`, `highlight`, `clear-highlight`,
  `state`, `trace` (a dot travels along a relationship or flow edge), `show-text`, `expand` and `collapse`
  (open or close an element's "what it does" popover; targets are element IDs with `what_it_does`); and on
  scene entry `cut`, `fade`, `zoom-in`, `zoom-out` (a function's region expands into its L3 view in place,
  or back). An open popover is part of a step's end state.

## Scene layouts
| Layout | Use |
| --- | --- |
| `diagram-with-text` | the diagram beside a column of on-screen text (the default) |
| `diagram-wide` | the diagram across the full width, with the text in one row below it; for wide views |
| `diagram` | the diagram alone, no text |
| `statement` | text only |
| `orientation` | the orientation scene only: the level ladder, drawn from data |

## Expanding an element
In any wired or flow view, an element with `what_it_does` carries a small expand marker. Clicking it, or
pressing Enter on it, opens a popover beside the element (or below or above it) with its bullets, never over
the marker; its × control, a second click on the marker, or Escape closes it. The popover is HTML over the diagram, so the layout never moves. A flow node opens its bound element's
bullets. A structure view shows the bullets inside the boxes, so it has no markers. The map panel lists
them under "What it does".

## Screen-share legibility
- Body text at least 20px at 1920x1080; diagram labels at least 16px as rendered (after the diagram is
  scaled to fit). At 1440x900 both minimums scale with the viewport height (x0.83).
- A scene shows the diagram's drawn content only, scaled to fill its figure area (up to 1.6x), with the
  legend as a row below it. `render-diagrams` tries each view top-to-bottom and left-to-right (flows: several
  aspect ratios) and keeps the layout with the largest labels at both viewports. If none reaches the floor,
  the build fails (the preview warns) and names the view and what limits it; narrow or split the view, or
  give the scene the `diagram-wide` or `diagram` layout.
- No hairline strokes: every stroke at least 2px.
- Text contrast at least 7:1 against its background, `--c-highlight` included (it colors highlighted labels);
  dimmed diagram text (`--text-dim`) at least 4.5:1, on `--bg` and on `--surface`.

## Color roles
`standards/notation.md` gives each color one role. `check-design` checks the tokens (a run theme's included)
with these limits, in OKLCH:
- Structure tokens (`--c-system`, `--c-internal`, `--c-actor`, `--c-external`, `--c-human`, `--c-edge`) are
  neutral: chroma at most 0.04.
- Role colors (`--c-highlight`, `--lv-1`, `--lv-2`, `--lv-3`, `--lv-flow`) read as colors: chroma at least
  0.06, and every two at least 30 degrees apart in hue.

## Navigation
| Key | Does |
| --- | --- |
| Right arrow, Space | next reveal step, then next scene |
| Left arrow | previous reveal step, then previous scene |
| M | open or close the map |
| Enter (on a focused element) | open or close its "what it does" popover |
| Escape | close open popovers, then the map |
| Home | first scene |
| 1-9, 0 | jump to scene 1-10 (scenes 11-12 from the map) |
| R | toggle reduced motion |
| P | show or hide the scene's message |

- The URL hash is the current scene and step (`#S04` or `#S04.2`); opening a hash lands there.
- On-screen controls do the same as the keys, in one row that never wraps: prev and next (the only filled
  controls), the position ("3 / 13 · step 2 of 4"), the level indicator, then Message, Map, and a small
  reduced-motion toggle as quiet buttons. The scope label shortens first, with its full text in a tooltip.
- A thin strip above the bar shows one segment per scene in its level's colour, the current one marked.
- The first scene shows a one-line hint (how to advance, the map, expanding a box) until the first advance.

## Scene text
- A scene's title and its message each fit in two lines (`text-wrap: balance`). The page steps the size
  down in the browser (to 0.86 and 0.78 of `--size-title` or `--size-point`) until they do, so a run theme's
  fonts and column count. With the default look, `build-site` also predicts it and fails naming the scene
  when even the smallest size needs three lines at 1440x900; with a run theme, AC-26 and the mockups check it.
- Step 0 of every scene shows at least one element of its diagram (`check-design`).

## Targets
- Viewports: 1920x1080 and 1440x900. No mobile layout.
- Browsers: current Chrome, Edge, and Firefox.
