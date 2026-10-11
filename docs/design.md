---
component: tmpl-solution-explainer
kind: template
version: 0.0.0
---
# Solution Explainer Design

## 1. Purpose and Scope
Turns a finished solution's sources into a local, dark-mode explainer that the operator presents live over
a screen share: a narrated linear path of 8-12 scenes (at most 15 minutes) and a map as the reference layer.
Every diagram is a view of one cited system model, under shared standards, so explainers for different
solutions are structurally comparable.

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

## 3. Inventory
| Path | What it is |
| --- | --- |
| `AGENTS.md`, `CLAUDE.md`, `CONTEXT.md` | Layers 0 and 1 |
| `setup/questionnaire.md` | Per-run setup; writes `_config/run.md` |
| `_config/run.md` | Per-run answers (frontmatter read by scripts) |
| `_config/narrative-arc.md`, `information-architecture.md` | What every explainer says, in what order |
| `_config/visual-direction.md`, `banned-patterns.md`, `build-rules.md` | Look, anti-patterns, technical constraints |
| `_config/retro.md` | Retro sections |
| `_config/standards/` | The consistency layer: model, flows, views, notation, layout profile, and the schemas for every machine-read output. Never edited in a run. |
| `stages/01_discover` ... `07_retro` | Stage contracts and stage references |
| `scripts/` | Deterministic helpers (section 4) and the page runtime (`scripts/site/`) |
| `package.json`, `package-lock.json` | Pinned tooling |
| `vendor/fonts/` | Bundled open-licence fonts |
| `docs/fixtures/` | Made-up inputs for dry runs (never copied into an instance) |

## 4. Behavior

### Stages
| Stage | Agent work | Scripts | Gate |
| --- | --- | --- | --- |
| `01_discover` | fact sheet, model, flows, source index, conflicts | `snapshot-sources`, `inventory-sources`, `check-model` | resolve conflicts, correct the model |
| `02_scope` | `scope.md` | `check-model --scope` | approve the scope |
| `03_storyboard` | `scenes.json`, `storyboard.md` | `check-storyboard` | edit sequence and text |
| `04_design` | tokens, view specs, scene specs, design spec | `check-design`, `render-diagrams --preview` | approve the look |
| `05_build` | step through the result | `render-diagrams`, `build-site` | present it to yourself |
| `06_verify` | content-fidelity and banned-pattern review | `verify` | accept the report |
| `07_retro` | `retro.md` | — | close the run |

Every stage ends with `stamp.mjs <nn>`.

### Scripts (Node.js, run from the workspace root)
| Script | Reads | Writes | Fails when |
| --- | --- | --- | --- |
| `snapshot-sources.mjs` | `_config/run.md` `sources` | `01_discover/output/sources/<n>-<name>/`, `sources/provenance.yml` (origin, git commit if any, copy time) | a source is missing |
| `inventory-sources.mjs` | the snapshot | `01_discover/output/inventory.md` | — |
| `check-model.mjs [--scope]` | model, flows, fact sheet [, `scope.md`] | report to the console | any schema or integrity rule in `system-model.md` / `flows.md` fails; with `--scope`, an unknown ID in `scope.md` |
| `check-storyboard.mjs` | `scenes.json`, model, flows, `scope.md`, fact sheet | report | schema, IA rules marked (checked), talk time, map coverage |
| `check-design.mjs` | views, scene specs, `tokens.css`, `scenes.json`, model | report | view rules, scene/step coverage, action vocabulary, contrast below 7:1 |
| `render-diagrams.mjs [--preview]` | model, flows, view specs, `layout-profile.json`, `tokens.css` | SVG per view in `05_build/output/site/assets/diagrams/` (or `04_design/output/preview/`) | layout fails, a view breaks a rule |
| `build-site.mjs` | `scenes.json`, scene specs, `tokens.css`, the SVGs, the snapshot | `05_build/output/site/` | a scene, view, or panel is missing |
| `verify.mjs` | the site, `scenes.json` | `06_verify/output/verify-results.json`, `screenshots/` | never (results record failures) |
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
| D-6 | The answer section is two scenes (S01 at L1, S02 at L2) | The requirements ask for "the L1/L2 picture" first and also "one level per scene"; two scenes satisfy both |
| D-7 | Staleness by input hashes (`stamp` / `status`) | Satisfies "no later stage uses output built from a superseded input" without moving files or editing `status.yml` |
| D-8 | Tooling pinned in `package-lock.json`; `npm ci` and the Playwright browser install run when missing | V1 allows network use by stages; machine setup needs only Node.js |
| D-9 | Edge is tested through Playwright's `msedge` channel; Safari is not a target | Requirements (rev 3) |

### How the format meets the output-format requirements (AC-15)
| Requirement | How |
| --- | --- |
| Presented live over a screen share | Full-window page at 1920x1080 or 1440x900; legibility rules in `build-rules.md` |
| Opens locally and offline, no server, nothing to install | `file://`, no modules or fetch, everything bundled (fonts included) |
| Step forward and back through the path, one reveal at a time | Page runtime keyboard and on-screen navigation; hash per scene and step |
| Map as a second, non-linear layer with direct jumps | Map overlay (M) from the L1/L2 views; a panel per element; deep links to scenes |
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
| T-2 | A dry run on `docs/fixtures/` passes every stage's scripts and every scripted criterion | `manual: copy the fixtures into place, run stages 01-06's scripts, read verify-results.json` |
| T-3 | Rendering and building twice gives byte-identical output | `verify.mjs` (AC-14) |
| T-4 | The scrub scan finds no configured term | `Test-Scrub.ps1` (pre-commit) |

## 6. Known Limits
- **Build phase 2 pending:** `scripts/`, `package.json`, `vendor/fonts/`, and `docs/fixtures/` described above
  don't exist yet. Until they do, stages can be read but not run.
- In development: no `v1.0.0` tag; no run has happened. Whether it earns a release is decided after the
  first trial run's retro; no second solution is lined up.
- `container` is an adaptation of C4 and is the type most likely to need refining.
- The element (9) and node (12) limits are untested defaults.
- Pins may prove brittle for keeping positions across levels; the fallback is fixed coordinates in the view
  spec, still rendered from the model.
- Whether the tooling installs on a company-managed machine is unverified.

## 7. History
Requirements: "Solution Explainer ICM Workflow (V1)", rev 3 (2026-10-11), drafted in a session and to be
filed as a proposal in the KB vault.
