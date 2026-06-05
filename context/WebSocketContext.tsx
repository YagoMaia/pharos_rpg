import { petToCombatant, playerToCombatant } from "@/utils/combatantFactory";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Alert, AppState } from "react-native";
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
    petData?: Combatant | null,
  ) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined,
);

const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY = 1000; // 1 segundo

export const WebSocketProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const intentionalClose = useRef(false);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);
  const pingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Guarda os dados da última conexão para reconexão
  const lastConnectionRef = useRef<{
    ip: string;
    sessionId: string;
    initialData: any;
    petData?: Combatant | null;
  } | null>(null);

  const { character } = useCharacter();
  const {
    setCombatants,
    setActiveTurnId,
    addLog,
    setLogs,
    setLastEvent,
    updateCombatant,
  } = useCampaign();

  // Limpa timers ao desmontar
  useEffect(() => {
    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (pingInterval.current) clearInterval(pingInterval.current);
    };
  }, []);

  // Reconecta quando o app volta do background
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (
        nextState === "active" &&
        !isConnected &&
        lastConnectionRef.current &&
        !intentionalClose.current
      ) {
        reconnectAttempts.current = 0;
        attemptReconnect();
      }
    });
    return () => subscription.remove();
  }, [isConnected]);

  const attemptReconnect = useCallback(() => {
    const conn = lastConnectionRef.current;
    if (!conn || intentionalClose.current) return;
    if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
      console.log("🔌 Máximo de tentativas de reconexão atingido.");
      return;
    }

    const delay = Math.min(
      BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts.current),
      30000,
    );

    console.log(`🔄 Reconectando em ${delay}ms (tentativa ${reconnectAttempts.current + 1}/${MAX_RECONNECT_ATTEMPTS})`);

    reconnectTimeout.current = setTimeout(() => {
      reconnectAttempts.current++;
      connectToRoute(conn.ip, conn.sessionId, conn.initialData, conn.petData);
    }, delay);
  }, []);

  const startPingInterval = useCallback(() => {
    if (pingInterval.current) clearInterval(pingInterval.current);
    pingInterval.current = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: "PING" }));
      }
    }, 25000); // Ping a cada 25s para manter a conexão viva
  }, []);

  const handleServerMessage = useCallback((data: WebSocketMessage) => {
    if (data.error) {
      Alert.alert("Erro do Servidor", data.error);
      return;
    }

    // Ignora pong do servidor (se implementado)
    if (data.type === "PONG") return;

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
        setLogs(data.logs.slice(-50));
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
        // Reseta as ações do novo ator ativo (usa o valor do servidor ou o padrão)
        updateCombatant(payload.newActiveId, {
          turnActions: payload.turnActions || {
            standard: true,
            bonus: true,
            reaction: true,
          },
        });
        if (payload.log) addLog(payload.log);
        break;

      case "DEATH_SAVE_UPDATE":
        updateCombatant(payload.combatantId, {
          deathSaves: {
            successes: payload.successes,
            failures: payload.failures,
          },
          hp: { current: payload.newHp },
          turnActions: payload.turnActions,
        });
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
    // Limpa reconexão pendente
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }

    if (socketRef.current) {
      socketRef.current.onclose = null; // Evita trigger de reconexão
      socketRef.current.close();
      socketRef.current = null;
    }

    intentionalClose.current = false;

    // Salva dados para reconexão futura
    lastConnectionRef.current = { ip: inputIp, sessionId, initialData, petData };

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
        reconnectAttempts.current = 0; // Reset ao conectar com sucesso
        startPingInterval();

        const eventType =
          initialData.type === "gm" ? "GM_CONNECT" : "JOIN_SESSION";
        
        const payload: any = { roomCode: sessionId, combatant: initialData };
        
        // Se tem pet, envia junto
        if (petData) {
          payload.pet = petData;
        }

        console.log("📤 Enviando para servidor:", eventType, "| Pet:", petData ? petData.name : "Nenhum");
        
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

      ws.onclose = () => {
        setIsConnected(false);
        if (pingInterval.current) clearInterval(pingInterval.current);

        // Tenta reconectar automaticamente se não foi intencional
        if (!intentionalClose.current) {
          attemptReconnect();
        }
      };

      ws.onerror = (e: any) => {
        console.log("⚠️ WebSocket Error:", e.message);
        // onclose será chamado em seguida, que cuidará da reconexão
      };
    } catch (error) {
      Alert.alert("Erro", "Não foi possível criar a conexão.");
    }
  }, [handleServerMessage, startPingInterval, attemptReconnect]);

  const disconnect = useCallback(() => {
    intentionalClose.current = true;
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    if (pingInterval.current) {
      clearInterval(pingInterval.current);
      pingInterval.current = null;
    }
    socketRef.current?.close();
    socketRef.current = null;
    lastConnectionRef.current = null;
    reconnectAttempts.current = 0;
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
