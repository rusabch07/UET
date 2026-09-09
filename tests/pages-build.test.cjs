const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');

test('Pages build deploys current bytes and automatically changes relative asset versions', () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'uet-pages-'));
  try {
    for (const dir of ['scripts', 'css', 'js', 'assets', '_site/js']) fs.mkdirSync(path.join(fixture, dir), { recursive: true });
    fs.copyFileSync(path.join(__dirname, '../scripts/build-pages.cjs'), path.join(fixture, 'scripts/build-pages.cjs'));
    const html = '<link rel="stylesheet" href="css/styles.css"><script src="js/data.js"></script><script src="js/shuttle.js"></script><script src="js/app.js"></script><script src="js/announcement.js"></script>';
    fs.writeFileSync(path.join(fixture, 'index.html'), html);
    const assets = ['css/styles.css', 'js/data.js', 'js/shuttle.js', 'js/app.js', 'js/announcement.js'];
    for (const asset of assets) fs.writeFileSync(path.join(fixture, asset), 'current ' + asset);
    fs.writeFileSync(path.join(fixture, '_site/js/app.js'), 'stale app');
    fs.writeFileSync(path.join(fixture, 'CNAME'), 'example.org');
    const build = () => {
      execFileSync(process.execPath, [path.join(fixture, 'scripts/build-pages.cjs')]);
      const output = fs.readFileSync(path.join(fixture, '_site/index.html'), 'utf8');
      for (const asset of assets) {
        const bytes = fs.readFileSync(path.join(fixture, asset));
        assert.deepEqual(fs.readFileSync(path.join(fixture, '_site', asset)), bytes);
        const version = createHash('sha256').update(bytes).digest('hex').slice(0, 16);
        assert.ok(output.includes('"' + asset + '?v=' + version + '"'));
        assert.equal(new URL(asset + '?v=' + version, 'https://example.github.io/UET/').pathname, '/UET/' + asset);
      }
      assert.equal(fs.readFileSync(path.join(fixture, 'index.html'), 'utf8'), html);
      assert.equal(fs.readFileSync(path.join(fixture, '_site/CNAME'), 'utf8'), 'example.org');
      return output;
    };
    const first = build();
    assert.equal(build(), first, 'unchanged content has stable URLs');
    fs.appendFileSync(path.join(fixture, 'js/app.js'), '\nnew release');
    assert.notEqual(build(), first, 'changed content gets a new URL');
  } finally {
    const relative = path.relative(path.resolve(os.tmpdir()), path.resolve(fixture));
    assert.ok(relative.startsWith('uet-pages-') && !relative.includes(path.sep), 'cleanup stays in the temporary fixture');
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});
