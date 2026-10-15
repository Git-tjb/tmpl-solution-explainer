# Problem Figures: Choosing the Picture for a Problem Scene

A problem scene shows the problem, never the solution (`_config/information-architecture.md`, rules 1 and 15).
Its picture is a before view of the before model (`_config/standards/system-model.md`, The before model). A
before view is the `map` of the old way, or one of six figures that show a pattern of what hurt. Each figure
is drawn by the renderer from the before model, with the user at its left and the pains on what it draws
(`_config/standards/notation.md`, Problem figures). Nothing is drawn by hand.

Stage 03 names the figure per before view (`figure` in `scenes.json` `views`). Stage 04 writes its view spec
(`figure`, `subject` or `measures`, and `compare` for a cost in a `why` scene).

## Which figure fits which pain

| The pain sounds like | Figure | Subject | It needs, in the before model |
| --- | --- | --- | --- |
| "Every time, we started from scratch"; "we redid it each week" | `repeat` | the task | `recurs` on the task: the period, how many runs to draw |
| "Everyone had their own copy"; "the versions drifted apart" | `drift` | the means (the document, file, or tool) | `versions` on the means: two to five labels |
| "It was all over the place"; "we pulled it from five systems" | `scatter` | the task (or the person) | three or more relationships from it to means or people |
| "Nobody checked it"; "the hand-off never happened" | `gap` | the relationship that was missing or broken | a pain that `hurts` that relationship |
| "Requests piled up"; "everything waited on one person" | `wait` | the person or task everything waited on | `queue` on it: how many items to draw, what they are |
| "It took two days"; "it cost us N errors a month" | `cost` | (measures) | `measures`: a label, value, and unit, each cited |
| Several of these at once, or the old way itself is the point | `map` | — | the before model as it is |

- One figure, one pain pattern. If a scene states two patterns, it is two scenes, or the `map`.
- The first problem scene introduces the user. Every figure draws the user, but the `map` shows them most
  fully; use a figure for the second problem scene when the first is the `map`.
- A `cost` figure that shows the value with the solution (`compare: true`) belongs in a `why` scene: an after
  value is a fact about the solution, and problem scenes show none.

## When the data is missing

The figures' numbers and labels come only from facts: the operator's answers at setup (question 6, "anything
countable") and the sources. Never estimate a count, a duration, or a version to make a figure work. If the
figure that fits needs data the fact sheet does not have:

1. Use the `map`, with the pain highlighted, for this run.
2. Note the missing count in `gate-feedback.md`, so the operator can supply it (stage 01 then adds the fact
   and the field, and the stages after it re-run).

## Limits

- At most nine elements in a figure, pains included; it shows at most three pains (the first three in model
  order that fall on what it draws).
- `repeat` draws three to six runs; `wait` two to twelve items; `drift` two to five versions; `scatter` up to
  six places; `cost` one to three measures.
- A figure that would render below the 16px label floor fails the build like any view: give the scene the
  `diagram` layout, use fewer pains on the figure, or shorten the names at stage 01.
