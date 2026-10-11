const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function loadAuthApi() {
  const source = fs.readFileSync(path.join(process.cwd(), 'services/campaignApi.ts'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  new Function('module', 'exports', compiled)(module, module.exports);
  return module.exports;
}

test('cria conta e autentica sem incluir senha na URL ou na resposta', async () => {
  const calls = [];
  const api = loadAuthApi().createAuthApi({
    baseUrl: 'https://localhost:8000/',
    fetcher: async (url, options) => {
      calls.push({ url, options });
      return { ok: true, json: async () => ({ accessToken: 'test-token' }) };
    },
  });
  assert.deepEqual(await api.register('gm@example.com', 'Mestre', 'safe-password-123'), { accessToken: 'test-token' });
  assert.deepEqual(await api.login('gm@example.com', 'safe-password-123'), { accessToken: 'test-token' });
  assert.equal(calls[0].url, 'https://localhost:8000/auth/register');
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    email: 'gm@example.com', displayName: 'Mestre', password: 'safe-password-123',
  });
  assert.equal(calls[1].url, 'https://localhost:8000/auth/login');
  assert.deepEqual(JSON.parse(calls[1].options.body), { email: 'gm@example.com', password: 'safe-password-123' });
});

test('erro de autenticação não inclui corpo de resposta sensível', async () => {
  const api = loadAuthApi().createAuthApi({
    baseUrl: 'https://localhost:8000',
    fetcher: async () => ({ ok: false, status: 401, json: async () => ({ detail: 'secret' }) }),
  });
  await assert.rejects(api.login('gm@example.com', 'safe-password-123'), error =>
    error.status === 401 && !error.message.includes('secret'));
});
