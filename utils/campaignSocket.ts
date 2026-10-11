/** Endereço da sala autenticada; credenciais nunca fazem parte da URL. */
export function campaignSocketUrl(baseUrl: string, campaignId: string): string {
  const url = new URL(baseUrl);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error("URL da API inválida.");
  }
  if (url.protocol === "http:" && !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    throw new Error("HTTPS é obrigatório fora de localhost.");
  }
  if (!campaignId.trim()) throw new Error("ID da campanha obrigatório.");
  return `${url.protocol === "https:" ? "wss:" : "ws:"}//${url.host}/ws/campaign-${encodeURIComponent(campaignId)}`;
}

/** Primeiro frame da conexão, antes de qualquer comando de combate. */
export function campaignAuthMessage(token: string) {
  return { type: "AUTH_CAMPAIGN", payload: { token } };
}
