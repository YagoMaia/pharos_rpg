const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function loadCampaignApi() {
  const source = fs.readFileSync(path.join(process.cwd(), 'services/campaignApi.ts'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  new Function('module', 'exports', compiled)(module, module.exports);
  return module.exports;
}

function fakeResponse(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

test('cria campanha com token e retorna dados sem expor credenciais no corpo', async () => {
  const calls = [];
  const api = loadCampaignApi().createCampaignApi({
    baseUrl: 'http://localhost:8000/',
    getAccessToken: async () => 'secret-token',
    fetcher: async (url, options) => {
      calls.push({ url, options });
      return fakeResponse({ id: 'campaign-1', name: 'Pharos', role: 'gm' }, 201);
    },
  });

  assert.deepEqual(await api.createCampaign('Pharos'), { id: 'campaign-1', name: 'Pharos', role: 'gm' });
  assert.equal(calls[0].url, 'http://localhost:8000/campaigns');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer secret-token');
  assert.equal(calls[0].options.body, JSON.stringify({ name: 'Pharos' }));
});

test('lista campanhas e codifica identificador ao consultar uma campanha', async () => {
  const calls = [];
  const api = loadCampaignApi().createCampaignApi({
    baseUrl: 'https://example.org/api',
    getAccessToken: () => 'token',
    fetcher: async (url) => {
      calls.push(url);
      return fakeResponse([]);
    },
  });
  assert.deepEqual(await api.listCampaigns(), []);
  await api.getCampaign('a/b');
  assert.deepEqual(calls, ['https://example.org/api/campaigns', 'https://example.org/api/campaigns/a%2Fb']);
});

test('entra via convite e vincula personagem sem enviar a ficha completa', async () => {
  const calls = [];
  const api = loadCampaignApi().createCampaignApi({
    baseUrl: 'https://example.org',
    getAccessToken: () => 'token',
    fetcher: async (url, options) => {
      calls.push({ url, options });
      return fakeResponse({ id: 'camp-1', name: 'Pharos', role: 'player' });
    },
  });
  await api.joinCampaign('ABCD');
  await api.linkCharacter('camp-1', 'hero-1');
  assert.equal(calls[0].url, 'https://example.org/campaigns/join');
  assert.equal(calls[0].options.body, JSON.stringify({ inviteCode: 'ABCD' }));
  assert.equal(calls[1].url, 'https://example.org/campaigns/camp-1/character');
  assert.equal(calls[1].options.body, JSON.stringify({ characterId: 'hero-1' }));
});

test('mestre pode solicitar convite com prazo definido pelo servidor', async () => {
  const calls = [];
  const api = loadCampaignApi().createCampaignApi({
    baseUrl: 'https://example.org',
    getAccessToken: () => 'token',
    fetcher: async (url, options) => {
      calls.push({ url, options });
      return fakeResponse({ code: 'ABCD', expiresAt: '2026-10-12T00:00:00Z' }, 201);
    },
  });
  assert.deepEqual(await api.createInvite('camp-1'), { code: 'ABCD', expiresAt: '2026-10-12T00:00:00Z' });
  assert.equal(calls[0].url, 'https://example.org/campaigns/camp-1/invites');
  assert.equal(calls[0].options.method, 'POST');
});

test('rejeita entrada inválida e ausência de autenticação antes de enviar dados', async () => {
  let requested = false;
  const api = loadCampaignApi().createCampaignApi({
    baseUrl: 'https://example.org',
    getAccessToken: () => '',
    fetcher: async () => { requested = true; return fakeResponse({}); },
  });
  assert.throws(() => api.createCampaign('  '), /nome/i);
  await assert.rejects(api.listCampaigns(), /autenticação/i);
  assert.equal(requested, false);
});

test('retorna erro de API sem incluir resposta ou token na mensagem', async () => {
  const api = loadCampaignApi().createCampaignApi({
    baseUrl: 'https://example.org',
    getAccessToken: () => 'very-secret',
    fetcher: async () => fakeResponse({ detail: 'very-secret' }, 403),
  });
  await assert.rejects(api.listCampaigns(), error =>
    error.status === 403 && !error.message.includes('very-secret'));
});

test('diário usa contrato autenticado para listar, criar e editar notas', async () => {
  const calls = [];
  const entry = { id: 'entry-1', title: 'Resumo', body: 'A cidade', visibility: 'party',
    createdAt: '2026-10-11T00:00:00Z', updatedAt: '2026-10-11T00:00:00Z' };
  const api = loadCampaignApi().createCampaignApi({
    baseUrl: 'https://example.org',
    getAccessToken: () => 'token',
    fetcher: async (url, options) => {
      calls.push({ url, options });
      return fakeResponse(options.method === 'GET' ? [entry] : entry);
    },
  });
  assert.deepEqual(await api.listEntries('camp/1'), [entry]);
  assert.deepEqual(await api.createEntry('camp/1', {
    title: 'Resumo', body: 'A cidade', visibility: 'party',
  }), entry);
  assert.deepEqual(await api.updateEntry('camp/1', 'entry/1', {
    title: 'Resumo', body: 'A cidade', visibility: 'party',
  }), entry);
  assert.deepEqual(calls.map(call => call.url), [
    'https://example.org/campaigns/camp%2F1/entries',
    'https://example.org/campaigns/camp%2F1/entries',
    'https://example.org/campaigns/camp%2F1/entries/entry%2F1',
  ]);
  assert.deepEqual(calls.map(call => call.options.method), ['GET', 'POST', 'PUT']);
  assert.equal(calls[2].options.headers.Authorization, 'Bearer token');
});
