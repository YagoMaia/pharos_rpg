const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = process.cwd();
const cache = new Map();

function load(file) {
  const full = path.resolve(root, file.endsWith('.ts') ? file : `${file}.ts`);
  if (cache.has(full)) return cache.get(full).exports;
  const module = { exports: {} };
  cache.set(full, module);
  const code = ts.transpileModule(fs.readFileSync(full, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  new Function('require', 'module', 'exports', code)(name =>
    name.startsWith('@/') ? load(name.slice(2)) : name.startsWith('.') ? load(path.resolve(path.dirname(full), name)) : require(name), module, module.exports);
  return module.exports;
}

function expression(file, name, dependencies, hook = false) {
  const source = ts.createSourceFile(file, fs.readFileSync(path.join(root, file), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let node;
  function visit(current) {
    if (ts.isVariableDeclaration(current) && current.name.getText(source) === name) node = hook ? current.initializer.arguments[0] : current.initializer;
    if (name === 'useEffect' && ts.isCallExpression(current) && current.expression.getText(source) === name && !node) node = current.arguments[0];
    ts.forEachChild(current, visit);
  }
  visit(source);
  assert.ok(node, name);
  const code = ts.transpileModule(`const value = ${node.getText(source)};`, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  return new Function(...Object.keys(dependencies), `${code}; return value;`)(...Object.values(dependencies));
}

const {
  calculateSaveDC,
  getTargetSaveModifier,
  resolveSavingThrow,
  calculateAreaDamage,
  resolveAreaAttackTargets,
} = load('utils/combatRules');

test('calculateSaveDC calcula CD base 8 + proficiencia por nivel + modificador', () => {
  const attacker = {
    level: 5, // prof = +3
    attributes: {
      Destreza: { name: 'Destreza', value: 16, modifier: 3 },
      Inteligência: { name: 'Inteligência', value: 18, modifier: 4 },
      Sabedoria: { name: 'Sabedoria', value: 10, modifier: 0 },
      Força: { name: 'Força', value: 10, modifier: 0 },
      Constituição: { name: 'Constituição', value: 12, modifier: 1 },
      Carisma: { name: 'Carisma', value: 8, modifier: -1 },
    },
  };

  // Com atributo especificado
  assert.equal(calculateSaveDC(attacker, 'Destreza'), 8 + 3 + 3); // 14
  assert.equal(calculateSaveDC(attacker, 'Inteligência'), 8 + 3 + 4); // 15
  // Sem atributo especificado, usa o maior entre os atributos relevantes (INT 4)
  assert.equal(calculateSaveDC(attacker), 8 + 3 + 4); // 15
});

test('getTargetSaveModifier extrai o modificador do atributo do alvo', () => {
  const target = {
    attributes: {
      Destreza: { name: 'Destreza', value: 14, modifier: 2 },
      Constituição: { name: 'Constituição', value: 8, modifier: -1 },
    },
  };
  assert.equal(getTargetSaveModifier(target, 'Destreza'), 2);
  assert.equal(getTargetSaveModifier(target, 'Constituição'), -1);
  assert.equal(getTargetSaveModifier(target, 'Força'), 0);
});

test('resolveSavingThrow determina se passou na salvaguarda contra a CD', () => {
  const target = {
    attributes: {
      Destreza: { name: 'Destreza', value: 14, modifier: 2 },
    },
  };
  const cd = 15;

  // d20 = 13 + 2 = 15 >= 15 -> Passou
  const pass = resolveSavingThrow(target, 'Destreza', cd, 13);
  assert.equal(pass.total, 15);
  assert.equal(pass.passed, true);
  assert.equal(pass.isCritSuccess, false);
  assert.equal(pass.isCritFail, false);

  // d20 = 12 + 2 = 14 < 15 -> Falhou
  const fail = resolveSavingThrow(target, 'Destreza', cd, 12);
  assert.equal(fail.total, 14);
  assert.equal(fail.passed, false);

  // 20 natural -> Sucesso crítico
  const critPass = resolveSavingThrow(target, 'Destreza', 30, 20);
  assert.equal(critPass.passed, true);
  assert.equal(critPass.isCritSuccess, true);

  // 1 natural -> Falha crítica
  const critFail = resolveSavingThrow(target, 'Destreza', 5, 1);
  assert.equal(critFail.passed, false);
  assert.equal(critFail.isCritFail, true);
});

test('calculateAreaDamage calcula dano total ou metade em caso de sucesso', () => {
  // Com metade do dano ao passar
  assert.equal(calculateAreaDamage(20, false, true), 20); // Falhou -> 20
  assert.equal(calculateAreaDamage(20, true, true), 10);  // Passou -> 10
  assert.equal(calculateAreaDamage(15, true, true), 7);   // Passou -> 7 (arredonda pra baixo)

  // Com dano zero ao passar (ex: evasão / efeito nulo)
  assert.equal(calculateAreaDamage(20, false, false), 20); // Falhou -> 20
  assert.equal(calculateAreaDamage(20, true, false), 0);   // Passou -> 0
});

test('resolveAreaAttackTargets processa multiplos alvos e calcula dano individual', () => {
  const t1 = { id: 'goblin_1', attributes: { Destreza: { modifier: 3 } } };
  const t2 = { id: 'goblin_2', attributes: { Destreza: { modifier: -1 } } };
  const cd = 14;
  const baseDamage = 18;

  const results = resolveAreaAttackTargets(
    [
      { combatant: t1, roll: 12 }, // 12 + 3 = 15 >= 14 (Passou -> 9 de dano)
      { combatant: t2, roll: 10 }, // 10 - 1 = 9 < 14 (Falhou -> 18 de dano)
    ],
    'Destreza',
    cd,
    baseDamage,
    true
  );

  assert.equal(results.length, 2);
  assert.equal(results[0].targetId, 'goblin_1');
  assert.equal(results[0].passed, true);
  assert.equal(results[0].damageAmount, 9);

  assert.equal(results[1].targetId, 'goblin_2');
  assert.equal(results[1].passed, false);
  assert.equal(results[1].damageAmount, 18);
});

const { playerToCombatant } = load('utils/combatantFactory');
const { getActionKey } = load('utils/rpgUtils');
const initial = expression('context/CharacterContext.tsx', 'INITIAL_CHARACTER', {});

function sheet() {
  const char = structuredClone(initial);
  char.level = 5;
  char.attributes['Destreza'] = { name: 'Destreza', value: 16, modifier: 3 };
  return char;
}

const activeFile = 'components/session/ActiveTurnInterface.tsx';

function harness(offline) {
  const actor = playerToCombatant(sheet(), 10);
  actor.turnActions.standard = true;
  actor.focus.current = 10;
  const target1 = { ...structuredClone(actor), id: 'target_1', hp: { current: 20, max: 20 } };
  const target2 = { ...structuredClone(actor), id: 'target_2', hp: { current: 20, max: 20 } };
  const state = { sent: [], updates: [], alerts: [], combatants: [actor, target1, target2] };
  const update = expression('context/CampaignContext.tsx', 'updateCombatant', {
    setCombatants: updater => { state.combatants = updater(state.combatants); },
  }, true);
  const deps = {
    combatant: actor, combatants: state.combatants, turnActions: actor.turnActions,
    incapacitated: false, isOfflineMode: offline, isGm: true, getActionKey,
    calculateSaveDC, getTargetSaveModifier, resolveSavingThrow, calculateAreaDamage, resolveAreaAttackTargets,
    console: { log() {} },
    showAlert: (...args) => state.alerts.push(args),
    setSpellAttackConfig: () => {},
    setSpellHealConfig: () => {},
    setAttackModalOpen: () => {},
    setHealModalOpen: () => {},
    setAreaAttackModalOpen: () => {},
    sendMessage: (type, payload) => state.sent.push({ type, payload }),
    updateCombatant: (id, field, value) => {
      state.updates.push({ id, field, value });
      update(id, field, value);
    },
  };
  return {
    state, deps,
    get actor() { return state.combatants.find(c => c.id === actor.id); },
    get target1() { return state.combatants.find(c => c.id === 'target_1'); },
    get target2() { return state.combatants.find(c => c.id === 'target_2'); },
    run: name => expression(activeFile, name, {
      ...deps,
      combatant: state.combatants.find(c => c.id === actor.id),
      combatants: state.combatants,
      turnActions: state.combatants.find(c => c.id === actor.id).turnActions,
    }),
  };
}

test('handleConfirmAreaAttack offline aplica dano individual a cada alvo e gasta acao e foco', () => {
  const h = harness(true);
  const targetResults = [
    { targetId: 'target_1', damageAmount: 8, passed: true, roll: 15, total: 17 },
    { targetId: 'target_2', damageAmount: 16, passed: false, roll: 9, total: 11 },
  ];
  h.run('handleConfirmAreaAttack')(targetResults, 16, 14, 'Destreza', 'Explosão Arcana', 'standard', 3);

  // Alvo 1 sofreu 8 de dano: 20 - 8 = 12
  assert.equal(h.target1.hp.current, 12);
  // Alvo 2 sofreu 16 de dano: 20 - 16 = 4
  assert.equal(h.target2.hp.current, 4);
  // Atacante gastou ação padrão e 3 de foco
  assert.equal(h.actor.turnActions.standard, false);
  assert.equal(h.actor.focus.current, 7);
  // Feedback emitido
  assert.equal(h.state.alerts.length, 1);
});

test('handleConfirmAreaAttack online envia payload RESOLVE_ACTION com targets e custos', () => {
  const h = harness(false);
  const targetResults = [
    { targetId: 'target_1', damageAmount: 10, passed: true, roll: 16, total: 18 },
    { targetId: 'target_2', damageAmount: 20, passed: false, roll: 8, total: 10 },
  ];
  h.run('handleConfirmAreaAttack')(targetResults, 20, 15, 'Destreza', 'Chuva de Fogo', 'standard', 4);

  assert.equal(h.state.sent.length, 1);
  assert.equal(h.state.sent[0].type, 'RESOLVE_ACTION');
  const payload = h.state.sent[0].payload;
  assert.equal(payload.actionName, 'Chuva de Fogo');
  assert.equal(payload.costType, 'standard');
  assert.equal(payload.focusCost, 4);
  assert.equal(payload.targets.length, 2);
  assert.equal(payload.targets[0].targetId, 'target_1');
  assert.equal(payload.targets[0].damageAmount, 10);
  assert.equal(payload.targets[1].targetId, 'target_2');
  assert.equal(payload.targets[1].damageAmount, 20);
});

