export type CampaignRole = "gm" | "player";

export interface CampaignSummary {
  id: string;
  name: string;
  role: CampaignRole;
  characterId?: string | null;
}

export interface CampaignMember {
  id: string;
  name: string;
  role: CampaignRole;
  characterId: string | null;
}

export interface CampaignDetails extends CampaignSummary {
  members: CampaignMember[];
}

export interface CampaignInvite {
  code: string;
  expiresAt: string;
}

export interface JournalEntryInput {
  title: string;
  body: string;
  visibility: "gm" | "party";
}

export interface JournalEntry extends JournalEntryInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignApiOptions {
  baseUrl: string;
  getAccessToken: () => string | Promise<string>;
  fetcher?: typeof fetch;
}

export interface AuthApiOptions {
  baseUrl: string;
  fetcher?: typeof fetch;
}

export interface AuthToken {
  accessToken: string;
}

export class CampaignApiError extends Error {
  constructor(public readonly status: number) {
    super(status === 401 ? "Autenticação necessária para acessar campanhas." :
      `Falha na operação de campanha (HTTP ${status}).`);
    this.name = "CampaignApiError";
  }
}

function requiredText(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} não pode ser vazio.`);
  return normalized;
}

function apiOrigin(baseUrl: string): string {
  const url = new URL(baseUrl);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error("URL da API deve ser HTTP(S) e não conter credenciais, query ou fragmento.");
  }
  if (url.protocol === "http:" && !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    throw new Error("HTTPS é obrigatório fora de localhost.");
  }
  return url.toString().replace(/\/$/, "");
}

function campaignPath(id: string): string {
  return `/campaigns/${encodeURIComponent(requiredText(id, "ID da campanha"))}`;
}

/** Cria o cliente para a API de campanhas, com token fornecido pela camada de autenticação. */
export function createCampaignApi({ baseUrl, getAccessToken, fetcher = fetch }: CampaignApiOptions) {
  const origin = apiOrigin(baseUrl);

  async function request<T>(path: string, method = "GET", body?: object): Promise<T> {
    const token = requiredText(await getAccessToken(), "Token de autenticação");
    const response = await fetcher(`${origin}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) throw new CampaignApiError(response.status);
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  return {
    logout: () => request<void>("/auth/logout", "POST"),
    createCampaign: (name: string) => request<CampaignSummary>(
      "/campaigns", "POST", { name: requiredText(name, "Nome da campanha") },
    ),
    listCampaigns: () => request<CampaignSummary[]>("/campaigns"),
    getCampaign: (id: string) => request<CampaignDetails>(campaignPath(id)),
    createInvite: (id: string) => request<CampaignInvite>(`${campaignPath(id)}/invites`, "POST"),
    joinCampaign: (inviteCode: string) => request<CampaignSummary>(
      "/campaigns/join", "POST", { inviteCode: requiredText(inviteCode, "Código do convite") },
    ),
    linkCharacter: (campaignId: string, characterId: string) => request<CampaignSummary>(
      `${campaignPath(campaignId)}/character`, "PUT", { characterId: requiredText(characterId, "ID do personagem") },
    ),
    listEntries: (campaignId: string) => request<JournalEntry[]>(`${campaignPath(campaignId)}/entries`),
    createEntry: (campaignId: string, entry: JournalEntryInput) => request<JournalEntry>(
      `${campaignPath(campaignId)}/entries`, "POST", entry,
    ),
    updateEntry: (campaignId: string, entryId: string, entry: JournalEntryInput) => request<JournalEntry>(
      `${campaignPath(campaignId)}/entries/${encodeURIComponent(requiredText(entryId, "ID da nota"))}`, "PUT", entry,
    ),
  };
}

/** Registro/login retornam token; armazenamento seguro fica a cargo do chamador. */
export function createAuthApi({ baseUrl, fetcher = fetch }: AuthApiOptions) {
  const origin = apiOrigin(baseUrl);

  async function send(path: string, body: object): Promise<AuthToken> {
    const response = await fetcher(`${origin}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new CampaignApiError(response.status);
    return response.json() as Promise<AuthToken>;
  }

  return {
    tableLogin: (name: string, pin: string) => send("/auth/table-login", {
      name: requiredText(name, "Nome"), pin,
    }),
    register: (email: string, displayName: string, password: string) => send("/auth/register", {
      email: requiredText(email, "Email"),
      displayName: requiredText(displayName, "Nome"), password,
    }),
    login: (email: string, password: string) => send("/auth/login", {
      email: requiredText(email, "Email"), password,
    }),
  };
}
