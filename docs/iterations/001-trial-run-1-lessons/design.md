# Iteration 001 Design: Trial Run 1 Lessons

How the template changes to meet `requirements-prompt.md` (rev 4) and fix what trial run 1's retro found.
Requirements say *what*; this says *how*. Each section names the requirement or retro items it serves
(O = operator feedback, A = agent observation, from the trial run's `gate-feedback.md` files).

The build follows the workstreams (W1-W8) in order, one gate with the operator after each. This design is
reviewed and approved before W1 starts.

## D1. Model: `function`, names, and "what it does" (W2; rev 4 §3, §5.1; O8, O16, O17, O20)

- **Type rename.** `container` becomes `function` everywhere: `system-model.schema.json` enum, parent rules
  (`component` → parent `function`; `store` → parent `system` or `function`), `check-model`, the renderer's
  classes, `notation.md`, `views.md`, the scripts' level names, fixtures, and contracts.
- **Names.** `name` is the functional name ("Agent setup"). A new optional field `exact_name` holds the real
  name ("aiso-ops"). Diagrams, panels, and the expand popover show `name (exact_name)`. `check-model` warns
  (not fails) when a `function` has no `exact_name`.
- **`what_it_does`.** Optional list of 3-5 items, each `{ text, sources }`: `text` one line of at most 12
  words, `sources` at least one fact ID. `check-model` enforces the count, the length, and that each fact
  exists. One list per element, read by structure views, the expand popover, and map panels.
- **Terms.** `system-model.md` gains a Terms section: every element type and level, what it means here, and
  what it does *not* mean (a `function` is not a code function or a Docker container; a `store` is where
  data sits, not a service). Stage 01's contract has the agent show the operator this section at the first
  gate.
- **Zoom candidates.** A rule in `system-model.md`: anything the explainer may zoom into is a `function` with
  parts, never a `store`. Stage 01 settles the candidates with the operator (D8).

## D2. Levels, the level indicator, and orientation (W2, W3, W5; rev 4 §5.2, §5.3, §5.6, AC-16; O24, O25)

- **Names.** L1 Context, L2 Functions, L3 Components, L4 Code. View titles: "Context: X", "Functions: X",
  "Components: X", "Flow: X". The level ids in files stay `L1`-`L3` and `flow`.
- **The indicator** is a four-rung ladder (Context, Functions, Components, Code) defined once in
  `notation.md`. The current rung is filled; the others are outlined; the scope name sits beside it
  ("Components · Agent setup"). On a flow scene the ladder shows a "Flow" tag and fills the rungs its steps
  come from. It appears in two places:
  - the page chrome on every scene (`scripts/site/`), built from the scene's level and view, so it is
    identical in every scene and every theme (a theme may restyle it but not remove it);
  - a compact badge in every rendered SVG's title row (`L2 · FUNCTIONS`), so standalone diagrams and map
    views carry it too.
- **Orientation scene.** A new `section: orientation` with `level: key` and no view. `build-site` renders it
  from data, not from the model: the ladder drawn large, each rung with one line of what it shows and the
  scenes that use it (from `scenes.json`). Rules in `check-storyboard`: exactly one orientation scene, after
  the answer scene and before the first L2 or L3 scene.

## D3. Structure before wiring (W2, W6; rev 4 §5.3, §5.6, AC-18; O26)

- **Structure mode.** A view spec gets `mode: structure | wired` (default `wired`). In structure mode the
  renderer draws no reference lines, shows each element's `what_it_does` bullets inside its box, and lays the
  parts out as a grid (ELK `rectpacking`) inside the system or function boundary, so five functions fit the
  screen instead of a stack of layers.
- **Use.** The storyboard's segmentation section starts with a structure view of the functions (what each
  does) and then a wired view (how they reference each other). `check-storyboard` fails a flow scene that
  comes before the first structure scene.

## D4. Expanding an element (W5; rev 4 §2, AC-17; O20)

- **Affordance.** In any wired or flow view, an element with `what_it_does` shows a small expand marker on
  its box. Clicking it, or pressing Enter on it, opens a popover anchored to the element with its bullets;
  Escape or a second click closes it. The popover is HTML over the diagram, so the layout never moves.
- **Flow nodes** expand to their bound element's bullets.
- **Scripted.** The motion vocabulary gains `expand` and `collapse` (targets: element ids), so a reveal step
  can open a popover for the audience. `check-design` and `verify` treat an open popover as end state.
- **Data.** `build-site` embeds each element's `name`, `exact_name`, and `what_it_does` in the page data.

## D5. A run's own theme (W4; rev 4 §2, §9; O22)

- **No themes in the template.** The template keeps its one default look.
- **Hook.** Stage 04 may write `theme/` to its output: `theme.css` plus any fonts and their licences.
  `build-site` copies it into the site and loads `theme.css` after `base.css`.
- **What a theme can change.** `base.css` gains named, documented styling hooks: the frame (`.frame`,
  `.frame-top`, `.frame-side`, empty and invisible by default), the chrome bar, the scene header, the level
  indicator, buttons, panels, and every token. A theme restyles these; it doesn't replace the runtime or its
  markup. The hooks are listed in `build-rules.md`.
