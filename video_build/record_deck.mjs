import { chromium } from 'playwright';
import fs from 'fs';
const NAME = process.argv[2] || 'deck';
const FROM = process.argv[3], TO = process.argv[4];
const q = (FROM!==undefined && TO!==undefined) ? `?from=${FROM}&to=${TO}` : '';
const OUT = '/tmp/deckvid_' + NAME;
fs.rmSync(OUT, { recursive:true, force:true });
const b = await chromium.launch({ args:['--force-color-profile=srgb','--disable-gpu','--disable-dev-shm-usage'] });
const ctx = await b.newContext({ viewport:{width:1920,height:1080}, deviceScaleFactor:1,
  recordVideo:{ dir:OUT, size:{width:1920,height:1080} } });
const p = await ctx.newPage();
p.on('pageerror', e=>console.log('PAGEERR', e.message));
await p.goto('file://' + process.cwd() + '/deck/index.html' + q, { waitUntil:'domcontentloaded' });
await p.waitForFunction('window.__ready===true', { timeout:20000 });
await p.waitForTimeout(500);
await p.evaluate(() => window.__start && window.__start());
const t0=Date.now();
while(Date.now()-t0 < 320000){
  if(await p.evaluate(()=>window.__deckDone===true)) break;
  await p.waitForTimeout(3000);
}
await p.waitForTimeout(400);
await ctx.close(); await b.close();
const webm = fs.readdirSync(OUT).find(f=>f.endsWith('.webm'));
fs.copyFileSync(`${OUT}/${webm}`, `${process.cwd()}/clips/${NAME}.webm`);
console.log(`saved clips/${NAME}.webm (${((Date.now()-t0)/1000).toFixed(0)}s)`);
