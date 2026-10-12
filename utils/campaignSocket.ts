function isLocalOrPrivateHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized === "::1" ||
    normalized.startsWith("fe80:") ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd")
  ) {
    return true;
  }

  const ipv4Match = normalized.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, aStr, bStr, cStr, dStr] = ipv4Match;
    const a = Number(aStr);
    const b = Number(bStr);
    const c = Number(cStr);
    const d = Number(dStr);
    if (a > 255 || b > 255 || c > 255 || d > 255) return false;

    if (a === 127) return true;
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a === 169 && b === 254) return true;
  }

  return false;
}

/** Endereço da sala autenticada; credenciais nunca fazem parte da URL. */
export function campaignSocketUrl(baseUrl: string, campaignId: string): string {
  const url = new URL(baseUrl);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error("URL da API inválida.");
  }
  if (url.protocol === "http:" && !isLocalOrPrivateHost(url.hostname)) {
    throw new Error("HTTPS é obrigatório fora de redes locais ou privadas.");
  }
  if (!campaignId.trim()) throw new Error("ID da campanha obrigatório.");
  return `${url.protocol === "https:" ? "wss:" : "ws:"}//${url.host}/ws/campaign-${encodeURIComponent(campaignId)}`;
}

/** Primeiro frame da conexão, antes de qualquer comando de combate. */
export function campaignAuthMessage(token: string) {
  return { type: "AUTH_CAMPAIGN", payload: { token } };
}
