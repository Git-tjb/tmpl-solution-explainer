# Iteration 002 Verification

Closed 2026-10-14, pending the operator's approval of the close. The template moves to version 0.2.0
(`docs/design.md`). Work was on branch `claude/iteration-002`, merged to `main` at close (requirements, open
question 1).

## Gates
The operator agreed the requirements (every open question at its default) and approved the design on
2026-10-14, then each workstream at its own gate.

| Workstream | Design | Commit | Gate notes |
| --- | --- | --- | --- |
| W1 fold in trial run 2's patches | D1 | `a53a118` | Accepted a known AC-6 failure on fixture S05 (the focus swatch added a legend row); W3 fixed it |
| W2 colour roles and dimming | D2, D3 | `955c2d8` | Expand markers needed no separate layer once dimming stopped using opacity |
| W3 renderer | D4, D5 | `d1a2802` | Font widths measured in Chromium (the design's stated fallback); the map keeps each SVG's own legend; a line through a boundary title was found and moved to W5 as AC-28 |
| W4 control bar and page text | D6 | `c8ad01a` | Fixture S01, S04, S08 started empty and were changed to show content at step 0 |
| W5 checks at every step | D7 | `c76098e` | AC-28 added (operator, W3 gate) and kept strict (W5 gate); boundary titles wrap and avoid lines; level key limited to flows |
| W6 fixtures, documents, close | D8 | this close | See below |

## Requirements

| Req | Met by | Evidence |
| --- | --- | --- |
| R1 trial run 2's patches carried forward | `form: file`, level key in flows, focus swatch, scene message with P | dry run; a fresh build needs no patches |
| R2 highlighted and traced at full strength | traced counts as highlighted; focus-coloured labels | AC-19 at every step |
| R3 a flow highlight dims nothing | flow views exempt from dimming | fixture S08 step 3 |
| R4 markers never dimmed | dimming by colour, not opacity | AC-20 |
| R5 dimmed text at least 4.5:1 | `--text-dim`; `check-design` and AC-20 | negative test: a 2.9:1 theme value fails `check-design` |
| R6 no control wraps | one-row bar, scope label shortens with a tooltip | AC-21; probe with an over-long scope label |
| R7 text inside its shape | measured text, wrapping rules, boundary titles that wrap | AC-22 |
| R8 nothing cut | `wrap()` never truncates; too long fails the build naming the stage | AC-23; negative test (an over-long name fails with "stage 01") |
| R9 first frame has content | `check-design` rule | AC-24; caught three fixture scenes |
| R10 diagrams fill their figure | content viewBox, scaling up to 1.6x | screenshots; preview table |
| R11 16px floor at both viewports | layout candidates; the build refuses a view under the floor | AC-6 at every step; caught the nine-step laned flow |
| R12 branching flows read cleanly | branch labels show the condition on the line; shared labels | stage 06 review item; fixture S08 screenshot |
| R13 one title | SVG title row hidden in scenes; chrome title removed | AC-25 |
| R14 legend shows what is drawn, secondary | HTML legend row, focus only while highlighted, collapses behind "Legend" | screenshots at 1440x900 |
| R15 plain line labels, none at L1 | one verb or a spec `labels` entry; `check-design` notes merged lines | fixture functions view; stage 06 review item |
| R16 one meaning per colour | colour roles in `notation.md`; OKLCH limits in `check-design` | negative test: four violations caught |
| R17 level shown consistently; focus marked in the picture | level rule on the message, strip, rung; focused names bold | screenshots |
| R18 titles and messages in two lines | measured size steps in `build-site`; `text-wrap: balance` | AC-26; fixture S06's long title uses the smallest step |
| R19 preview at both viewports, with what drives size | `render-diagrams --preview` table; mockups at both viewports with measurements | preview output; `mockups/measurements.json` |
| R20 checks at every step, both viewports, three browsers | `scripts/lib/page-checks.mjs` in `verify.mjs` | AC-19 to AC-28 |
| R21 first screen says how to advance and where you are | hint, position readout, strip | AC-27 |

## Done condition (design D8)
`node scripts/dry-run.mjs` passes AC-1 to AC-28 (every scripted criterion) in Chromium, Edge, and Firefox at
1920x1080 and 1440x900, and `check-design` passes on the fixtures. The review criteria (AC-10, AC-11, AC-12,
AC-15, and the stage 06 review list) are judged in a run. `Test-Workspace.ps1 -Template` passes with two
warnings: an uppercase `LICENSE` (the conventional name) and the iteration branch. The scrub scan finds no term
in any file git tracks.

Predicted label sizes on the fixtures (`render-diagrams --preview`):

| View | Layout | 1920x1080 | 1440x900 (floor 13.3) |
| --- | --- | --- | --- |
| context | top-to-bottom | 25.6px | 21.2px |
| functions | top-to-bottom | 21.4px | 17.6px |
| functions-structure | top-to-bottom | 25.6px | 22.5px |
| instances-components | top-to-bottom | 21.9px | 18.1px |
| templates-components | top-to-bottom | 16.5px | 13.6px |
| run-a-stage-flow | aspect 1.7 | 19.0px | 15.0px |

## Fixture changes
- A `form: file` store (`status.yml`), and a path-shaped exact name (`runs/<project>/<instance>/`).
- S01, S04, and S08 show content at step 0.
- The functions view is narrowed to the system's parts, with a plain label for its merged line; with the
  operator in it, the operator's line ran through the system title and wrapping the title cost the floor (AC-28).
- The flow gains a decision fan (pass to review, fail to its own output) and is unlaned (see Known limits).
- S06 has a long title, which fits two lines only at the smallest size step.

## Found along the way
- A non-identical rebuild (AC-14) during W1 was a test-harness mistake: verify run without the fixture's
  `run.md`. The dry run sets it.
- Trial run 2's level-key patch treated an L2 view's actor as a second level; the template's rule now limits the
  level key to flows.
- ELK ignores a minimum size on nested nodes, so boundary titles reserve their lines in the top padding instead.

## Known limits (in `docs/design.md`)
- Laned flows cannot wrap: beyond about seven steps they fall below the floor (seed S11). The 12-node limit
  holds for unlaned flows.
- A line can pass under a haloed boundary title when no gap fits and wrapping costs the floor; AC-28 reports it.
- A traced line's arrowhead keeps the line colour (seed S12).
- Left-to-right L3 views keep their L2 neighbours' order only approximately; no fixture view chose that layout.

## Not yet exercised
- Real content: trial run 3 is the test of this iteration.
- A run theme under the colour-role rules: trial run 2's LCARS theme would now fail them, as expected.

## Seeds
`docs/seeds.md` drops S2, S3, S4, S7, and S10 (addressed), trims S6 to what remains, and adds S11 and S12. Retro
A13 (instance patches) is done by W1. The retro's other areas (discovery, model naming, the "why" section, flows
for the audience, zooms, storyboard, presentation features, run-theme styling points, setup) remain for later
iterations.
