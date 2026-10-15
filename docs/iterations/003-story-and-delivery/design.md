# Iteration 003 Design: Story and Delivery

How the template changes to meet `requirements-prompt.md` (rev 3, agreed 2026-10-15, every open question at its
default). Requirements say *what*; this says *how*. Each section names the requirements (R) and the sources it
serves (S = seed in `docs/seeds.md`; O and A = trial run 2's gate feedback, through its retro).

The build follows the workstreams (W1-W6, with W3b added after W3 by addendum D8) in order, on branch `claude/iteration-003`, with one gate with the
operator after each. Each workstream updates the fixtures it needs and ends with the dry run passing. Approved
by the operator 2026-10-15.

## Root causes found in 0.2.0

These come from reading the code, so the fixes aim at causes, not symptoms:

| Symptom | Cause |
| --- | --- |
| The explainer opens on the answer, and the problem comes later (R1-R3) | `narrative-arc.md` puts `answer` first; `check-storyboard` fails any S01 that is not `answer` at L1 |
| Problem scenes show the finished solution (S5, O16) | The only pictures are views of the system model, which holds the solution as it is now. Nothing captures the old way or what hurt, so there is nothing else to draw |
| The same picture four times (S5) | Nothing compares scenes' pictures; `check-storyboard` *requires* the close to show S01's view |
| A line repeats the message (S5) | `text` is a list of bare strings; nothing compares a line with `point` or ties it to facts (A17) |
| Mixed reveal behaviour (S5) | Each scene spec chooses its own `show-text` steps; no rule spans scenes |
| Every explainer spends a scene on levels (R9) | `orientation` is a required section with its own layout; AC-16 checks its position |
| Pills and strip do nothing (S6) | The rungs are `<li>`, and the strip is an `aria-hidden` `<ol>`; neither has a handler |
| The map shows stale state and no pressed button (S8) | `openMap` changes nothing in the bar; the Map button has no `aria-pressed`; the map has no close control |
| One long panel (S8) | `build-site` writes every panel section in sequence and shows file trees at full length |
| No hover or pressed state (S6) | `base.css` styles `:focus-visible` only |
| Style references could not be used (A12) | `visual_references` is free text, and URLs need a page fetch that does not return the styles |
| The draft ran over time (A5) | Minutes are summed only after the scenes are written |
| The explainer is a folder (S1) | `build-site` writes a page set with linked assets, and no step packages it |

## D1. Setup and discovery capture the problem (W1; R16, R17; O16, A12)

- **Setup questions.** `setup/questionnaire.md` gets a new block, "The user and the problem", before
  sources. It writes new `run.md` fields:

| Field | Question |
| --- | --- |
| `user` | Who uses the solution: the role, in the operator's words |
| `user_goal` | What they were trying to get done |
| `before` | How it was done before the solution existed (tools, steps, people) |
| `pains` | What hurt, one item per pain (one to four) |

  Each answer is recorded verbatim. Stage 01 quotes each one as an `OPN` note, the same as `opening` and
  `intent_notes` today.
- **Visual references (A12).** `visual_references` becomes a list of typed entries:
  `{ kind: colour | font | image | url, value, note }`.
  - A `colour` is a hex value.
  - A `font` is a family name, with a path when the operator has the file.
  - An `image` is a path.
  - A `url` stays allowed, but question 10 now asks for its colours, fonts or a screenshot as well, because
    a page fetch does not return a site's styles.
- **Title visual direction (R17, R1).** A new field records the operator's choice:
  `title_visual: { from: model | image, image: <path>, licence: <text>, note: <the operator's words> }`.
  The default is `from: model`.
- **Snapshot.** `snapshot-sources.mjs` also copies every `image` and `font` reference, and the title image,
  into `01_discover/output/visual-refs/`, recorded in `provenance.yml`. Stage 04 may load that folder. Nothing
  is read from the original location afterwards (D-2 holds).
- **The before model (O16, open question 2).** Stage 01 writes `before-model.yaml`, validated by a new
  `_config/standards/before-model.schema.json` and described in a new section of `system-model.md`, "The
  before model". It is small, conceptual, and holds no solution:

| Type | It is | Drawn as |
| --- | --- | --- |
| `person` | The user, or another person in the old way | stadium (the actor shape) |
| `task` | What they were doing | rounded rectangle |
| `means` | What they did it with: a tool, a document, a place, a manual step | rectangle, dashed outline |
| `pain` | One thing that hurt, in at most 12 words | notched tag, heavy left bar |

  - **Relationships.** Each has a verb, as in the system model. A `pain` has exactly one `hurts` line, to the
    element or relationship it is about.
  - **Sources.** Every element and relationship cites facts.
  - **Size.** At most 9 elements, pains included (the per-view limit).
- **Facts.** The extraction guide gets a new topic, `before` (the user, the goal, the old way, what hurt).
  It is filled from the new `OPN` notes and from any source that describes the earlier state. The fact sheet's
  `purpose` topic keeps the solution's purpose.
- **Checked** (`check-model`):
  - the schema
  - every citation exists
  - every pain has one `hurts` line
  - at least one `person` and one `pain`
  - **no solution in the picture**: no before element shares an ID, `name`, or `exact_name` with a
    system-model element, and none is named in `canonical_names`
- **Gate.** The operator reviews `before-model.yaml` with the system model at stage 01's gate. Both go in the
  "Review these" table.

## D2. The arc: title, problem, answer (W2; R1-R3, R6, R9; S5)

`narrative-arc.md` and `information-architecture.md` change to this arc:

| # | Section | What it does | Level |
| --- | --- | --- | --- |
| 1 | `title` | The solution's name, its purpose line, and the title visual. Exactly one scene | title |
| 2 | `problem` | Who the user is, what they were doing, and what hurt, on before views. One or two scenes | before |
| 3 | `answer` | The core message in one sentence, over the L1 picture | L1 |
| 4 | `why` | The outcomes, each one the answer to a pain from section 2. Optional; folded into `answer` when time is short | L1 or before |
| 5-8 | `structure`, `segmentation`, `build`, `in-use` | Unchanged | L2, L3, flow |
| 9 | `close` | The core message again, over a picture the opening did not show | any |

- **The orientation section is removed** (R9). So are the `orientation` layout, the `key` level, and
  information-architecture rule 5. The levels move to the Levels control (D5).
- **The purpose line** is a new `scope.md` field, `purpose_line`, written at stage 02 beside `core_message`.
  It is one sentence and cites facts. The title scene uses it as its message.
- **Checked** (`check-storyboard`):
  - S01 is `title`; the next scenes are `problem`; then `answer` at L1.
  - Every `problem` scene shows a before view (R2, R5), and the first one's view contains a `person`.
  - The last scene is `close`, with `returns_to` naming the answer scene.
  - The close's picture (its view plus its highlight) is not shown by any of the first three sections, and it
    is not the answer scene's picture. This replaces "the close shows S01's view" (R6). The default is the L2
    wired view with the example flow's path, or the before view with each pain answered.
- **Budget.** The table is updated: title 0.5, problem 1.5, answer 1, why 1, then as before. 8-14 scenes, and
  the title and problem scenes count.
- **Problem before design.** The segmentation section's "naive alternative first" may use the before view.
  When it does, the repeat rule (D3) applies.

## D3. Every scene earns its picture (W2; R4-R8, R18; S5, A5, A17)

`scenes.json` moves to `schema_version: 2`:

- **Budget first (R18, A5).** A required `budget` list, `[{ section, scenes, minutes }]`, is written at step
  1 of stage 03, before any scene. `check-storyboard` checks two things: the budget totals at most
  `target_minutes`, and each section's scenes total at most its allocation (with 0.25 minutes of slack per
  section).
