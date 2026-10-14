# Iteration 002 Design: Legibility and Correctness

How the template changes to meet `requirements-prompt.md` (rev 1, agreed 2026-10-14). Requirements say
*what*; this says *how*. Each section names the requirements (R) and the sources it serves (S = seed in
`docs/seeds.md`; O and A = trial run 2's stage 04 gate feedback).

The build follows the workstreams (W1-W6) in order, on branch `claude/iteration-002`, one gate with the
operator after each. Each workstream ends with the dry run passing. This design is reviewed and approved before
W1 starts.

## Root causes found in 0.1.0

Read from the code, so the fixes aim at causes, not symptoms:

| Symptom | Cause |
| --- | --- |
| Traced edge dark on black (S2) | `trace` adds `.traced` but not `.hl`; `has-hl` dims everything without `.hl` to 35% |
| Dimmed text illegible (S2) | Dimming is group `opacity: 0.35`, which applies to text too; contrast then depends on the colours underneath |
| Expand marker dimmed (S2) | The marker sits inside the node group, so it inherits the group's opacity |
| Diagrams small (S4) | The SVG carries its intrinsic `width`/`height` with `max-width: 100%`, so it only ever shrinks; its width is `max(content, 640, legend, title)`, so a small view gets a wide canvas |
| Text over the box edge (S3, A8, A10) | Text width is estimated with one average glyph width (0.56 em); type lines and boundary titles are never wrapped or measured against their box |
| Copy cut mid-thought (S3, A14) | `wrap()` cuts at a line limit and appends an ellipsis |
| Three titles (S4) | The page header, the SVG title row, and the chrome's `.title` each show the scene title |
| Controls wrap (S3) | The chrome is a wrapping flex row with a growing title and an unbounded scope label |
| Colour doing four jobs (S7, O13) | Notation lets type, highlight and human colours be any accent; nothing checks that two roles differ |
| 1440x900 failures unseen until verify (A15) | `render-diagrams --preview` predicts 1920x1080 only |

## D1. Fold in trial run 2's patches, made general (W1; R1; A13, O6, O8, O13, O15)

The instance patches worked but were specific to that run (a hardcoded system id, LCARS hex fallbacks, a file
detected from its extension). They come into the template in general form:

- **File shape.** `system-model.schema.json` gains an optional `form: file` on `store` elements (a store that is
  one file, such as a YAML config). The renderer draws it with the folded-corner shape and the type label
  `[file]`; the legend shows "file". `system-model.md` Terms says when a store is a file. No extension guessing.
- **Element level from the model.** A shared helper in `scripts/lib/common.mjs` derives each element's level
  from the hierarchy: `actor`, `external`, `system` are L1; a `function`, or a `store` whose parent is the
  system, is L2; a `component`, or a `store` inside a function, is L3. No system id is hardcoded.
- **Level key only where levels mix.** A view whose drawn elements (or flow nodes' bound elements) come from
  more than one level marks each node with its level (`lv-L1`...) and adds a level key to its legend. A
  single-level view does neither.
- **Level colours as tokens.** New required tokens `--lv-1`, `--lv-2`, `--lv-3`, `--lv-flow` (D2). No colours in
  the renderer.
- **The scene's message on the scene.** `build-site` renders each scene's `point` as a marked statement under
  the title; a "Message" control and the P key show or hide it (on by default). Its treatment is neutral text
  with a thin rule in the current level's colour (S7), not the highlight colour.
- **Check.** A fresh dry run reaches every trial run 2 behaviour with no script patches (R1).

## D2. Colour means one thing (W2; R16, R17; S7, O5, O9, O13)

- **Roles.** `notation.md` gets a colour-role table. Each role has its own token, and each token one role:

| Role | Token(s) | Used for |
| --- | --- | --- |
| Focus | `--c-highlight` | what the current step highlights or traces, and keyboard focus. Nothing else |
| Level | `--lv-1`, `--lv-2`, `--lv-3`, `--lv-flow` | the level badge, the indicator's current rung, the message rule, the progress strip (D6), level outlines in mixed views |
| Structure | `--c-system`, `--c-internal`, `--c-actor`, `--c-external`, `--c-human`, `--c-edge` | element outlines and lines; **neutral** (low chroma). Types differ by shape and line style, as the element table already defines |
| Quiet | `--c-dim`, `--text-dim` (new) | dimmed outlines and dimmed text (D3) |

- **Default look.** `visual-direction.md` sets the structure tokens to neutrals, keeps one focus accent, and adds
  four level colours that differ in hue from it and from each other.
- **Enforced.** `check-design` (also run on a run theme's `:root` values) fails when: a structure token has
  more than low chroma (OKLCH C > 0.04); two role colours are closer than 30 degrees of OKLCH hue, or
  either has too little chroma to read as a colour (C < 0.06). The thresholds live in `build-rules.md`.
- **Titles and focus.** Scene titles are neutral (`--text`); the level is carried by the badge, the rung and the
  message rule. A focused element's name renders bold, and its outline takes the focus colour (O9).
- **Navigation.** Prev and next are the only filled controls, in neutral text-on-surface; no accent (S6 is
  otherwise deferred).

## D3. What the scene is about stays at full strength (W2; R2-R5; S2, O11)

- **Dimming without opacity on text.** Dimming no longer sets group opacity. A dimmed element's outline takes
  `--c-dim`, its fill stays, and its text takes `--text-dim`, a token that must meet 4.5:1 against `--bg` and
  `--surface` (`check-design`). The result is quiet and its contrast is known. Lines dim the same way.
- **Traced is highlighted.** `trace` marks the edge as highlighted, so a traced edge and its label render at
  full strength in the focus colour at every later step. A highlighted edge's label text takes the focus
  colour too.
- **Markers never dim.** The expand marker is drawn in its own layer above the nodes, so dimming a node never
  reaches it.
- **Flows.** In a flow view a highlight emphasises the chosen steps (focus outline, bold label) and dims nothing
  else, so one highlighted step never makes the rest of the flow look switched off (R3).
- **Rule change.** `build-rules.md`: dimmed text at least 4.5:1 (was 3:1). `notation.md` Highlight states is
  rewritten to match.

## D4. Diagrams use their space (W3; R10, R11, R13, R14, R15; S4, A7, A9)

- **The content sets the extent.** The renderer computes the drawn content's bounds (nodes, boundaries, edge
  labels) and records them in `layout.json` as `content` beside the full `box`. The legend and the title row no
  longer widen the canvas.
- **Fill the figure.** In scenes the SVG is inlined with its `viewBox` set to the content box, and sized to the
  figure area (`width`/`height: 100%`, aspect preserved), so it scales up as well as down. Upscaling is capped at
  1.6x so a three-box view does not turn into poster type; `build-site` writes the cap per diagram from
  `layout.json`.
- **One title.** The SVG keeps its title row and badge (a standalone diagram and the map still need them), but
  the scene's content `viewBox` leaves the title row out. The chrome's title element is removed. The page
  header is the scene's one title (R13).
- **Legend in the page.** The renderer records each view's legend entries (types present, line kinds, levels if
  mixed) in `layout.json` and still draws the SVG legend for standalone use. Scenes and the map render the
  legend as one HTML row under the figure: only what is drawn, smaller and muted, never wider than the figure.
  The "focus" entry shows only while the step has a highlight. If the row would wrap, it collapses behind a
  "Legend" control (R14).
- **Plain line labels.** A merged line shows one plain verb with no count; the view spec may give it a better
  `label`, and `check-design` notes merged lines that have none. The full list stays in the line's tooltip and
  the map panel. L1 views draw no line labels (R15, O12).
- **Layout chosen for the screen.** For each wired structure view and each flow, the renderer lays out a small,
  fixed set of candidates (structure: top-to-bottom and left-to-right, with neighbours of a boundary placed in
  side columns; flows: a set of aspect-ratio targets) and keeps the one with the largest rendered text size in
  the scene's figure area at 1440x900, the tighter viewport. Ties keep the earlier candidate, so output stays
  deterministic. This recovers the height that top-to-bottom layering cost (A7) and gives flows a width they
  can meet (A9). Pins still apply and narrow the candidates.
- **The floor.** If no candidate reaches 16px rendered at both viewports, `render-diagrams` fails for that view
  and names what drives the size (D7). The 12-node flow limit stays unless that happens on the fixtures.

## D5. Text fits its shape and is never cut (W3; R7, R8, R12; S3, S4, A8, A10, A14)

- **Measured text.** The renderer measures text with the bundled fonts' real advance widths. A small script
  extracts the per-glyph widths from the IBM Plex packages into `_config/standards/font-metrics.json` once
  (committed, pinned to the font version), and the renderer uses them. A run theme's font is measured by the
  browser instead (D7).
- **Wrapping.**
  - The name and the exact name go on separate lines, the exact name smaller (A8).
  - Paths wrap at `/`.
  - The type line wraps instead of running past the box. A flow node's bound-element name goes on its own
    line.
  - `what_it_does` bullets wrap fully; the box grows (A14).
  - A boundary is at least as wide as its title (ELK minimum size) (A10).
  - A decision diamond is sized from its label so the label fits inside the inscribed rectangle.
- **Never cut.** `wrap()` no longer truncates. When text needs more lines than its shape allows (a name over 3
  lines, a flow label over 4), `render-diagrams` fails, naming the scene, the element and the stage that owns
  the text (stage 01 for model text, stage 03 for flows and scene text). The fix is to shorten the source text
  at that stage (R8).
- **Branching flows.** Edges leaving one node with the same label are drawn with one shared label near the
  source. A decision's branch labels are placed on their own line's first segment. ELK crossing minimisation runs
  at higher thoroughness. Crossings and label placement are reviewed at stage 06 (R12).

## D6. Page layout and the control bar (W4; R6, R9, R18, R21; S3, S6 minimum, S7)

- **The bar never wraps.** One non-wrapping row. Its contents are:
  - prev and next (filled)
  - the position readout
  - the level indicator
  - Message and Map as quiet buttons
  - reduced motion as a small toggle
  The scope label truncates first, with its full text in a tooltip and the indicator's accessible name.
  Labels are short; the keys are in each button's tooltip.
- **Position (R21).** The readout says "3 / 13 · step 2 of 4". A thin strip above the bar shows one segment per
  scene, coloured by level, with the current one marked. It is not clickable in 002; jump-by-click is S6.
- **First-screen hint (R21).** On the first scene, a one-line hint: "→ or Space to advance · M for the map ·
  click ⊕ for detail". It hides after the first advance and stays hidden for the rest of the session.
- **First frame has content (R9).** `check-design` fails a scene whose step 0 hides every element of its view
  and shows no text. The fixture's answer scene shows the system at step 0.
- **Titles and the text column (R18).** Titles and the message use `text-wrap: balance`. The text column widens
  to `minmax(400px, 28%)`; the diagram has the room now that it fits its content. `build-site` picks one of three
  title sizes from the title's measured width so it fits in two lines at 1440x900. Over two lines at the
  smallest size fails the build, naming the scene (stage 03 shortens it).

## D7. Checked, not found (W5; R19, R20; S10, A11, A15)

- **Preview at both viewports.** `render-diagrams --preview` reports, per scene, the rendered label size at
  1920x1080 and 1440x900 in one table. For a view under the floor, it names what drives the size: the tallest
  layer or the widest row, and the neighbour or element that adds it (A11, A15).
- **Mockups measure.** `mockups.mjs` captures every scene at both viewports. It measures label sizes and text
  fit in the browser, so a run theme's fonts are checked too, and writes the numbers beside the contact sheet.
- **New scripted criteria** in `verify.mjs`, at every scene and every reveal step, both viewports, three
  browsers:

| AC | Checks | Requirement |
| --- | --- | --- |
| AC-19 | Highlighted and traced elements, edges and edge labels render at full opacity in the focus colour | R2 |
| AC-20 | Expand markers are never dimmed; dimmed text meets 4.5:1 as rendered (computed fill, no opacity) | R4, R5 |
| AC-21 | Every control is one line high and inside the viewport | R6 |
| AC-22 | Every text element lies inside its shape or boundary | R7 |
| AC-23 | No on-screen text ends in an ellipsis or is clipped | R8 |
| AC-24 | Step 0 of every scene shows at least one diagram element or text line | R9 |
| AC-25 | Exactly one scene title is visible; the diagram shows no second title | R13 |
| AC-26 | Titles and messages are at most two lines | R18 |
| AC-27 | The first scene shows the hint and the position readout | R21 |

  AC-6 (diagram text at least 16px) already runs at both viewports; it now runs at every step.
- **Human review.** `stages/06_verify/references/acceptance-criteria.md` adds to the stage 06 review list:
  branch labels and crossings (R12), plain line labels (R15), and whether colour reads as one meaning per role
  (R16).

## D8. Fixtures, documents, and the dry run (W6)

- **Fixtures** gain cases that exercise the new behaviour:
  - a `form: file` store
  - a mixed-level flow with a decision fan
  - a traced edge in a highlighted scene
  - a long scope name and a long title
  - a merged line with a spec label
  - a view small enough to scale up
  The fixture theme moves to the colour roles (D2).
- **Documents.** The following are updated to match:
  - `notation.md`: roles, highlight states, file shape, level key
  - `views.md`: title, legend, labels
  - `build-rules.md`: 4.5:1, the colour thresholds, chrome, title fit, keys
  - `visual-direction.md`: default tokens
  - `system-model.md`: `form: file`
  - the acceptance criteria
  - `docs/design.md`: version, decisions D-19 onward, known limits, history
  - the README where behaviour changed
- **Done** when the dry run passes AC-1 to AC-27 in all three browsers at both viewports and `check-design`
  passes on the fixtures.

## Workstreams

| W | Covers | Ends with |
| --- | --- | --- |
| W1 | D1: patches folded in, general form | dry run shows file shape, level key in a mixed view, focus swatch, message toggle |
| W2 | D2, D3: colour roles, tokens, dimming, traced, markers, flows | `check-design` enforces roles and 4.5:1; dry run shows traced edges at full strength |
| W3 | D4, D5: content extent, fill, legend, labels, layout candidates, measured text, no truncation | every fixture view renders ≥16px at both viewports with nothing cut |
| W4 | D6: control bar, position, hint, first frame, titles | no control wraps at 1440x900; hint and position on the first scene |
| W5 | D7: preview, mockups, AC-19 to AC-27 | the new criteria run and pass on the fixtures |
| W6 | D8: fixtures, documents, close | dry run passes AC-1 to AC-27, three browsers, both viewports; `verification.md` written |

## What this does not change

- No themes in the template, offline delivery, deterministic output, and the 16px and 20px floors are unchanged.
- The 8-14 scene range and the 9-element limit are unchanged; the 12-node flow limit is unchanged unless D4's
  floor check says otherwise on the fixtures.
- Trial run 2's archive is not touched. Its LCARS theme would now fail D2's colour-role check, as expected:
  the next run builds its own theme under the new rules.

## Risks

- **Measured text** depends on extracting glyph widths from the bundled fonts. If the packages don't expose
  them cleanly, the fallback is a per-character width table measured once in Chromium and committed.
- **Layout candidates** multiply ELK runs per view (2-4x). Render time on the fixtures is a few seconds today;
  W3 reports it.
- **Upscaling cap (1.6x)** is a judgement. The first trial at both viewports may move it.
- **The colour thresholds** (chroma 0.04 and 0.06, 30 degrees of hue) are starting values, tuned on the
  default look and the fixture theme in W2.

## Version

At close, `docs/design.md` moves to 0.2.0. `docs/seeds.md` drops S2, S3, S4, S7 and S10, and A13 is
recorded as done. S1, S5, S6, S8 and S9 remain.
