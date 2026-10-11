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
  `cut`, `fade`, `zoom-in`, `zoom-out` (a container's region expands into its L3 view in place, or back).

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
