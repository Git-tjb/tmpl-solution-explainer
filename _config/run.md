---
# Written once per run by setup/questionnaire.md. Scripts read this frontmatter; stages read all of it.
solution: "{{solution name}}"
canonical_names:            # the solution's major parts, as the operator names them
  - "{{name}}"
audience:                   # one or more: colleagues | leadership | clients | peers | other: <text>
  - "{{audience}}"
familiarity: "{{assumed familiarity: none | some | expert}}"
intent:
  primary: "{{educate | how-to | persuade}}"
  secondary:                # optional, same values
opening: outcome-first      # outcome-first | story-first
takeaway: "{{one sentence: what the audience should understand or do afterward}}"
target_minutes: 15          # at most 15
sources:                    # copied into the run by scripts/snapshot-sources.mjs before discovery reads them
  - path: "{{absolute path to a repo, folder, or file}}"
    role: primary           # primary | supporting
    note: "{{why this source}}"
usage_examples:             # 1-2, or the single entry "let discovery propose"
  - "{{a real way the operator uses the solution}}"
animation: true             # false: no animation, reveals only
visual_references: []       # optional: up to 3 examples or styles, as text
avoid: []                   # anything to avoid beyond _config/banned-patterns.md
must_include: []
must_exclude: []
---
# Run: {{solution name}}

Anything the frontmatter can't hold: context on the audience, what the last conversation about this solution
got wrong, what the operator wants to be asked about afterward.
