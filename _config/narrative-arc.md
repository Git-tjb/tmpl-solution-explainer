# Narrative Arc

The default sequence of sections on the linear path. The explainer opens on the solution's name and a picture
of it, then the user and the problem, then the solution as the answer to that problem. Stage 02 turns the
opening order from `_config/run.md` into `outcome-first` or `story-first`, which sets how much the `problem`
scenes tell as a story and whether `why` follows the answer; with two intents it gives each intent its own run
of sections 5-8. Stage 03 sequences scenes within this arc. A run that needs a different arc says why in
`scope.md`.

| # | Section (`section` in scenes.json) | What it does | Mode | Level |
| --- | --- | --- | --- | --- |
| 1 | `title` | The solution's name, its purpose line (`scope.md` `purpose_line`), and the title visual. Exactly one scene, no view. | explanation | title |
| 2 | `problem` | Who the user is, what they were doing, and what hurt, on before views (the before model): no part of the solution. One or two scenes, right after the title. | explanation | before |
| 3 | `answer` | The whole system in one sentence (the core message) and its picture, as the answer to the problem. Exactly one scene. | explanation | L1 |
| 4 | `why` | The outcomes, each one the answer to a pain from section 2. Optional; folded into `answer` when time is short. | explanation | L1 or before |
| 5 | `structure` | The functions and what each does, as a structure view: no lines yet | explanation | L2 (structure) |
| 6 | `segmentation` | The naive alternative first (it may use a before view), then each function as the fix for a specific problem in it, from `why_separate`, on the wired view | explanation | L2 (wired) |
| 7 | `build` | Zoom into each in-scope function, one at a time, returning to L2 between them | explanation | L3 |
| 8 | `in-use` | One or two usage-example flows, walked step by step through elements already shown | how-to | flow |
| 9 | `close` | The core message again, over a picture the opening did not show, so the audience sees what they learned (for example the wired L2 view with the example's path, or the before view with each pain answered) | explanation | any |

Structure comes before wiring: the first L2 scene is a structure view, and no flow scene comes before the
first structure scene.

How to read the levels is not a scene: the page's Levels control explains the four levels on demand, on every
scene.

## Every scene earns its picture

- No two scenes show the same picture (a view and its highlight) unless the later one adds something the earlier
  did not: a highlight, a reveal, a zoom. A scene that shows a view an earlier scene used says what it adds in
  `adds`.
- A scene about a problem shows the problem: a before view, never the finished solution with parts outlined.
  Outside the `problem` section, such a scene sets `about: problem`.
- Every on-screen line adds something the scene's message does not, and cites the facts that carry it.
- On-screen lines appear the same way in every scene: one per step, or all from the start
  (`text_reveal` in `scene-specs.yaml`).

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
- keep `title`, `problem`, `answer`, and `close`; they are never cut (`problem` may drop to one scene);
- fold `why` into `answer`, and merge `structure` into `segmentation` only if every function's reason for
  being separate fits one structure scene;
- never cut a zoom the core message depends on; cut a different one.

## Budget

8-14 scenes in at most 15 minutes; the title and problem scenes count. Stage 03 allocates the minutes and
scenes per section first (`budget` in `scenes.json`), then writes the scenes within it; `check-storyboard`
fails a section that runs more than a quarter-minute over its allocation. A typical split for 15 minutes and
13 scenes:

| Section | Scenes | Minutes |
| --- | --- | --- |
| title | 1 | 0.5 |
| problem | 2 | 1.5 |
| answer | 1 | 1 |
| why | 1 | 1 |
| structure | 1 | 1.5 |
| segmentation | 2 | 3 |
| build | 2 | 3.5 |
| in-use | 2 | 2.5 |
| close | 1 | 0.5 |

At 14 scenes most scenes run about a minute; keep the on-screen text short.
