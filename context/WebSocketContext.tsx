import { petToCombatant, playerToCombatant } from "@/utils/combatantFactory";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Alert, AppState } from "react-native";
import { Combatant, GameEvent } from "../types/rpg";
import { useCampaignAuth } from "./CampaignAuthContext";
import { campaignAuthMessage, campaignSocketUrl } from "@/utils/campaignSocket";
import { useCombatants, useCombatLog } from "./CampaignContext";
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
  connectionError: string | null;
  disconnect: () => void;
  joinSession: (ip: string, sessionId: string, initiative: number, petInitiative?: number) => void;
  sendMessage: (type: string, payload: any) => void;
  connectToRoute: (
    ip: string,
    sessionId: string,
    initialData: Combatant | any,
    petData?: Combatant | null,
  ) => void;
  connectToCampaign: (campaignId: string, role: "gm" | "player", initiative?: number, petInitiative?: number) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined,
);

const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY = 1000; // 1 segundo
const CLIENT_ID_KEY = "@pharos_ws_client_id";

const createClientId = () => `client_${Date.now()}_${Math.random().toString(36).slice(2)}`;

export const WebSocketProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [campaignSession] = useCampaignAuth();
  const socketRef = useRef<WebSocket | null>(null);
  const intentionalClose = useRef(false);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);
  const pingInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const clientIdRef = useRef<string | null>(null);

  // Guarda os dados da última conexão para reconexão
  const lastConnectionRef = useRef<{
    ip: string;
    sessionId: string;
    initialData: any;
    petData?: Combatant | null;
    campaignToken?: string;
  } | null>(null);

  const { character } = useCharacter();
  const characterRef = useRef(character);
  useEffect(() => {
    characterRef.current = character;
  }, [character]);
  const {
    setCombatants,
    setActiveTurnId,
    updateCombatant,
  } = useCombatants();
  const {
    addLog,
    setLogs,
    setLastEvent,
  } = useCombatLog();

  // Limpa timers ao desmontar
  useEffect(() => {
    AsyncStorage.getItem(CLIENT_ID_KEY).then((storedId) => {
      const clientId = storedId || createClientId();
      clientIdRef.current = clientId;
      if (!storedId) AsyncStorage.setItem(CLIENT_ID_KEY, clientId);
    });

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
      connectToRoute(conn.ip, conn.sessionId, conn.initialData, conn.petData, conn.campaignToken);
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
        setActiveTurnId(data.turn_order[data.turn_index] ?? null);
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
        setCombatants((prev) =>
          prev.map((c) =>
            c.id === payload.combatantId
              ? { ...c, hp: { ...c.hp, current: payload.newHp } }
              : c
          )
        );
        if (payload.log) addLog(payload.log);
        break;

      case "FOCUS_UPDATE":
        setCombatants((prev) =>
          prev.map((c) =>
            c.id === payload.combatantId
              ? { ...c, focus: { ...c.focus, current: payload.newFocus } }
              : c
          )
        );
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

      case "ACTION_RESOLVED": {
        const updates = new Map<string, Partial<Combatant>>();

        // Multi-target: atualiza cada alvo individualmente
        if (payload.results && Array.isArray(payload.results)) {
          for (const r of payload.results) {
            const targetId = r.targetId || r.id;
            const targetHp =
              r.targetHp !== undefined
                ? r.targetHp
                : typeof r.hp === "number"
                  ? r.hp
                  : r.hp?.current;
            if (targetId && targetHp !== undefined) {
              updates.set(targetId, {
                hp: { current: targetHp } as any,
              });
            }
          }
        }
        // Single-target (retrocompatibilidade)
        else if (payload.targetId && payload.targetHp !== undefined) {
          updates.set(payload.targetId, {
            hp: { current: payload.targetHp } as any,
          });
        }

        // Attacker updates
        if (payload.attackerId) {
          const existing = updates.get(payload.attackerId);
          updates.set(payload.attackerId, {
            ...existing,
            turnActions: payload.attackerActions,
            focus: {
              ...(existing?.focus ?? {}),
              current: payload.attackerFocus,
            } as any,
          });
        }

        if (updates.size > 0) {
          setCombatants((prev) =>
            prev.map((c) => {
              const u = updates.get(c.id);
              if (!u) return c;

              const newHp = u.hp
                ? typeof u.hp === "number"
                  ? { ...c.hp, current: u.hp }
                  : { ...c.hp, ...u.hp }
                : c.hp;

              const newFocus = u.focus
                ? typeof u.focus === "number"
                  ? { ...c.focus, current: u.focus }
                  : { ...c.focus, ...u.focus }
                : c.focus;

              const newActions = u.turnActions
                ? { ...c.turnActions, ...u.turnActions }
                : c.turnActions;

              return {
                ...c,
                ...u,
                hp: newHp,
                focus: newFocus,
                turnActions: newActions,
              };
            }),
          );
        }

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
      }

      case "TURN_UPDATE":
        setActiveTurnId(payload.newActiveId);
        // Reseta as ações do novo ator ativo (usa o valor do servidor ou o padrão)
        if (payload.newActiveId) updateCombatant(payload.newActiveId, {
          ...(payload.conditions ? { conditions: payload.conditions } : {}),
          turnActions: payload.turnActions || {
            standard: true,
            bonus: true,
            reaction: true,
          },
        });
        if (payload.log) addLog(payload.log);
        break;

      case "DEATH_SAVE_UPDATE":
        setCombatants((prev) =>
          prev.map((c) =>
            c.id === payload.combatantId
              ? {
                  ...c,
                  deathSaves: {
                    successes: payload.successes,
                    failures: payload.failures,
                  },
                  hp: { ...c.hp, current: payload.newHp },
                  turnActions: payload.turnActions,
                }
              : c
          )
        );
        if (payload.log) addLog(payload.log);
        break;

      case "CONDITION_UPDATE":
        updateCombatant(payload.combatantId, {
          conditions: payload.conditions,
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
    campaignToken?: string,
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
    setConnectionError(null);

    // Salva dados para reconexão futura
    lastConnectionRef.current = { ip: inputIp, sessionId, initialData, petData, campaignToken };

    let host = inputIp
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/^wss?:\/\//, "")
      .replace(/\/$/, "");

    const isSecureInput = inputIp.trim().startsWith("https://") || inputIp.trim().startsWith("wss://");
    const isBrowserHttps = typeof window !== "undefined" && window.location?.protocol === "https:";
    const isNumericIpOrLocal = /^(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\.|[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)/i.test(host);

    if (!host.includes(":") && isNumericIpOrLocal) {
      host = `${host}:8000`;
    }

    const wsProto = (isSecureInput || isBrowserHttps) ? "wss:" : "ws:";
    const wsUrl = campaignToken
      ? campaignSocketUrl(inputIp, sessionId.slice("campaign-".length))
      : `${wsProto}//${host}/ws/${sessionId}`;
    console.log("🔌 Conectando ao RPG Server:", wsUrl);

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;
      let pendingJoin: string | null = null;

      ws.onopen = () => {
        reconnectAttempts.current = 0; // Reset ao conectar com sucesso
        if (!campaignToken) {
          setIsConnected(true);
          startPingInterval();
        }

        const eventType =
          initialData.type === "gm" ? "GM_CONNECT" : "JOIN_SESSION";
        
        // Uma reconexão automática usa a ficha atual, não o snapshot do primeiro JOIN.
        const currentCharacter = characterRef.current;
        const joiningCombatant = initialData.type === "player"
          ? playerToCombatant(currentCharacter, initialData.initiative)
          : initialData;
        const joiningPet = initialData.type === "player"
          ? currentCharacter.pet ? petToCombatant(currentCharacter.pet, currentCharacter.name,
            petData?.initiative ?? Math.max(0, initialData.initiative - 1)) : null
          : petData;
        if (!clientIdRef.current) {
          clientIdRef.current = createClientId();
          AsyncStorage.setItem(CLIENT_ID_KEY, clientIdRef.current);
        }

        const payload: any = {
          roomCode: sessionId,
          ...(campaignToken ? {} : { clientId: clientIdRef.current }),
          combatant: joiningCombatant,
        };
        
        // Se tem pet, envia junto
        if (joiningPet) {
          payload.pet = joiningPet;
        }

        console.log("📤 Enviando para servidor:", eventType, "| Pet:", petData ? petData.name : "Nenhum");
        
        pendingJoin = JSON.stringify({ type: eventType, payload });
        if (campaignToken) ws.send(JSON.stringify(campaignAuthMessage(campaignToken)));
        else ws.send(pendingJoin);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (campaignToken && message.type === "AUTH_OK") {
            if (pendingJoin) ws.send(pendingJoin);
            pendingJoin = null;
            setIsConnected(true);
            startPingInterval();
            return;
          }
          handleServerMessage(message);
        } catch (err) {
          console.error("Erro no Parse do WebSocket:", err);
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        if (pingInterval.current) clearInterval(pingInterval.current);
        if (campaignToken && event.code === 1008) {
          intentionalClose.current = true;
          lastConnectionRef.current = null;
          setConnectionError("Acesso ao combate negado. Confira a sessão e a ficha vinculada.");
          return;
        }

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
    setConnectionError(null);
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

  const connectToCampaign = useCallback((campaignId: string, role: "gm" | "player",
    initiative = 0, petInitiative?: number) => {
    if (!campaignSession) return Alert.alert("Erro", "Entre na campanha antes do combate.");
    if (role === "gm") {
      connectToRoute(campaignSession.baseUrl, `campaign-${campaignId}`,
        { id: "GM_ADMIN", name: "Mestre", type: "gm" }, null, campaignSession.token);
      return;
    }
    if (!character.sheetId) return Alert.alert("Erro", "Vincule sua ficha antes do combate.");
    const combatant = playerToCombatant(character, initiative);
    const pet = character.pet ? petToCombatant(character.pet, character.name,
      petInitiative ?? Math.max(0, initiative - 1)) : null;
    connectToRoute(campaignSession.baseUrl, `campaign-${campaignId}`,
      combatant, pet, campaignSession.token);
  }, [campaignSession, character, connectToRoute]);

  useEffect(() => {
    const active = lastConnectionRef.current?.campaignToken;
    if (active && active !== campaignSession?.token) disconnect();
  }, [campaignSession?.token, disconnect]);

  const contextValue = useMemo(() => ({
    isConnected,
    connectionError,
    disconnect,
    joinSession,
    sendMessage,
    connectToRoute,
    connectToCampaign,
  }), [isConnected, connectionError, disconnect, joinSession, sendMessage, connectToRoute, connectToCampaign]);

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
