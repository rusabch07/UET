// Static build: local stop search and Maps directions do not require an API key.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const output = path.join(root, '_site');
fs.mkdirSync(output, { recursive: true });
for (const entry of ['index.html', 'css', 'js', 'assets']) {
  fs.cpSync(path.join(root, entry), path.join(output, entry), { recursive: true });
}
if (fs.existsSync(path.join(root, 'CNAME'))) fs.copyFileSync(path.join(root, 'CNAME'), path.join(output, 'CNAME'));
// Remove only the obsolete generated key file from previous local builds.
const oldConfig = path.join(output, 'js', 'config.js');
if (fs.existsSync(oldConfig)) fs.unlinkSync(oldConfig);
fs.writeFileSync(path.join(output, '.nojekyll'), '');
// Version deployed assets by their actual bytes; keep project-relative Pages URLs.
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const asset of ['css/styles.css', 'js/data.js', 'js/shuttle.js', 'js/app.js', 'js/announcement.js']) {
  const version = createHash('sha256').update(fs.readFileSync(path.join(output, asset))).digest('hex').slice(0, 16);
  const attribute = asset.endsWith('.css') ? 'href' : 'src';
  const original = attribute + '="' + asset + '"';
  if (html.split(original).length !== 2) throw new Error('Expected one local asset reference: ' + asset);
  html = html.replace(original, attribute + '="' + asset + '?v=' + version + '"');
}
fs.writeFileSync(path.join(output, 'index.html'), html);
