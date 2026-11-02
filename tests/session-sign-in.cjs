const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const TS_OPTIONS = {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
};

function compile(file) {
  const source = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
  return ts.transpileModule(source, TS_OPTIONS).outputText;
}

function loadModule(file, requireShim) {
  const module = { exports: {} };
  new Function('module', 'exports', 'require', compile(file))(module, module.exports, requireShim);
  return module.exports;
}

/** Carrega sessionSignIn com o createAuthApi real, mas com fetcher fake. */
function loadSignIn(fetcher) {
  const campaignApi = loadModule('services/campaignApi.ts', () => {
    throw new Error('campaignApi não deveria importar nada');
  });
  return loadModule('services/sessionSignIn.ts', (id) => {
    assert.equal(id, '@/services/campaignApi');
    return { createAuthApi: (options) => campaignApi.createAuthApi({ ...options, fetcher }) };
  });
}

const okToken = (token) => async () => ({ ok: true, json: async () => ({ accessToken: token }) });

test('conta: login envia e-mail e senha no corpo e devolve a sessão do app', async () => {
  const calls = [];
  const { signIn } = loadSignIn(async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => ({ accessToken: 'test-token' }) };
  });

  const session = await signIn('https://example.org/', {
    kind: 'account', action: 'login', email: 'gm@example.com', password: 'safe-password-123',
  }, 'gm');

  assert.deepEqual(session, { baseUrl: 'https://example.org/', token: 'test-token', role: 'gm' });
  assert.equal(calls[0].url, 'https://example.org/auth/login');
  assert.deepEqual(JSON.parse(calls[0].options.body), { email: 'gm@example.com', password: 'safe-password-123' });
  assert.ok(!calls[0].url.includes('safe-password-123'), 'senha não pode aparecer na URL');
});

test('conta: registro envia nome de exibição e cai na mesma sessão', async () => {
  const calls = [];
  const { signIn } = loadSignIn(async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => ({ accessToken: 'novo-token' }) };
  });

  const session = await signIn('https://example.org', {
    kind: 'account', action: 'register', email: 'gm@example.com', password: 'safe-password-123',
    displayName: '  Mestre  ',
  }, 'gm');

  assert.equal(session.token, 'novo-token');
  assert.equal(calls[0].url, 'https://example.org/auth/register');
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    email: 'gm@example.com', displayName: 'Mestre', password: 'safe-password-123',
  });
});

test('conta: registro sem nome de exibição usa o próprio e-mail', async () => {
  const calls = [];
  const { signIn } = loadSignIn(async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => ({ accessToken: 'novo-token' }) };
  });

  await signIn('https://example.org', {
    kind: 'account', action: 'register', email: 'gm@example.com', password: 'safe-password-123',
    displayName: '   ',
  }, 'gm');

  assert.equal(JSON.parse(calls[0].options.body).displayName, 'gm@example.com');
});

test('mesa: o caminho de nome e PIN continua o mesmo de antes', async () => {
  const calls = [];
  const { signIn } = loadSignIn(async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => ({ accessToken: 'mesa-token' }) };
  });

  const session = await signIn('https://example.org', { kind: 'table', name: 'Victor', pin: 'victor' }, 'gm');

  assert.equal(session.token, 'mesa-token');
  assert.equal(calls[0].url, 'https://example.org/auth/table-login');
  assert.deepEqual(JSON.parse(calls[0].options.body), { name: 'Victor', pin: 'victor' });
});

test('credencial errada falha com status e sem vazar o corpo da resposta', async () => {
  const { signIn } = loadSignIn(async () => ({
    ok: false, status: 401, json: async () => ({ detail: 'segredo-interno' }),
  }));

  await assert.rejects(
    signIn('https://example.org', {
      kind: 'account', action: 'login', email: 'gm@example.com', password: 'safe-password-123',
    }, 'gm'),
    (error) => error.status === 401 && !String(error.message).includes('segredo-interno'),
  );
});

test('HTTP para host público é recusado antes de qualquer requisição', async () => {
  let fetched = 0;
  const { signIn } = loadSignIn(async () => { fetched += 1; return { ok: true, json: async () => ({}) }; });

  await assert.rejects(signIn('http://example.org:8000', {
    kind: 'account', action: 'login', email: 'gm@example.com', password: 'safe-password-123',
  }, 'gm'), /HTTPS/);
  assert.equal(fetched, 0);
});

test('painel do mestre oferece mesa e conta sem trocar uma pela outra', () => {
  const panel = fs.readFileSync(path.join(process.cwd(), 'components/campaign/GmSignInPanel.tsx'), 'utf8');
  assert.match(panel, /AccountAuthForm/);
  assert.match(panel, /CampaignAuthForm/);
  assert.match(panel, /accessibilityRole="tab"/);

  const accountForm = fs.readFileSync(path.join(process.cwd(), 'components/campaign/AccountAuthForm.tsx'), 'utf8');
  assert.match(accountForm, /accessibilityLabel="E-mail"/);
  assert.match(accountForm, /accessibilityLabel="Senha"/);
  assert.match(accountForm, /secureTextEntry/);
  assert.doesNotMatch(accountForm, /tableNamesForRole/, 'conta não usa a lista fixa da mesa');

  const tableForm = fs.readFileSync(path.join(process.cwd(), 'components/campaign/CampaignAuthForm.tsx'), 'utf8');
  assert.match(tableForm, /tableNamesForRole\(role\)/);
});
