import {
    Character,
    Combatant,
    CombatWeaponData,
    EquipmentItem,
    NpcTemplate,
    Pet
} from "@/types/rpg";
import { generateSafeId } from "@/utils/stringUtils";
import { migrateSpecialization } from "./specializationMigration";

const playerArmor = (char: Character) => {
  const dexMod = char.attributes["Destreza"].modifier || 0;
  const armorDef = char.equipment?.armor?.defense || 0;
  const shieldDef = char.equipment?.shield?.defense || 0;

  let ac = 0;
  if (armorDef === 0) {
    ac = 10 + dexMod;
  } else if (armorDef >= 16) {
    ac = armorDef;
  } else if (armorDef >= 13) {
    ac = armorDef + Math.min(dexMod, 2);
  } else {
    ac = armorDef + dexMod;
  }
  ac += shieldDef;

  const spec = char.specialization;
  if (Array.isArray(spec?.proficiencyChanges)) {
    for (const change of spec.proficiencyChanges) {
      if (change.mechanicType === "armor" &&
        (spec.id !== "gue_encouracado" || armorDef >= 16)) {
        const bonus = Number(change.mechanicValue);
        if (Number.isFinite(bonus)) ac += bonus;
      }
    }
  }
  if (hasSwordAndShieldBonus(char)) ac += 1;

  return ac;
};

const hasSwordAndShieldBonus = (char: Character) => {
  const weapon = char.equipment?.meleeWeapon;
  return char.specialization?.id === "gue_espada_escudo" &&
    (char.equipment?.shield?.defense ?? 0) > 0 &&
    /espada|sabre|rapieira|florete/i.test(weapon?.name ?? "") &&
    !/duas m[aã]os|2 m[aã]os/i.test(`${weapon?.name} ${weapon?.stats} ${weapon?.description}`);
};

const extractWeaponData = (
  item: EquipmentItem,
  defaultName: string,
  defaultDamage: string,
): CombatWeaponData => {
  const isFinesse = item.stats?.toLowerCase().includes("finesse");
  const isRanged =
    item.name !== "Desarmado" && item.range && item.range !== "Corpo a Corpo";

  // Lógica de atributo: Ranged/Finesse usa Destreza, resto Força
  let attr: "Força" | "Destreza" = "Força";
  if (isRanged || isFinesse) attr = "Destreza";

  let finalDamage = defaultDamage;

  if (item.damage) {
    // 1. Prioridade: Campo oficial de dano
    finalDamage = item.damage;
  } else if (item.stats && /\d+d\d+/.test(item.stats)) {
    // 2. Fallback: Se 'stats' parecer um dado (ex: "1d8+2"), usa ele
    // Isso resolve o seu caso atual onde o dano está em 'stats'
    finalDamage = item.stats;
  }

  return {
    name: item.name || defaultName,
    damage: finalDamage,
    attribute: attr,
    attackBonus: 0, // Implementar lógica de itens mágicos se houver
    range: item.range || "Corpo a Corpo",
  };
};

// --- CONVERSOR: PLAYER -> COMBATANT ---
export const playerToCombatant = (
  char: Character,
  initiativeRoll: number,
): Combatant => {
  char = migrateSpecialization(char);
  // Cria um resumo do equipamento para mostrar no combate
  const meleeData = extractWeaponData(
    char.equipment.meleeWeapon,
    "Soco",
    "1d4", // Dano base desarmado
  );

  const rangedData = extractWeaponData(
    char.equipment.rangedWeapon,
    "Pedra",
    "1d4",
  );

  if (hasSwordAndShieldBonus(char)) meleeData.damage += "+1";

  const baseCombatant: Combatant = {
    id: generateSafeId(char.name), // Player geralmente usa o próprio nome como ID único ou char.id
    name: char.name,
    baseName: char.name,
    type: "player",
    image: char.image,

    // Stats
    hp: { ...char.stats.hp },
    focus: { ...char.stats.focus },
    armorClass: playerArmor(char),
    initiative: initiativeRoll,

    // Listas
    attributes: char.attributes,
    stances: char.stances,
    activeStanceId: null, // Player começa sem postura ou usa char.currentStanceIndex se quiser persistir

    // Mapeamentos importantes
    skills: char.skills.filter((s) => !!s.id),
    spells: char.grimoire || [], // Mapeia Grimório para Spells

    // Inicializa estado de turno
    turnActions: { standard: true, bonus: true, reaction: true },
    deathSaves: { successes: 0, failures: 0 },

    weapons: {
      melee: meleeData,
      ranged: rangedData,
    },
    conditions: [],
  };

  return baseCombatant;
};

