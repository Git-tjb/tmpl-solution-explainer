---
# Written once per run by setup/questionnaire.md. Scripts read this frontmatter; stages read all of it.
# Quote any value that contains a comma or a colon. Prefer block style over { a: b } flow style.
solution: "{{solution name}}"
canonical_names:            # the solution's major parts, as the operator names them
  - "{{name}}"
audience:                   # one or more: colleagues | leadership | clients | peers | other: <text>
  - "{{audience}}"
familiarity: "{{assumed familiarity: none | some | expert}}"
intent:
  primary: "{{educate | how-to | persuade}}"
  secondary:                # optional, same values
opening: "{{the operator's words: how the explainer should open}}"
takeaway: "{{one sentence: what the audience should understand or do afterward}}"
user: "{{who uses the solution: the role, in the operator's words}}"
user_goal: "{{what they were trying to get done}}"
before: "{{how it was done before the solution existed: tools, steps, people}}"
pains:                      # what hurt before the solution, one item per pain (1-4), in the operator's words
  - "{{a pain}}"
pain_counts: []             # optional: anything countable about the pains, in the operator's words
                            # (how often, how long, how many places or copies, how much waited)
target_minutes: 15          # at most 15
sources:                    # copied into the run by scripts/snapshot-sources.mjs before discovery reads them
  - path: "{{absolute path to a repo, folder, or file}}"
    role: primary           # primary | supporting
    note: "{{why this source}}"
usage_examples:             # 1-2, or the single entry "let discovery propose"
  - "{{a real way the operator uses the solution}}"
animation: true             # false: no animation, reveals only
visual: default             # default | a short description of this run's look (built in stage 04)
visual_references: []       # optional, up to 3; each one of:
                            #   - { kind: colour, value: "#1c1f24", note: "..." }
                            #   - { kind: font, value: "Family Name", path: "<font file, optional>", note: "..." }
                            #   - { kind: image, value: "<path to a screenshot or picture>", note: "..." }
                            #   - { kind: url, value: "https://...", note: "..." }   (give its colours, fonts, or a screenshot too)
title_visual:               # the picture on the title scene
  from: model               # model: drawn from the solution's own structure | image: a licensed image
  image:                    # from: image only: path to the image (PNG, JPEG, WebP, or SVG)
  licence:                  # from: image only: the image's licence or permission
  note: ""                  # the operator's words on what the title should convey
avoid: []                   # anything to avoid beyond _config/banned-patterns.md
must_include: []
must_exclude: []
environment: "{{where and how the solution runs: machines, tools, harnesses}}"
intent_notes: "{{what the operator meant it to achieve, and the conditions it had to work within}}"
---
# Run: {{solution name}}

Anything the frontmatter can't hold: context on the audience, what the last conversation about this solution
got wrong, what the operator wants to be asked about afterward.
