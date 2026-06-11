// Lossless 4K frame capture of the deck via the deterministic seek() engine.
//   node capture4k.mjs <name> [from] [to]
import { chromium } from 'playwright';
import fs from 'fs';

const NAME = process.argv[2] || 'deck';
const FROM = process.argv[3], TO = process.argv[4];
const FPS = 30, frameMs = 1000 / FPS;
const dir = `/tmp/f_${NAME}`;
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });

let q = '?seek=1';
if (FROM !== undefined && TO !== undefined) q += `&from=${FROM}&to=${TO}`;

const b = await chromium.launch({ args: ['--disable-gpu', '--force-color-profile=srgb', '--hide-scrollbars'] });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.goto('file://' + process.cwd() + '/deck/index.html' + q, { waitUntil: 'load' });
await p.waitForFunction('window.__ready===true', { timeout: 20000 });

const total = await p.evaluate(() => window.__totalDuration);
const n = Math.ceil(total / frameMs);
for (let f = 0; f <= n; f++) {
  await p.evaluate(t => window.__seek(t), f * frameMs);
  await p.screenshot({ path: `${dir}/f${String(f).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 96 });
  if (f % 150 === 0) process.stdout.write(` ${Math.round(f / n * 100)}%`);
}
await b.close();
console.log(`\ncaptured ${n + 1} frames @1920x1080 -> ${dir} (${(total / 1000).toFixed(1)}s)`);
