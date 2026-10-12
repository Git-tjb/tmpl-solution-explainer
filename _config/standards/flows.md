# Standard: Flows

Flows explain behavior: what happens, in what order, through which parts of the model. They are C4's
dynamic diagrams with typed nodes. They live in `stages/01_discover/output/flows.yaml`, validated by
`flow.schema.json` and `scripts/check-model.mjs`. Every usage example on the linear path is a flow.

A run never edits this file. Changes are made in the template.

## Node types

| Type | Meaning | `on:` binds to |
| --- | --- | --- |
| `trigger` | What starts the flow: a human session, a schedule, an event | nothing |
| `step` | A unit of work | the element that performs it (any type except `system`) |
| `gate` | A human review or decision point | usually an `actor` |
| `decision` | An automated branch | the element that decides |
| `store` | Reading from or writing to persistent state | a `store` element |
| `external` | A call to something outside the system | an `external` element |
| `output` | The flow's end result | nothing |

`gate` and `decision` are distinct on purpose: human-in-the-loop is often the point being explained.

## Node fields

| Field | Required | Rule |
| --- | --- | --- |
| `id` | yes | Kebab-case, unique within the flow |
| `type` | yes | One of the types above |
| `label` | yes | Short; what happens here |
| `step` | yes | Execution order, 1..n, unique within the flow. These numbers become the reveal steps. |
| `on` | per table | A model element ID |
| `sources` | yes | Fact IDs, at least one |

## Edges

Each edge has `from`, `to`, `kind` (`control`: drawn solid; `data`: drawn dashed), and a short verb
`label`. Every edge leaving a `decision` also has a `condition`.

## Rules (checked by `check-model`)

1. Every node except `trigger` and `output` has `on:`, and it names an existing element of the allowed type.
2. Every flow has exactly one `trigger` and at least one `output`.
3. Steps are numbered 1..n without gaps or repeats.
4. At most 12 nodes per flow. Split a longer flow and link the parts with `continues`.
5. Every node and every flow cites at least one fact ID that exists in the fact sheet.
6. Lanes are not written by hand: when a flow is drawn with lanes, each node's lane is the function its
   `on:` element belongs to (or the element itself, for actors, externals, and the system).

## Example

```yaml
schema_version: 1
flows:
  - id: run-a-stage
    title: Run one stage
    sources: [F010]
    nodes:
      - id: start
        type: trigger
        label: Operator opens a session
        step: 1
        sources: [F010]
      - id: load
        type: step
        label: "Load the contract, then run the stage"
        on: instance
        step: 2
        sources: [F011]
      - id: review
        type: gate
        label: Operator reviews output
        on: operator
        step: 3
        sources: [F012]
      - id: done
        type: output
        label: Approved stage output
        step: 4
        sources: [F012]
    edges:
      - from: start
        to: load
        kind: control
        label: starts
      - from: load
        to: review
        kind: data
        label: writes output for
      - from: review
        to: done
        kind: control
        label: approves
```

Write records in block style, as above. In flow style (`{ a: b, c: d }`) an unquoted value with a comma
splits into two keys, and the file stops validating or, worse, still validates with the wrong text. If a
value has a comma or a colon, quote it either way (`label: "Load the contract, then run the stage"`).
