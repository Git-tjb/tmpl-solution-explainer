# Setup Questionnaire (once per run)

Run this right after the instance is created. Ask the operator each question, then write the answers into
the frontmatter of `_config/run.md`, replacing every `{{...}}` placeholder. Anything that doesn't fit the
frontmatter goes in its body. Ask every question; never fill an answer in silently. Where a question has a
default, offer it and let the operator accept or change it.

1. **Solution name** (`solution`), and the canonical names of its major parts (`canonical_names`), so
   discovery can flag naming drift.
2. **Audience** (`audience`): one or more of colleagues, leadership, clients, peers, or other (say who).
   **Familiarity** (`familiarity`): none, some, or expert.
3. **Intent** (`intent`): one primary and at most one secondary, from educate (explanation), how-to
   (train), persuade (sell).
4. **Opening order** (`opening`): in the operator's words, as free text. Examples: "outcome first" (the
   usual choice for leadership and clients), "story first: why it was built, then the outcomes", "the
   problems and the conditions that drove the need, then how the design meets them". Stage 02 turns this
   into the opening the storyboard follows.
5. **Takeaway** (`takeaway`): one sentence on what the audience should understand or do afterward.
6. **The user and the problem.** The explainer opens on these, before it shows the solution, so ask each one
   and record the operator's words:
   - **Who uses it** (`user`): the role, not a name.
   - **What they were trying to do** (`user_goal`).
   - **How it was done before** (`before`): the tools, steps, and people, before the solution existed.
   - **What hurt** (`pains`): one to four items, one pain each.
   - **Anything countable** (`pain_counts`, optional): for each pain, anything the operator can count or
     measure: how often it happened, how long it took, how many places or copies were involved, how much
     waited. These draw the problem figures (`stages/03_storyboard/references/problem-figures.md`); without
     them the explainer shows the problem as a map of the old way. Never estimate one for the operator.
7. **Length** (`target_minutes`): default 15, at most 15.
8. **Sources** (`sources`): each repo, folder, or file to read, with its absolute path, primary or
   supporting, and a note. Stage 01 copies them into the run before reading them; nothing is read from the
   original location after that.
9. **Usage examples** (`usage_examples`): one or two real ways the operator uses the solution, or "let
   discovery propose".
10. **Animation** (`animation`): allowed (default) or not.
11. **Visual direction** (`visual`): always asked. Either `default` (the template's look), or a short
    description of a look for this run. Also anything to avoid beyond `_config/banned-patterns.md`
    (`avoid`). A run look is built in stage 04; the template ships none.
    - **References** (`visual_references`, up to three): ask for them as colours (hex values), fonts (a
      family name, and the font file if the operator has it), or images (a screenshot or picture, by path).
      A URL is allowed, but a page fetch does not return a site's styles, so ask for its colours, fonts, or
      a screenshot as well. Image and font files are copied into the run by stage 01.
    - **Title visual** (`title_visual`): the title scene opens the explainer with a picture of the solution.
      By default (`from: model`) it is drawn from the solution's own structure. The operator may instead
      supply an image (`from: image`) with its licence; stage 04 shows it for approval. Record what the
      title should convey in `note`.
12. **Must include, must exclude** (`must_include`, `must_exclude`): topics or components.
13. **Where and how it runs** (`environment`): the machines, tools, and harnesses the solution runs on.
    Documents often leave this out, so ask it directly.
14. **Intent and constraints** (`intent_notes`): what the operator meant the solution to achieve that the
    documents may not say, and the conditions it had to work within (time, budget, tools, people, rules).
    Record the operator's words; stage 01 quotes them in `operator-notes.md`.

When `run.md` has no placeholders left, start in `stages/01_discover/`.
