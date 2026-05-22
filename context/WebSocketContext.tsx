import { playerToCombatant } from "@/utils/combatantFactory";
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";
import { Combatant, GameEvent } from "../types/rpg";
import { useCampaign } from "./CampaignContext";
import { useCharacter } from "./CharacterContext";

interface WebSocketMessage {
  type: string;
  payload?: any;
  error?: string;
  combatants?: Record<string, Combatant>;
  turn_order?: string[];
  turn_index?: number;
  logs?: string[];
  last_event?: GameEvent;
}

interface WebSocketContextType {
  isConnected: boolean;
  disconnect: () => void;
  joinSession: (ip: string, sessionId: string, initiative: number, petInitiative?: number) => void;
  sendMessage: (type: string, payload: any) => void;
  connectToRoute: (
    ip: string,
    sessionId: string,
    initialData: Combatant | any,
  ) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined,
);

export const WebSocketProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  const { character } = useCharacter();
  const {
    setCombatants,
    setActiveTurnId,
    addLog,
    setLogs,
    setLastEvent,
    updateCombatant,
  } = useCampaign();

  const handleServerMessage = useCallback((data: WebSocketMessage) => {
    if (data.error) {
      Alert.alert("Erro do Servidor", data.error);
      return;
    }

    // 1. SINCRONIZAÇÃO TOTAL (Snapshot)
    if (data.combatants && data.turn_order) {
      const sortedCombatants = data.turn_order
        .map((id: string) => data.combatants![id])
        .filter((c: Combatant) => c !== undefined);

      setCombatants(sortedCombatants);

      if (typeof data.turn_index === "number") {
        setActiveTurnId(data.turn_order[data.turn_index]);
      }

      if (data.logs && Array.isArray(data.logs)) {
        setLogs(data.logs);
      }

      if (data.last_event) {
        setLastEvent(data.last_event);
      }
      return;
    }

    // 2. PROCESSAMENTO DE DELTAS
    const { type, payload } = data;
    if (!type || !payload) return;

    switch (type) {
      case "HP_UPDATE":
        updateCombatant(payload.combatantId, {
          hp: { current: payload.newHp },
        });
        if (payload.log) addLog(payload.log);
        break;

      case "FOCUS_UPDATE":
        updateCombatant(payload.combatantId, {
          focus: { current: payload.newFocus },
        });
        if (payload.log) addLog(payload.log);
        break;

      case "STANCE_UPDATE":
        updateCombatant(payload.combatantId, {
          activeStanceId: payload.activeStanceId,
          armorClass: payload.newAC,
          turnActions: payload.turnActions,
        });
        if (payload.log) addLog(payload.log);
        break;

      case "ACTION_RESOLVED":
        if (payload.targetId && payload.targetHp !== undefined) {
          updateCombatant(payload.targetId, {
            hp: { current: payload.targetHp },
          });
        }

        updateCombatant(payload.attackerId, {
          turnActions: payload.attackerActions,
          focus: { current: payload.attackerFocus },
        });

        setLastEvent({
          id: Date.now(),
          type: payload.type,
          target_id: payload.targetId,
          attacker_name: payload.attackerId,
          skill_name: payload.actionName,
          value: payload.value,
        });

        if (payload.log) addLog(payload.log);
        break;

      case "TURN_UPDATE":
        setActiveTurnId(payload.newActiveId);
        if (payload.log) addLog(payload.log);
        break;
      
      default:
        console.warn(`Mensagem WebSocket não tratada: ${type}`);
    }
  }, [setCombatants, setActiveTurnId, setLogs, setLastEvent, updateCombatant, addLog]);

  const connectToRoute = useCallback((
    inputIp: string,
    sessionId: string,
    initialData: any,
    petData?: Combatant | null,
  ) => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    let host = inputIp
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/^wss?:\/\//, "")
      .replace(/\/$/, "");

    if (!host.includes(":")) {
      host = `${host}:8000`;
    }

    const wsUrl = `ws://${host}/ws/${sessionId}`;
    console.log("🔌 Conectando ao RPG Server:", wsUrl);

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        const eventType =
          initialData.type === "gm" ? "GM_CONNECT" : "JOIN_SESSION";
        
        const payload: any = { roomCode: sessionId, combatant: initialData };
        
        // Se tem pet, envia junto
        if (petData) {
          payload.pet = petData;
        }
        
        ws.send(
          JSON.stringify({
            type: eventType,
            payload,
          }),
        );
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleServerMessage(message);
        } catch (err) {
          console.error("Erro no Parse do WebSocket:", err);
        }
      };

      ws.onclose = () => setIsConnected(false);
      ws.onerror = (e: any) => {
        console.log("⚠️ WebSocket Error:", e.message);
        setIsConnected(false);
      };
    } catch (error) {
      Alert.alert("Erro", "Não foi possível criar a conexão.");
    }
  }, [handleServerMessage]);

  const disconnect = useCallback(() => {
    socketRef.current?.close();
    socketRef.current = null;
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((type: string, payload: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, payload }));
    } else {
      console.warn("WebSocket não está aberto. Mensagem não enviada:", type);
    }
  }, []);

  const joinSession = useCallback((ip: string, sessionId: string, initiative: number, petInitiative?: number) => {
    if (!character.name) return Alert.alert("Erro", "Personagem sem nome.");
    const combatantData = playerToCombatant(character, initiative);
    
    // Se o personagem tem pet, converte e envia junto
    let petData: Combatant | null = null;
    if (character.pet) {
      const petInit = petInitiative ?? Math.max(0, initiative - 1); // Pet age logo após o dono por padrão
      petData = petToCombatant(character.pet, character.name, petInit);
    }
    
    connectToRoute(ip, sessionId, combatantData, petData);
  }, [character, connectToRoute]);

  const contextValue = useMemo(() => ({
    isConnected,
    disconnect,
    joinSession,
    sendMessage,
    connectToRoute,
  }), [isConnected, disconnect, joinSession, sendMessage, connectToRoute]);

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};
