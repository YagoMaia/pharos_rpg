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
  hasSheet?: boolean;
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

export type SessionStatus = "planned" | "active" | "completed";

export interface CampaignSessionInput {
  sessionNumber: number;
  title: string;
  summary?: string;
  scheduledAt?: string | null;
  status: SessionStatus;
}

export interface CampaignSession extends CampaignSessionInput {
  id: string;
  campaignId: string;
  createdAt: string;
  updatedAt: string;
}

export type QuestStatus = "active" | "completed" | "failed";
export type QuestVisibility = "party" | "gm";

export interface CampaignQuestInput {
  title: string;
  description?: string;
  reward?: string;
  visibility: QuestVisibility;
  status: QuestStatus;
}

export interface CampaignQuest extends CampaignQuestInput {
  id: string;
  campaignId: string;
  createdAt: string;
  updatedAt: string;
}

export type EncounterStatus = "planned" | "ready" | "completed";

export interface CampaignEncounterMonster {
  name: string;
  count: number;
  hp?: number;
  ac?: number;
  initiativeBonus?: number;
  attributes?: Record<string, any>;
  weapons?: any;
}

export interface CampaignEncounterInput {
  name: string;
  description?: string;
  tactics?: string;
  rewards?: string;
  status: EncounterStatus;
  monstersData: CampaignEncounterMonster[];
}

export interface CampaignEncounter extends CampaignEncounterInput {
  id: string;
  campaignId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LaunchEncounterResult {
  status: string;
  encounterId: string;
  combatantsAdded: number;
}

export type NpcAttitude = "friendly" | "neutral" | "hostile" | "unknown";
export type NpcVisibility = "party" | "gm";

export interface CampaignNpcInput {
  name: string;
  role?: string;
  attitude: NpcAttitude;
  description?: string;
  gmNotes?: string;
  combatData?: any;
  visibility: NpcVisibility;
}

export interface CampaignNpc extends CampaignNpcInput {
  id: string;
  campaignId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemberSheetResponse {
  characterId: string | null;
  characterData: any | null;
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

function apiOrigin(baseUrl: string): string {
  const url = new URL(baseUrl);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error("URL da API deve ser HTTP(S) e não conter credenciais, query ou fragmento.");
  }
  if (url.protocol === "http:" && !isLocalOrPrivateHost(url.hostname)) {
    throw new Error("HTTPS é obrigatório fora de redes locais ou privadas.");
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
    linkCharacter: (campaignId: string, characterId: string, characterData?: object) => request<CampaignSummary>(
      `${campaignPath(campaignId)}/character`, "PUT", {
        characterId: requiredText(characterId, "ID do personagem"),
        ...(characterData ? { characterData } : {}),
      },
    ),
    syncCharacterSheet: (campaignId: string, characterData: object) => request<CampaignSummary>(
      `${campaignPath(campaignId)}/character/sheet`, "PUT", { characterData },
    ),
    getMemberSheet: (campaignId: string, memberId: string) => request<MemberSheetResponse>(
      `${campaignPath(campaignId)}/members/${encodeURIComponent(requiredText(memberId, "ID do membro"))}/sheet`,
    ),
    unlinkCharacter: (campaignId: string) => request<CampaignSummary>(
      `${campaignPath(campaignId)}/character`, "DELETE",
    ),
    listSessions: (campaignId: string) => request<CampaignSession[]>(`${campaignPath(campaignId)}/sessions`),
    createSession: (campaignId: string, session: CampaignSessionInput) => request<CampaignSession>(
      `${campaignPath(campaignId)}/sessions`, "POST", session,
    ),
    updateSession: (campaignId: string, sessionId: string, session: CampaignSessionInput) => request<CampaignSession>(
      `${campaignPath(campaignId)}/sessions/${encodeURIComponent(requiredText(sessionId, "ID da sessão"))}`, "PUT", session,
    ),
    deleteSession: (campaignId: string, sessionId: string) => request<void>(
      `${campaignPath(campaignId)}/sessions/${encodeURIComponent(requiredText(sessionId, "ID da sessão"))}`, "DELETE",
    ),
    listQuests: (campaignId: string) => request<CampaignQuest[]>(`${campaignPath(campaignId)}/quests`),
    createQuest: (campaignId: string, quest: CampaignQuestInput) => request<CampaignQuest>(
      `${campaignPath(campaignId)}/quests`, "POST", quest,
    ),
    updateQuest: (campaignId: string, questId: string, quest: CampaignQuestInput) => request<CampaignQuest>(
      `${campaignPath(campaignId)}/quests/${encodeURIComponent(requiredText(questId, "ID da missão"))}`, "PUT", quest,
    ),
    deleteQuest: (campaignId: string, questId: string) => request<void>(
      `${campaignPath(campaignId)}/quests/${encodeURIComponent(requiredText(questId, "ID da missão"))}`, "DELETE",
    ),
    listEntries: (campaignId: string) => request<JournalEntry[]>(`${campaignPath(campaignId)}/entries`),
    createEntry: (campaignId: string, entry: JournalEntryInput) => request<JournalEntry>(
      `${campaignPath(campaignId)}/entries`, "POST", entry,
    ),
    updateEntry: (campaignId: string, entryId: string, entry: JournalEntryInput) => request<JournalEntry>(
      `${campaignPath(campaignId)}/entries/${encodeURIComponent(requiredText(entryId, "ID da nota"))}`, "PUT", entry,
    ),
    deleteEntry: (campaignId: string, entryId: string) => request<void>(
      `${campaignPath(campaignId)}/entries/${encodeURIComponent(requiredText(entryId, "ID da nota"))}`, "DELETE",
    ),
    listEncounters: (campaignId: string) => request<CampaignEncounter[]>(`${campaignPath(campaignId)}/encounters`),
    createEncounter: (campaignId: string, encounter: CampaignEncounterInput) => request<CampaignEncounter>(
      `${campaignPath(campaignId)}/encounters`, "POST", encounter,
    ),
    updateEncounter: (campaignId: string, encounterId: string, encounter: CampaignEncounterInput) => request<CampaignEncounter>(
      `${campaignPath(campaignId)}/encounters/${encodeURIComponent(requiredText(encounterId, "ID do encontro"))}`, "PUT", encounter,
    ),
    deleteEncounter: (campaignId: string, encounterId: string) => request<void>(
      `${campaignPath(campaignId)}/encounters/${encodeURIComponent(requiredText(encounterId, "ID do encontro"))}`, "DELETE",
    ),
    launchEncounter: (campaignId: string, encounterId: string) => request<LaunchEncounterResult>(
      `${campaignPath(campaignId)}/encounters/${encodeURIComponent(requiredText(encounterId, "ID do encontro"))}/launch`, "POST", {},
    ),
    listNpcs: (campaignId: string) => request<CampaignNpc[]>(`${campaignPath(campaignId)}/npcs`),
    createNpc: (campaignId: string, npc: CampaignNpcInput) => request<CampaignNpc>(
      `${campaignPath(campaignId)}/npcs`, "POST", npc,
    ),
    updateNpc: (campaignId: string, npcId: string, npc: CampaignNpcInput) => request<CampaignNpc>(
      `${campaignPath(campaignId)}/npcs/${encodeURIComponent(requiredText(npcId, "ID do NPC"))}`, "PUT", npc,
    ),
    deleteNpc: (campaignId: string, npcId: string) => request<void>(
      `${campaignPath(campaignId)}/npcs/${encodeURIComponent(requiredText(npcId, "ID do NPC"))}`, "DELETE",
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
