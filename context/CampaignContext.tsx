import { useCampaignAuth } from "@/context/CampaignAuthContext";
import { createCampaignApi } from "@/services/campaignApi";
import { npcToCombatant, playerToCombatant } from "@/utils/combatantFactory";
import { advanceCombatantPhase, advanceCombatTurn } from "@/utils/combatRules";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    Character,
    Combatant,
    GameEvent,
    NpcTemplate
} from "../types/rpg";

export interface CombatantsContextType {
  combatants: Combatant[];
  activeTurnId: string | null;
  addCombatant: (
    baseName: string,
    hp: number,
    init: number,
    type: "player" | "npc",
    details?: Partial<Character> | Partial<NpcTemplate> | any,
  ) => void;
  removeCombatant: (id: string) => void;
  updateCombatant: (id: string, fieldOrUpdates: string | Partial<Combatant>, value?: any) => void;
  sortCombat: () => void;
  clearCombat: () => void;
  endCombat: () => void;
  setCombatants: React.Dispatch<React.SetStateAction<Combatant[]>>;
  setActiveTurnId: React.Dispatch<React.SetStateAction<string | null>>;
  endTurnCombatant: (id: string) => void;
  advancePhase: (id: string) => void;
  nextTurn: () => void;
}

export interface CombatLogContextType {
  logs: string[];
  lastEvent: GameEvent | null;
  addLog: (message: string) => void;
  setLogs: React.Dispatch<React.SetStateAction<string[]>>;
  setLastEvent: React.Dispatch<React.SetStateAction<GameEvent | null>>;
}

export interface CampaignMetaContextType {
  npcLibrary: NpcTemplate[];
  diceHistory: string[];
  isLoaded: boolean;
  isOfflineMode: boolean;
  isSyncingNpcs: boolean;
  setOfflineMode: React.Dispatch<React.SetStateAction<boolean>>;
  saveNpcToLibrary: (npc: Omit<NpcTemplate, "id">) => void;
  deleteNpcFromLibrary: (id: string) => void;
  updateNpcInLibrary: (id: string, npc: Partial<NpcTemplate>) => void;
  syncNpcsWithServer: () => Promise<void>;
  addDiceRoll: (roll: string) => void;
}

export type CampaignContextType = CombatantsContextType & CombatLogContextType & CampaignMetaContextType;

const CombatantsContext = createContext<CombatantsContextType | undefined>(undefined);
const CombatLogContext = createContext<CombatLogContextType | undefined>(undefined);
const CampaignMetaContext = createContext<CampaignMetaContextType | undefined>(undefined);

export const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

