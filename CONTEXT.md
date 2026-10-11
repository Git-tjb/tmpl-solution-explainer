# Workspace: Solution Explainer

## Overview
{{the mechanism this workflow runs on, 2–4 sentences}}

## Stage Map
| Stage | Does | Reads | Writes |
| --- | --- | --- | --- |
| `01_stage` | {{job}} | {{inputs}} | `stages/01_stage/output/` |
| `02_retro` | The run's retro, from `_config/retro.md` | every stage's `output/` | `stages/02_retro/output/` |

## Stage Discipline
Run one stage at a time. After a stage writes to its `output/`, stop. A human reviews or edits before the
next stage runs. Never write outside the current stage's `output/`.

## Filing
{{which outputs are filed to the KB vault, under project `{{project_name}}`}}. Filing is human-triggered
through the filing skill (schema.md §13).

## Known Limits
<!-- Conditional: only if something is unresolved. -->
