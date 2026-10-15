# Stage 04: Design

**Purpose:** Define the look, each view, and each scene's layout and motion, within the standards.

Run the commands from the workspace root.

## Inputs
| Layer | Path | Use |
| --- | --- | --- |
| 4 | `../03_storyboard/output/scenes.json` | scenes, views, reveals, map |
| 4 | `../03_storyboard/output/storyboard.md` | the narrative intent behind each scene |
| 4 | `../01_discover/output/system-model.yaml` | what each view draws |
| 4 | `../01_discover/output/flows.yaml` | what each flow view draws |
| 4 | `../01_discover/output/visual-refs/` | the image and font references and the title image from `run.md`, copied in by stage 01 |
| 3 | `../../_config/visual-direction.md` | the default look and token values |
| 3 | `../../_config/banned-patterns.md` | what never appears |
| 3 | `../../_config/build-rules.md` | legibility, motion vocabulary, navigation |
| 3 | `../../_config/run.md` | `visual`, `visual_references`, `title_visual`, `avoid`, `animation` |
| 3 | `../../_config/standards/notation.md` | type-to-shape mapping and color token meanings |
| 3 | `../../_config/standards/views.md` | per-view rules |
| 3 | `../../_config/standards/view.schema.json`, `scene-spec.schema.json` | output shapes |
| 3 | `../../_config/gate-feedback.md` | the format of `gate-feedback.md` |

**Do NOT load:** `../01_discover/output/sources/`, `fact-sheet.md`; `../02_scope/output/`.

## Process
1. Set the run's visual system in `tokens.css`: color token values (hex), type scale, spacing, motion durations.
   Start from `visual-direction.md`. If `visual` in `run.md` is `default`, stop at tokens within that
   direction. If it describes a look, build a run theme in `theme/` (`theme.css`, fonts, licences) over the
   styling points listed in `build-rules.md`; keep `tokens.css` valid and put the themed values in `theme.css` `:root`.
2. Write a view spec for every view in `scenes.json` (`views/<view-id>.yaml`): title, element list if
   narrowed, `mode` (`structure` for the structure view, default `wired`), named highlight states, pins, and
   `inherit_from` for L3 views.
3. Write `scene-specs.yaml`: for every scene, its layout, entry, and the actions of each reveal step, in
   the motion vocabulary of `build-rules.md`, with the end state in words. The orientation scene (and only
   it) uses the `orientation` layout; its step reveals text lines only, since the page draws the levels from data. With `animation: false` in
   `run.md`, use `cut` entries and actions with `duration_ms: 0` only.
4. Write `design-spec.md`: the visual system and why, the map and navigation chrome, any departure from
   the defaults, the theme and each approved exception to the banned list (a heading "Approved exceptions"), any runtime library and its justification, and a self-check against each banned pattern.
5. Run `node scripts/check-design.mjs` and fix what it reports.
6. Run `node scripts/render-diagrams.mjs --preview` to draw every view into `output/preview/`. It prints each
   view's predicted label size at 1920x1080 and 1440x900 and what sets its extent. Act on every WARN: a view
   below the label floor, or text too long for its shape, must be fixed here (narrow or split the view, give
   the scene the `diagram` layout, or send the text back to the stage that owns it), then re-checked. The
   build refuses both.
7. Run `node scripts/mockups.mjs`. It renders the diagrams and builds the page into `output/mockup/`, then
   captures every scene at its final reveal step at 1920x1080 and 1440x900 into `output/mockups/`, numbered
   in storyboard order, measures each capture (label size, text fit, lines through text, and the other page
   checks), and writes `mockups/index.html` (a contact sheet with the numbers) and
   `mockups/measurements.json`. Resolve every problem it lists. If Chromium is missing, run
   `npx playwright install chromium`.
8. Write `gate-feedback.md` (`_config/gate-feedback.md`), then run `node scripts/stamp.mjs 04`.

## Outputs
| File | Destination |
| --- | --- |
| `tokens.css` | `output/` |
| `theme/` (only when `visual` is not `default`) | `output/` |
| `views/<view-id>.yaml` | `output/` |
| `scene-specs.yaml` | `output/` |
| `design-spec.md` | `output/` |
| `preview/*.svg` | `output/` |
| `mockup/` (the page the mockups show) | `output/` |
| `mockups/NN-SXX-<title>-<width>.png`, `mockups/index.html`, `mockups/measurements.json` | `output/` |
| `gate-feedback.md` | `output/` |

## Verify
- [ ] `check-design` passes: every view has a title, a single level, at most 9 elements; every scene and
      reveal step has a spec; every action is in the vocabulary; every text token pair meets 7:1
- [ ] Every animation has an end state
- [ ] The banned-pattern self-check is filled in, and a theme's exceptions are listed in `design-spec.md`
- [ ] With a theme: `theme/` holds only `theme.css`, fonts, and licences, with no remote URLs

## Human Check
Open `output/mockups/index.html` and read `design-spec.md`: the mockups are the scenes as the audience
will see them; use `preview/` to look at one view on its own. This is where visual quality is set: expect
the most iteration here. Edit in place, then run `check-design`, `render-diagrams --preview`,
`mockups.mjs`, and `stamp.mjs 04` again. Nothing advances without this.
