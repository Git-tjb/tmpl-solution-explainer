// Show each stage as not run, done, edited, or stale, from its .stamp.json (CONTEXT.md, Stage Discipline).
//   not run - no stamp
//   done    - inputs and outputs match the stamp
//   edited  - the stage's own output changed after its stamp: re-run its checks and stamp it again
//   stale   - an input changed after the stamp: re-run this stage before anything reads its output
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, STAGES, main } from './lib/common.mjs';
import { stageInputs } from './lib/inputs.mjs';
import { hashPaths } from './stamp.mjs';

main(() => {
  for (const nn of Object.keys(STAGES)) {
    const f = path.join(ROOT, STAGES[nn], 'output', '.stamp.json');
    if (!fs.existsSync(f)) { console.log(`${STAGES[nn].padEnd(22)} not run`); continue; }
    const stamp = JSON.parse(fs.readFileSync(f, 'utf8'));
    const now = hashPaths(stageInputs(nn));
    const changed = Object.keys({ ...now, ...stamp.inputs }).filter((k) => now[k] !== stamp.inputs[k]);
    const outNow = hashPaths([`${STAGES[nn]}/output`]);
    const edited = Object.keys({ ...outNow, ...stamp.outputs }).filter((k) => outNow[k] !== stamp.outputs[k]);
    let state = 'done';
    if (changed.length) state = `STALE: ${changed.length} input(s) changed (${changed.slice(0, 3).join(', ')}${changed.length > 3 ? ', ...' : ''})`;
    else if (edited.length) state = `edited after stamp: ${edited.slice(0, 3).join(', ')}${edited.length > 3 ? ', ...' : ''}`;
    console.log(`${STAGES[nn].padEnd(22)} ${state}`);
  }
});
