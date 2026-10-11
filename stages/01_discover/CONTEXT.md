# Stage 01: Discover

**Purpose:** Build the fact base and the system model from the solution's own sources. Every later stage
works only from what this stage writes.

Run the commands from the workspace root.

## Inputs
| Layer | Path | Use |
| --- | --- | --- |
| 3 | `../../_config/run.md` | sources to snapshot, canonical names, usage examples |
| 3 | `references/extraction-guide.md` | what to extract and how to write the fact sheet |
| 3 | `../../_config/standards/system-model.md` | element types and model rules |
| 3 | `../../_config/standards/flows.md` | flow node types and rules |
| 4 | `output/sources/` | the snapshot step 1 makes; the only copy of the sources this run reads |

**Do NOT load:** the original source locations after step 1; any other stage's `output/`.

## Process
1. Run `node scripts/snapshot-sources.mjs`. It copies every source in `run.md` into `output/sources/` and
   records each one's origin, commit, and copy time in `output/sources/provenance.yml`. If a source is
   missing, stop and tell the operator.
2. Run `node scripts/inventory-sources.mjs`. It writes `output/inventory.md`: the tree, file types, sizes,
   last-modified dates, and existing diagrams.
3. Read the sources, primary first, using the inventory to prioritize. Extract facts into `fact-sheet.md`
   as `references/extraction-guide.md` describes. Every fact cites a path in the snapshot and a section.
4. Build `system-model.yaml` from those facts, citing fact IDs. Then write candidate flows in `flows.yaml`
   for the usage patterns found, starting with `usage_examples` in `run.md`.
5. Write `source-index.md`: every source in `run.md`, and every file read, partly read, or skipped, and why.
6. Write `conflicts.md`: each naming difference from `canonical_names` and each fact on which sources
   disagree, with both readings and where each comes from. Never resolve one silently.
7. Run `node scripts/check-model.mjs` and fix what it reports until it passes.
8. Run `node scripts/stamp.mjs 01`.

## Outputs
| File | Destination |
| --- | --- |
| `sources/` (with `provenance.yml`) | `output/` |
| `inventory.md` | `output/` |
| `fact-sheet.md` | `output/` |
| `system-model.yaml` | `output/` |
| `flows.yaml` | `output/` |
| `source-index.md` | `output/` |
| `conflicts.md` | `output/` |

## Verify
- [ ] Every fact has an ID and a citation into `output/sources/`
- [ ] Every source in `run.md` appears in `source-index.md` and `provenance.yml`
- [ ] `check-model` passes
- [ ] No element exists twice under different names; differences are in `conflicts.md` instead

## Human Check
Resolve every item in `conflicts.md`, then read `system-model.yaml` against what you know: wrong elements
or a weak `why_separate` flow into every diagram. Edit the fact sheet and model in place, run `check-model`
again, and run `node scripts/stamp.mjs 01` again after editing. Nothing advances without this.
