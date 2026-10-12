export type TableRole = "gm" | "player";

const PLAYERS = ["Gabriel", "Leandro", "Yago", "Luiz", "Amom", "Wayne", "Visitante"] as const;

/** Victor é o único mestre da mesa; os demais nomes entram como jogadores. */
export function tableNamesForRole(role: TableRole): string[] {
  return role === "gm" ? ["Victor"] : [...PLAYERS];
}
