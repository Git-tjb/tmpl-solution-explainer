---
component: tmpl-solution-explainer
kind: template
version: 0.3.0
---
# Solution Explainer Design

## 1. Purpose and Scope
Turns a finished solution's sources into a local, dark-mode explainer that the operator presents live over
a screen share: a narrated linear path of 8-14 scenes (at most 15 minutes) and a map as the reference layer. It
opens on a title scene, then the user and the problem they had, then the solution as the answer. Every picture
is drawn from data, under shared standards, so explainers for different solutions are structurally
comparable: the diagrams are views of one cited system model, the problem pictures views of a small cited
model of how it was done before, and the title art the system model's own geometry. The run ends with the
explainer as a page set and as one self-contained file, declared as the run's deliverable.

Not in scope (V1): copies or leave-behinds for the audience; hosting or publishing; speaker notes or a
presenter view; light mode; awareness of earlier explainers (diffs, continuity); a formal design system;
any stage filing into a KB vault or copying into a solution repo; automated checks for sensitive content
(the operator clears content at the gates); running stages offline or in a no-network sandbox.

## 2. Interfaces
| ID | Interface | Implements or consumes |
| --- | --- | --- |
| I-2 | `status.yml` | implements (standard fields only; stage state lives in stage outputs) |
| I-3 | Instance and template shape, Layer 0 and 1 slots | implements |
| I-4 | Gate rule | implements (`trigger: manual`) |
| — | `New-Workspace`, `Close-Instance` | consumed; no starter files (sources are snapshotted by stage 01 instead) |
| — | `stages/05_build/output/deliverables.yml` | implements: the run's deliverable, for the close-out to file (workshop proposal "Run Deliverable Filing") |

## 3. Inventory
| Path | What it is |
| --- | --- |
| `AGENTS.md`, `CLAUDE.md`, `CONTEXT.md` | Layers 0 and 1 |
| `setup/questionnaire.md` | Per-run setup; writes `_config/run.md` |
| `_config/run.md` | Per-run answers (frontmatter read by scripts) |
| `_config/narrative-arc.md`, `information-architecture.md` | What every explainer says, in what order |
| `_config/visual-direction.md`, `banned-patterns.md`, `build-rules.md` | Look, anti-patterns, technical constraints |
| `_config/retro.md` | Retro sections, with gate feedback grouped by template area |
| `_config/gate-feedback.md` | The format of each stage's `gate-feedback.md` |
| `_config/standards/` | The consistency layer: model and before model, flows, views, notation (colour roles, before views, problem figures, title art), layout profile, the bundled fonts' measured widths (`font-metrics.json`), and the schemas for every machine-read output (deliverables included). Never edited in a run. |
| `stages/01_discover` ... `07_retro` | Stage contracts and stage references (`03_storyboard/references/problem-figures.md`: which picture fits which problem) |
| `scripts/` | Deterministic helpers (section 4), shared code (`scripts/lib/`, including `page-checks.mjs`, the in-page checks verify and the mockups share), and the page runtime (`scripts/site/`: `runtime.js`, `base.css`) |
| `package.json`, `package-lock.json` | Pinned tooling: elkjs, yaml, ajv, playwright, @axe-core/playwright, and the IBM Plex fonts (OFL) from @fontsource |
| `docs/fixtures/` | Made-up inputs for dry runs: run answers, a source folder, and stage 01-04 outputs including a small run theme (never copied into an instance) |
| `docs/iterations/` | Iteration records: requirements, design, and verification per iteration |
| `docs/seeds.md` | Open improvement ideas between iterations; it exists only while it holds one |
| `.gitleaks.toml` | Secret scanning with the default rules, allowing `.stamp.json` hash files |

## 4. Behavior

### Stages
| Stage | Agent work | Scripts | Gate |
| --- | --- | --- | --- |
| `01_discover` | operator notes, fact sheet, model, before model, flows, source index, conflicts | `snapshot-sources`, `inventory-sources`, `check-model` | confirm the Terms and zoom candidates; resolve conflicts; correct the model and the before model |
| `02_scope` | `scope.md` (core message, purpose line, depth, in scope, map only, excluded) | `check-model --scope` | approve the scope |
| `03_storyboard` | the budget, then `scenes.json`, `storyboard.md` | `check-storyboard` (writes `lines.md`) | edit sequence and text; read each line beside its facts |
| `04_design` | tokens, a run theme if `visual` asks for one, view specs (problem figures), scene specs (title visual, `text_reveal`), a title image if the run brings one, design spec | `check-design`, `render-diagrams --preview`, `mockups` | approve the look from the mockups |
| `05_build` | step through the result | `render-diagrams`, `build-site`, `export-single` | present it to yourself |
| `06_verify` | content-fidelity and banned-pattern review | `verify`, `verify --single` | accept the report |
| `07_retro` | `retro.md` | — | close the run |

