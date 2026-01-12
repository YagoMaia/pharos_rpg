// src/types/rpg.ts

export type AttributeName =
  | "Constituição"
  | "Força"
  | "Carisma"
  | "Sabedoria"
  | "Inteligência"
  | "Destreza";

export type CharacterClass =
  | "Guerreiro"
  | "Corsário"
  | "Vanguarda"
  | "Mago"
  | "Apóstata"
  | "Atirador"
  | "Orador";

export const MAGIC_CLASSES: CharacterClass[] = ["Mago", "Apóstata", "Orador"];

export const ALL_CLASSES: CharacterClass[] = [
  "Guerreiro",
  "Corsário",
  "Vanguarda",
  "Mago",
  "Apóstata",
  "Atirador",
  "Orador",
];

export interface Attribute {
  name: AttributeName;
  value: number;
  modifier: number; // Ex: (Valor - 10) / 2
}

export type ActionType =
  | "Padrão"
  | "Movimento"
  | "Reação"
  | "Completa"
  | "Livre"
  | "Ação Bônus";

export interface Skill {
  id: string;
  name: string;
  cost: number;
  actionType: ActionType;
  description: string;
}

export interface Stance {
  id: string;
  name: string;
  benefit: string; // Benefício
  restriction: string; // Restrição
  maneuver: string; // Manobra de Postura
  recovery?: string; // Recuperação (Opcional)
}

// src/types/rpg.ts

// Adicione este tipo
export type ItemType = "consumable" | "equipment" | "key";

export interface Item {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  type: ItemType; // Substitui ou complementa o isKeyItem
}

export interface Spell {
  id: string;
  name: string;
  school: string;
  circle: number;
  description: string;
  effect: string;
}

export interface EquipmentItem {
  name: string;
  stats: string; // Usado para Armas (ex: "1d6")
  defense?: number; // Usado para Armadura/Escudo (ex: 2)
  description?: string; // Descrição opcional
}
export const ALL_SKILLS = [
  "Atletismo",
  "Acrobacia",
  "Furtividade",
  "Ladinagem",
  "Pilotagem",
  "Arcanismo",
  "Engenharia",
  "História",
  "Investigação",
  "Natureza",
  "Navegação",
  "Ocultismo",
  "Religião",
  "Adestrar Animais",
  "Intuição",
  "Medicina",
  "Percepção",
  "Sobrevivência",
  "Atuação",
  "Enganação",
  "Etiqueta",
  "Intimidação",
  "Manha",
  "Persuasão",
  "Concentração",
  "Ofício",
];

export interface Character {
  name: string;
  level: number;
  image?: string;

  // ADICIONE '?' PARA TORNAR OPCIONAL
  class?: CharacterClass;

  // AGORA PODE SER UNDEFINED
  ancestry?: {
    id: string;
    name: string;
    traitName: string;
    traitDescription: string;
  };

  culturalOrigin?: {
    id: string;
    name: string;
    culturalTrait: string;
    heritage: string;
    languages: string[];
  };

  stats: {
    hp: { current: number; max: number };
    focus: { current: number; max: number };
  };

  attributes: Record<AttributeName, Attribute>;

  // MUDE DE [Stance, Stance] PARA Stance[] (Array flexível)
  stances: Stance[];

  // PERMITE -1 PARA POSTURA NEUTRA
  currentStanceIndex: number;

  skills: Skill[];

  // EQUIPAMENTO PRECISA EXISTIR, MAS PODE ESTAR "VAZIO"
  equipment: {
    meleeWeapon: EquipmentItem;
    rangedWeapon: EquipmentItem;
    armor: EquipmentItem;
    shield: EquipmentItem;
  };

  backpack: Item[];
  grimoire?: Spell[];
  silver: number;
  backstory: string;
  trainedSkills: string[];

  deathSaves: {
    successes: number;
    failures: number;
  };
}
