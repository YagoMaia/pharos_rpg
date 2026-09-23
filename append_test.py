import os

with open('tests/bestiary-specializations.cjs', 'a', encoding='utf-8') as f:
    f.write('''
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
    
    // Deve conter tanto as posturas do template base quanto as posturas exclusivas da especialização
    const hasBase = combatant.stances.some(s => s.id === "base_stance");
    const hasSpecStance = combatant.stances.some(s => s.id === "stance_01");
    
    assert.equal(hasBase, true, 'Deveria manter a postura base');
    assert.equal(hasSpecStance, true, 'Deveria injetar as posturas da especialização');
});
''')
