# Seeds

Improvement ideas for this template, captured between iterations. A seed is not a requirement: the operator
chooses the scope of an iteration from the seeds and the trial-run retros, and the iteration's requirements are
written then, in `docs/iterations/<nnn>-<slug>/requirements-prompt.md`.

This file holds open ideas only. When an iteration addresses a seed, or the operator decides to drop it, the
seed is removed from here. When the last seed is removed, delete this file; it is created again with the next
seed.

## S1. Single-file export as a standard end-of-run output

Raised 2026-10-13, after trial run 2 was archived.

**What.** When a run completes, the template offers a standard export of the final output as one
self-contained HTML file: CSS, JS, fonts and diagrams inlined, page title set. The operator can then take it,
share it, or open it from the KB vault in a browser without companion files.

**How it played out.** The operator asked for the explainer as one file after the run was archived. A
throwaway script built it from the archived `stages/05_build/output/site/` without modifying the archive:

1. Base64-encode each `.woff2` into the `url()` of the stylesheets.
2. Replace the three `<link rel="stylesheet">` tags (`tokens.css`, `base.css`, `theme.css`) with inline
   `<style>` blocks.
3. Replace the `runtime.js` `<script src>` with an inline `<script>`, escaping any `</script`.
4. Set the `<title>`, then assert no `assets/` reference remains.

Result: 430 KB, 5 fonts embedded, opens with no other files. The diagrams were already inline in `index.html`.
It was filed to the personal KB vault's inbox by hand. The write hook blocked every shell command that named
the vault path until the filing marker was set, reads included.

**Needs thought.**
- Where the export sits in the run: a final step of the build stage, a separate stage, or an option on
  `Close-Instance`. It must not alter the approved `site/`.
- Filing it with the project archive. The archive holds the multi-file tree under
  `Workflows/<date> - <instance>/`. Decide whether the single file also goes in the archive, under what name,
  and whether a non-markdown artifact needs a stamp, frontmatter or provenance (source instance and commit).
  Today the inbox accepts it only because the inbox accepts anything.
- Running it from the vault in a browser. The vault is a private repo and the file is not a note. Open points:
  which viewer or host serves it, how a private repo exposes it (local open, rendered view, static host), and
  keeping it out of any public path.

**Likely touches.** The build stage and its `CONTEXT.md`, `Close-Instance.ps1` and the archive layout
(schema section 13), the KB vault schema's attachment and artifact rules, and the hook's handling of reads.

**Open questions.**
- Is the single file a build-stage output, or a step that runs at close?
- Does it go into the archive, beside it, or only to the inbox?
- What is the browser path for a private vault?

## Seeds from a viewer's review of trial run 2

Raised 2026-10-13. A viewer who used the trial run 2 explainer (13 scenes, S01 to S13) gave the feedback behind
S2 to S10. Scene numbers in those seeds refer to that run. Iteration 002 addressed S2, S3, S4, S7, and S10
(legibility and correctness); S5, S6, S8, and S9 remain.

## S5. Story: every scene needs its own picture

**What.**
- The same context diagram appears four times (S01, S03, S04, S13). S03 ("Two machines, one way of working")
  and S04 ("When the design drifted") state the problem, but the picture shows the finished solution with one or
  two boxes outlined, so it shows neither two machines nor drift.
- S13 is S01 again with a new message.
- Bullets often repeat the message: S12's message and first bullet are the same sentence; S02's bullet restates
  the four level names.
- Step reveals are inconsistent: bullets appear one per step in some scenes, all at once in others (S01, S11).

**Wanted.**
- Problem scenes get a visual that shows the problem, even a simple before/after pair.
- The closing scene does something the opening did not, such as the context diagram with the three functions
  revealed inside the system box.
- Each bullet adds something the message does not, or is removed.
- One reveal behaviour across the deck.

**Touches.** `stages/03_storyboard` and `_config/narrative-arc.md` (a rule that no two scenes share a picture
unless the second adds something), `scripts/check-storyboard.mjs` (flag repeated views and bullets that
duplicate the message), `_config/standards/scenes.schema.json`. The scene-specific cases above are run content,
fixed in an instance.

## S6. Control bar and navigation

Iteration 002 (R21 and the control bar) delivered part of this seed: prev and next are the only filled
controls, Message and Map are quiet, reduced motion is a small toggle, a position strip coloured by level sits
above the bar, and a one-time hint shows on the first scene. What remains:

**What.**
- The position strip is display only, so scenes past 10 can be reached only through the map.
- The level pills look like buttons and do nothing; "Code" never lights up, and nothing says why (map only).
- Only focus is styled; buttons and clickable nodes have no hover or pressed state.
- The `(+)` expand marker is the only sign a node is clickable.

**Wanted.**
- Each strip segment clickable, with the scene title as its tooltip.
- Level pills either jump to the first scene at that level or are styled as a status readout; "Code" explains
  itself on hover or links to the map.
- Hover and pressed states on every button and clickable node.

**Touches.** `scripts/site/base.css`, `runtime.js`, the page template in `scripts/build-site.mjs`.

## S8. Map

**What.**
- Open, the map still shows the scene's control bar state ("S01 . 0/2") and gives no sign that Map is active.
- The detail panel is one long scroll: responsibility, bullets, a full diagram, several file trees.
- In the "How to read this" ladder, "Map only" for the Code level is plain text.

**Wanted.**
- The Map button shows pressed, and the map has a visible Close button.
- Short in-panel anchors (What it does, Inside, Files, Appears in), or file trees collapsed by default.
- "Map only" is a link that opens the map.

**Touches.** `scripts/site/runtime.js`, `scripts/build-site.mjs`, `_config/information-architecture.md`.

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
