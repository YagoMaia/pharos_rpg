// src/data/classData.ts
import { CharacterClass, Skill, Stance } from "../types/rpg";

// Define a estrutura dos dados padrão de uma classe
interface ClassDefaultData {
  skills: Skill[];
  stances: [Stance, Stance]; // Sempre 2 posturas
}

export const CLASS_DATA: Record<CharacterClass, ClassDefaultData> = {
  Mago: {
    stances: [
      {
        id: "m1",
        name: "Postura do Canalizador",
        benefit: "Reduz o custo de magias de 1º círculo em 1.",
        restriction: "Não pode realizar ataques de oportunidade.",
        maneuver: "Gaste 1 Foco para manter a concentração se sofrer dano.",
      },
      {
        id: "m2",
        name: "Postura da Barreira",
        benefit: "+2 na CA contra ataques à distância.",
        restriction: "Deslocamento reduzido em 3m.",
        maneuver: "Gaste 2 Foco para criar uma barreira temporária (5 PV).",
      },
    ],
    skills: [
      {
        id: "ms1",
        name: "Bola de Fogo",
        cost: 3,
        actionType: "Padrão",
        description: "Dano em área 4d6.",
      },
      {
        id: "ms2",
        name: "Escudo Arcano",
        cost: 1,
        actionType: "Reação",
        description: "+5 CA até o início do prox turno.",
      },
      {
        id: "ms3",
        name: "Teleporte",
        cost: 2,
        actionType: "Movimento",
        description: "Move 9m para local visível.",
      },
      {
        id: "ms4",
        name: "Analisar",
        cost: 0,
        actionType: "Livre",
        description: "Identifica propriedades mágicas.",
      },
    ],
  },
  Guerreiro: {
    stances: [
      {
        id: "g1",
        name: "Postura do Duelista",
        benefit: "+2 no acerto contra inimigos adjacentes.",
        restriction: "Deve estar usando apenas uma arma corpo a corpo.",
        maneuver: "Gaste 1 Foco para realizar um ataque extra como ação bônus.",
      },
      {
        id: "g2",
        name: "Postura da Falange",
        benefit: "Recebe resistência a dano cortante.",
        restriction: "Deve estar usando um escudo.",
        maneuver:
          "Gaste 1 Foco para empurrar um inimigo 3m ao acertar um ataque.",
      },
    ],
    skills: [
      {
        id: "gs1",
        name: "Golpe Demolidor",
        cost: 2,
        actionType: "Padrão",
        description: "Dano da arma + 1d8. Derruba o alvo.",
      },
      {
        id: "gs2",
        name: "Provocar",
        cost: 1,
        actionType: "Livre",
        description: "Inimigos focam em você.",
      },
      {
        id: "gs3",
        name: "Segundo Fôlego",
        cost: 2,
        actionType: "Livre",
        description: "Recupera 1d10 + Nível de PV.",
      },
      {
        id: "gs4",
        name: "Aparar",
        cost: 1,
        actionType: "Reação",
        description: "Reduz o dano recebido em 1d8.",
      },
    ],
  },
  Corsário: { skills: [], stances: [] as any },
  Vanguarda: { skills: [], stances: [] as any },
  Apóstata: { skills: [], stances: [] as any },
  Atirador: { skills: [], stances: [] as any },
  Orador: { skills: [], stances: [] as any },
};
