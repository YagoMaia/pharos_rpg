import os

with open('utils/combatantFactory.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'armorClass: finalArmorClass,' in line:
        lines[i] = '    armorClass: finalArmorClass,\n    baseArmorClass: finalArmorClass,\n'

for i, line in enumerate(lines):
    if 'const uniqueName = ' in line and 'instanceId' in line:
        # Check if we already inserted it
        if 'finalArmorClass = npc.armorClass' not in lines[i+2]:
            lines.insert(i+1, '''
  let finalArmorClass = npc.armorClass;
  if (Array.isArray(npc.specialization?.proficiencyChanges)) {
    for (const change of npc.specialization.proficiencyChanges) {
      if (change.mechanicType === "armor" && change.mechanicValue) {
        finalArmorClass += Number(change.mechanicValue);
      }
    }
  }
''')
        break

with open('utils/combatantFactory.ts', 'w', encoding='utf-8') as f:
    f.writelines(lines)
