import { ConditionName } from "@/types/rpg";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";

// Mapeamento visual de cada condição
export const CONDITION_CONFIG: Record<
  ConditionName,
  {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    color: string;
    label: string;
    description: string;
  }
> = {
  Cego: {
    icon: "eye-off",
    color: "#78909c",
    label: "Cego",
    description:
      "Falha automática em testes que dependam de visão. Ataques contra você têm Vantagem, seus ataques têm Desvantagem.",
  },
  Surdo: {
    icon: "ear-hearing-off",
    color: "#8d6e63",
    label: "Surdo",
    description:
      "Falha automática em testes que dependam de audição. Desvantagem em testes de Iniciativa.",
  },
  Prostrado: {
    icon: "human-handsdown",
    color: "#5c6bc0",
    label: "Prostrado",
    description:
      "Ataques corpo a corpo contra você têm Vantagem. Ataques à distância contra você têm Desvantagem. Seus ataques têm Desvantagem.",
  },
  Confuso: {
    icon: "head-question",
    color: "#ab47bc",
    label: "Confuso",
    description:
      "Não pode realizar reações. No seu turno, role 1d10 para determinar sua ação.",
  },
  Amedrontado: {
    icon: "emoticon-dead",
    color: "#7e57c2",
    label: "Amedrontado",
    description:
      "Desvantagem em testes de habilidade e ataques enquanto a fonte do medo estiver visível. Não pode se mover na direção da fonte.",
  },
  Intimidado: {
    icon: "alert-decagram",
    color: "#ff7043",
    label: "Intimidado",
    description:
      "Desvantagem no próximo teste de habilidade ou ataque. Removido após a primeira rolagem.",
  },
  Incapacitado: {
    icon: "cancel",
    color: "#ef5350",
    label: "Incapacitado",
    description:
      "Não pode realizar ações nem reações.",
  },
  Paralisado: {
    icon: "lightning-bolt",
    color: "#fdd835",
    label: "Paralisado",
    description:
      "Incapacitado e não pode se mover nem falar. Falha automática em testes de FOR e DES. Ataques têm Vantagem e acertos corpo a corpo são Críticos.",
  },
  Envenenado: {
    icon: "flask",
    color: "#66bb6a",
    label: "Envenenado",
    description:
      "Desvantagem em rolagens de ataque e testes de habilidade.",
  },
  Agarrado: {
    icon: "hand-back-left",
    color: "#8d6e63",
    label: "Agarrado",
    description:
      "Velocidade reduzida a 0. Termina se o agarrador ficar incapacitado ou um efeito separar as criaturas.",
  },
  Lento: {
    icon: "tortoise",
    color: "#26a69a",
    label: "Lento",
    description:
      "Velocidade reduzida pela metade. Penalidade de -2 na CA e testes de DES. Não pode usar reações.",
  },
  Atordoado: {
    icon: "star-four-points",
    color: "#ffa726",
    label: "Atordoado",
    description:
      "Incapacitado, não pode se mover. Fala de forma desconexa. Falha automática em testes de FOR e DES. Ataques contra você têm Vantagem.",
  },
};

// Emoji alternativo para logs e fallback
export const CONDITION_EMOJI: Record<ConditionName, string> = {
  Cego: "🙈",
  Surdo: "🙉",
  Prostrado: "🔻",
  Confuso: "😵‍💫",
  Amedrontado: "😨",
  Intimidado: "😠",
  Incapacitado: "🚫",
  Paralisado: "⚡",
  Envenenado: "🧪",
  Agarrado: "🤝",
  Lento: "🐢",
  Atordoado: "💫",
};
