// Stage 05, last step: export the built page set as one self-contained HTML file, and declare it as the run's
// deliverable (iteration 003, D6).
//   node scripts/export-single.mjs [--name <file>]   -> stages/05_build/output/<file> and deliverables.yml
//   --out <file>                                     -> that file only, no declaration (verify uses it to prove
//                                                       determinism)
// Reads stages/05_build/output/site/ and never writes to it. Styles, the runtime, fonts, and images are inlined;
// the result references no other file. Deterministic: the same site gives byte-identical output.
// The default name is "<YYYY-MM-DD> - <instance> - explainer.html": the run's start (the earliest copy time in
// the source snapshot's provenance.yml) and the workspace folder's name. It names no project or KB vault; filing
// it is the workshop's step, never this run's.
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { ROOT, P, out, main, readText, readYaml, writeText, sha256, rel, UserError } from './lib/common.mjs';

const MEDIA = { '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml' };
export const DECLARATION = () => out('05', 'deliverables.yml');

function dataUri(file, from) {
  const media = MEDIA[path.extname(file).toLowerCase()];
  if (!media) throw new UserError(`export-single: ${rel(file)} (referenced by ${from}) is not a font or image the export can inline`);
  if (!fs.existsSync(file)) throw new UserError(`export-single: ${from} references ${rel(file)}, which is missing; run build-site again`);
  return `data:${media};base64,${fs.readFileSync(file).toString('base64')}`;
}
// A stylesheet with every url() to a local file turned into a data URI, resolved from the stylesheet's folder.
function inlineCss(file) {
  return readText(file).replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, q, u) => {
    if (/^(data:|#)/.test(u.trim())) return m;
    return `url("${dataUri(path.resolve(path.dirname(file), u.trim().split(/[?#]/)[0]), rel(file))}")`;
  });
}

export function exportSingle(siteDir) {
  const index = path.join(siteDir, 'index.html');
  if (!fs.existsSync(index)) throw new UserError(`${rel(index)} is missing; run scripts/build-site.mjs first.`);
  let html = readText(index);
  html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, href) => `<style>\n${inlineCss(path.join(siteDir, href)).replace(/<\/style/gi, '<\\/style')}\n</style>`);
  html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => `<script>\n${readText(path.join(siteDir, src)).replace(/<\/script/gi, '<\\/script')}\n</script>`);
  html = html.replace(/(<img\b[^>]*\ssrc=")([^"]+)(")/g, (m, a, src, b) => (src.startsWith('data:') ? m : `${a}${dataUri(path.join(siteDir, src), 'index.html')}${b}`));
  const left = fileReferences(html);
  if (left.length) throw new UserError(`export-single: the file still references other files: ${left.slice(0, 5).join(', ')}`);
  return html;
}
// Every src, href, or url() that points at a file rather than into the page or at inline data.
export function fileReferences(html) {
  const refs = [];
  for (const m of html.matchAll(/\s(?:src|href)="([^"]*)"/g)) if (!/^(#|data:)/.test(m[1])) refs.push(m[1]);
  for (const m of html.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)) if (!/^(#|data:)/.test(m[2].trim())) refs.push(`url(${m[2]})`);
  return refs;
}

export function defaultName() {
  const prov = path.join(P.sources, 'provenance.yml');
  if (!fs.existsSync(prov)) throw new UserError(`${rel(prov)} is missing: the run's start date comes from stage 01's source snapshot. Pass --name to name the file yourself.`);
  const y = readYaml(prov) || {};
  const times = [...(y.sources || []), ...(y.visual_refs || [])].map((r) => r.copied_at).filter(Boolean).sort();
  if (!times.length) throw new UserError(`${rel(prov)} has no copy times. Pass --name to name the file yourself.`);
  return `${String(times[0]).slice(0, 10)} - ${path.basename(ROOT)} - explainer.html`;
}

if (process.argv[1]?.endsWith('export-single.mjs')) {
  main(() => {
    const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
    const html = exportSingle(P.site);
    if (arg('--out')) { writeText(path.resolve(ROOT, arg('--out')), html); console.log(`Wrote ${arg('--out')}`); return; }
    const name = arg('--name') || defaultName();
    if (/[\\/:*?"<>|]/.test(name) || !name.endsWith('.html')) throw new UserError(`"${name}" is not a usable file name ending in .html`);
    // A rebuild replaces the file it declared before.
    const decl = DECLARATION();
    if (fs.existsSync(decl)) for (const d of readYaml(decl)?.deliverables || []) if (d.file && !/[\\/]/.test(d.file)) fs.rmSync(out('05', d.file), { force: true });
    const file = out('05', name);
    writeText(file, html);
    const declared = { schema_version: 1, deliverables: [{ file: name, kind: 'explainer', media_type: 'text/html', sha256: sha256(fs.readFileSync(file)) }] };
    writeText(decl, '# The run\'s deliverables, for the workshop\'s close-out to file. Written by scripts/export-single.mjs.\n' + YAML.stringify(declared));
    console.log(`Wrote ${rel(file)} (${Math.round(fs.statSync(file).size / 1024)} KB) and declared it in ${rel(decl)}.`);
  });
}
