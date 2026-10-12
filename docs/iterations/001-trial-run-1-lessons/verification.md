# Iteration 001 Verification

Closed 2026-10-12. The template moves to version 0.1.0 (`docs/design.md`).

## Gates
The operator approved the design on 2026-10-11, then each workstream at its own gate. One clarification was
made at a gate: W1's stage 01 contract now names the three outputs the operator reviews (`conflicts.md`,
`system-model.yaml`, and the fact sheet topics the model doesn't carry) and why the rest need no review.

| Workstream | Design | Commit |
| --- | --- | --- |
| W1 intake and discovery | D8 | `8e433a3`, `bf3f64d` |
| W2 standards and terms | D1-D3 | `6c93c81` |
| W3 narrative and scope | D2, D3, D8 | `5ec61e9` |
| W4 run-theme hook | D5 | `327d6fd`, `f35ac70` |
| W5 page runtime | D2, D4, D7 | `3ec1fbc` |
| W6 renderer | D7, D3 | `e65a5ee` |
| W7 mockups | D6 | `f2c910c` |
| W8 small fixes, fixtures, dry run | D9, D10 | `e6459e2` |

## Done condition (design D10)
`node scripts/dry-run.mjs` passes every scripted criterion, AC-16 to AC-18 included, in Chromium, Edge, and
Firefox at 1920x1080 and 1440x900. The review criteria (AC-10, AC-11, AC-12, AC-15) are judged in a run.
`Test-Workspace.ps1 -Template` passes with its one known warning (it scans the gitignored `node_modules/`).

Each new check was also tested against inputs broken on purpose: missing or misplaced orientation scene,
no structure view, a flow before the structure, excluded or map-only highlights, a panel or detail path for
an excluded element, map detail at conceptual depth, a `what_it_does` list that is too short, and a theme
with a script, an `@import`, a remote URL, a missing font, a font with no licence, or `visual: default`.
Pins were tested on a top-level node and on the boundary, and noted as having no effect inside it.

## Found along the way
- The fixture stage outputs had never been committed: the template's `output/` ignore rule hid them.
  Fixed in W2 (`.gitignore` exception for `docs/fixtures/`).
- Narrower boxes and `name (exact_name)` made tall views reach the 16px label limit sooner. The legend now
  runs wider instead of wrapping; one fixture view was narrowed, as the preview warning advises.

## Not yet exercised
- The label fallback with a leader line: no fixture diagram is crowded enough to need it.
- Real content: trial run 2, on the AI Workshop, is the test of this iteration.

## Seeds
Workshop-wide changes this iteration raised (requirements and iterations living in the template, trial-run
feedback as the default input, citing an unarchived trial run's retro) are in the KB vault proposal
"Template Iteration Seeds".
