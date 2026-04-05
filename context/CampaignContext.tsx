import { npcToCombatant, playerToCombatant } from "@/utils/combatantFactory";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { CLASS_DATA } from "../data/classData";
import {
  CharacterClass,
  Combatant,
  CombatantUpdate,
  GameEvent,
  NpcTemplate,
} from "../types/rpg";

interface CampaignContextType {
  combatants: Combatant[];
  addCombatant: (
    name: string,
    hp: number,
    init: number,
    type: "player" | "npc",
    details?: Partial<Combatant>,
  ) => void;
  removeCombatant: (id: string) => void;
  updateCombatant: (id: string, updates: Partial<CombatantUpdate>) => void;
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

const CampaignContext = createContext<CampaignContextType>(
  {} as CampaignContextType,
);

export const CampaignProvider = ({ children }: { children: ReactNode }) => {
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [npcLibrary, setNpcLibrary] = useState<NpcTemplate[]>([]);
  const [diceHistory, setDiceHistory] = useState<string[]>([]);
  const [activeTurnId, setActiveTurnId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [lastEvent, setLastEvent] = useState<GameEvent | null>(null);

  // --- 2. CARREGAR DADOS AO INICIAR ---
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
        setIsLoaded(true); // Marca que o carregamento terminou
      }
    };
    loadData();
  }, []);

  // --- 3. SALVAR AUTOMATICAMENTE QUANDO MUDAR ---
  useEffect(() => {
    const saveData = async () => {
      if (isLoaded) {
        // Só salva se já tiver carregado os dados iniciais
        try {
          await AsyncStorage.setItem(
            "@rpg_npc_library",
            JSON.stringify(npcLibrary),
          );
        } catch (error) {
          console.error("Erro ao salvar NPCs:", error);
        }
      }
    };
    saveData();
  }, [npcLibrary, isLoaded]);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, message].slice(-50)); // Mantém apenas os últimos 50
  };

  const populateClassData = (npc: Partial<NpcTemplate>) => {
    if (npc.class && CLASS_DATA[npc.class as CharacterClass]) {
      const classInfo = CLASS_DATA[npc.class as CharacterClass];
      const npcLevel = npc.level || 1;

      const autoSkills = classInfo.skills.filter(
        (s) => (s.level || 1) <= npcLevel,
      );
      const autoStances = classInfo.stances;

      return {
        ...npc,
        skills: autoSkills,
        stances: autoStances,
      };
    }
    return npc;
  };

  // --- Lógica de Combate ---
  // const addCombatant = (
  //   baseName: string,
  //   hp: number,
  //   initiative: number,
  //   type: "player" | "npc",
  //   details?: Partial<Combatant> & { maxFocus?: number },
  // ) => {
  //   setCombatants((prev) => {
  //     const count = prev.filter((c) => c.baseName === baseName).length;
  //     const name = type === "npc" ? `${baseName} #${count + 1}` : baseName;

  //     // DEFINIÇÃO CORRETA DO FOCO
  //     // Tenta pegar do objeto 'focus' estruturado ou da propriedade 'maxFocus' antiga
  //     const maxFocusVal = details?.focus?.max || details?.maxFocus || 0;
  //     const currentFocusVal = details?.focus?.current ?? maxFocusVal;

  //     const newCombatant: Combatant = {
  //       id: Date.now().toString() + Math.random(),
  //       name,
  //       baseName,
  //       initiative,
  //       hp: { current: hp, max: hp },
  //       // AQUI ESTAVA O ERRO: Agora usamos as variáveis calculadas acima
  //       focus: { current: currentFocusVal, max: maxFocusVal },
  //       type,
  //       armorClass: details?.armorClass || 10,
  //       attributes: details?.attributes || {
  //         Força: { name: "Força", value: 10, modifier: 0 },
  //         Destreza: { name: "Destreza", value: 10, modifier: 0 },
  //         Constituição: { name: "Constituição", value: 10, modifier: 0 },
  //         Inteligência: { name: "Inteligência", value: 10, modifier: 0 },
  //         Sabedoria: { name: "Sabedoria", value: 10, modifier: 0 },
  //         Carisma: { name: "Carisma", value: 10, modifier: 0 },
  //       },
  //       equipment: details?.equipment,
  //       actions: details?.actions,
  //       stances: details?.stances || [],
  //       skills: details?.skills || [],
  //       spells: details?.spells || [],
  //       activeStanceId: null,
  //       turnActions: { standard: true, bonus: true, reaction: true },
  //       deathSaves: { successes: 0, failures: 0 }, // Inicializa death saves
  //     };

  //     return [...prev, newCombatant].sort(
  //       (a, b) => b.initiative - a.initiative,
  //     );
  //   });
  // };
  const addCombatant = (
    baseName: string,
    hp: number,
    init: number,
    type: "player" | "npc",
    details?: any,
  ) => {
    setCombatants((prev) => {
      let newCombatant: Combatant;
      if (type === "player" && details?.stats) {
        newCombatant = playerToCombatant(details, init);
      } else if (type === "npc" && details?.maxHp) {
        const count = prev.filter((c) => c.baseName === baseName).length;
        newCombatant = npcToCombatant(details, init, count + 1);
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
  };

  const updateCombatant = useCallback(
    (id: string, updates: Partial<Combatant>) => {
      setCombatants((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;

          // Merge inteligente para sub-objetos comuns
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

  const endTurnCombatant = (id: string) => {
    updateCombatant(id, {
      turnActions: { standard: true, bonus: true, reaction: true },
    });
  };

  const removeCombatant = (id: string) => {
    setCombatants((prev) => prev.filter((c) => c.id !== id));
  };

  const sortCombat = () => {
    setCombatants((prev) => prev.sort((a, b) => b.initiative - a.initiative));
  };

  const clearCombat = () => setCombatants([]);

  // --- Lógica de Bestiário ---

  const deleteNpcFromLibrary = (id: string) => {
    setNpcLibrary((prev) => prev.filter((n) => n.id !== id));
  };

  const updateNpcInLibrary = (id: string, updates: Partial<NpcTemplate>) => {
    // O AddNpcModal já enviou o array de 'skills' e 'stances' prontos e fundidos.
    // Não precisamos mais do populateClassData aqui, ele só destruiria os dados customizados.
    setNpcLibrary((prev) =>
      prev.map((npc) => {
        if (npc.id === id) {
          return { ...npc, ...updates } as NpcTemplate;
        }
        return npc;
      }),
    );
  };

  const saveNpcToLibrary = (npcRaw: Omit<NpcTemplate, "id">) => {
    // O npcRaw já vem com as skills corretas do modal!
    setNpcLibrary((prev) => [
      ...prev,
      { ...npcRaw, id: Date.now().toString() } as NpcTemplate,
    ]);
  };

  const addDiceRoll = (roll: string) => {
    setDiceHistory((prev) => [roll, ...prev].slice(0, 20));
  };

  return (
    <CampaignContext.Provider
      value={{
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
      }}
    >
      {children}
    </CampaignContext.Provider>
  );
};

export const useCampaign = () => useContext(CampaignContext);
