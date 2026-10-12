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
| AC-16 | Every scene shows its level in the one form `notation.md` defines (the level indicator in the chrome, the badge in every diagram), and the orientation scene comes before the first L2 or L3 scene | script |
| AC-17 | Every element with `what_it_does` can be expanded to show it in any wired or flow view (a structure view shows it in the box), and the bullets trace to the fact sheet | script |
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
