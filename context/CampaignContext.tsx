import React, { createContext, ReactNode, useContext, useState } from "react";
import { Combatant, NpcTemplate } from "../types/rpg";

interface CampaignContextType {
  // Combate
  combatants: Combatant[];
  addCombatant: (
    name: string,
    hp: number,
    init: number,
    type: "player" | "npc"
  ) => void;
  removeCombatant: (id: string) => void;
  updateCombatant: (
    id: string,
    field: "hp" | "initiative",
    value: number
  ) => void;
  sortCombat: () => void;
  clearCombat: () => void;

  // Bestiário (NPCs salvos)
  npcLibrary: NpcTemplate[];
  saveNpcToLibrary: (npc: Omit<NpcTemplate, "id">) => void;
  deleteNpcFromLibrary: (id: string) => void;

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
    type: "player" | "npc"
  ) => {
    setCombatants((prev) => {
      const count = prev.filter((c) => c.baseName === baseName).length;
      const name = type === "npc" ? `${baseName} #${count + 1}` : baseName;

      return [
        ...prev,
        {
          id: Date.now().toString() + Math.random(),
          name,
          baseName,
          initiative,
          hp: { current: hp, max: hp },
          type,
        },
      ].sort((a, b) => b.initiative - a.initiative);
    });
  };

  const removeCombatant = (id: string) => {
    setCombatants((prev) => prev.filter((c) => c.id !== id));
  };

  const updateCombatant = (
    id: string,
    field: "hp" | "initiative",
    value: number
  ) => {
    setCombatants((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        if (field === "hp") return { ...c, hp: { ...c.hp, current: value } }; // Permite negativo se quiser
        if (field === "initiative") return { ...c, initiative: value };
        return c;
      })
    );
  };

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
      }}
    >
      {children}
    </CampaignContext.Provider>
  );
};

export const useCampaign = () => useContext(CampaignContext);
