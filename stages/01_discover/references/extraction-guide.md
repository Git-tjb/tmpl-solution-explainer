# Extraction Guide

## What to extract

| Topic (`topic` column) | Look for |
| --- | --- |
| `purpose` | What the solution is for; the problem it solves, in the sources' own words. Include the operator's intent from `run.md` `intent_notes` and `operator-notes.md`, cited as such. |
| `before` | The user (the role), what they were trying to do, how it was done before the solution existed, and what hurt, one fact per pain, and one per countable detail (how often, how long, how many places, copies, or waiting items). Mostly from `run.md` `user`, `user_goal`, `before`, `pains`, and `pain_counts`, cited as their `OPN` notes; also any source that describes the earlier state. Nothing about the solution goes here. The before model (`system-model.md`) cites these facts. |
| `outcomes` | What it produces or changes for its users; any measured result |
| `constraints` | The conditions behind design choices (time, budget, tools, people, rules). Keep these apart from goals, problems, and intent. |
| `environment` | Where and how the solution runs: machines, tools, harnesses. Documents often leave this out; `run.md` `environment` and the operator fill the gap. |
| `principle` | The guiding principle behind how the solution is split into parts, before any per-part reason |
| `components` | Each part and what it is responsible for |
| `what-it-does` | What each part does, as short statements (3-5 per function; see below) |
| `segmentation` | Why the parts are split the way they are; what went wrong before the split |
| `structure` | How it is built: folders, repos, files, config, technology |
| `usage` | How it is actually used, step by step; who triggers what. Include how the solution improves itself (for example, a retro feeding the next iteration). |
| `gaps` | What the sources say is missing, unfinished, or known to be weak |

## Fact sheet format

`fact-sheet.md` is one table per topic, in the order above. Scripts read the ID column.

```markdown
## purpose
| ID | Claim | Source |
| --- | --- | --- |
| F001 | The solution turns recurring work into staged, reviewed runs. | `sources/repo-a/docs/design.md` §1 |
| F002 | It was built so one person could repeat work without redoing it. | `operator-notes.md` OPN02 |
```

- IDs run F001, F002, ... across the whole sheet and never change once stage 01 is approved. A deleted
  fact leaves a gap; its ID is not reused.
- One claim per row, stated plainly. No inference beyond what the source says; an inference is marked
  "(inferred)" and cites every source it rests on.
- The source is a path inside `output/sources/` plus a section heading or line range. A statement the
  operator made is cited as `operator-notes.md` plus its note ID (`OPN01`, `OPN02`, ...); it is a source
  like any other.
- Where the operator's statement contradicts the sources, record both as facts and put the pair in
  `conflicts.md`. Never overwrite a sourced fact with the operator's version.

## What it does

A `function` in the model carries 3-5 "what it does" items (`what_it_does`). Extract them as facts in the
`what-it-does` topic: one fact per item, written as a short present-tense line of at most 12 words, naming
the function by its functional name ("Agent setup deploys the entry instructions."). The model's items cite
these fact IDs. Sources state what a part does in prose; split and shorten, don't invent.

## Priorities

- Design docs, READMEs, and routing files explain intent; read them first.
- Code, config, and folder structure show what is real. Where they disagree with a design doc, that is a
  conflict for `conflicts.md`, not a choice to make.
- A fact about something the operator listed in `must_exclude` is still recorded; stage 02 excludes it.

## Model building

- One element per thing the sources treat as one thing. If two names refer to the same thing, it is one
  element with the canonical name, and the difference goes to `conflicts.md`.
- Name elements by what they do, with the exact name where it differs ("Agent setup", exact name
  `aiso-ops`). The Terms section of `system-model.md` says what each element type means and does not mean.
- `why_separate` comes from the `segmentation` facts, and the `principle` facts say what rule the split
  follows. If no source says why something is separate, write "(no source)" and list it in `conflicts.md`
  for the operator to answer.
