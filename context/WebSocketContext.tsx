import React, { createContext, useContext, useRef, useState } from "react";
import { Alert } from "react-native";
import { Character, Combatant } from "../types/rpg";
import { useCharacter } from "./CharacterContext";

interface WebSocketContextType {
  isConnected: boolean;
  disconnect: () => void;
  joinSession: (ip: string, sessionId: string) => void; // Recebe o ID da sala
  sendMessage: (type: string, payload: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType>(
  {} as WebSocketContextType
);

// --- HELPER: Converter Player em Combatant ---
// (Isso garante que o objeto enviado seja igual ao esperado pelo servidor)
const playerToCombatant = (char: Character): Combatant => {
  return {
    id: char.name || "player-id", // Use o ID real ou gere um
    name: char.name,
    baseName: char.name,
    type: "player",
    hp: { current: char.stats.hp.current, max: char.stats.hp.max },
    initiative: 0, // Será rolada depois
    armorClass: 10 + (char.attributes.dex?.modifier || 0), // Exemplo simples
    currentFocus: char.stats.focus.current,
    maxFocus: char.stats.focus.max,
    attributes: char.attributes,
    activeStanceId: null,
    turnActions: char.turnActions || {
      standard: true,
      bonus: true,
      reaction: true,
    },
    // Adicione stances/skills se necessário enviar para o mestre ver
  };
};

export const WebSocketProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  // Pegamos os dados do Jogador e da Campanha para manipular
  const { character } = useCharacter();
  // const { setCombatants, updateCombatant } = useCampaign();

  // ENDEREÇO DO SERVIDOR (Ajuste para o IP da sua máquina se usar emulador/celular físico)
  // Ex: "ws://192.168.1.15:8080"

  const connectToRoute = (
    ip: string,
    sessionId: string,
    characterId: string
  ) => {
    if (socketRef.current) {
      // Se já tiver conectado em outra, desconecta
      socketRef.current.close();
    }

    // Monta a URL: ws://IP:8000/ws/SESSAO_123/CHAR_456
    const wsUrl = `ws://${ip}:8000/ws/${sessionId}/${characterId}`;
    console.log("Conectando em:", wsUrl);

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket Conectado com Sucesso!");
      setIsConnected(true);

      // Opcional: Enviar dados iniciais do personagem assim que conectar
      // já que a conexão URL só passa o ID.
      // sendInitialCharacterData();
    };

    ws.onclose = () => {
      console.log("WebSocket Desconectado");
      setIsConnected(false);
      socketRef.current = null;
    };

    ws.onerror = (e) => {
      console.log("Erro no WebSocket:", e);
      Alert.alert("Erro de Conexão", "Não foi possível conectar ao servidor.");
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleServerMessage(message);
      } catch (err) {
        console.error("Erro ao ler mensagem:", err);
      }
    };
  };

  const handleServerMessage = (message: any) => {
    switch (message.type) {
      case "SYNC_STATE":
        // O servidor mandou a lista completa atualizada
        // setCombatants(message.payload);
        break;
      // Outros casos...
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
      setIsConnected(false);
    }
  };

  const sendMessage = (type: string, payload: any) => {
    if (socketRef.current && isConnected) {
      const msg = JSON.stringify({ type, payload });
      socketRef.current.send(msg);
    } else {
      console.warn("Tentou enviar mensagem sem conexão.");
    }
  };

  // --- IMPLEMENTAÇÃO DO PEDIDO: JOIN_SESSION ---
  const joinSession = (ip: string, sessionId: string) => {
    if (!character.name) {
      Alert.alert("Erro", "Crie seu personagem primeiro.");
      return;
    }

    // Garante que o personagem tenha um ID (use um fixo ou gere se não tiver)
    const charId =
      character.name.replaceAll(" ", "_").toLocaleLowerCase() ||
      `char_${Date.now()}`;

    // Inicia a conexão na rota específica
    connectToRoute(ip, sessionId, charId);
  };

  return (
    <WebSocketContext.Provider
      value={{ isConnected, disconnect, joinSession, sendMessage }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
