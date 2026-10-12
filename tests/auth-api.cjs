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

test('permite HTTP em redes locais e privadas e exige HTTPS em endereços públicos', () => {
  const { createAuthApi } = loadAuthApi();
  assert.doesNotThrow(() => createAuthApi({ baseUrl: 'http://localhost:8000' }));
  assert.doesNotThrow(() => createAuthApi({ baseUrl: 'http://127.0.0.1:8000' }));
  assert.doesNotThrow(() => createAuthApi({ baseUrl: 'http://192.168.1.10:8000' }));
  assert.doesNotThrow(() => createAuthApi({ baseUrl: 'http://10.0.0.1:8000' }));
  assert.doesNotThrow(() => createAuthApi({ baseUrl: 'http://172.20.0.5:8000' }));
  assert.doesNotThrow(() => createAuthApi({ baseUrl: 'http://100.64.1.2:8000' }));
  assert.doesNotThrow(() => createAuthApi({ baseUrl: 'http://mesa.local:8000' }));

  assert.throws(() => createAuthApi({ baseUrl: 'http://example.org:8000' }), /HTTPS/);
  assert.throws(() => createAuthApi({ baseUrl: 'http://8.8.8.8:8000' }), /HTTPS/);
  assert.throws(() => createAuthApi({ baseUrl: 'http://203.0.113.10:8000' }), /HTTPS/);
});

test('formulário usa lista de nomes e PIN em vez de email e senha', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'components/campaign/CampaignAuthForm.tsx'), 'utf8');
  assert.match(source, /tableNamesForRole\(role\)/);
  assert.match(source, /accessibilityLabel="PIN"/);
  assert.doesNotMatch(source, /accessibilityLabel="Email"/);
});

test('login da mesa envia só nome e PIN no corpo HTTPS', async () => {
  const calls = [];
  const api = loadAuthApi().createAuthApi({
    baseUrl: 'https://example.org',
    fetcher: async (url, options) => {
      calls.push({ url, options });
      return { ok: true, json: async () => ({ accessToken: 'test-token' }) };
    },
  });
  assert.deepEqual(await api.tableLogin('Gabriel', 'gabriel'), { accessToken: 'test-token' });
  assert.equal(calls[0].url, 'https://example.org/auth/table-login');
  assert.deepEqual(JSON.parse(calls[0].options.body), { name: 'Gabriel', pin: 'gabriel' });
  assert.ok(!calls[0].url.includes('gabriel'));
});

test('lista da mesa separa o mestre dos jogadores', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'services/tableRoster.ts'), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  new Function('module', 'exports', code)(module, module.exports);
  assert.deepEqual(module.exports.tableNamesForRole('gm'), ['Victor']);
  assert.deepEqual(module.exports.tableNamesForRole('player'),
    ['Gabriel', 'Leandro', 'Yago', 'Luiz', 'Amom', 'Wayne', 'Visitante']);
});
