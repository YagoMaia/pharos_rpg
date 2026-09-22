import { Combatant, Stance } from "../types/rpg";

export function stanceArmorBonus(stance: Stance | null | undefined, actor: Pick<Combatant, "attributes">): number {
  return (stance?.acBonus ?? 0) + (stance?.acAttribute
    ? actor.attributes[stance.acAttribute]?.modifier ?? 0
    : 0);
}

export function advanceCombatantPhase(actor: Combatant): Combatant {
  const index = actor.currentPhaseIndex ?? 0;
  const phase = actor.phases?.[index];
  if (actor.type !== "npc" || !phase) return actor;
  const stance = actor.stances.find((s) => s.id === actor.activeStanceId);
  const maxHp = phase.maxHp ?? actor.hp.max;
  return {
    ...actor,
    name: phase.name ?? actor.name,
    image: phase.image ?? actor.image,
    hp: { current: maxHp, max: maxHp },
    armorClass: phase.armorClass ?? actor.armorClass - stanceArmorBonus(stance, actor),
    activeStanceId: null,
    stances: phase.stances ?? actor.stances,
    skills: phase.skills ?? actor.skills,
    weapons: phase.weapons ?? actor.weapons,
    deathSaves: { successes: 0, failures: 0 },
    currentPhaseIndex: index + 1,
    // Foco, condições e ações são preservados, assim como no servidor.
  };
}

export function advanceCombatTurn(combatants: Combatant[], activeTurnId: string | null) {
  const sorted = [...combatants].sort((a, b) => b.initiative - a.initiative);
  const start = sorted.findIndex((c) => c.id === activeTurnId);
  const remaining = sorted.filter((c) => c.type !== "npc" || c.hp.current > 0 ||
    (c.currentPhaseIndex ?? 0) < (c.phases?.length ?? 0));
  for (let offset = 1; offset <= sorted.length; offset++) {
    const actor = sorted[(start + offset) % sorted.length];
    if (actor.hp.current <= 0 && (actor.type !== "player" ||
      actor.deathSaves.failures >= 3 || actor.deathSaves.successes >= 3)) continue;
    const conditions = (actor.conditions ?? []).map((c) => c.durationTurns == null
      ? c : { ...c, durationTurns: c.durationTurns - 1 })
      .filter((c) => c.durationTurns == null || c.durationTurns > 0);
    const blocked = conditions.some((c) => ["Incapacitado", "Paralisado", "Atordoado"].includes(c.name));
    const updated = {
      ...actor,
      conditions,
      turnActions: {
        standard: !blocked,
        bonus: !blocked && actor.hp.current > 0,
        reaction: !blocked && actor.hp.current > 0,
      },
    };
    return { combatants: remaining.map((c) => c.id === actor.id ? updated : c), activeTurnId: actor.id };
  }
  return { combatants: remaining, activeTurnId: null };
}
