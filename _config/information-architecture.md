# Information Architecture Rules

How every explainer organizes what it says. Stages 02 and 03 apply these; `scripts/check-storyboard.mjs`
checks the ones marked (checked).

1. **Answer first (Minto).** The first scene states the core message in one sentence over the L1 picture;
   the second shows the L2 picture. Every later scene supports that statement. (checked: S01 is section
   `answer`, level L1)
2. **One mode per scene (Diátaxis).** Each scene is `explanation` or `how-to`. Reference content never
   appears on the linear path; it lives in the map. No scene mixes modes. (checked)
3. **One level per scene.** Each scene has one level, `L1`, `L2`, `L3`, or `flow`, and shows one view of that
   level. The answer section uses two scenes for this reason. (checked: the scene's view has the scene's
   level)
4. **Problem before design.** The segmentation section shows the baseline or naive alternative first, then
   presents each split as the fix for a specific problem, drawn from the element's `why_separate`.
5. **Examples introduce nothing new.** A usage-example flow references only elements already shown on the
   path before it. Examples double as the recap. (checked)
6. **Progressive disclosure.** The linear path is the first level; the map is the clearly labeled second.
   No deeper nesting.
7. **Multiple intents.** Each intent gets its own section. Intents are never blended within a scene.
   (checked: with two intents, every scene in sections 3-5 names one `intent`)
8. **One point per scene.** `point` is one sentence. If it needs "and", it is two scenes.
9. **Sparse text.** At most 3 on-screen lines per scene, each at most 12 words. The operator narrates the
   rest. (checked)
10. **Close returns to the answer.** The last scene is section `close`, `returns_to: S01`, and shows S01's
    view. (checked)
11. **Everything traces.** Every scene cites fact IDs that exist in the fact sheet. (checked)
