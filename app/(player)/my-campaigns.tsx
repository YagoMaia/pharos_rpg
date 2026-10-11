import { CampaignAuthForm } from "@/components/campaign/CampaignAuthForm";
import { PlayerCampaignWorkspace } from "@/components/campaign/PlayerCampaignWorkspace";
import { useCharacter } from "@/context/CharacterContext";
import { useTheme } from "@/context/ThemeContext";
import { CampaignApiError, CampaignSummary, JournalEntry, createAuthApi, createCampaignApi } from "@/services/campaignApi";
import { playerCampaigns } from "@/services/campaignView";
import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";

interface Session {
  baseUrl: string;
  token: string;
}

export default function PlayerCampaignsScreen() {
  const { colors } = useTheme();
  const { character, isLoading } = useCharacter();
  // Token apenas em memória até existir armazenamento seguro por plataforma.
  const [session, setSession] = useState<Session | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [selected, setSelected] = useState<CampaignSummary | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function clearSession() {
    setSession(null);
    setCampaigns([]);
    setSelected(null);
    setEntries([]);
    setInviteCode("");
    setError("");
  }

  function showError(cause: unknown) {
    if (cause instanceof CampaignApiError && cause.status === 401) {
      clearSession();
      setError("Sessão expirada. Entre novamente.");
      return;
    }
    if (cause instanceof CampaignApiError && cause.status === 410) {
      setError("Convite expirado ou já utilizado. Solicite outro ao mestre.");
      return;
    }
    if (cause instanceof CampaignApiError && cause.status === 409) {
      setError("Você já participa desta campanha ou a ficha já está vinculada.");
      return;
    }
    setError("Operação não concluída. Verifique os dados e a conexão.");
  }

  async function authenticate(mode: "login" | "register", baseUrl: string,
    email: string, name: string, password: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const auth = createAuthApi({ baseUrl: baseUrl.trim() });
      const { accessToken } = mode === "login"
        ? await auth.login(email, password) : await auth.register(email, name, password);
      const credentials = { baseUrl: baseUrl.trim(), token: accessToken };
      setSession(credentials);
      const client = createCampaignApi({ baseUrl: credentials.baseUrl, getAccessToken: () => credentials.token });
      setCampaigns(playerCampaigns(await client.listCampaigns()));
    } catch (cause) {
      if (cause instanceof CampaignApiError && cause.status === 401) {
        clearSession();
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

  async function run(task: (client: ReturnType<typeof createCampaignApi>) => Promise<void>) {
    if (!session || busy) return;
    setBusy(true);
    setError("");
    try {
      await task(createCampaignApi({ baseUrl: session.baseUrl, getAccessToken: () => session.token }));
    } catch (cause) {
      showError(cause);
    } finally {
      setBusy(false);
    }
  }

  function refresh() {
    run(async (client) => {
      const updated = playerCampaigns(await client.listCampaigns());
      setCampaigns(updated);
      setSelected((current) => updated.find((campaign) => campaign.id === current?.id) ?? null);
      if (selected && updated.some((campaign) => campaign.id === selected.id)) {
        setEntries(await client.listEntries(selected.id));
      } else {
        setEntries([]);
      }
    });
  }

  function select(campaign: CampaignSummary) {
    run(async (client) => {
      const notes = await client.listEntries(campaign.id);
      setSelected(campaign);
      setEntries(notes);
    });
  }

  function join() {
    run(async (client) => {
      const joined = await client.joinCampaign(inviteCode);
      setCampaigns((current) => [...current.filter((item) => item.id !== joined.id), joined]);
      setSelected(joined);
      setEntries([]);
      setInviteCode("");
      setEntries(await client.listEntries(joined.id));
    });
  }

  function link() {
    const sheetId = character.sheetId;
    if (!selected || isLoading || !sheetId) return;
    run(async (client) => {
      const linked = await client.linkCharacter(selected.id, sheetId);
      setCampaigns((current) => current.map((item) => item.id === linked.id ? linked : item));
      setSelected(linked);
    });
  }

  return <View style={{ flex: 1, backgroundColor: colors.background }}>
    {!!error && <Text accessibilityRole="alert" style={{ color: colors.error, padding: 16 }}>{error}</Text>}
    {session ? <PlayerCampaignWorkspace colors={colors} campaigns={campaigns} selected={selected}
      entries={entries}
      inviteCode={inviteCode} onInviteChange={setInviteCode} busy={busy} onJoin={join} onLink={link}
      onRefresh={refresh} onSelect={select} onLogout={clearSession}
      characterName={character.name} characterId={isLoading ? undefined : character.sheetId} /> :
      <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1, justifyContent: "center" }}>
        <CampaignAuthForm colors={colors} busy={busy} onSubmit={authenticate} />
      </ScrollView>}
  </View>;
}
