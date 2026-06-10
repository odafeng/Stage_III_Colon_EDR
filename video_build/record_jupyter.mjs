import { chromium } from 'playwright';
import fs from 'fs';
const OUT = '/tmp/jvid';
fs.rmSync(OUT, { recursive: true, force: true });
const URL = 'http://127.0.0.1:8899';

const b = await chromium.launch({ args:['--disable-gpu','--disable-dev-shm-usage'] });
const ctx = await b.newContext({ viewport:{width:1920,height:1080}, deviceScaleFactor:2,
  recordVideo:{ dir:OUT, size:{width:1920,height:1080} } });
const p = await ctx.newPage();
const sleep = ms => p.waitForTimeout(ms);

// 1) open Lab at root → show folder structure in sidebar
await p.goto(URL + '/lab?reset', { waitUntil:'domcontentloaded' });
await p.waitForSelector('.jp-DirListing-content', { timeout:60000 });
// hide news/notification toasts for a clean look
await p.addStyleTag({ content: '.jp-toast-container,.Toastify,.jp-Notification{display:none!important}' });
await sleep(4000);  // beauty shot: Data / Figures / Notebooks / Tables in sidebar

// 2) open the Notebooks folder by double-clicking it
try {
  await p.dblclick('.jp-DirListing-item >> text=Notebooks', { timeout:8000 });
  await sleep(2200);
  // 3) open notebook 2
  await p.dblclick('.jp-DirListing-item >> text=2_Model_Development.ipynb', { timeout:8000 });
} catch (e) {
  console.log('fallback to URL open:', e.message);
  await p.goto(URL + '/lab/tree/Notebooks/2_Model_Development.ipynb', { waitUntil:'domcontentloaded' });
}

// 4) wait for the notebook to render
await p.waitForSelector('.jp-Notebook .jp-Cell', { timeout:60000 });
await sleep(3500);

// 5) smooth auto-scroll through the notebook (real code + real figures)
const scroller = '.jp-WindowedPanel-outer, .jp-Notebook';
await p.evaluate(async (sel) => {
  const el = document.querySelector('.jp-WindowedPanel-outer') || document.querySelector('.jp-Notebook');
  if (!el) return;
  const total = el.scrollHeight - el.clientHeight;
  const steps = 220;
  for (let i = 0; i <= steps; i++) {
    el.scrollTop = total * (i / steps);
    await new Promise(r => setTimeout(r, 70));
  }
}, scroller);
await sleep(2500);

await ctx.close(); await b.close();
const webm = fs.readdirSync(OUT).find(f=>f.endsWith('.webm'));
fs.copyFileSync(`${OUT}/${webm}`, `${process.cwd()}/clips/jupyter.webm`);
console.log('saved clips/jupyter.webm');
