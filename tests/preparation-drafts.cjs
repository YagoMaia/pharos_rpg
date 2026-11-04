const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(file) {
  const source = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  new Function('module', 'exports', code)(module, module.exports);
  return module.exports;
}

class FakeServer {
  calls = [];
  fetch = async (url, options) => {
    this.calls.push({ url, ...options });
    return { ok: true, status: 200, json: async () => ({ items: [], nextCursor: null }) };
  };
}

test('consultas e aplicação usam campanha, cursor, revisão e chave explícitos', async () => {
  const server = new FakeServer();
  const api = load('services/campaignApi.ts').createCampaignApi({
    baseUrl: 'https://example.org', getAccessToken: () => 'session', fetcher: server.fetch,
  });
  await api.listPreparationDrafts('mesa/1', 'cursor+1');
  await api.readPreparationDraft('mesa/1', 'draft/1');
  await api.readPreparationSource('mesa/1', 'source/1', 2);
  await api.applyPreparationDraft('mesa/1', 'draft/1', {
    expectedRevision: 3, idempotencyKey: 'draft-key', acknowledgePlayerVisibility: false,
  });
  assert.deepEqual(server.calls.map(c => [c.method, c.url]), [
    ['GET', 'https://example.org/campaigns/mesa%2F1/preparation/drafts?limit=100&cursor=cursor%2B1'],
    ['GET', 'https://example.org/campaigns/mesa%2F1/preparation/drafts/draft%2F1'],
    ['GET', 'https://example.org/campaigns/mesa%2F1/preparation/sources/source%2F1/revisions/2'],
    ['POST', 'https://example.org/campaigns/mesa%2F1/preparation/drafts/draft%2F1/apply'],
  ]);
  assert.deepEqual(JSON.parse(server.calls[3].body), {
    expectedRevision: 3, idempotencyKey: 'draft-key', acknowledgePlayerVisibility: false,
  });
  assert.ok(server.calls.every(call => call.headers.Authorization === 'Bearer session'));
});

test('aviso para jogadores segue os quatro tipos e não confunde encontro privado', () => {
  const { requiresPlayerAcknowledgement } = load('services/draftReview.ts');
  assert.equal(requiresPlayerAcknowledgement({ kind: 'session', summary: 'aconteceu' }), true);
  assert.equal(requiresPlayerAcknowledgement({ kind: 'session', summary: '' }), false);
  assert.equal(requiresPlayerAcknowledgement({ kind: 'npc', visibility: 'party' }), true);
  assert.equal(requiresPlayerAcknowledgement({ kind: 'quest', visibility: 'party' }), true);
  assert.equal(requiresPlayerAcknowledgement({ kind: 'npc', visibility: 'gm' }), false);
  assert.equal(requiresPlayerAcknowledgement({ kind: 'encounter' }), false);
});

test('constrói pedido estável e não permite publicar sem confirmação explícita', () => {
  const { buildDraftApplication } = load('services/draftReview.ts');
  const draft = { id: 'a-123', revision: 4, payload: { kind: 'session', summary: 'público' } };
  assert.throws(() => buildDraftApplication(draft, false), /jogadores/);
  const first = buildDraftApplication(draft, true);
  assert.deepEqual(first, buildDraftApplication(draft, true));
  assert.equal(first.expectedRevision, 4);
  assert.equal(first.acknowledgePlayerVisibility, true);
  assert.notEqual(first.idempotencyKey, buildDraftApplication({ ...draft, revision: 5 }, true).idempotencyKey);
  assert.throws(() => buildDraftApplication({ ...draft, revision: 0 }, true), /revisão/);
});

test('conflito de revisão chega como 409 sem expor resposta sensível', async () => {
  const api = load('services/campaignApi.ts').createCampaignApi({
    baseUrl: 'https://example.org', getAccessToken: () => 'session',
    fetcher: async () => ({ ok: false, status: 409, json: async () => ({ detail: 'segredo' }) }),
  });
  await assert.rejects(api.applyPreparationDraft('mesa', 'draft', {
    expectedRevision: 1, idempotencyKey: 'review-1', acknowledgePlayerVisibility: false,
  }), error => error.status === 409 && !error.message.includes('segredo'));
});

test('a aba exige confirmação humana e impede reaplicar propostas já processadas', () => {
  const screen = fs.readFileSync(path.join(process.cwd(), 'components/campaign/PreparationDrafts.tsx'), 'utf8');
  const workspace = fs.readFileSync(path.join(process.cwd(), 'components/campaign/CampaignWorkspace.tsx'), 'utf8');
  assert.match(workspace, /tab === "drafts" && props\.draftsPanel/);
  assert.match(screen, /!confirming \|\| needsReload \|\| draft\.application/);
  assert.match(screen, /requiresPlayerAcknowledgement\(draft\.payload\) && !acknowledged/);
  assert.match(screen, /buildDraftApplication\(draft, acknowledged\)/);
});

test('a fonte selecionada pode ser recolhida pelo mesmo botão', () => {
  const screen = fs.readFileSync(path.join(process.cwd(), 'components/campaign/PreparationDrafts.tsx'), 'utf8');
  assert.match(screen, /source\?\.sourceId === ref\.sourceId && source\.revision === ref\.revision/);
  assert.match(screen, /if \(isOpen\) return/);
  assert.match(screen, /"Ocultar" : "Ver"/);
  assert.match(screen, /expanded=/);
});
