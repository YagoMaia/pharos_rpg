import type { CampaignEncounterMonster } from "@/services/campaignApi";
import type { Combatant, NpcTemplate } from "@/types/rpg";

/** Valida a quantidade antes de preparar inimigos; por exemplo, "3" resulta em 3. */
export function bestiaryCount(value: string): number | null {
  if (!/^[0-9]+$/.test(value)) return null;
  const count = Number(value);
  return Number.isSafeInteger(count) && count > 0 && count <= 100 ? count : null;
}

/** Copia a ficha para o encontro sem vincular alterações futuras à biblioteca. */
export function bestiaryEncounterMonster(
  npc: NpcTemplate, count: number, combatant: Combatant,
): CampaignEncounterMonster {
  return JSON.parse(JSON.stringify({
    name: npc.name, count, hp: npc.maxHp, ac: combatant.armorClass,
    initiativeBonus: npc.initiativeBonus, attributes: combatant.attributes,
    weapons: combatant.weapons, skills: combatant.skills, stances: combatant.stances,
    bestiarySnapshot: npc,
  })) as CampaignEncounterMonster;
}
