const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Load TS modules
const root = path.resolve(__dirname, '..');
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

const { npcToCombatant } = load('utils/combatantFactory');

test('Bestiário NPC - Deve ignorar ausência de especialização mantendo status originais', () => {
    const npcWithoutSpec = {
        id: "npc_01",
        name: "Goblin Comum",
        level: 1,
        class: "Monstro",
        ancestry: "Humanoide",
        maxHp: 15,
        armorClass: 12,
        maxFocus: 2,
        attributes: {},
        stances: [],
        skills: [],
        spells: [],
        initiativeBonus: 2,
        speed: "9m"
    };

    const combatant = npcToCombatant(npcWithoutSpec, 15, 1);
    
    // Nenhuma especialização aplicada
    assert.equal(combatant.armorClass, 12);
    assert.equal(combatant.baseArmorClass, 12);
});

test('Bestiário NPC - Deve aplicar corretamente o modificador de armorClass da especialização', () => {
    const mockSpecialization = {
        id: "spec_defensor",
        name: "Defensor das Profundezas",
        classRequired: "Monstro",
        description: "Ganha bônus no CA",
        proficiencyChanges: [
            {
                name: "Casco Reforçado",
                description: "+3 CA",
                mechanicType: "armor",
                mechanicValue: 3
            }
        ],
        newStances: []
    };

    const npcWithSpec = {
        id: "npc_02",
        name: "Caranguejo Gigante",
        level: 3,
        class: "Monstro",
        ancestry: "Besta",
        maxHp: 40,
        armorClass: 14, // Base AC
        maxFocus: 0,
        attributes: {},
        stances: [],
        skills: [],
        spells: [],
        initiativeBonus: -1,
        speed: "6m",
        specialization: mockSpecialization // Adicionando a especialização no template do bestiário
    };

    const combatant = npcToCombatant(npcWithSpec, 10, 1);
    
    // 14 (base) + 3 (especialização) = 17
    assert.equal(combatant.armorClass, 17);
    assert.equal(combatant.baseArmorClass, 17);
});

test('Bestiário NPC - Deve herdar posturas (newStances) da especialização', () => {
    const mockSpecialization = {
        id: "spec_posturas",
        name: "Mestre das Posturas",
        classRequired: "Monstro",
        description: "Ganha posturas únicas",
        proficiencyChanges: [],
        newStances: [
            { id: "stance_01", name: "Postura Agressiva", description: "+Dano", type: "offensive", level: 1 }
        ]
    };

    const npcWithSpec = {
        id: "npc_03",
        name: "Lutador",
        level: 3,
        class: "Monstro",
        ancestry: "Humano",
        maxHp: 40,
        armorClass: 14,
        maxFocus: 0,
        attributes: {},
        stances: [{ id: "base_stance", name: "Base", description: "", type: "neutral", level: 1 }],
        skills: [],
        spells: [],
        initiativeBonus: 0,
        speed: "6m",
        specialization: mockSpecialization
    };

    const combatant = npcToCombatant(npcWithSpec, 10, 1);
    
    // Conforme a documentação, as posturas da especialização devem SUBSTITUIR as posturas base
    const hasBase = combatant.stances.some(s => s.id === "base_stance");
    const hasSpecStance = combatant.stances.some(s => s.id === "stance_01");
    
    assert.equal(hasBase, false, 'NÃO deveria manter a postura base (deve ser substituída)');
    assert.equal(hasSpecStance, true, 'Deveria conter APENAS as posturas da especialização');
    assert.equal(combatant.stances.length, 1, 'Deve ter exatamente a quantidade de posturas da especialização');
});