// --- CONVERSOR: NPC -> COMBATANT ---
export const npcToCombatant = (
  npc: NpcTemplate,
  initiativeRoll: number,
  instanceId: number = 1,
): Combatant => {
  // Gera nome único: "Goblin #1", "Goblin #2"
  const uniqueName = `${npc.name} #${instanceId}`;

  return {
    id: generateSafeId(uniqueName),
    name: uniqueName,
    image: npc.image,
    baseName: npc.name,
    type: "npc",

    // Stats (Copia direta do Template)
    hp: { current: npc.maxHp, max: npc.maxHp },
    focus: { current: npc.maxFocus, max: npc.maxFocus },
    armorClass: npc.armorClass,
    initiative: initiativeRoll,

    attributes: npc.attributes,
    stances: npc.stances,
    activeStanceId: null, // NPCs geralmente começam neutros

    skills: npc.skills,
    spells: npc.spells,

    phases: npc.phases,
    currentPhaseIndex: npc.phases && npc.phases.length > 0 ? 0 : undefined,

    turnActions: { standard: true, bonus: true, reaction: true },
    deathSaves: { successes: 0, failures: 0 },
    weapons: npc.weapons || {
      melee: {
        name: "Ataque Corpo-a-Corpo",
        damage: "1d4",
        attribute: "Força", // <--- Propriedade obrigatória
        attackBonus: 0, // <--- Propriedade obrigatória
        range: "1.5m", // <--- Propriedade obrigatória
      },
      ranged: {
        name: "Ataque à Distância",
        damage: "1d4",
        attribute: "Destreza", // <--- Propriedade obrigatória
        attackBonus: 0, // <--- Propriedade obrigatória
        range: "9m", // <--- Propriedade obrigatória
      },
    },

    conditions: [],
    // actionsDescription: npc.actions,
  };
};

// Função pura para converter a ficha do Jogador para o formato do Bestiário
export function mapPlayerToNpc(player: Character): Omit<NpcTemplate, "id"> {
  player = migrateSpecialization(player);
  // 1. Tratamento da Ancestralidade (Objeto -> String)
  const ancestryName = player.ancestry?.name || "Desconhecida";

  // 2. Sumarização de Equipamentos

  const meleeData = extractWeaponData(
    player.equipment.meleeWeapon,
    "Soco",
    "1d4", // Dano base desarmado
  );

  const rangedData = extractWeaponData(
    player.equipment.rangedWeapon,
    "Pedra",
    "1d4",
  );

  // 3. Condensação de Façanhas e Especialização no campo de "Ações"
  // const specText = player.specialization
  //   ? `Especialização: ${player.specialization.name}`
  //   : "";
  // const featsText = player.feats?.length
  //   ? `Façanhas: ${player.feats.map((f) => f.name).join(", ")}`
  //   : "";

  // 4. Cálculo base de Iniciativa e CA (Ajuste a matemática conforme o seu sistema)
  // Assumindo que o atributo tem uma propriedade 'value' ou é um número direto.
  const agiValue =
    (player.attributes as any)?.agility?.value ||
    (player.attributes as any)?.agility ||
    0;

  // Se o seu sistema usa modificador (ex: (Valor - 10) / 2), ajuste aqui:
  const initiativeBonus = Number(agiValue);


  // Cálculo do AC Base
  const baseAc = playerArmor(player);
  if (hasSwordAndShieldBonus(player)) meleeData.damage += "+1";

  return {
    name: `Player ${player.name}`,
    image: player.image || "",
    level: player.level || 1,
    class: player.class || "Nenhuma",
    ancestry: ancestryName,

    maxHp: player.stats?.hp?.max || 1,
    maxFocus: player.stats?.focus?.max || 0,

    armorClass: baseAc,
    acDetail: player.equipment?.armor?.name || "Sem armadura",
    speed: "9m",
    initiativeBonus: initiativeBonus,

    attributes: player.attributes,
    stances: player.stances || [],
    skills: player.skills || [],
    spells: player.spells || [],

    weapons: {
      melee: meleeData,
      ranged: rangedData,
    },
  };
}

// --- CONVERSOR: PET -> COMBATANT ---
export const petToCombatant = (
  pet: Pet,
  ownerName: string,
  initiativeRoll: number,
): Combatant => {
  const ownerId = generateSafeId(ownerName);

  return {
    id: generateSafeId(`${ownerName}_pet_${pet.name}`),
    name: `🐾 ${pet.name}`,
    baseName: pet.name,
    type: "pet",
    ownerId, // Vincula ao dono
    image: pet.image,

    hp: { current: pet.maxHp, max: pet.maxHp },
    focus: { current: pet.maxFocus, max: pet.maxFocus },
    armorClass: pet.armorClass,
    initiative: initiativeRoll,
    speed: pet.speed,

    attributes: pet.attributes,
    stances: pet.stances,
    activeStanceId: null,

    skills: pet.skills,
    spells: pet.spells,

    turnActions: { standard: true, bonus: true, reaction: true },
    deathSaves: { successes: 0, failures: 0 },
    weapons: pet.weapons || {
      melee: {
        name: "Mordida",
        damage: "1d6",
        attribute: "Força",
        attackBonus: 0,
        range: "1.5m",
      },
      ranged: {
        name: "Investida",
        damage: "1d4",
        attribute: "Destreza",
        attackBonus: 0,
        range: "4.5m",
      },
    },
    conditions: [],
  };
};
