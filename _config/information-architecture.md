# Information Architecture Rules

How every explainer organizes what it says. Stages 02 and 03 apply these; `scripts/check-storyboard.mjs`
checks the ones marked (checked), and `scripts/check-design.mjs` the ones marked (design).

1. **Title, then the problem, then the answer (Minto, after the problem).** The first scene is the title: the
   solution's name, its purpose line, and a picture of it. One or two scenes then say who the user is and what
   hurt, on before views. The next scene states the core message in one sentence over the L1 picture, as the
   answer to that problem. Every later scene supports that statement. (checked: S01 is `title`; then one or two
   `problem` scenes; then the one `answer` scene, at L1)
2. **One mode per scene (Diátaxis).** Each scene is `explanation` or `how-to`. Reference content never
   appears on the linear path; it lives in the map. No scene mixes modes. (checked)
3. **One level per scene.** Each scene has one level, `before`, `L1`, `L2`, `L3`, or `flow`, and shows one view
   of that level. The title scene has level `title` and no view. (checked: the scene's view has the scene's
   level)
4. **Structure before wiring.** The first L2 scene shows a structure view (what each function does, no
   lines); the wired view (how they reference each other) comes after, and no flow scene comes before the
   first structure scene. (checked)
5. **Levels on demand.** How to read the levels is not a scene. The page's Levels control shows the four
   levels, what each shows, and the scenes that use each, on every scene.
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
12. **The close shows what was learned.** The last scene is section `close`, `returns_to` the answer scene,
    and restates the core message over a picture the opening (title, problem, answer) did not show. (checked)
13. **Everything traces.** Every scene cites fact IDs that exist in the fact sheet, and so does every
    on-screen line: the facts that carry it. (checked; whether the facts carry the line is judged at the
    stage 03 gate from `lines.md`)
14. **Every scene earns its picture.** No two scenes show the same picture unless the later one adds
    something (a highlight, a reveal, a zoom), and says what in `adds`. (checked: a repeated view needs
    `adds`; design: the same view, highlight, and reveals twice fails)
15. **Problems show the problem.** A scene about a problem shows a before view, never the solution with parts
    outlined. (checked: every `problem` scene, and any scene with `about: problem`)
16. **Lines add to the message.** An on-screen line says something the scene's message does not.
    (checked as a warning: a line whose words are mostly in the message is flagged in the report and in
    `lines.md`; the gate decides)
17. **One reveal behaviour.** On-screen lines appear one per step in every scene, or all from the start in
    every scene (`text_reveal`). (design)
