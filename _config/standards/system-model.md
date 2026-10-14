# Standard: System Model

Every diagram in an explainer is a view of one model: `stages/01_discover/output/system-model.yaml`,
validated by `system-model.schema.json` and `scripts/check-model.mjs`. Nothing is drawn freehand. The
model is adapted from C4 (c4model.com), generalized so it fits non-software solutions too.

A run never edits this file. Changes are made in the template.

## Terms

Stage 01 shows the operator this section at its first gate, so the words mean the same thing to everyone.

### Element types

| Type | It is | It is not |
| --- | --- | --- |
| `actor` | A person or role who uses or operates the solution | A tool or a system |
| `system` | The solution being explained. Exactly one per model. | One of its parts |
| `external` | Something outside the solution that it depends on or talks to | Part of the solution, even if the operator also runs it |
| `function` | A major part of the solution, named by what it does, that is kept, versioned, or located separately | A code function, or a Docker container |
| `component` | A logical part inside a function | A file or folder (those are L4 detail) |
| `store` | A place where data or knowledge persists | A service that does work; a store has no behavior of its own |

A store that is a single file (a config file, a data file) sets `form: file`; it is drawn as a file, not a
cylinder, and labelled `[file]`. A folder of files, a database, or a vault stays a plain store.

A `function` is the type most likely to be ambiguous outside software. Use it for anything that is kept,
versioned, or located separately and that does something (a repo, a folder tree with its own lifecycle, a
service, a vault). Record the case in the retro when the call was hard.

**Zoom candidates.** Anything the explainer may zoom into is a `function` with parts, never a `store`. If a
store needs parts, the call was wrong: it is a function that holds data. Stage 01 settles the candidates
with the operator and decomposes them.

### Levels

| Level | Name | It shows |
| --- | --- | --- |
| L1 | Context | The system as one box, with the people and outside things it touches |
| L2 | Functions | The functions and stores inside the system, and how they relate |
| L3 | Components | The components and stores inside one function |
| L4 | Code | Folders, files, and config. Shown in map panels only, never as a diagram. |

"Layer 3" always means the workshop's context layer 3. A level is always written "L3" or by its name.

### Other words

| Word | Meaning here |
| --- | --- |
| `name` | The functional name: what the element does ("Agent setup") |
| `exact_name` | The real name, shown in parentheses after the name ("Agent setup (aiso-ops)") |
| what it does | Three to five short statements of what an element does, kept in the model |
| responsibility | One line: what the element is accountable for |
| `why_separate` | One line: why it is its own element and not part of its parent or a sibling |

## Element fields

| Field | Required | Rule |
| --- | --- | --- |
| `id` | yes | Stable, lowercase kebab-case. Never renamed once stage 01 is approved. |
| `name` | yes | The functional name: what the element does. Naming drift goes to `conflicts.md`, not into a second element. |
| `exact_name` | no | The real name (repo, folder, or product name). `check-model` notes a `function` without one. |
| `type` | yes | One of the six types above |
| `parent` | per table | The parent element's `id` |
| `form` | no | `file`, on a `store` only: the store is one file |
| `responsibility` | yes | One line, at most 12 words |
| `why_separate` | yes | One line: why this is its own element and not part of its parent or a sibling |
| `what_it_does` | no | A list of 3 to 5 items, each `text` (one line, at most 12 words) and `sources` (fact IDs, at least one). Read by structure views, the expand popover, and map panels. |
| `sources` | yes | Fact IDs from `fact-sheet.md` (`F001`), at least one |
| `tech` | no | Technology or medium, short |
| `tags` | no | Free labels |

Diagrams, panels, and the expand popover show an element as `name (exact_name)`.

## Where parents go

| Type | Parent |
| --- | --- |
| `actor`, `system`, `external` | none |
| `function` | the `system` |
| `component` | a `function` |
| `store` | the `system` or a `function` |

## Relationships

| Field | Required | Rule |
| --- | --- | --- |
| `id` | yes | Stable kebab-case, unique among relationships |
| `from`, `to` | yes | Element IDs that exist |
| `verb` | yes | Present tense, short: "triggers", "reads", "writes", "files to". Never empty. |
| `kind` | yes | `control` (one thing makes another act), `data` (information moves), or `human` (a person acts) |
| `sources` | yes | Fact IDs, at least one |

## Integrity rules (checked by `check-model`)

1. Exactly one `system` element.
2. Parent types follow the table: a `function`'s parent is the system, a `component`'s is a function, a
   `store`'s is the system or a function. `actor`, `system`, and `external` have no parent.
3. No orphans: every element other than the system has a child or takes part in a relationship.
4. No relationship references a missing element.
5. Every element and relationship cites at least one fact ID, and every cited ID exists in the fact sheet.
   That includes the IDs in `what_it_does` items.
6. `responsibility` is at most 12 words, and so is each `what_it_does` text; each list has 3 to 5 items.
7. A note (not a failure) for each `function` without an `exact_name`.

## Example

```yaml
schema_version: 1
elements:
  - id: operator
    name: Operator
    type: actor
    responsibility: Runs workflows and reviews every stage output
    why_separate: The only human in the loop
    sources: [F001]
  - id: example-system
    name: Example System
    type: system
    responsibility: Turns recurring work into reviewed, reusable runs
    why_separate: The solution being explained
    sources: [F002]
  - id: templates
    name: Workflow design
    exact_name: Workflow templates
    type: function
    parent: example-system
    responsibility: Define each workflow's stages, contracts, and references
    why_separate: Versioned and released separately from the runs they create
    what_it_does:
      - text: Defines each workflow's stages and their contracts
        sources: [F004]
      - text: Holds the standards every run follows
        sources: [F004]
      - text: Is versioned and released separately from runs
        sources: [F004]
    sources: [F004]
relationships:
  - id: operator-runs-templates
    from: operator
    to: templates
    verb: creates runs from
    kind: human
    sources: [F005]
```
