# Stage 02: Scope

**Purpose:** Define the message: one core sentence, who it is for, what is in and what is deliberately
out. This is the highest-leverage edit point in the run.

Run the commands from the workspace root.

## Inputs
| Layer | Path | Use |
| --- | --- | --- |
| 4 | `../01_discover/output/fact-sheet.md` | the facts |
| 4 | `../01_discover/output/system-model.yaml` | the elements to choose from |
| 4 | `../01_discover/output/flows.yaml` | the candidate usage examples |
| 3 | `../../_config/run.md` | audience, intent, opening, takeaway, length, include/exclude |
| 3 | `../../_config/narrative-arc.md` | the sections to plan |
| 3 | `../../_config/information-architecture.md` | the rules the plan must allow |

**Do NOT load:** `../01_discover/output/sources/` (the fact sheet already holds what is needed); any later stage.

## Process
1. Write the core message: the answer-first statement, one sentence.
2. Confirm the opening order from `run.md`, or propose a change with the reason.
3. Map audience and intent to emphasis. With two intents, plan a section per intent.
4. Choose the in-scope functions (each gets an L3 view) and one or two flows as usage examples.
5. List what is deliberately excluded, including everything in `must_exclude`, and why.
6. Say whether a secondary intent would make the primary one shallow within the time budget.
7. Write `scope.md` with the frontmatter below, then the reasoning in prose.
8. Run `node scripts/check-model.mjs --scope` and fix what it reports.
9. Run `node scripts/stamp.mjs 02`.

```yaml
---
core_message: "<one sentence>"
opening: outcome-first          # or story-first
intents: [educate]              # one or two
in_scope: [<function ids>]     # get L3 views
example_flows: [<flow ids>]     # one or two
excluded: [<element ids or topics>]
target_scenes: 10               # 8-12
---
```

## Outputs
| File | Destination |
| --- | --- |
| `scope.md` | `output/` |

## Verify
- [ ] Every ID in the frontmatter exists in the model or flows (`check-model --scope`)
- [ ] Nothing in scope is a new fact or element
- [ ] The core message is one sentence a listener could repeat

## Human Check
Approve the scope: the core message, what is in, what is out. Edit `scope.md` in place, then run
`check-model --scope` and `stamp.mjs 02` again. Nothing advances without this.
