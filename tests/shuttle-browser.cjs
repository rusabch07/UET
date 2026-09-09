// Local browser checks: run with Playwright and Chrome, like the other *-browser.cjs suites.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const vm = require('node:vm');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
(async () => {
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/shuttle.js'), 'utf8') + ';this.trips=SHUTTLE_DATA;', sandbox);
  const trips = JSON.parse(JSON.stringify(sandbox.trips));
  assert.equal(trips.length, 8);
  assert.equal(new Set(trips.map(t => t.id)).size, 8);
  assert.deepEqual(trips.map(t => t.departure), ['08:00 AM','09:00 AM','10:00 AM','11:00 AM','11:00 AM','12:00 PM','01:00 PM','02:00 PM']);
  assert.equal(trips[0].stops[1].time, '08:10 AM');
  assert.equal(trips[0].stops[3].time, undefined);
  assert.equal(trips[1].stops[1].time, '09:05 AM');
  assert.equal(trips[1].stops[3].time, '09:10 AM');
  assert.ok(trips.slice(4).every(t => t.stops.every(s => s.time === undefined)));
  assert.equal(trips[4].stops[10].name, 'Sultan Pura Metro');
  assert.equal(trips[6].stops[10].name, 'Sultan Pura Metro Station');
  const server = http.createServer((req,res) => {
    const file = path.join(root, req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0]);
    if (!fs.existsSync(file)) { res.writeHead(404); return res.end(); }
    res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.png') ? 'image/png' : 'text/html');
    res.end(fs.readFileSync(file));
  });
  await new Promise(r => server.listen(0,'127.0.0.1',r));
  let browser;
  try {
    browser = await chromium.launch({headless:true, executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
    for (const [width,height] of [[360,800],[390,844],[412,915],[768,1024],[820,1180],[1024,768],[1366,768]]) {
      for (const theme of ['light','dark']) {
        const page = await browser.newPage({viewport:{width,height}});
        const errors=[];
        page.on('pageerror',e=>errors.push(e.message));
        await page.addInitScript(theme => localStorage.setItem('uet_theme',theme),theme);
        await page.goto(`http://127.0.0.1:${server.address().port}/#shuttle`);
        await page.evaluate(()=>document.fonts.ready);
        await page.locator('.shuttle-card').first().waitFor();
        const before = await page.evaluate(()=>({data:JSON.stringify(UET_DATA),favorites:localStorage.getItem('uet_fav_routes'),campus:appState.selectedCampus}));
        assert.equal(await page.locator('.shuttle-card').count(),8);
        async function checkLayout() {
          const issues = await page.evaluate(()=> {
            const errors=[];
            if(document.documentElement.scrollWidth>innerWidth) errors.push('document overflow');
            for(const el of document.querySelectorAll('#page-shuttle *, .app-header *')) {
              const r=el.getBoundingClientRect();
              if(r.width && r.height && (r.left < -.5 || r.right>innerWidth+.5)) errors.push('outside viewport '+el.className);
              if(r.width && r.height && el.scrollWidth>el.clientWidth+1 && !['SPAN','BUTTON','H1','H2','H3','DT','DD','P'].includes(el.tagName)) errors.push('content overflow '+el.className);
            }
            return errors;
          });
          assert.deepEqual(issues,[], `${width} ${theme}: ${issues}`);
        }
        await checkLayout();
        const cards = await page.locator('.shuttle-card').evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect();return {w:r.width,h:r.height,y:r.y};}));
        assert.ok(cards.every(c=>Math.abs(c.w-cards[0].w)<1));
        for(let i=0;i<8;i++) {
          await page.locator(`[data-shuttle-id="${trips[i].id}"]`).click();
          assert.equal(await page.locator('.shuttle-card').count(),0);
          assert.equal(await page.locator('.shuttle-detail').count(),1);
          assert.deepEqual(await page.locator('.shuttle-stop > span:first-child').allTextContents(),trips[i].stops.map(s=>s.name));
          assert.deepEqual(await page.locator('.shuttle-stop .shuttle-time').allTextContents(),trips[i].stops.filter(s=>s.time).map(s=>s.time));
          const axis = await page.locator('.shuttle-marker').evaluateAll(els=>els.map(e=>{
            const a=getComputedStyle(e,'::after'), b=getComputedStyle(e,'::before'),r=e.getBoundingClientRect();
            return {x:r.x+r.width/2,dot:parseFloat(a.left),line:b.display === 'none' ? parseFloat(a.left) : parseFloat(b.left)};
          }));
          assert.ok(axis.every(a=>Math.abs(a.x-axis[0].x)<.1 && Math.abs(a.dot-a.line)<.1));
          await checkLayout();
          if(i===0 && [360,768,1366].includes(width)) await page.screenshot({path:path.join(root,'test-results',`shuttle-detail-${width}-${theme}.png`),fullPage:true});
          await page.locator('.shuttle-back').click();
          assert.equal(await page.locator('.shuttle-card').count(),8);
        }
        await page.evaluate(()=>navigateToPage('home'));
        if(width<=1024) {
          await page.locator('.nav-toggle').click();
          await page.locator('.mobile-menu-item[data-page="shuttle"]').click();
          assert.equal(await page.locator('#mobile-menu-drawer').getAttribute('aria-hidden'),'true');
        } else await page.locator('.nav-btn[data-page="shuttle"]').click();
        assert.equal(await page.locator('#page-shuttle').getAttribute('class'),'page-section active');
        assert.equal(await page.evaluate(()=>location.hash),'#shuttle');
        assert.deepEqual(await page.evaluate(()=>({data:JSON.stringify(UET_DATA),favorites:localStorage.getItem('uet_fav_routes'),campus:appState.selectedCampus})),before);
        await page.evaluate(()=>scrollTo(0,0));
        await checkLayout();
        if([360,768,1366].includes(width)) await page.screenshot({path:path.join(root,'test-results',`shuttle-overview-${width}-${theme}.png`),fullPage:true});
        assert.deepEqual(errors,[]);
        console.log(`PASS ${width} x ${height} ${theme}: all 8 trips, timeline, overview, navigation, isolation`);
        await page.close();
      }
    }
  } finally { if(browser) await browser.close(); server.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
