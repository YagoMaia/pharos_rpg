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
const { playerToCombatant, mapPlayerToNpc, npcToCombatant, petToCombatant } = load('utils/combatantFactory');
const { weaponDamageFormula } = load('utils/combatRules');
const { getActionKey } = load('utils/rpgUtils');
const { SPECIALIZATIONS } = load('data/specializationsData');
const initial = expression('context/CharacterContext.tsx', 'INITIAL_CHARACTER', {});
function sheet() {
  const char = structuredClone(initial);
  char.level = 7;
  char.attributes['Força'] = { name: 'Força', value: 16, modifier: 3 };
  char.equipment.meleeWeapon = { name: 'Espada longa', damage: '1d8', stats: '', description: '' };
  char.equipment.shield.defense = 2;
  char.specialization = SPECIALIZATIONS.gue_espada_escudo;
  return char;
}
const activeFile = 'components/session/ActiveTurnInterface.tsx';
function harness(offline) {
  const actor = playerToCombatant(sheet(), 10);
  actor.turnActions.standard = false;
  const target = { ...structuredClone(actor), id: 'target', hp: { current: 8, max: 20 }, armorClass: 10 };
  const state = { attack: null, heal: null, sent: [], updates: [], alerts: [], combatants: [actor, target] };
  const update = expression('context/CampaignContext.tsx', 'updateCombatant', {
    setCombatants: updater => { state.combatants = updater(state.combatants); },
  }, true);
  const deps = {
    combatant: actor, combatants: state.combatants, turnActions: actor.turnActions,
    incapacitated: false, isOfflineMode: offline, isGm: true, getActionKey, weaponDamageFormula,
    console: { log() {} },
    showAlert: (...args) => state.alerts.push(args),
    setSpellAttackConfig: value => { state.attack = value; },
    setSpellHealConfig: value => { state.heal = value; },
    setAttackModalOpen() {}, setHealModalOpen() {},
    sendMessage: (type, payload) => state.sent.push({ type, payload }),
    updateCombatant: (id, field, value) => {
      state.updates.push({ id, field, value });
      update(id, field, value);
    },
  };
  return { state, deps,
    get actor() { return state.combatants.find(c => c.id === actor.id); },
    get target() { return state.combatants.find(c => c.id === target.id); },
    run: name => expression(activeFile, name, { ...deps,
      combatant: state.combatants.find(c => c.id === actor.id), combatants: state.combatants,
      turnActions: state.combatants.find(c => c.id === actor.id).turnActions,
      spellAttackConfig: state.attack, spellHealConfig: state.heal }),
  };
}

test('Espada e Escudo soma FOR e bônus passivo em habilidades e no ataque básico', () => {
  const h = harness(false);
  h.actor.turnActions.standard = true;
  h.run('handleUseSkill')({ name: 'Varrer a Linha', cost: 0, actionType: 'Padrão', usesWeaponDamage: true, weaponType: 'melee' });
  assert.equal(h.state.attack.damage, '1d8+4');
  let formula;
  expression('components/modals/AttackModal.tsx', 'useEffect', {
    visible: true, attacker: h.actor, initialBonus: undefined, initialDamage: undefined, weaponDamageFormula,
    setStep() {}, setSelectedTargets() {}, setHitValue() {}, setDmgValue() {}, setIsCrit() {}, setAttackBonus() {},
    setDamageFormula: value => { formula = value; },
  })();
  assert.equal(formula, '1d8+4');
  const npc = npcToCombatant(mapPlayerToNpc(sheet()), 10);
  assert.equal(npc.specialization.id, SPECIALIZATIONS.gue_espada_escudo.id);
  assert.equal(weaponDamageFormula(npc.weapons.melee, 3), '1d8+4');
});

test('combatente online envia identidade persistente da ficha', () => {
  const character = sheet();
  character.sheetId = 'sheet-bound-to-campaign';
  assert.equal(playerToCombatant(character, 10).sheetId, character.sheetId);
});

test('fórmulas explícitas e legadas não duplicam atributo e respeitam modificadores negativos', () => {
  const weapon = playerToCombatant(sheet(), 10).weapons.melee;
  assert.equal(weaponDamageFormula(weapon, -2), '1d8-1');
  assert.equal(weaponDamageFormula({ ...weapon, damage: '1d8+3' }, 3), '1d8+3+1');
  assert.equal(weaponDamageFormula({ ...weapon, damage: '1d8+2', damageIncludesAttribute: false }, 3), '1d8+2+4');
  assert.equal(weaponDamageFormula({ ...weapon, damage: '1d8-2', damageIncludesAttribute: true }, -2), '1d8-2+1');
});

for (const [actionType, actionKey] of [['Ação Bônus', 'bonus'], ['Reação', 'reaction']]) {
  for (const offline of [false, true]) {
    test(`ataque ${actionType}, ${offline ? 'offline' : 'online'}, preserva o custo com ação padrão gasta`, () => {
      const h = harness(offline);
      h.run('handleUseSkill')({ name: 'Ataque especial', cost: 2, actionType, usesWeaponDamage: true, weaponType: 'melee' });
      assert.equal(h.state.attack.actionKey, actionKey);
      h.run('handleConfirmAttack')(['target'], 20, 5, false);
      if (offline) {
        assert.equal(h.actor.turnActions[actionKey], false);
        assert.equal(h.actor.turnActions.standard, false);
        assert.equal(h.actor.turnActions[actionKey === 'bonus' ? 'reaction' : 'bonus'], true);
        assert.equal(h.target.hp.current, 3);
        assert.equal(h.actor.focus.current, 8);
      } else {
        assert.equal(h.state.sent[0].payload.costType, actionKey);
        assert.equal(h.state.updates.length, 0);
        assert.equal(h.target.hp.current, 8);
      }
    });
    test(`cura ${actionType}, ${offline ? 'offline' : 'online'}, preserva o custo e não depende da ação padrão`, () => {
      const h = harness(offline);
      h.run('handleCastSpell')({ name: 'Cura rápida', cost: 2, actionType, isHealing: true, healFormula: '1d6' });
      assert.equal(h.state.heal.actionKey, actionKey);
      h.run('handleConfirmHeal')('target', 5);
      if (offline) {
        assert.equal(h.actor.turnActions[actionKey], false);
        assert.equal(h.actor.turnActions.standard, false);
        assert.equal(h.actor.turnActions[actionKey === 'bonus' ? 'reaction' : 'bonus'], true);
        assert.equal(h.target.hp.current, 13);
        assert.equal(h.actor.focus.current, 8);
      } else {
        assert.equal(h.state.sent[0].payload.costType, actionKey);
        assert.equal(h.state.updates.length, 0);
        assert.equal(h.target.hp.current, 8);
      }
    });
  }
}

