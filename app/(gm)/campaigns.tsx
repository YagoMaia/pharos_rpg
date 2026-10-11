import { CampaignAuthForm } from "@/components/campaign/CampaignAuthForm";
import { CampaignWorkspace } from "@/components/campaign/CampaignWorkspace";
import { useTheme } from "@/context/ThemeContext";
import { useWebSocket } from "@/context/WebSocketContext";
import { useRouter } from "expo-router";
import { CampaignSession as Session, useCampaignAuth } from "@/context/CampaignAuthContext";
import {
  CampaignApiError, CampaignDetails, CampaignInvite, CampaignSummary, JournalEntry, JournalEntryInput,
  createAuthApi, createCampaignApi,
} from "@/services/campaignApi";
import { masterCampaigns } from "@/services/campaignView";
import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";

const EMPTY_DRAFT: JournalEntryInput = { title: "", body: "", visibility: "gm" };

export default function GMCampaignsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { connectToCampaign } = useWebSocket();
  // Sem armazenamento persistente de token até existir um cofre seguro configurado.
  const [session, setSession] = useCampaignAuth();
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [selected, setSelected] = useState<CampaignDetails | null>(null);
  const [invite, setInvite] = useState<CampaignInvite | null>(null);
  const [name, setName] = useState("");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [draft, setDraft] = useState<JournalEntryInput>(EMPTY_DRAFT);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
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
    setEntries([]);
    setDraft(EMPTY_DRAFT);
    setEditingEntryId(null);
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
      setSelected(null);
      setEntries([]);
      setInvite(null);
      setDraft(EMPTY_DRAFT);
      setEditingEntryId(null);
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
      if (!selected) return;
      const [details, notes] = await Promise.all([
        api(credentials).getCampaign(selected.id), api(credentials).listEntries(selected.id),
      ]);
      setSelected(details);
      setEntries(notes);
    });
  }

  function create() {
    run(async (credentials) => {
      const created = await api(credentials).createCampaign(name);
      setCampaigns((previous) => [...previous, created]);
      setSelected(await api(credentials).getCampaign(created.id));
      setEntries([]);
      setDraft(EMPTY_DRAFT);
      setEditingEntryId(null);
      setInvite(null);
      setName("");
    });
  }

  function select(id: string) {
    run(async (credentials) => {
      const [details, notes] = await Promise.all([
        api(credentials).getCampaign(id), api(credentials).listEntries(id),
      ]);
      setSelected(details);
      setEntries(notes);
      setDraft(EMPTY_DRAFT);
      setEditingEntryId(null);
      setInvite(null);
    });
  }

  function editEntry(entry: JournalEntry) {
    setDraft({ title: entry.title, body: entry.body, visibility: entry.visibility });
    setEditingEntryId(entry.id);
  }

  function cancelEdit() {
    setDraft(EMPTY_DRAFT);
    setEditingEntryId(null);
  }

  function saveEntry() {
    if (!selected) return;
    run(async (credentials) => {
      const client = api(credentials);
      if (editingEntryId) await client.updateEntry(selected.id, editingEntryId, draft);
      else await client.createEntry(selected.id, draft);
      setEntries(await client.listEntries(selected.id));
      cancelEdit();
    });
  }

  function generateInvite() {
    if (!selected) return;
    run(async (credentials) => setInvite(await api(credentials).createInvite(selected.id)));
  }

  function startCombat() {
    if (!selected || !session) return;
    connectToCampaign(selected.id, "gm");
    router.push("/(gm)/gm-combat-screen");
  }

  async function copyInvite() {
    if (!invite) return;
    try {
      await Clipboard.setStringAsync(invite.code);
    } catch {
      setError("Não foi possível copiar o código.");
    }
  }

  async function logout() {
    const credentials = session;
    clearSession();
    setError("");
    if (!credentials) return;
    try {
      await api(credentials).logout();
    } catch (cause) {
      if (!(cause instanceof CampaignApiError && cause.status === 401)) {
        setError("Você saiu deste dispositivo, mas a revogação no servidor não foi confirmada.");
      }
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {!!error && <Text accessibilityRole="alert" style={{ color: colors.error, padding: 16 }}>{error}</Text>}
      {session ? <CampaignWorkspace colors={colors} campaigns={campaigns} selected={selected}
        invite={invite} name={name} busy={busy} onNameChange={setName} onCreate={create}
        entries={entries} draft={draft} editingEntry={!!editingEntryId}
        onDraftChange={setDraft} onSaveEntry={saveEntry} onEditEntry={editEntry} onCancelEdit={cancelEdit}
        onRefresh={refresh} onSelect={select} onInvite={generateInvite}
        onCopyInvite={copyInvite} onLogout={logout} onStartCombat={startCombat} /> :
        <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1, justifyContent: "center" }}>
          <CampaignAuthForm colors={colors} busy={busy} onSubmit={authenticate} />
        </ScrollView>}
    </View>
  );
}
