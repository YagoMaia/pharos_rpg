/** Mantém o mínimo do formulário e acompanha a altura medida sem truncar texto. */
export function campaignTextHeight(contentHeight: number, minimum: number): number {
  return Math.max(minimum, Number.isFinite(contentHeight) ? Math.ceil(contentHeight) : minimum);
}
