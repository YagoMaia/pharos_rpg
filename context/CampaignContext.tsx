import { npcToCombatant, playerToCombatant } from "@/utils/combatantFactory";
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
  setCombatants: React.Dispatch<React.SetStateAction<Combatant[]>>;
  setActiveTurnId: React.Dispatch<React.SetStateAction<string | null>>;
  endTurnCombatant: (id: string) => void;
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
  saveNpcToLibrary: (npc: Omit<NpcTemplate, "id">) => void;
  deleteNpcFromLibrary: (id: string) => void;
  updateNpcInLibrary: (id: string, npc: Partial<NpcTemplate>) => void;
  addDiceRoll: (roll: string) => void;
}

export type CampaignContextType = CombatantsContextType & CombatLogContextType & CampaignMetaContextType;

const CombatantsContext = createContext<CombatantsContextType | undefined>(undefined);
const CombatLogContext = createContext<CombatLogContextType | undefined>(undefined);
const CampaignMetaContext = createContext<CampaignMetaContextType | undefined>(undefined);

export const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

export const CampaignProvider = ({ children }: { children: ReactNode }) => {
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [npcLibrary, setNpcLibrary] = useState<NpcTemplate[]>([]);
  const [diceHistory, setDiceHistory] = useState<string[]>([]);
  const [activeTurnId, setActiveTurnId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastEvent, setLastEvent] = useState<GameEvent | null>(null);

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
        } else if (type === "npc" && details?.maxHp) {
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
    [],
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
          const newHp = updates.hp
            ? typeof updates.hp === "number"
              ? { ...c.hp, current: updates.hp } // updateCombatant(id, "hp", 5) → seta current
              : { ...c.hp, ...updates.hp }       // updateCombatant(id, { hp: { current: 5 } })
            : c.hp;

          const newFocus = updates.focus
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
    [],
  );

  const endTurnCombatant = useCallback(
    (id: string) => {
      updateCombatant(id, {
        turnActions: { standard: true, bonus: true, reaction: true },
      });
    },
    [updateCombatant],
  );

  const removeCombatant = useCallback((id: string) => {
    setCombatants((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const sortCombat = useCallback(() => {
    setCombatants((prev) => [...prev].sort((a, b) => b.initiative - a.initiative));
  }, []);

  const clearCombat = useCallback(() => setCombatants([]), []);

  const deleteNpcFromLibrary = useCallback((id: string) => {
    setNpcLibrary((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const updateNpcInLibrary = useCallback(
    (id: string, updates: Partial<NpcTemplate>) => {
      setNpcLibrary((prev) =>
        prev.map((npc) => {
          if (npc.id === id) {
            return { ...npc, ...updates } as NpcTemplate;
          }
          return npc;
        }),
      );
    },
    [],
  );

  const saveNpcToLibrary = useCallback((npcRaw: Omit<NpcTemplate, "id">) => {
    setNpcLibrary((prev) => [
      ...prev,
      { ...npcRaw, id: Date.now().toString() } as NpcTemplate,
    ]);
  }, []);

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
      setCombatants,
      setActiveTurnId,
      endTurnCombatant,
    }),
    [
      combatants,
      activeTurnId,
      addCombatant,
      removeCombatant,
      updateCombatant,
      sortCombat,
      clearCombat,
      setCombatants,
      setActiveTurnId,
      endTurnCombatant,
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
      saveNpcToLibrary,
      deleteNpcFromLibrary,
      updateNpcInLibrary,
      addDiceRoll,
    }),
    [
      npcLibrary,
      diceHistory,
      isLoaded,
      saveNpcToLibrary,
      deleteNpcFromLibrary,
      updateNpcInLibrary,
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
