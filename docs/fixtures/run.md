---
# Fixture answers for dry runs (scripts/dry-run.mjs). Made up; not a real solution.
solution: "Example Pipeline Kit"
canonical_names:
  - "Templates"
  - "Instances"
  - "Knowledge library"
audience:
  - colleagues
familiarity: some
intent:
  primary: educate
  secondary:
opening: "Outcome first: say what the kit gives you, then how it is built."
takeaway: "Runs are reviewed at every stage, and templates never change during a run."
user: "The operator who repeats the same piece of work every week"
user_goal: "Get the weekly work done the same way each time"
before: "Old notes, copied files, and a fresh chat with a model for every run"
pains:
  - "Every run started from nothing"
  - "The steps drifted from one run to the next"
  - "Nothing was checked before the next step"
target_minutes: 12
sources:
  - path: "docs/fixtures/sources-src/example-kit"
    role: primary
    note: "The whole made-up solution"
usage_examples:
  - "Run one stage and review its output"
animation: true
visual: "Fixture theme: thin accent frame bars"
visual_references:
  - { kind: colour, value: "#7fd1b9", note: "The accent to keep" }
  - { kind: image, value: "docs/fixtures/visual-refs-src/reference.svg", note: "A made-up reference picture" }
title_visual:
  from: model
  note: "Show the kit as one whole, quietly"
avoid: []
must_include: []
must_exclude: []
environment: "Runs on one laptop with a text editor and a hosted model."
intent_notes: "Meant to make recurring work repeatable; had to work without any server."
---
# Run: Example Pipeline Kit (fixture)
