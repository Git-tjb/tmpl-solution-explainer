# Extraction Guide

## What to extract

| Topic (`topic` column) | Look for |
| --- | --- |
| `purpose` | What the solution is for; the problem it solves, in the sources' own words |
| `outcomes` | What it produces or changes for its users; any measured result |
| `components` | Each part and what it is responsible for |
| `segmentation` | Why the parts are split the way they are; what went wrong before the split |
| `structure` | How it is built: folders, repos, files, config, technology |
| `usage` | How it is actually used, step by step; who triggers what |
| `gaps` | What the sources say is missing, unfinished, or known to be weak |

## Fact sheet format

`fact-sheet.md` is one table per topic, in the order above. Scripts read the ID column.

```markdown
## purpose
| ID | Claim | Source |
| --- | --- | --- |
| F001 | The solution turns recurring work into staged, reviewed runs. | `sources/repo-a/docs/design.md` §1 |
```

- IDs run F001, F002, ... across the whole sheet and never change once stage 01 is approved. A deleted
  fact leaves a gap; its ID is not reused.
- One claim per row, stated plainly. No inference beyond what the source says; an inference is marked
  "(inferred)" and cites every source it rests on.
- The source is a path inside `output/sources/` plus a section heading or line range.

## Priorities

- Design docs, READMEs, and routing files explain intent; read them first.
- Code, config, and folder structure show what is real. Where they disagree with a design doc, that is a
  conflict for `conflicts.md`, not a choice to make.
- A fact about something the operator listed in `must_exclude` is still recorded; stage 02 excludes it.

## Model building

- One element per thing the sources treat as one thing. If two names refer to the same thing, it is one
  element with the canonical name, and the difference goes to `conflicts.md`.
- `why_separate` comes from the `segmentation` facts. If no source says why something is separate, write
  "(no source)" and list it in `conflicts.md` for the operator to answer.
