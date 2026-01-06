// src/types/rpg.ts

export type AttributeName = 'Constituição' | 'Força' | 'Carisma' | 'Sabedoria' | 'Inteligência' | 'Destreza';

export type CharacterClass = 'Guerreiro' | 'Corsário' | 'Vanguarda' | 'Mago' | 'Apóstata' | 'Atirador' | 'Orador';

export const MAGIC_CLASSES: CharacterClass[] = ['Mago', 'Apóstata', 'Orador'];

export interface Attribute {
  name: AttributeName;
  value: number;
  modifier: number; // Ex: (Valor - 10) / 2
}

export interface Skill {
  id: string;
  name: string;
  cost: number;
  actionType: 'Padrão' | 'Movimento' | 'Reação' | 'Completa' | 'Livre';
  description: string;
}

export interface Stance {
  id: string;
  name: string;
  benefit: string;      // Benefício
  restriction: string;  // Restrição
  maneuver: string;     // Manobra de Postura
  recovery?: string;    // Recuperação (Opcional)
}

// src/types/rpg.ts

// Adicione este tipo
export type ItemType = 'consumable' | 'equipment' | 'key';

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

export interface Character {
  name: string;
  image?: string; // <--- Novo campo para guardar a imagem (Base64)
  class: CharacterClass;
  ancestry: {
    name: string;
    trait: string; // Traço/Proficiência
  };
  culturalOrigin: {
    name: string;
    heritages: string[]; // Heranças/Línguas
  };
  stats: {
    hp: { current: number; max: number };
    focus: { current: number; max: number };
  };
  attributes: Record<AttributeName, Attribute>;
  stances: [Stance, Stance]; // Exatamente 2 posturas
  currentStanceIndex: 0 | 1;
  skills: Skill[]; // Exatamente 4 habilidades
  equipment: {
    meleeWeapon: string;
    rangedWeapon: string;
    armor: string;
  };
  backpack: Item[];
  grimoire?: Spell[]; // Opcional, apenas para classes mágicas
  silver: number
}