export const CampaignProvider = ({ children }: { children: ReactNode }) => {
  const [combatState, setCombatState] = useState<{ combatants: Combatant[]; activeTurnId: string | null }>({
    combatants: [], activeTurnId: null,
  });
  const { combatants, activeTurnId } = combatState;
  const setCombatants = useCallback<React.Dispatch<React.SetStateAction<Combatant[]>>>((update) => {
    setCombatState((prev) => ({ ...prev,
      combatants: typeof update === "function" ? update(prev.combatants) : update,
    }));
  }, []);
  const setActiveTurnId = useCallback<React.Dispatch<React.SetStateAction<string | null>>>((update) => {
    setCombatState((prev) => ({ ...prev,
      activeTurnId: typeof update === "function" ? update(prev.activeTurnId) : update,
    }));
  }, []);
  const [session] = useCampaignAuth();
  const [isSyncingNpcs, setIsSyncingNpcs] = useState(false);
  const [npcLibrary, setNpcLibrary] = useState<NpcTemplate[]>([]);
  const [diceHistory, setDiceHistory] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastEvent, setLastEvent] = useState<GameEvent | null>(null);
  const [isOfflineMode, setOfflineMode] = useState(false);

  const syncNpcsWithServer = useCallback(async () => {
    if (!session || session.role !== "gm" || isSyncingNpcs) return;
    setIsSyncingNpcs(true);
    try {
      const client = createCampaignApi({
        baseUrl: session.baseUrl,
        getAccessToken: () => session.token,
      });
      const localNpcs = npcLibrary;
      const payload = localNpcs.map((npc) => ({
        id: npc.id,
        name: npc.name,
        level: npc.level || 1,
        templateData: npc,
        updatedAt: (npc as any).updatedAt || new Date().toISOString(),
      }));
      const remote = await client.syncNpcTemplates(payload);
      const consolidated: NpcTemplate[] = remote.map((item) => ({
        ...item.templateData,
        id: item.id,
        name: item.name,
        level: item.level || 1,
        updatedAt: item.updatedAt,
      }));
      setNpcLibrary(consolidated);
      await AsyncStorage.setItem("@rpg_npc_library", JSON.stringify(consolidated));
    } catch (err) {
      console.warn("Falha ao sincronizar NPCs com o servidor:", err);
    } finally {
      setIsSyncingNpcs(false);
    }
  }, [session, npcLibrary, isSyncingNpcs]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedNpcs = await AsyncStorage.getItem("@rpg_npc_library");
        if (savedNpcs) {
          setNpcLibrary(JSON.parse(savedNpcs));
        }
      } catch (error) {
        console.error("Erro ao carregar NPCs:", error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isLoaded && session?.role === "gm" && session?.token) {
      syncNpcsWithServer();
    }
  }, [isLoaded, session?.token]);

  useEffect(() => {
    if (isLoaded) {
      const saveData = async () => {
        try {
          await AsyncStorage.setItem(
            "@rpg_npc_library",
            JSON.stringify(npcLibrary),
          );
        } catch (error) {
          console.error("Erro ao salvar NPCs:", error);
        }
      };
      saveData();
    }
  }, [npcLibrary, isLoaded]);

  const addLog = useCallback((message: string) => {
    setLogs((prev) => [...prev, message].slice(-50));
  }, []);

  const addCombatant = useCallback(
    (
      baseName: string,
      hp: number,
      init: number,
      type: "player" | "npc",
      details?: any,
    ) => {
      setCombatants((prev) => {
        let newCombatant: Combatant;
        if (type === "player" && details?.stats) {
          newCombatant = playerToCombatant(details as Character, init);
        } else if (type === "npc" && details?.hp && details?.id) {
          newCombatant = { ...details, initiative: init };
        } else if (type === "npc" && details?.maxHp != null) {
          const count = prev.filter((c) => c.baseName === baseName).length;
          newCombatant = npcToCombatant(details as NpcTemplate, init, count + 1);
        } else {
          const maxFocusVal = details?.focus?.max || details?.maxFocus || 0;
          newCombatant = {
            id: Date.now().toString() + Math.random(),
            name: baseName,
            baseName: baseName,
            type,
            initiative: init,
            hp: { current: hp, max: hp },
            focus: {
              current: details?.focus?.current ?? maxFocusVal,
              max: maxFocusVal,
            },
            armorClass: details?.armorClass || 10,
            attributes: details?.attributes || {},
            stances: details?.stances || [],
            skills: details?.skills || [],
            spells: details?.spells || [],
            activeStanceId: null,
            turnActions: { standard: true, bonus: true, reaction: true },
            deathSaves: { successes: 0, failures: 0 },
          } as Combatant;
        }
        return [...prev, newCombatant].sort(
          (a, b) => b.initiative - a.initiative,
        );
      });
    },
    [setCombatants],
  );

  const updateCombatant = useCallback(
    (id: string, fieldOrUpdates: string | Partial<Combatant>, value?: any) => {
      setCombatants((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;

          // Normaliza: se veio como (id, "campo", valor), converte para objeto
          let updates: Partial<Combatant>;
          if (typeof fieldOrUpdates === "string") {
            updates = { [fieldOrUpdates]: value } as any;
          } else {
            updates = fieldOrUpdates;
          }

          // Tratamento especial para campos aninhados
          const newHp = updates.hp != null
            ? typeof updates.hp === "number"
              ? { ...c.hp, current: updates.hp } // updateCombatant(id, "hp", 5) → seta current
              : { ...c.hp, ...updates.hp }       // updateCombatant(id, { hp: { current: 5 } })
            : c.hp;

          const newFocus = updates.focus != null
            ? typeof updates.focus === "number"
              ? { ...c.focus, current: updates.focus }
              : { ...c.focus, ...updates.focus }
            : c.focus;

          const newActions = updates.turnActions
            ? { ...c.turnActions, ...updates.turnActions }
            : c.turnActions;

          return {
            ...c,
            ...updates,
            hp: newHp,
            focus: newFocus,
            turnActions: newActions,
          };
        }),
      );
    },
    [setCombatants],
  );

  const endTurnCombatant = useCallback(
    (id: string) => {
      updateCombatant(id, {
        turnActions: { standard: true, bonus: true, reaction: true },
      });
    },
    [updateCombatant],
  );

  const advancePhase = useCallback(
    (id: string) => {
      setCombatants((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          return advanceCombatantPhase(c);
        }),
      );
    },
    [setCombatants],
  );

  const removeCombatant = useCallback((id: string) => {
    setCombatState((prev) => ({
      combatants: prev.combatants.filter((c) => c.id !== id),
      activeTurnId: prev.activeTurnId === id ? null : prev.activeTurnId,
    }));
  }, []);

  const sortCombat = useCallback(() => {
    setCombatants((prev) => [...prev].sort((a, b) => b.initiative - a.initiative));
  }, [setCombatants]);

  const clearCombat = useCallback(() => {
    setCombatState({ combatants: [], activeTurnId: null });
  }, []);

  const endCombat = useCallback(() => {
    setCombatState((prev) => ({
      combatants: prev.combatants.filter((c) => c.type === "player").map((c) => ({
        ...c, turnActions: { standard: true, bonus: true, reaction: true },
      })),
      activeTurnId: null,
    }));
    addLog("🏆 O Mestre encerrou o combate! (Modo Narrativo)");
  }, [addLog]);

  const nextTurn = useCallback(() => {
    setCombatState((prev) => advanceCombatTurn(prev.combatants, prev.activeTurnId));
  }, []);

  const deleteNpcFromLibrary = useCallback(
    (id: string) => {
      setNpcLibrary((prev) => prev.filter((n) => n.id !== id));
      if (session?.role === "gm") {
        const client = createCampaignApi({
          baseUrl: session.baseUrl,
          getAccessToken: () => session.token,
        });
        client.deleteNpcTemplate(id).catch((e) => console.warn("Erro ao excluir NPC no servidor:", e));
      }
    },
    [session],
  );

  const updateNpcInLibrary = useCallback(
    (id: string, updates: Partial<NpcTemplate>) => {
      let updatedNpc: NpcTemplate | null = null;
      setNpcLibrary((prev) =>
        prev.map((npc) => {
          if (npc.id === id) {
            updatedNpc = { ...npc, ...updates, updatedAt: new Date().toISOString() } as NpcTemplate;
            return updatedNpc;
          }
          return npc;
        }),
      );
      if (session?.role === "gm" && updatedNpc) {
        const client = createCampaignApi({
          baseUrl: session.baseUrl,
          getAccessToken: () => session.token,
        });
        const target = updatedNpc as NpcTemplate;
        client
          .updateNpcTemplate(id, {
            name: target.name,
            level: target.level || 1,
            templateData: target,
            updatedAt: (target as any).updatedAt,
          })
          .catch((e) => console.warn("Erro ao atualizar NPC no servidor:", e));
      }
    },
    [session],
  );

  const saveNpcToLibrary = useCallback(
    (npcRaw: Omit<NpcTemplate, "id">) => {
      const id = Date.now().toString();
      const newNpc = {
        ...npcRaw,
        id,
        updatedAt: new Date().toISOString(),
      } as NpcTemplate;
      setNpcLibrary((prev) => [...prev, newNpc]);
      if (session?.role === "gm") {
        const client = createCampaignApi({
          baseUrl: session.baseUrl,
          getAccessToken: () => session.token,
        });
        client
          .createNpcTemplate({
            id,
            name: newNpc.name,
            level: newNpc.level || 1,
            templateData: newNpc,
            updatedAt: (newNpc as any).updatedAt,
          })
          .catch((e) => console.warn("Erro ao salvar NPC no servidor:", e));
      }
    },
    [session],
  );

  const addDiceRoll = useCallback((roll: string) => {
    setDiceHistory((prev) => [roll, ...prev].slice(0, 20));
  }, []);

  const combatantsValue = useMemo<CombatantsContextType>(
    () => ({
      combatants,
      activeTurnId,
      addCombatant,
      removeCombatant,
      updateCombatant,
      sortCombat,
      clearCombat,
      endCombat,
      setCombatants,
      setActiveTurnId,
      endTurnCombatant,
      advancePhase,
      nextTurn,
    }),
    [
      combatants,
      activeTurnId,
      addCombatant,
      removeCombatant,
      updateCombatant,
      sortCombat,
      clearCombat,
      endCombat,
      setCombatants,
      setActiveTurnId,
      endTurnCombatant,
      advancePhase,
      nextTurn,
    ],
  );

  const logValue = useMemo<CombatLogContextType>(
    () => ({
      logs,
      lastEvent,
      addLog,
      setLogs,
      setLastEvent,
    }),
    [logs, lastEvent, addLog, setLogs, setLastEvent],
  );

  const metaValue = useMemo<CampaignMetaContextType>(
    () => ({
      npcLibrary,
      diceHistory,
      isLoaded,
      isOfflineMode,
      isSyncingNpcs,
      setOfflineMode,
      saveNpcToLibrary,
      deleteNpcFromLibrary,
      updateNpcInLibrary,
      syncNpcsWithServer,
      addDiceRoll,
    }),
    [
      npcLibrary,
      diceHistory,
      isLoaded,
      isOfflineMode,
      isSyncingNpcs,
      setOfflineMode,
      saveNpcToLibrary,
      deleteNpcFromLibrary,
      updateNpcInLibrary,
      syncNpcsWithServer,
      addDiceRoll,
    ],
  );

  return (
    <CampaignMetaContext.Provider value={metaValue}>
      <CombatLogContext.Provider value={logValue}>
        <CombatantsContext.Provider value={combatantsValue}>
          {children}
        </CombatantsContext.Provider>
      </CombatLogContext.Provider>
    </CampaignMetaContext.Provider>
  );
};

export function useCombatants(): CombatantsContextType {
  const context = useContext(CombatantsContext);
  if (!context) {
    throw new Error("useCombatants must be used within a CampaignProvider");
  }
  return context;
}

export function useCombatLog(): CombatLogContextType {
  const context = useContext(CombatLogContext);
  if (!context) {
    throw new Error("useCombatLog must be used within a CampaignProvider");
  }
  return context;
}

export function useCampaignMeta(): CampaignMetaContextType {
  const context = useContext(CampaignMetaContext);
  if (!context) {
    throw new Error("useCampaignMeta must be used within a CampaignProvider");
  }
  return context;
}

export function useCampaign(): CampaignContextType {
  const combatants = useCombatants();
  const log = useCombatLog();
  const meta = useCampaignMeta();
  return { ...combatants, ...log, ...meta };
};
