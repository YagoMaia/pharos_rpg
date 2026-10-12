import { ThemeColors } from "@/constants/theme";
import { CampaignNpc, CampaignQuest, CampaignSession, CampaignSummary, JournalEntry } from "@/services/campaignApi";
import { CampaignJournalList } from "./CampaignJournal";
import { CampaignSessions } from "./CampaignSessions";
import { CampaignQuests } from "./CampaignQuests";
import { CampaignNpcList } from "./CampaignNpcList";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from "react-native";

interface PlayerCampaignWorkspaceProps {
  colors: ThemeColors;
  campaigns: CampaignSummary[];
  entries: JournalEntry[];
  sessions?: CampaignSession[];
  quests?: CampaignQuest[];
  npcs?: CampaignNpc[];
  selected: CampaignSummary | null;
  inviteCode: string;
  characterName: string;
  characterId?: string;
  busy: boolean;
  onInviteChange: (code: string) => void;
  onJoin: () => void;
  onLink: () => void;
  onUnlink?: () => void;
  onSyncSheet?: () => void;
  onRefresh: () => void;
  onSelect: (campaign: CampaignSummary) => void;
  onLogout: () => void;
  onStartCombat: () => void;
}

const webPointer = Platform.OS === "web" ? ({ cursor: "pointer" } as const) : {};