- **Checks still hold.** `check-design` reads tokens from `tokens.css` and then `theme.css` (theme values win)
  for the contrast checks; legibility, motion, and accessibility criteria apply to themed pages unchanged.
- **Banned list.** A theme's approved exceptions are listed in `design-spec.md`; stage 06's review accepts
  only those.

## D6. Scene mockups (W7; rev 4 §7 04_design; O23)

- **`scripts/mockups.mjs`** renders the diagrams and builds the page into `04_design/output/mockup/` (both
  scripts already take `--out`), then captures every scene at its final reveal step at 1920x1080 as
  `04_design/output/mockups/NN-SXX-<title-slug>.png`, numbered in storyboard order, and writes
  `mockups/index.html`, a contact sheet in the same order.
- **Contract.** Stage 04 runs it as its last step; the operator reviews the mockups at the gate.
  `render-diagrams --preview` stays for checking one view.

## D7. Legibility and renderer fixes (W6; rev 4 §12; A15-A21)

- **Pins** use ELK partitioning for top-level nodes (ported from the trial instance, A15). Pins on parts
  inside a boundary are documented as unsupported, and `check-design` warns if a spec has them.
- **Label bounds** count toward the SVG's size (ported, A16).
- **Label placement** treats every routed line segment as an obstacle as well as boxes and other labels, and
  tries positions to either side of a line before giving up; a label that still can't be placed is drawn
  beside its line's start with a leader, never over a box (A17).
- **Merged lines** show one verb plus a count ("file into +3"); the full list goes in the line's tooltip and
  the map panel (A18).
- **Width.** `layout-profile.json` gets one width per type: functions 260, components and stores 240, other
  elements 260 (was 300 for all). The text column narrows (min 340px, 24%). Together these fit four parts
  side by side beside text at 1080p (A21).
- **Full-width layout with text.** A new scene layout, `diagram-wide`: the diagram across the full width and
  the scene's text in one row below it (A19). `diagram` stays for a scene with no text.
- **Prediction.** `render-diagrams --preview` keeps its per-scene label-size warning, now for every layout.

## D8. Intake, discovery, scope, and narrative (W1, W3; rev 4 §6, §7, §5.6; O1-O3, O6, O7, O9-O16, O18, O19, O21, O25, O26, A9, A11)

- **Questionnaire.** Opening order as free text with examples; visual direction always asked (default look,
  or a run theme described with references); new questions 12 (where and how it runs) and 13 (intent and
  constraints). `run.md` frontmatter gains `opening` as text, `visual` (`default` or a short theme
  description), `environment`, and `intent_notes`.
- **Extraction guide.** New topics: `constraints`, `environment`, `principle` (the guiding principle behind
  the split), and `what-it-does`; `usage` asks for the solution's improvement loop. The fact-sheet section
  order follows.
- **Stage 01 contract.** New output `operator-notes.md` (the operator's statements, quoted, citable as
  `OPN`); a gate step that shows the operator the Terms section and settles zoom candidates; a gate answer
  that contradicts the sources goes into `conflicts.md`.
- **Scope.** `scope.md` frontmatter gains `depth` (default `conceptual`) and `map_only`; scope states depth
  first and excludes by depth. **Everything downstream reads `excluded`**: view defaults drop excluded
  elements, map panels and relationship lists skip them, `check-storyboard` doesn't require panels for them,
  and map detail paths under an excluded element are refused (A9, A13, O12).
- **Narrative arc.** Answer (L1) → orientation → why → functional structure → segmentation (wired) → zooms
  → usage examples → close. A table of zoom depth by target length and audience, and how the arc compresses
  when zooms are many (A11, O15).
- **Limits.** 8-14 scenes in at most 15 minutes: `scenes.schema.json`, `check-storyboard`, `narrative-arc.md`,
  acceptance criterion 7.

## D9. Process and small fixes (W8; A2, A3, A8, A14, O5, O27)

- Snapshot: `*.example` files pass the secret-file rule (A2).
- The template ships `.gitleaks.toml` allowlisting `.stamp.json` (A8).
- Standards examples use YAML block style for any value with a comma (A3).
- Every stage contract lists `gate-feedback.md` as an output and says what goes in it; `_config/retro.md`
  groups the retro by template area (O5, the trial run's method).
- `check-storyboard` notes when the map passes 25 panels (A14).

## D10. Fixtures and the dry run (W8)

The fixtures move to the new model (`function`, `exact_name`, `what_it_does`), and gain an orientation scene,
a structure view, an expand step, and a small fixture theme that exercises the theme hook. `dry-run.mjs`
also runs `mockups.mjs`. The iteration is done when the dry run passes every scripted criterion, including
16-18, in all three browsers at both viewports.

## Trial run 2

A new instance from the iterated template. Its sources include trial run 1's approved stage 01-03 outputs
(fact sheet, model, flows, operator notes, scope, storyboard), snapshotted like any other source, so
discovery updates them to the new model instead of starting over. Trial run 1's instance is discarded after
that, on the operator's confirmation.

## Version
The template stays in development. After this iteration, `docs/design.md` moves to version 0.1.0 and
describes the template as built.
