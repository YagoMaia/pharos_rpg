/** Identidade persistente da ficha, independente do nome usado no combate. */
export function createCharacterId(): string {
  return globalThis.crypto?.randomUUID?.() ??
    `character-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** Migra fichas legadas sem trocar a identidade de fichas já vinculadas. */
export function ensureCharacterId<T extends { sheetId?: string }>(
  character: T,
  generateId: () => string = createCharacterId,
): T & { sheetId: string } {
  if (typeof character.sheetId === "string" && character.sheetId.trim()) {
    return character as T & { sheetId: string };
  }
  return { ...character, sheetId: generateId() };
}
