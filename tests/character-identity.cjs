const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function loadIdentity() {
  const source = fs.readFileSync(path.join(process.cwd(), 'utils/characterIdentity.ts'), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  new Function('module', 'exports', code)(module, module.exports);
  return module.exports;
}

test('ficha legada recebe ID estável sem alterar os demais dados', () => {
  const { ensureCharacterId } = loadIdentity();
  const original = { name: 'Heroína', level: 5 };
  const updated = ensureCharacterId(original, () => 'stable-1');
  assert.deepEqual(updated, { ...original, sheetId: 'stable-1' });
  assert.equal(original.sheetId, undefined);
  assert.equal(ensureCharacterId({ ...updated, name: 'Outro nome' }, () => 'unused').sheetId, 'stable-1');
});

test('ID vazio é substituído e ficha importada mantém ID válido', () => {
  const { ensureCharacterId } = loadIdentity();
  assert.equal(ensureCharacterId({ sheetId: '  ' }, () => 'fresh').sheetId, 'fresh');
  assert.equal(ensureCharacterId({ sheetId: 'imported' }, () => 'unused').sheetId, 'imported');
});

test('importação usa o ID recebido e gera outro para fichas legadas', () => {
  const sourcePath = path.join(process.cwd(), 'context/CharacterContext.tsx');
  const sourceText = fs.readFileSync(sourcePath, 'utf8');
  const source = ts.createSourceFile(sourcePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let callback;
  function find(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'importCharacter') {
      callback = node.initializer.arguments[0].getText(source);
    }
    ts.forEachChild(node, find);
  }
  find(source);
  assert.ok(callback);
  const code = ts.transpileModule(`const importCharacter = ${callback};`, {
    compilerOptions: { target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const initial = { name: 'Novo', sheetId: 'default-id', stats: { hp: { max: 20 } }, attributes: {} };
  let character;
  const importCharacter = new Function('setCharacter', 'INITIAL_CHARACTER', 'migrateFeats',
    'migrateSpecialization', 'ensureCharacterId', `${code}; return importCharacter;`)(
    updater => { character = updater(initial); }, initial, value => value, value => value,
    loadIdentity().ensureCharacterId,
  );
  importCharacter({ name: 'Importado', sheetId: 'valid-id' });
  assert.equal(character.sheetId, 'valid-id');
  importCharacter({ name: 'Legado' });
  assert.ok(character.sheetId);
  assert.notEqual(character.sheetId, initial.sheetId);
  assert.match(sourceText, /setCharacter\(ensureCharacterId\(migrateFeats\(migrateSpecialization\(parsed\)\)\)\)/);
  assert.match(sourceText, /setCharacter\(ensureCharacterId\(INITIAL_CHARACTER\)\)/);
});
