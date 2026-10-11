// Stage 01, step 1: copy every source listed in _config/run.md into stages/01_discover/output/sources/,
// with provenance. Nothing is read from the original locations after this.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import YAML from 'yaml';
import { ROOT, P, main, runAnswers, writeText, UserError, rel } from './lib/common.mjs';

const SKIP_DIRS = ['.git', 'node_modules', '.obsidian', '.trash', '__pycache__', '.venv', '.vs', '.idea'];
// Never copied: secrets and local-only files (the workshop's never-commit list), and very large files.
const SKIP_FILE = [/^\.env(\..*)?$/i, /\.local\.[^.]+$/i, /^context\.local.*\.ya?ml$/i, /\.(pem|key|pfx|p12)$/i];
const MAX_BYTES = 2 * 1024 * 1024;

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'source';
// Files of a folder, honouring git: inside any git repo, only what git tracks or would track
// (gitignored files are never copied); elsewhere, every file except SKIP_DIRS.
function listFiles(dir) {
  if (git(['rev-parse', '--is-inside-work-tree'], dir) === 'true') {
    const outp = git(['ls-files', '-co', '--exclude-standard', '-z'], dir);
    return outp.split('\0').filter(Boolean).map((r) => path.join(dir, r)).filter((f) => fs.existsSync(f) && fs.statSync(f).isFile())
      .filter((f) => !path.relative(dir, f).split(path.sep).some((part) => SKIP_DIRS.includes(part))).sort();
  }
  const files = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.includes(e.name)) files.push(...listFiles(full)); }
    else if (e.isFile()) files.push(full);
  }
  return files;
}
function git(args, cwd) {
  try { return execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); }
  catch { return ''; }
}

main(() => {
  const run = runAnswers();
  const sources = run.sources || [];
  if (!sources.length) throw new UserError('_config/run.md lists no sources.');
  const resolved = sources.map((s, i) => {
    if (!s.path || String(s.path).includes('{{')) throw new UserError(`Source ${i + 1} has no path. Fill in _config/run.md first.`);
    const abs = path.resolve(ROOT, String(s.path));
    if (!fs.existsSync(abs)) throw new UserError(`Source ${i + 1} not found: ${s.path}`);
    return { ...s, abs };
  });

  fs.rmSync(P.sources, { recursive: true, force: true });
  fs.mkdirSync(P.sources, { recursive: true });
  const records = [];
  resolved.forEach((s, i) => {
    const name = `${String(i + 1).padStart(2, '0')}-${slug(path.basename(s.abs))}`;
    const dest = path.join(P.sources, name);
    const isDir = fs.statSync(s.abs).isDirectory();
    const files = isDir ? listFiles(s.abs) : [s.abs];
    const skipped = [];
    let copied = 0;
    for (const f of files) {
      const r = isDir ? path.relative(s.abs, f) : path.basename(f);
      const base = path.basename(f);
      if (SKIP_FILE.some((re) => re.test(base))) { skipped.push({ path: r.split(path.sep).join('/'), reason: 'local or secret file' }); continue; }
      const size = fs.statSync(f).size;
      if (size > MAX_BYTES) { skipped.push({ path: r.split(path.sep).join('/'), reason: `larger than ${MAX_BYTES} bytes` }); continue; }
      const target = path.join(dest, r);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(f, target);
      const st = fs.statSync(f);
      fs.utimesSync(target, st.atime, st.mtime);
      copied++;
    }
    const gitDir = isDir ? s.abs : path.dirname(s.abs);
    const commit = git(['rev-parse', 'HEAD'], gitDir);
    const record = {
      id: name,
      origin: String(s.path),
      role: s.role || 'supporting',
      note: s.note || '',
      kind: isDir ? 'folder' : 'file',
      repo_remote: commit ? git(['config', '--get', 'remote.origin.url'], gitDir) || null : null,
      repo_commit: commit || null,
      repo_dirty: commit ? git(['status', '--porcelain', '--', '.'], gitDir) !== '' : null,
      copied_at: new Date().toISOString(),
      files_copied: copied,
      skipped,
    };
    records.push(record);
    console.log(`${name}: ${copied} file(s) copied, ${skipped.length} skipped${commit ? ` (commit ${commit.slice(0, 7)}${record.repo_dirty ? ', uncommitted changes' : ''})` : ''}`);
  });
  writeText(path.join(P.sources, 'provenance.yml'), YAML.stringify({ schema_version: 1, sources: records }));
  console.log(`Wrote ${rel(path.join(P.sources, 'provenance.yml'))}`);
});