test('magias de ataque e habilidades de cura também guardam o tipo de ação', () => {
  const h = harness(true);
  h.run('handleCastSpell')({ name: 'Disparo', cost: 1, actionType: 'Ação Bônus', isAttack: true, damageFormula: '1d6' });
  assert.equal(h.state.attack.actionKey, 'bonus');
  h.run('handleUseSkill')({ name: 'Socorro', cost: 1, actionType: 'Reação', isHealing: true, healFormula: '1d6' });
  assert.equal(h.state.heal.actionKey, 'reaction');
});

test('confirmação revalida foco, incapacitação e ação depois de abrir o modal', () => {
  for (const offline of [false, true]) {
    for (const reason of ['focus', 'action', 'incapacitated']) {
      const h = harness(offline);
      h.run('handleCastSpell')({ name: 'Cura', cost: 2, actionType: 'Ação Bônus', isHealing: true, healFormula: '1d6' });
      h.run('handleUseSkill')({ name: 'Ataque', cost: 2, actionType: 'Ação Bônus', usesWeaponDamage: true });
      if (reason === 'focus') h.actor.focus.current = 0;
      if (reason === 'action') h.actor.turnActions.bonus = false;
      if (reason === 'incapacitated') h.deps.incapacitated = true;
      h.run('handleConfirmHeal')('target', 5);
      h.run('handleConfirmAttack')(['target'], 20, 5, false);
      assert.equal(h.state.sent.length, 0);
      assert.equal(h.state.updates.length, 0);
      assert.equal(h.state.alerts.length, 2);
    }
  }
});

test('reconexão automática monta JOIN com a ficha atual em vez do snapshot antigo', () => {
  const old = playerToCombatant(sheet(), 14);
  const current = sheet();
  current.stats.hp.max = 27;
  current.equipment.armor.defense = 18;
  let socket;
  const refs = { current: null };
  const connect = expression('context/WebSocketContext.tsx', 'connectToRoute', {
    reconnectTimeout: { current: null }, socketRef: refs, intentionalClose: { current: false },
    lastConnectionRef: { current: null }, reconnectAttempts: { current: 0 }, pingInterval: { current: null },
    clientIdRef: { current: 'client-test' }, createClientId: () => 'client-test', AsyncStorage: { setItem() {} },
    characterRef: { current }, playerToCombatant, petToCombatant, startPingInterval() {}, setIsConnected() {}, setConnectionError() {},
    handleServerMessage() {}, attemptReconnect() {}, console: { log() {} }, Alert: { alert() {} },
    WebSocket: class { constructor() { socket = this; } send(data) { this.payload = JSON.parse(data); } },
  }, true);
  connect('localhost', 'room', old);
  socket.onopen();
  assert.equal(socket.payload.payload.combatant.hp.max, 27);
  assert.equal(socket.payload.payload.combatant.baseArmorClass, 21);
  assert.equal(socket.payload.payload.combatant.initiative, 14);
});

test('sala de campanha envia AUTH antes de JOIN e mantém token fora da URL', () => {
  const { campaignAuthMessage, campaignSocketUrl } = load('utils/campaignSocket');
  const current = sheet();
  current.sheetId = 'sheet-1';
  const sent = [];
  let socket;
  const connect = expression('context/WebSocketContext.tsx', 'connectToRoute', {
    reconnectTimeout: { current: null }, socketRef: { current: null }, intentionalClose: { current: false },
    lastConnectionRef: { current: null }, reconnectAttempts: { current: 0 }, pingInterval: { current: null },
    clientIdRef: { current: 'client-test' }, createClientId: () => 'client-test', AsyncStorage: { setItem() {} },
    characterRef: { current }, playerToCombatant, petToCombatant, startPingInterval() {}, setIsConnected() {}, setConnectionError() {},
    handleServerMessage() {}, attemptReconnect() {}, campaignAuthMessage, campaignSocketUrl,
    console: { log() {} }, Alert: { alert() {} },
    WebSocket: class { constructor(url) { this.url = url; socket = this; } send(data) { sent.push(JSON.parse(data)); } },
  }, true);
  connect('https://example.org', 'campaign-8b0bf747-6b3e-444a-b9e0-0d00f786a361',
    playerToCombatant(current, 14), null, 'private-token');
  socket.onopen();
  assert.equal(sent.length, 1);
  assert.equal(sent[0].type, 'AUTH_CAMPAIGN');
  assert.ok(!socket.url.includes('private-token'));
  socket.onmessage({ data: JSON.stringify({ type: 'AUTH_OK' }) });
  assert.equal(sent[1].type, 'JOIN_SESSION');
  assert.equal(sent[1].payload.combatant.sheetId, 'sheet-1');
});
