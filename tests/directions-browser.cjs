const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium, devices } = require('playwright');
const root = path.resolve(__dirname, '../_site');
(async () => {
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const file = path.resolve(root, decodeURIComponent(pathname.replace(/^\/UET\//, '')) || 'index.html');
    if (!pathname.startsWith('/UET/') || !file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404); return res.end();
    }
    res.setHeader('Content-Type', ({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'})[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port + '/UET/';
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
    for (const [name, profile, apple] of [
      ['iPhone Safari flow (Chromium simulation)', devices['iPhone 13'], true],
      ['iPad desktop-mode detection', {viewport:{width:768,height:1024},userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15',hasTouch:true}, true],
      ['Android Chrome', devices['Pixel 5'], false],
      ['older Android fallback (Chromium simulation)', {viewport:{width:360,height:800},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 8.0) AppleWebKit/537.36 Chrome/80.0.3987.119 Mobile Safari/537.36'}, false],
      ['desktop Chrome', {viewport:{width:1366,height:768}}, false]
    ]) for (const theme of ['light', 'dark']) {
      const context = await browser.newContext(profile);
      // Capture native HTTPS anchor navigation without depending on an installed Maps app.
      await context.route(/^https:\/\/(www\.google\.com\/maps\/|maps\.apple\.com\/)/, r => r.fulfill({contentType:'text/html',body:'<title>HTTPS Maps navigation received</title>'}));
      await context.addInitScript(({ipad}) => {
        window.gpsCalls = 0; window.gpsAllowed = false;
        if (ipad) {
          Object.defineProperty(navigator, 'platform', {value:'MacIntel'});
          Object.defineProperty(navigator, 'maxTouchPoints', {value:5});
        }
        Object.defineProperty(navigator, 'geolocation', {value:{getCurrentPosition(success, failure) {
          window.gpsCalls++;
          if (window.gpsAllowed) success({coords:{latitude:31.518,longitude:74.262}});
          else failure({code:1});
        }}});
      }, {ipad:name.startsWith('iPad')});
      const page = await context.newPage();
      const errors=[];
      page.on('pageerror', e=>errors.push(e.message));
      page.on('console', m=>{if(m.type()==='error')errors.push(m.text());});
      await page.goto(base, {waitUntil:'networkidle'});
      await page.evaluate(t=>applyTheme(t),theme);
      const home = async()=>{await page.locator('.brand-logo').click();await page.locator('#main-location-input').press('Escape');};
      const idle = ()=>page.waitForFunction(()=>!document.querySelector('#search-loading-overlay').classList.contains('active'));
      const modal = page.locator('#directions-modal');
      const expected = ()=>page.evaluate(()=>{
        const item=appState.recommendationResults.matchingRoutes[appState.activeRecommendationIndex||0];
        return {name:item.stop.name,coordinates:item.stop.lat+','+item.stop.lng,route:formatRouteLabel(item.route.routeNo),campus:getCampusShortName(item.route.campusId)};
      });
      const checkChooser = async({openLink=false}={})=>{
        const stop=await expected();const gpsBefore=await page.evaluate(()=>gpsCalls);
        await page.getByRole('button',{name:'Directions to Stop',exact:true}).click();
        assert.ok(await modal.isVisible());
        assert.equal(await page.locator('#directions-dialog-title').innerText(),'Directions to '+stop.name);
        assert.equal(await page.locator('#directions-stop-context').innerText(),stop.route+' · '+stop.campus);
        assert.equal(await page.locator('#directions-apple').isVisible(),apple);
        assert.equal(await page.locator('#directions-google').evaluate(e=>e===document.activeElement),true);
        for(const option of ['google','location',...(apple?['apple']:[])]){
          const link=page.locator('#directions-'+option);const url=new URL(await link.getAttribute('href'));
          assert.equal(url.protocol,'https:');
          assert.equal(url.searchParams.get(option==='google'?'destination':option==='apple'?'daddr':'query'),stop.coordinates);
          assert.equal(url.searchParams.has('destination_place_id'),false);
          assert.equal(url.searchParams.has('origin'),false);
          if(option==='google')assert.equal(url.searchParams.get('travelmode'),'walking');
          if(option==='apple')assert.equal(url.searchParams.get('dirflg'),'w');
          assert.equal(await link.getAttribute('target'),'_blank');
          assert.equal(await link.getAttribute('rel'),'noopener noreferrer');
          if(openLink){
            const popupPromise=page.waitForEvent('popup');await link.click();const popup=await popupPromise;
            await popup.waitForLoadState('domcontentloaded');
            assert.equal(popup.url(),url.href);await popup.close();
          }
        }
        assert.equal(await page.evaluate(()=>gpsCalls),gpsBefore,'Directions must not request website GPS');
        const layout=await modal.evaluate(el=>({overflow:el.scrollWidth>el.clientWidth,buttons:[...el.querySelectorAll('a,button')].filter(e=>e.getClientRects().length).map(e=>e.getBoundingClientRect().height)}));
        assert.equal(layout.overflow,false);assert.ok(layout.buttons.every(h=>h>=44));
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
        for(let i=0;i<6;i++){await page.keyboard.press('Tab');assert.ok(await modal.evaluate(e=>e.contains(document.activeElement)));}
        await page.keyboard.press('Escape');await modal.waitFor({state:'hidden'});
        await page.waitForFunction(()=>document.activeElement?.matches('[data-directions-route]'));
      };
      // Denied website GPS must not prevent manual-stop Directions.
      await page.locator('#btn-locate-me').click();await idle();await home();
      const duplicates=await page.evaluate(()=>{
        const all=buildUetStopSearchIndex(appState.selectedCampus);
        for(const stop of all){const same=searchUetStops(stop.stopName,appState.selectedCampus).filter(x=>x.stopName===stop.stopName);
          if(new Set(same.map(x=>x.routeId)).size>1)return same.slice(0,2);}
      });
      assert.equal(duplicates.length,2);
      for(const [i,stop] of duplicates.entries()){
        await page.locator('#main-location-input').fill(stop.stopName);
        await page.locator('[data-stop-key="'+stop.key+'"]').click();
        await checkChooser({openLink:i===0});await home();
      }
      // GPS results: select two distinct pickups on the same route using their actual cards.
      await page.evaluate(()=>{gpsAllowed=true;});await page.locator('#btn-locate-me').click();await idle();
      const indexes=await page.evaluate(()=>{
        const items=appState.recommendationResults.matchingRoutes;
        for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++)if(items[i].route.id===items[j].route.id && (items[i].stop.lat!==items[j].stop.lat||items[i].stop.lng!==items[j].stop.lng))return [i,j];
      });
      assert.equal(indexes.length,2);
      for(const i of indexes){await page.locator('[data-pickup-index="'+i+'"]').click();await checkChooser();}
      await page.getByRole('button',{name:'Directions to Stop',exact:true}).click();
      await page.locator('#directions-cancel').click();await modal.waitFor({state:'hidden'});
      await page.getByRole('button',{name:'Directions to Stop',exact:true}).click();
      await modal.click({position:{x:2,y:2}});await modal.waitFor({state:'hidden'});
      // Revalidation clears prior links when a stop becomes invalid; fixture is browser-local only.
      await page.evaluate(()=>{
        const r=UET_DATA.routes[0], saved=r.stops[0].lat;
        r.stops[0].lat=NaN;openStopDirections(r.id,0);r.stops[0].lat=saved;
      });
      assert.equal(await page.locator('#directions-error').innerText(),'Directions are currently unavailable for this stop.');
      assert.equal(await modal.locator('a[href]').count(),0);
      await page.locator('#directions-cancel').click();
      assert.deepEqual(errors,[]);
      if(name.startsWith('iPhone') || name==='desktop Chrome'){
        await page.getByRole('button',{name:'Directions to Stop',exact:true}).click();
        fs.mkdirSync('test-results',{recursive:true});
        await page.screenshot({path:'test-results/directions-'+(apple?'ios':'desktop')+'-'+theme+'.png'});
      }
      console.log('PASS '+name+' '+theme+': manual/GPS exact stop, same-route pickups, duplicate names, HTTPS popup links, fallback, denied GPS, invalid data, focus/close/overflow');
      await context.close();
    }
  } finally {if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
