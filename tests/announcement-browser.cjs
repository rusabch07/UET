// Local Playwright coverage; excluded from the dependency-free Pages test glob.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../_site');
(async () => {
  // Serve built bytes from memory so cloud-drive latency cannot stall page loads.
  const files = new Map();
  for (const file of ['index.html','css/styles.css','js/data.js','js/app.js','js/shuttle.js','js/announcement.js','assets/uet-logo.png']) files.set('/UET/' + file, fs.readFileSync(path.join(root,file)));
  const server = http.createServer((req,res) => {
    const pathname = new URL(req.url,'http://localhost').pathname;
    const file = pathname === '/UET/' ? '/UET/index.html' : pathname;
    if (!files.has(file)) {res.writeHead(404);return res.end();}
    res.setHeader('Content-Type', ({'.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png'})[path.extname(file)]);
    res.end(files.get(file));
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base = `http://127.0.0.1:${server.address().port}/UET/`;
  let browser;
  try {
    browser = await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
    async function contextFor(theme, blockedStorage = false) {
      const context = await browser.newContext({reducedMotion:'reduce'});
      // The popup has no dependency on remote maps, icons, or web fonts.
      await context.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.fulfill({contentType:r.request().resourceType()==='stylesheet'?'text/css':'text/javascript',body:''}));
      await context.addInitScript(({theme,blockedStorage})=>{
        localStorage.setItem('uet_theme',theme);
        if(blockedStorage) Object.defineProperty(window,'sessionStorage',{get(){throw new Error('Storage disabled');}});
      },{theme,blockedStorage});
      return context;
    }
    for(const [width,height] of [[360,800],[390,844],[412,915],[768,1024],[820,1180],[1024,768],[1366,768]]) {
      for(const theme of ['light','dark']) {
        const context=await contextFor(theme);
        const page=await context.newPage();await page.setViewportSize({width,height});
        const errors=[];page.on('pageerror',e=>errors.push(e.message));
        await page.goto(base);
        const modal=page.locator('#ksk-announcement');await modal.waitFor({state:'visible'});
        const before=await page.evaluate(()=>JSON.stringify(UET_DATA));
        assert.equal(await page.evaluate(()=>document.activeElement.id),'ksk-announcement-view');
        assert.equal(await page.evaluate(()=>sessionStorage.getItem('uet_ksk_announcement_seen')),'1');
        const geometry=await modal.evaluate(el=>{
          const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};};
          return {card:rect(el.firstElementChild),close:rect(document.getElementById('ksk-announcement-close')),buttons:[...el.querySelectorAll('button')].map(rect),overflow:document.documentElement.scrollWidth>innerWidth,body:getComputedStyle(document.body).position,headerInert:document.querySelector('.app-header').inert,top:document.elementFromPoint(innerWidth/2,innerHeight/2).closest('#ksk-announcement')!==null};
        });
        assert.equal(geometry.overflow,false);assert.equal(geometry.body,'fixed');assert.equal(geometry.headerInert,true);assert.equal(geometry.top,true);
        for(const r of [geometry.card,...geometry.buttons]) assert.ok(r.x>=0 && r.right<=width && r.y>=0 && r.bottom<=height,JSON.stringify(r));
        for(const r of geometry.buttons)assert.ok(r.h>=44);
        assert.ok(geometry.close.x>=geometry.card.x && geometry.close.right<=geometry.card.right);
        for(let i=0;i<5;i++){await page.keyboard.press('Tab');assert.ok(await modal.evaluate(e=>e.contains(document.activeElement)));}
        await page.keyboard.press('Shift+Tab');assert.ok(await modal.evaluate(e=>e.contains(document.activeElement)));
        await page.mouse.wheel(0,600);assert.equal(await page.evaluate(()=>scrollY),0);
        if([360,768,1366].includes(width))await page.screenshot({path:path.resolve(__dirname,`../test-results/announcement-${width}-${theme}.png`)});
        // Primary action uses the existing renderer, including all eight existing trips.
        await page.locator('#ksk-announcement-view').focus();await page.keyboard.press('Enter');
        assert.ok(await modal.isHidden());assert.equal(await page.evaluate(()=>location.hash),'#shuttle');assert.equal(await page.locator('.shuttle-card').count(),8);
        assert.equal(await page.evaluate(()=>document.querySelector('.app-header').inert),false);
        assert.notEqual(await page.evaluate(()=>getComputedStyle(document.body).position),'fixed');
        const ids=await page.locator('.shuttle-view').evaluateAll(els=>els.map(e=>e.dataset.shuttleId));
        for(const id of ids){await page.locator(`[data-shuttle-id="${id}"]`).click();assert.equal(await page.locator('.shuttle-card').count(),0);assert.equal(await page.locator('.shuttle-timeline li').count(),12);await page.locator('.shuttle-back').click();}
        await page.evaluate(()=>navigateToPage('home'));assert.ok(await modal.isHidden());
        await page.reload();assert.ok(await modal.isHidden());
        if(width<=1024){await page.locator('.nav-toggle').click();await page.locator('.mobile-menu-item[data-page="shuttle"]').click();assert.equal(await page.locator('#mobile-menu-drawer').getAttribute('aria-hidden'),'true');}
        else await page.locator('.nav-btn[data-page="shuttle"]').click();
        assert.equal(await page.locator('.shuttle-card').count(),8);
        assert.equal(await page.evaluate(()=>JSON.stringify(UET_DATA)),before);
        assert.deepEqual(errors,[]);
        await context.close();
        console.log(`PASS ${width}x${height} ${theme}: popup layout, touch targets, focus trap, scroll lock, session suppression, 8 trips, navigation`);
      }
    }
    for(const action of ['later','close','escape','backdrop']) {
      const context=await contextFor('light');const page=await context.newPage();await page.goto(base);
      const modal=page.locator('#ksk-announcement');await modal.waitFor({state:'visible'});
      if(action==='escape')await page.keyboard.press('Escape');
      else if(action==='backdrop')await modal.click({position:{x:1,y:1}});
      else {await page.locator('#ksk-announcement-'+action).focus();await page.keyboard.press('Enter');}
      assert.ok(await modal.isHidden());assert.equal(await page.evaluate(()=>appState.activePage),'home');
      await page.evaluate(()=>scrollTo({top:300,behavior:'instant'}));assert.equal(await page.evaluate(()=>scrollY),300);
      await page.reload();assert.ok(await modal.isHidden());await context.close();console.log('PASS dismissal '+action);
    }
    const direct=await contextFor('light');const directPage=await direct.newPage();await directPage.goto(base+'#shuttle');
    assert.ok(await directPage.locator('#ksk-announcement').isHidden());assert.equal(await directPage.locator('.shuttle-card').count(),8);
    await directPage.evaluate(()=>navigateToPage('home'));assert.ok(await directPage.locator('#ksk-announcement').isHidden());await direct.close();
    const denied=await contextFor('dark',true);const deniedPage=await denied.newPage();await deniedPage.goto(base);await deniedPage.locator('#ksk-announcement').waitFor({state:'visible'});await deniedPage.keyboard.press('Escape');await deniedPage.evaluate(()=>{navigateToPage('shuttle');navigateToPage('home');});assert.ok(await deniedPage.locator('#ksk-announcement').isHidden());await denied.close();
    console.log('PASS direct links, fresh sessions, and unavailable sessionStorage fallback');
  } finally {if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