Every stage from 01 to 06 logs its gate's corrections in `gate-feedback.md`, and every stage ends with
`stamp.mjs <nn>`.

### Scripts (Node.js, run from the workspace root)
| Script | Reads | Writes | Fails when |
| --- | --- | --- | --- |
| `snapshot-sources.mjs` | `_config/run.md` `sources`, `visual_references`, `title_visual` | `01_discover/output/sources/<n>-<name>/`, `visual-refs/`, `sources/provenance.yml` (origin, git commit if any, copy time) | a source or a referenced file is missing; a visual reference is not typed |
| `inventory-sources.mjs` | the snapshot | `01_discover/output/inventory.md` | — |
| `check-model.mjs [--scope]` | model, before model, flows, fact sheet [, `scope.md`] | report to the console | any schema or integrity rule in `system-model.md` / `flows.md` fails (including `what_it_does`); the before model holds a solution part, a pain with nothing to hurt, or figure data on the wrong type; with `--scope`, an unknown or excluded ID, no purpose line, a bad depth, or more than 14 target scenes |
| `check-storyboard.mjs` | `scenes.json`, model, before model, flows, `scope.md`, fact sheet | report; run alone, also `03_storyboard/output/lines.md` | schema, IA rules marked (checked): title, problem, then answer; problem scenes on before views; a repeated view without `adds`; a close on a picture the opening showed; structure before wiring; the budget; lines without facts; `excluded` and `map_only`, talk time, map coverage. Warns on a line that repeats its message |
| `check-design.mjs` | views, scene specs, `tokens.css`, `theme/`, `title/`, `scenes.json`, model, before model | report | view rules and modes, before views and problem figures (subject, data, the user, a pain or measure, `compare` only in `why`), scene/step coverage, action vocabulary (incl. expand targets), one `text_reveal`, a picture repeated with nothing added, the title visual and a title image (type, size, safe SVG, licence, approval), a scene whose step 0 is empty, theme contents, contrast (text 7:1, dimmed text 4.5:1), colour roles; notes merged lines with no plain label |
| `render-diagrams.mjs [--preview]` | model, before model, flows, view specs, `layout-profile.json`, `font-metrics.json`, `tokens.css`, theme tokens, scene specs | SVG per view (before views and problem figures included), `title-art.svg`, and `layout.json` (content box, legend, positions) in `05_build/output/site/assets/diagrams/` (or `04_design/output/preview/`) | layout fails, a view breaks a rule, text is too long for its shape, or a scene's diagram would render below the label floor (the preview warns instead) |
| `build-site.mjs` | `scenes.json`, scene specs, `tokens.css`, `theme/`, `title/`, the SVGs, the snapshot | `05_build/output/site/` (scenes, the map, the Levels panel) | a scene, view, or panel is missing; a title or message cannot fit in two lines |
| `export-single.mjs [--name <file>]` | `05_build/output/site/`, `sources/provenance.yml` | `05_build/output/<YYYY-MM-DD> - <instance> - explainer.html`, `deliverables.yml` (never `site/`) | the page references a file it cannot inline |
| `mockups.mjs` | scenes, scene specs, model, views, tokens | `04_design/output/mockup/`, `mockups/` (PNG per scene at both viewports, `index.html`, `measurements.json`) | when Chromium cannot start |
| `verify.mjs [--single]` | the site (or, with `--single`, the declared single file), `scenes.json`, view specs, models | `06_verify/output/verify-results.json` (`single` section with `--single`), `screenshots/` (`screenshots/single/`) (AC-1 to AC-31) | never (results record failures) |
| `font-metrics.mjs` | the @fontsource packages | `_config/standards/font-metrics.json` (template tool; re-run when the font packages change) | when Chromium cannot start |
| `dry-run.mjs` | `docs/fixtures/` | every stage's output, in the template only (gitignored) | any script fails |
| `stamp.mjs <nn>` | the stage's declared inputs | `stages/<nn>_*/output/.stamp.json` (sha256 per input) | — |
| `status.mjs` | every stamp | report: not run, done, or stale per stage | — |

