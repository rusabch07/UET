const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('C:/Users/Google/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..');
(async()=>{
 const server=http.createServer((req,res)=>{const f=path.join(root,req.url.split('?')[0]==='/'?'index.html':req.url.split('?')[0]);if(!fs.existsSync(f)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(f));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 for(const width of [360,768,1366])for(const theme of ['light','dark']){
 const page=await browser.newPage({viewport:{width,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(theme=>{localStorage.setItem('uet_theme',theme);},theme);
 await page.goto(`http://127.0.0.1:${server.address().port}/#routes`);
 await page.evaluate(()=>{setSelectedCampus('ksk');document.querySelectorAll('.announcement-overlay').forEach(el=>el.remove());});
 const layout=async()=>assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${width} ${theme} overflow`);
 await layout();
 for(let n=11;n<=15;n++){
 const card=page.locator('#route-card-ksk-'+n);await card.waitFor();assert.equal(await card.locator('button').count(),1);
 await card.locator('button').click({force:true});
 await page.locator('.route-detail-heading').waitFor();assert.match(await page.locator('.route-detail-heading').innerText(),new RegExp('Route '+n+' - Full Details'));
 assert.equal(await page.locator('.route-detail-heading').count(),1);await layout();
 if(n===14)await page.screenshot({path:path.join(root,`test-results/ksk-${width}-${theme}.png`),fullPage:true});
 await page.locator('.route-back-button').click({force:true});
 }
 assert.deepEqual(errors,[]);console.log(`PASS ${width}px ${theme}: five cards and independent details`);await page.close();
 }
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
