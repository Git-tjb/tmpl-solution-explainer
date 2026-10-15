# Stage 01: Discover

**Purpose:** Build the fact base and the system model from the solution's own sources and the operator's own
words. Every later stage works only from what this stage writes.

Run the commands from the workspace root.

## Inputs
| Layer | Path | Use |
| --- | --- | --- |
| 3 | `../../_config/run.md` | sources and visual references to snapshot, canonical names, the user and the problem, usage examples, environment, intent notes |
| 3 | `references/extraction-guide.md` | what to extract and how to write the fact sheet |
| 3 | `../../_config/standards/system-model.md` | element types, Terms, and model rules |
| 3 | `../../_config/standards/flows.md` | flow node types and rules |
| 3 | `../../_config/gate-feedback.md` | the format of `gate-feedback.md` |
| 4 | `output/sources/` | the snapshot step 1 makes; the only copy of the sources this run reads |

**Do NOT load:** the original source locations after step 1; any other stage's `output/`.

## Process
1. Run `node scripts/snapshot-sources.mjs`. It copies every source in `run.md` into `output/sources/` and
   records each one's origin, commit, and copy time in `output/sources/provenance.yml`. It also copies every
   image and font file in `visual_references`, and the title image if `title_visual` names one, into
   `output/visual-refs/` (recorded in the same `provenance.yml`). If a source or a file is missing, stop and
   tell the operator.
2. Run `node scripts/inventory-sources.mjs`. It writes `output/inventory.md`: the tree, file types, sizes,
   last-modified dates, and existing diagrams.
3. Start `operator-notes.md` from the operator's setup answers: quote `opening`, `takeaway`, `user`,
   `user_goal`, `before`, each item of `pains` and of `pain_counts`, `environment`, `intent_notes`, and anything in the body of
   `run.md`, verbatim, one numbered note each (`OPN01`, ...). The operator's words are cited like any other
   source.
4. Read the sources, primary first, using the inventory to prioritize. Extract facts into `fact-sheet.md`
   as `references/extraction-guide.md` describes. Every fact cites a path in the snapshot and a section, or
   an `OPN` note. Where sources and `run.md` leave `environment`, `constraints`, or the guiding `principle`
   unanswered, record it as a gap and ask at step 9 rather than infer it.
5. Build `system-model.yaml` from those facts, citing fact IDs, then write candidate flows in `flows.yaml`
   for the usage patterns found, starting with `usage_examples` in `run.md`.
6. Build `before-model.yaml` from the `before` facts (`system-model.md`, The before model): the user, what
   they were doing, what they did it with, and each pain with the one thing it hurts. It holds no part of the
   solution; the opening scenes draw it, so the problem is shown before the answer. Where the `before` facts
   carry a count, add the figure data it supports (`recurs`, `versions`, `queue`, `measures`); never estimate
   one.
7. Write `source-index.md`: every source in `run.md`, and every file read, partly read, or skipped, and why.
8. Write `conflicts.md`: each naming difference from `canonical_names` and each fact on which sources
   disagree, with both readings and where each comes from. Never resolve one silently.
9. With the operator, before the final checks:
   - Show the Terms section of `system-model.md` and confirm each element type means what the operator
     expects here.
   - Settle which functions the explainer is likely to zoom into. Anything zoomed into is a `function` with
     parts, never a `store`. Decompose the chosen ones into components now.
   - Show the before model: is this the user, the old way, and what hurt, as the operator remembers it? A
     pain the setup answers did not give, or one the sources suggest, is asked here, never assumed.
   - Ask the gaps from step 4. Record each answer verbatim as a new `OPN` note and cite it from the facts
     and model it changes.
   - If an answer contradicts the sources, keep both as facts and add the pair to `conflicts.md`.
10. Run `node scripts/check-model.mjs` and fix what it reports until it passes.
11. Write `gate-feedback.md` (`_config/gate-feedback.md`), then run `node scripts/stamp.mjs 01`.

## Outputs
| File | Destination |
| --- | --- |
| `sources/` (with `provenance.yml`) | `output/` |
| `inventory.md` | `output/` |
| `operator-notes.md` | `output/` |
| `fact-sheet.md` | `output/` |
| `system-model.yaml` | `output/` |
| `before-model.yaml` | `output/` |
| `visual-refs/` (only when `run.md` names image or font files) | `output/` |
| `flows.yaml` | `output/` |
| `source-index.md` | `output/` |
| `conflicts.md` | `output/` |
| `gate-feedback.md` | `output/` |

`operator-notes.md` is a list of the operator's statements, each with an ID (`OPN01`, ...), a one-line
context (when and in answer to what), and the quote. Quotes are never paraphrased or corrected.

`gate-feedback.md` logs every correction or comment raised at this gate, in the format of
`_config/gate-feedback.md`.

## Verify
- [ ] Every fact has an ID and a citation into `output/sources/` or an `OPN` note in `operator-notes.md`
- [ ] Every source in `run.md` appears in `source-index.md` and `provenance.yml`
- [ ] `operator-notes.md` quotes each free-text answer from `run.md` and each gate answer
- [ ] `check-model` passes, the before model included
- [ ] Every pain in `run.md` is a pain in `before-model.yaml`, citing its `OPN` note
- [ ] No element exists twice under different names; differences are in `conflicts.md` instead
- [ ] Every function the operator marked for zoom has parts in the model

## Human Check
Ten files are written; the operator reviews four. The rest are derived from those, from the operator's own
words, or checked by script.

**Review these (the primaries):**
| File | What to check |
| --- | --- |
| `conflicts.md` | Answer every item. Each is a decision only the operator can make. |
| `system-model.yaml` | The elements, their `name (exact_name)`, `responsibility`, `why_separate`, `what_it_does`, and relationships. This is what every diagram draws; a wrong element or a weak `why_separate` flows into all of them. |
| `before-model.yaml` | The user, what they were doing, what they did it with, and each pain with what it hurts. The opening scenes draw this picture before the solution appears, so it must be the problem as the audience would recognise it, with nothing of the solution in it (`check-model` refuses a solution part). |
| `fact-sheet.md`, the topics the model doesn't carry: `purpose`, `outcomes`, `constraints`, `environment`, `principle`, `gaps` | Read these sections only. Stage 02 builds the core message from them. The other topics are the evidence behind the model; you check them through the model. |

**Don't review these (derived or scripted):**
| File | Why |
| --- | --- |
| `sources/`, `visual-refs/`, `inventory.md`, `source-index.md` | Made by script, or an audit trail; `check-model` and Verify confirm every source is covered. |
| `operator-notes.md` | Your own words, quoted. Skim it only if you suspect a misquote. |
| `fact-sheet.md`, the other topics | Each claim is cited, and the model's claims cite them; `check-model` confirms every cited ID exists. Open one when the model looks wrong to find its source. |
| `flows.yaml` | Candidates only. Stage 02 chooses one or two, and you review those flows there. |
| `gate-feedback.md` | Your own corrections, logged. |

Edit the models and fact sheet in place, run `check-model` again, and run `node scripts/stamp.mjs 01` again
after editing. Nothing advances without this.