- **Lines with facts (R18, A17).** `text` items become `{ line, facts: [F…] }`, with at least one fact per
  line. A scene's `facts` stays required (it covers the message), and A18's case is gone with the orientation
  scene.
- **Lines read beside their facts.** `check-storyboard` writes `03_storyboard/output/lines.md`, which lists
  every on-screen line with the claim text of each fact it cites, so the operator can judge at the gate
  whether the facts carry it.
  - It fails a line that cites no fact, or a fact that is not in the sheet.
  - Whether the facts *carry* a line stays a judgement for the gate.
- **Lines add to the message (R7).** `check-storyboard` flags a line whose content words mostly repeat the
  scene's `point`: more than 60% of the line's content words, after stop words and a simple stem, appear in
  the point. The flag is a WARN in the report and a marked row in `lines.md`, not a failure. The gate
  decides.
- **Repeated pictures (R4).** A scene whose view an earlier scene used must carry `adds`: one line on what
  it adds (a highlight, a reveal, a zoom). Two checks enforce it:
  - `check-storyboard` fails a repeat without `adds`.
  - `check-design` fails a repeat that adds nothing: the same view, the same `highlight`, and the same set of
    reveal actions as the earlier scene.
- **Problem scenes show the problem (R5).** This is enforced by the section rule in D2. A scene elsewhere that
  states a pain sets `about: problem`, and must then show a before view.
