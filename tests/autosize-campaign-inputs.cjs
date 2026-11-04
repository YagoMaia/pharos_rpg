const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function loadHeight() {
  const source = fs.readFileSync(path.join(process.cwd(), 'services/campaignTextHeight.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('module', 'exports', code)(module, module.exports);
  return module.exports;
}

test('altura respeita o mínimo, expande e volta a diminuir', () => {
  const { campaignTextHeight } = loadHeight();
  assert.equal(campaignTextHeight(40, 60), 60);
  assert.equal(campaignTextHeight(212.2, 60), 213);
  assert.equal(campaignTextHeight(80, 60), 80);
  assert.equal(campaignTextHeight(NaN, 60), 60);
});

test('todos os formulários longos do mestre usam o campo expansível', () => {
  const forms = ['CampaignNpcList.tsx', 'CampaignSessions.tsx', 'CampaignQuests.tsx', 'CampaignEncounters.tsx', 'CampaignJournal.tsx'];
  for (const name of forms) {
    const source = fs.readFileSync(path.join(process.cwd(), 'components/campaign', name), 'utf8');
    assert.match(source, /<AutoGrowingTextInput/, name);
  }
});
