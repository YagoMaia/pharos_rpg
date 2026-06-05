// src/context/CharacterContext.tsx
import { SKILL_GROUPS } from "@/data/expertiseData";
import { ANCESTRIES, CULTURAL_ORIGINS } from "@/data/origins";
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
import { CLASS_DATA } from "../data/classData";
import {
    AttributeName,
    Character,
    CharacterClass,
    CustomFeat,
    EquipmentItem,
    Feat,
    Item,
    ItemType,
    MAGIC_CLASSES,
    ProficiencyLevel,
    Specialization,
    Spell
} from "../types/rpg";

// Chave para salvar no armazenamento do celular
const STORAGE_KEY = "@rpg_sheet_data_v2";

// Dados iniciais (Padrão caso não haja nada salvo)
const INITIAL_CHARACTER: Character = {
  name: "Novo Personagem",
  level: 1,
  image: undefined,
  class: undefined,
  ancestry: undefined,
  culturalOrigin: undefined,
  deathSaves: { successes: 0, failures: 0 },

  stats: {
    hp: { current: 20, max: 20 },
    focus: { current: 10, max: 10 },
  },

  attributes: {
    Força: { name: "Força", value: 10, modifier: 0 },
    Destreza: { name: "Destreza", value: 10, modifier: 0 },
    Constituição: { name: "Constituição", value: 10, modifier: 0 },
    Inteligência: { name: "Inteligência", value: 10, modifier: 0 },
    Sabedoria: { name: "Sabedoria", value: 10, modifier: 0 },
    Carisma: { name: "Carisma", value: 10, modifier: 0 },
  },

  stances: [],
  currentStanceIndex: -1,

  skills: [],

  equipment: {
    meleeWeapon: {
      name: "Desarmado",
      stats: "1 + FOR",
      defense: 0,
      description: "Punhos.",
      weight: 0,
    },
    rangedWeapon: {
      name: "Nenhuma",
      stats: "-",
      defense: 0,
      description: "",
      weight: 0,
    },
    armor: {
      name: "Roupas Comuns",
      stats: "",
      defense: 0,
      description: "Sem proteção.",
      weight: 1,
    },
    shield: {
      name: "Nenhum",
      stats: "",
      defense: 0,
      description: "",
      weight: 0,
    },
  },

  backpack: [],
  grimoire: [],
  silver: 0,
  backstory: "",

  turnActions: {
    standard: true,
    bonus: true,
    reaction: true,
  },
  spells: [],
  feats: [],
  pet: null,
};

interface CharacterContextType {
  character: Character;
  isLoading: boolean;
  updateStat: (stat: "hp" | "focus", value: number) => void;
  setStanceIndex: (index: number) => void;
  updateImage: (base64Image: string) => void;
  resetCharacter: () => void;
  updateMaxStat: (stat: "hp" | "focus", newMax: number) => void;
  updateAttribute: (attr: AttributeName, newValue: number) => void;
  updateNameAndClass: (name: string, className?: CharacterClass) => void;
  updateEquipment: (
    slot: "meleeWeapon" | "rangedWeapon" | "armor" | "shield",
    item: EquipmentItem,
  ) => void;
  updateAncestry: (ancestryId: string) => void;
  updateOrigin: (originId: string) => void;
  updateSilver: (value: number) => void;
  performShortRest: () => void;
  performLongRest: () => void;
  updateBackstory: (text: string) => void;
  updateSkillLevel: (skillName: string, newLevel: ProficiencyLevel) => void;
  addItem: (
    name: string,
    type: ItemType,
    quantity: number,
    weight: number,
  ) => void;
  removeItem: (itemId: string) => void;
  updateItemQuantity: (itemId: string, change: number) => void;
  addSpell: (spell: Spell) => void;
  removeSpell: (spellId: string) => void;
  updateDeathSave: (type: "success" | "failure", value: number) => void;
  updateLevel: (newLevel: number) => void;
  updateCurrentStat: (stat: "hp" | "focus", newValue: number) => void;
  updateItem: (itemId: string, data: Partial<Item>) => void;
  importCharacter: (data: Partial<Character>) => void;
  getLoadMetrics: () => {
    currentLoad: number;
    maxLoad: number;
    isOverloaded: boolean;
  };
  toggleAction: (type: "standard" | "bonus" | "reaction") => void;
  endTurn: () => void;
  applySpecialization: (spec: Specialization) => void;
  addFeat: (feat: Feat) => void;
  removeFeat: (featId: string) => void;
  setFactionFeat: (feat: CustomFeat | null) => void;
  setSpecialFeat: (feat: CustomFeat | null) => void;
  setPet: (pet: Pet | null) => void;
  updatePet: (updates: Partial<Pet>) => void;
}

