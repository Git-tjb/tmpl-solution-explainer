# Seeds

Improvement ideas for this template, captured between iterations. A seed is not a requirement: the operator
chooses the scope of an iteration from the seeds and the trial-run retros, and the iteration's requirements are
written then, in `docs/iterations/<nnn>-<slug>/requirements-prompt.md`.

This file holds open ideas only. When an iteration addresses a seed, or the operator decides to drop it, the
seed is removed from here. When the last seed is removed, delete this file; it is created again with the next
seed.

## S1. Single-file export as a standard end-of-run output

Raised 2026-10-13, after trial run 2 was archived.

**What.** When a run completes, the template offers a standard export of the final output as one
self-contained HTML file: CSS, JS, fonts and diagrams inlined, page title set. The operator can then take it,
share it, or open it from the KB vault in a browser without companion files.

**How it played out.** The operator asked for the explainer as one file after the run was archived. A
throwaway script built it from the archived `stages/05_build/output/site/` without modifying the archive:

1. Base64-encode each `.woff2` into the `url()` of the stylesheets.
2. Replace the three `<link rel="stylesheet">` tags (`tokens.css`, `base.css`, `theme.css`) with inline
   `<style>` blocks.
3. Replace the `runtime.js` `<script src>` with an inline `<script>`, escaping any `</script`.
4. Set the `<title>`, then assert no `assets/` reference remains.

Result: 430 KB, 5 fonts embedded, opens with no other files. The diagrams were already inline in `index.html`.
It was filed to the personal KB vault's inbox by hand. The write hook blocked every shell command that named
the vault path until the filing marker was set, reads included.

**Needs thought.**
- Where the export sits in the run: a final step of the build stage, a separate stage, or an option on
  `Close-Instance`. It must not alter the approved `site/`.
- Filing it with the project archive. The archive holds the multi-file tree under
  `Workflows/<date> - <instance>/`. Decide whether the single file also goes in the archive, under what name,
  and whether a non-markdown artifact needs a stamp, frontmatter or provenance (source instance and commit).
  Today the inbox accepts it only because the inbox accepts anything.
- Running it from the vault in a browser. The vault is a private repo and the file is not a note. Open points:
  which viewer or host serves it, how a private repo exposes it (local open, rendered view, static host), and
  keeping it out of any public path.

**Likely touches.** The build stage and its `CONTEXT.md`, `Close-Instance.ps1` and the archive layout
(schema section 13), the KB vault schema's attachment and artifact rules, and the hook's handling of reads.

**Open questions.**
- Is the single file a build-stage output, or a step that runs at close?
- Does it go into the archive, beside it, or only to the inbox?
- What is the browser path for a private vault?
