# Solution Explainer

## What This Is
A workflow that turns a finished solution's own sources (repos, folders, KB vault notes) into a local,
dark-mode explainer the operator presents live over a screen share: a narrated linear path of 8-12 scenes
plus a map that serves as the reference layer. Every diagram is drawn from one system model that discovery
builds and cites, so explainers for different solutions are structurally comparable. An instance serves the
project whose solution it explains. It is not a slide deck, a document for the audience to keep, or
published documentation: the audience gets no copy, and nothing is hosted.

## Where To Go
Read `CONTEXT.md` for the stage map and how to run a stage.

## Setup
Run `setup/questionnaire.md` once, right after the instance is created; it writes `_config/run.md`. The
scripts need Node.js; `npm ci` installs the rest, and stages install anything missing.

A dry run in this template folder uses fixture or made-up inputs only. Real project data goes only into an
instance.
