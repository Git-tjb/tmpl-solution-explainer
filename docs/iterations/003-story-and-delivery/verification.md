# Iteration 003 Verification

Closed 2026-10-15, pending the operator's approval of the close. The template moves to version 0.3.0
(`docs/design.md`). Work was on branch `claude/iteration-003`, to be merged to `main` at close (requirements, open
question 6).

## Gates
The operator agreed the requirements (rev 3, every open question at its default) and approved the design on
2026-10-15. At the W3 gate the operator asked for more conceptual pictures of the problem; that became addendum D8
and workstream W3b, approved before it was built. Each workstream had its own gate.

| Workstream | Design | Commit | Gate notes |
| --- | --- | --- | --- |
| W1 setup and the before model | D1 | `7e64d49` | The no-solution rule compares the system and its parts only; actors and externals may appear, so the user can be an actor |
| W2 arc and storyboard rules | D2, D3 | `efbd1b1` | Approved with a deviation: the full dry run stopped at rendering until W3, and AC-16's orientation half failed until W4 |
| W3 before views and the title visual | D4 | `9a58187` | Title art lays out the view's full default element set, not its narrowing, and picks the shape that fills a landscape figure. `assemble` also plays when the page opens on the title |
| W3b problem figures | D8 (addendum) | `42848a2` | Figures are fixed compositions trimmed to what they draw, not stretched to the figure area |
| W4 levels on demand, controls, the map | D5 | `d239c16` | The level indicator dims with the strip while an overlay is open; the strip's segments are in the tab order |
| W5 single-file export and the deliverable | D6 | `7751289` | — |
| W6 fixtures, documents, close | D7 | this close | See below |

## Requirements

| Req | Met by | Evidence |
| --- | --- | --- |
| R1 title scene with an engaging visual | `title` section and layout; title art drawn from the model (`assemble` on entry), or an approved licensed image | fixture S01; AC-9 checks every art shape carries a model ID; title-image tests (type, size, unsafe SVG, licence, approval) |
| R2 the user and the problem first, no solution | the before model; problem scenes on before views; every figure leads with the user | `check-model` refuses a solution part; `check-storyboard` and `check-design` checks; fixture S02, S03 |
| R3 then the answer | the arc: title, one or two problem scenes, then the one answer scene at L1 | `check-storyboard` (negative: answer missing, S01 not title) |
| R4 no repeated picture unless it adds | `adds` on a repeated view; `check-design` fails the same view, highlight, and reveals twice | negative tests; fixture S10 reuses the functions view with `adds` |
| R5 problem scenes show the problem | before views and problem figures; `about: problem` elsewhere | negative: a problem scene on an L1 view, `about: problem` on L2 |
| R6 the close shows something new | the close's picture must differ from the title, problem, and answer pictures | negative: close on the answer's picture |
| R7 lines add to the message | word-overlap warning in the report and `lines.md` | fires on the seeded fixture line S04 (100%) |
| R8 one reveal behaviour | `text_reveal` in `scene-specs.yaml`, enforced on every scene | negatives: with-scene plus a show-text, two lines in one step, a missing show-text |
| R9 orientation off the path, Levels control | the Levels panel (L) beside Map, drawn from data, with a close control | AC-30; orientation scene, layout, and `key` level removed |
| R10 level pills do something; Code says why | rungs open the Levels panel at their level; Code's tooltip and "Map only" row | AC-30 |
| R11 hover and pressed states | rules for every button and clickable diagram element | AC-29, with real pointer input; negative: a missing hover rule fails |
| R12 clickable strip with titles | each segment a button with the scene title | AC-30 (every segment lands on its scene) |
| R13 overlay pressed, close control, no stale state | one-at-a-time overlays; pressed button, close control, "Map"/"Levels" in the bar, prev and next disabled, strip and indicator quiet | AC-30; negative: a missing pressed state fails |
| R14 map panels without one long scroll | section jumps, file trees collapsed | screenshot `map-1920x1080.png`; AC-29 hovers the jumps |
| R15 "Map only" opens the map | the Code row's button | AC-30 |
| R16 setup asks about the user and what hurt | questionnaire question 6, `run.md` fields, `OPN` notes, `before` facts | fixture run answers and notes |
| R17 visual references as colours, fonts, images; title direction | typed `visual_references`, snapshot into `visual-refs/`, `title_visual` | snapshot negatives (plain text, bad colour, missing or wrong-type file, title image without licence) |
| R18 minutes per section first; lines with facts | `budget` in `scenes.json`; `{line, facts}`; `lines.md` | negatives: a section over budget, budget over target, a section without allocation, a line without facts |
| R19 a self-contained single file | `export-single.mjs` | opens alone in an empty folder in Chromium and Firefox: no requests, no errors, fonts loaded, every scene reachable |
| R20 it passes the same checks | `verify.mjs --single` | AC-1 to AC-31 pass for the single file |
| R21 declared as the deliverable, `site/` untouched, nothing filed | `deliverables.yml` (schema), default name `<YYYY-MM-DD> - <instance> - explainer.html` | `site/` byte-identical before and after export; AC-31 fails a tampered file |

