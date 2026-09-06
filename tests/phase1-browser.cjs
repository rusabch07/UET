// Run after node scripts/build-pages.cjs. Exercises the actual /UET/ Pages artifact.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium, devices } = require('playwright');
const root = path.resolve(__dirname, '../_site');
(async () => {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const file = path.resolve(root, decodeURIComponent(url.pathname.replace(/^\/UET\//, '')) || 'index.html');
    if (!url.pathname.startsWith('/UET/') || !file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      console.error('Missing local asset: ' + url.pathname); res.writeHead(404); return res.end();
    }
    res.setHeader('Content-Type', ({ '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png' })[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port + '/UET/';
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
    for (const [label, profile, simulatedIOS] of [
      ['iPhone Safari flow (simulated in Chromium)', devices['iPhone 13'], true],
      ['Android Chrome emulation', devices['Pixel 5'], false],
      ['Desktop Chrome', { viewport: { width: 1366, height: 768 } }, false]
    ]) {
      const context = await browser.newContext({ ...profile, geolocation: { latitude: 31.518, longitude: 74.262 }, permissions: ['geolocation'] });
      if (simulatedIOS) await context.addInitScript(() => {
        window.gpsRequests = [];
        Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition(success, failure, options) { window.gpsRequests.push({ success, failure, options }); } } });
      });
      const page = await context.newPage();
      const errors = [], failed = [], responses = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('requestfailed', r => {
        // Leaflet deliberately cancels obsolete image tiles as the map view changes.
        if (r.failure()?.errorText === 'net::ERR_ABORTED' && r.resourceType() === 'image' && new URL(r.url()).hostname.endsWith('.tile.openstreetmap.org')) return;
        failed.push(r.url() + ' ' + r.failure()?.errorText);
      });
      page.on('response', r => { responses.push({ url: r.url(), status: r.status() }); });
      await page.goto(base, { waitUntil: 'networkidle' });
      await page.reload({ waitUntil: 'networkidle' });
      assert.ok(await page.locator('.app-header svg').count() > 0, 'shared icon initialization works after a fresh reload');
      await page.addStyleTag({ content: '*{animation-duration:0s!important;transition-duration:0s!important;scroll-behavior:auto!important}' });
      const home = async () => { await page.locator('.brand-logo').click(); await page.locator('#main-location-input').press('Escape'); };
      const idle = () => page.waitForFunction(() => !document.querySelector('#search-loading-overlay').classList.contains('active') && !document.querySelector('#btn-locate-me').disabled);
      for (const asset of ['css/styles.css', 'js/data.js', 'js/app.js']) {
        assert.ok(responses.some(r => r.status === 200 && r.url.startsWith(base + asset + '?v=')), asset + ' versioned asset loads under project path');
      }
      if (simulatedIOS) {
        assert.equal(await page.evaluate(() => gpsRequests.length), 0);
        await page.locator('#btn-locate-me').click();
        assert.equal(await page.evaluate(() => gpsRequests.length), 1);
        await page.evaluate(() => { for (let i = 0; i < 8; i++) detectUserGeolocation(); });
        assert.equal(await page.evaluate(() => gpsRequests.length), 1);
        await page.evaluate(() => gpsRequests[0].failure({ code: 1 }));
        await idle();
        assert.equal(await page.evaluate(() => gpsRequests.length), 1);
        assert.match(await page.locator('#result-content-container').innerText(), /Safari settings.*Location Services.*reload/);
        await home();
      }
      // Manual search stays fully usable after denied GPS, including same-name stops on different routes.
      for (const campus of ['ksk', 'main']) {
        await page.locator('#page-home .campus-btn[data-campus="' + campus + '"]').click();
        assert.equal(await page.evaluate(() => appState.selectedCampus), campus);
        const match = await page.evaluate(campus => {
          const index = buildUetStopSearchIndex(campus);
          for (const entry of index) {
            const same = searchUetStops(entry.stopName, campus).filter(e => normalizeStopSearchText(e.stopName) === normalizeStopSearchText(entry.stopName));
            if (new Set(same.map(e => e.routeId)).size > 1) return { name: entry.stopName, key: same[1].key, routeId: same[1].routeId, stopIndex: same[1].stopIndex };
          }
        }, campus);
        assert.ok(match, campus + ' duplicate stop fixture exists');
        await page.locator('#main-location-input').fill(match.name);
        const option = page.locator('#stop-search-suggestions [data-stop-key="' + match.key + '"]');
        await option.click();
        await page.locator('#result-map .leaflet-marker-icon').first().waitFor();
        await page.waitForLoadState('networkidle');
        assert.equal(await page.locator('#result-map .leaflet-marker-icon').count(), 2, 'manual search preserves pickup and campus markers without an undefined GPS marker');
        assert.equal(await page.evaluate(() => appState.recommendationResults.status), 'exact_stop');
        assert.equal(await page.evaluate(() => appState.recommendationResults.matchingRoutes[0].route.id), match.routeId);
        assert.equal(await page.evaluate(() => appState.recommendationResults.matchingRoutes[0].stopIndex), match.stopIndex);
        await page.getByRole('button', { name: 'Directions to Stop', exact: true }).click();
        const directions = new URL(await page.locator('#directions-google').getAttribute('href'));
        await page.locator('#directions-cancel').click();
        const coordinates = await page.evaluate(() => { const s = appState.recommendationResults.matchingRoutes[0].stop; return s.lat + ',' + s.lng; });
        assert.equal(directions.origin, 'https://www.google.com');
        assert.equal(directions.searchParams.get('destination'), coordinates);
        await page.getByRole('button', { name: 'Save Route', exact: true }).click();
        assert.equal(await page.evaluate(id => appState.favorites.includes(id), match.routeId), true);
        await page.getByRole('button', { name: 'Remove from Saved', exact: true }).click();
        assert.equal(await page.evaluate(id => appState.favorites.includes(id), match.routeId), false);
        await home();
      }
      await page.locator('#btn-locate-me').click();
      if (simulatedIOS) {
        await page.evaluate(() => gpsRequests.at(-1).failure({ code: 3 }));
        assert.equal(await page.evaluate(() => gpsRequests.length), 3);
        const options = await page.evaluate(() => gpsRequests.at(-1).options);
        assert.deepEqual(options, { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 });
        await page.evaluate(() => gpsRequests.at(-1).success({ coords: { latitude: 31.518, longitude: 74.262, accuracy: 900 } }));
      }
      await page.waitForFunction(() => appState.currentLocation?.source === 'gps');
      await idle();
      await page.locator('#result-map .leaflet-marker-icon').first().waitFor();
      await page.waitForLoadState('networkidle');
      assert.equal(await page.evaluate(() => appState.recommendationResults.matchingRoutes.every(m => m.distanceKm <= 1.5)), true);
      assert.equal(await page.evaluate(() => {
        const matches = appState.recommendationResults.matchingRoutes;
        return matches.some((m, i) => matches.some((other, j) => j !== i && other.route.id === m.route.id));
      }), true, 'multiple nearby stops from same route remain');
      if (errors.length || failed.length) console.log(JSON.stringify({ errors, failed, badResponses: responses.filter(r => r.status >= 400) }));
      assert.deepEqual(errors, [], label + ' console');
      assert.deepEqual(failed, [], label + ' failed requests');
      assert.deepEqual(responses.filter(r => r.status >= 400), [], label + ' missing assets');
      console.log('PASS ' + label + ': versioned assets, campuses, duplicate stop suggestions, exact selection, directions, save/remove, GPS, manual fallback, no console/network errors');
      await context.close();
    }
  } finally {
    if (browser) await browser.close();
    await new Promise(r => server.close(r));
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
