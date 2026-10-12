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
  `state`, `trace` (a dot travels along a relationship or flow edge), `show-text`; and on scene entry
  `cut`, `fade`, `zoom-in`, `zoom-out` (a function's region expands into its L3 view in place, or back).

## Screen-share legibility
- Body text at least 20px at 1920x1080; diagram labels at least 16px as rendered (after the diagram is
  scaled to fit). At 1440x900 both minimums scale with the viewport height (x0.83).
- A tall view will not fit at full size: five layers top to bottom is about the limit beside text.
  `render-diagrams --preview` warns per scene; narrow or split the view, or give the scene the
  `diagram` layout.
- No hairline strokes: every stroke at least 2px.
- Text contrast at least 7:1 against its background; dimmed diagram text at least 3:1.

## Navigation
| Key | Does |
| --- | --- |
| Right arrow, Space | next reveal step, then next scene |
| Left arrow | previous reveal step, then previous scene |
| M | open or close the map |
| Home | first scene |
| 1-9, 0 | jump to scene 1-10 (scenes 11-12 from the map) |
| R | toggle reduced motion |

- The URL hash is the current scene and step (`#S04` or `#S04.2`); opening a hash lands there.
- On-screen controls do the same as the keys, and show the scene number and step.

## Targets
- Viewports: 1920x1080 and 1440x900. No mobile layout.
- Browsers: current Chrome, Edge, and Firefox.
