# Acceptance Criteria

A run's explainer is done when every criterion passes, or a failure is accepted by the operator in
`verify-report.md`. `script` criteria come from `verify-results.json`; `review` criteria are judged by the
stage 06 agent and recorded in the report.

## Runtime
| ID | Criterion | Check |
| --- | --- | --- |
| AC-1 | Opens from `file://` in current Chrome, Edge, and Firefox with no console errors and zero network requests | script |
| AC-2 | Every scene and reveal step is reachable forward and backward by keyboard | script |
| AC-3 | Every map element opens its panel; panel deep links and URL-hash links land on the right scene and step | script |
| AC-4 | Every animation runs on trigger, completes, and lands on its end state; reduced motion shows end states directly | script |
| AC-5 | All internal links and anchors resolve | script |
| AC-6 | Text and diagram sizes and contrast meet `build-rules.md` at 1920x1080 and 1440x900, with nothing clipped or overflowing | script |
| AC-7 | 8-14 scenes, total `minutes` within `target_minutes` (at most 15) | script |

## Standards conformance
| ID | Criterion | Check |
| --- | --- | --- |
| AC-8 | `system-model.yaml` and `flows.yaml` pass `check-model`; every element, relationship, and flow node cites a fact | script |
| AC-9 | Every diagram is a rendered SVG from the model with a title, a legend, and type labels; one level per view; at most 9 elements per view and 12 nodes per flow; every flow node bound to an element | script |
| AC-10 | Scene 1 is answer-first and the last scene returns to it; one mode and one level per scene; no reference content on the path; usage examples introduce no new elements | script, then review |
| AC-11 | Every scene in the page maps to a storyboard scene ID, and every on-screen claim traces to a fact in the fact sheet | script (IDs), review (claims) |
| AC-16 | Every scene shows its level in the one form `notation.md` defines (the level indicator in the chrome, the badge in every diagram); the title and before scenes fill no rung and carry their tag | script |
| AC-17 | Every element with `what_it_does` can be expanded to show it in any wired or flow view (a structure view shows it in the box), and the bullets trace to the fact sheet; at both viewports the popover never covers its own marker, and its close control, the marker, and Escape each close it | script |
| AC-18 | The functional structure (a structure view) is shown before any flow | script |

## Quality
| ID | Criterion | Check |
| --- | --- | --- |
| AC-12 | No banned pattern appears in any screenshot | review |
| AC-13 | axe-core reports no critical or serious violations | script |

## Portability and format
| ID | Criterion | Check |
| --- | --- | --- |
| AC-14 | Every stage produces the same result on any workshop machine with its tooling installed: re-running `render-diagrams` and `build-site` on the same inputs yields byte-identical output | script |
| AC-15 | The output format and how it meets each output-format requirement is recorded in the template's `docs/design.md` | review (template, once) |
| AC-31 | The run's single file (`verify.mjs --single`) is declared in `deliverables.yml` with a matching sha256, references no other file, and passes every criterion the page set passes; any criterion that fails only for the single file is named | script |

Every criterion above runs on the page set and, with `verify.mjs --single`, on the single file; for the single
file, AC-14 exports it again and compares the bytes.

## Legibility at every step
Checked at every scene and every reveal step, at 1920x1080 and 1440x900, in all three browsers (`verify.mjs`,
through `scripts/lib/page-checks.mjs`). AC-6's label size runs at every step too.

| ID | Criterion | Check |
| --- | --- | --- |
| AC-19 | What a step highlights or traces (elements, lines, and line labels) is drawn at full strength in the focus colour | script |
| AC-20 | Expand markers are never dimmed, and dimmed text keeps at least 4.5:1 as drawn | script |
| AC-21 | Every control is one line high and inside the viewport | script |
| AC-22 | Every text stays inside its shape: box text in its box (a decision's in its diamond), boundary titles in their boundary, line labels on their backing | script |
| AC-23 | No on-screen text is cut: nothing ends in an ellipsis, nothing is clipped (the control bar's scope label may shorten, with its full text in a tooltip) | script |
| AC-24 | Step 0 of every scene shows at least one element of its diagram | script |
| AC-25 | Each scene shows one title: the diagram's own title row is hidden and the control bar repeats none | script |
| AC-26 | Every scene title and message is at most two lines | script |
| AC-27 | The first screen shows how to advance (the hint) and where the viewer is (the position and the strip) | script |
| AC-28 | No line runs through text other than its own label | script |

## Controls
Checked once per browser and viewport, with real pointer and keyboard input.

| ID | Criterion | Check |
| --- | --- | --- |
| AC-29 | Every button and clickable diagram element (the bar, the strip, expand markers, map elements, panel jumps, close controls) looks different on hover and when pressed than at rest | script |
| AC-30 | Each strip segment lands on its scene. The map and the Levels panel each show their button pressed, a visible close control, and no scene position while open, with prev and next disabled; the close control, their key (M, L), and Escape each close them; only one is open at a time; a level pill opens the Levels panel at its level; "Map only" for Code opens the map; a scene link in the Levels panel lands on its scene | script |

## Review at stage 06
Judged by the stage 06 agent from the screenshots, and recorded in `verify-report.md`:
- Branching flows read cleanly: branch labels sit on their lines, labels do not overlap, and lines do not cross
  where a layout without crossings exists.
- Line labels on the path are plain language a first-time viewer understands; no counts or shorthand.
- Colour reads as one meaning per role: focus, level, and neutral structure (`check-design` checks the tokens;
  this checks the page).
