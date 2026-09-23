import os

with open('utils/combatantFactory.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Substituir 'stances: npc.stances,' por 'stances: [...(npc.stances || []), ...(npc.specialization?.newStances || [])],'
if 'stances: npc.stances,' in content:
    content = content.replace('stances: npc.stances,', 'stances: [...(npc.stances || []), ...(npc.specialization?.newStances || [])],')

with open('utils/combatantFactory.ts', 'w', encoding='utf-8') as f:
    f.write(content)
