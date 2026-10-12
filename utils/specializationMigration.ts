import { SPECIALIZATIONS } from "../data/specializationsData";
import { Character, Specialization } from "../types/rpg";

const LEGACY_IDS: Record<string, string> = {
  guerreiro_encouracado: "gue_encouracado",
  guerreiro_espada_escudo: "gue_espada_escudo",
  vanguarda_flanqueador: "van_flanqueador",
  vanguarda_lanceiro: "van_lanceiro",
  vanguarda_distraidor: "van_distraidor",
  mago_glifista: "mag_glifista",
  mago_artificista: "mag_artificista",
  corsario_espada: "cor_espada",
  corsario_bacamarte: "cor_bacamarte",
};

export function migrateSpecialization(character: Character): Character {
  const old = character.specialization;
  if (!old) return character;
  const canonical = SPECIALIZATIONS[LEGACY_IDS[old.id] ?? old.id];
  const changes: unknown = old.proficiencyChanges;
  // Especializações retiradas do catálogo continuam na ficha com suas regras originais.
  const specialization: Specialization = canonical ?? {
    ...old,
    newStances: old.newStances ?? [],
    proficiencyChanges: Array.isArray(changes) ? changes : typeof changes === "string"
      ? [{ name: "Proficiências", description: changes }] : [],
  };
  const replacingStances = canonical && canonical.id !== old.id;
  const stances = replacingStances ? canonical.newStances : character.stances;
  // Atualiza metadados mecânicos de posturas atuais sem apagar posturas customizadas.
  const currentStances = stances.map((stance) =>
    canonical?.newStances.find((s) => s.id === stance.id) ?? stance);
  return {
    ...character,
    specialization,
    stances: currentStances,
    currentStanceIndex: replacingStances ? -1 : character.currentStanceIndex,
  };
}
