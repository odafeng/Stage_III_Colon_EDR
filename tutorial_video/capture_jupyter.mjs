// Real-screen-recording capture of a live JupyterLab notebook (1080p, 30fps).
// Clean full-width notebook view -> smooth scroll through real code + real outputs.
//   node capture_jupyter.mjs <name> <notebookPath> [scrollSeconds]
import { chromium } from 'playwright';
import fs from 'fs';

const URL = 'http://127.0.0.1:8898';
const NAME = process.argv[2] || 'jupA';
const NB = process.argv[3] || 'Notebooks/03_modeling.ipynb';
const SCROLL_S = parseFloat(process.argv[4] || '24');
const dir = `/tmp/f_${NAME}`;
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });

let F = 0;
const pad = n => String(n).padStart(5, '0');
// hide all chrome clutter (Anaconda toolbox/assistant side panels, status bar, toasts)
const CLEAN = `.jp-toast-container,.Toastify,.jp-Notification,
  #jp-left-stack,.jp-SideBar.jp-mod-left,#jp-right-stack,.jp-SideBar.jp-mod-right,
  #jp-main-statusbar,#jp-bottom-panel{display:none!important}
  #jp-main-content-panel{left:0!important}`;

const b = await chromium.launch({ args: ['--disable-gpu', '--disable-dev-shm-usage', '--hide-scrollbars', '--force-color-profile=srgb'] });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
const sleep = ms => p.waitForTimeout(ms);
async function shot() { await p.screenshot({ path: `${dir}/f${pad(F++)}.jpg`, type: 'jpeg', quality: 95 }); }
async function hold(seconds) {
  const src = `${dir}/f${pad(F)}.jpg`; await p.screenshot({ path: src, type: 'jpeg', quality: 95 }); F++;
  const n = Math.round(seconds * 30) - 1;
  for (let i = 0; i < n; i++) fs.copyFileSync(src, `${dir}/f${pad(F++)}.jpg`);
}

// ?reset clears any stale workspace tabs (e.g. leftover Untitled notebooks)
await p.goto(URL + '/lab/tree/' + NB + '?reset', { waitUntil: 'domcontentloaded' });
await p.waitForSelector('.jp-Notebook .jp-Cell', { timeout: 60000 });
// dismiss the "Select Kernel" dialog by accepting the default kernel (closes it reliably;
// we never execute, only view pre-computed outputs)
for (let k = 0; k < 3; k++) {
  const dlg = p.locator('.jp-Dialog');
  if (await dlg.count().catch(() => 0)) {
    const accept = p.locator('.jp-Dialog .jp-mod-accept');
    if (await accept.count()) { await accept.first().click().catch(() => {}); }
    else await p.keyboard.press('Escape').catch(() => {});
    await sleep(800);
  } else break;
}
await sleep(800);
await p.addStyleTag({ content: CLEAN });
await sleep(1800);
await hold(2.8);

const info = await p.evaluate(() => {
  const el = document.querySelector('.jp-WindowedPanel-outer') || document.querySelector('.jp-Notebook');
  return { total: el ? el.scrollHeight - el.clientHeight : 0 };
});
const STEPS = Math.round(SCROLL_S * 30);
for (let i = 0; i <= STEPS; i++) {
  const e = i / STEPS, ease = e < .5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2;
  await p.evaluate((y) => {
    const el = document.querySelector('.jp-WindowedPanel-outer') || document.querySelector('.jp-Notebook');
    if (el) el.scrollTop = y;
  }, info.total * ease);
  await shot();
}
await hold(2.2);
await b.close();
console.log(`${NAME}: ${F} frames (${(F / 30).toFixed(1)}s) -> ${dir}`);
