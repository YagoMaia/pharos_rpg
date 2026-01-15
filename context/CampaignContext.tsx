import React, { createContext, ReactNode, useContext, useState } from "react";
import { CLASS_DATA } from "../data/classData"; // <--- 1. IMPORTANTE: Importar os dados
import { CharacterClass, Combatant, NpcTemplate } from "../types/rpg";

interface CampaignContextType {
  combatants: Combatant[];
  addCombatant: (
    name: string,
    hp: number,
    init: number,
    type: "player" | "npc",
    details?: Partial<Combatant>
  ) => void;
  removeCombatant: (id: string) => void;
  updateCombatant: (
    id: string,
    field:
      | "hp"
      | "initiative"
      | "currentFocus"
      | "activeStanceId"
      | "turnActions",
    value: any
  ) => void;
  sortCombat: () => void;
  clearCombat: () => void;

  npcLibrary: NpcTemplate[];
  saveNpcToLibrary: (npc: Omit<NpcTemplate, "id">) => void;
  deleteNpcFromLibrary: (id: string) => void;
  updateNpcInLibrary: (id: string, npc: Partial<NpcTemplate>) => void;

  diceHistory: string[];
  addDiceRoll: (roll: string) => void;
  endTurnCombatant: (id: string) => void;
}

const CampaignContext = createContext<CampaignContextType>(
  {} as CampaignContextType
);

export const CampaignProvider = ({ children }: { children: ReactNode }) => {
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [npcLibrary, setNpcLibrary] = useState<NpcTemplate[]>([]);
  const [diceHistory, setDiceHistory] = useState<string[]>([]);

  // --- HELPER: Preencher Skills/Stances por Classe ---
  const populateClassData = (npc: Partial<NpcTemplate>) => {
    // Se tiver classe definida, puxa os dados
    if (npc.class && CLASS_DATA[npc.class as CharacterClass]) {
      const classInfo = CLASS_DATA[npc.class as CharacterClass];
      const npcLevel = npc.level || 1;

      // 1. Filtra Skills por Nível
      const autoSkills = classInfo.skills.filter(
        (s) => (s.level || 1) <= npcLevel
      );

      // 2. Pega Posturas
      const autoStances = classInfo.stances;

      // Retorna o objeto mesclado (prioriza o que já existia manualmente se quiser,
      // ou sobrescreve. Aqui estamos mesclando para garantir que tenha as da classe)

      // Nota: Se quiser que seja ESTRITAMENTE igual ao player (automático),
      // substitua as arrays. Se quiser permitir customização do Mestre + Classe, use spread.
      // Abaixo: Substituição Automática (comportamento Player)
      return {
        ...npc,
        skills: autoSkills,
        stances: autoStances,
      };
    }
    return npc;
  };

  // --- Lógica de Combate ---
  const addCombatant = (
    baseName: string,
    hp: number,
    initiative: number,
    type: "player" | "npc",
    details?: Partial<Combatant>
  ) => {
    setCombatants((prev) => {
      const count = prev.filter((c) => c.baseName === baseName).length;
      const name = type === "npc" ? `${baseName} #${count + 1}` : baseName;

      // Se for Player entrando em combate, assume-se que os dados já estão certos.
      // Se for NPC, garantimos que skills/stances estejam preenchidas caso venham do Library.

      const newCombatant: Combatant = {
        id: Date.now().toString() + Math.random(),
        name,
        baseName,
        initiative,
        hp: { current: hp, max: hp },
        type,
        armorClass: details?.armorClass || 10,
        maxFocus: details?.maxFocus || 0,
        currentFocus: details?.maxFocus || 0,
        attributes: details?.attributes,
        equipment: details?.equipment,
        actions: details?.actions,
        stances: details?.stances,
        skills: details?.skills,
        activeStanceId: null,
        turnActions: { standard: true, bonus: true, reaction: true }, // <--- Inicializa
      };

      return [...prev, newCombatant].sort(
        (a, b) => b.initiative - a.initiative
      );
    });
  };

  const updateCombatant = (id: string, field: string, value: any) => {
    setCombatants((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        if (field === "hp") {
          return { ...c, hp: { ...c.hp, current: value } };
        }
        if (field === "initiative") {
          return { ...c, initiative: value };
        }
        if (field === "currentFocus") {
          const newFocus = Math.max(0, Math.min(value, c.maxFocus));
          return { ...c, currentFocus: newFocus };
        }
        if (field === "activeStanceId") {
          return { ...c, activeStanceId: value };
        }
        if (field === "turnActions") {
          return { ...c, turnActions: value };
        }
        return c;
      })
    );
  };

  const endTurnCombatant = (id: string) => {
    updateCombatant(id, "turnActions", {
      standard: true,
      bonus: true,
      reaction: true,
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

  const saveNpcToLibrary = (npcRaw: Omit<NpcTemplate, "id">) => {
    // Aplica a lógica de classe antes de salvar
    const npcWithClassData = populateClassData(npcRaw);

    setNpcLibrary((prev) => [
      ...prev,
      { ...npcWithClassData, id: Date.now().toString() } as NpcTemplate,
    ]);
  };

  const deleteNpcFromLibrary = (id: string) => {
    setNpcLibrary((prev) => prev.filter((n) => n.id !== id));
  };

  const updateNpcInLibrary = (id: string, updates: Partial<NpcTemplate>) => {
    // Se a atualização mudar classe ou nível, precisamos recalcular
    // Mas cuidado: 'updates' pode não ter todos os campos.
    // A melhor estratégia é pegar o antigo, aplicar o update, e repopular.

    setNpcLibrary((prev) =>
      prev.map((npc) => {
        if (npc.id === id) {
          const merged = { ...npc, ...updates };
          // Se classe ou nível mudaram no update, repopula skills
          if (updates.class || updates.level) {
            return populateClassData(merged) as NpcTemplate;
          }
          return merged;
        }
        return npc;
      })
    );
  };

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
        endTurnCombatant,
      }}
    >
      {children}
    </CampaignContext.Provider>
  );
};

export const useCampaign = () => useContext(CampaignContext);
