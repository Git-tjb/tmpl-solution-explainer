---
component: tmpl-solution-explainer
kind: template
version: 0.0.0
---
# Solution Explainer Design

## 1. Purpose and Scope
{{What it does. What it does not do. Quoted by every impact analysis's scope check.}}

## 2. Interfaces
| ID | Interface | Implements or consumes |
| --- | --- | --- |

## 3. Inventory
| Path | What it is |
| --- | --- |

## 4. Behavior
### {{script, service, or stage group}}
{{Inputs, what it does, outputs, failure modes. For a template: the stage map and each stage's purpose (the contracts themselves are the stage CONTEXT.md files).}}

## 5. Acceptance Criteria
| ID | Criterion | Check |
| --- | --- | --- |
| AC-1 | {{criterion}} | `{{Test-Script}}#{{CheckName}}` or `manual: {{numbered steps}}` |

## 6. Known Limits
## 7. History
{{Iteration records, frozen documents this design replaces (as `archive/<label>:<path>`).}}
