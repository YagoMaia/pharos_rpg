const getMod = (val: number) => Math.floor((val - 10) / 2);
export const formatMod = (val: number) => {
  const mod = getMod(val);
  return mod >= 0 ? `+${mod}` : `${mod}`;
};
export const getActionKey = (
  actionString: string,
): "standard" | "bonus" | "reaction" | null => {
  if (!actionString) return null;
  const lower = actionString.toLowerCase();
  if (lower.includes("bônus") || lower.includes("bonus")) return "bonus";
  if (lower.includes("reação") || lower.includes("reacao")) return "reaction";
  return "standard";
};

export const getActionColor = (type: string, colors: any) => {
  const lower = (type || "").toLowerCase();
  if (lower.includes("bônus") || lower.includes("bonus")) return "#fb8c00"; // Laranja
  if (lower.includes("reação") || lower.includes("reaction")) return "#8e24aa"; // Roxo
  if (lower.includes("padrão") || lower.includes("standard"))
    return colors.primary; // Azul
  return colors.textSecondary;
};
