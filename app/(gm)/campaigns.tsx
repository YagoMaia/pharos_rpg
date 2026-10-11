import { CampaignAuthForm } from "@/components/campaign/CampaignAuthForm";
import { CampaignWorkspace } from "@/components/campaign/CampaignWorkspace";
import { useTheme } from "@/context/ThemeContext";
import {
  CampaignApiError, CampaignDetails, CampaignInvite, CampaignSummary,
  createAuthApi, createCampaignApi,
} from "@/services/campaignApi";
import { masterCampaigns } from "@/services/campaignView";
import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";

interface Session {
  baseUrl: string;
  token: string;
}

export default function GMCampaignsScreen() {
  const { colors } = useTheme();
  // Sem armazenamento persistente de token até existir um cofre seguro configurado.
  const [session, setSession] = useState<Session | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [selected, setSelected] = useState<CampaignDetails | null>(null);
  const [invite, setInvite] = useState<CampaignInvite | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function api(credentials: Session) {
    return createCampaignApi({
      baseUrl: credentials.baseUrl, getAccessToken: () => credentials.token,
    });
  }

  function clearSession() {
    setSession(null);
    setSelected(null);
    setCampaigns([]);
    setInvite(null);
  }

  function showError(cause: unknown) {
    if (cause instanceof CampaignApiError && cause.status === 401) {
      clearSession();
      setError("Sessão expirada. Entre novamente.");
      return;
    }
    setError("Não foi possível concluir a operação. Verifique a conexão e tente novamente.");
  }

  async function authenticate(mode: "login" | "register", baseUrl: string,
    email: string, displayName: string, password: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const auth = createAuthApi({ baseUrl: baseUrl.trim() });
      const { accessToken } = mode === "register"
        ? await auth.register(email, displayName, password)
        : await auth.login(email, password);
      const credentials = { baseUrl: baseUrl.trim(), token: accessToken };
      setSession(credentials);
      setCampaigns(masterCampaigns(await api(credentials).listCampaigns()));
    } catch (cause) {
      if (cause instanceof CampaignApiError && cause.status === 401) {
        setError("Email ou senha inválidos.");
      } else if (cause instanceof CampaignApiError && cause.status === 409) {
        setError("Este email já está cadastrado.");
      } else {
        showError(cause);
      }
    } finally {
      setBusy(false);
    }
  }

  async function run(task: (credentials: Session) => Promise<void>) {
    if (!session || busy) return;
    setBusy(true);
    setError("");
    try {
      await task(session);
    } catch (cause) {
      showError(cause);
    } finally {
      setBusy(false);
    }
  }

  function refresh() {
    run(async (credentials) => {
      setCampaigns(masterCampaigns(await api(credentials).listCampaigns()));
      if (selected) setSelected(await api(credentials).getCampaign(selected.id));
    });
  }

  function create() {
    run(async (credentials) => {
      const created = await api(credentials).createCampaign(name);
      setCampaigns((previous) => [...previous, created]);
      setSelected(await api(credentials).getCampaign(created.id));
      setInvite(null);
      setName("");
    });
  }

  function select(id: string) {
    run(async (credentials) => {
      setSelected(await api(credentials).getCampaign(id));
      setInvite(null);
    });
  }

  function generateInvite() {
    if (!selected) return;
    run(async (credentials) => setInvite(await api(credentials).createInvite(selected.id)));
  }

  async function copyInvite() {
    if (!invite) return;
    try {
      await Clipboard.setStringAsync(invite.code);
    } catch {
      setError("Não foi possível copiar o código.");
    }
  }

  function logout() {
    clearSession();
    setError("");
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {!!error && <Text accessibilityRole="alert" style={{ color: colors.error, padding: 16 }}>{error}</Text>}
      {session ? <CampaignWorkspace colors={colors} campaigns={campaigns} selected={selected}
        invite={invite} name={name} busy={busy} onNameChange={setName} onCreate={create}
        onRefresh={refresh} onSelect={select} onInvite={generateInvite}
        onCopyInvite={copyInvite} onLogout={logout} /> :
        <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1, justifyContent: "center" }}>
          <CampaignAuthForm colors={colors} busy={busy} onSubmit={authenticate} />
        </ScrollView>}
    </View>
  );
}
