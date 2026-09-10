const {test} = require('node:test');
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const path = require('node:path');
const {auditStopCoordinates, auditHasErrors} = require('../scripts/audit-stop-coordinates.cjs');
const base = {name:'Unlocated stop',lat:null,lng:null,coordinateStatus:'unverified',placeId:null,source:null,aliases:[]};
const audit = stop => auditStopCoordinates([{id:'test',routeNo:'Route 1',campusId:'ksk',stops:[stop]}]);
test('explicitly unavailable coordinates are reported but do not block deployment', () => {
  const report = audit(base);
  assert.equal(report.invalidCoordinates.length,1);
  assert.equal(report.unavailableCoordinates.length,1);
  assert.equal(auditHasErrors(report),false);
});
test('malformed, partial, missing, or verified-without-coordinates records remain fatal', () => {
  for (const changes of [{lat:undefined},{lng:74},{lat:''},{lat:'31',lng:74},
    {lat:NaN,lng:74},{lat:Infinity,lng:74},{lat:91,lng:74},{lat:31,lng:-181},
    {coordinateStatus:'verified',source:'source'},{aliases:null}]) {
    assert.equal(auditHasErrors(audit({...base,...changes})),true);
  }
  assert.equal(auditHasErrors(audit({...base,lat:31,lng:74})),false);
});
test('the exact Actions coordinate audit command succeeds with the official dataset', () => {
  const result=spawnSync(process.execPath,['scripts/audit-stop-coordinates.cjs'],
    {cwd:path.resolve(__dirname,'..'),encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  const report=JSON.parse(result.stdout);
  assert.equal(report.unavailableCoordinates,19);
  assert.equal(report.invalidCoordinates,19);
  assert.equal(report.invalidMetadata,0);
});
