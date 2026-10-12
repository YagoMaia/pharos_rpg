import { FEATS_DATA } from "../data/progression";
import { AttributeName, Character, Feat } from "../types/rpg";

export const FEAT_LEVELS = [3, 7, 10, 13] as const;
export const FEAT_ATTRIBUTES: AttributeName[] = ["Força", "Destreza", "Constituição", "Inteligência", "Sabedoria", "Carisma"];

export function migrateFeats(character: Character): Character {
  const occupied = new Set<number>();
  const reserved = new Set((character.feats ?? []).map((feat) => feat.slotLevel));
  const ids = new Set<string>();
  const feats = (character.feats ?? []).map((feat) => {
    const slotLevel = ids.has(feat.id) || feat.slotLevel === null ? null :
      FEAT_LEVELS.some((level) => level === feat.slotLevel) && !occupied.has(feat.slotLevel!)
        ? feat.slotLevel : feat.slotLevel === undefined
          ? FEAT_LEVELS.find((level) => !occupied.has(level) && !reserved.has(level)) ?? null : null;
    if (slotLevel) occupied.add(slotLevel);
    ids.add(feat.id);
    return { ...feat, slotLevel, manualBenefits: feat.manualBenefits ?? true };
  });
  return reconcileFeatBenefits({ ...character, feats });
}

export function activeFeats(character: Pick<Character, "level" | "feats">): Feat[] {
  const slots = new Set<number>();
  const ids = new Set<string>();
  return (character.feats ?? []).filter((feat, index) => {
    const slot = feat.slotLevel === undefined ? FEAT_LEVELS[index] : feat.slotLevel;
    if (slot == null || !FEAT_LEVELS.some((level) => level === slot) || character.level < slot || slots.has(slot) || ids.has(feat.id)) return false;
    slots.add(slot);
    ids.add(feat.id);
    return true;
  });
}

function attributeTargets(feat: Feat): AttributeName[] {
  return feat.id === "vigoroso" ? ["Constituição"] :
    feat.id === "ator" ? ["Carisma"] : feat.id === "poliglota" ? ["Inteligência"] :
    feat.id === "habilidoso" ? [...new Set(feat.attributeChoices ?? [])].filter((name) => FEAT_ATTRIBUTES.includes(name)).slice(0, 2) : [];
}

export function reconcileFeatBenefits(character: Character): Character {
  const previous = character.featBonuses ?? { attributes: {}, hp: 0 };
  const bonuses: Character["featBonuses"] = { attributes: {}, hp: 0 };
  const attributes = { ...character.attributes };
  for (const name of FEAT_ATTRIBUTES) {
    const attr = attributes[name];
    if (attr) attributes[name] = { ...attr, value: attr.value - (previous.attributes[name] ?? 0) };
  }
  for (const feat of activeFeats(character)) {
    if (feat.manualBenefits !== false) continue;
    for (const name of attributeTargets(feat)) {
      if (!attributes[name] || attributes[name].value >= 18) continue;
      attributes[name] = { ...attributes[name], value: attributes[name].value + 1 };
      bonuses.attributes[name] = (bonuses.attributes[name] ?? 0) + 1;
    }
    if (feat.id === "vigoroso") bonuses.hp += character.level;
  }
  for (const name of FEAT_ATTRIBUTES) {
    if (attributes[name]) attributes[name] = { ...attributes[name], modifier: Math.floor((attributes[name].value - 10) / 2) };
  }
  const maxHp = Math.max(1, character.stats.hp.max - previous.hp + bonuses.hp);
  return { ...character, attributes, featBonuses: bonuses, stats: {
    ...character.stats, hp: { current: Math.min(character.stats.hp.current, maxHp), max: maxHp },
  } };
}

// A edição da ficha recebe o total exibido, incluindo os bônus automáticos.
export function setFeatAttributeValue(character: Character, name: AttributeName, total: number): Character {
  if (character.attributes[name].value === total) return character;
  const requestedBonus = activeFeats(character).filter((feat) => feat.manualBenefits === false && attributeTargets(feat).includes(name)).length;
  const base = Math.max(0, total - (total <= 18 ? requestedBonus : 0));
  return reconcileFeatBenefits({ ...character,
    attributes: { ...character.attributes, [name]: { ...character.attributes[name], value: base } },
    featBonuses: { hp: character.featBonuses?.hp ?? 0,
      attributes: { ...character.featBonuses?.attributes, [name]: 0 } },
  });
}

export function addCharacterFeat(character: Character, requested: Feat, slotLevel: number, choices: AttributeName[] = []): Character {
  const feat = FEATS_DATA.find((item) => item.id === requested.id);
  if (!feat || !FEAT_LEVELS.some((level) => level === slotLevel) || character.level < slotLevel ||
    (character.feats ?? []).some((item, index) => item.id === feat.id ||
      (item.slotLevel === undefined ? FEAT_LEVELS[index] : item.slotLevel) === slotLevel)) return character;
  if (feat.id === "habilidoso" && (choices.length !== 2 || new Set(choices).size !== 2 ||
    choices.some((name) => !FEAT_ATTRIBUTES.includes(name)))) return character;
  return reconcileFeatBenefits({ ...character, feats: [...(character.feats ?? []), {
    ...feat, slotLevel, attributeChoices: feat.id === "habilidoso" ? choices : undefined, manualBenefits: false,
  }] });
}

export function removeCharacterFeat(character: Character, id: string): Character {
  return reconcileFeatBenefits({ ...character, feats: character.feats.filter((feat) => feat.id !== id) });
}

export function initiativeBonus(character: Character): number {
  return (character.attributes["Destreza"]?.modifier ?? 0) +
    (activeFeats(character).some((feat) => feat.id === "iniciativa") ? character.attributes["Sabedoria"]?.modifier ?? 0 : 0);
}

export function featAutomationLabel(feat: Feat): string {
  if (feat.id === "iniciativa") return "Automático: SAB na rolagem de iniciativa. Surpresa: resolução manual.";
  if (feat.manualBenefits !== false && ["vigoroso", "habilidoso", "ator", "poliglota"].includes(feat.id)) {
    return "Ficha antiga: bônus numéricos manuais. Para automatizar, desfaça esses ajustes na ficha e remova/selecione novamente a façanha.";
  }
  if (feat.id === "vigoroso") return "Automático: +1 CON (máx. 18) e +1 PV máximo por nível. Não cura PV atuais.";
  if (feat.id === "habilidoso") return `Automático: +1 em ${feat.attributeChoices?.join(" e ") || "dois atributos escolhidos"} (máx. 18).`;
  if (feat.id === "ator" || feat.id === "poliglota") return "Automático: +1 no atributo (máx. 18). Demais benefícios: resolução manual.";
  return "Benefícios e condições de uso: resolução manual durante a partida.";
}
