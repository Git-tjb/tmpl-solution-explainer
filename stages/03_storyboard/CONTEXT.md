# Stage 03: Storyboard

**Purpose:** Sequence the scenes of the linear path and define the map (reference layer).

Run the commands from the workspace root.

## Inputs
| Layer | Path | Use |
| --- | --- | --- |
| 4 | `../02_scope/output/scope.md` | the message, scope, and flows |
| 4 | `../01_discover/output/fact-sheet.md` | what each scene may say, by fact ID |
| 4 | `../01_discover/output/system-model.yaml` | elements and relationships to show |
| 4 | `../01_discover/output/before-model.yaml` | the user, the old way, and what hurt, for the problem scenes |
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
1. Allocate the budget first: the scenes and minutes for each section of the arc, within `target_minutes`
   (`budget` in `scenes.json`; the Budget table in `narrative-arc.md` is a starting point).
2. Name the views the run needs: one or more before views (`level: before`, `scope: before`) for the problem
   scenes, the L1 view, an L2 structure view and an L2 wired view of the system (`mode` on each), one L3 view
   per in-scope function, and one flow view per example flow. Leave out everything `scope.md` excludes.
3. Sequence 8-14 scenes along the arc, within the budget: the title scene first (`section: title`,
   `level: title`, no view; its point is `purpose_line`), then one or two problem scenes on before views, then
   the answer at L1, and the structure view before any wiring. For each: ID (`S01`...), section, title, the
   single point, mode, level, view, highlighted elements, relationships, or steps, at most 3 lines of
   on-screen text, each with the facts that carry it, reveal steps, a proposed animation (only if it explains
   a state change, and only if `run.md` allows animation), fact IDs, and minutes. A scene that shows a view an
   earlier scene used says what it adds (`adds`). The close shows a picture the opening did not.
4. Define the map: the L1 and L2 views as the overview, and a panel for every element in scope, with its
   L3 view if it has one and the snapshot paths to show as L4 detail (only when `depth` is `logical` or
   `physical`). No panel for an excluded element, and no detail path under one.
5. Write `scenes.json` (machine-readable) and `storyboard.md`: the same scenes in readable form, one block
   per scene, with what the operator will say in a sentence or two.
6. Run `node scripts/check-storyboard.mjs` and fix what it reports. It also writes `lines.md`: every on-screen
   line beside the claims of the facts it cites, with a line that mostly repeats its message marked. Fix any
   line whose facts do not carry it, and make a marked line add something or remove it.
7. Write `gate-feedback.md` (`_config/gate-feedback.md`), then run `node scripts/stamp.mjs 03`.

## Outputs
| File | Destination |
| --- | --- |
| `scenes.json` | `output/` |
| `storyboard.md` | `output/` |
| `lines.md` (written by `check-storyboard`) | `output/` |
| `gate-feedback.md` | `output/` |

## Verify
- [ ] `check-storyboard` passes: schema, IA rules (title, problem, then answer; structure before wiring; a
      new picture at the close; repeated views say what they add), the budget and talk time within
      `target_minutes`, every line citing facts, every in-scope element in the map, `excluded` honoured,
      examples introduce nothing new
- [ ] Every line in `lines.md` is carried by its facts, and no marked line is left unexplained
- [ ] `storyboard.md` and `scenes.json` describe the same scenes

## Human Check
Read `storyboard.md` aloud at presenting pace, and read `lines.md`: does each line's facts carry it, and does
each line add to its message? Edit the sequence and on-screen text in `scenes.json`
(and `storyboard.md` to match), run `check-storyboard` and `stamp.mjs 03` again. Nothing advances
without this.
