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
| 3 | `../../_config/visual-direction.md` | the default look and token values |
| 3 | `../../_config/banned-patterns.md` | what never appears |
| 3 | `../../_config/build-rules.md` | legibility, motion vocabulary, navigation |
| 3 | `../../_config/run.md` | `visual_references`, `avoid`, `animation` |
| 3 | `../../_config/standards/notation.md` | type-to-shape mapping and color token meanings |
| 3 | `../../_config/standards/views.md` | per-view rules |
| 3 | `../../_config/standards/view.schema.json`, `scene-spec.schema.json` | output shapes |

**Do NOT load:** `../01_discover/output/sources/`, `fact-sheet.md`; `../02_scope/output/`.

## Process
1. Set the run's visual system in `tokens.css`: color token values (hex), type scale, spacing, motion durations.
   Start from `visual-direction.md`; change it only for `visual_references` or `avoid` in `run.md`.
2. Write a view spec for every view in `scenes.json` (`views/<view-id>.yaml`): title, element list if
   narrowed, named highlight states, pins, and `inherit_from` for L3 views.
3. Write `scene-specs.yaml`: for every scene, its layout, entry, and the actions of each reveal step, in
   the motion vocabulary of `build-rules.md`, with the end state in words. With `animation: false` in
   `run.md`, use `cut` entries and actions with `duration_ms: 0` only.
4. Write `design-spec.md`: the visual system and why, the map and navigation chrome, any departure from
   the defaults, any runtime library and its justification, and a self-check against each banned pattern.
5. Run `node scripts/check-design.mjs` and fix what it reports.
6. Run `node scripts/render-diagrams.mjs --preview` to draw every view into `output/preview/` for review.
   Act on every WARN: a view too tall or wide to show labels at 16px must be narrowed, split, or given the
   `diagram` layout, then re-checked.
7. Run `node scripts/stamp.mjs 04`.

## Outputs
| File | Destination |
| --- | --- |
| `tokens.css` | `output/` |
| `views/<view-id>.yaml` | `output/` |
| `scene-specs.yaml` | `output/` |
| `design-spec.md` | `output/` |
| `preview/*.svg` | `output/` |

## Verify
- [ ] `check-design` passes: every view has a title, a single level, at most 9 elements; every scene and
      reveal step has a spec; every action is in the vocabulary; every text token pair meets 7:1
- [ ] Every animation has an end state
- [ ] The banned-pattern self-check is filled in

## Human Check
Open the previews and read `design-spec.md`. This is where visual quality is set: expect the most
iteration here. Edit in place, then run `check-design`, `render-diagrams --preview`, and `stamp.mjs 04`
again. Nothing advances without this.
