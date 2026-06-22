// types/campaign.ts

export type GameSystem = "Pharos" | "D&D 5e" | "Tormenta20" | "Call of Cthulhu" | "Outro";
export type CampaignStatus = "active" | "paused" | "finished";
export type CampaignVisibility = "open" | "private";

export interface Campaign {
  id: string;
  name: string;
  description: string;
  coverImage?: string;
  system: GameSystem;
  status: CampaignStatus;
  visibility: CampaignVisibility;
  accessCode: string;         // Código curto para os jogadores entrarem
  maxPlayers: number;
  createdAt: string;          // ISO 8601
  updatedAt: string;

  // Jogadores que aceitaram entrar
  playerIds: string[];        // IDs de jogadores (futuro: via auth)

  // Vinculações (muitos-para-muitos)
  linkedNpcIds: string[];
  linkedMonsterIds: string[];
  linkedItemIds: string[];
  linkedLocationIds: string[];

  notes: string;              // Notas do Mestre (markdown)
}

// ---- NPC ----
export type NpcRole = "Aliado" | "Antagonista" | "Neutro" | "Comerciante" | "Informante" | "Outro";

export interface NpcEntry {
  id: string;
  name: string;
  image?: string;
  role: NpcRole | string;
  description: string;
  appearance?: string;
  personality?: string;
  secrets?: string;           // Visível apenas para o Mestre
  tags: string[];
  linkedCampaignIds: string[];
  stats?: object;             // Compatível com NpcTemplate (types/rpg.ts)
  createdAt: string;
  updatedAt: string;
}

// ---- MONSTRO ----
export type MonsterType = "Besta" | "Morto-Vivo" | "Elemental" | "Humanoide" | "Aberração" | "Constructo" | "Dragão" | "Outro";
export type CreatureSize = "Miúdo" | "Pequeno" | "Médio" | "Grande" | "Enorme" | "Colossal";

export interface MonsterEntry {
  id: string;
  name: string;
  image?: string;
  type: MonsterType | string;
  cr: string;
  size: CreatureSize;
  environment?: string;
  description: string;
  tags: string[];
  linkedCampaignIds: string[];
  stats?: object;             // Compatível com NpcTemplate (types/rpg.ts)
  createdAt: string;
  updatedAt: string;
}

// ---- ITEM ----
export type ItemRarity = "Comum" | "Incomum" | "Raro" | "Épico" | "Lendário";
export type LibraryItemType = "Consumível" | "Equipamento" | "Chave" | "Mágico" | "Tesouro";

export interface ItemEntry {
  id: string;
  name: string;
  image?: string;
  type: LibraryItemType;
  rarity: ItemRarity;
  weight?: number;
  value?: string;             // Ex: "50 Pratas", "2 Ouros"
  description: string;
  properties?: string;        // Efeitos mágicos, propriedades especiais
  tags: string[];
  linkedCampaignIds: string[];
  createdAt: string;
  updatedAt: string;
}

// ---- LOCALIDADE ----
export type LocationType = "Cidade" | "Vila" | "Masmorra" | "Floresta" | "Ruínas" | "Taverna" | "Castelo" | "Outro";

export interface LocationEntry {
  id: string;
  name: string;
  image?: string;
  type: LocationType | string;
  region?: string;
  description: string;
  lore?: string;
  notableNpcIds?: string[];   // Referências a NpcEntry.id
  tags: string[];
  linkedCampaignIds: string[];
  createdAt: string;
  updatedAt: string;
}
