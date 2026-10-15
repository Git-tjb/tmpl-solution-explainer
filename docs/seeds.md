# Seeds

Improvement ideas for this template, captured between iterations. A seed is not a requirement: the operator
chooses the scope of an iteration from the seeds and the trial-run retros, and the iteration's requirements are
written then, in `docs/iterations/<nnn>-<slug>/requirements-prompt.md`.

This file holds open ideas only. When an iteration addresses a seed, or the operator decides to drop it, the
seed is removed from here. When the last seed is removed, delete this file; it is created again with the next
seed.

## Seeds from a viewer's review of trial run 2

Raised 2026-10-13. A viewer who used the trial run 2 explainer (13 scenes, S01 to S13) gave the feedback behind
S2 to S10. Scene numbers in those seeds refer to that run. Iteration 002 addressed S2, S3, S4, S7, and S10
(legibility and correctness); iteration 003 addressed S5, S6, and S8 (story and delivery). S9 remains.

## S9. Small screens

**What.** At phone width the diagram shrinks to a sliver and the control bar runs off screen.

**Wanted.** A decision, then one of two behaviours. If phones are out of scope: a plain "best viewed on a larger
screen" notice below about 900px wide. If in scope: stack the scene (title, message, full-width diagram with
pinch or horizontal scroll) and reduce the bar to prev, next and a menu.

**Needs thought.** The explainer is designed to be presented over a screen share, so phone support may not be
worth the cost; the template's `_config/` should state the decision either way.

**Touches.** `_config/build-rules.md` (a stated viewport range), `scripts/site/base.css`, `scripts/verify.mjs`
(the viewports it checks).

## S11. Laned flows beyond seven steps

Raised 2026-10-14, in iteration 002 (W6).

**What.** ELK lays a flow's lanes out as one row and cannot wrap them, so a laned flow grows wider with every
step. With iteration 002's measured text and label floor, the fixture's laned flow fits a `diagram-wide` scene at
seven steps (18.7px at 1920x1080) and falls to 10.5px at nine. The fixture flow is now unlaned; unlaned flows wrap
and meet the floor at nine steps.

**Needs thought.**
- A lower step limit for laned flows (about seven), stated in `flows.md` and checked by `check-design`.
- Or a renderer that wraps laned flows (lanes as rows with the flow's direction down, or splitting a long laned
  flow into two linked views).

**Touches.** `_config/standards/flows.md`, `check-design.mjs`, `render-diagrams.mjs`.

## S12. A traced line's arrowhead in the focus colour

Raised 2026-10-14, in iteration 002 (W5).

**What.** A traced or highlighted line and its label take the focus colour, but its arrowhead keeps the line
colour, because the arrow markers are shared per line kind.

**Needs thought.** Per-state markers (a focus-coloured marker per line kind) switched by the highlight class, or
`context-stroke` where all three browsers support it.

**Touches.** `render-diagrams.mjs` (markers), `scripts/site/base.css`.
