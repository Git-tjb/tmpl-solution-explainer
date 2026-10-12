# Stage 06: Verify

**Purpose:** Test the explainer and its conformance to the standards, and say which stage fixes each
failure.

Run the commands from the workspace root.

## Inputs
| Layer | Path | Use |
| --- | --- | --- |
| 4 | `../05_build/output/site/` | the explainer under test |
| 4 | `../03_storyboard/output/scenes.json` | what the explainer should contain |
| 4 | `../01_discover/output/fact-sheet.md` | what every on-screen claim must trace to |
| 4 | `../01_discover/output/system-model.yaml`, `flows.yaml` | for the model checks |
| 3 | `references/acceptance-criteria.md` | the criteria and how each is checked |
| 3 | `../../_config/banned-patterns.md`, `../../_config/information-architecture.md` | for the review |

**Do NOT load:** `../01_discover/output/sources/`; design and storyboard prose.

## Process
1. If the test browsers are missing, run `npx playwright install chromium firefox` (Edge is used from the
   machine; if it is missing, `npx playwright install msedge`).
2. Run `node scripts/verify.mjs`. It runs the scripted criteria in Chromium, Edge, and Firefox at both
   viewports, writes `output/verify-results.json`, and captures every scene at its final step into
   `output/screenshots/`.
3. Review content fidelity: every line of on-screen text in `scenes.json` against the fact IDs it cites.
4. Review the screenshots against `banned-patterns.md` (accepting only the exceptions listed in
   `design-spec.md`, if the run has a theme) and the IA rules marked as review in
   `acceptance-criteria.md`.
5. Write `verify-report.md`: pass or fail per criterion; each failure with its scene or element ID and the
   stage that should be re-run.
6. Run `node scripts/stamp.mjs 06`.

## Outputs
| File | Destination |
| --- | --- |
| `verify-results.json` | `output/` |
| `screenshots/` | `output/` |
| `verify-report.md` | `output/` |

## Verify
- [ ] Every criterion in `acceptance-criteria.md` has a result
- [ ] Every failure names a scene or element and a stage to re-run

## Human Check
Read `verify-report.md`. To fix a failure, re-run the named stage and every stage after it
(`node scripts/status.mjs` lists the stale ones). When everything passes, or the remaining failures are
accepted in the report, the explainer is done. Nothing advances without this.
