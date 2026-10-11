# Stage 01: stage

## Inputs
| Layer | Path | Use |
| --- | --- | --- |
| 4 | `../{{prev}}/output/` | {{what to take from it}} |
| 3 | `../../_config/{{file}}.md` | {{constraint}} |
| 3 | `references/{{file}}.md` | {{constraint}} |

## Process
{{numbered steps; what, not how; no harness features, models, shells, or OS paths}}

## Outputs
| File | Destination |
| --- | --- |
| `{{file}}.md` | `output/` |

## Verify
<!-- Optional: cross-stage checks (ICM §6.2 proto-debugger). -->
