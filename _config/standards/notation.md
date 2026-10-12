# Standard: Notation

One fixed visual mapping per element type and per flow node type, shared by every run. Shape, outline,
and icon slot are defined here and only here. `scripts/render-diagrams.mjs` implements this table; a run
never restyles a type.

A run never edits this file. Changes are made in the template.

## Color

Color is semantic and limited: it encodes type or highlight state, never decoration. This file names the
color tokens and what they mean; stage 04 sets their values in `tokens.css`, within
`_config/visual-direction.md`. No meaning is carried by color alone: every type also differs by shape or
outline, so it survives screen-share compression and color-vision differences.

| Token | Meaning |
| --- | --- |
| `--c-system` | the system boundary and system element |
| `--c-internal` | functions, components, and stores (inside the system) |
| `--c-actor` | actors |
| `--c-external` | externals |
| `--c-human` | human relationships and gates |
| `--c-highlight` | the highlighted subset in the current state |
| `--c-dim` | everything not highlighted, when a highlight is active |
| `--c-edge` | relationship and flow-edge lines and labels |

## Element types

| Type | Shape | Outline | Icon slot |
| --- | --- | --- | --- |
| `actor` | stadium (fully rounded ends) | solid 2px, `--c-actor` | person |
| `system` | rectangle, square corners | double, 2px + 2px, `--c-system` | none |
| `external` | rectangle, square corners | dashed 2px, `--c-external` | arrow out of box |
| `function` | rectangle, square corners | solid 3px, `--c-internal` | none |
| `component` | rectangle, 6px corner radius | solid 2px, `--c-internal` | none |
| `store` | cylinder | solid 2px, `--c-internal` | none |

Inside every element, top to bottom: `name (exact_name)` (bold; just `name` when there is no `exact_name`),
`[type]` label (small caps), `responsibility`.
`why_separate` is not drawn in diagrams; it appears on segmentation scenes as on-screen text and in map
panels.

A function drawn as the scope of an L3 view is a labeled boundary (solid 3px, no fill) around its children.

## Level indicator

A four-rung ladder, defined here once and drawn the same way in every scene and every theme: **Context,
Functions, Components, Code** (L1 to L4), top to bottom or left to right.

- The current rung is filled; the other three are outlined. The scope name sits beside the ladder
  ("Components · Agent setup").
- On a flow scene the ladder carries a "Flow" tag and fills the rungs the flow's steps come from.
- It appears in the page chrome of every scene, and as a compact badge in the title row of every rendered
  diagram (`L2 · FUNCTIONS`), so a standalone diagram carries it too.
- A theme may restyle the indicator but may not remove it. Its colors come from the tokens above; filled
  versus outlined is the signal, not color.

## Structure mode

A view spec may set `mode: structure` (default `wired`). A structure view shows what the parts are, not how
they connect: no relationship lines, each element's `what_it_does` bullets inside its box, and the parts
laid out as a grid inside the system or function boundary. A wired view is the default drawing described
above.

## Relationship lines

| Kind | Line | Arrowhead |
| --- | --- | --- |
| `control` | solid 2px, `--c-edge` | filled |
| `data` | dashed 2px, `--c-edge` | open |
| `human` | dotted 2px, `--c-human` | filled |

Every line carries its verb as a label.

## Flow node types

| Type | Shape | Outline |
| --- | --- | --- |
| `trigger` | stadium, thick left bar | solid 2px, `--c-edge` |
| `step` | rectangle, 6px radius | solid 2px, color of its `on:` element's type |
| `gate` | hexagon | solid 3px, `--c-human` |
| `decision` | diamond | solid 2px, `--c-internal` |
| `store` | cylinder | solid 2px, `--c-internal` |
| `external` | rectangle | dashed 2px, `--c-external` |
| `output` | rectangle with a doubled bottom edge | solid 2px, `--c-system` |

Every flow node shows its step number in a circle at its top-left corner. Flow edges: `control` solid,
`data` dashed, both 2px, each with its verb label; a `decision` edge also shows its condition.

## Highlight states

- **Highlighted:** outline switches to `--c-highlight` at 3px; label weight unchanged.
- **Dimmed:** the element keeps its shape and outline style and drops to 35% opacity. Text stays legible
  against the background at 3:1 or better.
- **Revealed / hidden:** a hidden element is not drawn yet; reveal adds it in its final position. Layout
  never moves when something is revealed.
