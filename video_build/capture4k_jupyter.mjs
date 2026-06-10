// Lossless 4K capture of a real JupyterLab session via stepwise screenshots.
// Deterministic: hold the root view, open the notebook, then smooth-scroll —
// each step screenshotted at 3840x2160.
import { chromium } from 'playwright';
import fs from 'fs';

const URL = 'http://127.0.0.1:8899';
const dir = '/tmp/f_jup';
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });

let F = 0;
const pad = n => String(n).padStart(5, '0');

const b = await chromium.launch({ args: ['--disable-gpu', '--disable-dev-shm-usage', '--hide-scrollbars'] });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
const sleep = ms => p.waitForTimeout(ms);

async function shot() { await p.screenshot({ path: `${dir}/f${pad(F++)}.jpg`, type: 'jpeg', quality: 96 }); }
async function hold(seconds) {                    // capture one frame, duplicate to fill duration
  const src = `${dir}/f${pad(F)}.jpg`; await p.screenshot({ path: src, type: 'jpeg', quality: 96 }); F++;
  const n = Math.round(seconds * 30) - 1;
  for (let i = 0; i < n; i++) { fs.copyFileSync(src, `${dir}/f${pad(F++)}.jpg`); }
}

// 1) root view — show the structured folders
await p.goto(URL + '/lab?reset', { waitUntil: 'domcontentloaded' });
await p.waitForSelector('.jp-DirListing-content', { timeout: 60000 });
await p.addStyleTag({ content: '.jp-toast-container,.Toastify,.jp-Notification{display:none!important}' });
await sleep(1200);
await hold(3.5);                                   // beauty shot of Data/Figures/Notebooks/Tables

// 2) open the notebook
await p.goto(URL + '/lab/tree/Notebooks/2_Model_Development.ipynb', { waitUntil: 'domcontentloaded' });
await p.waitForSelector('.jp-Notebook .jp-Cell', { timeout: 60000 });
await p.addStyleTag({ content: '.jp-toast-container,.Toastify,.jp-Notification{display:none!important}' });
await sleep(2500);
await hold(2.5);                                   // notebook top

// 3) smooth scroll through real code + real outputs
const info = await p.evaluate(() => {
  const el = document.querySelector('.jp-WindowedPanel-outer') || document.querySelector('.jp-Notebook');
  return { total: el ? el.scrollHeight - el.clientHeight : 0 };
});
const STEPS = 430;                                 // ~14s of scrolling at 30fps
for (let i = 0; i <= STEPS; i++) {
  await p.evaluate((y) => {
    const el = document.querySelector('.jp-WindowedPanel-outer') || document.querySelector('.jp-Notebook');
    if (el) el.scrollTop = y;
  }, info.total * (i / STEPS));
  await shot();
}
await hold(1.5);                                   // rest at the bottom (metrics table)

await b.close();
console.log(`jupyter 4K frames: ${F} (${(F / 30).toFixed(1)}s) -> ${dir}`);
