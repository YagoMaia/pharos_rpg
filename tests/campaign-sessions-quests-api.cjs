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

test('gerencia sessões de campanha: listar, criar, editar e excluir', async () => {
  const calls = [];
  const api = loadCampaignApi().createCampaignApi({
    baseUrl: 'http://localhost:8000',
    getAccessToken: () => 'valid-token',
    fetcher: async (url, options) => {
      calls.push({ url, options });
      if (options?.method === 'POST') {
        return fakeResponse({ id: 's1', sessionNumber: 1, title: 'Sessão 1', status: 'planned' }, 201);
      }
      if (options?.method === 'PUT') {
        return fakeResponse({ id: 's1', sessionNumber: 1, title: 'Sessão 1', status: 'completed' }, 200);
      }
      if (options?.method === 'DELETE') {
        return fakeResponse(undefined, 204);
      }
      return fakeResponse([{ id: 's1', sessionNumber: 1, title: 'Sessão 1' }]);
    },
  });

  const list = await api.listSessions('camp-1');
  assert.equal(list.length, 1);
  assert.equal(calls[0].url, 'http://localhost:8000/campaigns/camp-1/sessions');

  const created = await api.createSession('camp-1', {
    sessionNumber: 1,
    title: 'Sessão 1',
    status: 'planned',
  });
  assert.equal(created.id, 's1');
  assert.equal(calls[1].options.method, 'POST');
  assert.equal(JSON.parse(calls[1].options.body).title, 'Sessão 1');

  const updated = await api.updateSession('camp-1', 's1', {
    sessionNumber: 1,
    title: 'Sessão 1',
    status: 'completed',
  });
  assert.equal(updated.status, 'completed');
  assert.equal(calls[2].options.method, 'PUT');

  await api.deleteSession('camp-1', 's1');
  assert.equal(calls[3].options.method, 'DELETE');
});

test('gerencia missões (quests) da campanha: listar, criar, editar e excluir', async () => {
  const calls = [];
  const api = loadCampaignApi().createCampaignApi({
    baseUrl: 'http://localhost:8000',
    getAccessToken: () => 'valid-token',
    fetcher: async (url, options) => {
      calls.push({ url, options });
      if (options?.method === 'POST') {
        return fakeResponse({ id: 'q1', title: 'Resgate', visibility: 'party', status: 'active' }, 201);
      }
      if (options?.method === 'PUT') {
        return fakeResponse({ id: 'q1', title: 'Resgate', visibility: 'party', status: 'completed' }, 200);
      }
      if (options?.method === 'DELETE') {
        return fakeResponse(undefined, 204);
      }
      return fakeResponse([{ id: 'q1', title: 'Resgate' }]);
    },
  });

  const quests = await api.listQuests('camp-1');
  assert.equal(quests.length, 1);
  assert.equal(calls[0].url, 'http://localhost:8000/campaigns/camp-1/quests');

  const created = await api.createQuest('camp-1', {
    title: 'Resgate',
    description: 'Salvar o aldeão',
    visibility: 'party',
    status: 'active',
  });
  assert.equal(created.id, 'q1');
  assert.equal(calls[1].options.method, 'POST');

  const updated = await api.updateQuest('camp-1', 'q1', {
    title: 'Resgate',
    description: 'Salvo com sucesso',
    visibility: 'party',
    status: 'completed',
  });
  assert.equal(updated.status, 'completed');
  assert.equal(calls[2].options.method, 'PUT');

  await api.deleteQuest('camp-1', 'q1');
  assert.equal(calls[3].options.method, 'DELETE');
});

test('sincronização e inspeção de ficha completa de personagem', async () => {
  const calls = [];
  const api = loadCampaignApi().createCampaignApi({
    baseUrl: 'http://localhost:8000',
    getAccessToken: () => 'valid-token',
    fetcher: async (url, options) => {
      calls.push({ url, options });
      if (url.includes('/sheet') && (!options || options.method === 'GET')) {
        return fakeResponse({ characterId: 'c1', characterData: { name: 'Thorgar', level: 3 } });
      }
      return fakeResponse({ id: 'camp-1', name: 'Pharos', role: 'player', characterId: 'c1' });
    },
  });

  // Vincula com characterData
  await api.linkCharacter('camp-1', 'c1', { name: 'Thorgar', level: 3 });
  assert.equal(calls[0].url, 'http://localhost:8000/campaigns/camp-1/character');
  assert.equal(calls[0].options.method, 'PUT');
  const bodyLink = JSON.parse(calls[0].options.body);
  assert.equal(bodyLink.characterId, 'c1');
  assert.equal(bodyLink.characterData.name, 'Thorgar');

  // Sincroniza dados da ficha
  await api.syncCharacterSheet('camp-1', { name: 'Thorgar', level: 4 });
  assert.equal(calls[1].url, 'http://localhost:8000/campaigns/camp-1/character/sheet');
  assert.equal(calls[1].options.method, 'PUT');
  assert.equal(JSON.parse(calls[1].options.body).characterData.level, 4);

  // Inspeciona ficha do membro
  const sheet = await api.getMemberSheet('camp-1', 'user-gabriel');
  assert.equal(sheet.characterId, 'c1');
  assert.equal(sheet.characterData.name, 'Thorgar');
  assert.equal(calls[2].url, 'http://localhost:8000/campaigns/camp-1/members/user-gabriel/sheet');
});
