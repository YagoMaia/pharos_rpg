import { CampaignAuthForm } from "@/components/campaign/CampaignAuthForm";
import { CampaignWorkspace } from "@/components/campaign/CampaignWorkspace";
import { MemberSheetModal } from "@/components/campaign/MemberSheetModal";
import { useTheme } from "@/context/ThemeContext";
import { useWebSocket } from "@/context/WebSocketContext";
import { useRouter } from "expo-router";
import { CampaignSession as Session, useCampaignAuth } from "@/context/CampaignAuthContext";
import {
  CampaignApiError,
  CampaignDetails,
  CampaignEncounter,
  CampaignEncounterInput,
  CampaignInvite,
  CampaignMember,
  CampaignNpc,
  CampaignNpcInput,
  CampaignQuest,
  CampaignQuestInput,
  CampaignSession,
  CampaignSessionInput,
  CampaignSummary,
  JournalEntry,
  JournalEntryInput,
  createAuthApi,
  createCampaignApi,
} from "@/services/campaignApi";
import { masterCampaigns } from "@/services/campaignView";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React, { useCallback, useEffect, useState } from "react";
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
  const [sessions, setSessions] = useState<CampaignSession[]>([]);
  const [quests, setQuests] = useState<CampaignQuest[]>([]);
  const [encounters, setEncounters] = useState<CampaignEncounter[]>([]);
  const [npcs, setNpcs] = useState<CampaignNpc[]>([]);
  const [inspectedMember, setInspectedMember] = useState<CampaignMember | null>(null);
  const [inspectedSheet, setInspectedSheet] = useState<any | null>(null);
  const [sheetModalVisible, setSheetModalVisible] = useState(false);
  const [draft, setDraft] = useState<JournalEntryInput>(EMPTY_DRAFT);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function api(credentials: Session) {
    return createCampaignApi({
      baseUrl: credentials.baseUrl, getAccessToken: () => credentials.token,
    });
  }

  const clearSession = useCallback(() => {
    setSession(null);
    setSelected(null);
    setCampaigns([]);
    setInvite(null);
    setEntries([]);
    setSessions([]);
    setQuests([]);
    setEncounters([]);
    setNpcs([]);
    setDraft(EMPTY_DRAFT);
    setEditingEntryId(null);
    setInspectedMember(null);
    setInspectedSheet(null);
    setSheetModalVisible(false);
  }, [setSession]);

  const showError = useCallback((cause: unknown) => {
    if (cause instanceof CampaignApiError && cause.status === 401) {
      clearSession();
      setError("Sessão expirada. Entre novamente.");
      return;
    }
    setError("Não foi possível concluir a operação. Verifique a conexão e tente novamente.");
  }, [clearSession]);

  async function authenticate(baseUrl: string, name: string, pin: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const auth = createAuthApi({ baseUrl: baseUrl.trim() });
      const { accessToken } = await auth.tableLogin(name, pin);
      const credentials: Session = { baseUrl: baseUrl.trim(), token: accessToken, role: "gm" };
      setSelected(null);
      setEntries([]);
      setSessions([]);
      setQuests([]);
      setEncounters([]);
      setNpcs([]);
      setInvite(null);
      setDraft(EMPTY_DRAFT);
      setEditingEntryId(null);
      setSession(credentials);
      setCampaigns(masterCampaigns(await api(credentials).listCampaigns()));
    } catch (cause) {
      if (cause instanceof CampaignApiError && cause.status === 401) {
        setError("Nome ou PIN inválidos.");
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

  useEffect(() => {
    let active = true;
    if (session?.role === "gm") {
      setBusy(true);
      setError("");
      const client = api(session);
      client
        .listCampaigns()
        .then(async (data) => {
          if (!active) return;
          let masterList = masterCampaigns(data);
          // Se não existir nenhuma campanha (primeiro boot), inicializa a Mesa automaticamente
          if (masterList.length === 0) {
            try {
              const defaultCamp = await client.createCampaign("A Mesa de Pharos");
              masterList = [defaultCamp];
            } catch {
              // Segue com lista vazia se falhar
            }
          }
          if (active) setCampaigns(masterList);

          // Auto-seleciona a campanha ativa e carrega o painel completo
          if (masterList.length > 0) {
            const firstId = masterList[0].id;
            const [details, notes, sessionsList, questsList, encountersList, npcsList] = await Promise.all([
              client.getCampaign(firstId),
              client.listEntries(firstId),
              client.listSessions(firstId),
              client.listQuests(firstId),
              client.listEncounters(firstId),
              client.listNpcs(firstId),
            ]);
            if (active) {
              setSelected(details);
              setEntries(notes);
              setSessions(sessionsList);
              setQuests(questsList);
              setEncounters(encountersList);
              setNpcs(npcsList);
            }
          }
        })
        .catch((cause) => {
          if (active) showError(cause);
        })
        .finally(() => {
          if (active) setBusy(false);
        });
    }
    return () => {
      active = false;
    };
  }, [session, showError]);

  function refresh() {
    run(async (credentials) => {
      setCampaigns(masterCampaigns(await api(credentials).listCampaigns()));
      if (!selected) return;
      const [details, notes, sessionsList, questsList, encountersList, npcsList] = await Promise.all([
        api(credentials).getCampaign(selected.id),
        api(credentials).listEntries(selected.id),
        api(credentials).listSessions(selected.id),
        api(credentials).listQuests(selected.id),
        api(credentials).listEncounters(selected.id),
        api(credentials).listNpcs(selected.id),
      ]);
      setSelected(details);
      setEntries(notes);
      setSessions(sessionsList);
      setQuests(questsList);
      setEncounters(encountersList);
      setNpcs(npcsList);
    });
  }

  function create() {
    run(async (credentials) => {
      const created = await api(credentials).createCampaign(name);
      setCampaigns((previous) => [...previous, created]);
      setSelected(await api(credentials).getCampaign(created.id));
      setEntries([]);
      setSessions([]);
      setQuests([]);
      setEncounters([]);
      setNpcs([]);
      setDraft(EMPTY_DRAFT);
      setEditingEntryId(null);
      setInvite(null);
      setName("");
    });
  }

  function select(id: string) {
    run(async (credentials) => {
      const [details, notes, sessionsList, questsList, encountersList, npcsList] = await Promise.all([
        api(credentials).getCampaign(id),
        api(credentials).listEntries(id),
        api(credentials).listSessions(id),
        api(credentials).listQuests(id),
        api(credentials).listEncounters(id),
        api(credentials).listNpcs(id),
      ]);
      setSelected(details);
      setEntries(notes);
      setSessions(sessionsList);
      setQuests(questsList);
      setEncounters(encountersList);
      setNpcs(npcsList);
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

  function deleteEntry(entry: JournalEntry) {
    if (!selected) return;
    run(async (credentials) => {
      const client = api(credentials);
      await client.deleteEntry(selected.id, entry.id);
      setEntries(await client.listEntries(selected.id));
      if (editingEntryId === entry.id) cancelEdit();
    });
  }

  function deleteCurrentDraft() {
    if (!selected || !editingEntryId) return;
    run(async (credentials) => {
      const client = api(credentials);
      await client.deleteEntry(selected.id, editingEntryId);
      setEntries(await client.listEntries(selected.id));
      cancelEdit();
    });
  }

  function createSession(sessionInput: CampaignSessionInput) {
    if (!selected) return;
    run(async (credentials) => {
      const client = api(credentials);
      await client.createSession(selected.id, sessionInput);
      setSessions(await client.listSessions(selected.id));
    });
  }

  function updateSession(sessionId: string, sessionInput: CampaignSessionInput) {
    if (!selected) return;
    run(async (credentials) => {
      const client = api(credentials);
      await client.updateSession(selected.id, sessionId, sessionInput);
      setSessions(await client.listSessions(selected.id));
    });
  }

  function deleteSession(sessionId: string) {
    if (!selected) return;
    run(async (credentials) => {
      const client = api(credentials);
      await client.deleteSession(selected.id, sessionId);
      setSessions(await client.listSessions(selected.id));
    });
  }

  function createQuest(questInput: CampaignQuestInput) {
    if (!selected) return;
    run(async (credentials) => {
      const client = api(credentials);
      await client.createQuest(selected.id, questInput);
      setQuests(await client.listQuests(selected.id));
    });
  }

  function updateQuest(questId: string, questInput: CampaignQuestInput) {
    if (!selected) return;
    run(async (credentials) => {
      const client = api(credentials);
      await client.updateQuest(selected.id, questId, questInput);
      setQuests(await client.listQuests(selected.id));
    });
  }

  function deleteQuest(questId: string) {
    if (!selected) return;
    run(async (credentials) => {
      const client = api(credentials);
      await client.deleteQuest(selected.id, questId);
      setQuests(await client.listQuests(selected.id));
    });
  }

  async function inspectMember(member: CampaignMember) {
    if (!selected || !session) return;
    setInspectedMember(member);
    try {
      const resp = await api(session).getMemberSheet(selected.id, member.id);
      setInspectedSheet(resp.characterData);
    } catch {
      setInspectedSheet(null);
    }
    setSheetModalVisible(true);
  }

  function createEncounter(encounter: CampaignEncounterInput) {
    if (!selected) return;
    run(async (credentials) => {
      const client = api(credentials);
      await client.createEncounter(selected.id, encounter);
      setEncounters(await client.listEncounters(selected.id));
    });
  }

  function updateEncounter(encounterId: string, encounter: CampaignEncounterInput) {
    if (!selected) return;
    run(async (credentials) => {
      const client = api(credentials);
      await client.updateEncounter(selected.id, encounterId, encounter);
      setEncounters(await client.listEncounters(selected.id));
    });
  }

  function deleteEncounter(encounterId: string) {
    if (!selected) return;
    run(async (credentials) => {
      const client = api(credentials);
      await client.deleteEncounter(selected.id, encounterId);
      setEncounters(await client.listEncounters(selected.id));
    });
  }

  function launchEncounter(encounterId: string) {
    if (!selected) return;
    run(async (credentials) => {
      const client = api(credentials);
      await client.launchEncounter(selected.id, encounterId);
      setEncounters(await client.listEncounters(selected.id));
      startCombat();
    });
  }

  function createNpc(npc: CampaignNpcInput) {
    if (!selected) return;
    run(async (credentials) => {
      const client = api(credentials);
      await client.createNpc(selected.id, npc);
      setNpcs(await client.listNpcs(selected.id));
    });
  }

  function updateNpc(npcId: string, npc: CampaignNpcInput) {
    if (!selected) return;
    run(async (credentials) => {
      const client = api(credentials);
      await client.updateNpc(selected.id, npcId, npc);
      setNpcs(await client.listNpcs(selected.id));
    });
  }

  function deleteNpc(npcId: string) {
    if (!selected) return;
    run(async (credentials) => {
      const client = api(credentials);
      await client.deleteNpc(selected.id, npcId);
      setNpcs(await client.listNpcs(selected.id));
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
      {!!error && (
        <View
          style={{
            backgroundColor: "rgba(229, 57, 53, 0.12)",
            borderColor: colors.error,
            borderWidth: 1,
            borderRadius: 10,
            marginHorizontal: 16,
            marginTop: 16,
            maxWidth: 1240,
            alignSelf: "center",
            width: "100%",
            padding: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Ionicons name="alert-circle" size={20} color={colors.error} />
          <Text accessibilityRole="alert" style={{ color: colors.error, flex: 1, fontWeight: "600", fontSize: 14 }}>
            {error}
          </Text>
        </View>
      )}
      {session?.role === "gm" ? (
        <>
          <CampaignWorkspace
            colors={colors}
            campaigns={campaigns}
            selected={selected}
            invite={invite}
            name={name}
            busy={busy}
            onNameChange={setName}
            onCreate={create}
            entries={entries}
            draft={draft}
            editingEntry={!!editingEntryId}
            sessions={sessions}
            quests={quests}
            encounters={encounters}
            npcs={npcs}
            onDraftChange={setDraft}
            onSaveEntry={saveEntry}
            onEditEntry={editEntry}
            onCancelEdit={cancelEdit}
            onDeleteEntry={deleteEntry}
            onDeleteDraft={deleteCurrentDraft}
            onRefresh={refresh}
            onSelect={select}
            onInvite={generateInvite}
            onCopyInvite={copyInvite}
            onLogout={logout}
            onStartCombat={startCombat}
            onCreateSession={createSession}
            onUpdateSession={updateSession}
            onDeleteSession={deleteSession}
            onCreateQuest={createQuest}
            onUpdateQuest={updateQuest}
            onDeleteQuest={deleteQuest}
            onInspectMember={inspectMember}
            onCreateEncounter={createEncounter}
            onUpdateEncounter={updateEncounter}
            onDeleteEncounter={deleteEncounter}
            onLaunchEncounter={launchEncounter}
            onCreateNpc={createNpc}
            onUpdateNpc={updateNpc}
            onDeleteNpc={deleteNpc}
          />

          <MemberSheetModal
            visible={sheetModalVisible}
            memberName={inspectedMember?.name || ""}
            sheet={inspectedSheet}
            colors={colors}
            onClose={() => setSheetModalVisible(false)}
          />
        </>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1, justifyContent: "center" }}>
          <CampaignAuthForm colors={colors} role="gm" busy={busy} onSubmit={authenticate} />
        </ScrollView>
      )}
    </View>
  );
}