Rendering and building are deterministic: no timestamps or random IDs in output; ELK runs with a fixed seed
and model order; the same inputs give byte-identical files.

### Design decisions
| ID | Decision | Why |
| --- | --- | --- |
| D-1 | **Output format: a static HTML page set** (`index.html` + `assets/`), opened from `file://` | Meets every output-format requirement (table below); the alternatives (slide decks, PDF, video) fail the map, deep links, or automated checks |
| D-2 | Sources are snapshotted by stage 01's first step into its own output, not by `New-Workspace` starter files | Sources can be anywhere (repos, KB vault folders), not only the project's KB vault folder; the snapshot stays inside the gate rule (a stage writes only its own output) and travels with the archive |
| D-3 | Layout with elkjs (layered), rendered to SVG at build time | Built for directed node-link diagrams with ports; deterministic with a fixed seed; nothing runs at presentation time |
| D-4 | A fixed page runtime in the template (`scripts/site/`) and a fixed motion vocabulary (`build-rules.md`) | Build becomes scripted and every run's navigation, map, and reveals behave the same and can be tested the same way |
| D-5 | Every machine-read output has a schema in `_config/standards/` (`scenes`, `view`, `scene-spec` added to the two the requirements named) | The handoffs between agent stages and scripts are checked, not assumed |
| D-6 | Title, then the problem on its own before picture, then the answer as one L1 scene; how to read the levels is a control (Levels, L), not a scene; the first L2 scene is a structure view in its own section | The explainer opened on the answer and spent a scene on levels; the problem was told over pictures of the solution (iteration 003, D2, D5; replaces iteration 001's answer-then-orientation) |
| D-7 | Staleness by input hashes (`stamp` / `status`) | Satisfies "no later stage uses output built from a superseded input" without moving files or editing `status.yml` |
| D-8 | Tooling pinned in `package-lock.json`; `npm ci` and the Playwright browser install run when missing | V1 allows network use by stages; machine setup needs only Node.js |
| D-9 | Edge is tested through Playwright's `msedge` channel; Safari is not a target | Requirements (rev 3) |
| D-10 | Edge labels are placed by the renderer on each edge's longest free segment, not by ELK | ELK's centered labels add a layer of height per edge; at 1080p that alone pushed views below the 16px label minimum |
| D-11 | Label and text minimums are measured as rendered, and scale with viewport height below 1080p; chrome and padding scale in `vh` | The requirement is legibility on the shared screen; a fixed-pixel check at 900p would fail every view the 1080p check passes |
| D-12 | Fonts come from @fontsource packages (pinned), copied into the site with their licence | Replaces a hand-maintained `vendor/fonts/` |
| D-13 | The C4 `container` type is `function`: elements are named by what they do, with the real name as `exact_name`, and carry 3-5 sourced `what_it_does` items | Trial run 1: "container" read as Docker, and the audience needed to know what each part does (iteration 001, D1) |
| D-14 | One level indicator, defined in `notation.md`, in the page chrome and as a badge in every diagram | Every scene shows its level the same way, in every theme (iteration 001, D2) |
| D-15 | "What it does" opens as an HTML popover over the diagram, and can be scripted with `expand` / `collapse` | The layout never moves, and the presenter can open it for the audience (iteration 001, D4) |
| D-16 | No themes in the template; a run may bring `theme/` (CSS, fonts, licences) over named styling points | Keeps the template's look neutral while letting a run have its own, under the same checks (iteration 001, D5) |
| D-17 | Stage 04's gate reviews scene mockups (`mockups.mjs`), not loose diagram previews | The operator judges the look as the audience will see it (iteration 001, D6) |
| D-18 | `excluded` in `scope.md` is honoured by every later stage and script | Excluding an element must remove it everywhere, map included (trial run 1, O12) |
| D-19 | Colour has roles, one meaning each: focus, four level colours, neutral structure; `check-design` enforces them in OKLCH on the default look and any theme | One colour did four jobs in trial run 2 (iteration 002, D2) |
| D-20 | Dimming changes colour, not opacity: dimmed text has its own token at 4.5:1; traced lines count as highlighted; a flow highlight dims nothing | The line a step was about was the darkest thing on screen (iteration 002, D3) |
| D-21 | A scene shows only the diagram's drawn content, scaled to fill its figure (capped at 1.6x), with the legend as an HTML row below; the page header is the one title | Diagrams used a fraction of their space and showed three titles (iteration 002, D4) |
| D-22 | Each view is laid out in a small fixed set of candidates and the one with the largest labels at both viewports is kept; under the floor, the build fails | Top-to-bottom layering cost the height trial run 2 needed (iteration 002, D4) |
| D-23 | Text is measured with the bundled fonts' widths and never cut: too long for its shape fails the build, naming the stage that owns the text | Trial run 2 cut copy mid-sentence and ran text past its boxes (iteration 002, D5) |
| D-24 | Boundary titles wrap to their boundary and sit in a gap between crossing lines, or under a halo when the floor leaves no room; AC-28 still flags the halo case | ELK ignores a minimum size on nested nodes; lines ran through titles (iteration 002, W5) |
| D-25 | The control bar never wraps; a position strip and a first-screen hint tell a viewer where they are and how to advance | Controls wrapped and clipped at 1440 wide; nothing told a viewer how to drive it (iteration 002, D6) |
| D-26 | Legibility is checked at every scene and step, at both viewports, in three browsers (AC-19 to AC-28), and measured in the mockups at design | A viewer found what the scripted checks never looked at (iteration 002, D7) |
| D-27 | Titles and messages are fitted in the browser; the build predicts the fit only for the default look | A run theme's fonts and column are not measurable at build time (iteration 002, W7) |
| D-28 | A popover is placed beside, below, or above its box, never over its marker, and has its own close control | A popover could cover the only control that closed it (iteration 002, W7) |
| D-29 | A second, small model, the before model, holds the user, the old way, and what hurt; it holds no solution, and the problem scenes draw only from it | Nothing captured the problem, so problem scenes showed the finished solution (iteration 003, D1; retro O16) |
| D-30 | The title visual is the system model's own geometry drawn as a schematic (shapes and lines, every shape with its model ID), or an approved, licensed image | An engaging visual specific to the solution that stays traceable and offline (iteration 003, D4) |
| D-31 | The storyboard allocates minutes per section before scenes; every on-screen line cites the facts that carry it, and `lines.md` puts them side by side for the gate | The draft ran over time, and lines the facts did not carry were found only at verify (iteration 003, D3; retro A5, A17) |
| D-32 | A run ships its explainer as one self-contained file beside `site/`, verified the same way, and declares it in `deliverables.yml`; nothing in the run files it | One file to open or share; filing is the workshop's step (iteration 003, D6; seed S1) |
| D-33 | Problem scenes may use problem figures (repeat, drift, scatter, gap, wait, cost) instead of the map: fixed compositions drawn from the before model, the user always first, with data only from facts | A pattern of what hurt reads better than a box on a map (iteration 003, D8) |
| D-34 | The map and the Levels panel are one-at-a-time overlays with a close control; while one is open the bar names it and shows no scene state; every control has hover and pressed states, checked with real pointer input | The map left stale state in the bar and gave no sign it was active; only focus was styled (iteration 003, D5; seeds S6, S8) |

### How the format meets the output-format requirements (AC-15)
| Requirement | How |
| --- | --- |
| Presented live over a screen share | Full-window page at 1920x1080 or 1440x900; legibility rules in `build-rules.md` |
| Opens locally and offline, no server, nothing to install | `file://`, no modules or fetch, everything bundled (fonts included); also one self-contained file that opens alone |
| Step forward and back through the path, one reveal at a time | Page runtime keyboard and on-screen navigation; hash per scene and step |
| Map as a second, non-linear layer with direct jumps | Map overlay (M) from the L1/L2 views; a panel per element with what it does, in short sections; deep links to scenes; the strip and the Levels panel (L) jump to scenes too |
| Animate on trigger, static end state, reduced motion | Motion vocabulary on Web Animations; every step has an end state; reduced motion jumps to it |
| Diagrams generated from the model | `render-diagrams` is the only way a diagram enters the site |
| Checkable automatically | Playwright and axe-core in `verify.mjs` |
| Same on every workshop machine | Pinned tooling, deterministic render and build |
| Buildable by an agent from text | Every input is YAML, JSON, Markdown, or CSS; no GUI step |

## 5. Acceptance Criteria
The criteria for a run's explainer are in `stages/06_verify/references/acceptance-criteria.md`. For the
template itself:

| ID | Criterion | Check |
| --- | --- | --- |
| T-1 | The template has the workshop shape | `Test-Workspace.ps1 -Path <template> -Template` |
| T-2 | A dry run on `docs/fixtures/` passes every stage's scripts and every scripted criterion | `node scripts/dry-run.mjs` |
| T-3 | Rendering and building twice gives byte-identical output | `verify.mjs` (AC-14) |
| T-4 | The scrub scan finds no configured term | `Test-Scrub.ps1` (pre-commit) |

## 6. Known Limits
- In development: no `v1.0.0` tag. Trial run 1 closed at the stage 04 gate and iteration 001 applied its
  retro; trial run 2 was presented, and iterations 002 and 003 applied a viewer's review of it and its retro.
  Trial run 3 is the next test; whether the template earns a release is decided after it.
- `function` (formerly `container`) is an adaptation of C4 and is the type most likely to need refining.
- The element (9) and node (12) limits, the 8-14 scene range, the depth meanings, and the zoom table in
  `narrative-arc.md` are starting points, to be tuned after real presentations.
- Pins work on top-level nodes only; pins on parts inside a boundary or lane have no effect.
- Narrower boxes (iteration 001) make two-line names more common, so tall views reach the 16px label limit
  sooner; the preview warns, the build refuses, and the fix is to narrow or split the view.
- A laned flow cannot wrap into rows (ELK lays lanes out as one row), so beyond about seven steps it falls
  below the label floor in a `diagram-wide` scene; the fixture flow is unlaned for that reason. The 12-node
  flow limit holds for unlaned flows.
- A line can still pass under a boundary title (with a halo) when no gap is wide enough and wrapping the
  title would cost the view its label floor; AC-28 reports it, and stage 04 narrows the view.
- A traced line's arrowhead keeps the line colour; the line and its label take the focus colour.
- In a crowded view a line label can still land on another line when no free spot exists; AC-28 reports it.
- `check-model` notes, but does not decide, when a store's exact name looks like one file without `form: file`.
- An L3 view laid out left to right keeps its L2 neighbours' order only approximately.
- The figure sizes `render-diagrams` predicts with (`FIGURE` in `scripts/lib/common.mjs`) are derived from
  `base.css`; a change to the page layout must update both.
- Whether the tooling installs on a company-managed machine is unverified.
- The check that a line adds to its message is a word-overlap heuristic (over 60% of its content words in the
  message); it warns, and the stage 03 gate decides.
- The title art is a schematic of shapes and lines with no names; a run that needs more brings a licensed image.
  It assembles whenever the title scene is reached other than by stepping back, including when the page opens.
- Problem figures are fixed compositions, trimmed to what they draw, not stretched to the figure area; `repeat`
  and `wait` draw exactly the runs or items the data gives. A figure that would fall below the label floor fails
  the build like any view. A pain that hurts a relationship points at the relationship's target. The vocabulary
  is fixed; a pain that fits none of the figures uses the map.
- AC-29 checks the first four controls of each kind, with real pointer input (stylesheet rules cannot be read
  from `file://`).
- The single file's date is the run's start (the first source copy), so a run built across days keeps the date
  it began.

## 7. History
| Version | Date | What changed |
| --- | --- | --- |
| 0.0.0 | 2026-10-11 | First build from the requirements "Solution Explainer ICM Workflow (V1)", rev 3 |
| 0.1.0 | 2026-10-12 | Iteration 001 (`docs/iterations/001-trial-run-1-lessons/`): trial run 1's lessons, requirements rev 4 |
| 0.2.0 | 2026-10-14 | Iteration 002 (`docs/iterations/002-legibility-and-correctness/`): legibility and correctness, from a viewer's review of trial run 2 and its retro |
| 0.3.0 | 2026-10-15 | Iteration 003 (`docs/iterations/003-story-and-delivery/`): title, problem, then answer; the before model and problem figures; every scene earns its picture; levels on demand, controls, and the map; single-file export and the deliverable |
