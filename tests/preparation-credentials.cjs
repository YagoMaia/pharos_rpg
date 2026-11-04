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

class FakePreparationServer {
  calls = [];
  fetch = async (url, options) => {
    this.calls.push({ url, ...options });
    return { ok: true, status: 200, json: async () => ({ items: [] }) };
  };
}

test('credenciais usam sessão, campanha codificada e métodos REST corretos', async () => {
  const server = new FakePreparationServer();
  const client = loadCampaignApi().createCampaignApi({
    baseUrl: 'https://example.org', getAccessToken: () => 'gm-session', fetcher: server.fetch,
  });
  await client.listPreparationTokens('mesa/um');
  await client.issuePreparationToken('mesa/um', '  Agente  ');
  await client.revokePreparationToken('mesa/um', 'id/um');
  assert.deepEqual(server.calls.map(c => [c.method, c.url]), [
    ['GET', 'https://example.org/campaigns/mesa%2Fum/preparation/tokens'],
    ['POST', 'https://example.org/campaigns/mesa%2Fum/preparation/tokens'],
    ['DELETE', 'https://example.org/campaigns/mesa%2Fum/preparation/tokens/id%2Fum'],
  ]);
  assert.deepEqual(JSON.parse(server.calls[1].body), { label: 'Agente' });
  assert.ok(server.calls.every(c => c.headers.Authorization === 'Bearer gm-session'));
});

test('rótulo opcional é limitado e identificadores vazios são recusados', async () => {
  const server = new FakePreparationServer();
  const client = loadCampaignApi().createCampaignApi({
    baseUrl: 'https://example.org', getAccessToken: () => 'session', fetcher: server.fetch,
  });
  await client.issuePreparationToken('mesa', '');
  assert.deepEqual(JSON.parse(server.calls[0].body), { label: '' });
  assert.throws(() => client.issuePreparationToken('mesa', 'x'.repeat(81)), /80/);
  assert.throws(() => client.revokePreparationToken('mesa', '  '), /ID/);
});

test('falhas da API não expõem dados de resposta ou token da sessão', async () => {
  const client = loadCampaignApi().createCampaignApi({
    baseUrl: 'https://example.org', getAccessToken: () => 'session-secret',
    fetcher: async () => ({ ok: false, status: 403, json: async () => ({ detail: 'server-secret' }) }),
  });
  await assert.rejects(client.listPreparationTokens('mesa'), error =>
    error.status === 403 && !error.message.includes('secret'));
});

test('painel é montado só na aba e vinculado à campanha selecionada', () => {
  const workspace = fs.readFileSync(path.join(process.cwd(), 'components/campaign/CampaignWorkspace.tsx'), 'utf8');
  const screen = fs.readFileSync(path.join(process.cwd(), 'app/(gm)/campaigns.tsx'), 'utf8');
  const panel = fs.readFileSync(path.join(process.cwd(), 'components/campaign/PreparationCredentials.tsx'), 'utf8');
  assert.match(workspace, /tab === "preparation" && props\.preparationPanel/);
  assert.match(screen, /key=\{selected\.id\} campaignId=\{selected\.id\}/);
  assert.match(panel, /setPendingRevoke\(item\.id\)/);
  assert.match(panel, /Confirmar revogação/);
  assert.doesNotMatch(panel, /AsyncStorage|localStorage|SecureStore/);
});