- **One reveal behaviour (R8).** `scene-specs.yaml` gets a required top-level
  `text_reveal: per-step | with-scene`. `check-design` enforces it on every scene with text:
  - `per-step`: line *n* is shown by its own `show-text` step, in order, one line per step.
  - `with-scene`: there are no `show-text` actions, so every line is visible at step 0.
- **Storyboard.** `stages/03_storyboard/CONTEXT.md` changes in four ways:
  - Step 1 writes the budget.
  - Step 2 names the before views.
  - The Verify list adds `lines.md`.
  - The Human Check reads `lines.md` beside the storyboard.

## D4. The pictures: before views and the title visual (W3; R1, R2, R5)

- **Before views.** `scenes.json` `views` accepts `level: before` with `scope: before`. The view spec has the
  same shape as an L1 spec: elements, states, pins. `render-diagrams` lays a before view out with the same
  ELK pipeline and layout candidates (D-22) and the same measured text and floor (D-23).
  - **Layout.** `person` nodes take the first layer, so the user leads the picture.
  - **Notation.** `notation.md` adds the four types to the element table. A pain uses neutral structure
    colours and takes the focus colour only when a step highlights it, so no new colour role is added (D-19
    holds).
  - **Badge and legend.** The badge reads `BEFORE`, and the legend shows the types drawn.
  - **Map.** The map stays the solution's reference layer, so before elements get no panels.
- **The title visual (open question 1).** The title scene's figure is one of:
  - **`art` (the default).** `render-diagrams` draws `title-art.svg` from a wired L2 view's laid-out
    geometry: the system boundary, its functions and stores, the actors and externals, and the lines. It is
    drawn as a large schematic in neutral structure colours: shapes and lines, with no labels, legend or
    badge. Every shape keeps its `data-el`, so the visual traces to the model, and AC-9 checks it as drawn
    from data (banned pattern 10). A new entry kind, `assemble`, draws the boundary, then the parts in model
    order, then the lines, in 1200 ms. Reduced motion shows the end state (`build-rules.md`, Motion). The
    page sets the solution's name and the purpose line beside it, in the title scene's own layout, `title`.
  - **`image`.** When `title_visual.from` is `image`, stage 04 copies the snapshotted image into
    `04_design/output/title/` with a licence file, and the title scene spec names it with alt text.
    `check-design` fails when:
    - the type is not PNG, JPEG, WebP or SVG;
    - the file is over 2 MB;
    - an SVG has a script, a remote reference or an event attribute;
    - the licence file is missing;
    - `design-spec.md` has no "Title image" section recording the approval.

    Stage 04's banned-pattern self-check covers it, and stage 06 reviews it.
- **The level indicator** on the title and problem scenes shows no filled rung and a tag, "Title" or "Before",
  the way flows show "Flow". The strip segment for those scenes is neutral (`--text-muted`), so no colour
  takes a second role.

## D5. Levels on demand, controls, and the map (W4; R9-R15; S6, S8)

