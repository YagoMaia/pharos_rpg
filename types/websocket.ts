// src/types/websocket.ts
import { Combatant } from "./rpg";

// Tipos de Eventos (Baseado no que você definiu no servidor)
export type WSEventType =
  | "JOIN_SESSION"
  | "UPDATE_COMBATANTS"
  | "SYNC_COMBAT_STATE"
  | "PLAYER_ACTION";

// Estrutura Base da Mensagem
export interface WSMessage {
  type: WSEventType;
  payload: any;
}

// Mensagem Específica: JOIN_SESSION
export interface JoinSessionPayload {
  roomCode: string; // Se você usar salas
  combatant: Combatant; // O resultado do playerToCombatant
}
