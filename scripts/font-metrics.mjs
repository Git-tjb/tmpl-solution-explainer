// Template tool: measure the bundled fonts' advance widths once, in Chromium, and write them to
// _config/standards/font-metrics.json. render-diagrams uses them to wrap and size text so it fits its shape
// (iteration 002, D5). Re-run only when the @fontsource packages change version.
//   node scripts/font-metrics.mjs
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { ROOT, P, main, readJson, writeText, rel } from './lib/common.mjs';

const FACES = [
  ['sans', 400, '@fontsource/ibm-plex-sans', 'ibm-plex-sans-latin-400-normal.woff2', 'IBM Plex Sans'],
  ['sans', 600, '@fontsource/ibm-plex-sans', 'ibm-plex-sans-latin-600-normal.woff2', 'IBM Plex Sans'],
  ['mono', 400, '@fontsource/ibm-plex-mono', 'ibm-plex-mono-latin-400-normal.woff2', 'IBM Plex Mono'],
];
// Printable ASCII plus the punctuation the explainer's text uses.
const CHARS = [...Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)), '·', '–', '—', '‘', '’', '“', '”', '…', '→', '←', '×', 'é'];
const SIZE = 100;

main(async () => {
  const tmp = fs.mkdtempSync(path.join(ROOT, '.font-metrics-'));
  try {
    const faces = FACES.map(([fam, w, pkg, file, css]) => {
      fs.copyFileSync(path.join(ROOT, 'node_modules', pkg, 'files', file), path.join(tmp, file));
      return `@font-face { font-family: '${css}'; font-weight: ${w}; src: url('${file}') format('woff2'); }`;
    }).join('\n');
    fs.writeFileSync(path.join(tmp, 'm.html'), `<!doctype html><style>${faces}</style><body></body>`);
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(pathToFileURL(path.join(tmp, 'm.html')).href);
    const out = { description: 'Advance widths of the bundled fonts, in em/1000 per character, measured in Chromium by scripts/font-metrics.mjs. Read by render-diagrams.mjs to fit text to its shape.', fonts: {} };
    for (const [fam, w, pkg, , css] of FACES) {
      const version = readJson(path.join(ROOT, 'node_modules', pkg, 'package.json')).version;
      const widths = await page.evaluate(async ({ css, w, chars, size }) => {
        await document.fonts.load(`${w} ${size}px '${css}'`);
        const c = document.createElement('canvas').getContext('2d');
        c.font = `${w} ${size}px '${css}'`;
        return Object.fromEntries(chars.map((ch) => [ch, Math.round((c.measureText(ch).width / size) * 1000)]));
      }, { css, w, chars: CHARS, size: SIZE });
      out.fonts[`${fam}-${w}`] = { family: css, weight: w, package: `${pkg}@${version}`, widths };
    }
    await browser.close();
    const dest = path.join(P.standards, 'font-metrics.json');
    writeText(dest, JSON.stringify(out, null, 1) + '\n');
    console.log(`Wrote ${rel(dest)} (${Object.keys(out.fonts).length} faces, ${CHARS.length} characters each).`);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
