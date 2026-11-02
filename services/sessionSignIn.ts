import { CampaignSession } from "@/context/CampaignAuthContext";
import { createAuthApi } from "@/services/campaignApi";
import { TableRole } from "@/services/tableRoster";

/**
 * Credencial de conta: o servidor associa campanhas a contas de usuário, então
 * rotas de preparação (rascunhos, credenciais do agent) só aparecem para quem
 * entra por aqui. A identidade da mesa continua válida para diário e combate.
 */
export interface AccountCredential {
  action: "login" | "register";
  email: string;
  password: string;
  displayName?: string;
}

export type SignInCredential =
  | { kind: "table"; name: string; pin: string }
  | ({ kind: "account" } & AccountCredential);

type AuthClient = ReturnType<typeof createAuthApi>;

/** Devolve a sessão que o app persiste; a senha existe só durante esta chamada. */
export async function signIn(
  baseUrl: string,
  credential: SignInCredential,
  role: TableRole,
): Promise<CampaignSession> {
  const token = await accessTokenFor(createAuthApi({ baseUrl }), credential);
  return { baseUrl, token, role };
}

async function accessTokenFor(auth: AuthClient, credential: SignInCredential): Promise<string> {
  if (credential.kind === "table") {
    return (await auth.tableLogin(credential.name, credential.pin)).accessToken;
  }
  if (credential.action === "register") {
    const displayName = credential.displayName?.trim() || credential.email;
    return (await auth.register(credential.email, displayName, credential.password)).accessToken;
  }
  return (await auth.login(credential.email, credential.password)).accessToken;
}
