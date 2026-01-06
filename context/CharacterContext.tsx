// src/context/CharacterContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Character } from "../types/rpg";

// Chave para salvar no armazenamento do celular
const STORAGE_KEY = "@rpg_sheet_data_v2";

// Dados iniciais (Padrão caso não haja nada salvo)
const INITIAL_CHARACTER: Character = {
  name: "Arindal",
  image: undefined, // <--- Inicializa como indefinido
  class: "Mago",
  ancestry: { name: "Elfo", trait: "Visão no Escuro" },
  culturalOrigin: {
    name: "Academia Arcana",
    heritages: ["Dracônico", "História"],
  },
  stats: { hp: { current: 20, max: 25 }, focus: { current: 10, max: 15 } },
  attributes: {
    Força: { name: "Força", value: 10, modifier: 0 },
    Destreza: { name: "Destreza", value: 14, modifier: 2 },
    Constituição: { name: "Constituição", value: 12, modifier: 1 },
    Inteligência: { name: "Inteligência", value: 18, modifier: 4 },
    Sabedoria: { name: "Sabedoria", value: 14, modifier: 2 },
    Carisma: { name: "Carisma", value: 8, modifier: -1 },
  },
  stances: [
    {
      id: "1",
      name: "Postura do Falcão",
      benefit: "+2 nas jogadas de ataque com armas à distância.",
      restriction: "Não pode realizar ataques corpo a corpo.",
      maneuver:
        "Gaste 1 Foco para aumentar o alcance da arma em 9m até o fim do turno.",
      recovery: undefined,
    },
    {
      id: "2",
      name: "Postura da Montanha",
      benefit: "Recebe Resistência a dano físico igual ao modificador de CON.",
      restriction: "Seu deslocamento é reduzido à metade.",
      maneuver: "Gaste 2 Foco para forçar um inimigo a atacar você.",
      recovery: "Recupera 1 de Foco se terminar o turno sem se mover.",
    },
  ],
  currentStanceIndex: 0,
  skills: [
    {
      id: "1",
      name: "Bola de Fogo",
      cost: 3,
      actionType: "Padrão",
      description: "Dano em área",
    },
    {
      id: "2",
      name: "Escudo Arcano",
      cost: 1,
      actionType: "Reação",
      description: "+5 CA",
    },
    {
      id: "3",
      name: "Teleporte",
      cost: 2,
      actionType: "Movimento",
      description: "Move 9m",
    },
    {
      id: "4",
      name: "Analisar",
      cost: 0,
      actionType: "Livre",
      description: "Identifica item",
    },
  ],
  equipment: { meleeWeapon: "Adaga", rangedWeapon: "Nenhuma", armor: "Túnica" },
  backpack: [
    { id: "1", name: "Poção de Cura 1", quantity: 10, type: "consumable" },
    { id: "2", name: "Chave da Cripta", quantity: 1, type: "key" },
    { id: "3", name: "Adaga Extra", quantity: 1, type: "equipment" },
  ],
  grimoire: [
    {
      id: "1",
      name: "Mísseis Mágicos",
      school: "Evocação",
      circle: 1,
      description: "Dano infalível",
      effect: "1d4+1",
    },
    {
      id: "2",
      name: "Raio Ardente",
      school: "Evocação",
      circle: 2,
      description: "Três raios de fogo",
      effect: "2d6 por raio",
    },
    {
      id: "3",
      name: "Armadura Arcana",
      school: "Abjuração",
      circle: 1,
      description: "Aumenta defesa",
      effect: "CA 13+Dex",
    },
  ],
  silver: 500,
};

interface CharacterContextType {
  character: Character;
  isLoading: boolean; // Novo estado para controlar o carregamento
  updateStat: (stat: "hp" | "focus", value: number) => void;
  toggleStance: () => void;
  updateImage: (base64Image: string) => void; // <--- Nova função
  resetCharacter: () => void; // Função para resetar os dados
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

  const toggleStance = () => {
    setCharacter((prev) => ({
      ...prev,
      currentStanceIndex: prev.currentStanceIndex === 0 ? 1 : 0,
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

  return (
    <CharacterContext.Provider
      value={{
        character,
        isLoading,
        updateStat,
        toggleStance,
        resetCharacter,
        updateImage,
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
