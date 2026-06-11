import { chromium } from 'playwright';
const scenes = process.argv.slice(2).map(Number);
const b = await chromium.launch({ args:['--disable-gpu','--force-color-profile=srgb','--hide-scrollbars'] });
const ctx = await b.newContext({ viewport:{width:1920,height:1080}, deviceScaleFactor:1 });
const p = await ctx.newPage();
for (const s of scenes){
  await p.goto('file://'+process.cwd()+'/deck/index.html?seek=1&from='+s+'&to='+s, {waitUntil:'load'});
  await p.waitForFunction('window.__ready===true',{timeout:20000});
  const total = await p.evaluate(()=>window.__totalDuration);
  await p.evaluate(t=>window.__seek(t), Math.max(1500, total*0.6));
  await p.waitForTimeout(150);
  await p.screenshot({ path:`probe/scene_${String(s).padStart(2,'0')}.jpg`, type:'jpeg', quality:90 });
  process.stdout.write(' '+s);
}
await b.close(); console.log(' done');
