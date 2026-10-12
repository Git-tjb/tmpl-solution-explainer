# Workspace: Solution Explainer

## Overview
Discovery snapshots the solution's sources and turns them into a cited fact sheet, a system model, and
flows (`_config/standards/`). Scope and storyboard decide what to say and in what order; design decides how
each view and scene looks and moves. Build and verify are scripted: every diagram is rendered from the
model, and the explainer is a static page set checked in three browsers.

## Stage Map
| Stage | Does | Reads | Writes |
| --- | --- | --- | --- |
| `01_discover` | Snapshot sources; fact sheet, system model, flows, conflicts | `_config/run.md`, the sources | `stages/01_discover/output/` |
| `02_scope` | Core message, audience framing, what is in and out | `01_discover/output/` | `stages/02_scope/output/` |
| `03_storyboard` | 8-12 scenes and the map | `02_scope/output/`, `01_discover/output/` | `stages/03_storyboard/output/` |
| `04_design` | Tokens, view specs, scene specs, previews | `03_storyboard/output/`, the model | `stages/04_design/output/` |
| `05_build` | Render diagrams and build the page set | `04_design/output/`, `03_storyboard/output/`, the model | `stages/05_build/output/` |
| `06_verify` | Scripted checks, content and design review | `05_build/output/site/`, the model, the fact sheet | `stages/06_verify/output/` |
| `07_retro` | The run's retro, from `_config/retro.md` | every stage's `output/` | `stages/07_retro/output/` |

Each stage's `CONTEXT.md` lists its exact inputs. Scripts run from the workspace root (`scripts/`).

## Stage Discipline
Run one stage at a time. After a stage writes to its `output/`, stop. A human reviews or edits before the
next stage runs. Never write outside the current stage's `output/`. `_config/standards/` is never edited in
a run.

Every stage ends with `node scripts/stamp.mjs <nn>`, which records the inputs it was built from.
`node scripts/status.mjs` shows each stage as not run, done, or stale (an input changed after it ran). A
stale stage is re-run before anything reads its output, so a fix upstream always flows through.

## Filing
Nothing in this instance files itself. When the operator declares the run complete, `Close-Instance` (in
`aiso-workbench`) archives the whole instance, explainer and retro included, into the project's folder in
its KB vault. Copying the explainer anywhere else is the operator's manual step.

## Known Limits
- `function` is the element type most likely to be ambiguous outside software; record hard calls in the
  retro.
- The 9-element and 12-node limits are starting defaults, to be tuned from retros.
- Automatic layout can't guarantee positions across levels on its own; view-spec pins carry it.
