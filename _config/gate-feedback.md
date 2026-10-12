# Gate Feedback

Every stage from 01 to 06 writes `gate-feedback.md` to its own `output/`: each correction or comment raised
at that stage's gate, by the operator or by the agent. Stage 07 groups the items from all six by template
area, and the next template iteration is written from that set. The template is fixed once, after the run,
from the whole set; a run never edits the template to apply one item.

Write it while the gate is open, not afterward from memory. A gate with nothing to log still gets the file,
saying "none".

## Format

```markdown
# Gate Feedback: Stage NN

## Operator feedback
| # | Feedback | Template area | Applied in this run |
| --- | --- | --- | --- |
| O1 | What the operator said was wrong or missing, in plain words | the file or section it points at | Yes: what changed / No: why / Open |

## Agent observations
| # | Observation | Template area | Status |
| --- | --- | --- | --- |
| A1 | What the agent noticed that the template got wrong or made hard | the file or section it points at | Fixed in this run / Open |
```

- IDs run across the whole run (O1, O2, ... and A1, A2, ...), continuing from the previous stage's file, so
  the retro can cite any item by ID.
- "Template area" names a file in the template (`setup/questionnaire.md`, `_config/narrative-arc.md`,
  `scripts/check-storyboard.mjs`, a stage contract) or "process" when no file fits.
- Keep the operator's meaning; shorten, don't reword it into something else.
