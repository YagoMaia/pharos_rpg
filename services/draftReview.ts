import type { DraftApplicationInput, PreparationDraft } from "./campaignApi";

/** Identifica conteúdo que o servidor entrega aos jogadores ao aplicar. */
export function requiresPlayerAcknowledgement(payload: Record<string, unknown>): boolean {
  if (payload.kind === "session") return Boolean(payload.summary);
  if (payload.kind === "npc" || payload.kind === "quest") return payload.visibility !== "gm";
  return payload.kind !== "encounter";
}

/** Prepara um pedido repetível para a revisão exibida, sem confirmar exposição implicitamente. */
export function buildDraftApplication(
  draft: Pick<PreparationDraft, "id" | "revision" | "payload">,
  acknowledged: boolean,
): DraftApplicationInput {
  if (!Number.isSafeInteger(draft.revision) || draft.revision < 1 || !draft.id.trim()) {
    throw new Error("ID ou revisão do rascunho inválidos; releia antes de aplicar.");
  }
  if (requiresPlayerAcknowledgement(draft.payload) && !acknowledged) {
    throw new Error("Confirme que leu o aviso de visibilidade aos jogadores.");
  }
  return {
    expectedRevision: draft.revision,
    idempotencyKey: `app-review:${draft.id}:${draft.revision}`,
    acknowledgePlayerVisibility: acknowledged,
  };
}
