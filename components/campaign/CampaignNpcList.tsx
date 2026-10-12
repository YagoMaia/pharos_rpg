import { ThemeColors } from "@/constants/theme";
import { CampaignNpc, CampaignNpcInput, NpcAttitude, NpcVisibility } from "@/services/campaignApi";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface CampaignNpcListProps {
  colors: ThemeColors;
  npcs: CampaignNpc[];
  isGm: boolean;
  busy?: boolean;
  onCreateNpc?: (npc: CampaignNpcInput) => void;
  onUpdateNpc?: (npcId: string, npc: CampaignNpcInput) => void;
  onDeleteNpc?: (npcId: string) => void;
}

const webPointer = Platform.OS === "web" ? ({ cursor: "pointer" } as const) : {};

const ATTITUDE_LABELS: Record<NpcAttitude, string> = {
  friendly: "Aliado",
  neutral: "Neutro",
  hostile: "Hostil",
  unknown: "Incógnito",
};

export function CampaignNpcList({
  colors,
  npcs,
  isGm,
  busy = false,
  onCreateNpc,
  onUpdateNpc,
  onDeleteNpc,
}: CampaignNpcListProps) {
  const [attitudeFilter, setAttitudeFilter] = useState<"all" | NpcAttitude>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [attitude, setAttitude] = useState<NpcAttitude>("neutral");
  const [description, setDescription] = useState("");
  const [gmNotes, setGmNotes] = useState("");
  const [visibility, setVisibility] = useState<NpcVisibility>("party");
  const [showForm, setShowForm] = useState(false);

  function resetForm() {
    setEditingId(null);
    setName("");
    setRole("");
    setAttitude("neutral");
    setDescription("");
    setGmNotes("");
    setVisibility("party");
    setShowForm(false);
  }

  function handleStartEdit(npc: CampaignNpc) {
    setEditingId(npc.id);
    setName(npc.name);
    setRole(npc.role || "");
    setAttitude(npc.attitude);
    setDescription(npc.description || "");
    setGmNotes(npc.gmNotes || "");
    setVisibility(npc.visibility);
    setShowForm(true);
  }

  function handleQuickReveal(npc: CampaignNpc) {
    if (!onUpdateNpc) return;
    onUpdateNpc(npc.id, {
      name: npc.name,
      role: npc.role,
      attitude: npc.attitude,
      description: npc.description,
      gmNotes: npc.gmNotes,
      visibility: "party",
    });
  }

  function handleSubmit() {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const payload: CampaignNpcInput = {
      name: trimmedName,
      role: role.trim(),
      attitude,
      description: description.trim(),
      gmNotes: gmNotes.trim(),
      visibility,
    };

    if (editingId && onUpdateNpc) {
      onUpdateNpc(editingId, payload);
    } else if (onCreateNpc) {
      onCreateNpc(payload);
    }
    resetForm();
  }

  const filtered = npcs.filter((npc) => {
    if (attitudeFilter !== "all" && npc.attitude !== attitudeFilter) return false;
    return true;
  });

  function getAttitudeColor(att: NpcAttitude) {
    if (att === "friendly") return colors.primary || "#4caf50";
    if (att === "hostile") return colors.error || "#f44336";
    if (att === "unknown") return colors.secondary || "#9c27b0";
    return colors.info || "#ff9800";
  }

  return (
    <View style={styles.container}>
      {/* Header & Filtros */}
      <View style={styles.headerRow}>
        <View style={styles.filterGroup}>
          <TouchableOpacity
            onPress={() => setAttitudeFilter("all")}
            style={[
              styles.filterChip,
              attitudeFilter === "all" && { backgroundColor: colors.primary },
              webPointer,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                { color: attitudeFilter === "all" ? "#fff" : colors.text },
              ]}
            >
              Todos ({npcs.length})
            </Text>
          </TouchableOpacity>
          {(["friendly", "neutral", "hostile", "unknown"] as NpcAttitude[]).map((att) => {
            const count = npcs.filter((n) => n.attitude === att).length;
            const active = attitudeFilter === att;
            return (
              <TouchableOpacity
                key={att}
                onPress={() => setAttitudeFilter(att)}
                style={[
                  styles.filterChip,
                  active && { backgroundColor: getAttitudeColor(att) },
                  webPointer,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: active ? "#fff" : colors.text },
                  ]}
                >
                  {ATTITUDE_LABELS[att]} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isGm && !showForm && onCreateNpc && (
          <TouchableOpacity
            disabled={busy}
            onPress={() => {
              resetForm();
              setShowForm(true);
            }}
            style={[styles.createButton, { backgroundColor: colors.primary }, webPointer]}
          >
            <Ionicons name="person-add" size={16} color="#fff" />
            <Text style={styles.createButtonText}>Novo NPC</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Formulário (GM apenas) */}
      {isGm && showForm && (
        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.formTitle, { color: colors.text }]}>
            {editingId ? "Editar NPC" : "Cadastrar Novo Personagem do Mundo"}
          </Text>

          <TextInput
            placeholder="Nome do NPC (ex: Brumo, o Taberneiro)"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />

          <TextInput
            placeholder="Papel / Título (ex: Dono da Taverna do Javali, Capitão da Guarda)"
            placeholderTextColor={colors.textSecondary}
            value={role}
            onChangeText={setRole}
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />

          {/* Atitude */}
          <View style={styles.optionRow}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Atitude:</Text>
            {(["friendly", "neutral", "hostile", "unknown"] as NpcAttitude[]).map((att) => (
              <TouchableOpacity
                key={att}
                onPress={() => setAttitude(att)}
                style={[
                  styles.optionChip,
                  attitude === att && { backgroundColor: getAttitudeColor(att) },
                  webPointer,
                ]}
              >
                <Text style={{ color: attitude === att ? "#fff" : colors.text, fontSize: 12, fontWeight: "600" }}>
                  {ATTITUDE_LABELS[att]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Visibilidade */}
          <View style={styles.optionRow}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Visibilidade:</Text>
            <TouchableOpacity
              onPress={() => setVisibility("party")}
              style={[
                styles.optionChip,
                visibility === "party" && { backgroundColor: colors.primary },
                webPointer,
              ]}
            >
              <Text style={{ color: visibility === "party" ? "#fff" : colors.text, fontSize: 12, fontWeight: "600" }}>
                👁️ Conhecido pela Party
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setVisibility("gm")}
              style={[
                styles.optionChip,
                visibility === "gm" && { backgroundColor: colors.secondary || "#9c27b0" },
                webPointer,
              ]}
            >
              <Text style={{ color: visibility === "gm" ? "#fff" : colors.text, fontSize: 12, fontWeight: "600" }}>
                🔒 Segredo do Mestre
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            placeholder="Aparência e informações conhecidas..."
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border }]}
          />

          <TextInput
            placeholder="Segredos, fraquezas e notas do mestre (nunca reveladas aos jogadores)..."
            placeholderTextColor={colors.textSecondary}
            value={gmNotes}
            onChangeText={setGmNotes}
            multiline
            style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border }]}
          />

          <View style={styles.formButtonRow}>
            <TouchableOpacity
              onPress={resetForm}
              style={[styles.cancelBtn, { borderColor: colors.border }, webPointer]}
            >
              <Text style={{ color: colors.textSecondary }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={busy || !name.trim()}
              onPress={handleSubmit}
              style={[
                styles.saveBtn,
                { backgroundColor: colors.primary, opacity: !name.trim() || busy ? 0.6 : 1 },
                webPointer,
              ]}
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>
                {editingId ? "Salvar Alterações" : "Salvar NPC"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Lista de NPCs */}
      {filtered.length === 0 ? (
        <View style={[styles.emptyContainer, { borderColor: colors.border }]}>
          <MaterialCommunityIcons name="account-group" size={40} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Nenhum personagem registrado nesta categoria.
          </Text>
        </View>
      ) : (
        <View style={styles.cardsGrid}>
          {filtered.map((npc) => (
            <View
              key={npc.id}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{npc.name}</Text>
                  {!!npc.role && (
                    <Text style={[styles.cardRole, { color: colors.primary }]}>{npc.role}</Text>
                  )}
                </View>
                <View style={styles.badgesCol}>
                  <View
                    style={[
                      styles.attitudeBadge,
                      {
                        backgroundColor: getAttitudeColor(npc.attitude) + "22",
                        borderColor: getAttitudeColor(npc.attitude),
                      },
                    ]}
                  >
                    <Text style={[styles.attitudeBadgeText, { color: getAttitudeColor(npc.attitude) }]}>
                      {ATTITUDE_LABELS[npc.attitude]}
                    </Text>
                  </View>
                  {isGm && (
                    <View
                      style={[
                        styles.visibilityBadge,
                        {
                          backgroundColor: npc.visibility === "party" ? "rgba(76,175,80,0.12)" : "rgba(156,39,176,0.12)",
                          borderColor: npc.visibility === "party" ? "#4caf50" : "#9c27b0",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.visibilityBadgeText,
                          { color: npc.visibility === "party" ? "#4caf50" : "#9c27b0" },
                        ]}
                      >
                        {npc.visibility === "party" ? "👁️ Party" : "🔒 GM"}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {!!npc.description && (
                <Text style={[styles.description, { color: colors.textSecondary }]}>
                  {npc.description}
                </Text>
              )}

              {/* Notas Confidenciais do GM */}
              {isGm && !!npc.gmNotes && (
                <View style={[styles.secretBox, { backgroundColor: "rgba(229,57,53,0.06)", borderColor: colors.error || "#e53935" }]}>
                  <View style={styles.secretHeader}>
                    <Ionicons name="lock-closed" size={12} color={colors.error || "#e53935"} />
                    <Text style={[styles.secretTitle, { color: colors.error || "#e53935" }]}>
                      Segredos do Mestre:
                    </Text>
                  </View>
                  <Text style={[styles.secretBody, { color: colors.text }]}>{npc.gmNotes}</Text>
                </View>
              )}

              {/* Ações (GM apenas) */}
              {isGm && (
                <View style={styles.cardActions}>
                  {npc.visibility === "gm" && onUpdateNpc && (
                    <TouchableOpacity
                      disabled={busy}
                      onPress={() => handleQuickReveal(npc)}
                      style={[styles.revealBtn, { borderColor: colors.primary }, webPointer]}
                    >
                      <Ionicons name="eye-outline" size={14} color={colors.primary} />
                      <Text style={[styles.revealBtnText, { color: colors.primary }]}>
                        Revelar para a Party
                      </Text>
                    </TouchableOpacity>
                  )}

                  <View style={{ flex: 1 }} />

                  <View style={styles.actionButtons}>
                    {onUpdateNpc && (
                      <TouchableOpacity
                        disabled={busy}
                        onPress={() => handleStartEdit(npc)}
                        style={[styles.iconBtn, { borderColor: colors.border }, webPointer]}
                      >
                        <Ionicons name="pencil" size={16} color={colors.primary} />
                      </TouchableOpacity>
                    )}
                    {onDeleteNpc && (
                      <TouchableOpacity
                        disabled={busy}
                        onPress={() => onDeleteNpc(npc.id)}
                        style={[styles.iconBtn, { borderColor: colors.border }, webPointer]}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.error || "#e53935"} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  headerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  filterGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(128,128,128,0.12)",
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
  formCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  optionChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: "rgba(128,128,128,0.12)",
  },
  formButtonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 12,
    borderStyle: "dashed",
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  cardsGrid: {
    gap: 12,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  cardRole: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  badgesCol: {
    alignItems: "flex-end",
    gap: 4,
  },
  attitudeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  attitudeBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  visibilityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  visibilityBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  secretBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    marginTop: 4,
  },
  secretHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  secretTitle: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  secretBody: {
    fontSize: 12,
    lineHeight: 16,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(128,128,128,0.12)",
    paddingTop: 10,
    marginTop: 4,
  },
  revealBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  revealBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
});
