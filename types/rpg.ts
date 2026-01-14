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
  level: number;
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
  type: ItemType;
  weight: number;
}

export interface EquipmentItem {
  name: string;
  stats: string;
  defense?: number;
  description?: string;
  weight: number;
}

export interface Spell {
  id: string;
  name: string;
  school: string;
  circle: number;
  description: string;
  effect: string;
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

  turnActions: {
    standard: boolean;
    bonus: boolean;
    reaction: boolean;
  };
}

// export interface NpcTemplate {
//   id: string;
//   name: string;
//   maxHp: number;
//   armorClass: number; // Útil para o mestre
//   notes: string;
// }

// ATUALIZE O COMBATANT ASSIM:
export interface Combatant {
  id: string;
  name: string;
  baseName: string;
  initiative: number;
  hp: {
    current: number;
    max: number;
  };
  type: "player" | "npc";

  // Detalhes
  armorClass: number;
  maxFocus: number;
  currentFocus: number;
  attributes?: Attributes;
  equipment?: string;
  actions?: string; // Esse continua string (texto livre)

  // MUDANÇA AQUI: De 'string' para 'Array'
  stances?: NpcStance[];
  skills?: NpcSkill[];

  activeStanceId?: string | null; // ID da postura ativa
}

export interface Attributes {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface NpcStance {
  id: string;
  name: string; // Ex: "Defensiva"
  acBonus: number; // Ex: 2 (Isso é o que importa pro cálculo)
  description: string;
}

export interface NpcSkill {
  id: string;
  name: string; // Ex: "Ataque Brutal"
  cost: number; // Ex: 2 (Para descontar do foco)
  description: string;
}

export interface NpcTemplate {
  id: string;
  name: string;
  subline: string;

  // Stats
  maxHp: number;
  armorClass: number; // CA Base (sem postura)
  maxFocus: number;

  attributes: Attributes; // Reutilizando do Player (str, dex...)

  // Agora são Arrays estruturados, não mais strings gigantes
  stances: NpcStance[];
  skills: NpcSkill[];

  // Mantemos equipamentos/ações como texto pois variam muito
  equipment: string;
  actions: string;

  // Iniciativa e Deslocamento
  initiativeBonus: number;
  speed: string;
}

// Exemplo de tipos para o futuro WebSocket

export type WebSocketEvent =
  | {
      type: "JOIN_SESSION";
      payload: { sessionId: string; character: Character };
    }
  | { type: "UPDATE_HP"; payload: { combatantId: string; newHp: number } }
  | {
      type: "CHANGE_STANCE";
      payload: { combatantId: string; stanceId: string; newAC: number };
    }
  | { type: "NEXT_TURN"; payload: { currentInitiative: number } };
