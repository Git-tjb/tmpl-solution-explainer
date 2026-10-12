# Stage 03: Storyboard

**Purpose:** Sequence the scenes of the linear path and define the map (reference layer).

Run the commands from the workspace root.

## Inputs
| Layer | Path | Use |
| --- | --- | --- |
| 4 | `../02_scope/output/scope.md` | the message, scope, and flows |
| 4 | `../01_discover/output/fact-sheet.md` | what each scene may say, by fact ID |
| 4 | `../01_discover/output/system-model.yaml` | elements and relationships to show |
| 4 | `../01_discover/output/flows.yaml` | the example flows |
| 4 | `../01_discover/output/inventory.md` | paths for L4 detail in map panels |
| 3 | `../../_config/narrative-arc.md` | the section sequence and budget |
| 3 | `../../_config/information-architecture.md` | the rules each scene follows |
| 3 | `../../_config/standards/views.md` | levels and what a view includes |
| 3 | `../../_config/standards/scenes.schema.json` | the shape of `scenes.json` |

**Do NOT load:** `../01_discover/output/sources/` file contents (paths from the inventory are enough);
`conflicts.md`, `source-index.md`.

## Process
1. Name the views the run needs: the L1 and L2 views of the system, one L3 view per in-scope function,
   and one flow view per example flow.
2. Sequence 8-12 scenes along the arc. For each: ID (`S01`...), section, title, the single point, mode,
   level, view, highlighted elements, relationships, or steps, at most 3 lines of on-screen text, reveal
   steps, a proposed animation (only if it explains a state change, and only if `run.md` allows
   animation), fact IDs, and minutes.
3. Define the map: the L1 and L2 views as the overview, and a panel for every element in scope, with its
   L3 view if it has one and the snapshot paths to show as L4 detail.
4. Write `scenes.json` (machine-readable) and `storyboard.md`: the same scenes in readable form, one block
   per scene, with what the operator will say in a sentence or two.
5. Run `node scripts/check-storyboard.mjs` and fix what it reports.
6. Run `node scripts/stamp.mjs 03`.

## Outputs
| File | Destination |
| --- | --- |
| `scenes.json` | `output/` |
| `storyboard.md` | `output/` |

## Verify
- [ ] `check-storyboard` passes: schema, IA rules, talk time within `target_minutes`, every in-scope
      element in the map, examples introduce nothing new
- [ ] `storyboard.md` and `scenes.json` describe the same scenes

## Human Check
Read `storyboard.md` aloud at presenting pace. Edit the sequence and on-screen text in `scenes.json`
(and `storyboard.md` to match), run `check-storyboard` and `stamp.mjs 03` again. Nothing advances
without this.
