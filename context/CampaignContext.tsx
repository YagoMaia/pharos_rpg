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
  CombatantUpdate,
  GameEvent,
  NpcTemplate,
} from "../types/rpg";

interface CampaignContextType {
  combatants: Combatant[];
  addCombatant: (
    baseName: string,
    hp: number,
    init: number,
    type: "player" | "npc",
    details?: Partial<Character> | Partial<NpcTemplate> | any,
  ) => void;
  removeCombatant: (id: string) => void;
  updateCombatant: (id: string, updates: Partial<Combatant>) => void;
  sortCombat: () => void;
  clearCombat: () => void;

  npcLibrary: NpcTemplate[];
  saveNpcToLibrary: (npc: Omit<NpcTemplate, "id">) => void;
  deleteNpcFromLibrary: (id: string) => void;
  updateNpcInLibrary: (id: string, npc: Partial<NpcTemplate>) => void;

  diceHistory: string[];
  addDiceRoll: (roll: string) => void;
  endTurnCombatant: (id: string) => void;

  setCombatants: React.Dispatch<React.SetStateAction<Combatant[]>>;

  activeTurnId: string | null;
  setActiveTurnId: React.Dispatch<React.SetStateAction<string | null>>;

  logs: string[];
  setLogs: React.Dispatch<React.SetStateAction<string[]>>;
  addLog: (message: string) => void;
  lastEvent: GameEvent | null;
  setLastEvent: React.Dispatch<React.SetStateAction<GameEvent | null>>;
}

const CampaignContext = createContext<CampaignContextType | undefined>(
  undefined,
);

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
    (id: string, updates: Partial<Combatant>) => {
      setCombatants((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;

          const newHp = updates.hp ? { ...c.hp, ...updates.hp } : c.hp;
          const newFocus = updates.focus
            ? { ...c.focus, ...updates.focus }
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

  const contextValue = useMemo(
    () => ({
      combatants,
      setCombatants,
      addCombatant,
      removeCombatant,
      updateCombatant,
      sortCombat,
      clearCombat,
      npcLibrary,
      saveNpcToLibrary,
      deleteNpcFromLibrary,
      diceHistory,
      addDiceRoll,
      updateNpcInLibrary,
      endTurnCombatant,
      activeTurnId,
      setActiveTurnId,
      logs,
      setLogs,
      addLog,
      lastEvent,
      setLastEvent,
    }),
    [
      combatants,
      addCombatant,
      removeCombatant,
      updateCombatant,
      sortCombat,
      clearCombat,
      npcLibrary,
      saveNpcToLibrary,
      deleteNpcFromLibrary,
      diceHistory,
      addDiceRoll,
      updateNpcInLibrary,
      endTurnCombatant,
      activeTurnId,
      logs,
      lastEvent,
    ],
  );

  return (
    <CampaignContext.Provider value={contextValue}>
      {children}
    </CampaignContext.Provider>
  );
};

export const useCampaign = () => {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error("useCampaign must be used within a CampaignProvider");
  }
  return context;
};
