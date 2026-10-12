// src/types/websocket.ts
import { Combatant } from "./rpg";

// Tipos de Eventos (Baseado no que você definiu no servidor)
export type WSEventType =
  | "JOIN_SESSION"
  | "JOIN_SESSION_WITH_PET"
  | "UPDATE_COMBATANTS"
  | "SYNC_COMBAT_STATE"
  | "PLAYER_ACTION"
  | "APPLY_CONDITION"
  | "REMOVE_CONDITION";

// Estrutura Base da Mensagem
export interface WSMessage {
  type: WSEventType;
  payload: any;
}

// Mensagem Específica: JOIN_SESSION (um combatente)
export interface JoinSessionPayload {
  roomCode: string;
  combatant: Combatant;
}

// Mensagem Específica: JOIN_SESSION_WITH_PET (personagem + pet)
export interface JoinSessionWithPetPayload {
  roomCode: string;
  combatant: Combatant; // Personagem principal
  pet: Combatant; // Monstro companheiro
}