- **The Levels control (R9, open question 5).** "Levels" is a quiet button beside Map, with the key L. It
  opens a Levels panel, an overlay like the map, with:
  - the four rungs (Context, Functions, Components, Code), each with its line and the scenes that use it as
    links, drawn from data as the orientation ladder was;
  - two notes below: "Before: how it was done before" and "Flow: one way it is used, step by step", with
    their scenes.

  Its × control, L, and Escape close it. The map and the Levels panel never show together: opening one
  closes the other.
- **Level pills (R10).** Each rung in the bar becomes a button that opens the Levels panel scrolled to that
  rung. The current rung stays filled, so the indicator still shows the level (AC-16's first half). "Code"
  has the tooltip "Code: in the map only". Its row in the Levels panel says so and carries an "Open the map"
  button (R15).
- **Hover and pressed (R11).** `base.css` adds `:hover` and `:active` states to every button and every
  clickable diagram element (expand markers, map links):
  - **Buttons.** Hover lightens the border and background; pressed shifts 1px and darkens.
  - **Diagram elements.** Hover thickens the outline to 3px in `--text`, and pressed fills lightly.

  These use structure and text tokens only; focus keeps `--c-highlight`. Diagram elements also get
  `cursor: pointer`.
- **Clickable strip (R12).** Each strip segment becomes a `<button>` with the scene title as its tooltip and
  accessible name. The visible bar stays thin, and the click target is at least 16px tall. A click jumps to
  the scene at step 0, the same as a map link.
- **Overlay state (R13).** While the map or the Levels panel is open:
  - its button shows pressed (`aria-pressed="true"`, the pressed style);
  - the overlay has a visible × in its top corner;
  - the position readout says "Map" or "Levels" in place of the scene and step;
  - prev and next are disabled and dimmed;
  - the strip is dimmed.

  Closing restores all of it.
- **Map panels (R14).** Each panel opens with a row of jump links to its sections: What it does, Why
  separate, Relationships, Inside, Detail, Appears in. Only the sections the panel has are listed. File trees
  and file previews sit in collapsed `<details>`, one per path, labelled with the path. The panel scrolls to
  a section; the map does not move.

## D6. The single-file export and the deliverable (W5; R19-R21; S1)

- **Where (open question 3).** A new script, `export-single.mjs`, is stage 05's last step, after
  `build-site`. It reads `site/` and never writes to it, so the approved page set is unchanged.
- **What it does.**
  1. Inlines `tokens.css`, `base.css`, and a theme's `theme.css` as `<style>` blocks, in the page's order.
  2. Replaces every `url()` to a font or image with a data URI.
  3. Inlines `runtime.js`, escaping `</script`.
  4. Inlines the title image when there is one.
  5. Fails if any `src`, `href` or `url()` still points at a file (only `#…` and `data:` remain).

  The output is deterministic, so exporting twice gives the same bytes (AC-14).
- **Name (R21).** `<YYYY-MM-DD> - <instance> - explainer.html`.
  - `<instance>` is the workspace folder's name.
  - The date is the run's start: the earliest `copied_at` in `sources/provenance.yml`. It is fixed once
    stage 01 runs, so a rebuild keeps the name.
  - `--name <file>` overrides it.
- **The declaration (open question 4).** The script also writes `stages/05_build/output/deliverables.yml`:

```yaml
schema_version: 1
deliverables:
  - file: "2026-10-20 - example-run - explainer.html"   # relative to this file
    kind: explainer
    media_type: text/html
    sha256: "<hex>"
```

  - It names no project, KB vault or solution, and no stage writes to a KB vault (the gate rule).
  - Filing the declared file beside `Workflows/` is the workshop proposal "Run Deliverable Filing". Until
    that lands, the file reaches the vault inside the archive.
  - Used outside the workshop, the file simply stays in `05_build/output/`.
  - `stamp.mjs 05` covers both files.
- **Verified (R20).** `verify.mjs` gains `--single`: it runs the browser checks (AC-1 to AC-6, AC-13, AC-16,
  AC-17, AC-19 to AC-30) against the single file in the same three browsers at both viewports. It also runs
  the static checks that read the page (AC-9, AC-11). The results go in a `single` section of
  `verify-results.json`. Stage 06 runs both and reports each criterion for both. A new AC-31 checks four
  things:
  - the file exists and matches its declaration's `sha256`;
  - it references no file;
  - it has the same scenes and steps as the page set;
  - it passes every criterion the page set passes.

  Any criterion that fails only in the single file is named.

## D8. Problem figures (W3b; R2, R5; addendum)

Added at the W3 gate (2026-10-15, at the operator's request). Approved by the operator 2026-10-15. The requirements are unchanged; this is a better mechanism for R2 and R5. W3's before view is a
node-link map of the old way. A pain such as "every run started from nothing" or "the copies drifted" reads
better as a picture of the pattern than as a box on a map. Problem scenes can now use a small set of
conceptual figures. Each figure is still drawn by the renderer from the before model, cites its facts, and is
checked like any diagram. Freehand or illustrated pictures stay out (banned patterns 9 and 10, R2's
traceability, AC-6/22/28, AC-14).

- **Figures.** A before view gains `figure` (in its view spec, and mirrored in `scenes.json` `views`, as `mode`
  is) and a `subject`. The default figure is `map`, which is W3's view, unchanged.

| Figure | Shows | Subject | Data it needs |
| --- | --- | --- | --- |
| `map` | The old way as a node-link picture (W3) | — | the before model |
| `repeat` | The same task redone run after run, each run starting empty, with a restart mark between | a task | `recurs` on the task |
| `drift` | One thing as copies that diverge: versions fanning out from a common start | a means | `versions` on the means |
| `scatter` | What a task needs, spread over many places at uneven distances | a task | its relationships to 3 or more means or people |
| `gap` | Two steps with the link between them broken, and the pain sitting in the break | a relationship | a pain that hurts it |
| `wait` | Work piling up in front of one person or task: a stack of waiting items | a person or task | `queue` on it |
| `cost` | What it cost, as one to three measured bars on a common scale; in a `why` scene, before beside after | measure IDs | `measures` |

- **The user leads every figure.** Each figure draws the user (the `person` stadium) at its left, joined to
  the subject. So R2's "the picture centres the user and the problem" holds for every figure, and W3's
  check-design rule (the before view keeps the user) applies unchanged.
- **Every figure shows the problem.** Each figure draws the pains that hurt its subject as W3's pain tags, and
  `cost` draws its measures' labels and values. `check-design` fails a figure that shows neither.
- **The before model gains optional fields** (`before-model.schema.json`; `system-model.md`, The before
  model). Each cites facts:
  - `recurs: { every, shown }` on a task: `every` is the period in at most four words ("every week"); `shown`
    is how many runs to draw (3 to 6, default 4).
  - `versions: [{ label }]` on a means: 2 to 5 labels of at most four words each.
  - `queue: { size, label }` on a person or task: `size` is 2 to 12 items to draw; `label` names an item in
    at most four words ("requests").
  - Top-level `measures: [{ id, label, value, unit, after }]`. `label` is at most six words; `value` is a
    positive number; `after` is the value with the solution, optional, with its own sources.
- **Before and after belong in `why`.** A `cost` figure that shows `after` values (`compare: true` in the view
  spec) is allowed only in `why` scenes: an after value is a fact about the solution, and the problem scenes
  show no solution (R2).
- **Drawing.** Each figure is a small fixed composition, computed by the renderer without ELK.
  - Boxes and text use W3's `beforeBox` with measured text, the same SVG conventions (`.node.el` with
    `data-el`, `.edges`, badge, title, legend) and the same content box. The page's checks (AC-6, AC-19 to
    AC-28) and the 16px floor apply as to any view.
  - The layout fits the scene's figure area: it stretches along the wide axis, and `repeat` and `wait` choose
    how many marks to draw within the shown range. Under the floor, the build fails as for any view.
  - Figure-specific marks are geometry, never text: the restart arrow, the fan of versions, the queue stack,
    the broken link, the bar scale. The legend names each mark that is drawn.
