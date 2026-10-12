import { ThemeColors } from "@/constants/theme";
import {
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
} from "@/services/campaignApi";
import { CampaignJournalEditor, CampaignJournalList } from "./CampaignJournal";
import { CampaignSessions } from "./CampaignSessions";
import { CampaignQuests } from "./CampaignQuests";
import { CampaignEncounters } from "./CampaignEncounters";
import { CampaignNpcList } from "./CampaignNpcList";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from "react-native";

interface CampaignWorkspaceProps {
  colors: ThemeColors;
  campaigns: CampaignSummary[];
  selected: CampaignDetails | null;
  invite: CampaignInvite | null;
  name: string;
  busy: boolean;
  entries: JournalEntry[];
  draft: JournalEntryInput;
  editingEntry: boolean;
  sessions?: CampaignSession[];
  quests?: CampaignQuest[];
  encounters?: CampaignEncounter[];
  npcs?: CampaignNpc[];
  onNameChange: (name: string) => void;
  onCreate: () => void;
  onRefresh: () => void;
  onSelect: (id: string) => void;
  onInvite: () => void;
  onCopyInvite: () => void;
  onLogout: () => void;
  onStartCombat: () => void;
  onDraftChange: (draft: JournalEntryInput) => void;
  onSaveEntry: () => void;
  onEditEntry: (entry: JournalEntry) => void;
  onCancelEdit: () => void;
  onDeleteEntry?: (entry: JournalEntry) => void;
  onDeleteDraft?: () => void;
  onCreateSession?: (session: CampaignSessionInput) => void;
  onUpdateSession?: (sessionId: string, session: CampaignSessionInput) => void;
  onDeleteSession?: (sessionId: string) => void;
  onCreateQuest?: (quest: CampaignQuestInput) => void;
  onUpdateQuest?: (questId: string, quest: CampaignQuestInput) => void;
  onDeleteQuest?: (questId: string) => void;
  onInspectMember?: (member: CampaignMember) => void;
  onCreateEncounter?: (encounter: CampaignEncounterInput) => void;
  onUpdateEncounter?: (encounterId: string, encounter: CampaignEncounterInput) => void;
  onDeleteEncounter?: (encounterId: string) => void;
  onLaunchEncounter?: (encounterId: string) => void;
  onCreateNpc?: (npc: CampaignNpcInput) => void;
  onUpdateNpc?: (npcId: string, npc: CampaignNpcInput) => void;
  onDeleteNpc?: (npcId: string) => void;
}

const webPointer = Platform.OS === "web" ? ({ cursor: "pointer" } as const) : {};

