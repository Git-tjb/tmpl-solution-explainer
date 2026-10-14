---
iteration: "002"
component: tmpl-solution-explainer
origin: personal
proposals: []
retros: [retro-20261012-799457]
---
# Requirements Prompt: Solution Explainer Iteration 002 (legibility and correctness)

> **Rev 1, 2026-10-14. Agreed by the operator 2026-10-14, with every open question at its default (§8).** Requirements state outcomes. Where a source suggests a
> mechanism (an opacity value, a layout direction, a control), it is cited as a source, not required; the design
> picks the mechanism. It names no person; the person who runs the workshop and presents is "the operator."

## 0. How to Use This Prompt

Produce the iteration 002 design (`docs/iterations/002-<slug>/design.md` in the template): the mechanisms for
each requirement below, the changes to `docs/design.md`, and the work split into workstreams, each with its own
acceptance criteria. Stop at the gate for the operator's approval before building anything.

## 1. Problem

Trial run 2 produced an explainer that passed every scripted criterion, yet a viewer's review found it hard to
read in ways the checks never looked at: the edge a scene is about is dimmed to near-invisible, dimmed text is
illegible, controls wrap and clip at 1440 wide, text runs out of its shapes or is cut mid-sentence, diagrams use
a fraction of their space at about 13px, the same title appears three times, and one colour means four things.
The run's own retro found the same causes from the inside: the renderer's top-to-bottom layout costs height,
names and bullets overflow, the label-size preview covers one viewport, and level and type colours overlap.
Several fixes were made only in the instance, so the template is now behind what it shipped (retro A13).

## 2. Sources to Read First

1. The template's `docs/seeds.md`, seeds S2, S3, S4, S7 and S10 (the viewer's review).
2. Trial run 2's retro, "By Template Area": the rows for notation, renderer layout and legibility, flows (the
   dimming and width items only), and process (instance patches).
3. Trial run 2's stage 04 `gate-feedback.md`: O5, O6, O8, O9, O11, O12, O13, O15, A7 to A11, A13 to A15.
4. Trial run 2's patched `scripts/render-diagrams.mjs`, `scripts/build-site.mjs`, `scripts/site/runtime.js` and
   `scripts/site/base.css`, compared with the template's 0.1.0 versions.
5. Trial run 2's `stages/04_design/output/design-spec.md` (the run theme and the views it had to narrow).
6. The template's `docs/design.md` and the iteration 001 record, for what 0.1.0 decided and why.

All trial run 2 material is in its archive in the personal KB vault (read-only).

## 3. Goals

- Every scene, at every reveal step, at 1920x1080 and 1440x900, is readable: what the scene is about is shown at
  full strength, everything else is quiet but legible, nothing overflows, wraps, clips or is cut.
- Diagrams fill the space they are given, with body text at or above the 16px floor.
- Colour means one thing everywhere, in the default look and in any run theme.
- The template contains everything trial run 2 had to patch in, so the next run starts from what was shipped.
- These properties are checked by the scripts, not found by a viewer.

## 4. Non-Goals

Deferred to later iterations (they stay in `docs/seeds.md` or the retro):
- Single-file export (S1).
- Story and discovery: a picture per scene, problem visuals, bullets that add to the message, reveal behaviour
  (S5); the retro's discovery reading, model naming, "why" section, flows-for-the-audience, zoom and storyboard
  areas.
- Navigation and map features beyond R14 (S6, S8), and presenter notes (O4).
- Small screens (S9).
- Run-theme styling points and the sidebar (A16; the sidebar in S7 belongs to trial run 2's theme, not the
  template).
- Setup changes (A12).

## 5. Requirements

**Carry forward what trial run 2 shipped**

- **R1.** The template includes every behaviour trial run 2 patched into its instance (A13): a file shape (O6),
  a focus swatch in the legend (O8), level outlines and a level key only in views that mix levels (O13), and each
  scene's message shown on the scene with a show/hide control (O15). A fresh instance at 002 needs no script
  patches to reach trial run 2's result.

**What the scene is about stays at full strength**

- **R2.** Elements, edges, edge labels and flow steps that a scene highlights or traces render at full strength
  in the highlight treatment, at every reveal step after they appear. (S2)
- **R3.** Highlighting one step of a flow does not make the rest of the flow look broken. (O11)
- **R4.** Interactive markers (the expand marker) are never dimmed with their element. (S2)
- **R5.** Dimmed text, in any element or label, keeps at least 4.5:1 contrast against its background. (S2)

**Nothing overflows, wraps, clips or is cut**

- **R6.** At both viewports, no control wraps onto a second line or extends past the viewport. Where a label is
  too long for its space, it is shortened and its full text stays available to the viewer. (S3)
