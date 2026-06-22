// types/player.ts

export type JoinStatus = "active" | "pending" | "rejected" | "removed";

export interface CampaignMembership {
  campaignId: string;
  characterId: string;       // Qual personagem o jogador usa nesta campanha
  joinedAt: string;          // ISO 8601
  status: JoinStatus;
  // Metadados da campanha (cache local para evitar buscas)
  campaignName: string;
  campaignSystem: string;
  gmName: string;
  lastActivity: string;
  campaignStatus: "Ativa" | "Pausada" | "Encerrada";
}

export interface PlayerProfile {
  id: string;
  displayName: string;
  avatarUrl?: string;
  characters: string[];      // IDs dos personagens (Character.id via CharacterContext)
  activeCharacterId?: string;
  memberships: CampaignMembership[];
  createdAt: string;
}
