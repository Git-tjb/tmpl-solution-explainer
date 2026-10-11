# Narrative Arc

The default sequence of sections on the linear path. Stage 02 may reorder sections 2's parts (outcome-first
or story-first, from `_config/run.md`) and, with two intents, give each intent its own run of sections 3-5.
Stage 03 sequences scenes within this arc. A run that needs a different arc says why in `scope.md`.

| # | Section (`section` in scenes.json) | What it does | Mode | Level |
| --- | --- | --- | --- | --- |
| 1 | `answer` | The whole system in one sentence (the core message) and its picture: an L1 scene, then an L2 scene | explanation | L1, then L2 |
| 2 | `why` | The problem baseline, why the solution was built, and the outcomes it produces. Outcome-first or story-first per `run.md`. | explanation | L1 |
| 3 | `segmentation` | The naive alternative first, then each container as the fix for a specific problem in it, from `why_separate` | explanation | L2 |
| 4 | `build` | Zoom into each in-scope container, one at a time, returning to L2 between them | explanation | L3 |
| 5 | `in-use` | One or two usage-example flows, walked step by step through elements already shown | how-to | flow |
| 6 | `close` | Return to the first scene's picture and core message, now understood | explanation | L1 |

The map is available on every scene and is the reference layer. L4 detail lives only there.

## Budget

8-12 scenes in at most 15 minutes. A typical split for 15 minutes and 10 scenes:

| Section | Scenes | Minutes |
| --- | --- | --- |
| answer | 2 | 2 |
| why | 1 | 1.5 |
| segmentation | 2 | 3 |
| build | 2-3 | 4 |
| in-use | 1-2 | 3.5 |
| close | 1 | 1 |
