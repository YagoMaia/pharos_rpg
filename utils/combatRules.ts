import { AttributeName, Combatant, CombatWeaponData, Stance } from "../types/rpg";

export function weaponDamageFormula(weapon: CombatWeaponData, attributeModifier: number): string {
  // Fórmulas legadas com parcela fixa já eram usadas como dano total. O campo
  // explícito permite distinguir esse caso de dados com bônus próprios da arma.
  const includesAttribute = weapon.damageIncludesAttribute ?? /[+-]\s*\d+\s*$/.test(weapon.damage);
  const bonus = (includesAttribute ? 0 : attributeModifier) + (weapon.damageBonus ?? 0);
  return `${weapon.damage}${bonus > 0 ? `+${bonus}` : bonus < 0 ? bonus : ""}`;
}

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
    baseArmorClass: phase.armorClass ?? actor.armorClass - stanceArmorBonus(stance, actor),
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

export function calculateSaveDC(
  attacker: { level?: number; attributes: Record<string, { modifier?: number } | undefined> },
  attributeName?: AttributeName,
): number {
  const level = attacker.level ?? 1;
  const prof = Math.max(2, Math.floor((level - 1) / 4) + 2);
  if (attributeName && attacker.attributes[attributeName]?.modifier !== undefined) {
    return 8 + prof + (attacker.attributes[attributeName]?.modifier ?? 0);
  }
  const relevantAttributes: AttributeName[] = [
    "Inteligência",
    "Sabedoria",
    "Carisma",
    "Destreza",
    "Força",
  ];
  const mods = relevantAttributes.map(
    (attr) => attacker.attributes[attr]?.modifier ?? 0,
  );
  const bestMod = mods.length > 0 ? Math.max(...mods) : 0;
  return 8 + prof + bestMod;
}

export function getTargetSaveModifier(
  target: { attributes: Record<string, { modifier?: number } | undefined> },
  attributeName: AttributeName,
): number {
  return target.attributes[attributeName]?.modifier ?? 0;
}

export interface SavingThrowResult {
  roll: number;
  modifier: number;
  total: number;
  passed: boolean;
  isCritSuccess: boolean;
  isCritFail: boolean;
}

export function resolveSavingThrow(
  target: { attributes: Record<string, { modifier?: number } | undefined> },
  attributeName: AttributeName,
  saveDC: number,
  rollResult: number,
): SavingThrowResult {
  const modifier = getTargetSaveModifier(target, attributeName);
  const total = rollResult + modifier;
  const isCritSuccess = rollResult === 20;
  const isCritFail = rollResult === 1;
  const passed = isCritSuccess || (!isCritFail && total >= saveDC);
  return {
    roll: rollResult,
    modifier,
    total,
    passed,
    isCritSuccess,
    isCritFail,
  };
}

export function calculateAreaDamage(
  baseDamage: number,
  passed: boolean,
  halfOnSave: boolean = true,
): number {
  if (passed) {
    return halfOnSave ? Math.floor(baseDamage / 2) : 0;
  }
  return baseDamage;
}

export interface AreaTargetResolution {
  targetId: string;
  roll: number;
  modifier: number;
  total: number;
  passed: boolean;
  damageAmount: number;
  healingAmount: number;
}

export function resolveAreaAttackTargets(
  targets: Array<{
    combatant: { id: string; attributes: Record<string, { modifier?: number } | undefined> };
    roll: number;
    customDamage?: number;
  }>,
  attributeName: AttributeName,
  saveDC: number,
  baseDamage: number,
  halfOnSave: boolean = true,
): AreaTargetResolution[] {
  return targets.map((t) => {
    const saveRes = resolveSavingThrow(t.combatant, attributeName, saveDC, t.roll);
    const damageAmount =
      t.customDamage !== undefined
        ? t.customDamage
        : calculateAreaDamage(baseDamage, saveRes.passed, halfOnSave);
    return {
      targetId: t.combatant.id,
      roll: t.roll,
      modifier: saveRes.modifier,
      total: saveRes.total,
      passed: saveRes.passed,
      damageAmount: Math.max(0, damageAmount),
      healingAmount: 0,
    };
  });
}

