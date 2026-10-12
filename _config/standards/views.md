# Standard: Views

A view is one picture of the system model at one level. Stage 03 names the views a run uses; stage 04
writes a view spec for each (`stages/04_design/output/views/<view-id>.yaml`, validated by
`view.schema.json`); `scripts/render-diagrams.mjs` draws them. A view never redraws the model differently:
it selects and highlights.

A run never edits this file. Changes are made in the template.

## Levels

| Level | View | Shows | Question it answers | Scope |
| --- | --- | --- | --- | --- |
| L1 | Context | The system as one box, with its actors and externals | What is it, and who or what does it touch? | the system |
| L2 | Functions | The functions and stores inside the system, and how they relate | What are the major pieces, and why split this way? | the system |
| L3 | Components | The components and stores inside one function | How does this piece work? | one function |
| L4 | Code | Folder tree, file layout, config | What does it actually look like? | one element |
| flow | Flow | One flow from `flows.yaml` | What happens, in what order? | one flow |

- One view, one level. Never mix levels.
- L1 and L2 views are mandatory in every run.
- L3 views exist only for functions that are in scope (`02_scope`).
- L4 is not a diagram. It appears only in a map panel, built from the source snapshot, never on the linear
  path unless a usage example needs it.

## What a view includes by default

- **L1:** the system, plus every actor and external with a relationship to the system or anything inside it.
- **L2:** the system's children, plus every actor and external related to any of them.
- **L3:** the function's children, plus every element outside the function that they relate to, shown as
  its L2-level ancestor.
- **Relationships:** every relationship between included elements. A relationship to a hidden element is
  drawn to that element's nearest visible ancestor. Two relationships that end up with the same ends are
  drawn as one, their verbs joined with "; ".

A view spec may narrow the element list. It may not add an element of the wrong level.

## Modes

A view is `wired` (the default) or `structure`.

- **Wired:** elements and the relationship lines between them (how the parts reference each other).
- **Structure:** elements only, as a grid, each showing its `what_it_does` bullets; no lines. Only L2 and L3
  views can be structure views. Structure comes before wiring: a run shows a structure view of the
  functions (what each does) before it shows the wired view of how they connect.

## Per-view rules (checked by `check-design`)

1. **Title** has the form `<Level name>: <scope name>`: "Context: Example System", "Functions: Example
   System", "Components: Workflow templates", "Flow: Run one stage".
2. **Legend** on every view, generated from the element or node types present. Never written by hand.
3. **Type label** on every element (C4's rule; it removes level ambiguity).
4. **At most 9 elements** per view, neighbors included. Over 9: split the view, or narrow it.
5. **Position holds across levels.** An L3 view names the L2 view it zooms from (`inherit_from`). The
   function's region expands in place and its neighbors keep their L2 positions.
6. **Highlighting** selects a subset of elements, relationships, or flow steps, as named states in the view
   spec. It never changes the layout.
7. **Pins** (positions or ordering constraints) are recorded in the view spec only, never hand-edited into a
   rendered diagram.
8. **Mode.** `mode: structure` is allowed on L2 and L3 views only, and a structure view has no `pins` and no
   relationship highlights in its states.
