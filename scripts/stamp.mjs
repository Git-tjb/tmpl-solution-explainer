// Record what a stage was built from: sha256 of every declared input and of the stage's own output.
//   node scripts/stamp.mjs <nn>
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, STAGES, main, walk, sha256, rel, writeText, UserError } from './lib/common.mjs';
import { stageInputs } from './lib/inputs.mjs';

export function hashPaths(paths) {
  const out = {};
  for (const p of paths) {
    const abs = path.join(ROOT, p);
    if (!fs.existsSync(abs)) { out[p] = null; continue; }
    const files = fs.statSync(abs).isDirectory() ? walk(abs) : [abs];
    for (const f of files) {
      const r = rel(f);
      if (/\/\.stamp\.json$/.test(r)) continue;
      out[r] = sha256(fs.readFileSync(f));
    }
  }
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

if (process.argv[1]?.endsWith('stamp.mjs')) {
  main(() => {
    const nn = process.argv[2];
    if (!STAGES[nn]) throw new UserError('Usage: node scripts/stamp.mjs <01-07>');
    const stamp = {
      stage: nn,
      inputs: hashPaths(stageInputs(nn)),
      outputs: hashPaths([`${STAGES[nn]}/output`]),
    };
    writeText(path.join(ROOT, STAGES[nn], 'output', '.stamp.json'), JSON.stringify(stamp, null, 1) + '\n');
    console.log(`Stamped stage ${nn}: ${Object.keys(stamp.inputs).length} input file(s), ${Object.keys(stamp.outputs).length} output file(s).`);
  });
}
