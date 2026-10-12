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

test('gerencia encontros de campanha e lançamento no combate', async () => {
  const calls = [];
  const api = loadCampaignApi().createCampaignApi({
    baseUrl: 'http://localhost:8000',
    getAccessToken: () => 'valid-token',
    fetcher: async (url, options) => {
      calls.push({ url, options });
      if (url.endsWith('/launch') && options?.method === 'POST') {
        return fakeResponse({ status: 'launched', encounterId: 'enc-1', combatantsAdded: 3 });
      }
      if (options?.method === 'POST') {
        return fakeResponse({
          id: 'enc-1',
          name: 'Emboscada dos Goblins',
          status: 'planned',
          monstersData: [{ name: 'Goblin', count: 3, hp: 10, ac: 12 }],
        }, 201);
      }
      if (options?.method === 'PUT') {
        return fakeResponse({
          id: 'enc-1',
          name: 'Emboscada dos Goblins',
          status: 'ready',
          monstersData: [{ name: 'Goblin', count: 3, hp: 10, ac: 12 }],
        }, 200);
      }
      if (options?.method === 'DELETE') {
        return fakeResponse(undefined, 204);
      }
      return fakeResponse([{ id: 'enc-1', name: 'Emboscada dos Goblins', status: 'planned' }]);
    },
  });

  // 1. Listar
  const list = await api.listEncounters('camp-1');
  assert.equal(list.length, 1);
  assert.equal(calls[0].url, 'http://localhost:8000/campaigns/camp-1/encounters');

  // 2. Criar
  const created = await api.createEncounter('camp-1', {
    name: 'Emboscada dos Goblins',
    status: 'planned',
    monstersData: [{ name: 'Goblin', count: 3, hp: 10, ac: 12 }],
  });
  assert.equal(created.id, 'enc-1');
  assert.equal(calls[1].options.method, 'POST');
  assert.equal(JSON.parse(calls[1].options.body).name, 'Emboscada dos Goblins');

  // 3. Atualizar
  const updated = await api.updateEncounter('camp-1', 'enc-1', {
    name: 'Emboscada dos Goblins',
    status: 'ready',
    monstersData: [{ name: 'Goblin', count: 3, hp: 10, ac: 12 }],
  });
  assert.equal(updated.status, 'ready');
  assert.equal(calls[2].options.method, 'PUT');

  // 4. Lançar no combate
  const launched = await api.launchEncounter('camp-1', 'enc-1');
  assert.equal(launched.status, 'launched');
  assert.equal(launched.combatantsAdded, 3);
  assert.equal(calls[3].url, 'http://localhost:8000/campaigns/camp-1/encounters/enc-1/launch');
  assert.equal(calls[3].options.method, 'POST');

  // 5. Excluir
  await api.deleteEncounter('camp-1', 'enc-1');
  assert.equal(calls[4].options.method, 'DELETE');
});

test('gerencia dossiê de NPCs da campanha: listar, criar, editar e excluir', async () => {
  const calls = [];
  const api = loadCampaignApi().createCampaignApi({
    baseUrl: 'http://localhost:8000',
    getAccessToken: () => 'valid-token',
    fetcher: async (url, options) => {
      calls.push({ url, options });
      if (options?.method === 'POST') {
        return fakeResponse({
          id: 'npc-1',
          name: 'Valerius',
          role: 'Escriba',
          attitude: 'neutral',
          visibility: 'gm',
          gmNotes: 'Segredo mortal',
        }, 201);
      }
      if (options?.method === 'PUT') {
        return fakeResponse({
          id: 'npc-1',
          name: 'Valerius',
          role: 'Escriba',
          attitude: 'friendly',
          visibility: 'party',
        }, 200);
      }
      if (options?.method === 'DELETE') {
        return fakeResponse(undefined, 204);
      }
      return fakeResponse([
        { id: 'npc-1', name: 'Valerius', role: 'Escriba', attitude: 'neutral', visibility: 'party' },
      ]);
    },
  });

  // 1. Listar
  const npcs = await api.listNpcs('camp-1');
  assert.equal(npcs.length, 1);
  assert.equal(calls[0].url, 'http://localhost:8000/campaigns/camp-1/npcs');

  // 2. Criar
  const created = await api.createNpc('camp-1', {
    name: 'Valerius',
    role: 'Escriba',
    attitude: 'neutral',
    visibility: 'gm',
    gmNotes: 'Segredo mortal',
  });
  assert.equal(created.id, 'npc-1');
  assert.equal(created.gmNotes, 'Segredo mortal');
  assert.equal(calls[1].options.method, 'POST');

  // 3. Editar / Revelar para party
  const updated = await api.updateNpc('camp-1', 'npc-1', {
    name: 'Valerius',
    role: 'Escriba',
    attitude: 'friendly',
    visibility: 'party',
  });
  assert.equal(updated.visibility, 'party');
  assert.equal(calls[2].options.method, 'PUT');

  // 4. Excluir
  await api.deleteNpc('camp-1', 'npc-1');
  assert.equal(calls[3].options.method, 'DELETE');
});
