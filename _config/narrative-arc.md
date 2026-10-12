# Narrative Arc

The default sequence of sections on the linear path. Stage 02 turns the opening order from `_config/run.md`
into `outcome-first` or `story-first` and may reorder section 3's parts to match; with two intents it gives
each intent its own run of sections 4-6. Stage 03 sequences scenes within this arc. A run that needs a
different arc says why in `scope.md`.

| # | Section (`section` in scenes.json) | What it does | Mode | Level |
| --- | --- | --- | --- | --- |
| 1 | `answer` | The whole system in one sentence (the core message) and its picture | explanation | L1 |
| 2 | `orientation` | The four levels (Context, Functions, Components, Code) and which scenes use each, so the audience can place every later picture. Exactly one scene, drawn from data, no view. | explanation | key |
| 3 | `why` | The problem baseline, why the solution was built, and the outcomes it produces. Outcome-first or story-first per `scope.md`. | explanation | L1 |
| 4 | `structure` | The functions and what each does, as a structure view: no lines yet | explanation | L2 (structure) |
| 5 | `segmentation` | The naive alternative first, then each function as the fix for a specific problem in it, from `why_separate`, on the wired view | explanation | L2 (wired) |
| 6 | `build` | Zoom into each in-scope function, one at a time, returning to L2 between them | explanation | L3 |
| 7 | `in-use` | One or two usage-example flows, walked step by step through elements already shown | how-to | flow |
| 8 | `close` | Return to the first scene's picture and core message, now understood | explanation | L1 |

Structure comes before wiring: the first L2 scene is a structure view, and no flow scene comes before the
first structure scene. The orientation scene comes after the answer and before the first L2 or L3 scene.

The map is available on every scene and is the reference layer. L4 detail lives only there.

## Depth and zooms

`depth` in `scope.md` (default `conceptual`) states how far down the explainer goes. Say it first, then
exclude by depth rather than listing every deeper thing.

| Depth | Goes to | Map panels |
| --- | --- | --- |
| `conceptual` | What each part is for and how the parts relate; zooms name components by what they do | No L4 `detail` paths |
| `logical` | Adds how a part works inside: how its components connect | `detail` paths allowed |
| `physical` | Adds the real files, folders, and config where a usage example needs them | `detail` paths allowed |

Depth and the number of zooms (`in_scope` functions, each one L3 scene) follow target length and audience:

| Target length | Audience (familiarity) | Depth | Zooms |
| --- | --- | --- | --- |
| up to 8 min | any | conceptual | 0-1 |
| 9-12 min | leadership or clients (none or some) | conceptual | 1-2 |
| 9-12 min | colleagues or peers (some or expert) | logical | 2 |
| 13-15 min | leadership or clients | conceptual | 2 |
| 13-15 min | colleagues or peers | logical | 2-3 |

These are starting points to tune after real presentations. When the solution has more worthwhile zooms
than the table allows:

- put the extra functions in `map_only` (they stay in every view and the map, but no scene highlights or
  zooms into them);
- keep `answer`, `orientation`, and `close`; they are never cut;
- fold `why` into one scene, and merge `structure` into `segmentation` only if every function's reason for
  being separate fits one structure scene;
- never cut a zoom the core message depends on; cut a different one.

## Budget

8-14 scenes in at most 15 minutes. A typical split for 15 minutes and 11 scenes:

| Section | Scenes | Minutes |
| --- | --- | --- |
| answer | 1 | 1 |
| orientation | 1 | 1 |
| why | 1 | 1.5 |
| structure | 1 | 1.5 |
| segmentation | 2 | 3 |
| build | 2 | 4 |
| in-use | 2 | 2.5 |
| close | 1 | 0.5 |

At 14 scenes most scenes run about a minute; keep the on-screen text short.
