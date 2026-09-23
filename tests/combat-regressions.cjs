const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Executa os módulos TS puros com o compilador já instalado no projeto.
const root = process.cwd();
const cache = new Map();
function load(file) {
  const resolved = path.resolve(root, file.endsWith('.ts') ? file : `${file}.ts`);
  if (cache.has(resolved)) return cache.get(resolved).exports;
  const module = { exports: {} };
  cache.set(resolved, module);
  const { outputText } = ts.transpileModule(fs.readFileSync(resolved, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const localRequire = (name) => name.startsWith('@/') ? load(name.slice(2)) :
    name.startsWith('.') ? load(path.resolve(path.dirname(resolved), name)) : require(name);
  new Function('require', 'module', 'exports', outputText)(localRequire, module, module.exports);
  return module.exports;
}

const { advanceCombatantPhase, advanceCombatTurn, stanceArmorBonus } = load('utils/combatRules');
const { playerToCombatant, mapPlayerToNpc, npcToCombatant } = load('utils/combatantFactory');
const { migrateSpecialization } = load('utils/specializationMigration');
const { SPECIALIZATIONS } = load('data/specializationsData');
const attributes = Object.fromEntries(['Força', 'Destreza', 'Constituição', 'Inteligência', 'Sabedoria', 'Carisma']
  .map(name => [name, { name, value: name === 'Constituição' ? 16 : 10, modifier: name === 'Constituição' ? 3 : 0 }]));
function sheet(spec) {
  return {
    name: 'Herói', class: 'Guerreiro', level: 5, attributes,
    stats: { hp: { current: 20, max: 20 }, focus: { current: 8, max: 10 } },
    specialization: spec, stances: spec?.newStances ?? [], currentStanceIndex: -1, skills: [], grimoire: [],
    equipment: { armor: { name: 'Placas', defense: 18 }, shield: { name: 'Escudo', defense: 2 },
      meleeWeapon: { name: 'Espada longa', damage: '1d8', stats: '' }, rangedWeapon: { name: 'Arco', damage: '1d6', range: '9m' } },
  };
}
function actor(id, overrides = {}) {
  return { ...playerToCombatant(sheet(null), 10), id, name: id, ...overrides };
}

function campaignCallback(name, dependencies) {
  const source = ts.createSourceFile('CampaignContext.tsx', fs.readFileSync(path.join(root, 'context/CampaignContext.tsx'), 'utf8'),
    ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let callback;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === name) callback = node.initializer.arguments[0];
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.ok(callback, `Callback ${name} encontrado`);
  const compiled = ts.transpileModule(`const callback = ${callback.getText(source)};`, {
    compilerOptions: { target: ts.ScriptTarget.ES2020 },
  }).outputText;
  return new Function(...Object.keys(dependencies), `${compiled}\nreturn callback;`)(...Object.values(dependencies));
}

test('inclusão offline preserva combatente preparado; atualização para zero e fim de combate funcionam', () => {
  let state = { combatants: [], activeTurnId: null };
  const setCombatants = (update) => { state.combatants = update(state.combatants); };
  const setCombatState = (update) => { state = typeof update === 'function' ? update(state) : update; };
  const dependencies = { setCombatants, setCombatState, npcToCombatant, playerToCombatant, addLog: () => {} };
  const npc = npcToCombatant({ ...mapPlayerToNpc(sheet(null)), phases: [{ maxHp: 60 }] }, 15);
  campaignCallback('addCombatant', dependencies)(npc.name, npc.hp.max, 15, 'npc', npc);
  assert.deepEqual(state.combatants[0].phases, [{ maxHp: 60 }]);
  assert.deepEqual(state.combatants[0].weapons, npc.weapons);
  campaignCallback('updateCombatant', dependencies)(npc.id, 'hp', 0);
  assert.equal(state.combatants[0].hp.current, 0);
  state.combatants.push(actor('player'));
  state.activeTurnId = npc.id;
  campaignCallback('endCombat', dependencies)();
  assert.deepEqual(state.combatants.map(c => c.id), ['player']);
  assert.equal(state.activeTurnId, null);
});

test('fichas legadas convertem e migram sem perder regras retiradas do catálogo', () => {
  for (const [id, expected] of [['corsario_espada', 'cor_espada'], ['corsario_bacamarte', 'cor_bacamarte']]) {
    const char = sheet({ id, proficiencyChanges: 'Regra antiga', newStances: [{ id: 'antiga' }] });
    const migrated = migrateSpecialization(char);
    assert.equal(migrated.specialization.id, expected);
    assert.equal(migrated.stances[0].id, SPECIALIZATIONS[expected].newStances[0].id);
    assert.doesNotThrow(() => playerToCombatant(char, 10));
    assert.doesNotThrow(() => mapPlayerToNpc(char));
    assert.deepEqual(migrateSpecialization(migrated), migrated);
  }
  const removed = migrateSpecialization(sheet({ id: 'mago_alquimista', proficiencyChanges: 'Poções antigas' }));
  assert.equal(removed.specialization.id, 'mago_alquimista');
  assert.equal(removed.specialization.proficiencyChanges[0].description, 'Poções antigas');
});

test('passivas de armadura e espada/escudo são iguais no jogador e no bestiário', () => {
  const armored = sheet(SPECIALIZATIONS.gue_encouracado);
  armored.equipment.shield.defense = 0;
  assert.equal(playerToCombatant(armored, 10).armorClass, 19);
  assert.equal(mapPlayerToNpc(armored).armorClass, 19);
  const sword = sheet(SPECIALIZATIONS.gue_espada_escudo);
  assert.equal(playerToCombatant(sword, 10).armorClass, 21);
  assert.equal(mapPlayerToNpc(sword).armorClass, 21);
  assert.equal(playerToCombatant(sword, 10).weapons.melee.damage, '1d8');
  assert.equal(playerToCombatant(sword, 10).weapons.melee.damageBonus, 1);
  sword.equipment.meleeWeapon.name = 'Machado';
  assert.equal(playerToCombatant(sword, 10).armorClass, 20);
  sword.equipment.meleeWeapon.name = 'Espada de duas mãos';
  assert.equal(playerToCombatant(sword, 10).armorClass, 20);
});

test('NPCs preservam especialização importada, bônus e fases especializadas', () => {
  const corsair = sheet({ id: 'corsario_bacamarte', proficiencyChanges: 'legado', newStances: [] });
  corsair.class = 'Corsário';
  corsair.equipment.shield.defense = 0;
  const importedTemplate = mapPlayerToNpc(corsair);
  assert.equal(importedTemplate.specialization.id, 'cor_bacamarte');
  const importedCombatant = npcToCombatant(importedTemplate, 10);
  assert.equal(importedCombatant.stances[0].id, 'cor_queima_roupa');

  const swordTemplate = mapPlayerToNpc(sheet(SPECIALIZATIONS.gue_espada_escudo));
  const npc = npcToCombatant(swordTemplate, 10);
  assert.equal(swordTemplate.specialization.id, 'gue_espada_escudo');
  assert.equal(npc.armorClass, 21);
  assert.equal(npc.weapons.melee.damage, '1d8');
  assert.equal(npc.weapons.melee.damageBonus, 1);
  assert.equal(npc.stances[0].id, 'gue_guarda_fechada');

  const phaseCombatant = npcToCombatant({ ...swordTemplate, phases: [{ name: 'Fase 2', maxHp: 40, stances: SPECIALIZATIONS.gue_espada_escudo.newStances }] }, 10);
  const nextPhase = advanceCombatantPhase({ ...phaseCombatant, hp: { current: 0, max: phaseCombatant.hp.max } });
  assert.equal(nextPhase.stances[0].id, 'gue_guarda_fechada');
});

test('posturas aplicam CON e penalidade de Corpo Impossível', () => {
  assert.equal(stanceArmorBonus(SPECIALIZATIONS.cor_bacamarte.newStances[0], { attributes }), 3);
  const impossible = Object.values(SPECIALIZATIONS).flatMap(s => s.newStances).find(s => s.name.includes('Corpo Impossível'));
  assert.equal(stanceArmorBonus(impossible, { attributes }), -2);
});

test('boss mantém fases e armas da biblioteca, restaura PV e normaliza postura sem turno extra', () => {
  const template = { ...mapPlayerToNpc(sheet(null)), name: 'Boss', phases: [{ name: 'Enfurecido', maxHp: 40, armorClass: 18, stances: [] }, {}] };
  const boss = npcToCombatant(template, 20);
  boss.hp.current = 0;
  boss.armorClass = 22;
  boss.stances = [{ id: 'defesa', acBonus: 2 }];
  boss.activeStanceId = 'defesa';
  boss.turnActions.standard = false;
  boss.conditions = [{ id: 'veneno', name: 'Envenenado', durationTurns: 3 }];
  const phase = advanceCombatantPhase(boss);
  assert.equal(phase.name, 'Enfurecido');
  assert.equal(phase.hp.current, 40);
  assert.equal(phase.armorClass, 18);
  assert.equal(phase.activeStanceId, null);
  assert.equal(phase.currentPhaseIndex, 1);
  assert.equal(phase.turnActions.standard, false);
  assert.deepEqual(phase.conditions, boss.conditions);
  assert.deepEqual(phase.weapons, template.weapons);
  const final = advanceCombatantPhase(phase);
  assert.equal(final.currentPhaseIndex, 2);
  assert.strictEqual(advanceCombatantPhase(final), final);
  assert.equal(boss.hp.current, 0);
  const inherited = advanceCombatantPhase({ ...boss, phases: [{}] });
  assert.equal(inherited.armorClass, 20);
});

test('turnos restauram ações, decrementam condições, pulam derrotados e preservam boss pendente', () => {
  const a = actor('a', { initiative: 20 });
  const dead = actor('dead', { initiative: 19, type: 'npc', hp: { current: 0, max: 20 } });
  const boss = { ...dead, id: 'boss', initiative: 18, phases: [{}], currentPhaseIndex: 0 };
  const b = actor('b', { turnActions: { standard: false, bonus: false, reaction: false }, conditions: [
    { id: 'short', name: 'Cego', durationTurns: 1 }, { id: 'long', name: 'Envenenado', durationTurns: 3 },
  ] });
  const next = advanceCombatTurn([a, dead, boss, b], 'a');
  assert.equal(next.activeTurnId, 'b');
  assert.deepEqual(next.combatants.map(c => c.id), ['a', 'boss', 'b']);
  assert.deepEqual(next.combatants[2].turnActions, { standard: true, bonus: true, reaction: true });
  assert.equal(next.combatants[2].conditions[0].durationTurns, 2);
  assert.equal(b.conditions[1].durationTurns, 3);
  assert.equal(advanceCombatTurn([boss], 'boss').activeTurnId, null);
});

test('incapacitação e teste de morte limitam ações no início do turno', () => {
  const stunned = actor('stunned', { conditions: [{ id: 'stun', name: 'Atordoado', durationTurns: 2 }] });
  assert.deepEqual(advanceCombatTurn([stunned], null).combatants[0].turnActions,
    { standard: false, bonus: false, reaction: false });
  const dying = actor('dying', { hp: { current: 0, max: 20 } });
  assert.deepEqual(advanceCombatTurn([dying], null).combatants[0].turnActions,
    { standard: true, bonus: false, reaction: false });
});
