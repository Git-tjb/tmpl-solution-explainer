# Information Architecture Rules

How every explainer organizes what it says. Stages 02 and 03 apply these; `scripts/check-storyboard.mjs`
checks the ones marked (checked).

1. **Answer first (Minto).** The first scene states the core message in one sentence over the L1 picture.
   Every later scene supports that statement. (checked: S01 is section `answer`, level L1)
2. **One mode per scene (Diátaxis).** Each scene is `explanation` or `how-to`. Reference content never
   appears on the linear path; it lives in the map. No scene mixes modes. (checked)
3. **One level per scene.** Each scene has one level, `L1`, `L2`, `L3`, or `flow`, and shows one view of that
   level. The orientation scene has level `key` and no view. (checked: the scene's view has the scene's
   level)
4. **Structure before wiring.** The first L2 scene shows a structure view (what each function does, no
   lines); the wired view (how they reference each other) comes after, and no flow scene comes before the
   first structure scene. (checked)
5. **Orient before you go deeper.** Exactly one orientation scene, after the answer and before the first L2
   or L3 scene, shows the four levels and which scenes use each. (checked)
6. **Problem before design.** The segmentation section shows the baseline or naive alternative first, then
   presents each split as the fix for a specific problem, drawn from the element's `why_separate`.
7. **Examples introduce nothing new.** A usage-example flow references only elements already shown on the
   path before it. Examples double as the recap. (checked)
8. **Progressive disclosure.** The linear path is the first level; the map is the clearly labeled second.
   No deeper nesting.
9. **Multiple intents.** Each intent gets its own section. Intents are never blended within a scene.
   (checked: with two intents, every scene in structure, segmentation, build, and in-use names one `intent`)
10. **One point per scene.** `point` is one sentence. If it needs "and", it is two scenes.
11. **Sparse text.** At most 3 on-screen lines per scene, each at most 12 words. The operator narrates the
   rest. (checked)
12. **Close returns to the answer.** The last scene is section `close`, `returns_to: S01`, and shows S01's
    view. (checked)
13. **Everything traces.** Every scene cites fact IDs that exist in the fact sheet. (checked)
