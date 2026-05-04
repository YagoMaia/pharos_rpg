import { Combatant, Skill } from "../types/rpg";
import { rollDiceString } from "./diceUtils";

export interface SkillExecutionResult {
  total: number;
  formula: string;
  log: string;
  type: "damage" | "healing";
}

export const calculateSkillDamage = (
  skill: Skill,
  attacker: Combatant,
): SkillExecutionResult => {
  let totalValue = 0;
  let formulaParts: string[] = [];
  let logDetails: string[] = [];

  // 1. Lógica de Cura
  if (skill.isHealing && skill.healFormula) {
    const healRoll = rollDiceString(skill.healFormula, false, attacker.attributes);
    return {
      total: healRoll.total,
      formula: skill.healFormula,
      log: `Cura: ${healRoll.total} [${healRoll.detailedLog || skill.healFormula}]`,
      type: "healing",
    };
  }

  // 2. Dano Base da Arma (se a skill usar)
  if (skill.usesWeaponDamage) {
    let selectedWeapon = attacker.weapons?.melee;

    if (skill.weaponType === "ranged") {
      selectedWeapon = attacker.weapons?.ranged;
    }

    if (selectedWeapon) {
      const weaponRoll = rollDiceString(selectedWeapon.damage, false, attacker.attributes);
      const attrName = selectedWeapon.attribute;
      const attrMod = attacker.attributes[attrName]?.modifier || 0;
      const attackBonus = selectedWeapon.attackBonus || 0;

      totalValue += weaponRoll.total + attrMod + attackBonus;

      formulaParts.push(selectedWeapon.damage);
      formulaParts.push(`${attrName.substring(0, 3).toUpperCase()}`);
      if (attackBonus !== 0) formulaParts.push(attackBonus.toString());

      logDetails.push(`${selectedWeapon.name} (${weaponRoll.total})`);
      logDetails.push(`${attrName.substring(0, 3).toUpperCase()} (${attrMod})`);
      if (attackBonus !== 0) logDetails.push(`Bônus (${attackBonus})`);
    } else {
      // Fallback: Desarmado (1 + Força)
      const strMod = attacker.attributes["Força"]?.modifier || 0;
      totalValue += 1 + strMod;

      formulaParts.push("1");
      formulaParts.push("FOR");
      logDetails.push(`Desarmado (1) + FOR (${strMod})`);
    }
  }

  // 3. Dano Bônus da Skill
  if (skill.bonusDamage) {
    const bonusRoll = rollDiceString(skill.bonusDamage, false, attacker.attributes);
    totalValue += bonusRoll.total;

    formulaParts.push(skill.bonusDamage);
    logDetails.push(`${skill.name} (${bonusRoll.total})`);
  }

  return {
    total: Math.max(0, totalValue),
    formula: formulaParts.join(" + "),
    log: `Total: ${totalValue} [${logDetails.join(" + ")}]`,
    type: "damage",
  };
};
