# Standard: Notation

One fixed visual mapping per element type and per flow node type, shared by every run. Shape, outline,
and icon slot are defined here and only here. `scripts/render-diagrams.mjs` implements this table; a run
never restyles a type.

A run never edits this file. Changes are made in the template.

## Color

Color has roles, and each color one role: a color that means focus in one place never means a level or a
type in another. Types are told apart by shape and line style (the tables below), so they use neutrals. This
file names the tokens and their roles; stage 04 sets their values in `tokens.css` (or a run theme), within
`_config/visual-direction.md`. `check-design` enforces the roles with the limits in `build-rules.md`.

| Role | Token | Used for |
| --- | --- | --- |
| Focus | `--c-highlight` | what the current step highlights or traces, and keyboard focus. Nothing else. |
| Level | `--lv-1`, `--lv-2`, `--lv-3`, `--lv-flow` | Context, Functions, Components, Flow: the scene's message rule, level outlines and the level key in a mixed-level view, and the level shown in the page chrome |
| Structure (neutral) | `--c-system` | the system boundary and system element |
| | `--c-internal` | functions, components, and stores |
| | `--c-actor` | actors |
| | `--c-external` | externals |
| | `--c-human` | human relationships and gates |
| | `--c-edge` | relationship and flow-edge lines and labels |
| Quiet | `--c-dim` | outlines of what is not highlighted, when a highlight is active |
| | `--text-dim` | text of what is not highlighted (at least 4.5:1) |

Structure tokens may differ in lightness but not in hue: they are neutrals. Each focus and level color is a
distinct hue.

## Element types

| Type | Shape | Outline | Icon slot |
| --- | --- | --- | --- |
| `actor` | stadium (fully rounded ends) | solid 2px, `--c-actor` | person |
| `system` | rectangle, square corners | double, 2px + 2px, `--c-system` | none |
| `external` | rectangle, square corners | dashed 2px, `--c-external` | arrow out of box |
| `function` | rectangle, square corners | solid 3px, `--c-internal` | none |
| `component` | rectangle, 6px corner radius | solid 2px, `--c-internal` | none |
| `store` | cylinder | solid 2px, `--c-internal` | none |
| `store` with `form: file` | page with a folded top-right corner, labelled `[file]` | solid 2px, `--c-internal` | none |

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
- On the title scene and on before scenes the ladder fills no rung and carries a "Title" or "Before" tag: those
  pictures show no level of the solution. Their segments in the position strip are neutral (`--text-muted`).
- It appears in the page chrome of every scene, and as a compact badge in the title row of every rendered
  diagram (`L2 · FUNCTIONS`), so a standalone diagram carries it too.
- A theme may restyle the indicator but may not remove it. Its colors come from the tokens above; filled
  versus outlined is the signal, not color.

## Level key

A flow whose nodes' bound elements come from more than one level outlines each node in its level's colour
(`--lv-1` to `--lv-3`) and adds the levels present to its legend. A context, functions, or components view is one
level by definition (`views.md`; its actors and externals are context, not a second level), so it does neither:
the badge and the level indicator already say the level.

## Legend

Generated from what is drawn: the element or node types present, a "focus" swatch in any view that can carry a
highlight (every view except a structure view), the level key in a mixed-level view, and the line kinds present.

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

Every line carries one plain label, except at L1, where lines carry none (the wording stays in the tooltip
and the map). A line that stands for several merged relationships shows the view spec's label for it, or the
first verb; never a count, and its tooltip lists them all. Lines leaving one flow node with the same label
share one label near the source, and a decision's branch labels sit on their own line's first segment. A
label sits on its line, or beside it, and never over a box or another line; when neither fits, it sits near
the line's start with a dotted leader.

Inside a box, text wraps to the box: the name (up to three lines), the exact name on its own line in the
monospace face (paths wrap at `/`), the type, then the responsibility or the "what it does" bullets in full.
Text that needs more lines than that fails the render; it is never cut.

## Before views

A before view draws the before model (`system-model.md`, The before model): the user and the old way, never
the solution. Its badge reads `BEFORE`, and the user takes the first layer, so the picture leads with them.

| Type | Shape | Outline |
| --- | --- | --- |
| `person` | stadium (the actor shape) | solid 2px, `--c-actor` |
| `task` | rectangle, 6px corner radius | solid 2px, `--c-internal` |
| `means` | rectangle, square corners | dashed 2px, `--c-external` |
| `pain` | a tag pointing right, with a heavy bar at its left | solid 2px, `--c-system`; the bar filled `--c-system` |

Inside each box: the name (bold; for a pain, what hurt, up to four lines), an exact name for a means, and the
`[type]` label. Relationship lines are solid 2px `--c-edge` with their verb as the label (the legend calls them
"relationship"). Each pain has one dotted, unlabelled `hurts` line from the pain to what it hurts; a pain that
hurts a relationship points at the relationship's target. Pains use the neutral structure colours: when a step
highlights a pain, its outline, its bar, and its `hurts` line take `--c-highlight`. No colour is added.

## Title art

The title scene's default visual (`title_visual.kind: art`) is the solution drawn as a large schematic: every
default element of a wired L1 or L2 view (the view's narrowing and labels left out), laid out to fill the
title's landscape figure, on a quiet dot grid. Shapes and lines only, in the structure colours at 3-4px; no
text, legend, or badge, so no label floor applies. Every shape carries its model ID (`data-el`). It is not a
second picture of the answer: it carries no names, and the answer scene's L1 view does.

## Flow node types

| Type | Shape | Outline |
| --- | --- | --- |
| `trigger` | stadium, thick left bar | solid 2px, `--c-edge` |
| `step` | rectangle, 6px radius | solid 2px, color of its `on:` element's type |
| `gate` | hexagon | solid 3px, `--c-human` |
| `decision` | diamond | solid 2px, `--c-internal` |
| `store` | cylinder, or a file shape when its element has `form: file` | solid 2px, `--c-internal` |
| `external` | rectangle | dashed 2px, `--c-external` |
| `output` | rectangle with a doubled bottom edge | solid 2px, `--c-system` |

Every flow node shows its step number in a circle at its top-left corner. Flow edges: `control` solid,
`data` dashed, both 2px, each with its verb label; a line leaving a `decision` is labelled with its condition
alone ("pass", "fail"), on the line by the diamond, and its verb is in the line's tooltip.

## Highlight states

- **Highlighted:** the outline switches to `--c-highlight` at 3px and the element's name turns bold. A
  highlighted line is drawn in `--c-highlight` at 3px with its label in the same color.
- **Traced:** a traced line is highlighted: it and its label stay at full strength in `--c-highlight` for the
  rest of the scene's steps.
- **Dimmed:** in a structure, context, or component view with a highlight active, everything else keeps its
  shape and outline style, its outline takes `--c-dim`, its text takes `--text-dim` (at least 4.5:1, never by
  opacity), and its lines fade. Expand markers are never dimmed.
- **Flows:** a highlight in a flow view emphasises its steps and dims nothing, so the rest of the flow never
  looks switched off.
- **Revealed / hidden:** a hidden element is not drawn yet; reveal adds it in its final position. Layout
  never moves when something is revealed.
