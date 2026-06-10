import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:1280,height:720}, recordVideo:{dir:'/tmp/pwvid', size:{width:1280,height:720}} });
const p = await ctx.newPage();
await p.setContent('<body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#0b1220"><h1 style="font-family:sans-serif;color:#4f9cff">Hello 教學影片</h1></body>');
await p.waitForTimeout(1500);
await ctx.close(); await b.close();
console.log('done');
