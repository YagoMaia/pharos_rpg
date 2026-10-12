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

test('gerencia biblioteca de templates de NPCs e sincronização em lote', async () => {
  const calls = [];
  const api = loadCampaignApi().createCampaignApi({
    baseUrl: 'http://localhost:8000',
    getAccessToken: () => 'valid-token',
    fetcher: async (url, options) => {
      calls.push({ url, options });
      if (url.endsWith('/npc-library/sync') && options?.method === 'POST') {
        const payload = JSON.parse(options.body);
        return fakeResponse(payload.templates.map((t, idx) => ({
          id: t.id || `tpl-${idx}`,
          name: t.name,
          level: t.level || 1,
          templateData: t.templateData || {},
          updatedAt: t.updatedAt || '2026-10-12T10:00:00Z',
        })));
      }
      if (options?.method === 'POST') {
        const body = JSON.parse(options.body);
        return fakeResponse({
          id: 'tpl-1',
          name: body.name,
          level: body.level || 1,
          templateData: body.templateData || {},
        }, 201);
      }
      if (options?.method === 'PUT') {
        const body = JSON.parse(options.body);
        return fakeResponse({
          id: 'tpl-1',
          name: body.name,
          level: body.level || 1,
          templateData: body.templateData || {},
        }, 200);
      }
      if (options?.method === 'DELETE') {
        return fakeResponse(undefined, 204);
      }
      return fakeResponse([{ id: 'tpl-1', name: 'Goblin Ladino', level: 2, templateData: { maxHp: 18 } }]);
    },
  });

  // 1. Listar
  const list = await api.listNpcTemplates();
  assert.equal(list.length, 1);
  assert.equal(calls[0].url, 'http://localhost:8000/npc-library');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer valid-token');

  // 2. Criar
  const created = await api.createNpcTemplate({
    name: 'Goblin Ladino',
    level: 2,
    templateData: { maxHp: 18, armorClass: 14 },
  });
  assert.equal(created.id, 'tpl-1');
  assert.equal(calls[1].url, 'http://localhost:8000/npc-library');
  assert.equal(calls[1].options.method, 'POST');

  // 3. Atualizar
  const updated = await api.updateNpcTemplate('tpl-1', {
    name: 'Goblin Assassino',
    level: 3,
    templateData: { maxHp: 25, armorClass: 15 },
  });
  assert.equal(updated.name, 'Goblin Assassino');
  assert.equal(calls[2].url, 'http://localhost:8000/npc-library/tpl-1');
  assert.equal(calls[2].options.method, 'PUT');

  // 4. Excluir
  await api.deleteNpcTemplate('tpl-1');
  assert.equal(calls[3].url, 'http://localhost:8000/npc-library/tpl-1');
  assert.equal(calls[3].options.method, 'DELETE');

  // 5. Sincronização em lote
  const synced = await api.syncNpcTemplates([
    { id: 'mob-1', name: 'Orc Guerreiro', level: 3, templateData: { maxHp: 35 } },
    { id: 'mob-2', name: 'Xamã Troll', level: 5, templateData: { maxHp: 60 } },
  ]);
  assert.equal(synced.length, 2);
  assert.equal(calls[4].url, 'http://localhost:8000/npc-library/sync');
  assert.equal(calls[4].options.method, 'POST');
});
