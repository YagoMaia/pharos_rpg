const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

test('painel do mestre exibe apenas campanhas em que o usuário é mestre', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'services/campaignView.ts'), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  new Function('module', 'exports', code)(module, module.exports);
  const { masterCampaigns } = module.exports;
  const campaigns = [
    { id: '1', name: 'Mestrada', role: 'gm' },
    { id: '2', name: 'Jogada', role: 'player' },
  ];
  assert.deepEqual(masterCampaigns(campaigns), [campaigns[0]]);
  assert.deepEqual(campaigns.map(item => item.id), ['1', '2']);
});
