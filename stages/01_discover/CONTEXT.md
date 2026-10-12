# Stage 01: Discover

**Purpose:** Build the fact base and the system model from the solution's own sources and the operator's own
words. Every later stage works only from what this stage writes.

Run the commands from the workspace root.

## Inputs
| Layer | Path | Use |
| --- | --- | --- |
| 3 | `../../_config/run.md` | sources to snapshot, canonical names, usage examples, environment, intent notes |
| 3 | `references/extraction-guide.md` | what to extract and how to write the fact sheet |
| 3 | `../../_config/standards/system-model.md` | element types, Terms, and model rules |
| 3 | `../../_config/standards/flows.md` | flow node types and rules |
| 4 | `output/sources/` | the snapshot step 1 makes; the only copy of the sources this run reads |

**Do NOT load:** the original source locations after step 1; any other stage's `output/`.

## Process
1. Run `node scripts/snapshot-sources.mjs`. It copies every source in `run.md` into `output/sources/` and
   records each one's origin, commit, and copy time in `output/sources/provenance.yml`. If a source is
   missing, stop and tell the operator.
2. Run `node scripts/inventory-sources.mjs`. It writes `output/inventory.md`: the tree, file types, sizes,
   last-modified dates, and existing diagrams.
3. Start `operator-notes.md` from the operator's setup answers: quote `opening`, `takeaway`, `environment`,
   `intent_notes`, and anything in the body of `run.md`, verbatim, one numbered note each (`OPN01`, ...). The
   operator's words are cited like any other source.
4. Read the sources, primary first, using the inventory to prioritize. Extract facts into `fact-sheet.md`
   as `references/extraction-guide.md` describes. Every fact cites a path in the snapshot and a section, or
   an `OPN` note. Where sources and `run.md` leave `environment`, `constraints`, or the guiding `principle`
   unanswered, record it as a gap and ask at step 8 rather than infer it.
5. Build `system-model.yaml` from those facts, citing fact IDs, then write candidate flows in `flows.yaml`
   for the usage patterns found, starting with `usage_examples` in `run.md`.
6. Write `source-index.md`: every source in `run.md`, and every file read, partly read, or skipped, and why.
7. Write `conflicts.md`: each naming difference from `canonical_names` and each fact on which sources
   disagree, with both readings and where each comes from. Never resolve one silently.
8. With the operator, before the final checks:
   - Show the Terms section of `system-model.md` and confirm each element type means what the operator
     expects here.
   - Settle which functions the explainer is likely to zoom into. Anything zoomed into is a `function` with
     parts, never a `store`. Decompose the chosen ones into components now.
   - Ask the gaps from step 4. Record each answer verbatim as a new `OPN` note and cite it from the facts
     and model it changes.
   - If an answer contradicts the sources, keep both as facts and add the pair to `conflicts.md`.
9. Run `node scripts/check-model.mjs` and fix what it reports until it passes.
10. Write `gate-feedback.md` (see Outputs), then run `node scripts/stamp.mjs 01`.

## Outputs
| File | Destination |
| --- | --- |
| `sources/` (with `provenance.yml`) | `output/` |
| `inventory.md` | `output/` |
| `operator-notes.md` | `output/` |
| `fact-sheet.md` | `output/` |
| `system-model.yaml` | `output/` |
| `flows.yaml` | `output/` |
| `source-index.md` | `output/` |
| `conflicts.md` | `output/` |
| `gate-feedback.md` | `output/` |

`operator-notes.md` is a list of the operator's statements, each with an ID (`OPN01`, ...), a one-line
context (when and in answer to what), and the quote. Quotes are never paraphrased or corrected.

`gate-feedback.md` logs every correction or comment the operator or the agent raises at this gate, one item
each: what was wrong, which template area it points to (questionnaire, extraction guide, standards,
contract, scripts), and how it was handled in this run. The template is fixed once, from the collected set,
after the run; don't edit the template mid-run for these.

## Verify
- [ ] Every fact has an ID and a citation into `output/sources/` or an `OPN` note in `operator-notes.md`
- [ ] Every source in `run.md` appears in `source-index.md` and `provenance.yml`
- [ ] `operator-notes.md` quotes each free-text answer from `run.md` and each gate answer
- [ ] `check-model` passes
- [ ] No element exists twice under different names; differences are in `conflicts.md` instead
- [ ] Every function the operator marked for zoom has parts in the model

## Human Check
Resolve every item in `conflicts.md`, then read `system-model.yaml` against what you know: wrong elements
or a weak `why_separate` flow into every diagram. Edit the fact sheet and model in place, run `check-model`
again, and run `node scripts/stamp.mjs 01` again after editing. Nothing advances without this.
