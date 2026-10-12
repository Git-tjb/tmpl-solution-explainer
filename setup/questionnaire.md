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
6. **Length** (`target_minutes`): default 15, at most 15.
7. **Sources** (`sources`): each repo, folder, or file to read, with its absolute path, primary or
   supporting, and a note. Stage 01 copies them into the run before reading them; nothing is read from the
   original location after that.
8. **Usage examples** (`usage_examples`): one or two real ways the operator uses the solution, or "let
   discovery propose".
9. **Animation** (`animation`): allowed (default) or not.
10. **Visual direction** (`visual`): always asked. Either `default` (the template's look), or a short
    description of a look for this run, with up to three references (`visual_references`: examples or
    styles to aim for). Also anything to avoid beyond `_config/banned-patterns.md` (`avoid`). A run look is
    built in stage 04; the template ships none.
11. **Must include, must exclude** (`must_include`, `must_exclude`): topics or components.
12. **Where and how it runs** (`environment`): the machines, tools, and harnesses the solution runs on.
    Documents often leave this out, so ask it directly.
13. **Intent and constraints** (`intent_notes`): what the operator meant the solution to achieve that the
    documents may not say, and the conditions it had to work within (time, budget, tools, people, rules).
    Record the operator's words; stage 01 quotes them in `operator-notes.md`.

When `run.md` has no placeholders left, start in `stages/01_discover/`.
