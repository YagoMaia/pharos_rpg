import { CampaignAuthForm } from "@/components/campaign/CampaignAuthForm";
import { PlayerCampaignWorkspace } from "@/components/campaign/PlayerCampaignWorkspace";
import { useCharacter } from "@/context/CharacterContext";
import { useTheme } from "@/context/ThemeContext";
import { useWebSocket } from "@/context/WebSocketContext";
import { initiativeBonus } from "@/utils/featRules";
import { useRouter } from "expo-router";
import { useCampaignAuth } from "@/context/CampaignAuthContext";
import {
  CampaignApiError,
  CampaignNpc,
  CampaignQuest,
  CampaignSession,
  CampaignSummary,
  JournalEntry,
  createAuthApi,
  createCampaignApi,
} from "@/services/campaignApi";
import { playerCampaigns } from "@/services/campaignView";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

export default function PlayerCampaignsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { connectToCampaign } = useWebSocket();
  const { character, isLoading } = useCharacter();
  // Token apenas em memória até existir armazenamento seguro por plataforma.
  const [session, setSession] = useCampaignAuth();
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [selected, setSelected] = useState<CampaignSummary | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [sessions, setSessions] = useState<CampaignSession[]>([]);
  const [quests, setQuests] = useState<CampaignQuest[]>([]);
  const [npcs, setNpcs] = useState<CampaignNpc[]>([]);
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const clearSession = useCallback(() => {
    setSession(null);
    setCampaigns([]);
    setSelected(null);
    setEntries([]);
    setSessions([]);
    setQuests([]);
    setNpcs([]);
    setInviteCode("");
    setError("");
  }, [setSession]);

  const showError = useCallback((cause: unknown) => {
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
  }, [clearSession]);

  async function authenticate(baseUrl: string, name: string, pin: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const auth = createAuthApi({ baseUrl: baseUrl.trim() });
      const { accessToken } = await auth.tableLogin(name, pin);
      const credentials = { baseUrl: baseUrl.trim(), token: accessToken, role: "player" as const };
      setSelected(null);
      setEntries([]);
      setSessions([]);
      setQuests([]);
      setNpcs([]);
      setInviteCode("");
      setSession(credentials);
      const client = createCampaignApi({ baseUrl: credentials.baseUrl, getAccessToken: () => credentials.token });
      setCampaigns(playerCampaigns(await client.listCampaigns()));
    } catch (cause) {
      if (cause instanceof CampaignApiError && cause.status === 401) {
        clearSession();
        setError("Nome ou PIN inválidos.");
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

  useEffect(() => {
    let active = true;
    if (session?.role === "player") {
      setBusy(true);
      setError("");
      const client = createCampaignApi({ baseUrl: session.baseUrl, getAccessToken: () => session.token });
      client
        .listCampaigns()
        .then((data) => {
          if (active) setCampaigns(playerCampaigns(data));
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
    run(async (client) => {
      const updated = playerCampaigns(await client.listCampaigns());
      setCampaigns(updated);
      setSelected((current) => updated.find((campaign) => campaign.id === current?.id) ?? null);
      if (selected && updated.some((campaign) => campaign.id === selected.id)) {
        const [notes, sess, qst, npclist] = await Promise.all([
          client.listEntries(selected.id),
          client.listSessions(selected.id),
          client.listQuests(selected.id),
          client.listNpcs(selected.id),
        ]);
        setEntries(notes);
        setSessions(sess);
        setQuests(qst);
        setNpcs(npclist);
      } else {
        setEntries([]);
        setSessions([]);
        setQuests([]);
        setNpcs([]);
      }
    });
  }

  function select(campaign: CampaignSummary) {
    run(async (client) => {
      const [notes, sess, qst, npclist] = await Promise.all([
        client.listEntries(campaign.id),
        client.listSessions(campaign.id),
        client.listQuests(campaign.id),
        client.listNpcs(campaign.id),
      ]);
      setSelected(campaign);
      setEntries(notes);
      setSessions(sess);
      setQuests(qst);
      setNpcs(npclist);
    });
  }

  function join() {
    run(async (client) => {
      const joined = await client.joinCampaign(inviteCode);
      setCampaigns((current) => [...current.filter((item) => item.id !== joined.id), joined]);
      setSelected(joined);
      setInviteCode("");
      const [notes, sess, qst, npclist] = await Promise.all([
        client.listEntries(joined.id),
        client.listSessions(joined.id),
        client.listQuests(joined.id),
        client.listNpcs(joined.id),
      ]);
      setEntries(notes);
      setSessions(sess);
      setQuests(qst);
      setNpcs(npclist);
    });
  }

  function link() {
    const sheetId = character.sheetId;
    if (!selected || isLoading || !sheetId) return;
    run(async (client) => {
      const linked = await client.linkCharacter(selected.id, sheetId, character);
      setCampaigns((current) => current.map((item) => item.id === linked.id ? linked : item));
      setSelected(linked);
    });
  }

  function syncSheet() {
    if (!selected || !selected.characterId || isLoading) return;
    run(async (client) => {
      await client.syncCharacterSheet(selected.id, character);
    });
  }

  function unlink() {
    if (!selected) return;
    run(async (client) => {
      const unlinked = await client.unlinkCharacter(selected.id);
      setCampaigns((current) => current.map((item) => item.id === unlinked.id ? unlinked : item));
      setSelected(unlinked);
    });
  }

  function startCombat() {
    if (!selected || selected.characterId !== character.sheetId || isLoading || !session) return;
    const initiative = Math.floor(Math.random() * 20) + 1 + initiativeBonus(character);
    const petInitiative = character.pet
      ? Math.floor(Math.random() * 20) + 1 + (character.pet.attributes?.["Destreza"]?.modifier || 0)
      : undefined;
    connectToCampaign(selected.id, "player", initiative, petInitiative);
    router.push("/(player)/session-combat");
  }

  async function logout() {
    const credentials = session;
    clearSession();
    if (!credentials) return;
    try {
      await createCampaignApi({ baseUrl: credentials.baseUrl,
        getAccessToken: () => credentials.token }).logout();
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
      {session?.role === "player" ? (
        <PlayerCampaignWorkspace
          colors={colors}
          campaigns={campaigns}
          selected={selected}
          entries={entries}
          sessions={sessions}
          quests={quests}
          npcs={npcs}
          inviteCode={inviteCode}
          onInviteChange={setInviteCode}
          busy={busy}
          onJoin={join}
          onLink={link}
          onUnlink={unlink}
          onSyncSheet={syncSheet}
          onRefresh={refresh}
          onSelect={select}
          onLogout={logout}
          onStartCombat={startCombat}
          characterName={character.name}
          characterId={isLoading ? undefined : character.sheetId}
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1, justifyContent: "center" }}>
          <CampaignAuthForm colors={colors} role="player" busy={busy} onSubmit={authenticate} />
        </ScrollView>
      )}
    </View>
  );
}
