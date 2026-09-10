const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');const root=path.resolve(__dirname,'..');
(async()=>{
 const files=new Map();for(const f of ['index.html','css/styles.css','js/data.js','js/app.js','js/shuttle.js','js/announcement.js','assets/uet-logo.png'])files.set('/'+f,fs.readFileSync(path.join(root,f)));
 const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');const f=url.pathname==='/'?'/index.html':url.pathname;if(!files.has(f)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'})[path.extname(f)]);res.end(files.get(f));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
 try{for(const [width,height,count] of [[360,800,1],[390,844,1],[412,915,1],[768,1024,2],[820,1180,2],[1024,768,2],[1366,768,4]])for(const theme of ['light','dark']){
 const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.fulfill({body:'',contentType:r.request().resourceType()==='stylesheet'?'text/css':'text/javascript'}));
 await page.addInitScript(theme=>localStorage.setItem('uet_theme',theme),theme);await page.goto(base);await page.locator('#ksk-announcement').waitFor({state:'visible'});await page.keyboard.press('Escape');
 for(const campus of ['ksk','main']){
 await page.evaluate(campus=>{setSelectedCampus(campus);navigateToPage('home');},campus);
 const cards=page.locator('#home-routes-grid > .route-card:visible');assert.equal(await cards.count(),count);
 const state=await page.evaluate(()=>{const visible=[...document.querySelectorAll('#home-routes-grid > .route-card')].filter(e=>getComputedStyle(e).display!=='none');return {cards:visible.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,button:e.querySelector('.btn-card-primary').getAttribute('onclick')};}),expected:UET_DATA.routes.filter(r=>r.campusId===appState.selectedCampus).slice(0,visible.length).map(r=>r.id),overflow:document.documentElement.scrollWidth>innerWidth,clipped:visible.flatMap(e=>[...e.querySelectorAll('.route-card-title,.meta-item span,button')].filter(x=>x.scrollWidth>x.clientWidth+1).map(x=>x.textContent.trim()))};});
 assert.equal(state.overflow,false);assert.deepEqual(state.clipped,[]);
 for(const [i,c]of state.cards.entries()){assert.ok(Math.abs(c.y-state.cards[0].y)<1);assert.ok(Math.abs(c.w-state.cards[0].w)<1);assert.ok(Math.abs(c.h-state.cards[0].h)<1);assert.ok(c.x>=0&&c.right<=width);assert.ok(c.button.includes(state.expected[i]));}
 const all=page.locator('.home-route-preview-actions button');assert.equal(await all.innerText(),'View All Routes →');await all.scrollIntoViewIfNeeded();assert.ok(await all.isVisible());
 await page.screenshot({path:path.join(root,`test-results/home-preview-${width}-${theme}-${campus}.png`)});
 await page.evaluate(()=>{window.previewNavigationSentinel=true;});await all.click();assert.equal(await page.evaluate(()=>previewNavigationSentinel),true);assert.equal(await page.evaluate(()=>location.hash),'#routes');
 const expected=await page.evaluate(()=>UET_DATA.routes.filter(r=>r.campusId===appState.selectedCampus).map(r=>r.id));assert.equal(await page.locator('#routes-detail-container .route-card').count(),expected.length);
 for(const id of expected)assert.equal(await page.locator('#route-card-'+id).count(),1);
 await page.locator('#routes-detail-container .btn-card-primary').first().click();await page.locator('.route-detail-heading').waitFor();await page.locator('.route-back-button').click();
 await page.evaluate(()=>navigateToPage('home'));await cards.first().locator('.btn-card-primary').click();await page.locator('.route-detail-heading').waitFor();
 }
 await page.evaluate(()=>navigateToPage('shuttle'));assert.equal(await page.locator('.shuttle-card').count(),8);assert.deepEqual(errors,[]);await page.close();console.log(`PASS ${width}x${height} ${theme}: ${count} preview cards, both campuses, one row, View All, full schedules/details, 8 shuttle trips`);
 }
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
