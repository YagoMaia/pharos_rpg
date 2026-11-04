const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const ts = require('typescript');

function loadConversion() {
  const source = fs.readFileSync('services/encounterBestiary.ts', 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('module', 'exports', code)(module, module.exports);
  return module.exports;
}

test('copia ficha e usa os valores de combate calculados, sem alterar a biblioteca', () => {
  const { bestiaryEncounterMonster } = loadConversion();
  const npc = { id: 'wolf', name: 'Lobo', maxHp: 25, initiativeBonus: 0, phases: [{ name: 'Fase 2' }], attributes: { Destreza: { modifier: 3 } }, spells: ['magia'] };
  const combatant = { armorClass: 17, attributes: npc.attributes, weapons: { melee: { name: 'Mordida' } }, skills: ['percepção'], stances: ['defesa'] };
  const monster = bestiaryEncounterMonster(npc, 3, combatant);
  assert.equal(monster.count, 3);
  assert.equal(monster.hp, 25);
  assert.equal(monster.ac, 17);
  assert.equal(monster.initiativeBonus, 0);
  assert.deepEqual(monster.weapons, combatant.weapons);
  assert.deepEqual(monster.skills, combatant.skills);
  assert.deepEqual(monster.stances, combatant.stances);
  assert.deepEqual(monster.bestiarySnapshot, npc);
  monster.bestiarySnapshot.phases[0].name = 'Alterada';
  monster.attributes.Destreza.modifier = 9;
  assert.equal(npc.phases[0].name, 'Fase 2');
  assert.equal(npc.attributes.Destreza.modifier, 3);
});

test('quantidade deve ser um inteiro positivo válido', () => {
  const { bestiaryCount } = loadConversion();
  assert.equal(bestiaryCount('3'), 3);
  for (const value of ['', '0', '-1', '1.5', '3x', '99999999999999999']) assert.equal(bestiaryCount(value), null);
});

test('editor mantém inclusão manual e prepara sem lançar combate', () => {
  const screen = fs.readFileSync('components/campaign/CampaignEncounters.tsx', 'utf8');
  const picker = fs.readFileSync('components/campaign/EncounterBestiaryPicker.tsx', 'utf8');
  assert.match(screen, /handleAddMonster/);
  assert.match(screen, /setMonsters\(encounter\.monstersData \|\| \[\]\)/);
  assert.match(screen, /<EncounterBestiaryPicker/);
  assert.match(picker, /bestiaryEncounterMonster/);
  assert.doesNotMatch(picker, /onLaunchEncounter|launchEncounter/);
  assert.match(picker, /Bestiário vazio/);
  assert.match(picker, /fases/i);
});
