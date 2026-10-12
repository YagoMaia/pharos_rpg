import { ThemeColors } from "@/constants/theme";
import { CampaignQuest, CampaignQuestInput, QuestStatus, QuestVisibility } from "@/services/campaignApi";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface CampaignQuestsProps {
  colors: ThemeColors;
  quests: CampaignQuest[];
  isGm: boolean;
  busy?: boolean;
  onCreateQuest?: (quest: CampaignQuestInput) => void;
  onUpdateQuest?: (questId: string, quest: CampaignQuestInput) => void;
  onDeleteQuest?: (questId: string) => void;
}

const webPointer = Platform.OS === "web" ? ({ cursor: "pointer" } as const) : {};

const STATUS_LABELS: Record<QuestStatus, string> = {
  active: "Ativa",
  completed: "Concluída",
  failed: "Falha",
};

export function CampaignQuests({
  colors,
  quests,
  isGm,
  busy = false,
  onCreateQuest,
  onUpdateQuest,
  onDeleteQuest,
}: CampaignQuestsProps) {
  const [filter, setFilter] = useState<"all" | QuestStatus>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState("");
  const [visibility, setVisibility] = useState<QuestVisibility>("party");
  const [status, setStatus] = useState<QuestStatus>("active");
  const [showForm, setShowForm] = useState(false);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setReward("");
    setVisibility("party");
    setStatus("active");
    setShowForm(false);
  }

  function handleStartEdit(quest: CampaignQuest) {
    setEditingId(quest.id);
    setTitle(quest.title);
    setDescription(quest.description || "");
    setReward(quest.reward || "");
    setVisibility(quest.visibility);
    setStatus(quest.status);
    setShowForm(true);
  }

  function handleSubmit() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const payload: CampaignQuestInput = {
      title: trimmedTitle,
      description: description.trim(),
      reward: reward.trim(),
      visibility,
      status,
    };

    if (editingId && onUpdateQuest) {
      onUpdateQuest(editingId, payload);
    } else if (onCreateQuest) {
      onCreateQuest(payload);
    }
    resetForm();
  }

  function getStatusColor(st: QuestStatus) {
    if (st === "completed") return "#4caf50";
    if (st === "failed") return colors.error;
    return colors.primary;
  }

  const filteredQuests = quests.filter((q) => {
    if (filter === "all") return true;
    return q.status === filter;
  });

  return (
    <View style={styles.container}>
      {/* Cabeçalho da Seção */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <MaterialCommunityIcons name="target" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quadro de Missões (Quests)</Text>
          <View style={[styles.countBadge, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <Text style={[styles.countText, { color: colors.textSecondary }]}>{quests.length}</Text>
          </View>
        </View>

        {isGm && !showForm && (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setShowForm(true)}
            style={[styles.addButton, { backgroundColor: colors.primary }, webPointer]}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.addButtonText}>Nova Missão</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros de Status */}
      <View style={styles.filterRow}>
        {(["all", "active", "completed", "failed"] as const).map((opt) => {
          const isSelected = filter === opt;
          return (
            <TouchableOpacity
              key={opt}
              onPress={() => setFilter(opt)}
              style={[
                styles.filterPill,
                {
                  backgroundColor: isSelected ? colors.primary : colors.inputBg,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
                webPointer,
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  { color: isSelected ? "#fff" : colors.textSecondary },
                ]}
              >
                {opt === "all" ? "Todas" : STATUS_LABELS[opt]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Formulário do Mestre (Criar / Editar) */}
      {isGm && showForm && (
        <View style={[styles.formCard, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Text style={[styles.formTitle, { color: colors.text }]}>
            {editingId ? "Editar Missão" : "Criar Nova Missão"}
          </Text>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Título da Missão</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ex: Investigar o Covil dos Goblins"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          />

          <View style={styles.formRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Visibilidade</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  onPress={() => setVisibility("party")}
                  style={[
                    styles.toggleBtn,
                    {
                      backgroundColor: visibility === "party" ? "rgba(3, 218, 198, 0.2)" : colors.surface,
                      borderColor: visibility === "party" ? (colors.secondary || colors.info) : colors.border,
                    },
                    webPointer,
                  ]}
                >
                  <Ionicons name="people-outline" size={14} color={visibility === "party" ? (colors.secondary || colors.info) : colors.textSecondary} />
                  <Text style={[styles.toggleBtnText, { color: visibility === "party" ? (colors.secondary || colors.info) : colors.textSecondary }]}>
                    Pública (Grupo)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setVisibility("gm")}
                  style={[
                    styles.toggleBtn,
                    {
                      backgroundColor: visibility === "gm" ? "rgba(187, 134, 252, 0.2)" : colors.surface,
                      borderColor: visibility === "gm" ? colors.primary : colors.border,
                    },
                    webPointer,
                  ]}
                >
                  <Ionicons name="eye-off-outline" size={14} color={visibility === "gm" ? colors.primary : colors.textSecondary} />
                  <Text style={[styles.toggleBtnText, { color: visibility === "gm" ? colors.primary : colors.textSecondary }]}>
                    Secreta (Mestre)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ width: 140 }}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Status</Text>
              <View style={styles.statusButtonsRow}>
                {(["active", "completed", "failed"] as QuestStatus[]).map((st) => (
                  <TouchableOpacity
                    key={st}
                    onPress={() => setStatus(st)}
                    style={[
                      styles.statusSelectPill,
                      {
                        backgroundColor: status === st ? getStatusColor(st) : colors.surface,
                        borderColor: colors.border,
                      },
                      webPointer,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusSelectText,
                        { color: status === st ? "#fff" : colors.textSecondary },
                      ]}
                    >
                      {st === "active" ? "Ativ" : st === "completed" ? "Conc" : "Falh"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Descrição do Objetivo</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Detalhes da missão, pistas e exigências para o grupo..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
            style={[
              styles.input,
              styles.textArea,
              { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
            ]}
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Recompensa (Ouro, Itens, XP)</Text>
          <TextInput
            value={reward}
            onChangeText={setReward}
            placeholder="Ex: 50 moedas de prata + 250 XP"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          />

          <View style={styles.formActions}>
            <TouchableOpacity
              onPress={resetForm}
              style={[styles.secondaryButton, { borderColor: colors.border }, webPointer]}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={busy || !title.trim()}
              onPress={handleSubmit}
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary, opacity: busy || !title.trim() ? 0.5 : 1 },
                webPointer,
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {editingId ? "Salvar Alterações" : "Criar Missão"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Lista de Quests */}
      {filteredQuests.length === 0 ? (
        <View style={[styles.emptyContainer, { borderColor: colors.border }]}>
          <MaterialCommunityIcons name="flag-checkered" size={36} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Nenhuma missão encontrada neste filtro.
          </Text>
        </View>
      ) : (
        <View style={styles.questList}>
          {filteredQuests.map((quest) => {
            const stColor = getStatusColor(quest.status);
            const isSecret = quest.visibility === "gm";
            return (
              <View
                key={quest.id}
                style={[
                  styles.questCard,
                  { backgroundColor: colors.inputBg, borderColor: colors.border },
                ]}
              >
                <View style={styles.questHeaderRow}>
                  <View style={styles.questTitleGroup}>
                    <Text style={[styles.questTitle, { color: colors.text }]}>{quest.title}</Text>
                    <View style={styles.questBadges}>
                      <View style={[styles.statusPill, { backgroundColor: `${stColor}20`, borderColor: stColor }]}>
                        <Text style={[styles.statusPillText, { color: stColor }]}>
                          {STATUS_LABELS[quest.status]}
                        </Text>
                      </View>
                      {isSecret && (
                        <View style={[styles.visibilityBadge, { backgroundColor: "rgba(187, 134, 252, 0.15)" }]}>
                          <Ionicons name="eye-off-outline" size={12} color={colors.primary} />
                          <Text style={[styles.visibilityBadgeText, { color: colors.primary }]}>
                            Secreta
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {isGm && (
                    <View style={styles.actionIcons}>
                      {quest.status === "active" && onUpdateQuest && (
                        <TouchableOpacity
                          accessibilityLabel="Marcar como concluída"
                          onPress={() => onUpdateQuest(quest.id, { ...quest, status: "completed" })}
                          style={[styles.iconBtn, webPointer]}
                        >
                          <Ionicons name="checkmark-circle-outline" size={18} color="#4caf50" />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        accessibilityLabel="Editar missão"
                        onPress={() => handleStartEdit(quest)}
                        style={[styles.iconBtn, webPointer]}
                      >
                        <Ionicons name="pencil-outline" size={16} color={colors.primary} />
                      </TouchableOpacity>
                      {onDeleteQuest && (
                        <TouchableOpacity
                          accessibilityLabel="Excluir missão"
                          onPress={() => onDeleteQuest(quest.id)}
                          style={[styles.iconBtn, webPointer]}
                        >
                          <Ionicons name="trash-outline" size={16} color={colors.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>

                {quest.description ? (
                  <Text style={[styles.questDescription, { color: colors.textSecondary }]}>
                    {quest.description}
                  </Text>
                ) : null}

                {quest.reward ? (
                  <View style={styles.rewardRow}>
                    <MaterialCommunityIcons name="gift-outline" size={16} color="#ffd700" />
                    <Text style={[styles.rewardText, { color: colors.text }]}>
                      Recompensa: <Text style={{ fontWeight: "bold" }}>{quest.reward}</Text>
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  formCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 12,
  },
  formRow: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 10,
  },
  toggleRow: {
    flexDirection: "row",
    gap: 6,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: "top",
    marginBottom: 10,
  },
  statusButtonsRow: {
    flexDirection: "row",
    gap: 4,
  },
  statusSelectPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
  },
  statusSelectText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 12,
  },
  secondaryButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  primaryButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
  },
  emptyContainer: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 13,
    marginTop: 8,
  },
  questList: {
    gap: 10,
  },
  questCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  questHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  questTitleGroup: {
    flex: 1,
  },
  questTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },
  questBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "600",
  },
  visibilityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  visibilityBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  actionIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconBtn: {
    padding: 4,
  },
  questDescription: {
    fontSize: 12,
    marginTop: 8,
    lineHeight: 18,
  },
  rewardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  rewardText: {
    fontSize: 12,
  },
});