- **Highlights.** A figure's states and step actions target the same IDs: the subject, its pains, the user, and
  `measure:<id>` for a bar. So reveals and highlights work as in any view, and `check-design` checks the
  targets.
- **Choosing a figure.** A new stage reference, `stages/03_storyboard/references/problem-figures.md`, says
  which figure fits which kind of pain, what data each needs, and what to do when the data is missing. The
  usual answer is a map, or asking stage 01 for the count. Stage 03 names a figure per before view, and
  stage 04's spec matches it. The reference is in the template, not a workshop skill, so the template still
  works outside the workshop.
- **Capture.** Setup question 6 adds an optional follow-up: for each pain, anything countable (how often, how
  long, how many places or copies, how much waited). The extraction guide records the answers as `before`
  facts, and stage 01 fills the new fields only from them, never by estimate.
- **Checks.**
  - `check-model` validates the new fields: the types they sit on, their ranges, and that every cited fact
    exists.
  - `check-design` validates each figure: the subject's type and its data, the user drawn, a pain or a measure
    shown, `compare` only in `why`, and targets that exist.
  - `verify`'s AC-9 counts figure elements as rendered from data, as for any view.
- **Fixtures.** S03 ("What hurt") becomes a `repeat` figure on the weekly work. The fixture before model gains
  `recurs`, `versions`, `queue`, and one measure. A W3b test variant renders every figure, `cost` with
  `compare` in a `why` scene included, and runs the page checks on them.

