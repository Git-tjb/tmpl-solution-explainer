---
iteration: "003"
component: tmpl-solution-explainer
origin: personal
proposals: [prop-20261015-run-deliverable-filing]
retros: [retro-20261012-799457]
---
# Requirements Prompt: Solution Explainer Iteration 003 (story and delivery)

> **Rev 3, 2026-10-15. Agreed by the operator 2026-10-15, with every open question at its default (§8).** Rev 2 brought up to date with the KB vault filing of
> 2026-10-15 (the Solution Explainer project, the "Run Deliverable Filing" proposal). Rev 2 was rev 1 plus the
> operator's decision on filing: the
> template hands the single file over; filing it at the project folder's top level is a workshop change, captured
> as a proposal in the KB vault's AI Workshop project (where changes to the workshop's own tooling are filed), not
> here. Nothing in the template is specific to the AI Workshop, which trial runs have only used as test content. Requirements state outcomes. Where a source suggests a
> mechanism, it is cited as a source, not required; the design picks the mechanism. It names no person; the
> person who runs the workshop and presents is "the operator."

## 0. How to Use This Prompt

Produce the iteration 003 design (`docs/iterations/003-<slug>/design.md` in the template): the mechanisms for
each requirement below, the changes to `docs/design.md`, and the work split into workstreams, each with its own
acceptance criteria. This iteration changes the template only. Stop at the gate for the operator's approval before building anything.

## 1. Problem

The explainer opens on the finished solution. Its first scene is the answer (the context diagram), the second
is a lesson in how to read levels, and the problem the solution solves is told later, over pictures of the
solution itself, so the picture never shows the problem (trial run 2: the same context diagram appeared four
times, twice for problem scenes). Nothing captures who the user is or what hurt before the solution existed,
so there is nothing to draw it from. Every explainer spends a scene on the levels lesson. The finished
explainer is a folder of files the operator has to package by hand, and it reaches the KB vault only inside
the run's archive, where it is hard to find and open.

## 2. Sources to Read First

1. The operator's asks for this iteration (2026-10-15), restated in Goals.
2. The template's `docs/seeds.md`: S1 (single-file export), S5 (story), S6 (control bar and navigation, as
   trimmed by iteration 002), S8 (map).
3. Trial run 2's retro, "By Template Area": the rows for the "why" section (O16), visual references at setup
   (A12), and the storyboard (A5, A17, A18).
4. The template's `docs/design.md` (0.2.0) and `_config/narrative-arc.md`, `information-architecture.md`,
   `standards/views.md`, `standards/notation.md`, `build-rules.md`, `setup/questionnaire.md`.
5. The workshop's `aiso-workbench/conventions/schema.md` sections 10 and 13 (read only: how a completed run is
   archived, so R21's declaration fits it).

Trial run 2's material is in its archive in the personal KB vault (read-only).

## 3. Goals

- An explainer opens with a title scene that has an engaging visual of the solution being explained.
- The first scene after the title is about the user and the problem, with a picture of them, not of the
  solution.
- Every scene has its own picture, and the story builds to a close the opening did not show.
- How to read the levels is available on demand from the controls, not spent as a scene in every explainer.
- When a run is complete, its explainer is one self-contained file the operator can open in a browser or share,
  declared as the run's deliverable so the workshop's close-out can file it.
- Setup and discovery capture what these scenes need, and the storyboard gate checks the text against its facts.

## 4. Non-Goals

