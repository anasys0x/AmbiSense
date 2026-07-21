const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('les configurations et valeurs par défaut utilisent toutes le port 1234', () => {
    assert.match(read('.env.example'), /^PORT=1234$/m);
    assert.match(read('client/.env.example'), /^VITE_API_URL=http:\/\/localhost:1234$/m);
    assert.match(read('src/index.js'), /process\.env\.PORT \|\| 1234/);
    assert.match(read('src/bridge/bridge.js'), /process\.env\.PORT \|\| 1234/g);
    assert.match(read('client/src/services/api.js'), /http:\/\/localhost:1234/);
});
