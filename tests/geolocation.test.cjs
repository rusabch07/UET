const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');

// Exercise the production handler and loader with controlled browser callbacks/timers.
function setup(userAgent = 'iPhone Safari') {
  const elements = new Map();
  const timers = [];
  const calls = [];
  const results = [];
  const errors = [];
  const getElementById = id => {
    if (!elements.has(id)) {
      const classes = new Set();
      elements.set(id, { disabled: false, value: '', style: {}, classList: {
        add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c)
      }});
    }
    return elements.get(id);
  };
  const context = vm.createContext({
    navigator: { userAgent, geolocation: { getCurrentPosition: (success, failure, options) => calls.push({ success, failure, options }) } },
    document: { getElementById },
    setTimeout: fn => timers.push(fn), setInterval: () => 1, clearInterval() {}, Date,
    showLocationSearchError: message => errors.push(message),
    runNearbyRouteSearch: (...args) => { results.push(args); vm.runInContext('SearchLoader.hide()', context); }
  });
  vm.runInContext(source.slice(source.indexOf('const SearchLoader ='), source.indexOf('// Force refresh Lucide')), context);
  vm.runInContext(source.slice(source.indexOf('// Geolocation starts'), source.indexOf('function normalizeStopSearchText')), context);
  const click = () => vm.runInContext('detectUserGeolocation()', context);
  const flush = () => { while (timers.length) timers.shift()(); };
  const idle = () => {
    flush();
    assert.equal(getElementById('btn-locate-me').disabled, false);
    assert.equal(getElementById('btn-find-bus').disabled, false);
    assert.equal(getElementById('search-loading-overlay').classList.contains('active'), false);
    assert.equal(vm.runInContext('geolocationInProgress', context), false);
    assert.equal(getElementById('main-location-input').disabled, false);
  };
  return { context, calls, results, errors, click, idle, getElementById };
}
const position = { coords: { latitude: 31.518, longitude: 74.262, accuracy: 900 } };

test('iPhone first permission request is synchronous and only initiated by Detect My Area', () => {
  const app = setup();
  assert.equal(app.calls.length, 0);
  assert.ok(source.includes("btnLocate.addEventListener('click', detectUserGeolocation)"));
  assert.equal(source.split('getCurrentPosition(').length - 1, 1);
  assert.equal(source.split('detectUserGeolocation').length - 1, 4);
  assert.equal(source.split('onclick="detectUserGeolocation()"').length - 1, 2, 'existing GPS retry buttons also require direct clicks');
  app.click();
  assert.equal(app.calls.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(app.calls[0].options)), { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 });
  assert.equal(app.getElementById('btn-locate-me').disabled, true);
  app.calls[0].success(position);
  app.idle();
});

for (const browser of ['iPhone Safari', 'Android Chrome', 'Desktop Chrome']) {
  test(browser + ': permission allowed preserves coordinates and GPS search source', () => {
    const app = setup(browser);
    app.click();
    app.calls[0].success(position);
    assert.equal(app.results.length, 1);
    assert.equal(app.results[0][0], position.coords.latitude);
    assert.equal(app.results[0][1], position.coords.longitude);
    assert.equal(app.results[0][3], 'gps');
    assert.equal(app.errors.length, 0);
    app.idle();
  });
}

test('iPhone permission denied: no retry, settings/reload guidance and manual fallback', () => {
  const app = setup();
  app.click();
  app.calls[0].failure({ code: 1 });
  assert.equal(app.calls.length, 1);
  assert.match(app.errors[0], /permission was denied.*Safari settings.*Location Services.*reload.*search a UET bus stop/);
  app.idle();
  app.click();
  assert.equal(app.calls.length, 2, 'a later explicit action is permitted');
});

for (const [code, label, message] of [[2, 'Location Services disabled/unavailable', /location is unavailable/], [3, 'GPS timeout', /timed out/]]) {
  test(label + ': one retry only, then cleanup', () => {
    const app = setup();
    app.click();
    app.calls[0].failure({ code });
    assert.equal(app.calls.length, 2);
    app.click();
    assert.equal(app.calls.length, 2);
    app.calls[1].failure({ code });
    assert.equal(app.calls.length, 2);
    assert.match(app.errors[0], message);
    app.idle();
  });
}

test('weak/indoor GPS: retry can succeed with coarse coordinates', () => {
  const app = setup();
  app.click();
  app.calls[0].failure({ code: 2 });
  assert.equal(app.calls[1].options.enableHighAccuracy, false);
  app.calls[1].success(position);
  assert.equal(app.results.length, 1);
  app.idle();
});

test('multiple taps cannot start concurrent GPS requests even if another UI action enables button', () => {
  const app = setup();
  app.click();
  app.getElementById('btn-locate-me').disabled = false;
  for (let i = 0; i < 10; i++) app.click();
  assert.equal(app.calls.length, 1);
  app.calls[0].failure({ code: 3 });
  for (let i = 0; i < 10; i++) app.click();
  assert.equal(app.calls.length, 2);
  app.calls[1].failure({ code: 1 });
  assert.equal(app.calls.length, 2);
  app.idle();
});

test('unsupported geolocation is distinct and leaves manual search available', () => {
  const app = setup();
  delete app.context.navigator.geolocation;
  app.click();
  assert.equal(app.calls.length, 0);
  assert.match(app.errors[0], /not supported.*search a UET bus stop/);
  app.idle();
});

test('synchronous browser security failure also cleans up without retry', () => {
  const app = setup();
  app.context.navigator.geolocation.getCurrentPosition = () => { throw { name: 'SecurityError' }; };
  app.click();
  assert.match(app.errors[0], /permission was denied/);
  app.idle();
});