## D7. Checks and acceptance criteria (each workstream adds its own)

| AC | Change | Requirement |
| --- | --- | --- |
| AC-10 | The scripted part checks the new arc: title, problem, answer, and a close that shows a new picture. The review part adds "problem scenes show the problem" and "each picture earns its place" | R1-R6 |
| AC-16 | The orientation half is removed; the level indicator half is unchanged, including the Title and Before tags | R9, R10 |
| AC-9 | The title art and before views count as rendered from data; title art is exempt from the title, legend and type-label rules, and every shape must carry `data-el` | R1, R2 |
| AC-29 (new) | Every button and clickable diagram element looks different on hover and when pressed than at rest (computed style compared) | R11 |
| AC-30 (new) | Each strip segment lands on its scene. Opening the map and the Levels panel each shows its button pressed and its × control, and shows no scene position. L, Escape and × each close them. The Code rung's "Open the map" opens the map | R12, R13, R15 |
| AC-31 (new) | The single file is declared, references no file, and passes what the page set passes | R19-R21 |

The review list in `acceptance-criteria.md` gains:
- the title visual is specific to the solution and meets the banned list;
- the problem scenes show the problem, not the solution;
- lines add to their message (from `lines.md`).

## Changes to `docs/design.md`

- **Version** 0.3.0, with a history row.
- **Inventory.** Add `before-model.schema.json`, `export-single.mjs`, `deliverables.yml`, and `lines.md`.
- **Stage table.** Stage 01 writes `before-model.yaml`. Stage 03 writes `lines.md`. Stage 04 may write
  `title/`. Stage 05 also runs `export-single`. Stage 06 runs `verify --single`.
- **Script table.** Add `export-single`. Extend `check-model` (the before model), `check-storyboard` (arc,
  budget, lines, repeats), `check-design` (reveal rule, repeats, title image), and `verify` (`--single`,
  AC-29 to AC-31).
- **Decisions.**
  - **D-6 is replaced:** "Title, then the problem on its own before picture, then the answer; how to read the
    levels is a control, not a scene".
  - **D-29:** the before model is a second, small model that holds no solution.
  - **D-30:** the title visual comes from the model's geometry, or from an approved licensed image.
  - **D-31:** on-screen lines carry facts, and the budget comes before the scenes.
  - **D-32:** the run ships a single file and declares it as its deliverable, and nothing in the run files it.
- **Section 1.** "Diagrams are data" extends to the before model and the title art.
- **Interfaces.** `Close-Instance` now has a declared deliverable to read (consumed, through the proposal).
- **Known limits.** Gain the line-repeat heuristic (it is a word-overlap test, not a reading). The title art is
  a schematic, not an illustration.

## Workstreams