function ActionButton({
  label,
  icon,
  onPress,
  disabled,
  color,
  textColor = "#fff",
  outline = false,
}: {
  label: string;
  icon?: any;
  onPress: () => void;
  disabled?: boolean;
  color: string;
  textColor?: string;
  outline?: boolean;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        outline
          ? { borderWidth: 1, borderColor: color, backgroundColor: "transparent" }
          : { backgroundColor: color },
        { opacity: disabled ? 0.5 : 1 },
        webPointer,
      ]}
    >
      {icon && <Ionicons name={icon} size={16} color={outline ? color : textColor} />}
      <Text style={[styles.buttonText, { color: outline ? color : textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Painel responsivo para preparar a campanha em desktop ou no celular. */
export function CampaignWorkspace(props: CampaignWorkspaceProps) {
  const { colors, campaigns, selected, invite, busy } = props;
  const { width } = useWindowDimensions();
  const isDesktop = width >= 920;
  const [tab, setTab] = useState<"members" | "sessions" | "quests" | "encounters" | "npcs" | "journal">("members");

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      {/* Barra Superior */}
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <View style={styles.topBarLeft}>
          <View style={[styles.roleBadge, { backgroundColor: "rgba(187, 134, 252, 0.15)" }]}>
            <MaterialCommunityIcons name="shield-crown" size={20} color={colors.primary} />
            <Text style={[styles.roleBadgeText, { color: colors.primary }]}>Mestre</Text>
          </View>
          <Text style={[styles.topBarTitle, { color: colors.text }]}>Painel de Campanhas</Text>
        </View>

        <ActionButton
          label="Sair da Mesa"
          icon="log-out-outline"
          color={colors.error}
          disabled={busy}
          onPress={props.onLogout}
          outline
        />
      </View>

      {/* Grid Principal Responsivo */}
      <View style={isDesktop ? styles.columns : styles.stack}>
        {/* Coluna Esquerda: Criação e Lista */}
        <View style={[styles.sidebar, isDesktop ? { width: 340 } : { width: "100%" }]}>
          {/* Card: Criar Campanha */}
          <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Nova Campanha</Text>
            </View>

            <TextInput
              accessibilityLabel="Nome da campanha"
              value={props.name}
              onChangeText={props.onNameChange}
              placeholder="Ex: A Torre do Sol"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.inputBg,
                },
              ]}
            />

            <ActionButton
              label="Criar Campanha"
              icon="add-outline"
              disabled={busy || !props.name.trim()}
              color={colors.primary}
              onPress={props.onCreate}
            />
          </View>

          {/* Card: Minhas Campanhas */}
          <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 14 }]}>
            <View style={styles.cardHeaderBetween}>
              <View style={styles.cardHeader}>
                <Ionicons name="folder-outline" size={18} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>Minhas Campanhas</Text>
                <View style={[styles.countBadge, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Text style={[styles.countText, { color: colors.textSecondary }]}>{campaigns.length}</Text>
                </View>
              </View>

              <TouchableOpacity
                accessibilityRole="button"
                disabled={busy}
                onPress={props.onRefresh}
                style={[styles.iconButton, { borderColor: colors.border, backgroundColor: colors.inputBg }, webPointer]}
              >
                <Ionicons name="refresh-outline" size={16} color={colors.text} />
              </TouchableOpacity>
            </View>

            {campaigns.length === 0 ? (
              <View style={[styles.emptyBox, { borderColor: colors.border }]}>
                <Ionicons name="file-tray-outline" size={24} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Nenhuma campanha criada ainda.
                </Text>
              </View>
            ) : (
              <View style={styles.campaignList}>
                {campaigns.map((campaign) => {
                  const isSelected = selected?.id === campaign.id;
                  return (
                    <TouchableOpacity
                      key={campaign.id}
                      accessibilityRole="button"
                      disabled={busy}
                      onPress={() => props.onSelect(campaign.id)}
                      style={[
                        styles.campaignItem,
                        {
                          borderColor: isSelected ? colors.primary : colors.border,
                          backgroundColor: isSelected
                            ? "rgba(187, 134, 252, 0.10)"
                            : colors.inputBg,
                          borderLeftWidth: isSelected ? 4 : 1,
                        },
                        webPointer,
                      ]}
                    >
                      <View style={styles.campaignItemLeft}>
                        <Ionicons
                          name={isSelected ? "folder-open" : "folder"}
                          size={18}
                          color={isSelected ? colors.primary : colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.campaignName,
                            {
                              color: colors.text,
                              fontWeight: isSelected ? "bold" : "600",
                            },
                          ]}
                        >
                          {campaign.name}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={[styles.activePill, { backgroundColor: colors.primary }]}>
                          <Text style={styles.activePillText}>Ativa</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* Coluna Direita: Detalhes, Membros e Diário */}
        <View style={[styles.detail, { flex: 1 }]}>
          {!selected ? (
            <View
              style={[
                styles.panel,
                styles.placeholderCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <MaterialCommunityIcons name="compass-outline" size={54} color={colors.textSecondary} />
              <Text style={[styles.placeholderTitle, { color: colors.text }]}>
                Selecione uma Campanha
              </Text>
              <Text style={[styles.placeholderSubtitle, { color: colors.textSecondary }]}>
                Escolha uma campanha na lista à esquerda ou crie uma nova para ver membros, gerar convites e iniciar o combate.
              </Text>
            </View>
          ) : (
            <View style={styles.detailContent}>
              {/* Card de Visão Geral da Campanha */}
              <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.campaignHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.campaignDetailTitle, { color: colors.text }]}>{selected.name}</Text>
                    <View style={styles.idRow}>
                      <Text style={[styles.idLabel, { color: colors.textSecondary }]}>ID da Campanha:</Text>
                      <Text selectable style={[styles.idValue, { color: colors.text }]}>
                        {selected.id}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Toolbar de Ações Rápidas */}
                <View style={styles.actionToolbar}>
                  <ActionButton
                    label="Abrir Combate da Campanha"
                    icon="flash-outline"
                    disabled={busy}
                    color={colors.primary}
                    onPress={props.onStartCombat}
                  />

                  <ActionButton
                    label="Gerar Convite (24h)"
                    icon="ticket-outline"
                    disabled={busy}
                    color={colors.secondary || colors.info}
                    textColor="#121212"
                    onPress={props.onInvite}
                  />
                </View>

                {/* Cartão de Convite Ativo */}
                {invite && (
                  <View style={[styles.inviteCard, { borderColor: colors.border, backgroundColor: colors.inputBg }]}>
                    <View style={styles.inviteHeader}>
                      <Ionicons name="key-outline" size={18} color={colors.primary} />
                      <Text style={[styles.inviteTitle, { color: colors.text }]}>Convite Gerado</Text>
                    </View>
                    <View style={styles.inviteCodeRow}>
                      <Text selectable style={[styles.inviteCode, { color: colors.primary }]}>
                        {invite.code}
                      </Text>
                      <ActionButton
                        label="Copiar Código"
                        icon="copy-outline"
                        color={colors.primary}
                        onPress={props.onCopyInvite}
                      />
                    </View>
                    <Text style={[styles.inviteExpiry, { color: colors.textSecondary }]}>
                      Expira em: {new Date(invite.expiresAt).toLocaleString("pt-BR")}
                    </Text>
                  </View>
                )}
              </View>

              {/* Barra de Abas da Campanha */}
              <View style={[styles.campaignTabsRow, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                  accessibilityRole="tab"
                  accessibilityState={{ selected: tab === "members" }}
                  onPress={() => setTab("members")}
                  style={[
                    styles.campaignTab,
                    tab === "members" && { borderBottomColor: colors.primary, borderBottomWidth: 3 },
                    webPointer,
                  ]}
                >
                  <Ionicons
                    name="people-outline"
                    size={16}
                    color={tab === "members" ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.campaignTabText,
                      { color: tab === "members" ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    Membros ({selected.members.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityRole="tab"
                  accessibilityState={{ selected: tab === "sessions" }}
                  onPress={() => setTab("sessions")}
                  style={[
                    styles.campaignTab,
                    tab === "sessions" && { borderBottomColor: colors.primary, borderBottomWidth: 3 },
                    webPointer,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="calendar-clock"
                    size={16}
                    color={tab === "sessions" ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.campaignTabText,
                      { color: tab === "sessions" ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    Sessões ({props.sessions?.length || 0})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityRole="tab"
                  accessibilityState={{ selected: tab === "quests" }}
                  onPress={() => setTab("quests")}
                  style={[
                    styles.campaignTab,
                    tab === "quests" && { borderBottomColor: colors.primary, borderBottomWidth: 3 },
                    webPointer,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="target"
                    size={16}
                    color={tab === "quests" ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.campaignTabText,
                      { color: tab === "quests" ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    Missões ({props.quests?.length || 0})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityRole="tab"
                  accessibilityState={{ selected: tab === "encounters" }}
                  onPress={() => setTab("encounters")}
                  style={[
                    styles.campaignTab,
                    tab === "encounters" && { borderBottomColor: colors.primary, borderBottomWidth: 3 },
                    webPointer,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="sword-cross"
                    size={16}
                    color={tab === "encounters" ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.campaignTabText,
                      { color: tab === "encounters" ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    Encontros ({props.encounters?.length || 0})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityRole="tab"
                  accessibilityState={{ selected: tab === "npcs" }}
                  onPress={() => setTab("npcs")}
                  style={[
                    styles.campaignTab,
                    tab === "npcs" && { borderBottomColor: colors.primary, borderBottomWidth: 3 },
                    webPointer,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="account-group-outline"
                    size={16}
                    color={tab === "npcs" ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.campaignTabText,
                      { color: tab === "npcs" ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    NPCs ({props.npcs?.length || 0})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityRole="tab"
                  accessibilityState={{ selected: tab === "journal" }}
                  onPress={() => setTab("journal")}
                  style={[
                    styles.campaignTab,
                    tab === "journal" && { borderBottomColor: colors.primary, borderBottomWidth: 3 },
                    webPointer,
                  ]}
                >
                  <Ionicons
                    name="book-outline"
                    size={16}
                    color={tab === "journal" ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.campaignTabText,
                      { color: tab === "journal" ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    Diário ({props.entries.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Aba: Membros da Mesa */}
              {tab === "members" && (
                <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 14 }]}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="people-outline" size={18} color={colors.primary} />
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Membros da Mesa</Text>
                    <View style={[styles.countBadge, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                      <Text style={[styles.countText, { color: colors.textSecondary }]}>
                        {selected.members.length}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.memberList}>
                    {selected.members.map((member) => {
                      const isGm = member.role === "gm";
                      const hasSheet = Boolean(member.characterId || member.hasSheet);
                      return (
                        <View
                          key={member.id}
                          style={[
                            styles.memberCard,
                            { borderColor: colors.border, backgroundColor: colors.inputBg },
                          ]}
                        >
                          <View style={styles.memberLeft}>
                            <View
                              style={[
                                styles.memberAvatar,
                                { backgroundColor: isGm ? colors.primary : colors.secondary || colors.info },
                              ]}
                            >
                              <Text style={styles.memberAvatarText}>
                                {member.name.slice(0, 2).toUpperCase()}
                              </Text>
                            </View>
                            <View>
                              <Text style={[styles.memberName, { color: colors.text }]}>{member.name}</Text>
                              <View style={styles.memberStatusRow}>
                                <View
                                  style={[
                                    styles.rolePill,
                                    {
                                      backgroundColor: isGm
                                        ? "rgba(187, 134, 252, 0.15)"
                                        : "rgba(3, 218, 198, 0.15)",
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.rolePillText,
                                      { color: isGm ? colors.primary : colors.secondary || colors.info },
                                    ]}
                                  >
                                    {isGm ? "Mestre" : "Jogador"}
                                  </Text>
                                </View>
                                <Text style={[styles.sheetStatus, { color: colors.textSecondary }]}>
                                  {hasSheet ? "Ficha vinculada" : "Sem ficha vinculada"}
                                </Text>
                              </View>
                            </View>
                          </View>

                          {!isGm && hasSheet && props.onInspectMember && (
                            <TouchableOpacity
                              accessibilityRole="button"
                              accessibilityLabel={`Inspecionar ficha de ${member.name}`}
                              onPress={() => props.onInspectMember?.(member)}
                              style={[styles.inspectButton, { backgroundColor: colors.primary }, webPointer]}
                            >
                              <Ionicons name="eye-outline" size={14} color="#fff" />
                              <Text style={styles.inspectButtonText}>Inspecionar Ficha</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Aba: Sessões */}
              {tab === "sessions" && (
                <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 14 }]}>
                  <CampaignSessions
                    colors={colors}
                    sessions={props.sessions || []}
                    isGm={true}
                    busy={busy}
                    onCreateSession={props.onCreateSession}
                    onUpdateSession={props.onUpdateSession}
                    onDeleteSession={props.onDeleteSession}
                  />
                </View>
              )}

              {/* Aba: Missões (Quests) */}
              {tab === "quests" && (
                <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 14 }]}>
                  <CampaignQuests
                    colors={colors}
                    quests={props.quests || []}
                    isGm={true}
                    busy={busy}
                    onCreateQuest={props.onCreateQuest}
                    onUpdateQuest={props.onUpdateQuest}
                    onDeleteQuest={props.onDeleteQuest}
                  />
                </View>
              )}

              {/* Aba: Encontros Pré-montados */}
              {tab === "encounters" && (
                <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 14 }]}>
                  <CampaignEncounters
                    colors={colors}
                    encounters={props.encounters || []}
                    busy={busy}
                    onCreateEncounter={props.onCreateEncounter}
                    onUpdateEncounter={props.onUpdateEncounter}
                    onDeleteEncounter={props.onDeleteEncounter}
                    onLaunchEncounter={props.onLaunchEncounter}
                  />
                </View>
              )}

              {/* Aba: Dossiê de NPCs */}
              {tab === "npcs" && (
                <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 14 }]}>
                  <CampaignNpcList
                    colors={colors}
                    npcs={props.npcs || []}
                    isGm={true}
                    busy={busy}
                    onCreateNpc={props.onCreateNpc}
                    onUpdateNpc={props.onUpdateNpc}
                    onDeleteNpc={props.onDeleteNpc}
                  />
                </View>
              )}

              {/* Aba: Diário */}
              {tab === "journal" && (
                <>
                  <CampaignJournalEditor
                    colors={colors}
                    draft={props.draft}
                    editing={props.editingEntry}
                    busy={busy}
                    onChange={props.onDraftChange}
                    onSave={props.onSaveEntry}
                    onCancel={props.onCancelEdit}
                    onDelete={props.onDeleteDraft}
                  />

                  <CampaignJournalList
                    colors={colors}
                    entries={props.entries}
                    onEdit={props.onEditEntry}
                    onDelete={props.onDeleteEntry}
                  />
                </>
              )}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    width: "100%",
    maxWidth: 1240,
    alignSelf: "center",
    padding: 16,
    gap: 16,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 14,
    borderBottomWidth: 1,
    flexWrap: "wrap",
    gap: 12,
  },
  topBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  topBarTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },
  columns: {
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-start",
  },
  stack: {
    gap: 16,
  },
  sidebar: {},
  panel: {
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    ...Platform.select({
      web: {
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
      },
      default: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  cardHeaderBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  countBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  countText: {
    fontSize: 11,
    fontWeight: "600",
  },
  iconButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 15,
  },
  button: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  buttonText: {
    fontWeight: "bold",
    fontSize: 14,
  },
  emptyBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 10,
    padding: 18,
    alignItems: "center",
    gap: 6,
  },
  emptyText: {
    fontSize: 13,
  },
  campaignList: {
    gap: 8,
  },
  campaignItem: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  campaignItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  campaignName: {
    fontSize: 15,
    flexShrink: 1,
  },
  activePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activePillText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  detail: {},
  placeholderCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 12,
    borderStyle: "dashed",
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  placeholderSubtitle: {
    fontSize: 14,
    textAlign: "center",
    maxWidth: 420,
    lineHeight: 22,
  },
  detailContent: {
    gap: 4,
  },
  campaignHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  campaignDetailTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  idRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  idLabel: {
    fontSize: 12,
  },
  idValue: {
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  actionToolbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  inviteCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginTop: 14,
    gap: 8,
  },
  inviteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  inviteTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },
  inviteCodeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  inviteCode: {
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 2,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  inviteExpiry: {
    fontSize: 12,
  },
  memberList: {
    gap: 8,
  },
  memberCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  memberLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
  memberName: {
    fontSize: 15,
    fontWeight: "bold",
  },
  memberStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  rolePill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: "600",
  },
  sheetStatus: {
    fontSize: 12,
  },
  campaignTabsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginTop: 16,
    gap: 8,
    flexWrap: "wrap",
  },
  campaignTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  campaignTabText: {
    fontSize: 13,
    fontWeight: "600",
  },
  inspectButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  inspectButtonText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
});