## Done condition (design D7)
`node scripts/dry-run.mjs` passes AC-1 to AC-31 (every scripted criterion) in Chromium, Edge, and Firefox at
1920x1080 and 1440x900, for the page set and for the single file. The review criteria (AC-10, AC-11, AC-12,
AC-15, and the stage 06 review list) are judged in a run.

`Test-Workspace.ps1 -Template` passes with two warnings, as in iteration 002: an uppercase `LICENSE` and the
iteration branch. The scrub scan finds no term in any file git tracks or would track. Its 1,044 matches are all
in `node_modules` and in binary screenshots in the gitignored dry-run output.

Predicted label sizes on the fixtures (`render-diagrams --preview`):

| View | Layout | 1920x1080 | 1440x900 (floor 13.3) |
| --- | --- | --- | --- |
| before-pains | figure repeat | 20.7px | 14.6px |
| before-work | top-to-bottom | 25.6px | 23.7px |
| context | top-to-bottom | 25.6px | 21.2px |
| functions | top-to-bottom | 21.4px | 17.6px |
| functions-structure | top-to-bottom | 25.6px | 22.5px |
| instances-components | top-to-bottom | 21.9px | 18.1px |
| templates-components | top-to-bottom | 16.5px | 13.6px |
| run-a-stage-flow | aspect 1.7 | 19.0px | 15.0px |

Three test builds rendered every problem figure in scenes and passed render, build, and verify:
- A: drift, wait
- B: scatter, gap
- C: cost comparing before and after, in an added `why` scene

Their sizes ranged from 20.4 to 24.0px at 1920x1080 and from 14.5 to 17.0px at 1440x900.

## Fixture changes
- **Run answers:** the user, their goal, the old way, three pains, `pain_counts`, typed visual references (a
  colour and an image, with a small SVG), and `title_visual`.
- **Discovery:** eight new operator notes and facts F019 to F031 (`before`, plus one `outcomes` fact). A
  nine-element before model with `recurs`, `versions`, `queue`, and one measure. A new means (a shared drive), so
  the scatter figure has three places.
- **Scope:** a `purpose_line`; `target_scenes` 10.
- **Storyboard:** schema 2, ten scenes in twelve minutes with a budget. S01 is the title (art from the functions
  view, `assemble`). S02 is the problem on a map of the old way, and S03 a `repeat` figure. S04 is the answer,
  whose line deliberately repeats its message so the warning is exercised. S10 closes on the wired functions view
  with `adds`.
- **Design:** `text_reveal: per-step` (every line has its own step), and the two before view specs.

## Found along the way
- A `sed` replacement by line number overwrote the wrong line in `check-design` after an earlier edit had shifted
  the file. It was caught at once from the diff and restored. Edits by pattern only from then on.
- Problem figures first sent hurts lines down through the boxes below their target. Lines now run in clear lanes
  at the figure's left or right, entering from that side, and the arrowheads are spaced so they never overlap.
- Reading stylesheet rules to check hover states does not work from `file://`, because browsers hide linked
  stylesheets' rules there. AC-29 uses real pointer input instead: hover, then press and move away before
  releasing, so nothing is clicked.
- A boundary's middle holds its parts, so AC-29 points at a boundary by its title, as a person would.

## Known limits (in `docs/design.md`)
- The line-repeat check is a word-overlap heuristic; it warns, and the gate decides.
- The title art has no names; a run that needs more brings a licensed image.
- Problem figures are fixed compositions with a fixed vocabulary; a pain that fits none uses the map.
- AC-29 samples the first four controls of each kind.
- The single file's date is the run's start.
- Carried from 0.2.0: laned flows beyond about seven steps (S11), the traced arrowhead's colour (S12).

## Not yet exercised
- Real content: trial run 3 tests this iteration, including whether the title art reads as engaging and which
  problem figures real pains need.
- Filing the deliverable: the workshop proposal "Run Deliverable Filing" says how `Close-Instance` reads
  `deliverables.yml`. Until it lands, the single file reaches the KB vault inside the run's archive.

## Seeds
`docs/seeds.md` drops S1, S5, S6, and S8 (addressed) and keeps S9, S11, and S12. A seed S13 (art direction and a
critique of the look) was added to the working copy from elsewhere during this iteration and was left out of
every commit for the operator to decide.
