import os

with open('utils/combatantFactory.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Substituir a lógica de mesclagem pela de substituição
old_logic = 'stances: [...(npc.stances || []), ...(npc.specialization?.newStances || [])],'
new_logic = 'stances: npc.specialization?.newStances?.length ? npc.specialization.newStances : (npc.stances || []),'

if old_logic in content:
    content = content.replace(old_logic, new_logic)

with open('utils/combatantFactory.ts', 'w', encoding='utf-8') as f:
    f.write(content)

# Atualizar o teste para refletir a substituição
with open('tests/bestiary-specializations.cjs', 'r', encoding='utf-8') as f:
    test_content = f.read()

old_test_asserts = '''    // Deve conter tanto as posturas do template base quanto as posturas exclusivas da especialização
    const hasBase = combatant.stances.some(s => s.id === "base_stance");
    const hasSpecStance = combatant.stances.some(s => s.id === "stance_01");
    
    assert.equal(hasBase, true, 'Deveria manter a postura base');
    assert.equal(hasSpecStance, true, 'Deveria injetar as posturas da especialização');'''

new_test_asserts = '''    // Conforme a documentação, as posturas da especialização devem SUBSTITUIR as posturas base
    const hasBase = combatant.stances.some(s => s.id === "base_stance");
    const hasSpecStance = combatant.stances.some(s => s.id === "stance_01");
    
    assert.equal(hasBase, false, 'NÃO deveria manter a postura base (deve ser substituída)');
    assert.equal(hasSpecStance, true, 'Deveria conter APENAS as posturas da especialização');
    assert.equal(combatant.stances.length, 1, 'Deve ter exatamente a quantidade de posturas da especialização');'''

if old_test_asserts in test_content:
    test_content = test_content.replace(old_test_asserts, new_test_asserts)

with open('tests/bestiary-specializations.cjs', 'w', encoding='utf-8') as f:
    f.write(test_content)
