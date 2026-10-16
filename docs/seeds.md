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

## S13. Art direction and a critique of the look

Raised 2026-10-15, from a review of the open-source taste-skill project (an art-direction skill for landing
pages, MIT licence) for what it could add to stage 04.

**What.** Every check in the template covers legibility, correctness, or a banned pattern. Nothing gives a run's
look an idea of its own, and nothing judges composition. Stage 04 calls itself "where visual quality is set",
but its agent only measures the mockups; judging the look is left entirely to the operator at the gate. The
banned list covers the first wave of generated-page tells only, and a run theme is where the later ones would
appear.

**Wanted.**
1. **A critique loop on the mockups, inside stage 04 before the operator's review.** After `mockups.mjs`, stage
   04 critiques the contact sheet, judging the
   pictures only, never the code. Passes, each made on its own:
   - One second: one focal thing per scene, not "a diagram".
   - Squint: two or three masses of clearly different size, not many medium ones.
   - Cover the name: could this scene explain any other system? If so, the look has no idea.
   - Edges: few, reused left edges across scenes.
   - Sameness: one word for each scene's composition; the same word several times in a row is the template
     showing.
   - Accent: the focus colour marks one thing per screen, not ten.
   - Holes: an empty area left by accident, not by decision.

   The critique is written as a round: what was seen in one second, the idea, scores, caps applied, and the top
   three problems, each with its screenshot and fix. Fix those three, run the mockups again, and stop after three
   rounds or when a round finds nothing a stranger would notice. Only then does the stage stop for the operator,
   who reviews the look with the rounds in front of them (in `design-spec.md` or beside the mockups). Stage 06's
   screenshot review uses the same passes.
2. **An idea for the look.** `design-spec.md` lists eight to twelve things only this solution has, taken from
   the system model and storyboard (its name, its shape, what it produces, the artefacts of its world), then
   states one sentence: "In this explainer, [something from that list] becomes [a visual device]." The
   competitor test applies: with the nearest alternative's name in the sentence, it should stop working. The
   sentence drives the theme (when `visual` is not `default`) and the title visual.
3. **Later-wave tells added to `banned-patterns.md`**, worded for this template:
   - Small uppercase letter-spaced labels and eyebrow labels above titles.
   - Index numbering as ornament (01 / 02 / 03, "Step 02") where order is not the content.
   - A cream ground with a terracotta or rust accent.
   - One medium radius (12-16px) on every box.
   - Monospace as a "technical" voice for anything other than paths, file names, and IDs.
   - The focus accent used decoratively or in many places on one screen.
4. **Explainer looks asked for at setup.** The template does not ship or offer a set of looks. The questionnaire
   asks whether the operator has explainer looks in mind (other explainers, decks, or pages whose look they want
   to draw on), and stage 04 works them into the design the way it works in the visual references.

**Needs thought.** The operator wants to understand these better before deciding.
- Scores and caps: a weighted score (taste-skill uses design, usability, creativity, content) with caps that
  override it, or the written passes alone. Caps would need rewriting for this template (diagram legibility,
  banned patterns, a scene with no focal point), since the source's are for marketing pages.
- Measuring accent share per mockup (the source keeps the accent under 5% of any screen) in `mockups.mjs`.

**Not taken from the source.** Its section library and the 247-site study (marketing pages), the floor of four
photographs and the open-collection image search, the minimum number of moving elements (it conflicts with
presenter-triggered motion), the ban on every line and on all monospace (diagrams need edges; IDs need
monospace), the phone composition, its browser inspector (`mockups.mjs` and verify already measure), and a dealt
library of looks (the operator decided against shipping looks; item 4 asks for them instead). Any text copied
from the source keeps its MIT notice.

**Touches.** `stages/04_design/CONTEXT.md` (process and Human Check), `stages/06_verify/CONTEXT.md` (the review),
`_config/banned-patterns.md`, `_config/visual-direction.md` (the idea), `design-spec.md`'s expected sections,
`setup/questionnaire.md` and `_config/run.md` (explainer looks), possibly `scripts/mockups.mjs` (accent share).
