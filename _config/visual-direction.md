# Visual Direction (default, dark mode)

The starting look for every run, and the only look the template ships. Stage 04 sets token values within it.
When `visual` in `_config/run.md` is `default`, the run uses this look. When `visual` describes a look for
the run, stage 04 builds it as a run theme (`theme/`, see `build-rules.md`) from that description and its
references, and records the theme and any exceptions to the banned list in `design-spec.md`. Notation
semantics come from `standards/notation.md` and are not redefined by either.

## Tone
Clear, technical, editorial: closer to an engineering schematic or a technical publication than a SaaS
landing page. Diagrams carry the explanation; text is labels and short statements.

## Palette
- Deep neutral background, not pure black.
- Neutrals for structure (boundaries, rules, secondary text).
- A small set of semantic accents, one per notation color token. No accent is decorative.

Default values (stage 04 may adjust; every text pair must still meet 7:1, see `build-rules.md`):

| Token | Default | Use |
| --- | --- | --- |
| `--bg` | `#14161a` | page background |
| `--surface` | `#1c1f24` | panels, map |
| `--text` | `#eceae4` | body text |
| `--text-muted` | `#b9b6ad` | secondary text |
| `--c-system` | `#eceae4` | notation |
| `--c-internal` | `#8fb8de` | notation |
| `--c-actor` | `#e6c27a` | notation |
| `--c-external` | `#a8a49a` | notation |
| `--c-human` | `#e6c27a` | notation |
| `--c-highlight` | `#7fd1b9` | notation |
| `--c-dim` | `#5d6068` | notation |
| `--c-edge` | `#c9c6be` | notation |

## Type
- One readable sans for content and one monospace for paths, file names, and IDs, both bundled with the
  explainer (open licence). Defaults: a humanist or grotesque sans; a monospace with distinct 0/O and 1/l.
- Hierarchy through size, weight, and space, not boxes and shadows.

## Motion
Motion explains a state change only: data moving, a boundary forming, a zoom between levels.
