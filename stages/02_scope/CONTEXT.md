# Stage 02: Scope

**Purpose:** Define the message: one core sentence, who it is for, what is in and what is deliberately
out. This is the highest-leverage edit point in the run.

Run the commands from the workspace root.

## Inputs
| Layer | Path | Use |
| --- | --- | --- |
| 4 | `../01_discover/output/fact-sheet.md` | the facts |
| 4 | `../01_discover/output/system-model.yaml` | the elements to choose from |
| 4 | `../01_discover/output/before-model.yaml` | the user and what hurt, which the opening shows before the answer |
| 4 | `../01_discover/output/flows.yaml` | the candidate usage examples |
| 3 | `../../_config/run.md` | audience, intent, opening, takeaway, length, include/exclude, environment, intent notes |
| 4 | `../01_discover/output/operator-notes.md` | the operator's own statements, citable as `OPN` |
| 3 | `../../_config/narrative-arc.md` | the sections to plan |
| 3 | `../../_config/information-architecture.md` | the rules the plan must allow |
| 3 | `../../_config/gate-feedback.md` | the format of `gate-feedback.md` |

**Do NOT load:** `../01_discover/output/sources/` (the fact sheet already holds what is needed); any later stage.

## Process
1. Write the core message: the answer-first statement, one sentence. Write the purpose line too: what the
   solution is for, one sentence, from the `purpose` facts; the title scene shows it under the solution's name.
2. Turn the opening order in `run.md` (the operator's words) into `outcome-first` or `story-first`, and note
   in the prose how the arc differs if the words fit neither exactly.
3. Map audience and intent to emphasis. With two intents, plan a section per intent.
4. State the depth first (`conceptual`, `logical`, or `physical`; default `conceptual`), using the depth and
   zoom table in `narrative-arc.md` for the target length and audience.
5. Choose the in-scope functions (each gets an L3 view, within the table's zoom count) and one or two flows
   as usage examples. List functions worth showing that don't fit the zoom count in `map_only`.
6. List what is deliberately excluded, including everything in `must_exclude`, and why. Exclude by depth
   where you can ("no file-level detail") instead of naming every deeper thing. **Everything downstream
   honours `excluded`:** views, map panels, relationship lists, and map detail paths leave those elements
   out, and an example flow may not use one.
7. Say whether a secondary intent would make the primary one shallow within the time budget.
8. Write `scope.md` with the frontmatter below, then the reasoning in prose.
9. Run `node scripts/check-model.mjs --scope` and fix what it reports.
10. Write `gate-feedback.md` (`_config/gate-feedback.md`), then run `node scripts/stamp.mjs 02`.

```yaml
---
core_message: "<one sentence>"
purpose_line: "<one sentence: what the solution is for>"
opening: outcome-first          # or story-first
intents: [educate]              # one or two
depth: conceptual               # conceptual | logical | physical (default conceptual)
in_scope: [<function ids>]      # get L3 views
map_only: [<element ids>]       # shown in views and the map; no scene highlights or zooms into them
example_flows: [<flow ids>]     # one or two
excluded: [<element ids or topics>]   # element IDs are removed everywhere downstream; topics are for the prose
target_scenes: 10               # 8-14
---
```

## Outputs
| File | Destination |
| --- | --- |
| `scope.md` | `output/` |
| `gate-feedback.md` | `output/` |

## Verify
- [ ] Every ID in the frontmatter exists in the model or flows (`check-model --scope`)
- [ ] Nothing in scope is a new fact or element
- [ ] `depth` is stated, and the in-scope count fits the zoom table for the target length and audience
- [ ] The core message is one sentence a listener could repeat, and it answers the pains in the before model
- [ ] The purpose line is one sentence and traces to `purpose` facts

## Human Check
Approve the scope: the core message, the purpose line, what is in, what is out. Edit `scope.md` in place, then run
`check-model --scope` and `stamp.mjs 02` again. Nothing advances without this.