| W | Covers | Acceptance criteria (the gate checks these) |
| --- | --- | --- |
| W1 | D1: questionnaire, `run.md`, visual references, snapshot of references, before model (schema, standard, extraction guide, `check-model`), stage 01 contract | The fixture `run.md` has the new fields, and the snapshot copies its image reference. The fixture before model passes `check-model`. Negative tests fail it: a before element named after a solution part, a pain without `hurts`, and no `person` |
| W2 | D2, D3: arc, IA rules, `scope.md` `purpose_line`, scenes schema v2, budget, lines with facts, `lines.md`, repeat and reveal rules, stage 02-04 contracts | The fixture storyboard (title, problem, answer ... close on a new picture) passes. Negative tests: S01 not title, a problem scene on an L1 view, a repeated view without `adds`, a line with no facts, a section over budget, mixed reveals. The line-repeat WARN fires on a seeded line |
| W3 | D4: before views in the renderer, notation, title art and `assemble`, the title image path, the title layout | The fixture's before view renders at least 16px at both viewports with no solution element. Title art carries `data-el` on every shape and animates, or jumps under reduced motion. A run with a fixture title image passes `check-design`; an SVG with a script fails it |
| W3b | D8: problem figures (before-model fields, figure renderer, notation, `problem-figures.md`, setup follow-up, checks) | Each of the seven figures renders from fixture data at the 16px floor at both viewports. Each passes the page checks (AC-6, AC-19 to AC-28) in a test build, and every element in it carries a model ID. `check-model` rejects bad new fields. `check-design` rejects a figure missing its data, a figure without the user or without a pain or measure, and `compare` outside `why`. The dry run passes (AC-16 aside, as approved) |
| W4 | D5: Levels panel and key, pills, hover and pressed, clickable strip, overlay state, map panel sections | AC-16 (revised), AC-29 and AC-30 pass in three browsers at both viewports. The orientation scene and layout are gone |
| W5 | D6: `export-single`, `deliverables.yml`, `verify --single`, AC-31, stage 05 and 06 contracts | The single file opens offline with no other files. AC-31 passes. Exporting twice gives identical bytes. `site/` is byte-identical before and after export |
| W6 | Fixtures complete, documents (`docs/design.md`, README, standards, acceptance criteria), close | The dry run passes AC-1 to AC-31 in Chromium, Edge, and Firefox at 1920x1080 and 1440x900, for the page set and the single file. `verification.md` is written. `Test-Workspace -Template` and the scrub scan pass |

## What this does not change

- Everything iteration 002 made true: AC-1 to AC-28, the colour roles, the 16px floor, text never cut, and no
  themes in the template.
- Opens offline, with no server and no network requests; render and build are deterministic.
- 8-14 scenes in at most 15 minutes; one view, one level; structure diagrams only from the system model.
- `status.yml` keeps the workshop's standard fields only. No stage writes to a KB vault.
- Deferred: S9 small screens, S11 laned flows, S12 arrowhead colour, the retro's stage 01-02 areas, and
  presenter notes (O4).

## Risks

- **The title art may not read as "engaging".** A labelless schematic is honest and on-tone (the visual
  direction is an engineering schematic), but it is plain. The licensed-image path exists for runs that need
  more. Trial run 3 judges it, and W3's gate shows a mockup first.
- **Problem figures are a fixed vocabulary (D8).** A real pain may fit none of the six; the `map` stays the
  fallback, and a missing figure is a seed for a later iteration, not a reason for freehand art. Figures with
  counts (`repeat`, `wait`, `cost`) need numbers the operator may not have; the reference says to fall back
  rather than estimate.
- **The before model asks the operator for more at setup and at stage 01.** It is small (at most 9 elements)
  and mostly quotes the setup answers.
- **The line-repeat test is a heuristic.** It only flags lines, and the gate decides. The 60% threshold is a
  starting value, tuned on the fixtures and trial run 3.
- **The schema version bump** breaks any run built on 0.2.0. Instances never take template updates, so no
  live run is affected.
- **The single file's size.** The fonts are about 0.3 MB in base64; a large title image adds its own. The
  2 MB image limit keeps the file well under the size where browsers slow down.

## Version

At close, `docs/design.md` moves to 0.3.0. `docs/seeds.md` drops S1, S5, S6 and S8, and keeps S9, S11 and S12.