Deferred (they stay in `docs/seeds.md` or the retro):
- Small screens (S9), laned flows beyond seven steps (S11), the traced arrowhead colour (S12).
- Discovery reading, model naming, flows for the audience, zooms (the retro's stage 01-02 areas).
- Presenter notes (O4) and any change to V1's "no speaker notes" scope.
- Hosting or publishing the explainer anywhere outside the KB vault.
- Changing how the workshop files a closed run (`Close-Instance`, `schema.md` sections 10 and 13). Filing the
  deliverable at the top level of the run's project folder is the workshop proposal "Run Deliverable Filing"
  (`prop-20261015-run-deliverable-filing`); until it lands, the deliverable reaches the KB vault inside the
  run's archive, and the operator may ask `vault-filer` to file a copy, as was done by hand for trial run 2's
  explainer in the Solution Explainer project.

## 5. Requirements

**The opening**

- **R1. Title scene.** Every explainer opens with a title scene: the solution's name, a one-line statement of
  what it is for, and an engaging visual of the solution. The visual is specific to the solution (not a
  generic image), meets `banned-patterns.md`, works offline, and is traceable to the run's inputs.
- **R2. The user and the problem first.** The first scene after the title says who the user is and what problem
  they had. Its visual centres the user and the problem and shows no part of the solution. Everything on it
  traces to the fact sheet or the operator's own words.
- **R3. Then the answer.** The answer-first statement (the whole solution in one sentence and its context
  picture) follows the problem, so the solution is introduced as the answer to it.

**Every scene earns its picture (S5)**

- **R4.** No two scenes on the path show the same picture unless the later one adds something the earlier did
  not (a highlight, a reveal, a zoom), and the storyboard says what.
- **R5.** A scene about a problem shows the problem (for example, a before and after), not the finished solution
  with parts outlined.
- **R6.** The closing scene shows something the opening did not, so the audience sees what they learned.
- **R7.** Every on-screen line adds something the scene's message does not; a line that repeats the message
  is flagged at the storyboard gate.
- **R8.** Reveal behaviour is the same across the explainer (for example, on-screen lines appear one per step,
  or all at once, but not both).

**How to read the levels, on demand**

- **R9.** The orientation scene leaves the path. The four levels, what each shows, and the scenes that use each
  are available on every scene from a control beside Map, and close again from inside it.
- **R10.** The level indicator stays on every scene (AC-16's first half is unchanged); its level pills do
  something useful (open the levels explanation, or jump to the first scene at that level) or read clearly as
  a status display, and "Code" says why it never lights on the path.

**Controls and the map (S6, S8)**

- **R11.** Every button and clickable diagram element has a visible hover and pressed state, not only focus.
- **R12.** Each segment of the position strip takes the viewer to its scene, with the scene's title as its tooltip.
- **R13.** While the map or the levels explanation is open, its button shows pressed, it has a visible close
  control inside it, and the bar shows no stale scene state.
- **R14.** A map detail panel can be navigated without one long scroll (short sections to jump to, or file trees
  collapsed until asked for).
- **R15.** Where the levels explanation says "Map only" for Code, it opens the map.

**Setup, discovery, and the storyboard gate (O16, A12, A5, A17)**

- **R16.** Setup asks who the user is, what they were trying to do, what hurt before the solution, and how it was
  done before. The answers are recorded in the operator's words and cited by the scenes that use them (R2, R5).
- **R17.** Setup takes visual references as colours, fonts, or images as well as URLs, so stage 04 can use them
  without fetching a page (A12), and asks for the title visual's direction (R1).
- **R18.** The storyboard allocates minutes per section before scenes are written (A5), and lists each on-screen
  line with the facts that carry it; the stage 03 check fails a line whose facts are missing (A17).

**Single-file export and filing (S1)**

- **R19.** When a run is complete, its explainer also exists as one self-contained file (styles, scripts,
  fonts, and pictures inside it) that opens offline by double-click and behaves like the page set.
- **R20.** The single file passes the same scripted checks as the page set, or the run's verify step says which
  it fails.
- **R21.** The run declares the single file as its deliverable, in one place the workshop's close-out can read,
  under a name that identifies the run (by default `<YYYY-MM-DD> - <instance> - explainer.html`, the pattern
  "Run Deliverable Filing" proposes). Making it never alters the approved `site/`. The run writes nothing to
  a KB vault (the gate rule); filing is the workshop's step. The declaration names no project, KB vault, or
  solution: it is the same for a run in any project (a scratch session, a template, a client project), and when
  the template is used on its own, outside the workshop, the single file simply stays in the run's output.

## 6. Existing Rules This Changes

| Rule | Change |
| --- | --- |
| `information-architecture.md`: answer first (scene 1 is the answer) | Title first, then the user and the problem, then the answer (R1-R3) |
| `information-architecture.md`, `narrative-arc.md`: an orientation scene early on | The orientation moves off the path to an on-demand control (R9) |
| AC-10: scene 1 is answer-first, the last scene returns to it | The answer follows the problem; the close shows something new (R3, R6) |
| AC-16: an orientation scene comes before the first L2 or L3 scene | Removed; the level indicator part stays (R9, R10) |
| `docs/design.md` D-6 (answer, then orientation) | Replaced by R1-R3 and R9 |
| "Diagrams are data": every picture is a view of the system model | Extended so the title and problem pictures have a defined, traceable source (open questions 1 and 2) |
| `setup/questionnaire.md`, `run.md` | New questions and fields (R16, R17) |
| `scenes.schema.json`, `check-storyboard` | Title and problem sections, per-section minutes, lines with facts (R1, R2, R18) |

## 7. Constraints That Do Not Change

- Everything iteration 002 made true: legibility at every step (AC-1 to AC-28), the colour roles, the 16px
  floor, text never cut, no themes in the template.
- Opens locally, offline, no server, zero network requests; deterministic render and build.
- 8 to 14 scenes in at most 15 minutes (the title and problem scenes count).
- One view, one level; the structural diagrams come only from the model.
- KB vault writes only through the filing path, with the operator's approval.

## 8. Open Questions (defaults shown)

1. **The title visual's source.** Default: drawn from data the run already has (for example, a styled
   rendering of the solution's context picture), with an option for a run-supplied, licensed image approved at
   stage 04, held to the banned-patterns list.
2. **The user-and-problem picture's source.** Default: a small "before" model captured at stage 01 from the
   setup answers and sources (the user, what they were doing, what hurt), drawn by the renderer with its own
   notation and no solution elements (O16's suggestion).
3. **Where the export happens.** Default: the last step of stage 05 writes the single file next to `site/`, and
   stage 06 verifies both.
4. **Where the deliverable is declared.** Default: a small manifest in the build stage's output
   (`stages/05_build/output/deliverables.yml`: the file's path and name), so nothing outside the template
   changes (`status.yml` keeps the workshop's standard fields only); the workshop proposal says how
   `Close-Instance` reads and files it.
5. **The levels control's name.** Default: "Levels", beside Map, with a key (L).
6. **Version and branch.** Default: 0.3.0, on branch `claude/iteration-003`, merged at close.
