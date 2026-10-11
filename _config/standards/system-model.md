# Standard: System Model

Every diagram in an explainer is a view of one model: `stages/01_discover/output/system-model.yaml`,
validated by `system-model.schema.json` and `scripts/check-model.mjs`. Nothing is drawn freehand. The
model is adapted from C4 (c4model.com), generalized so it fits non-software solutions too.

A run never edits this file. Changes are made in the template.

## Element types

| Type | Meaning | Parent |
| --- | --- | --- |
| `actor` | A person or role who uses or operates the solution | none |
| `system` | The solution being explained. Exactly one per model. | none |
| `external` | Something outside the solution that it depends on or talks to | none |
| `container` | A separately versioned, deployable, or located unit inside the solution | the `system` |
| `component` | A logical part inside a container | a `container` |
| `store` | A place where data or knowledge persists | the `system` or a `container` |

`container` is the type most likely to be ambiguous outside software. Use it for anything that is kept,
versioned, or located separately (a repo, a folder tree with its own lifecycle, a service, a vault). Record
the case in the retro when the call was hard.

## Element fields

| Field | Required | Rule |
| --- | --- | --- |
| `id` | yes | Stable, lowercase kebab-case. Never renamed once stage 01 is approved. |
| `name` | yes | The canonical name. Naming drift goes to `conflicts.md`, not into a second element. |
| `type` | yes | One of the six types above |
| `parent` | per table | The parent element's `id` |
| `responsibility` | yes | One line, at most 12 words |
| `why_separate` | yes | One line: why this is its own element and not part of its parent or a sibling |
| `sources` | yes | Fact IDs from `fact-sheet.md` (`F001`), at least one |
| `tech` | no | Technology or medium, short |
| `tags` | no | Free labels |

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
2. Parent types follow the table: a `container`'s parent is the system, a `component`'s is a container, a
   `store`'s is the system or a container. `actor`, `system`, and `external` have no parent.
3. No orphans: every element other than the system has a child or takes part in a relationship.
4. No relationship references a missing element.
5. Every element and relationship cites at least one fact ID, and every cited ID exists in the fact sheet.
6. `responsibility` is at most 12 words.

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
    name: Workflow templates
    type: container
    parent: example-system
    responsibility: Define each workflow's stages, contracts, and references
    why_separate: Versioned and released separately from the runs they create
    sources: [F004]
relationships:
  - id: operator-runs-templates
    from: operator
    to: templates
    verb: creates runs from
    kind: human
    sources: [F005]
```