function CampaignButton({
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

/** Entrada e vínculo explícito: uma falha no vínculo não exige novo convite. */
export function PlayerCampaignWorkspace(props: PlayerCampaignWorkspaceProps) {
  const { colors, campaigns, selected, busy } = props;
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const [tab, setTab] = useState<"sheet" | "sessions" | "quests" | "npcs" | "journal">("sheet");

  const isCurrentSheetLinked =
    selected && props.characterId && selected.characterId === props.characterId;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      {/* Barra Superior */}
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <View style={styles.topBarLeft}>
          <View
            style={[
              styles.roleBadge,
              { backgroundColor: "rgba(3, 218, 198, 0.15)" },
            ]}
          >
            <Ionicons name="person-outline" size={18} color={colors.secondary || colors.info} />
            <Text style={[styles.roleBadgeText, { color: colors.secondary || colors.info }]}>Jogador</Text>
          </View>
          <Text style={[styles.topBarTitle, { color: colors.text }]}>Minhas Campanhas</Text>
        </View>

        <CampaignButton
          label="Sair da Mesa"
          icon="log-out-outline"
          disabled={busy}
          color={colors.error}
          onPress={props.onLogout}
          outline
        />
      </View>

      {/* Layout Responsivo */}
      <View style={isDesktop ? styles.columns : styles.stack}>
        {/* Coluna Esquerda: Convite e Campanhas */}
        <View style={[styles.sidebar, isDesktop ? { width: 340 } : { width: "100%" }]}>
          {/* Card: Entrar com convite */}
          <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="ticket-outline" size={18} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Entrar com Convite</Text>
            </View>

            <TextInput
              accessibilityLabel="Código do convite"
              value={props.inviteCode}
              onChangeText={props.onInviteChange}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Código enviado pelo mestre"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.inputBg,
                },
              ]}
            />

            <CampaignButton
              label="Entrar na Campanha"
              icon="enter-outline"
              disabled={busy || !props.inviteCode.trim()}
              color={colors.primary}
              onPress={props.onJoin}
            />
          </View>

          {/* Card: Lista de Campanhas */}
          <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 14 }]}>
            <View style={styles.cardHeaderBetween}>
              <View style={styles.cardHeader}>
                <Ionicons name="folder-outline" size={18} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>Campanhas</Text>
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
                  Você ainda não participa de nenhuma campanha como jogador.
                </Text>
              </View>
            ) : (
              <View style={styles.campaignList}>
                {campaigns.map((campaign) => {
                  const isSelected = selected?.id === campaign.id;
                  const isLinked = !!campaign.characterId;

                  return (
                    <TouchableOpacity
                      key={campaign.id}
                      accessibilityRole="button"
                      disabled={busy}
                      onPress={() => props.onSelect(campaign)}
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
                      <View style={styles.campaignItemContent}>
                        <View style={styles.campaignItemTop}>
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
                          {isSelected && (
                            <View style={[styles.activePill, { backgroundColor: colors.primary }]}>
                              <Text style={styles.activePillText}>Ativa</Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.statusPillRow}>
                          <Ionicons
                            name={isLinked ? "link" : "alert-circle-outline"}
                            size={12}
                            color={isLinked ? colors.success : colors.warning}
                          />
                          <Text
                            style={[
                              styles.campaignStatus,
                              { color: isLinked ? colors.success : colors.warning },
                            ]}
                          >
                            {isLinked ? "Ficha vinculada" : "Toque para vincular ficha"}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* Coluna Direita: Detalhes da Campanha e Diário */}
        <View style={[styles.detail, { flex: 1 }]}>
          {!selected ? (
            <View
              style={[
                styles.panel,
                styles.placeholderCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Ionicons name="shield-outline" size={54} color={colors.textSecondary} />
              <Text style={[styles.placeholderTitle, { color: colors.text }]}>
                Selecione uma Campanha
              </Text>
              <Text style={[styles.placeholderSubtitle, { color: colors.textSecondary }]}>
                Entre com um código de convite ou selecione uma campanha à esquerda para ver os detalhes, vincular sua ficha e acessar o diário.
              </Text>
            </View>
          ) : (
            <View style={styles.detailContent}>
              {/* Barra de Abas da Campanha */}
              <View style={[styles.campaignTabsRow, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                  accessibilityRole="tab"
                  accessibilityState={{ selected: tab === "sheet" }}
                  onPress={() => setTab("sheet")}
                  style={[
                    styles.campaignTab,
                    tab === "sheet" && { borderBottomColor: colors.primary, borderBottomWidth: 3 },
                    webPointer,
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={16}
                    color={tab === "sheet" ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.campaignTabText,
                      { color: tab === "sheet" ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    Ficha & Vínculo
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

              {/* Aba: Ficha e Vínculo */}
              {tab === "sheet" && (
                <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 14 }]}>
                  <View style={styles.selectedHeader}>
                    <Text style={[styles.selectedTitle, { color: colors.text }]}>{selected.name}</Text>
                    <View style={styles.idRow}>
                      <Text style={[styles.idLabel, { color: colors.textSecondary }]}>ID:</Text>
                      <Text selectable style={[styles.idValue, { color: colors.text }]}>
                        {selected.id}
                      </Text>
                    </View>
                  </View>

                  {/* Bloco de Personagem Local */}
                  <View style={[styles.charBox, { borderColor: colors.border, backgroundColor: colors.inputBg }]}>
                    <View style={styles.charBoxLeft}>
                      <View
                        style={[
                          styles.charAvatar,
                          { backgroundColor: isCurrentSheetLinked ? colors.success : colors.primary },
                        ]}
                      >
                        <Ionicons
                          name={isCurrentSheetLinked ? "shield-checkmark" : "person"}
                          size={18}
                          color="#fff"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.charName, { color: colors.text }]}>
                          {props.characterName || "Sem Nome"}
                        </Text>
                        <Text style={[styles.charSubtitle, { color: colors.textSecondary }]}>
                          {isCurrentSheetLinked
                            ? "Ficha pronta para o combate e sincronizada"
                            : selected.characterId
                              ? "Outra ficha está vinculada nesta campanha"
                              : "Ficha deste dispositivo ainda não vinculada"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Ações da Campanha */}
                  <View style={styles.actionsContainer}>
                    {selected.characterId !== props.characterId && (
                      <CampaignButton
                        label={
                          selected.characterId
                            ? "Substituir Vínculo pela Ficha Atual"
                            : "Vincular Minha Ficha à Campanha"
                        }
                        icon={selected.characterId ? "swap-horizontal-outline" : "link-outline"}
                        disabled={busy || !props.characterId}
                        color={colors.primary}
                        onPress={props.onLink}
                      />
                    )}

                    {isCurrentSheetLinked && !!props.onSyncSheet && (
                      <CampaignButton
                        label="Sincronizar Ficha Completa"
                        icon="cloud-upload-outline"
                        disabled={busy}
                        color={colors.secondary || colors.info}
                        textColor="#121212"
                        onPress={props.onSyncSheet}
                      />
                    )}

                    {!!selected.characterId && !!props.onUnlink && (
                      <CampaignButton
                        label="Desvincular Ficha"
                        icon="unlink-outline"
                        disabled={busy}
                        color={colors.error}
                        outline
                        onPress={props.onUnlink}
                      />
                    )}

                    {isCurrentSheetLinked && (
                      <CampaignButton
                        label="Rolar Iniciativa e Abrir Combate"
                        icon="flash-outline"
                        disabled={busy}
                        color={colors.primary}
                        onPress={props.onStartCombat}
                      />
                    )}
                  </View>
                </View>
              )}

              {/* Aba: Sessões */}
              {tab === "sessions" && (
                <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 14 }]}>
                  <CampaignSessions
                    colors={colors}
                    sessions={props.sessions || []}
                    isGm={false}
                    busy={busy}
                  />
                </View>
              )}

              {/* Aba: Missões (Quests) */}
              {tab === "quests" && (
                <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 14 }]}>
                  <CampaignQuests
                    colors={colors}
                    quests={props.quests || []}
                    isGm={false}
                    busy={busy}
                  />
                </View>
              )}

              {/* Aba: NPCs Conhecidos da Mesa */}
              {tab === "npcs" && (
                <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 14 }]}>
                  <CampaignNpcList
                    colors={colors}
                    npcs={props.npcs || []}
                    isGm={false}
                    busy={busy}
                  />
                </View>
              )}

              {/* Aba: Diário */}
              {tab === "journal" && (
                <View style={{ marginTop: 14 }}>
                  <CampaignJournalList colors={colors} entries={props.entries} />
                </View>
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
    textAlign: "center",
  },
  campaignList: {
    gap: 8,
  },
  campaignItem: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  campaignItemContent: {
    gap: 4,
  },
  campaignItemTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
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
  statusPillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  campaignStatus: {
    fontSize: 12,
    fontWeight: "500",
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
    gap: 14,
  },
  selectedHeader: {
    marginBottom: 14,
  },
  selectedTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  idRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  idLabel: {
    fontSize: 12,
  },
  idValue: {
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  charBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  charBoxLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  charAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  charName: {
    fontSize: 15,
    fontWeight: "bold",
  },
  charSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  actionsContainer: {
    gap: 8,
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
});
