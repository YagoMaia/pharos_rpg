const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
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
function contextExpression(name, dependencies = {}, callback = true) {
  const source = ts.createSourceFile('CharacterContext.tsx', fs.readFileSync(path.join(root, 'context/CharacterContext.tsx'), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let expression;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === name) expression = callback ? node.initializer.arguments[0] : node.initializer;
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.ok(expression, name);
  const code = ts.transpileModule(`const value = ${expression.getText(source)}`, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  return new Function(...Object.keys(dependencies), `${code}; return value;`)(...Object.values(dependencies));
}
const rules = load('utils/featRules');
const { FEATS_DATA } = load('data/progression');
const { playerToCombatant, mapPlayerToNpc, npcToCombatant } = load('utils/combatantFactory');
const initial = contextExpression('INITIAL_CHARACTER', {}, false);
const feat = id => FEATS_DATA.find(item => item.id === id);
const sheet = (level = 13) => ({ ...structuredClone(initial), level, feats: [] });
const add = (char, id, slot, choices) => rules.addCharacterFeat(char, feat(id), slot, choices);

test('slot escolhido é respeitado, inclusive após remover outros slots e recarregar', () => {
  let char = add(sheet(), 'vigoroso', 7);
  char = add(char, 'ator', 3);
  char = rules.removeCharacterFeat(char, 'ator');
  assert.equal(char.feats[0].slotLevel, 7);
  char = rules.migrateFeats(JSON.parse(JSON.stringify(char)));
  assert.equal(char.feats[0].slotLevel, 7);
  assert.equal(char.stats.hp.max, 33);
  char = add(char, 'poliglota', 3);
  assert.deepEqual(char.feats.map(f => f.slotLevel), [7, 3]);
});

test('nível, slot ocupado, ID duplicado, slot inválido e façanha desconhecida são rejeitados', () => {
  const char = add(sheet(3), 'vigoroso', 3);
  assert.strictEqual(add(char, 'ator', 3), char);
  assert.strictEqual(add(char, 'ator', 7), char);
  assert.strictEqual(add(char, 'ator', 4), char);
  assert.strictEqual(add(char, 'ator', NaN), char);
  const leveled = rules.reconcileFeatBenefits({ ...char, level: 13 });
  assert.strictEqual(add(leveled, 'vigoroso', 7), leveled);
  assert.strictEqual(rules.addCharacterFeat(char, { id: 'inventada' }, 3), char);
});

test('Vigoroso aplica CON e PV máximos, acompanha nível e reverte sem curar', () => {
  let char = add(sheet(7), 'vigoroso', 7);
  assert.equal(char.attributes['Constituição'].value, 11);
  assert.equal(char.stats.hp.max, 27);
  assert.equal(char.stats.hp.current, 20);
  char = rules.reconcileFeatBenefits({ ...char, level: 10 });
  assert.equal(char.stats.hp.max, 30);
  assert.deepEqual(rules.reconcileFeatBenefits(char), char);
  char = rules.reconcileFeatBenefits({ ...char, level: 3 });
  assert.equal(char.feats.length, 1);
  assert.equal(char.feats[0].slotLevel, 7);
  assert.equal(rules.activeFeats(char).length, 0);
  assert.equal(char.stats.hp.max, 20);
  assert.equal(char.attributes['Constituição'].value, 10);
  char = rules.reconcileFeatBenefits({ ...char, level: 7 });
  assert.equal(char.stats.hp.max, 27);
  const removed = rules.removeCharacterFeat(char, 'vigoroso');
  assert.equal(removed.stats.hp.max, 20);
  assert.equal(removed.attributes['Constituição'].value, 10);
});

test('recalcular ou remover façanhas não ressuscita nem deixa PV acima do máximo', () => {
  let char = add(sheet(7), 'vigoroso', 3);
  char.stats.hp.current = 27;
  assert.equal(rules.removeCharacterFeat(char, 'vigoroso').stats.hp.current, 20);
  char.stats.hp.current = 0;
  assert.equal(rules.reconcileFeatBenefits({ ...char, level: 10 }).stats.hp.current, 0);
});

test('Habilidoso exige duas escolhas distintas e respeita o limite 18 com bônus sobrepostos', () => {
  const base = sheet();
  assert.strictEqual(add(base, 'habilidoso', 3, ['Força']), base);
  assert.strictEqual(add(base, 'habilidoso', 3, ['Força', 'Força']), base);
  assert.strictEqual(add(base, 'habilidoso', 3, ['Força', 'Inválido']), base);
  base.attributes['Constituição'].value = 17;
  let char = add(base, 'habilidoso', 3, ['Força', 'Constituição']);
  char = add(char, 'vigoroso', 7);
  assert.equal(char.attributes['Constituição'].value, 18);
  assert.equal(char.attributes['Constituição'].modifier, 4);
  assert.equal(char.attributes['Força'].value, 11);
  char = rules.removeCharacterFeat(char, 'habilidoso');
  assert.equal(char.attributes['Força'].value, 10);
  assert.equal(char.attributes['Constituição'].value, 18);
  assert.equal(rules.removeCharacterFeat(char, 'vigoroso').attributes['Constituição'].value, 17);
});

test('Ator, Poliglota e edição de atributos mantêm totais e reversão corretos', () => {
  let char = add(add(sheet(), 'ator', 3), 'poliglota', 7);
  assert.equal(char.attributes['Carisma'].value, 11);
  assert.equal(char.attributes['Inteligência'].value, 11);
  char = rules.setFeatAttributeValue(char, 'Carisma', 16);
  assert.equal(char.attributes['Carisma'].value, 16);
  assert.equal(rules.removeCharacterFeat(char, 'ator').attributes['Carisma'].value, 15);
  char = rules.setFeatAttributeValue(char, 'Carisma', 19);
  assert.equal(char.attributes['Carisma'].value, 19);
  assert.equal(rules.removeCharacterFeat(char, 'ator').attributes['Carisma'].value, 19);
  assert.deepEqual(rules.reconcileFeatBenefits(char), char);
});

test('migração preserva ajustes legados, não duplica bônus e conserva excedentes inativos', () => {
  const old = sheet();
  old.feats = [feat('vigoroso'), feat('ator'), feat('poliglota'), feat('iniciativa'), feat('sortudo')];
  old.attributes['Constituição'].value = 11;
  old.stats.hp.max = 33;
  const migrated = rules.migrateFeats(old);
  assert.deepEqual(migrated.feats.map(f => f.slotLevel), [3, 7, 10, 13, null]);
  assert.equal(migrated.stats.hp.max, 33);
  assert.equal(migrated.attributes['Constituição'].value, 11);
  assert.ok(migrated.feats.every(f => f.manualBenefits));
  assert.deepEqual(rules.migrateFeats(migrated), migrated);
  const removed = rules.removeCharacterFeat(migrated, 'ator');
  assert.equal(rules.migrateFeats(removed).feats.at(-1).slotLevel, null);
  const current = add(sheet(), 'vigoroso', 3);
  const saved = JSON.parse(JSON.stringify(current));
  assert.deepEqual(rules.migrateFeats(saved), saved);
});

test('importações com IDs/slots duplicados não aplicam bônus duplicados nem deslocam slots explícitos', () => {
  const char = sheet();
  char.feats = [feat('ator'), { ...feat('vigoroso'), slotLevel: 3 }, { ...feat('vigoroso'), slotLevel: 7 }, { ...feat('poliglota'), slotLevel: 3 }];
  const migrated = rules.migrateFeats(char);
  assert.equal(migrated.feats[1].slotLevel, 3);
  assert.equal(migrated.feats[2].slotLevel, null);
  assert.equal(migrated.feats[3].slotLevel, null);
  assert.equal(rules.activeFeats(migrated).length, 2);
});

test('Iniciativa Aprimorada soma SAB e some quando o slot fica inativo', () => {
  let char = sheet();
  char.attributes['Destreza'].modifier = 2;
  char.attributes['Destreza'].value = 14;
  char.attributes['Sabedoria'].modifier = 3;
  char.attributes['Sabedoria'].value = 16;
  char = add(char, 'iniciativa', 7);
  assert.equal(10 + rules.initiativeBonus(char), 15);
  assert.equal(mapPlayerToNpc(char).initiativeBonus, 5);
  char = rules.reconcileFeatBenefits({ ...char, level: 3 });
  assert.equal(rules.initiativeBonus(char), 2);
});

test('combatente e bestiário preservam façanhas ativas e customizadas sem reaplicar bônus', () => {
  let char = add(sheet(7), 'vigoroso', 3);
  char.factionFeat = { id: 'faction', name: 'Facção', category: 'Social', benefit: 'Regra manual' };
  char.specialFeat = { ...char.factionFeat, id: 'special' };
  const player = playerToCombatant(char, 12);
  assert.equal(player.hp.max, 27);
  assert.equal(player.feats[0].id, 'vigoroso');
  assert.deepEqual(player.specialFeat, char.specialFeat);
  const npc = npcToCombatant(mapPlayerToNpc(char), 12);
  assert.equal(npc.hp.max, 27);
  assert.equal(npc.feats[0].id, 'vigoroso');
  assert.deepEqual(npc.factionFeat, char.factionFeat);
});

test('callbacks reais do contexto rejeitam seleções concorrentes e recalculam ao mudar nível', () => {
  let char = sheet(7);
  const deps = { ...rules, CLASS_DATA: {}, setCharacter: update => { char = update(char); } };
  const addFeat = contextExpression('addFeat', deps);
  addFeat(feat('vigoroso'), 7);
  addFeat(feat('ator'), 7);
  assert.equal(char.feats.length, 1);
  assert.equal(char.stats.hp.max, 27);
  contextExpression('updateLevel', deps)(3);
  assert.equal(char.stats.hp.max, 20);
  assert.equal(char.feats[0].slotLevel, 7);
  contextExpression('removeFeat', deps)('vigoroso');
  assert.equal(char.feats.length, 0);
});

test('fechar modal principal oculta o seletor e slots inativos continuam removíveis', () => {
  let character = add(sheet(), 'vigoroso', 7);
  character = rules.reconcileFeatBenefits({ ...character, level: 3 });
  let selected = 7;
  const jsx = (type, props) => ({ type, props });
  const mocks = {
    'react/jsx-runtime': { jsx, jsxs: jsx },
    react: { useMemo: fn => fn(), useEffect: () => {}, useState: (() => { let index = 0; return () => [index++ % 3 === 0 ? selected : null, () => {}]; })() },
    'react-native': { Modal: 'Modal', View: 'View', Text: 'Text', TouchableOpacity: 'Button', ScrollView: 'Scroll', SectionList: 'List', StyleSheet: { create: x => x } },
    'react-native-safe-area-context': { SafeAreaView: 'SafeArea' }, '@expo/vector-icons': { Ionicons: 'Icon' },
    '@/context/AlertContext': { useAlert: () => ({ showAlert: () => {} }) },
    '@/context/CharacterContext': { useCharacter: () => ({ character, addFeat: () => {}, removeFeat: () => {} }) },
    '@/context/ThemeContext': { useTheme: () => ({ colors: {} }) },
    '@/data/progression': { FEATS_DATA }, '@/utils/featRules': rules,
  };
  const code = ts.transpileModule(fs.readFileSync(path.join(root, 'components/modals/FeatsModal.tsx'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(name => mocks[name], module, module.exports);
  const hidden = module.exports.FeatsModal({ visible: false, onClose() {} });
  assert.equal(hidden.props.visible, false);
  selected = null;
  const shown = module.exports.FeatsModal({ visible: true, onClose() {} });
  const nodes = [];
  function walk(node) {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== 'object') return;
    nodes.push(node); walk(node.props?.children);
  }
  walk(shown);
  assert.ok(nodes.some(node => node.type === 'Icon' && node.props.name === 'trash-outline'));
  assert.ok(nodes.some(node => node.type === 'Text' && node.props.children === 'Vigoroso'));
});
