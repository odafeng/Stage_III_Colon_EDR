import { chromium } from 'playwright';
const idx = process.argv[2] ? +process.argv[2] : 0;
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:1920,height:1080}, deviceScaleFactor:1 });
const p = await ctx.newPage();
await p.goto('file://' + process.cwd() + '/deck/index.html');
await p.waitForFunction('window.__ready===true', {timeout:15000});
// stop the autoplay, force a given scene active
await p.evaluate((i)=>{
  window.__start && window.__start.toString(); // noop
  const scenes=[...document.querySelectorAll('.scene')];
  scenes.forEach(s=>{s.classList.remove('active','leaving');});
  const s=scenes[i]; s.classList.add('active');
  s.querySelectorAll('.anim').forEach(el=>{el.style.transitionDelay='0s';});
  // reveal tw + outs for screenshot
  s.querySelectorAll('[data-tw]').forEach(el=>el.textContent=el.dataset.tw);
  s.querySelectorAll('.tw-out').forEach(o=>{o.style.opacity=1;});
  const cap=document.getElementById('cap'); cap.classList.remove('show');
}, idx);
await p.waitForTimeout(1200);
await p.screenshot({ path:`/tmp/shot_${idx}.png` });
console.log('shot', idx);
await b.close();
