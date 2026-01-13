// 1. Definição dos Grupos de Perícias (Atualizado)
export const SKILL_GROUPS = [
  {
    attribute: "Força",
    skills: ["Atletismo"],
  },
  {
    attribute: "Destreza",
    skills: ["Acrobacia", "Furtividade", "Ladinagem", "Pilotagem"],
  },
  {
    attribute: "Inteligência",
    skills: [
      "Arcanismo",
      "Engenharia",
      "História",
      "Investigação",
      "Natureza",
      "Navegação",
      "Ocultismo",
      "Religião",
    ],
  },
  {
    attribute: "Sabedoria",
    skills: [
      "Adestrar Animais",
      "Intuição",
      "Medicina",
      "Percepção",
      "Sobrevivência",
    ],
  },
  {
    attribute: "Carisma",
    skills: [
      "Atuação",
      "Enganação",
      "Etiqueta",
      "Intimidação",
      "Manha",
      "Persuasão",
    ],
  },
  {
    attribute: "Constituição", // <--- Adicionado
    skills: ["Concentração", "Ofício"],
  },
];

// 2. Dicionário de Descrições (Para o Long Press)
export const SKILL_DESCRIPTIONS: Record<string, string> = {
  // FORÇA
  Atletismo:
    "Cobre situações difíceis que você tenta resolver através de vigor físico e movimento (escalar, nadar, saltar).",

  // DESTREZA
  Acrobacia:
    "Manter o equilíbrio em situações precárias (cordas, tempestades) ou realizar manobras evasivas.",
  Furtividade: "A arte de passar despercebido e se esconder.",
  Ladinagem:
    "Habilidade manual para abrir fechaduras, desarmar armadilhas ou realizar truques de mãos rápidos.",
  Pilotagem:
    "Controlar veículos terrestres ou aquáticos em situações de estresse.",

  // INTELIGÊNCIA
  Arcanismo:
    "Estudo da magia sancionada, Pedras-Mana e teoria mágica. Identifica itens mágicos seguros.",
  Engenharia:
    "Conhecimento sobre máquinas, estruturas, pólvora e tecnologia (Manomai, comportas).",
  História:
    "Conhecimento sobre o passado de Pharos, a Cisão, linhagens reais e batalhas.",
  Investigação:
    "Deduzir informações de pistas, encontrar objetos ocultos ou analisar cenas de crime.",
  Natureza: "Biologia, plantas, clima e bestas naturais de Pharos.",
  Navegação:
    "Ler mapas, usar astrolábio, calcular rotas e se orientar pelas estrelas.",
  Ocultismo:
    "Conhecimentos proibidos, magia antiga (Dalum), criaturas do Pálido e seitas.",
  Religião:
    "Rituais, hierarquias e dogmas de Adihn, Inam, Falchin e Kananismo.",

  // SABEDORIA
  "Adestrar Animais": "Acalmar, controlar ou intuir intenções de bestas.",
  Intuição:
    "Ler verdadeiras intenções, detectar mentiras ou perceber encantamentos.",
  Medicina: "Estabilizar feridos, diagnosticar doenças e tratar venenos.",
  Percepção:
    "Estar alerta ao redor. Ouvir conversas, ver inimigos escondidos ou notar detalhes.",
  Sobrevivência: "Viver em ambientes hostis (rastrear, caçar, encontrar água).",

  // CARISMA
  Atuação: "Entreter, disfarçar-se ou assumir uma persona.",
  Enganação: "Mentir convincentemente, esconder a verdade ou criar distrações.",
  Etiqueta: "Normas sociais, burocracia e protocolos da alta sociedade.",
  Intimidação: "Usar ameaças ou presença física para coagir outros.",
  Manha: "Conhecimento das ruas, submundo, gírias criminosas e mercado negro.",
  Persuasão:
    "Convencer outros através de lógica, charme ou diplomacia honesta.",

  // CONSTITUIÇÃO (Adicionado)
  Concentração:
    "A capacidade de manter o foco mental sob dor física extrema. Essencial para Magos manterem feitiços ativos enquanto tomam dano, ou para Guerreiros se manterem em uma Postura difícil.",
  Ofício: "A capacidade de realizar trabalho árduo, contínuo e exigente.",
};
