# Stage 05: Build

**Purpose:** Produce the explainer: a static page set that opens from the file system with no network.

Run the commands from the workspace root.

## Inputs
| Layer | Path | Use |
| --- | --- | --- |
| 4 | `../04_design/output/tokens.css`, `views/`, `scene-specs.yaml`, `title/` (if any) | the design |
| 4 | `../03_storyboard/output/scenes.json` | scenes, text, map |
| 4 | `../01_discover/output/system-model.yaml`, `flows.yaml` | what the diagrams draw |
| 4 | `../01_discover/output/sources/` | L4 detail for map panels (read by the script only) |
| 3 | `../../_config/build-rules.md` | delivery, motion, legibility, navigation |
| 3 | `../../_config/standards/layout-profile.json` | fixed layout options |
| 3 | `../../_config/gate-feedback.md` | the format of `gate-feedback.md` |

**Do NOT load:** `fact-sheet.md`, `storyboard.md`, `design-spec.md` (the machine-readable outputs carry
what the build needs); `../02_scope/output/`.

## Process
1. If `node_modules/` is missing, run `npm ci` to install the pinned tooling.
2. Run `node scripts/render-diagrams.mjs`. It draws every view and flow into
   `output/site/assets/diagrams/` as SVG, with each element's model ID on it (`data-el`, `data-rel`,
   `data-step`).
3. Run `node scripts/build-site.mjs`. It writes `output/site/index.html`, copies the page runtime, fonts,
   and `tokens.css` into `output/site/assets/`, and builds the map panels, including L4 detail from the
   snapshot.
4. Open `output/site/index.html` and step through every scene once. If something is wrong, the fix belongs
   upstream: name the stage and the file, and stop.
5. Write `gate-feedback.md` (`_config/gate-feedback.md`), then run `node scripts/stamp.mjs 05`.

## Outputs
| File | Destination |
| --- | --- |
| `site/index.html` | `output/` |
| `site/assets/` (css, js, fonts, diagrams) | `output/` |
| `gate-feedback.md` | `output/` |

## Verify
Stage 06 runs the full checks.

## Human Check
Open `output/site/index.html` and present it to yourself. This stage writes no content of its own: fix a
problem in the stage that owns it, re-run that stage, and every stage after it (`node scripts/status.mjs`
lists the stale ones). Nothing advances without this.
