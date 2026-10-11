const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function socketHelpers() {
  const source = fs.readFileSync(path.join(process.cwd(), 'utils/campaignSocket.ts'), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  new Function('module', 'exports', code)(module, module.exports);
  return module.exports;
}

test('URL da sala usa WSS remoto e nunca contém o token', () => {
  const { campaignSocketUrl, campaignAuthMessage } = socketHelpers();
  const url = campaignSocketUrl('https://example.org/api', 'camp-id');
  assert.equal(url, 'wss://example.org/ws/campaign-camp-id');
  assert.equal(campaignSocketUrl('http://localhost:8000', 'camp-id'),
    'ws://localhost:8000/ws/campaign-camp-id');
  assert.ok(!url.includes('private-token'));
  assert.deepEqual(campaignAuthMessage('private-token'), {
    type: 'AUTH_CAMPAIGN', payload: { token: 'private-token' },
  });
});

test('WS de campanha recusa transporte HTTP remoto', () => {
  const { campaignSocketUrl } = socketHelpers();
  assert.throws(() => campaignSocketUrl('http://192.168.0.5:8000', 'x'), /HTTPS/);
});
