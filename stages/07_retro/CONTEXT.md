# Stage 07: Retro

**Purpose:** Record what this run taught, while it is fresh. The retro is the main input to the next
version of this template.

## Inputs
| Layer | Path | Use |
| --- | --- | --- |
| 4 | `../01_discover/output/` to `../06_verify/output/` (not `sources/` or `screenshots/`) | what each stage produced |
| 4 | `../06_verify/output/verify-report.md` | what failed and where |
| 4 | `../0N_*/output/gate-feedback.md` (stages 01 to 06) | every correction raised at a gate |
| 3 | `../../_config/retro.md` | the retro's sections |
| 3 | `../../_config/run.md` | what the run set out to do |

## Process
1. Read every stage's `gate-feedback.md` (01 to 06). Group all their items by template area in the retro's
   "By Template Area" table, one row per area, citing each item by its ID (`O3`, `A7`). Every item appears
   once; an item that points at two areas goes under the main one and is named in the other.
2. Fill in every other section of `_config/retro.md` from what the run produced and from the operator's
   edits at each gate.
3. Record, in By Template Area or Generalizable Lessons as fits, how the standards held up:
   - element types that were hard to call (especially `function`),
   - views that hit the 9-element limit and flows that hit 12 nodes,
   - layout problems that needed pins, and whether pins held across levels,
   - motion actions that were missing from the vocabulary,
   - stages re-run after verify, and why.
4. Record the time each stage took, as the operator reports it.
5. Keep Generalizable Lessons free of project, client, and person names.
6. Run `node scripts/stamp.mjs 07`.

## Outputs
| File | Destination |
| --- | --- |
| `retro.md` | `output/` |

## Verify
- [ ] Every section is filled in, or says "none" with a reason
- [ ] Every gate feedback item (O and A IDs from stages 01 to 06) appears in By Template Area
- [ ] Generalizable Lessons contains no names

## Human Check
Read `output/retro.md` and edit in place. Closing the run is the operator's step: `Close-Instance`
archives this instance to the project's folder in its KB vault.