const CharacterContext = createContext<CharacterContextType | undefined>(
  undefined,
);

export const CharacterProvider = ({ children }: { children: ReactNode }) => {
  const [character, setCharacter] = useState<Character>(INITIAL_CHARACTER);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (jsonValue != null) {
          const parsed = JSON.parse(jsonValue);

          // Migração: remove perícias passivas com nível 0 que ficaram no array
          // (limpeza de dados legados antes do fix)
          if (parsed.skills && Array.isArray(parsed.skills)) {
            parsed.skills = parsed.skills.filter(
              (s: any) => !!s.id || (s.level && s.level > 0)
            );
          }

          setCharacter(parsed);
        }
      } catch (e) {
        console.error("Erro ao carregar dados:", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const saveData = async () => {
        try {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(character));
        } catch (e) {
          console.error("Erro ao salvar dados:", e);
        }
      };
      saveData();
    }
  }, [character, isLoading]);

  const updateStat = useCallback((stat: "hp" | "focus", change: number) => {
    setCharacter((prev) => {
      const currentVal = prev.stats[stat].current;
      const maxVal = prev.stats[stat].max;
      const newValue = Math.min(Math.max(currentVal + change, 0), maxVal);

      let newDeathSaves = prev.deathSaves;
      if (stat === "hp" && newValue > 0) {
        newDeathSaves = { successes: 0, failures: 0 };
      }

      return {
        ...prev,
        stats: {
          ...prev.stats,
          [stat]: { ...prev.stats[stat], current: newValue },
        },
        deathSaves: newDeathSaves,
      };
    });
  }, []);

  const updateDeathSave = useCallback(
    (type: "success" | "failure", value: number) => {
      setCharacter((prev) => ({
        ...prev,
        deathSaves: {
          ...prev.deathSaves,
          [type === "success" ? "successes" : "failures"]: value,
        },
      }));
    },
    [],
  );

  const setStanceIndex = useCallback((index: number) => {
    setCharacter((prev) => ({
      ...prev,
      currentStanceIndex: index,
    }));
  }, []);

  const resetCharacter = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setCharacter(INITIAL_CHARACTER);
    } catch (e) {
      console.error("Erro ao resetar:", e);
    }
  }, []);

  const updateImage = useCallback((uri: string) => {
    setCharacter((prev) => ({ ...prev, image: uri }));
  }, []);

  const updateMaxStat = useCallback((stat: "hp" | "focus", newMax: number) => {
    setCharacter((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        [stat]: {
          ...prev.stats[stat],
          max: newMax,
        },
      },
    }));
  }, []);

  const updateAttribute = useCallback((attr: AttributeName, newValue: number) => {
    const clampedValue = Math.max(0, Math.min(newValue, 20));
    const newModifier = Math.floor((clampedValue - 10) / 2);

    setCharacter((prev) => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [attr]: {
          ...prev.attributes[attr],
          value: clampedValue,
          modifier: newModifier,
        },
      },
    }));
  }, []);

  const updateNameAndClass = useCallback(
    (name: string, className?: CharacterClass) => {
      if (!className) {
        setCharacter((prev) => ({ ...prev, name }));
        return;
      }

      const newClassData = CLASS_DATA[className];

      if (!newClassData || !newClassData.skills || !newClassData.stances) {
        console.warn(`Dados faltantes para a classe ${className}`);
        setCharacter((prev) => ({ ...prev, name, class: className }));
        return;
      }

      setCharacter((prev) => ({
        ...prev,
        name,
        class: className,
        skills: newClassData.skills,
        stances: newClassData.stances,
        currentStanceIndex: -1,
        grimoire: MAGIC_CLASSES.includes(className) ? prev.grimoire : [],
      }));
    },
    [],
  );

  const updateEquipment = useCallback(
    (
      slot: "meleeWeapon" | "rangedWeapon" | "armor" | "shield",
      item: EquipmentItem,
    ) => {
      setCharacter((prev) => ({
        ...prev,
        equipment: {
          ...prev.equipment,
          [slot]: item,
        },
      }));
    },
    [],
  );

  const updateAncestry = useCallback((ancestryId: string) => {
    const ancestryData = ANCESTRIES.find((a) => a.id === ancestryId);
    if (!ancestryData) return;

    const defaultOrigin = CULTURAL_ORIGINS.find(
      (o) => o.ancestryId === ancestryId,
    );

    setCharacter((prev) => ({
      ...prev,
      ancestry: {
        id: ancestryData.id,
        name: ancestryData.name,
        traitName: ancestryData.trait.name,
        traitDescription: ancestryData.trait.description,
      },
      culturalOrigin: defaultOrigin
        ? {
            id: defaultOrigin.id,
            name: defaultOrigin.name,
            culturalTrait: defaultOrigin.culturalTrait,
            heritage: defaultOrigin.heritage,
            languages: defaultOrigin.languages,
          }
        : prev.culturalOrigin,
    }));
  }, []);

  const updateOrigin = useCallback((originId: string) => {
    const originData = CULTURAL_ORIGINS.find((o) => o.id === originId);
    if (!originData) return;

    setCharacter((prev) => ({
      ...prev,
      culturalOrigin: {
        id: originData.id,
        name: originData.name,
        culturalTrait: originData.culturalTrait,
        heritage: originData.heritage,
        languages: originData.languages,
      },
    }));
  }, []);

  const updateSilver = useCallback((value: number) => {
    setCharacter((prev) => ({ ...prev, silver: Math.max(0, value) }));
  }, []);

  const performShortRest = useCallback(() => {
    setCharacter((prev) => {
      const hpMax = prev.stats.hp.max;
      const focusMax = prev.stats.focus.max;
      const hpHeal = Math.floor(hpMax / 2);
      const focusHeal = Math.floor(focusMax / 2);
      const newHp = Math.min(hpMax, prev.stats.hp.current + hpHeal);
      const newFocus = Math.min(focusMax, prev.stats.focus.current + focusHeal);

      return {
        ...prev,
        stats: {
          hp: { ...prev.stats.hp, current: newHp },
          focus: { ...prev.stats.focus, current: newFocus },
        },
      };
    });
  }, []);

  const performLongRest = useCallback(() => {
    setCharacter((prev) => ({
      ...prev,
      stats: {
        hp: { ...prev.stats.hp, current: prev.stats.hp.max },
        focus: { ...prev.stats.focus, current: prev.stats.focus.max },
      },
    }));
  }, []);

  const updateBackstory = useCallback((text: string) => {
    setCharacter((prev) => ({ ...prev, backstory: text }));
  }, []);

  const addItem = useCallback(
    (name: string, type: ItemType, quantity: number, weight: number) => {
      const newItem: Item = {
        id: Date.now().toString(),
        name,
        type,
        quantity,
        weight,
      };

      setCharacter((prev) => ({
        ...prev,
        backpack: [...prev.backpack, newItem],
      }));
    },
    [],
  );

  const removeItem = useCallback((itemId: string) => {
    setCharacter((prev) => ({
      ...prev,
      backpack: prev.backpack.filter((item) => item.id !== itemId),
    }));
  }, []);

  const updateItemQuantity = useCallback((itemId: string, change: number) => {
    setCharacter((prev) => ({
      ...prev,
      backpack: prev.backpack
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + change;
            return { ...item, quantity: Math.max(0, newQty) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0),
    }));
  }, []);

  const addSpell = useCallback((spell: Spell) => {
    setCharacter((prev) => {
      const exists = prev.grimoire?.some((s) => s.id === spell.id);
      if (exists) return prev;
      return {
        ...prev,
        grimoire: [...(prev.grimoire || []), spell],
      };
    });
  }, []);

  const removeSpell = useCallback((spellId: string) => {
    setCharacter((prev) => ({
      ...prev,
      grimoire: (prev.grimoire || []).filter((s) => s.id !== spellId),
    }));
  }, []);

  const updateLevel = useCallback((newLevel: number) => {
    const validLevel = Math.max(1, Math.min(newLevel, 20));

    setCharacter((prev) => {
      let updatedSkills = prev.skills;

      if (prev.class && CLASS_DATA[prev.class]) {
        const allClassSkills = CLASS_DATA[prev.class].skills;
        const newSkillsToAdd = allClassSkills.filter(
          (refSkill) =>
            (refSkill.level || 1) <= validLevel &&
            !prev.skills.some((s) => s.id === refSkill.id),
        );

        if (newSkillsToAdd.length > 0) {
          updatedSkills = [...prev.skills, ...newSkillsToAdd];
        }
      }

      return {
        ...prev,
        level: validLevel,
        skills: updatedSkills,
      };
    });
  }, []);

  const updateCurrentStat = useCallback((stat: "hp" | "focus", newValue: number) => {
    setCharacter((prev) => {
      const maxVal = prev.stats[stat].max;
      const validValue = Math.max(0, Math.min(newValue, maxVal));

      return {
        ...prev,
        stats: {
          ...prev.stats,
          [stat]: { ...prev.stats[stat], current: validValue },
        },
      };
    });
  }, []);

  const updateItem = useCallback((itemId: string, data: Partial<Item>) => {
    setCharacter((prev) => ({
      ...prev,
      backpack: prev.backpack.map((item) =>
        item.id === itemId ? { ...item, ...data } : item,
      ),
    }));
  }, []);

  const importCharacter = useCallback((importedData: Partial<Character>) => {
    setCharacter((prev) => {
      const migratedCharacter: Character = {
        ...INITIAL_CHARACTER,
        ...importedData,
        stats: {
          ...INITIAL_CHARACTER.stats,
          ...(importedData.stats || {}),
        },
        attributes: {
          ...INITIAL_CHARACTER.attributes,
          ...(importedData.attributes || {}),
        },
        level: importedData.level || 1,
        deathSaves: importedData.deathSaves || { successes: 0, failures: 0 },
      };

      return migratedCharacter;
    });
  }, []);

  const getLoadMetrics = useCallback(() => {
    const backpackWeight = character.backpack.reduce((total, item) => {
      return total + (item.weight || 0) * item.quantity;
    }, 0);

    const equipmentWeight = Object.values(character.equipment).reduce(
      (total, item) => {
        return total + (item.weight || 0);
      },
      0,
    );

    const currentLoad = parseFloat(
      (backpackWeight + equipmentWeight).toFixed(1),
    );

    const strength = character.attributes["Força"]?.value || 0;
    const maxLoad = strength * 5;

    return {
      currentLoad,
      maxLoad,
      isOverloaded: currentLoad > maxLoad,
    };
  }, [character.backpack, character.equipment, character.attributes]);

  const toggleAction = useCallback((type: "standard" | "bonus" | "reaction") => {
    setCharacter((prev) => {
      const currentActions = prev.turnActions || {
        standard: true,
        bonus: true,
        reaction: true,
      };

      return {
        ...prev,
        turnActions: {
          ...currentActions,
          [type]: !currentActions[type],
        },
      };
    });
  }, []);

  const endTurn = useCallback(() => {
    setCharacter((prev) => ({
      ...prev,
      turnActions: {
        standard: true,
        bonus: true,
        reaction: true,
      },
    }));
  }, []);

  const applySpecialization = useCallback((spec: Specialization) => {
    setCharacter((prev) => {
      const updated = { ...prev, specialization: spec };
      if (spec.classRequired === "Corsário" && spec.newStances) {
        updated.stances = spec.newStances;
        updated.currentStanceIndex = -1;
      }
      if (!updated.feats) {
        updated.feats = [];
      }
      return updated;
    });
  }, []);

  const addFeat = useCallback((feat: Feat) => {
    setCharacter((prev) => {
      if (prev.feats?.some((f) => f.id === feat.id)) return prev;
      return {
        ...prev,
        feats: [...(prev.feats || []), feat],
      };
    });
  }, []);

  const removeFeat = useCallback((featId: string) => {
    setCharacter((prev) => ({
      ...prev,
      feats: prev.feats?.filter((f) => f.id !== featId) || [],
    }));
  }, []);

  const setFactionFeat = useCallback((feat: CustomFeat | null) => {
    setCharacter((prev) => ({ ...prev, factionFeat: feat }));
  }, []);

  const setSpecialFeat = useCallback((feat: CustomFeat | null) => {
    setCharacter((prev) => ({ ...prev, specialFeat: feat }));
  }, []);

  const setPet = useCallback((pet: Pet | null) => {
    setCharacter((prev) => ({ ...prev, pet }));
  }, []);

  const updatePet = useCallback((updates: Partial<Pet>) => {
    setCharacter((prev) => {
      if (!prev.pet) return prev;
      return {
        ...prev,
        pet: { ...prev.pet, ...updates },
      };
    });
  }, []);

  const updateSkillLevel = useCallback(
    (skillName: string, newLevel: ProficiencyLevel) => {
      setCharacter((prev) => {
        const skillExists = prev.skills.some((s) => s.name === skillName);
        let updatedSkills;

        if (skillExists) {
          if (newLevel === 0) {
            // Remove perícias passivas (sem id) quando voltam para nível 0
            updatedSkills = prev.skills.filter((s) => {
              if (s.name === skillName && !s.id) return false;
              // Se for skill de combate (tem id) com mesmo nome, apenas atualiza o level
              if (s.name === skillName && s.id) return true;
              return true;
            });
            // Atualiza skills de combate que tenham o mesmo nome (caso raro)
            updatedSkills = updatedSkills.map((s) =>
              s.name === skillName ? { ...s, level: newLevel } : s,
            );
          } else {
            updatedSkills = prev.skills.map((s) =>
              s.name === skillName ? { ...s, level: newLevel } : s,
            );
          }
        } else {
          // Busca o atributo correto percorrendo os grupos de perícias
          const group = SKILL_GROUPS.find((g) => g.skills.includes(skillName));
          const attribute = (group?.attribute as AttributeName) || "Força";

          updatedSkills = [
            ...prev.skills,
            {
              name: skillName,
              level: newLevel,
              attribute: attribute,
            },
          ];
        }

        return { ...prev, skills: updatedSkills };
      });
    },
    [],
  );

  const contextValue = useMemo(
    () => ({
      character,
      isLoading,
      updateStat,
      updateImage,
      setStanceIndex,
      resetCharacter,
      updateMaxStat,
      updateAttribute,
      updateNameAndClass,
      updateEquipment,
      updateAncestry,
      updateOrigin,
      updateSilver,
      performShortRest,
      performLongRest,
      updateBackstory,
      updateSkillLevel,
      addItem,
      removeItem,
      updateItemQuantity,
      addSpell,
      removeSpell,
      updateDeathSave,
      updateLevel,
      updateCurrentStat,
      updateItem,
      importCharacter,
      getLoadMetrics,
      toggleAction,
      endTurn,
      applySpecialization,
      addFeat,
      removeFeat,
      setFactionFeat,
      setSpecialFeat,
      setPet,
      updatePet,
    }),
    [
      character,
      isLoading,
      updateStat,
      updateImage,
      setStanceIndex,
      resetCharacter,
      updateMaxStat,
      updateAttribute,
      updateNameAndClass,
      updateEquipment,
      updateAncestry,
      updateOrigin,
      updateSilver,
      performShortRest,
      performLongRest,
      updateBackstory,
      updateSkillLevel,
      addItem,
      removeItem,
      updateItemQuantity,
      addSpell,
      removeSpell,
      updateDeathSave,
      updateLevel,
      updateCurrentStat,
      updateItem,
      importCharacter,
      getLoadMetrics,
      toggleAction,
      endTurn,
      applySpecialization,
      addFeat,
      removeFeat,
      setFactionFeat,
      setSpecialFeat,
      setPet,
      updatePet,
    ],
  );

  return (
    <CharacterContext.Provider value={contextValue}>
      {children}
    </CharacterContext.Provider>
  );
};

export const useCharacter = () => {
  const context = useContext(CharacterContext);
  if (!context)
    throw new Error("useCharacter must be used within a CharacterProvider");
  return context;
};
