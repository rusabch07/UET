const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

// Keep the Pages test glob dependency-free; browser coverage is in shuttle-browser.cjs.
test('all eight official shuttle columns retain their individual data', () => {
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
});
