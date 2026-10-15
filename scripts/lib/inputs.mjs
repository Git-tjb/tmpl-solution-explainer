// Each stage's declared inputs (its CONTEXT.md Inputs table), for stamp and status.
// Keep in step with the stage contracts.
import path from 'node:path';
import { ROOT, P, rel } from './common.mjs';

const o = (nn, f = '') => `stages/${{ '01': '01_discover', '02': '02_scope', '03': '03_storyboard', '04': '04_design', '05': '05_build', '06': '06_verify', '07': '07_retro' }[nn]}/output${f ? '/' + f : ''}`;
const run = () => rel(P.runMd);
const std = (f) => `_config/standards/${f}`;

export function stageInputs(nn) {
  switch (nn) {
    case '01': return ['_config/gate-feedback.md', run(), 'stages/01_discover/references/extraction-guide.md', std('system-model.md'), std('flows.md')];
    case '02': return ['_config/gate-feedback.md', o('01', 'fact-sheet.md'), o('01', 'operator-notes.md'), o('01', 'system-model.yaml'), o('01', 'before-model.yaml'), o('01', 'flows.yaml'), run(), '_config/narrative-arc.md', '_config/information-architecture.md'];
    case '03': return ['_config/gate-feedback.md', o('02', 'scope.md'), o('01', 'fact-sheet.md'), o('01', 'system-model.yaml'), o('01', 'before-model.yaml'), o('01', 'flows.yaml'), o('01', 'inventory.md'),
      '_config/narrative-arc.md', '_config/information-architecture.md', std('views.md'), std('scenes.schema.json'), 'stages/03_storyboard/references/problem-figures.md'];
    case '04': return ['_config/gate-feedback.md', o('03', 'scenes.json'), o('03', 'storyboard.md'), o('01', 'system-model.yaml'), o('01', 'before-model.yaml'), o('01', 'flows.yaml'), o('01', 'visual-refs'),
      '_config/visual-direction.md', '_config/banned-patterns.md', '_config/build-rules.md', run(), std('notation.md'), std('views.md'),
      std('view.schema.json'), std('scene-spec.schema.json')];
    case '05': return ['_config/gate-feedback.md', o('04', 'tokens.css'), o('04', 'theme'), o('04', 'title'), o('04', 'views'), o('04', 'scene-specs.yaml'), o('03', 'scenes.json'), o('01', 'system-model.yaml'),
      o('01', 'flows.yaml'), o('01', 'sources'), '_config/build-rules.md', std('layout-profile.json'), 'scripts/site'];
    case '06': return ['_config/gate-feedback.md', o('05', 'site'), o('03', 'scenes.json'), o('01', 'fact-sheet.md'), o('01', 'system-model.yaml'), o('01', 'flows.yaml'),
      'stages/06_verify/references/acceptance-criteria.md', '_config/banned-patterns.md', '_config/information-architecture.md'];
    case '07': return ['01', '02', '03', '04', '06'].map((n) => o(n)).concat([o('05', 'site/index.html'), '_config/retro.md', run()]);
    default: return [];
  }
}
export const stageOf = (p) => (p.match(/^stages\/(\d\d)_/) || [])[1];
export { ROOT, path };
