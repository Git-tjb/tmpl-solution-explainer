# Setup Questionnaire (once per run)

Run this right after the instance is created. Ask the operator each question, then write the answers into
the frontmatter of `_config/run.md`, replacing every `{{...}}` placeholder. Anything that doesn't fit the
frontmatter goes in its body.

1. **Solution name** (`solution`), and the canonical names of its major parts (`canonical_names`), so
   discovery can flag naming drift.
2. **Audience** (`audience`): one or more of colleagues, leadership, clients, peers, or other (say who).
   **Familiarity** (`familiarity`): none, some, or expert.
3. **Intent** (`intent`): one primary and at most one secondary, from educate (explanation), how-to
   (train), persuade (sell).
4. **Opening order** (`opening`): outcome-first (the default for leadership and clients) or story-first
   (why it was built, then outcomes).
5. **Takeaway** (`takeaway`): one sentence on what the audience should understand or do afterward.
6. **Length** (`target_minutes`): default 15, at most 15.
7. **Sources** (`sources`): each repo, folder, or file to read, with its absolute path, primary or
   supporting, and a note. Stage 01 copies them into the run before reading them; nothing is read from the
   original location after that.
8. **Usage examples** (`usage_examples`): one or two real ways the operator uses the solution, or "let
   discovery propose".
9. **Animation** (`animation`): allowed (default) or not.
10. **Visual references** (`visual_references`, `avoid`): optional, up to three examples or styles to aim
    for, and anything to avoid beyond `_config/banned-patterns.md`.
11. **Must include, must exclude** (`must_include`, `must_exclude`): topics or components.

When `run.md` has no placeholders left, start in `stages/01_discover/`.
