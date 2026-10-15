# Solution Explainer

A workflow template that turns a finished solution's own sources (repos, folders, notes) into a local,
dark-mode explainer you present live over a screen share: a narrated path of 8 to 14 scenes, plus a map that
serves as the reference layer.

An AI coding agent does the thinking, one stage at a time. You review and approve each stage before the next
one runs. Scripts do the deterministic parts: every diagram is rendered from one cited system model, and the
page set is checked automatically in three browsers.

It is not a slide deck, a document for the audience to keep, or published documentation. The output is a
static page set you open in a browser. Nothing is hosted.

Current version: 0.2.0 (in development; see `docs/iterations/`).

## What you get

A folder of static pages, `stages/05_build/output/site/`, with an `index.html` you open directly. It
contains:

- a linear path of scenes, each with diagrams drawn from the system model
- a map view of the whole solution
- a theme and tokens you can restyle per run (stage 04)

Every claim in the explainer traces back to a fact sheet the first stage builds from your sources.

The page is built to stay readable on a shared screen: diagrams fill their space with labels at 16px or more,
what a step is about is drawn at full strength in one focus colour, and text is never cut. If something
would break that (text too long for its box, a view too big for the screen), the build stops and says which
stage should fix it. A position strip and a first-screen hint show the audience where they are and how to
move: arrow keys or Space to advance, M for the map, P to show or hide each scene's message.

## How it works

Seven stages, each with its own `CONTEXT.md` listing exactly what it reads and writes.

| Stage | Does | Writes to |
| --- | --- | --- |
| `01_discover` | Snapshots your sources; builds a cited fact sheet, system model, flows, and a list of conflicts | `stages/01_discover/output/` |
| `02_scope` | Decides the core message, audience framing, and what is in and out | `stages/02_scope/output/` |
| `03_storyboard` | Plans 8 to 14 scenes and the map | `stages/03_storyboard/output/` |
| `04_design` | Tokens, view specs, scene specs, previews | `stages/04_design/output/` |
| `05_build` | Renders the diagrams and builds the page set | `stages/05_build/output/` |
| `06_verify` | Scripted checks, plus content and design review | `stages/06_verify/output/` |
| `07_retro` | A retro of the run, to improve this template | `stages/07_retro/output/` |

**Stage discipline.** Run one stage, then stop. You review or edit its `output/` before the next stage runs.
A stage never writes outside its own `output/`. Each stage ends with `node scripts/stamp.mjs <nn>`, which
records the inputs it was built from, and `node scripts/status.mjs` shows each stage as not run, done, or
stale (an input changed after it ran). A stale stage is re-run before anything reads its output, so a fix
upstream always flows through.

## Requirements

- Node.js 20 or newer
- An AI coding agent that reads `CLAUDE.md` / `AGENTS.md` (written for Claude Code; any agent that follows
  `AGENTS.md` should work)
- Playwright browsers for the verify stage: `npx playwright install`

## Use it

1. **Get a copy per run.** Clone or copy this repo into a new folder for each solution you want to explain.
   Keep this template pristine; do real work only in the copy.
2. **Install.** From the copy's root: `npm ci`.
3. **Answer the setup questionnaire.** Open the copy in your agent and ask it to run
   `setup/questionnaire.md`. It asks about the solution, audience, intent, opening, takeaway, length, sources,
   usage examples, animation, visual direction, and constraints, then writes `_config/run.md`. Sources are
   absolute paths to the repos, folders, or files to explain.
4. **Run the stages in order**, starting with `stages/01_discover/`. Ask the agent to run one stage, read its
   output, edit anything you want changed, then tell it to continue.
5. **Open the result.** `stages/05_build/output/site/index.html` in a browser.

All scripts run from the repo root. Useful ones:

```
node scripts/status.mjs      # which stages are done, stale, or not run
npm run dry-run              # whole pipeline on made-up fixtures, to check your setup
```

The dry run uses only the fixtures in `docs/fixtures/`. It is the quickest way to see what a finished
explainer looks like before you point the template at your own sources.

## Sharing the result

The site folder is multi-file: `index.html` loads CSS, JS, and fonts from `assets/`. To share it, zip the
`site/` folder, or host it on any static host. A single-file export is planned (see `docs/seeds.md`).

## Repo layout

```
CLAUDE.md, AGENTS.md   what the agent reads first
CONTEXT.md             stage map and discipline
_config/               run.md (written by setup), standards, visual direction, build rules, retro prompt
setup/                 the setup questionnaire
stages/                the seven stages; each has CONTEXT.md and an output/
scripts/               deterministic helpers (snapshot, check, render, build, verify, stamp, status)
docs/                  design notes, dry-run fixtures, iteration records, seeds
```

## Origin and workshop-specific parts

This template was built inside a larger personal workshop that creates runs from templates and archives them
into a private knowledge vault. A few things reflect that and can be ignored if you use the repo on its own:

- `status.yml` carries placeholders such as `{{project_name}}` that the workshop's tooling fills in.
- `CONTEXT.md` mentions `Close-Instance` and a KB vault. Without the workshop, "filing" means copying the
  site folder wherever you want it.
- `setup/starter-files.yml` is empty on purpose.

## Contributing and ideas

Improvement ideas for the template are collected in `docs/seeds.md`. Each iteration's requirements and record
live in `docs/iterations/`.

## License

MIT. See `LICENSE`.
