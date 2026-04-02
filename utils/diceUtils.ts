// src/utils/diceUtils.ts

export interface RollResult {
  total: number;
  formula: string;
  detailedLog: string;
}

// --- HELPER: Traduz a abreviação para o nome completo e pega o modificador ---
const getAttributeModifier = (
  attrAbbr: string,
  attributes?: Record<string, any>,
): number => {
  if (!attributes) return 0;

  const abbr = attrAbbr.toUpperCase();

  // Mapeamento das siglas para os nomes completos que você usa no seu State
  const map: Record<string, string> = {
    FOR: "Força",
    STR: "Força",
    DES: "Destreza",
    DEX: "Destreza",
    CON: "Constituição",
    INT: "Inteligência",
    SAB: "Sabedoria",
    WIS: "Sabedoria",
    CAR: "Carisma",
    CHA: "Carisma",
  };

  const fullName = map[abbr] || attrAbbr;
  return attributes[fullName]?.modifier || 0;
};

export const rollDiceString = (
  formula: string,
  isCrit: boolean = false,
  attributes?: Record<string, any>, // <--- NOVO PARÂMETRO: Recebe os atributos do personagem
): RollResult => {
  // 1. PRÉ-PROCESSAMENTO DE VARIÁVEIS (@)
  let processedFormula = formula;

  // A. Resolve blocos de "maior entre vários" ex: (@INT/@SAB) ou até (@FOR/@DES/@CON)
  processedFormula = processedFormula.replace(
    /\((@[a-zA-Z]+(?:\/@[a-zA-Z]+)+)\)/g,
    (match, group) => {
      // Separa as tags (ex: "@INT/@SAB" vira ["INT", "SAB"])
      const attrs = group.split("/").map((s: string) => s.replace("@", ""));
      // Busca os modificadores de cada um
      const mods = attrs.map((a: string) =>
        getAttributeModifier(a, attributes),
      );
      // Retorna o maior valor encontrado
      return String(Math.max(...mods));
    },
  );

  // B. Resolve variáveis únicas soltas ex: @INT ou @FOR
  processedFormula = processedFormula.replace(
    /@([a-zA-Z]+)/g,
    (match, attr) => {
      return String(getAttributeModifier(attr, attributes));
    },
  );

  // 2. LIMPEZA PADRÃO (Agora usando a fórmula processada com números)
  const cleanFormula = processedFormula.toLowerCase().replace(/\s+/g, "");
  const regex = /([+-]?)(\d+)(d(\d+))?/g;

  let match;
  let total = 0;
  let logParts: string[] = [];

  while ((match = regex.exec(cleanFormula)) !== null) {
    if (match.index === regex.lastIndex) {
      regex.lastIndex++;
    }

    const signStr = match[1];
    const val1 = parseInt(match[2], 10);
    const isDice = !!match[3];
    const sides = match[4] ? parseInt(match[4], 10) : 0;

    const multiplier = signStr === "-" ? -1 : 1;
    const displaySign = signStr || "+";

    if (isDice) {
      // --- É uma rolagem de dados (Ex: 1d8 ou 2d6) ---
      let subTotal = 0;
      const rolls: number[] = [];
      let maxDamage = 0;

      // REGRA DO CRÍTICO: "Valor máximo do dado + Rolagem normal"
      if (isCrit) {
        maxDamage = val1 * sides; // Ex: 1d8 = 8, 2d6 = 12
        subTotal += maxDamage;
      }

      // Rola os dados normalmente
      for (let i = 0; i < val1; i++) {
        const roll = Math.floor(Math.random() * sides) + 1;
        rolls.push(roll);
        subTotal += roll;
      }

      total += subTotal * multiplier;

      // Log detalhado
      if (isCrit) {
        logParts.push(
          `${displaySign} ${subTotal} [CRÍTICO! Máx: ${maxDamage} + Rolou: ${rolls.join(", ")}]`,
        );
      } else {
        logParts.push(
          `${displaySign} ${subTotal} [${val1}d${sides}: ${rolls.join(", ")}]`,
        );
      }
    } else {
      // --- É um modificador fixo (Ex: +4) ---
      total += val1 * multiplier;
      logParts.push(`${displaySign} ${val1}`);
    }
  }

  let finalLog = logParts.join(" ");
  if (finalLog.startsWith("+ ")) {
    finalLog = finalLog.substring(2);
  }

  return {
    total: Math.max(0, total),
    formula: formula, // Retorna a fórmula original para exibição
    detailedLog: finalLog,
  };
};
