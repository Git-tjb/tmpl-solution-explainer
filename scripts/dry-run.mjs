// Dry run (template only): put the made-up fixtures in docs/fixtures/ in place of the agent-written
// outputs, then run every script in stage order. Stage outputs are gitignored in the template.
//   node scripts/dry-run.mjs [--until <script>] [--no-verify]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, STAGES, main, walk, UserError } from './lib/common.mjs';

const FIX = path.join(ROOT, 'docs', 'fixtures');
const env = { ...process.env, SE_RUN_MD: 'docs/fixtures/run.md' };

main(() => {
  if (!fs.existsSync(FIX)) throw new UserError('No docs/fixtures/ here. Dry runs happen only in the template.');
  for (const nn of Object.keys(STAGES)) {
    const o = path.join(ROOT, STAGES[nn], 'output');
    for (const e of fs.readdirSync(o)) if (e !== '.gitkeep') fs.rmSync(path.join(o, e), { recursive: true, force: true });
  }
  const steps = [
    ['snapshot-sources.mjs'], ['inventory-sources.mjs'], ['place-fixtures'], ['check-model.mjs', '--scope'],
    ['stamp.mjs', '01'], ['stamp.mjs', '02'], ['check-storyboard.mjs'], ['stamp.mjs', '03'],
    ['check-design.mjs'], ['render-diagrams.mjs', '--preview'], ['stamp.mjs', '04'],
    ['render-diagrams.mjs'], ['build-site.mjs'], ['stamp.mjs', '05'],
    ['verify.mjs'], ['stamp.mjs', '06'], ['status.mjs'],
  ];
  const until = process.argv.includes('--until') ? process.argv[process.argv.indexOf('--until') + 1] : null;
  for (const [script, ...args] of steps) {
    if (script === 'verify.mjs' && process.argv.includes('--no-verify')) continue;
    if (script === 'place-fixtures') { placeFixtures(); continue; }
    console.log(`\n=== ${script} ${args.join(' ')}`);
    const r = spawnSync(process.execPath, [path.join('scripts', script), ...args], { cwd: ROOT, env, stdio: 'inherit' });
    if (r.status !== 0) throw new UserError(`${script} exited ${r.status}; dry run stopped.`);
    if (until && script === until) break;
  }
  console.log('\nDry run complete. Open stages/05_build/output/site/index.html.');
});

function placeFixtures() {
  const src = path.join(FIX, 'stages');
  for (const f of walk(src)) {
    const dest = path.join(ROOT, 'stages', path.relative(src, f));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(f, dest);
  }
  console.log('\n=== fixtures placed for stages 01-04');
}
