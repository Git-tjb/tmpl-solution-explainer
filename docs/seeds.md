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
S2 to S10. Scene numbers in those seeds refer to that run. Most items are template defects (the runtime, the
notation and build rules); a few are that run's content and would be fixed in an instance, not in the template,
and each seed says which. The viewer's closing test is S10.

## S2. Highlight and dimming hide the point of a scene

**What.** When a scene has a highlight, every edge without `.hl` drops to 35% opacity, including the edges the
scene just traced. In S07 to S10 the traced arrow renders dark on black and its label ("may graduate into",
"are copied into", "deploy instructions and skills into") is unreadable. Dimmed node text and edge labels
(S03, S07, S10) fall far below readable contrast. The `(+)` expand marker on a dimmed node is dimmed with it
(S10, Projects).

**Wanted.**
- A traced edge and its label render at full opacity in the highlight colour.
- Dimmed means quiet but readable: raise node dimming to roughly 55 to 60%, and never dim text below 4.5:1.
- Interactive markers stay at full opacity.

**Touches.** `_config/standards/notation.md` (`--c-dim`), `_config/build-rules.md` line 81 (today dimmed text
needs only 3:1; this asks for 4.5:1), `scripts/site/base.css` and `runtime.js` (the opacity rules),
`scripts/verify.mjs` (a contrast check at each step).

## S3. Layout defects: wrapping controls, overflowing text, truncated copy, empty first frame

**What.**
- The control bar breaks at 1440 wide. On S09, S11 and S12 the long scope label makes "Message (P)", "Map (M)"
  and "Reduced motion (R)" wrap to two or three lines and clip off the bottom of the screen.
- In S11 and S12 the type line ("[EXTERNAL] Company KB vault", "[DECISION] Entry instructions") runs to or past
  the node edge, and the decision diamond cannot hold its label.
- Copy is cut mid-thought: "The right reference, and nothing else ..." (S12 step 9), "designing a new ..." (S05,
  Projects). This one is also run content: the source text was too long for its slot.
- S01 opens on an empty frame at step 0: a diagram title, an empty box and a legend.

**Wanted.**
- No control ever wraps. Truncate the scope label first, with a tooltip for the full text.
- Wrap the type line or widen the node; size the diamond to its label.
- Fit the full text or rewrite it shorter; the build fails on truncation rather than cutting.
- Show the system node at step 0, or give the first scene a real title state.

**Touches.** `scripts/site/base.css` and `runtime.js`, `scripts/render-diagrams.mjs` (node and diamond sizing),
`scripts/verify.mjs` (checks for wrapped controls, text outside its shape, truncation, and an empty first
frame), `_config/build-rules.md`.

## S4. Diagrams: use the space, cut the noise

**What.**
- Diagrams are small for the room they have. S08's content is 280 units wide inside an 800-wide viewBox, so
  three boxes sit in a narrow strip beside a blank half screen. S05 and S11 leave a large empty band below. The
  legend sets the width. Body text inside diagrams lands near 13px at 1440 wide.
- S12's routing is hard to follow: four "gives" labels stack, three "routes to" labels float away from their
  lines on dotted leaders, and lines cross.
- Each scene shows three titles that say the same thing: the page heading, a level badge, and an in-diagram
  title ("Functions: AI Workshop"); the control bar repeats the heading again, truncated.
- The legend is heavy: two rows on S09 to S12, repeated on every scene, with a "focus" swatch even when nothing
  is focused.
- Edge labels like "shape +2", "gate writes into +5" and "read bound vaults from +1" mean nothing to a
  first-time viewer.

**Wanted.**
- The viewBox hugs the content (the legend does not set the width) and the diagram scales to fill the figure
  area; body text at least 16px rendered at 1440 wide.
- Re-lay out fan-shaped flows cleanly: decision on the left, destinations in a column, output on the right, one
  shared label, branch labels sitting on their lines.
- Drop the in-diagram title in scenes (keep it in the map) and the truncated heading from the control bar.
- Show only the symbols present in the current diagram, on one quiet row, or behind a "Legend" toggle.
- One plain summary label per line; the full list goes to the map panel.

**Touches.** `scripts/render-diagrams.mjs`, `_config/standards/layout-profile.json`, `views.md`, `flows.md`
(label rules), `scripts/site/runtime.js` (legend, titles).

**Needs thought.** A 16px floor interacts with the 9-element and 12-node limits: bigger text means fewer nodes
per view, or a bigger canvas.

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

**What.**
- The bar is the loudest thing on screen: four filled pills in three colours plus four outlined level pills, all
  in caps.
- Progress is one cue ("S06 . 2/2" in mono).
- The level pills look like buttons and do nothing; "Code" never lights up, and nothing says why (map only).
- Nothing tells a visitor how to drive it.
- Only focus is styled; buttons and clickable nodes have no hover or pressed state.
- The `(+)` expand marker is the only sign a node is clickable.

**Wanted.**
- Prev and next are the only filled controls; Message and Map are quiet secondary buttons; Reduced motion moves
  into a small settings affordance.
- A segmented progress strip, one segment per scene, coloured by level, each clickable with the scene title as
  its tooltip. This also reaches scenes number keys cannot (S11 to S13).
- Level pills either jump to the first scene at that level or are styled as a status readout; "Code" explains
  itself on hover or links to the map.
- A one-time hint on the first scene: arrow keys or Space to advance, M for the map, click a `(+)` node for
  detail.
- Hover and pressed states on every button and clickable node.

**Touches.** `scripts/site/base.css`, `runtime.js`, the page template in `scripts/build-site.mjs`,
`_config/visual-direction.md`.

## S7. Colour and type

**What.**
- Orange does four jobs: the focus highlight (#ff9900), the message block (#ff9966), the prev/next buttons, and
  the Flow level. In S11 an orange traced line sits under an orange Flow frame.
- Scene titles and the L1 level share the same peach, so on L2 and L3 scenes the title differs from everything
  else that marks the level.
- The sidebar is decoration below 1600px wide: its labels are hidden and its lower three blocks never change.
- Condensed all-caps titles wrap to four lines in the 230px text column (S03, S11, S12), pushing the message
  down.
- One-word last lines on titles and messages.

**Wanted.**
- Bright orange reserved for focus only; Flow gets its own colour; the message block gets a neutral treatment
  with a thin level-coloured rule.
- Titles coloured by the current level, or neutral.
- A sidebar that carries information at every width (level name, scene number, progress), or a single
  level-coloured rail.
- A wider text column (the diagram has room once it hugs its content), or titles capped at two lines by sizing
  to length.
- `text-wrap: balance` on titles and the message.

**Touches.** `_config/visual-direction.md` (token roles), `_config/standards/notation.md` (level colours),
`scripts/site/base.css`.

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

## S10. Acceptance for the next iteration

**What.** The viewer's "done when", kept as the seed for the next iteration's acceptance criteria. Every scene at
every step, at 1440x900 and 1920x1080, has: no clipped or wrapped controls, no text outside its shape, no
truncated copy, traced edges and their labels at full strength, dimmed text still readable, and diagram body
text at 16px rendered or larger. A first-time visitor can tell from the first screen how to advance and where
they are in the deck. `check-design` and `verify` pass.

**Needs thought.** `verify` already runs scripted checks (AC-1 to AC-18) at two viewports; most of these are new
checks to add there, not new viewports. Which can be scripted (wrapping, overflow, truncation, contrast, font
size) and which need a human look (a diagram that shows the problem, clean routing) belongs in the requirements.
