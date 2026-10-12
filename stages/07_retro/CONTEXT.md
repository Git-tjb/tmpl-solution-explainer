# Stage 07: Retro

**Purpose:** Record what this run taught, while it is fresh. The retro is the main input to the next
version of this template.

## Inputs
| Layer | Path | Use |
| --- | --- | --- |
| 4 | `../01_discover/output/` to `../06_verify/output/` (not `sources/` or `screenshots/`) | what each stage produced |
| 4 | `../06_verify/output/verify-report.md` | what failed and where |
| 3 | `../../_config/retro.md` | the retro's sections |
| 3 | `../../_config/run.md` | what the run set out to do |

## Process
1. Fill in every section of `_config/retro.md` from what the run produced and from the operator's edits at
   each gate. Name each stage's contract defects.
2. Record, in Contract Defects or Generalizable Lessons as fits, how the standards held up:
   - element types that were hard to call (especially `function`),
   - views that hit the 9-element limit and flows that hit 12 nodes,
   - layout problems that needed pins, and whether pins held across levels,
   - motion actions that were missing from the vocabulary,
   - stages re-run after verify, and why.
3. Record the time each stage took, as the operator reports it.
4. Keep Generalizable Lessons free of project, client, and person names.
5. Run `node scripts/stamp.mjs 07`.

## Outputs
| File | Destination |
| --- | --- |
| `retro.md` | `output/` |

## Verify
- [ ] Every section is filled in, or says "none" with a reason
- [ ] Generalizable Lessons contains no names

## Human Check
Read `output/retro.md` and edit in place. Closing the run is the operator's step: `Close-Instance`
archives this instance to the project's folder in its KB vault.
