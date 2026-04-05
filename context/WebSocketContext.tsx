import { playerToCombatant } from "@/utils/combatantFactory";
import React, { createContext, useContext, useRef, useState } from "react";
import { Alert } from "react-native";
import { Combatant } from "../types/rpg";
import { useCampaign } from "./CampaignContext";
import { useCharacter } from "./CharacterContext";

interface WebSocketContextType {
  isConnected: boolean;
  disconnect: () => void;
  joinSession: (ip: string, sessionId: string, initiative: number) => void;
  sendMessage: (type: string, payload: any) => void;
  connectToRoute: (
    ip: string,
    sessionId: string,
    initialData: Combatant | any,
  ) => void;
}

const WebSocketContext = createContext<WebSocketContextType>(
  {} as WebSocketContextType,
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

  const handleServerMessage = (data: any) => {
    if (data.error) {
      Alert.alert("Erro do Servidor", data.error);
      return;
    }

    // 1. SINCRONIZAÇÃO TOTAL (Snapshot)
    // Se a mensagem contiver combatants e turn_order, tratamos como estado completo
    if (data.combatants && data.turn_order) {
      const sortedCombatants = data.turn_order
        .map((id: string) => data.combatants[id])
        .filter((c: any) => c !== undefined);

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

    // 2. PROCESSAMENTO DE DELTAS (Eventos de Redução de Banda)
    // Aqui tratamos as mensagens disparadas pelo manager.broadcast_event do Python
    switch (data.type) {
      case "HP_UPDATE":
        // Simplificado: updateCombatant já cuida de preservar o HP máximo
        updateCombatant(data.payload.combatantId, {
          hp: { current: data.payload.newHp },
        });
        if (data.payload.log) addLog(data.payload.log);
        break;

      case "FOCUS_UPDATE": // NOVO: Receptor de foco
        updateCombatant(data.payload.combatantId, {
          focus: { current: data.payload.newFocus },
        });
        if (data.payload.log) addLog(data.payload.log);
        break;

      case "STANCE_UPDATE":
        updateCombatant(data.payload.combatantId, {
          activeStanceId: data.payload.activeStanceId,
          armorClass: data.payload.newAC,
          turnActions: data.payload.turnActions,
        });
        if (data.payload.log) addLog(data.payload.log);
        break;

      case "ACTION_RESOLVED":
        // 1. ATUALIZA O ALVO (Dano/Cura)
        if (data.payload.targetId && data.payload.targetHp !== undefined) {
          updateCombatant(data.payload.targetId, {
            hp: { current: data.payload.targetHp },
          });
        }

        // 2. ATUALIZA O ATACANTE (Recursos gastos)
        updateCombatant(data.payload.attackerId, {
          turnActions: data.payload.attackerActions,
          focus: { current: data.payload.attackerFocus },
        });

        // 3. DISPARA A NOTIFICAÇÃO (O que já funcionava)
        setLastEvent({
          id: Date.now(),
          type: data.payload.type,
          target_id: data.payload.targetId,
          attacker_name: data.payload.attackerId,
          skill_name: data.payload.actionName,
          value: data.payload.value,
        });

        if (data.payload.log) addLog(data.payload.log);
        break;

      case "TURN_UPDATE":
        setActiveTurnId(data.payload.newActiveId);
        if (data.payload.log) addLog(data.payload.log);
    }
  };

  const connectToRoute = (
    inputIp: string,
    sessionId: string,
    initialData: Combatant | any,
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
        ws.send(
          JSON.stringify({
            type: eventType,
            payload: { roomCode: sessionId, combatant: initialData },
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
      ws.onerror = (e: any) => console.log("⚠️ WebSocket Error:", e.message);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível criar a conexão.");
    }
  };

  const disconnect = () => {
    socketRef.current?.close();
    setIsConnected(false);
  };

  const sendMessage = (type: string, payload: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, payload }));
    }
  };

  const joinSession = (ip: string, sessionId: string, initiative: number) => {
    if (!character.name) return Alert.alert("Erro", "Personagem sem nome.");
    const combatantData = playerToCombatant(character, initiative);
    connectToRoute(ip, sessionId, combatantData);
  };

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        disconnect,
        joinSession,
        sendMessage,
        connectToRoute,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
