// src/context/CharacterContext.tsx
import { ANCESTRIES, CULTURAL_ORIGINS } from "@/data/origins";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { CLASS_DATA } from "../data/classData"; // <--- Importe o arquivo novo
import {
  AttributeName,
  Character,
  CharacterClass,
  EquipmentItem,
  Item,
  ItemType,
  MAGIC_CLASSES,
  Spell,
} from "../types/rpg";

// Chave para salvar no armazenamento do celular
const STORAGE_KEY = "@rpg_sheet_data_v2";

// Dados iniciais (Padrão caso não haja nada salvo)
const INITIAL_CHARACTER: Character = {
  name: "Novo Personagem",
  image: undefined,
  class: undefined, // O usuário vai escolher no Modal
  ancestry: undefined, // O usuário vai escolher no Modal
  culturalOrigin: undefined, // O usuário vai escolher no Modal

  // Valores padrão (Médios)
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

  stances: [], // Começa sem posturas de classe
  currentStanceIndex: -1, // Começa em Postura Neutra

  skills: [], // Começa sem habilidades

  // PREENCHIMENTO SEGURO (Evita crash no Inventário)
  equipment: {
    meleeWeapon: {
      name: "Desarmado",
      stats: "1 + FOR",
      defense: 0,
      description: "Punhos.",
    },
    rangedWeapon: { name: "Nenhuma", stats: "-", defense: 0, description: "" },
    armor: {
      name: "Roupas Comuns",
      stats: "",
      defense: 0,
      description: "Sem proteção.",
    },
    shield: { name: "Nenhum", stats: "", defense: 0, description: "" },
  },

  backpack: [],
  grimoire: [],
  silver: 0, // Geralmente começa com 0 e ganha pela Herança (Origem)
  backstory: "",
  trainedSkills: [],
};

interface CharacterContextType {
  character: Character;
  isLoading: boolean; // Novo estado para controlar o carregamento
  updateStat: (stat: "hp" | "focus", value: number) => void;
  setStanceIndex: (index: number) => void; // <--- ADICIONE ISSO
  updateImage: (base64Image: string) => void; // <--- Nova função
  resetCharacter: () => void; // Função para resetar os dados
  updateMaxStat: (stat: "hp" | "focus", newMax: number) => void;
  updateAttribute: (attr: AttributeName, newValue: number) => void;
  updateNameAndClass: (name: string, className?: CharacterClass) => void;
  updateEquipment: (
    slot: "meleeWeapon" | "rangedWeapon" | "armor",
    item: EquipmentItem
  ) => void;
  updateAncestry: (ancestryId: string) => void;
  updateOrigin: (originId: string) => void;
  updateSilver: (value: number) => void; // Define o valor exato
  performShortRest: () => void; // <--- Novo
  performLongRest: () => void; // <--- Novo
  updateBackstory: (text: string) => void;
  toggleTrainedSkill: (skillName: string) => void;
  addItem: (name: string, type: ItemType, quantity: number) => void;
  removeItem: (itemId: string) => void;
  updateItemQuantity: (itemId: string, change: number) => void;
  addSpell: (spell: Spell) => void;
  removeSpell: (spellId: string) => void;
}

const CharacterContext = createContext<CharacterContextType | undefined>(
  undefined
);

