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
| 3 | `../../_config/narrative-arc.md` | the section sequence, depth and zoom table, and budget |
| 3 | `../../_config/information-architecture.md` | the rules each scene follows |
| 3 | `../../_config/standards/views.md` | levels and what a view includes |
| 3 | `../../_config/standards/scenes.schema.json` | the shape of `scenes.json` |
| 3 | `../../_config/gate-feedback.md` | the format of `gate-feedback.md` |

**Do NOT load:** `../01_discover/output/sources/` file contents (paths from the inventory are enough);
`conflicts.md`, `source-index.md`.

## Process
1. Name the views the run needs: the L1 view, an L2 structure view and an L2 wired view of the system
   (`mode` on each), one L3 view per in-scope function, and one flow view per example flow. Leave out
   everything `scope.md` excludes.
2. Sequence 8-14 scenes along the arc, with one orientation scene (`section: orientation`, `level: key`, no
   view) after the answer and before the first L2 scene, and the structure view before any wiring. For each: ID (`S01`...), section, title, the single point, mode,
   level, view, highlighted elements, relationships, or steps, at most 3 lines of on-screen text, reveal
   steps, a proposed animation (only if it explains a state change, and only if `run.md` allows
   animation), fact IDs, and minutes.
3. Define the map: the L1 and L2 views as the overview, and a panel for every element in scope, with its
   L3 view if it has one and the snapshot paths to show as L4 detail (only when `depth` is `logical` or
   `physical`). No panel for an excluded element, and no detail path under one.
4. Write `scenes.json` (machine-readable) and `storyboard.md`: the same scenes in readable form, one block
   per scene, with what the operator will say in a sentence or two.
5. Run `node scripts/check-storyboard.mjs` and fix what it reports.
6. Write `gate-feedback.md` (`_config/gate-feedback.md`), then run `node scripts/stamp.mjs 03`.

## Outputs
| File | Destination |
| --- | --- |
| `scenes.json` | `output/` |
| `storyboard.md` | `output/` |
| `gate-feedback.md` | `output/` |

## Verify
- [ ] `check-storyboard` passes: schema, IA rules (orientation, structure before wiring), talk time within
      `target_minutes`, every in-scope element in the map, `excluded` honoured, examples introduce nothing new
- [ ] `storyboard.md` and `scenes.json` describe the same scenes

## Human Check
Read `storyboard.md` aloud at presenting pace. Edit the sequence and on-screen text in `scenes.json`
(and `storyboard.md` to match), run `check-storyboard` and `stamp.mjs 03` again. Nothing advances
without this.
