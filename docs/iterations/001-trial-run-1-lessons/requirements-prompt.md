---
iteration: "001"
component: tmpl-solution-explainer
origin: personal
proposals: []
retros: []            # trial run 1's retro has no retro_id: the instance was not archived (see Sources below)
---
# Requirements Prompt: Solution Explainer ICM Workflow (V1)

> Input for the ICM Architect skill. Build one reusable ICM workspace template that turns a completed solution's source material into a local, dark-mode explainer that the operator presents live over Zoom/Teams.
>
> **Rev 4, 2026-10-11.** Rev 3 plus what the first trial run taught (its retro: instance `ws-ai-workshop--ai-workshop-explainer`, `stages/07_retro/output/retro.md`, with each stage's `gate-feedback.md`) and the operator's decisions on it, all recorded in this prompt: the C4 type `container` becomes `function`, elements are named by what they do; a level indicator, an orientation scene, and structure before wiring; expandable "what it does" bullets stored in the model; scene mockups at design; a run may bring its own theme; intent, constraints, and visual direction captured up front; up to 14 scenes. Earlier revisions: rev 3 removed the assumption of a specific output format, which the functional design picks (§2, Output format); rev 2 applied the workshop-fit review (`review-rev1.md`). This is a requirements document: where it names files, folders, scripts, or libraries, those are proposals the functional design confirms or replaces, not settled decisions. It names no person; the person who runs the workshop and presents is "the operator."

---

## 1. Purpose

Create a reusable ICM workflow that produces a **local explainer** for a solution the operator has built. It is for live presentation only: the operator narrates, there is no voiceover and there are no speaker notes, and the audience doesn't receive a copy. The explainer helps the operator show colleagues, leadership, clients, and peers what the solution does, why it was built, and how it is structured and operates.

The workflow must be reusable for any solution:

- **Per-run input only.** Everything specific to a solution enters through the setup questionnaire and the discovered sources, never through edits to stage contracts.
- **Shared standards.** Every run rationalizes and draws information the same way (§5), so explainers for different solutions are structurally comparable.

**First target solution:** the AI Workshop (`aiso-workbench`, `aiso-ops`, workflow templates, instances under `projects/`, KB vaults).

## 2. V1 scope

**In scope**
- One explainer per run, describing only what was found in discovery
- A shared information standard: a structural model, view levels, and node-based flow diagrams (§5)
- Dark mode only
- A linear narrated path, plus a component map that acts as the reference layer
- Optional per-scene animations
- Automated verification: links, animations, behavior on every target machine, standard usability and accessibility checks, standards conformance
- Workspace and output live under the workshop's projects root (from local context)
- **Runs the same on any workshop machine** where its tooling is installed. Stages may use the network (e.g., to install tooling); the finished explainer does not
- Sources are **snapshotted** into the run with provenance before discovery reads them; no stage reads a vault or solution repo after that
- **The operator's intent, constraints, and visual direction are captured at the start** (setup and discovery), so a later gate never has to send work back for something the operator knew all along
- **The audience always knows which level it is looking at:** every scene shows its level (context, function, component, code) the same way, and an orientation scene early on shows how the explainer moves through the levels
- **Structure before wiring:** the audience sees each function and what it does before any flow or reference lines connect them
- **Any element can be expanded** (on a click) to show 3-5 bullets of what it does: the logic or rules kept there, or the functions it applies. This is a glimpse of the next level of detail, not a new level
- **Explainers are conceptual and logical by default:** where and how the functional pieces are separated, why, and what they reference from each other. Depth (how many functions get zoomed) is set by the target length and the audience; scope excludes by depth, not by dropping pieces that complete the story
- **The operator reviews scenes, not just diagrams:** design produces a mockup of every scene, in storyboard order
- **A run may bring its own visual theme**, for that run only; the template ships one default look and no themes

**Out of scope for V1** (do not design for these, but don't preclude them)
- Awareness of previous explainer versions, version diffs, "what's new" scenes
- Design continuity with prior explainers
- Any hosting or publishing
- Speaker notes or presenter view
- Light mode or a theme toggle
- A formal visual design system (V1 uses a lightweight visual-direction reference file)
- A library of reusable themes in the template (a theme that proves itself across runs may be kept for reuse later)
- Any stage filing into a vault, or copying into the solution's repo (the operator places the explainer manually after the build). A completed run is still archived whole into its project's KB vault by the workshop's standard close-out.
- Copies or leave-behinds for the audience
- Automated checks for sensitive content (the operator clears content at the gates)

**Output format**

The functional design picks the output format (and any language or tooling behind it). Whatever it picks must:
- be presented live from the operator's machine over a Zoom/Teams screen share
- open locally and offline while presented, with no server and nothing to install
- let the presenter step forward and back through the linear path, one reveal at a time
- offer the map as a second, non-linear layer, with direct jumps to any scene and any element's reference panel
- animate state changes on the presenter's trigger, each landing on a static end state, with a reduced-motion option that shows end states directly
- show diagrams generated from the system model, never drawn by hand
- be checkable automatically against the §11 acceptance criteria
- behave the same on every workshop machine
- be buildable by an agent from text, without manual editing in a GUI tool

The design records the chosen format and how it meets each point above.

## 3. Conventions to follow

**Workspace files and folders**
- **Layer 0:** `AGENTS.md` is canonical, so the workspace runs in any harness, including OpenCode. `CLAUDE.md` exists only as the one-line pointer the workshop schema requires.
- **Layer 1:** `CONTEXT.md` handles routing.
- **Stage folders:** two-digit numbering, `stages/NN_name/` containing `CONTEXT.md`, `references/`, and `output/`.
- **Layer 3 reference material:** `_config/` for workspace-wide material, `stages/*/references/` for stage-specific material.
- **Layer 4 working artifacts:** `stages/*/output/`.
- **Status:** `status.yml` at the workspace root holds run metadata in the workshop's standard fields. Stage state is read from the stage outputs, not recorded in `status.yml`.
- **Retro:** the last stage is a retro, as for every workshop pipeline template.

**Stage contracts**
- Every stage `CONTEXT.md` has four sections: `Inputs`, `Process`, `Outputs`, `Verify`.
- Inputs explicitly label which files are Layer 3 and which are Layer 4, written out as "Layer 3" and "Layer 4".

**Terminology** (must not collide)
- **Layer** means ICM context depth only.
- **Level** means zoom level of a view: L1 context, L2 function, L3 component, L4 code (§5.2). This matches the operator's convention that Level = scope. Only levels are abbreviated as `L1`-`L4`; a layer is always written out ("Layer 3"), never "L3".
- **Function** (element type) means a logical, separately kept part of the solution, named by what it does (§5.1). It replaces C4's `container`, whose everyday meaning (a Docker container) collides. Where "function" could be read as a code function, the standards' terms section says which is meant.
- **What it does** means the 3-5 bullets an element can expand to show; never called "functions", to avoid a function listing functions.
- **Mode** means Diátaxis mode (§5.6).
- **Tier** is not used in this workspace.

**Execution and access**
- **Harness independence:** no dependence on harness-specific features (e.g., Claude-only subagent delegation). Deterministic work is done by local scripts.
- **Read-only sources:** vault and repo sources are read-only. They are copied into the run with provenance at the start, and only the copies are read. No stage writes to a vault or to a solution repo.

## 4. Folder structure

```
projects/_templates/solution-explainer/       # the reusable template (this build)
├── AGENTS.md                                 # L0: identity, what this workspace does
├── CLAUDE.md                                 # one line: @AGENTS.md
├── CONTEXT.md                                # L1: stage routing
├── status.yml
├── setup/
│   └── questionnaire.md                      # filled per run → writes _config/run.md
├── _config/
│   ├── run.md                                # per-run answers (audience, intent, sources)
│   ├── narrative-arc.md                      # default storyboard arc (L3)
│   ├── information-architecture.md           # IA rules: answer-first, modes, levels (L3)
│   ├── visual-direction.md                   # default dark-mode look (L3)
│   ├── banned-patterns.md                    # anti "generic AI look" list (L3)
│   ├── build-rules.md                        # technical constraints for the explainer (L3)
│   └── standards/                            # shared across ALL runs — the consistency layer
│       ├── system-model.md                   # element types, relationship rules (§5.1)
│       ├── system-model.schema.json
│       ├── views.md                          # view levels and per-view rules (§5.2–5.3)
│       ├── flows.md                          # node-based flow standard (§5.4)
│       ├── flow.schema.json
│       ├── notation.md                       # one visual mapping per element/node type (§5.5)
│       └── layout-profile.json               # fixed layout options (§5.7)
├── scripts/                                  # deterministic helpers (see §8)
├── vendor/                                   # pinned third-party tooling, if the chosen format needs any
└── stages/
    ├── 01_discover/   CONTEXT.md, references/, output/
    ├── 02_scope/      CONTEXT.md, references/, output/
    ├── 03_storyboard/ CONTEXT.md, references/, output/
    ├── 04_design/     CONTEXT.md, references/, output/
    ├── 05_build/      CONTEXT.md, references/, output/
    ├── 06_verify/     CONTEXT.md, references/, output/
    └── 07_retro/      CONTEXT.md, references/, output/
```

**Per-run usage:**
1. Create an instance from the template with the workshop's standard instance tooling, at `projects/<project-name>/<solution>-explainer/`. For the first run, that is `projects/ai-workshop/ai-workshop-explainer/`. The project must exist as a project folder in a bound KB vault.
2. Fill in `setup/questionnaire.md`.
3. Run the stages. The finished explainer is written to `stages/05_build/output/`.

`_config/standards/` is copied unchanged with the template. A run may not edit it. Changes to the standards are made in the template and versioned there.

## 5. Information standards (the consistency layer)

These standards make every run rationalize a solution the same way, regardless of domain. The model is adapted from C4. C4 itself is notation-independent and does not prescribe a notation. Its guidance:

- Every diagram has a title describing its type and scope.
- Every diagram has a key/legend.
- Every element's type is stated explicitly.
- Every element has a short description of its responsibilities.

Source: <https://c4model.com/diagrams/notation>.

**Borrowed terms are defined.** Every term this workflow takes from C4 or similar frameworks is defined in the standards, with what it does *not* mean here, so the operator (at the gates) and the audience (on screen) never read it in its everyday technical sense.

**Core principle: diagrams are data.** Discovery produces a structured **system model** and a set of **flows**. Every diagram in the explainer is a *view* of that one model. Nothing is drawn freehand. This makes diagrams consistent within a run, comparable across runs, and verifiable against sources.

### 5.1 System model (`system-model.yaml`, validated by `system-model.schema.json`)

**Element types.** C4 has been generalized here so it fits non-software solutions such as workflows, knowledge systems, and toolchains.

| Type | Meaning | AI Workshop example |
|---|---|---|
| `actor` | A person or role who uses or operates the solution | The operator; a collaborator receiving a workspace |
| `system` | The solution being explained (exactly one per model) | AI Workshop |
| `external` | Something outside the solution that it depends on or talks to | Anthropic API, GitHub |
| `function` | A logical part of the solution that is kept, versioned, or located separately, named by what it does | "Rules and tooling (aiso-workbench)", "Knowledge (KB vaults)" |
| `component` | A logical part inside a function | "Stage contracts", "Hooks" |
| `store` | A place where data or knowledge persists | "Stage outputs", "Inbox" |

**Naming.** Functions and components are named by what they do, with the exact name in parentheses when it differs: "Agent setup (aiso-ops)". Anything the explainer will zoom into is a `function` with parts, decided with the operator at stage 01, not a `store`.

**Required fields on every element:**
- `id`: stable, kebab-case
- `name`
- `type`
- `parent`: required for `function`, `component`, and `store`
- `responsibility`: one line, ≤ 12 words
- `why_separate`: one line explaining why this is its own element. This makes the segmentation rationale explicit.
- `sources`: fact-sheet references

Optional fields: `tech`, `tags`, and `what_it_does`: 3-5 short bullets of the logic or rules kept in the element or the functions it applies, each citing at least one fact. Stored in the model so every view, the expand interaction, and the map read one sourced list.

**Relationship requirements:**
- Every relationship has `from`, `to`, `verb`, and `kind`.
- `verb` is a present-tense label such as "triggers", "reads", "writes", or "promotes to". It is never unlabeled.
- `kind` is one of `control`, `data`, or `human`.
- Every relationship carries `sources`.

**Integrity rules** (checked by schema plus `scripts/check-model`):
- Every element has a parent chain up to `system`, except `actor` and `external` elements.
- No orphan elements.
- No relationship references a missing element.
- Every element and relationship cites at least one source.

### 5.2 View levels

| Level | View | Shows | Audience question it answers |
|---|---|---|---|
| L1 | Context | The system as one box, with its actors and externals | "What is it and who/what does it touch?" |
| L2 | Functions | The functions inside the system and how they relate | "What are the major pieces and why split this way?" |
| L3 | Components | The components inside one function | "How does this piece work?" |
| L4 | Code | Folder tree, file layout, config | "What does it actually look like?" (reference layer only) |

**Rules:**
- One view = one level. Never mix levels in a view.
- L1 and L2 views are mandatory in every run.
- L3 views are created only for functions that are in scope.
- L4 views appear only in the map/reference layer, never on the linear path, unless a usage example requires them.

### 5.3 Per-view rules (`views.md`)

- **Title:** in the form "`<Level name>`: `<scope>`", e.g., "Functions: AI Workshop".
- **Level indicator:** every view and every scene shows which of the four levels it is at, in one consistent visual form that is part of the notation and works in any theme.
- **Structure view:** an L2 or L3 view can be shown as structure only (the parts and what they do, no reference lines), with the references added in a later step.
- **Legend:** every view has one, auto-generated from the element types present.
- **Type label:** every element shows its type label (C4's rule; it removes level ambiguity).
- **Element count:** ≤ 9 elements per view. If a view exceeds that, split it, or group elements into a parent and zoom.
- **Consistent position across levels:** an element keeps its relative position across levels. When zooming from L2 into a function, that function's region expands in place, and its neighbors stay where they were.
- **Highlighting:** a view can highlight a subset of elements and relationships. It never redraws the model differently.

### 5.4 Flow standard: node-based logical flows (`flows.yaml`, validated by `flow.schema.json`)

Flows explain behavior: what happens, in what order, through which parts. They complement the structural views. This corresponds to C4's dynamic diagrams, with typed nodes in place of generic boxes.

**Node types:**

| Node type | Meaning | Notes |
|---|---|---|
| `trigger` | What starts the flow | Human session, schedule, event |
| `step` | A unit of work | Must name the model element that performs it (`on:`) |
| `gate` | A human review/decision point | Distinct from `decision`, because human-in-the-loop is often the point being explained |
| `decision` | An automated branch | Labeled condition on each outgoing edge |
| `store` | Read from / write to persistent state | Must reference a `store` element in the model |
| `external` | A call to something outside the system | Must reference an `external` element |
| `output` | The flow's end result | |

**Rules:**
- Every node except `trigger` and `output` binds to a model element via `on:`. This ties behavior to structure: the same element looks and is named the same in a view and in a flow.
- Edges are `control` (solid) or `data` (dashed). Every edge has a short verb label.
- Steps are numbered in execution order. The numbers become the reveal steps when presented.
- Nodes can be grouped into **lanes by function**, so the audience sees which part of the system each step happens in.
- Each flow has ≤ 12 nodes. Split longer flows into sub-flows, and link them.
- Each usage example in the storyboard is a flow.

### 5.5 Notation (`notation.md`)

- **One fixed visual mapping per element type and per node type,** shared by every run. Shape, outline style, and icon slot are defined here, and only here.
- **Color is semantic and limited.** It encodes type or highlight state, never decoration. The visual direction (§9) supplies the palette; notation decides what the colors mean.
- **No color-only meaning.** Each type also differs by shape or outline, so it survives screen-share compression and color-vision differences.
- **Labels inside elements:** `name`, `type`, `responsibility`. The `why_separate` field is shown in the L2 segmentation scenes and in the map. `what_it_does` appears when the element is expanded and in its map panel.
- **The level indicator** is defined here, once, for every run.

### 5.6 Information architecture rules (`information-architecture.md`)

- **Answer first (Minto):** the first scene shows the whole system in one sentence plus the L1/L2 picture. Every later scene supports that statement.
- **One mode per scene (Diátaxis):** each scene is tagged `explanation` or `how-to`. `reference` content never appears on the linear path; it lives in the map. No scene mixes modes.
- **One level per scene:** each scene is tagged with one view level (L1–L3) or `flow`.
- **Problem before design:** the segmentation section shows the baseline or naive alternative first, then presents each split as the fix for a specific problem. This draws on each element's `why_separate` field.
- **Examples introduce nothing new:** usage-example flows reference only elements already shown on the path. They double as the recap.
- **Progressive disclosure:** the linear path is the first level. The map is the clearly labeled second level. One secondary level is enough; no deeper nesting.
- **Multiple intents:** each intent gets its own section. Intents are never blended within a scene.
- **Orientation:** an early scene shows the audience the four levels and the order the explainer will move through them; every later scene's level indicator refers back to it.
- **Structure before wiring:** the functions and what they do are shown before any flow, and before reference lines are added to a structure view.
- **Depth by length and audience:** the number of zoomed functions follows from the target length and the audience, stated in scope.

### 5.7 Diagram rendering pipeline

Diagrams are rendered at build time from `system-model.yaml`, `flows.yaml`, and the view list from `04_design`. The rendering must guarantee:
- **No layout when shown:** layout is computed at build time; the explainer ships prerendered diagrams and computes no layout while it is presented.
- **Deterministic:** the same inputs always produce the same diagrams.
- **Same layout everywhere:** a fixed layout profile pins direction (left→right for flows, top→bottom for structure), spacing, and attachment rules for every run.
- **Position pinning:** design may specify pinned positions or ordering constraints to keep the cross-level position rule (§5.3). Any pin is recorded in the view spec, never hand-edited into a rendered diagram.
- **Stable IDs:** every rendered element and flow step carries the ID it has in the model, so highlights and animations select by ID, never by hand-placed coordinates.

The layout and rendering tools are a design decision. Rev 1 proposed a layered node-link layout engine (elkjs) emitting SVG; the design may confirm or replace it.

## 6. Setup questionnaire (`setup/questionnaire.md`)

Each run collects the following and writes it to `_config/run.md`:

1. **Solution name.** Also capture the canonical names of its major components, so discovery can flag naming drift.
2. **Target audience.** One or more of: colleagues, leadership, clients, peers, other (free text). Include the assumed familiarity level.
3. **Intent.** One **primary** and up to one **secondary**: educate (explanation), train/how-to, persuade/sell.
4. **Opening order.** In the operator's words; examples: outcome-first (the default for leadership and clients), story-first, or problems and the conditions that drove the need, then how the architecture enables the outcomes.
5. **Desired takeaway.** One sentence on what the audience should understand or do afterward.
6. **Target length.** Default 15 minutes, maximum 15.
7. **Source locations.** Repo paths and vault paths/folders to read, each marked primary or supporting. These are copied into the run, with provenance, before discovery starts.
8. **Usage examples.** 1–2 real ways the operator uses the solution, or "let discovery propose."
9. **Animation.** Allowed (default yes), or none.
10. **Visual direction.** Always asked, never defaulted silently: the default look, or a theme for this run (described, with 1-3 references), plus anything to avoid beyond the default banned list.
11. **Must include / must exclude.** Topics or components.
12. **Where and how it runs.** The machines, tools, and harnesses the solution runs on, which documents often leave out.
13. **Intent and constraints.** What the operator meant the solution to achieve that the documents may not say, and the conditions it had to work within.

## 7. Stage contracts

### 01_discover: build the fact base and the system model

**Inputs**
- Layer 4: the snapshot of the sources listed in `_config/run.md`, with its provenance record.
- Layer 3: `stages/01_discover/references/extraction-guide.md`, `_config/standards/system-model.md`, `_config/standards/flows.md`.

**Process**
1. Scripts inventory the sources first: file tree, types, sizes, last-modified dates, and existing diagrams (Mermaid, images).
2. The agent reads the prioritized sources and extracts:
   - purpose and problem statement, including the operator's intent (questionnaire 13)
   - outcomes
   - constraints: the conditions behind design choices, kept apart from goals, problems, and intent
   - environment: where and how the solution runs (questionnaire 12)
   - the guiding principle behind how the solution is split, before any per-element rationale
   - components and their responsibilities
   - segmentation rationale
   - construction and structure
   - usage patterns, including how the solution improves itself (for example, retros feeding iterations)
   - what each element does (3-5 bullets, for `what_it_does`)
   - known gaps
3. Every fact cites its source (path and section).
4. The agent builds `system-model.yaml` from those facts, plus candidate flows for the usage patterns found.
5. Conflicts between sources and naming inconsistencies are flagged, never silently resolved. A gate answer that contradicts the sources is flagged the same way.
6. With the operator, settle which functions the explainer is likely to zoom into, and decompose them now.
7. The operator's own statements are recorded verbatim and cited like any other source.

**Outputs**
- `fact-sheet.md`: every claim sourced.
- `system-model.yaml`: per §5.1.
- `flows.yaml`: candidate flows per §5.4.
- `source-index.md`: what was read, and what was skipped and why.
- `conflicts.md`: naming and fact conflicts needing the operator's decision.
- `operator-notes.md`: the operator's statements, quoted, citable from the fact sheet.

**Verify**
- Every fact-sheet claim has a citation.
- Every source listed in `run.md` appears in `source-index.md`.
- `system-model.yaml` and `flows.yaml` pass schema validation and `scripts/check-model`.

**Review gate:** The operator resolves `conflicts.md` and corrects the fact sheet and model before stage 02.

### 02_scope: define the message

**Inputs**
- Layer 4: `01_discover/output/fact-sheet.md`, `system-model.yaml`, `flows.yaml`.
- Layer 3: `_config/run.md`, `_config/narrative-arc.md`, `_config/information-architecture.md`.

**Process**
1. State the depth (conceptual and logical by default) and how the length and audience set it.
2. Define the core message (the answer-first statement) in one sentence.
2. Confirm the opening order.
3. Map audience and intent to emphasis. When there are multiple intents, assign each intent its own section.
4. Select the in-scope elements: which functions get L3 views, and which 1–2 flows become usage examples.
5. List what is deliberately excluded, by depth rather than by dropping pieces the story needs.
6. Flag if a secondary intent would make the primary one shallow within the time budget.

**Outputs:** `scope.md`, containing:
- core message
- opening order
- audience/intent framing and section-per-intent plan
- in-scope element IDs and excluded items
- selected flows
- target scene count (8-14)

**Verify:** Everything in scope traces to the fact sheet or model. No new facts or elements.

**Review gate:** This is the highest-leverage human edit point. The operator approves the scope.

### 03_storyboard: sequence the scenes

**Inputs**
- Layer 4: `02_scope/output/scope.md`, `01_discover/output/fact-sheet.md`, `system-model.yaml`, `flows.yaml`.
- Layer 3: `_config/narrative-arc.md`, `_config/information-architecture.md`, `_config/standards/views.md`.

**Process**
1. Build the scene sequence following the arc in §9, including the orientation scene and structure before wiring. Each scene specifies:
   - stable scene ID (`S01`…)
   - title and the single point it makes
   - **mode** (`explanation` | `how-to`)
   - **level** (`L1` | `L2` | `L3` | `flow`)
   - the **view or flow ID** it shows, and which elements/steps are highlighted
   - sparse on-screen text (the operator narrates)
   - reveal steps
   - proposed animation, if any, and what state change it explains
   - fact-sheet references
2. Define the **map (reference layer)**:
   - an L1/L2 overview built from the model
   - every element node opens its L3 or L4 reference panel
   - each panel shows `responsibility`, `why_separate`, `what_it_does`, relationships, and the L4 code detail (folder tree, files), never showing excluded material
   - each panel deep-links to any path scene where that element appears
   - the map's structure mirrors the model's hierarchy

**Outputs**
- `storyboard.md`: human-readable.
- `scenes.json`: machine-readable; scene IDs, order, mode, level, view/flow refs, reveal steps, map structure.

**Verify**
- Estimated talk time ≤ target.
- Each scene makes exactly one point, has exactly one mode and one level, and cites fact-sheet entries.
- Scene 1 is the answer-first scene; the final scene returns to it.
- No `reference`-mode content is on the path.
- Usage-example scenes reference only elements already shown earlier on the path.
- Every in-scope element appears in the map.

**Review gate:** The operator edits sequence and on-screen text.

### 04_design: define the look, views, and per-scene layout

**Inputs**
- Layer 4: `03_storyboard/output/storyboard.md`, `scenes.json`, `01_discover/output/system-model.yaml`, `flows.yaml`.
- Layer 3: `_config/visual-direction.md`, `_config/banned-patterns.md`, `_config/build-rules.md`, `_config/standards/notation.md`, `_config/standards/views.md`, `_config/standards/layout-profile.json`, and visual references in `run.md`.

**Process**
1. Confirm the visual direction from `run.md` with the operator before designing. Then define the run's visual system: the default dark-mode direction, or the run's own theme (palette, frame, type, motion) if the operator asked for one. Notation semantics, including the level indicator, come from `notation.md` and are not redefined here.
2. Write a **view spec** for each view and flow used: elements included, highlight states, and any position pins or ordering constraints.
3. Write a spec for each scene: layout, reveal behavior, and animation (trigger, motion, duration, static end state).
4. Specify the map view and navigation chrome.
5. Self-check against `banned-patterns.md`.

**Outputs**
- `design-spec.md`
- design tokens, in whatever form the chosen format uses
- `views/*.yaml`: view specs consumed by `render-diagrams`
- `scene-specs/S01.md` …
- a mockup of every scene at its final reveal step, named and numbered in storyboard order, so the operator reviews the explainer, not just its diagrams

**Verify**
- No banned patterns.
- Every view obeys §5.3: title, legend, ≤ 9 elements, single level.
- Every animation has a static end state.
- Contrast meets the screen-share threshold in `build-rules.md`.

**Review gate:** The operator reviews design direction before build.

### 05_build: produce the explainer

**Inputs**
- Layer 4: `04_design/output/*`, `03_storyboard/output/scenes.json`, `01_discover/output/system-model.yaml`, `flows.yaml`.
- Layer 3: `_config/build-rules.md`, `_config/standards/layout-profile.json`.

**Process**
1. Render every view and flow (§5.7).
2. Generate the explainer from the design spec and `scenes.json`, implementing:
   - linear navigation (keyboard and on-screen)
   - the map/reference layer with deep links
   - step reveals and animations bound to stable element and step IDs
3. Embed scene IDs in the output (e.g., `S01`) so checks can find each scene.

**Outputs:** the explainer in `output/`, in the format the design chose, with everything it needs to open offline. A runtime library is included only if the design justifies it.

**Verify:** handed to stage 06.

### 06_verify: test the explainer and standards conformance

**Inputs**
- Layer 4: `05_build/output/`, `03_storyboard/output/scenes.json`, `01_discover/output/fact-sheet.md`, `system-model.yaml`, `flows.yaml`.
- Layer 3: `stages/06_verify/references/acceptance-criteria.md`.

**Process:** Run the scripted suite (§8), then an agent review for content fidelity and IA rule conformance.

**Outputs**
- `verify-report.md`: pass/fail per criterion, with failures listed by scene ID or element ID.
- `screenshots/`: each scene at its final reveal step, at 1920×1080 and 1440×900.

**Verify:** All §11 acceptance criteria pass, or each failure is listed with the stage that should be re-run. After a stage is re-run, no later stage's output that was built from the superseded output is used without being re-run too.

### 07_retro: what worked and what didn't

The workshop's standard retro stage: what worked, what didn't, and what to change in the template (standards, element limits, the `function` definition, visual direction). It is the main input to the template's next requirements prompt.

## 8. Scripts (deterministic work)

- **`scripts/inventory-sources`:** tree, file types, and existing diagrams for 01_discover.
- **`scripts/check-model`:** schema validation plus the integrity rules in §5.1 and §5.4 (orphans, missing refs, parent chains, element counts per view, unbound flow nodes).
- **`scripts/render-diagrams`:** model + flows + view specs → prerendered diagrams, using `layout-profile.json`. Must be deterministic: same inputs produce the same diagrams.
- **`scripts/verify`:** automated tests on every target viewer, plus an accessibility scan. Covers:
  - opens locally with no server
  - zero network requests
  - all internal links and jumps resolve
  - full keyboard traversal of the linear path
  - every map node opens its panel, and panel deep-links resolve
  - every animation completes and reaches its end state
  - the reduced-motion setting is honored
  - no runtime errors
  - layout at 1920×1080 and 1440×900
  - accessibility scan
  - every diagram has a title and legend
  - screenshot capture

Record every tool the build and verify stages need in the operator's environment manifests (the `ops/environment/` pattern). Pin versions in `vendor/`. Do not assume anything is preinstalled; a stage may install missing tooling, at the pinned version.

## 9. Other Layer 3 reference content to create

**`_config/narrative-arc.md`** (default, overridable per run):

1. **The answer:** the whole system in one sentence plus the L1 picture. *(explanation, L1)*
1a. **Orientation:** the four levels and how the explainer will move through them. *(explanation)*
2. **Why / outcomes:** the problem baseline, why the operator built it, and the outcomes it produces. Order is outcome-first or story-first, per `run.md`. *(explanation, L1)*
3. **Functions and segmentation:** the functional structure first (each function and what it does, no reference lines), then each function presented as the fix for a specific problem in the baseline, drawn from `why_separate`, with its references added. *(explanation, L2)*
4. **How it's built:** zoom into in-scope functions one at a time, returning to L2 between them. *(explanation, L3)*
5. **In use:** 1–2 usage-example flows, each walked step by step through elements already shown. *(how-to, flow)*
6. **Close:** return to scene 1's picture, now understood. *(explanation, L1/L2)*

The map is always available and is the reference layer (L4 code detail lives there). The arc compresses when many functions are zoomed; how is stated in `narrative-arc.md`.

**`_config/build-rules.md`:**

*Delivery and runtime*
- Opens locally with no server, no build step, and nothing to install.
- Zero network requests: nothing remotely hosted, fonts included. Bundle everything.
- Diagrams ship prerendered. No layout is computed while the explainer is shown.

*Motion*
- Prefer the chosen format's built-in motion. Use a runtime library only if a scene can't be done without it, and justify it in `design-spec.md`.
- Animations are presenter-triggered (keypress or click), never autoplay loops.
- Animations are slow and large enough to survive Zoom/Teams compression.
- Every animation has a meaningful static end state, and the reduced-motion setting skips straight to it.

*Screen-share legibility*
- Minimum body text 20px at 1080p.
- Minimum diagram label 16px.
- No hairline strokes; strokes are ≥ 2px.
- Text contrast ≥ 7:1 against the dark background.

*Navigation*
- → / Space: next step
- ←: previous step
- M: toggle the map
- Home: first scene
- Number keys or the map: jump to a scene
- Each scene has a direct address the presenter can jump to (e.g., `S04`).

*Targets*
- Viewports: 1920×1080 and 1440×900. No mobile layout in V1.
- Viewers: if the chosen format runs in a browser, current Chrome, Edge, and Firefox.

**`_config/visual-direction.md`** (the template's one default look; a run may replace it with its own theme for that run, recorded in its design spec with any approved exceptions to the banned list):
- **Tone:** clear, technical, editorial. Closer to an engineering schematic or a technical publication than a SaaS landing page.
- **Diagrams carry the explanation.** Text consists of labels and short statements.
- **Palette:**
  - deep neutral background, not pure black
  - neutrals for structure
  - a small set of semantic accents, mapped to meaning by `notation.md`
- **Type:** one readable sans for content and one monospace for paths, file names, and IDs, both locally vendored.
- **Hierarchy:** created through size, weight, and space, not boxes and shadows.
- **Motion:** explains state change only (data moving, a boundary forming, a zoom between levels).

**`_config/banned-patterns.md`** (default; the operator may extend):
- Purple/indigo/violet-to-blue gradients; gradient text; glowing or blurred "orb" backgrounds
- Centered hero with a big headline, subhead, and pill button
- Grids of identical rounded cards with emoji or generic line icons
- Glassmorphism, heavy drop shadows, neon glows
- Sparkle/✨ motifs, "AI-powered" badges, rocket/lightning iconography
- A single system typeface with no typographic hierarchy
- Marketing filler ("seamless," "unlock," "supercharge," "next-generation")
- Decorative motion: floating elements, parallax, constant pulsing
- Stock-style 3D illustrations or abstract blobs
- Freehand diagrams that bypass the system model

**`stages/06_verify/references/acceptance-criteria.md`:** the criteria in §11.

## 10. How the standards apply to the AI Workshop (illustrative, for orientation only)

Discovery must derive the real model from sources; this is an expected shape, not input.

- **L1:** The operator (`actor`) → AI Workshop (`system`). Externals: model providers, GitHub, the host machines.
- **L2:**
  - functions: "Rules and tooling (aiso-workbench)", "Agent setup (aiso-ops)", "Workflows (templates)", "Running work (runtime)", "Knowledge (KB vaults)"
  - relationships: a template "creates" instances; an instance "is archived to" its KB vault (human-triggered close-out); skills "file to" a KB vault (human, via the filing skill)
- **L3:** for example, inside an instance, the ICM layers (identity, routing, stage contracts, references, outputs).
- **Flow example:** "Run an instance":
  1. trigger: operator session
  2. step: load stage contract (`on:` instance)
  3. step: execute stage
  4. gate: the operator reviews output
  5. step: close out and archive (`on:` close-out script)
  6. store: KB vault
  7. output: archived run

## 11. Acceptance criteria (V1 "done")

**Runtime**
1. Opens locally on any workshop machine (in current Chrome, Edge, and Firefox if browser-based), with no runtime errors and zero network requests.
2. **Linear path:** every scene and reveal step can be reached forward and backward by keyboard.
3. **Map:** every element node opens its reference panel; panel and scene deep links work.
4. Every animation runs on trigger, completes, and lands on its static end state. Reduced-motion mode shows end states directly.
5. All internal links and anchors resolve.
6. Text and diagram sizes and contrast meet `build-rules.md` at 1920×1080 and 1440×900.
7. Scene count fits the target length (≤ 15 minutes, 8-14 scenes).

**Standards conformance**

8. `system-model.yaml` and `flows.yaml` pass schema validation and `check-model`. Every element, relationship, and flow node cites a source.
9. **Diagram rules:**
   - every diagram is rendered from the model; no freehand diagrams
   - every diagram has a title, legend, and explicit element types
   - single level per view
   - ≤ 9 elements per view, ≤ 12 nodes per flow
   - every flow node is bound to a model element
10. **Information architecture:**
    - scene 1 is answer-first, and the last scene returns to it
    - each scene has one mode and one level
    - no reference content on the path
    - usage examples introduce no new elements
11. Every scene maps to a storyboard scene ID, and every factual claim traces to the fact sheet.

**Quality**

12. No banned patterns present (agent review of screenshots against `banned-patterns.md`).
13. An automated accessibility scan reports no critical or serious violations.

**Portability**

14. Every stage produces the same result on any workshop machine with its tooling installed.

**Format**

15. The design records the chosen output format and how it meets each point in §2, Output format.

**Orientation and structure**

16. Every scene shows its level in the one form the notation defines, and an orientation scene comes before the first zoom.
17. Every element with `what_it_does` can be expanded to show it, in any view, and the bullets trace to the fact sheet.
18. The functional structure is shown before any flow.

## 12. Known risks and open items

**Model and diagram quality**
- **Model fidelity:** the system model is agent-extracted from sources. Wrong elements or missing `why_separate` rationale will flow into every diagram. Gate 01 review of `system-model.yaml` is the critical control.
- **The generalized C4 types are an adaptation.** C4 was designed for software systems. The first trial showed `container` colliding with its Docker meaning; rev 4 renames it `function`. Expect to refine the type definitions after the next runs. Change them only in the template's `standards/`, never per run.
- **Automatic layout limits:** automatic layout can't guarantee the cross-level "keep position" rule on its own. Pins and ordering constraints in view specs handle it. If they prove brittle, fall back to manually authored coordinates in view specs, still rendered from the model.
- **Element limits** (≤ 9 per view, ≤ 12 per flow) and the scene limit (8-14 in 15 minutes) are starting defaults. Tune them after the operator has given a few presentations.

**Process and environment**
- **Visual quality** depends on the default look or the run's theme. Expect the most iteration at gate 04; scene mockups make that review faster.
- **Legibility:** in the first trial, wide or deep views rendered labels below 16px at 1080p beside the text column. The design must say early which views can't meet the minimum.
- **Naming drift in AI Workshop sources** (`ops/` vs. `aiso-ops`, older Rev 4-W names such as AISO-core). Discovery flags these in `conflicts.md`; the operator resolves them at gate 01. The workshop's system design doc and conventions schema hold the canonical names.
- **Toolchain:** the build and verify tooling the design picks (rev 1 proposed Node, elkjs, and Playwright with its browser engines) is new. Whether it installs on the company-managed machine and inside its sandbox is unverified. V1 does not require that; running offline or in the sandbox is deferred.
- **Viability:** the first trial run was closed at the design gate by the operator, on purpose, to fold its lessons into the template before a second trial. No second solution is lined up after the AI Workshop. Whether the template earns a release is decided after a trial run reaches its retro with a presented explainer.

**Deliberately deferred**
- version history and diffs
- design continuity across versions
- publishing/hosting
- vault filing
- a formal visual design system
- running workflow stages offline or inside a no-network sandbox