export const CharacterProvider = ({ children }: { children: ReactNode }) => {
  const [character, setCharacter] = useState<Character>(INITIAL_CHARACTER);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Efeito para CARREGAR os dados ao iniciar o app
  useEffect(() => {
    const loadData = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (jsonValue != null) {
          setCharacter(JSON.parse(jsonValue));
        }
      } catch (e) {
        console.error("Erro ao carregar dados:", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // 2. Efeito para SALVAR os dados automaticamente sempre que 'character' mudar
  useEffect(() => {
    // Só salva se NÃO estiver carregando (para evitar sobrescrever dados salvos com o inicial)
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

  const updateStat = (stat: "hp" | "focus", change: number) => {
    setCharacter((prev) => {
      const currentVal = prev.stats[stat].current;
      const maxVal = prev.stats[stat].max;
      const newValue = Math.min(Math.max(currentVal + change, 0), maxVal);

      return {
        ...prev,
        stats: {
          ...prev.stats,
          [stat]: { ...prev.stats[stat], current: newValue },
        },
      };
    });
  };

  const setStanceIndex = (index: number) => {
    setCharacter((prev) => ({
      ...prev,
      currentStanceIndex: index as any, // Cast para any ou atualize a tipagem de Character para aceitar -1
    }));
  };

  const resetCharacter = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setCharacter(INITIAL_CHARACTER);
    } catch (e) {
      console.error("Erro ao resetar:", e);
    }
  };

  const updateImage = (uri: string) => {
    setCharacter((prev) => ({ ...prev, image: uri }));
  };

  // 1. Função para atualizar Vida/Foco MÁXIMOS
  const updateMaxStat = (stat: "hp" | "focus", newMax: number) => {
    setCharacter((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        [stat]: {
          ...prev.stats[stat],
          max: newMax,
          // Opcional: Se o máximo diminuir para menos que o atual, reduz o atual também
          current: Math.min(prev.stats[stat].current, newMax),
        },
      },
    }));
  };

  // 2. Função para atualizar Atributos e Recalcular Modificador
  const updateAttribute = (attr: AttributeName, newValue: number) => {
    // LÓGICA DE LIMITE:
    // Math.max(0, ...) garante que não seja menor que 0
    // Math.min(..., 20) garante que não seja maior que 20
    const clampedValue = Math.max(0, Math.min(newValue, 20));

    // Calcula o modificador com base no valor limitado
    const newModifier = Math.floor((clampedValue - 10) / 2);

    setCharacter((prev) => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [attr]: {
          ...prev.attributes[attr],
          value: clampedValue, // Usa o valor limitado
          modifier: newModifier,
        },
      },
    }));
  };

  // 3. Função para atualizar Nome e Classe
  const updateNameAndClass = (name: string, className: CharacterClass) => {
    // 1. Busca os dados padrão da nova classe selecionada
    const newClassData = CLASS_DATA[className];

    // Segurança: Caso você ainda não tenha preenchido os dados daquela classe no arquivo
    if (!newClassData || !newClassData.skills || !newClassData.stances) {
      console.warn(`Dados faltantes para a classe ${className}`);
      // Atualiza só o nome e classe para não quebrar o app
      setCharacter((prev) => ({ ...prev, name, class: className }));
      return;
    }

    // 2. Atualiza o personagem substituindo Habilidades e Posturas
    setCharacter((prev) => ({
      ...prev,
      name,
      class: className,
      // Substituição Automática:
      skills: newClassData.skills,
      stances: newClassData.stances,
      currentStanceIndex: 0, // Reseta para a primeira postura

      // Opcional: Se a nova classe NÃO for mágica, você pode querer limpar o grimório
      grimoire: MAGIC_CLASSES.includes(className) ? prev.grimoire : [],
    }));
  };

  const updateEquipment = (
    slot: "meleeWeapon" | "rangedWeapon" | "armor" | "shield",
    item: EquipmentItem
  ) => {
    setCharacter((prev) => ({
      ...prev,
      equipment: {
        ...prev.equipment,
        [slot]: item,
      },
    }));
  };

  const updateAncestry = (ancestryId: string) => {
    const ancestryData = ANCESTRIES.find((a) => a.id === ancestryId);
    if (!ancestryData) return;

    // Acha a primeira origem compatível com essa ancestralidade para ser o padrão
    const defaultOrigin = CULTURAL_ORIGINS.find(
      (o) => o.ancestryId === ancestryId
    );

    setCharacter((prev) => ({
      ...prev,
      ancestry: {
        id: ancestryData.id,
        name: ancestryData.name,
        traitName: ancestryData.trait.name,
        traitDescription: ancestryData.trait.description,
      },
      // Reseta a origem para a primeira compatível (ou vazio se não achar)
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
  };

  // Função para mudar apenas a Origem (dentro da mesma ancestralidade)
  const updateOrigin = (originId: string) => {
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
  };

  const updateSilver = (value: number) => {
    setCharacter((prev) => ({ ...prev, silver: Math.max(0, value) }));
  };

  const performShortRest = () => {
    setCharacter((prev) => {
      const hpMax = prev.stats.hp.max;
      const focusMax = prev.stats.focus.max;

      // Calcula a cura (metade do total)
      const hpHeal = Math.floor(hpMax / 2);
      const focusHeal = Math.floor(focusMax / 2);

      // Soma ao atual, mas não deixa passar do máximo
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
  };

  // Recupera 100% da Vida e do Foco
  const performLongRest = () => {
    setCharacter((prev) => ({
      ...prev,
      stats: {
        hp: { ...prev.stats.hp, current: prev.stats.hp.max },
        focus: { ...prev.stats.focus, current: prev.stats.focus.max },
      },
    }));
  };

  const updateBackstory = (text: string) => {
    setCharacter((prev) => ({ ...prev, backstory: text }));
  };

  const toggleTrainedSkill = (skillName: string) => {
    setCharacter((prev) => {
      const skills = prev.trainedSkills || []; // Segurança caso seja undefined
      const exists = skills.includes(skillName);

      let newSkills;
      if (exists) {
        // Remove se já existir
        newSkills = skills.filter((s) => s !== skillName);
      } else {
        // Adiciona se não existir
        newSkills = [...skills, skillName];
      }

      return { ...prev, trainedSkills: newSkills };
    });
  };

  // 1. Adicionar novo item
  const addItem = (name: string, type: ItemType, quantity: number) => {
    const newItem: Item = {
      id: Date.now().toString(), // Gera um ID único simples
      name,
      type,
      quantity,
      // isKeyItem: type === "key", // Mantendo compatibilidade legado se necessário
    };

    setCharacter((prev) => ({
      ...prev,
      backpack: [...prev.backpack, newItem],
    }));
  };

  // 2. Remover item completamente
  const removeItem = (itemId: string) => {
    setCharacter((prev) => ({
      ...prev,
      backpack: prev.backpack.filter((item) => item.id !== itemId),
    }));
  };

  // 3. Alterar quantidade (Usar item ou achar mais)
  const updateItemQuantity = (itemId: string, change: number) => {
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
        .filter((item) => item.quantity > 0), // Remove automaticamente se chegar a 0
    }));
  };

  const addSpell = (spell: Spell) => {
    // Evita duplicatas
    const exists = character.grimoire?.some((s) => s.id === spell.id);
    if (exists) return;

    setCharacter((prev) => ({
      ...prev,
      grimoire: [...(prev.grimoire || []), spell],
    }));
  };

  const removeSpell = (spellId: string) => {
    setCharacter((prev) => ({
      ...prev,
      grimoire: (prev.grimoire || []).filter((s) => s.id !== spellId),
    }));
  };

  return (
    <CharacterContext.Provider
      value={{
        character,
        isLoading,
        updateStat,
        updateImage,
        setStanceIndex,
        resetCharacter,
        updateMaxStat, // <--- Expondo
        updateAttribute, // <--- Expondo
        updateNameAndClass, // <--- Expondo
        updateEquipment,
        updateAncestry,
        updateOrigin,
        updateSilver,
        performShortRest, // <--- Expondo
        performLongRest, // <--- Expondo
        updateBackstory,
        toggleTrainedSkill,
        addItem,
        removeItem,
        updateItemQuantity,
        addSpell,
        removeSpell,
      }}
    >
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