- **R7.** No text extends past its shape: element names and exact names, type lines, paths, `what_it_does`
  bullets, boundary titles, and decision and flow-node labels. (S3, A8, A10, A14)
- **R8.** No on-screen text is cut mid-thought. Text that does not fit fails a check at the stage that can fix
  it, naming the scene and element, instead of being truncated in the build. (S3, A14)
- **R9.** The first reveal step of every scene shows content, not an empty frame. (S3)

**Diagrams use their space**

- **R10.** Each diagram fills its figure area: the drawn content, not the legend or a fixed canvas, sets the
  diagram's extent. (S4)
- **R11.** Diagram body text renders at 16px or larger at both viewports, in every view and flow within the
  standards' element and node limits. Space is recovered through layout, not by lowering the floor or dropping
  the context a view exists to show. (S4, A7, A9; operator decision 2026-10-14)
- **R12.** Branching flows read cleanly: branch labels sit on their lines, labels do not overlap each other, and
  lines do not cross where a layout without crossings exists. (S4)
- **R13.** Each scene shows its title once. (S4)
- **R14.** The legend shows only what is drawn in the current view and is visually secondary to the diagram.
  (S4, O8)
- **R15.** Edge labels on the linear path are plain language a first-time viewer understands; no counts or
  shorthand. The full relationship list stays available in the map. At L1, lines carry no labels. (S4, O12)

**Colour means one thing**

- **R16.** The notation gives every colour role exactly one meaning (for example: focus, level, message,
  navigation), with object types told apart by shape and line style. The default look meets it, and
  `check-design` rejects a run theme that gives one hue two roles. (S7, O5, O13)
- **R17.** The level is shown consistently on the scene (badge, title or rule, level indicator), and the
  element a scene focuses on is marked in the picture itself. (S7, O5, O9)
- **R18.** Scene titles and messages fit in at most two lines at both viewports and do not end on a single word.
  (S7)

**Checked, not found**

- **R19.** The design-time preview predicts label size at both viewports, and says which element or neighbour
  drives a view over its height. (A11, A15)
- **R20.** `verify` checks R2, R4 to R9, R11, R13 and R18 at every scene and every reveal step, at both
  viewports, in the three browsers; the dry run passes. Criteria that need a human look (R12, R15, R16's
  judgement calls) are listed for the stage 06 review. (S10)
- **R21.** A first-time viewer can tell from the first screen how to advance and where they are in the
  explainer. (S10; see open question 4)

## 6. Existing Rules This Changes

| Rule | Change |
| --- | --- |
| `_config/build-rules.md`: dimmed diagram text at least 3:1 | At least 4.5:1 (R5) |
| `_config/standards/notation.md`: dimming applies to everything not highlighted | Traced content and interactive markers are never dimmed (R2, R4); flows per R3 |
| `_config/standards/views.md`: every view has a title in the form "Level: scope" | The title appears once per scene (R13); the design says where the view title lives |
| `_config/standards/views.md` / `notation.md`: every line carries its verb | Not at L1; plain labels on the path, full lists in the map (R15) |
| `_config/standards/notation.md`: colour encodes type or highlight state | One meaning per colour role; types by shape and line style (R16) |
| Legend auto-generated from the element types present | Plus a focus entry only when something is focused; secondary in weight (R14) |
| `docs/design.md` V1 scope | Records 002's additions (message on the scene, R1) |

## 7. Constraints That Do Not Change

- No themes in the template; a run may bring its own, and it is held to R16.
- Diagram text floor 16px; body text floor 20px at 1080p; strokes at least 2px; text contrast at least 7:1.
- Opens locally, offline, no server, zero network requests; diagrams prerendered and deterministic.
- 8 to 14 scenes in at most 15 minutes; at most 9 elements per view and 12 nodes per flow, unless open question 2
  is answered otherwise.
- One view, one level; diagrams only from the model.
- Viewports 1920x1080 and 1440x900; three browsers; dark mode only.
- Commit discipline: the template is in development; see open question 1.

## 8. Open Questions (defaults shown)

1. **Where the iteration's commits go.** The repo is now public. Default: a branch `claude/iteration-002`,
   merged to `main` at close, so work in progress is not on the public `main`.
2. **The 12-node flow limit.** A 12-node flow could not meet 16px at 1080p in trial run 2 (A9). Default: keep
   12 if the design's layout can meet R11 with it; otherwise the design proposes a lower limit and says why.
3. **Version number at close.** Default: 0.2.0.
4. **R21's scope.** It comes from S10 but overlaps S6 (deferred). Default: the minimum that meets it (a one-time
   hint on the first scene and a visible position in the explainer); the rest of S6 stays deferred.
5. **Dimming strength.** The viewer suggests 55 to 60% for nodes. Default: the design picks whatever meets R5
   and keeps highlighted content clearly dominant.
