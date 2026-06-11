import { chromium } from 'playwright';
const N = parseInt(process.argv[2] || '44');
const b = await chromium.launch({ args:['--disable-gpu','--force-color-profile=srgb','--hide-scrollbars'] });
const ctx = await b.newContext({ viewport:{width:1920,height:1080}, deviceScaleFactor:1 });
const p = await ctx.newPage();
for (let s=0; s<N; s++){
  await p.goto('file://'+process.cwd()+'/deck/index.html?seek=1&from='+s+'&to='+s, {waitUntil:'load'});
  await p.waitForFunction('window.__ready===true',{timeout:20000});
  const total = await p.evaluate(()=>window.__totalDuration);
  await p.evaluate(t=>window.__seek(t), Math.max(1600, total*0.62));  // settled, captions shown
  await p.waitForTimeout(120);
  await p.screenshot({ path:`pptx_frames/scene_${String(s).padStart(2,'0')}.png`, type:'png' });
  process.stdout.write(' '+s);
}
await b.close(); console.log(' done');
