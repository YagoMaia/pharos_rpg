import React, { createContext, ReactNode, useContext, useState } from "react";
import { Combatant, NpcTemplate } from "../types/rpg";

interface CampaignContextType {
  // Combate
  combatants: Combatant[];
  addCombatant: (
    name: string,
    hp: number,
    init: number,
    type: "player" | "npc",
    details?: Partial<Combatant> // <--- Novo argumento opcional
  ) => void;
  removeCombatant: (id: string) => void;
  updateCombatant: (
    id: string,
    field: "hp" | "initiative" | "currentFocus" | "activeStanceId",
    value: any
  ) => void;
  sortCombat: () => void;
  clearCombat: () => void;

  // Bestiário (NPCs salvos)
  npcLibrary: NpcTemplate[];
  saveNpcToLibrary: (npc: Omit<NpcTemplate, "id">) => void;
  deleteNpcFromLibrary: (id: string) => void;
  updateNpcInLibrary: (id: string, npc: Partial<NpcTemplate>) => void;

  // Histórico de Dados
  diceHistory: string[];
  addDiceRoll: (roll: string) => void;
}

const CampaignContext = createContext<CampaignContextType>(
  {} as CampaignContextType
);

export const CampaignProvider = ({ children }: { children: ReactNode }) => {
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [npcLibrary, setNpcLibrary] = useState<NpcTemplate[]>([]);
  const [diceHistory, setDiceHistory] = useState<string[]>([]);

  // --- Lógica de Combate ---
  const addCombatant = (
    baseName: string,
    hp: number,
    initiative: number,
    type: "player" | "npc",
    details?: Partial<Combatant> // <--- Recebe os detalhes
  ) => {
    setCombatants((prev) => {
      const count = prev.filter((c) => c.baseName === baseName).length;
      const name = type === "npc" ? `${baseName} #${count + 1}` : baseName;

      const newCombatant: Combatant = {
        id: Date.now().toString() + Math.random(),
        name,
        baseName,
        initiative,
        hp: { current: hp, max: hp },
        type,
        // Valores padrão ou vindos dos detalhes
        armorClass: details?.armorClass || 10,
        maxFocus: details?.maxFocus || 0,
        currentFocus: details?.maxFocus || 0, // Começa com foco cheio
        attributes: details?.attributes,
        equipment: details?.equipment,
        actions: details?.actions,
        stances: details?.stances, // O array de objetos
        skills: details?.skills, // O array de objetos
        activeStanceId: null, // Começa sem postura
      };

      return [...prev, newCombatant].sort(
        (a, b) => b.initiative - a.initiative
      );
    });
  };

  // ... (Update combatant logic precisa saber lidar com focus e AC se quiser editar)
  const updateCombatant = (id: string, field: string, value: any) => {
    setCombatants((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;

        // Atualiza HP
        if (field === "hp") {
          const newHp = Math.max(0, Math.min(value, c.hp.max)); // Opcional: limitar ao máx
          return { ...c, hp: { ...c.hp, current: value } }; // Permite passar do max se o mestre quiser (ex: vida temporária), ou use newHp
        }

        // Atualiza Iniciativa
        if (field === "initiative") {
          return { ...c, initiative: value };
        }

        // --- NOVOS CAMPOS ---

        // Atualiza Foco Atual
        if (field === "currentFocus") {
          const newFocus = Math.max(0, Math.min(value, c.maxFocus));
          return { ...c, currentFocus: newFocus };
        }

        // Atualiza Postura Ativa
        if (field === "activeStanceId") {
          return { ...c, activeStanceId: value };
        }

        return c;
      })
    );
  };

  const removeCombatant = (id: string) => {
    setCombatants((prev) => prev.filter((c) => c.id !== id));
  };

  //   const updateCombatant = (
  //     id: string,
  //     field: "hp" | "initiative",
  //     value: number
  //   ) => {
  //     setCombatants((prev) =>
  //       prev.map((c) => {
  //         if (c.id !== id) return c;
  //         if (field === "hp") return { ...c, hp: { ...c.hp, current: value } }; // Permite negativo se quiser
  //         if (field === "initiative") return { ...c, initiative: value };
  //         return c;
  //       })
  //     );
  //   };

  const sortCombat = () => {
    setCombatants((prev) =>
      [...prev].sort((a, b) => b.initiative - a.initiative)
    );
  };

  const clearCombat = () => setCombatants([]);

  // --- Lógica de Bestiário ---
  const saveNpcToLibrary = (npc: Omit<NpcTemplate, "id">) => {
    setNpcLibrary((prev) => [...prev, { ...npc, id: Date.now().toString() }]);
  };

  const deleteNpcFromLibrary = (id: string) => {
    setNpcLibrary((prev) => prev.filter((n) => n.id !== id));
  };

  const updateNpcInLibrary = (id: string, updates: Partial<NpcTemplate>) => {
    setNpcLibrary((prev) =>
      prev.map((npc) => (npc.id === id ? { ...npc, ...updates } : npc))
    );
  };

  // --- Lógica de Dados ---
  const addDiceRoll = (roll: string) => {
    setDiceHistory((prev) => [roll, ...prev].slice(0, 20));
  };

  return (
    <CampaignContext.Provider
      value={{
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
      }}
    >
      {children}
    </CampaignContext.Provider>
  );
};

export const useCampaign = () => useContext(CampaignContext);
