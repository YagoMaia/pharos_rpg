// src/data/skillData.ts
import { Skill } from "../types/rpg";

export const MARTIAL_SKILLS: Skill[] = [
  // Nível 1
  {
    id: "golpe_demolidor",
    name: "Golpe Demolidor",
    cost: 3,
    actionType: "Padrão",
    description:
      "Ataque corpo a corpo. Adiciona 1 dado de dano extra da arma. Vantagem contra escudo/armadura pesada.",
    level: 1,
  },
  {
    id: "vigor_ferro",
    name: "Vigor de Ferro",
    cost: 3,
    actionType: "Ação Bônus",
    description: "Recupera PV igual a 1d10 + Constituição.",
    level: 1,
  },
  {
    id: "varrer_linha",
    name: "Varrer a Linha",
    cost: 4,
    actionType: "Padrão",
    description:
      "Ataque em cone de 3m. Jogada única contra CA de todos. Dano normal + empurrão de 1,5m.",
    level: 1,
  },
  {
    id: "bastiao_imovel",
    name: "Bastião Imóvel",
    cost: 3,
    actionType: "Reação",
    description:
      "Reduz o dano recebido pela metade. Imune a ser movido/derrubado até o próximo turno.",
    level: 1,
  },
  // Nível 2
  {
    id: "investida_ariete",
    name: "Investida de Aríete",
    cost: 5,
    actionType: "Padrão",
    description:
      "Mova o dobro do deslocamento. Ataque com Vantagem. Se acertar: Dano normal + Teste de Força (alvo) ou é empurrado 3m e cai Prone.",
    level: 2,
  },
  {
    id: "concussao",
    name: "Concussão",
    cost: 4,
    actionType: "Padrão",
    description:
      "Ataque focado na cabeça. Se acertar: Dano normal e alvo faz teste de CON. Falha = Confuso (repetir teste todo turno).",
    level: 2,
  },
];

// 2. DESTREZA (Corsário, Atirador)
export const DEXTERITY_SKILLS: Skill[] = [
  // Nível 1
  {
    id: "truque_sujo",
    name: "Truque Sujo",
    cost: 2,
    actionType: "Ação Bônus",
    description:
      "Alvo a 3m faz teste de CON. Falha = Cego ou Prostrado até fim do próximo turno.",
    level: 1,
  },
  {
    id: "disparo_incapacitante",
    name: "Disparo Incapacitante",
    cost: 2,
    actionType: "Padrão",
    description:
      "Ataque à distância. Dano normal + Efeito: Deslocamento 0 OU Larga item/Desvantagem no ataque.",
    level: 1,
  },
  {
    id: "reflexo_relampago",
    name: "Reflexo Relâmpago",
    cost: 2,
    actionType: "Reação",
    description:
      "Adiciona Proficiência na CA contra um ataque OU ganha Vantagem em teste de Destreza.",
    level: 1,
  },
  {
    id: "passo_esgueiro",
    name: "Passo Esgueiro",
    cost: 1,
    actionType: "Ação Bônus",
    description: "Move-se 1,5m sem provocar ataque de oportunidade.",
    level: 1,
  },
  // Nível 2
  {
    id: "movimento_dancante",
    name: "Movimento Dançante",
    cost: 3,
    actionType: "Reação",
    description:
      "Mova-se 3m sem atq. oportunidade. Ganha Vantagem em Furtividade ou Acrobacia até fim do turno.",
    level: 2,
  },
  {
    id: "granada_fumaca",
    name: "Granada de Fumaça",
    cost: 3, // +1 Kit Explosivos (texto)
    actionType: "Padrão",
    description:
      "Gera área de fumaça de 6m. Todos dentro ficam Cegos e invisíveis para quem está fora. (Gasta +1 uso de Kit de Explosivos).",
    level: 2,
  },
  {
    id: "mira_calculada",
    name: "Mira Calculada",
    cost: 3,
    actionType: "Ação Bônus",
    description:
      "Próximo ataque à distância no turno: Ignora cobertura leve e causa +1 dado de dano.",
    level: 2,
  },
];

// 3. ORATÓRIA (Orador)
export const ORATORY_SKILLS: Skill[] = [
  // Nível 1
  {
    id: "comando_tatico",
    name: "Comando Tático",
    cost: 3,
    actionType: "Ação Bônus",
    description:
      "Um aliado escolhido usa a Reação dele para realizar um Ataque imediatamente.",
    level: 1,
  },
  {
    id: "ultimato",
    name: "Ultimato",
    cost: 3,
    actionType: "Padrão",
    description:
      "Inimigos em cone de 5m fazem teste de Sabedoria. Falha = Intimidados até próximo turno.",
    level: 1,
  },
  {
    id: "voz_autoridade",
    name: "A Voz da Autoridade",
    cost: 4,
    actionType: "Padrão",
    description:
      "Até 3 aliados ganham +2 no próximo ataque ou teste de resistência.",
    level: 1,
  },
  {
    id: "palavra_coragem",
    name: "Palavra de Coragem",
    cost: 2,
    actionType: "Padrão",
    description: "Um aliado recupera 1d6 + Carisma de PV.",
    level: 1,
  },
  // Nível 2
  {
    id: "intervencao_retorica",
    name: "Intervenção Retórica",
    cost: 3,
    actionType: "Reação",
    description:
      "Reduz o dano sofrido por um aliado a até 9m em 1d10 + Carisma.",
    level: 2,
  },
  {
    id: "coordenacao_aliada",
    name: "Coordenação Aliada",
    cost: 5,
    actionType: "Padrão",
    description:
      "Escolha um inimigo. Dois aliados ao alcance podem usar Reação para atacar imediatamente. Se o primeiro causar condição, o segundo tem benefício.",
    level: 2,
  },
];
