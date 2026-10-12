import { ThemeColors } from "@/constants/theme";
import {
  CampaignEncounter,
  CampaignEncounterInput,
  CampaignEncounterMonster,
  EncounterStatus,
} from "@/services/campaignApi";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface CampaignEncountersProps {
  colors: ThemeColors;
  encounters: CampaignEncounter[];
  busy?: boolean;
  onCreateEncounter?: (encounter: CampaignEncounterInput) => void;
  onUpdateEncounter?: (encounterId: string, encounter: CampaignEncounterInput) => void;
  onDeleteEncounter?: (encounterId: string) => void;
  onLaunchEncounter?: (encounterId: string) => void;
}

const webPointer = Platform.OS === "web" ? ({ cursor: "pointer" } as const) : {};

const STATUS_LABELS: Record<EncounterStatus, string> = {
  planned: "Planejado",
  ready: "Pronto para Combate",
  completed: "Concluído",
};

export function CampaignEncounters({
  colors,
  encounters,
  busy = false,
  onCreateEncounter,
  onUpdateEncounter,
  onDeleteEncounter,
  onLaunchEncounter,
}: CampaignEncountersProps) {
  const [filter, setFilter] = useState<"all" | EncounterStatus>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tactics, setTactics] = useState("");
  const [rewards, setRewards] = useState("");
  const [status, setStatus] = useState<EncounterStatus>("planned");
  const [monsters, setMonsters] = useState<CampaignEncounterMonster[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Sub-formulário para adicionar monstro
  const [mName, setMName] = useState("");
  const [mCount, setMCount] = useState("1");
  const [mHp, setMHp] = useState("10");
  const [mAc, setMAc] = useState("10");
  const [mInit, setMInit] = useState("0");

  function resetForm() {
    setEditingId(null);
    setName("");
    setDescription("");
    setTactics("");
    setRewards("");
    setStatus("planned");
    setMonsters([]);
    setMName("");
    setMCount("1");
    setMHp("10");
    setMAc("10");
    setMInit("0");
    setShowForm(false);
  }

  function handleStartEdit(encounter: CampaignEncounter) {
    setEditingId(encounter.id);
    setName(encounter.name);
    setDescription(encounter.description || "");
    setTactics(encounter.tactics || "");
    setRewards(encounter.rewards || "");
    setStatus(encounter.status);
    setMonsters(encounter.monstersData || []);
    setShowForm(true);
  }

  function handleAddMonster() {
    const trimmed = mName.trim();
    if (!trimmed) return;
    const count = Math.max(1, parseInt(mCount, 10) || 1);
    const hp = Math.max(1, parseInt(mHp, 10) || 10);
    const ac = Math.max(0, parseInt(mAc, 10) || 10);
    const initiativeBonus = parseInt(mInit, 10) || 0;

    setMonsters((prev) => [
      ...prev,
      { name: trimmed, count, hp, ac, initiativeBonus },
    ]);
    setMName("");
    setMCount("1");
    setMHp("10");
    setMAc("10");
    setMInit("0");
  }

  function handleRemoveMonster(index: number) {
    setMonsters((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const payload: CampaignEncounterInput = {
      name: trimmedName,
      description: description.trim(),
      tactics: tactics.trim(),
      rewards: rewards.trim(),
      status,
      monstersData: monsters,
    };

    if (editingId && onUpdateEncounter) {
      onUpdateEncounter(editingId, payload);
    } else if (onCreateEncounter) {
      onCreateEncounter(payload);
    }
    resetForm();
  }

  const filtered = encounters.filter((e) => {
    if (filter !== "all" && e.status !== filter) return false;
    return true;
  });

  function getStatusColor(st: EncounterStatus) {
    if (st === "ready") return colors.primary || "#4caf50";
    if (st === "completed") return colors.secondary || "#9c27b0";
    return colors.info || "#2196f3";
  }

  return (
    <View style={styles.container}>
      {/* Barra de Ações & Filtros */}
      <View style={styles.headerRow}>
        <View style={styles.filterGroup}>
          <TouchableOpacity
            onPress={() => setFilter("all")}
            style={[
              styles.filterChip,
              filter === "all" && { backgroundColor: colors.primary },
              webPointer,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === "all" ? "#fff" : colors.text },
              ]}
            >
              Todos ({encounters.length})
            </Text>
          </TouchableOpacity>
          {(["planned", "ready", "completed"] as EncounterStatus[]).map((st) => {
            const count = encounters.filter((e) => e.status === st).length;
            const active = filter === st;
            return (
              <TouchableOpacity
                key={st}
                onPress={() => setFilter(st)}
                style={[
                  styles.filterChip,
                  active && { backgroundColor: getStatusColor(st) },
                  webPointer,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: active ? "#fff" : colors.text },
                  ]}
                >
                  {STATUS_LABELS[st]} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {!showForm && onCreateEncounter && (
          <TouchableOpacity
            disabled={busy}
            onPress={() => {
              resetForm();
              setShowForm(true);
            }}
            style={[
              styles.createButton,
              { backgroundColor: colors.primary },
              webPointer,
            ]}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.createButtonText}>Novo Encontro</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Formulário de Criação/Edição */}
      {showForm && (
        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.formTitle, { color: colors.text }]}>
            {editingId ? "Editar Encontro" : "Criar Novo Encontro de Combate"}
          </Text>

          <TextInput
            placeholder="Nome do Encontro (ex: Emboscada dos Goblins no Desfiladeiro)"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />

          <View style={styles.statusRow}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Status:</Text>
            {(["planned", "ready", "completed"] as EncounterStatus[]).map((st) => (
              <TouchableOpacity
                key={st}
                onPress={() => setStatus(st)}
                style={[
                  styles.statusOption,
                  status === st && { backgroundColor: getStatusColor(st) },
                  webPointer,
                ]}
              >
                <Text style={{ color: status === st ? "#fff" : colors.text, fontSize: 12, fontWeight: "600" }}>
                  {STATUS_LABELS[st]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            placeholder="Descrição ou contexto narrativo..."
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border }]}
          />

          <TextInput
            placeholder="Táticas e posicionamento do mestre..."
            placeholderTextColor={colors.textSecondary}
            value={tactics}
            onChangeText={setTactics}
            multiline
            style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border }]}
          />

          <TextInput
            placeholder="Recompensas previstas (XP, Loot, Ouro)..."
            placeholderTextColor={colors.textSecondary}
            value={rewards}
            onChangeText={setRewards}
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />

          {/* Adicionar Monstros ao Encontro */}
          <View style={[styles.monsterSection, { borderColor: colors.border }]}>
            <Text style={[styles.sectionSubtitle, { color: colors.text }]}>
              Monstros / Inimigos do Encontro
            </Text>

            {monsters.length > 0 && (
              <View style={styles.monsterList}>
                {monsters.map((m, idx) => (
                  <View key={idx} style={[styles.monsterChip, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.monsterChipText, { color: colors.text }]}>
                      {m.count}x <Text style={{ fontWeight: "bold" }}>{m.name}</Text> (HP: {m.hp}, CA: {m.ac}, Init: +{m.initiativeBonus})
                    </Text>
                    <TouchableOpacity onPress={() => handleRemoveMonster(idx)} style={webPointer}>
                      <Ionicons name="close-circle" size={18} color={colors.error || "#e53935"} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.addMonsterRow}>
              <TextInput
                placeholder="Nome (ex: Goblin)"
                placeholderTextColor={colors.textSecondary}
                value={mName}
                onChangeText={setMName}
                style={[styles.inputSmall, { flex: 2, color: colors.text, borderColor: colors.border }]}
              />
              <TextInput
                placeholder="Qtd"
                placeholderTextColor={colors.textSecondary}
                value={mCount}
                onChangeText={setMCount}
                keyboardType="numeric"
                style={[styles.inputSmall, { flex: 1, color: colors.text, borderColor: colors.border }]}
              />
              <TextInput
                placeholder="HP"
                placeholderTextColor={colors.textSecondary}
                value={mHp}
                onChangeText={setMHp}
                keyboardType="numeric"
                style={[styles.inputSmall, { flex: 1, color: colors.text, borderColor: colors.border }]}
              />
              <TextInput
                placeholder="CA"
                placeholderTextColor={colors.textSecondary}
                value={mAc}
                onChangeText={setMAc}
                keyboardType="numeric"
                style={[styles.inputSmall, { flex: 1, color: colors.text, borderColor: colors.border }]}
              />
              <TextInput
                placeholder="Init"
                placeholderTextColor={colors.textSecondary}
                value={mInit}
                onChangeText={setMInit}
                keyboardType="numeric"
                style={[styles.inputSmall, { flex: 1, color: colors.text, borderColor: colors.border }]}
              />
              <TouchableOpacity
                onPress={handleAddMonster}
                style={[styles.addMonsterBtn, { backgroundColor: colors.primary }, webPointer]}
              >
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "600", fontSize: 12 }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

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
                {editingId ? "Salvar Alterações" : "Criar Encontro"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Lista de Encontros */}
      {filtered.length === 0 ? (
        <View style={[styles.emptyContainer, { borderColor: colors.border }]}>
          <MaterialCommunityIcons name="sword-cross" size={40} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Nenhum encontro pré-montado encontrado neste filtro.
          </Text>
        </View>
      ) : (
        <View style={styles.cardsGrid}>
          {filtered.map((encounter) => {
            const totalMonsters = (encounter.monstersData || []).reduce((acc, m) => acc + (m.count || 1), 0);
            return (
              <View
                key={encounter.id}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{encounter.name}</Text>
                    <View style={styles.badgeRow}>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(encounter.status) + "22", borderColor: getStatusColor(encounter.status) },
                        ]}
                      >
                        <Text style={[styles.badgeText, { color: getStatusColor(encounter.status) }]}>
                          {STATUS_LABELS[encounter.status]}
                        </Text>
                      </View>
                      <View style={[styles.countBadge, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <Ionicons name="skull-outline" size={12} color={colors.textSecondary} />
                        <Text style={{ fontSize: 11, color: colors.textSecondary, marginLeft: 4 }}>
                          {totalMonsters} combatente(s)
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {!!encounter.description && (
                  <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                    {encounter.description}
                  </Text>
                )}

                {!!encounter.tactics && (
                  <View style={[styles.metaSection, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.metaTitle, { color: colors.info || colors.primary }]}>
                      🧠 Táticas de Combate:
                    </Text>
                    <Text style={[styles.metaBody, { color: colors.text }]}>{encounter.tactics}</Text>
                  </View>
                )}

                {/* Monstros do Encontro */}
                {encounter.monstersData && encounter.monstersData.length > 0 && (
                  <View style={styles.monstersDisplay}>
                    <Text style={[styles.monstersDisplayTitle, { color: colors.textSecondary }]}>
                      Inimigos Preparados:
                    </Text>
                    <View style={styles.monsterChipsWrap}>
                      {encounter.monstersData.map((m, mIdx) => (
                        <View
                          key={mIdx}
                          style={[styles.monsterTag, { backgroundColor: colors.background, borderColor: colors.border }]}
                        >
                          <Text style={{ fontSize: 12, color: colors.text, fontWeight: "600" }}>
                            {m.count}x {m.name}
                          </Text>
                          <Text style={{ fontSize: 10, color: colors.textSecondary }}>
                            HP {m.hp} • CA {m.ac} • +{m.initiativeBonus || 0} init
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {!!encounter.rewards && (
                  <View style={styles.rewardRow}>
                    <Ionicons name="trophy-outline" size={14} color="#ffd700" />
                    <Text style={[styles.rewardText, { color: colors.text }]}>
                      {encounter.rewards}
                    </Text>
                  </View>
                )}

                {/* Ações do Mestre */}
                <View style={styles.cardActions}>
                  {onLaunchEncounter && (
                    <TouchableOpacity
                      disabled={busy}
                      onPress={() => onLaunchEncounter(encounter.id)}
                      style={[
                        styles.launchButton,
                        { backgroundColor: colors.error || "#d32f2f" },
                        webPointer,
                      ]}
                    >
                      <MaterialCommunityIcons name="sword-cross" size={16} color="#fff" />
                      <Text style={styles.launchButtonText}>Lançar no Combate</Text>
                    </TouchableOpacity>
                  )}

                  <View style={styles.secondaryActions}>
                    {onUpdateEncounter && (
                      <TouchableOpacity
                        disabled={busy}
                        onPress={() => handleStartEdit(encounter)}
                        style={[styles.iconBtn, { borderColor: colors.border }, webPointer]}
                      >
                        <Ionicons name="pencil" size={16} color={colors.primary} />
                      </TouchableOpacity>
                    )}
                    {onDeleteEncounter && (
                      <TouchableOpacity
                        disabled={busy}
                        onPress={() => onDeleteEncounter(encounter.id)}
                        style={[styles.iconBtn, { borderColor: colors.border }, webPointer]}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.error || "#e53935"} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
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
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  statusOption: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: "rgba(128,128,128,0.12)",
  },
  monsterSection: {
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: "bold",
  },
  monsterList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  monsterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  monsterChipText: {
    fontSize: 12,
  },
  addMonsterRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  inputSmall: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
  },
  addMonsterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
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
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  metaSection: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  metaTitle: {
    fontSize: 12,
    fontWeight: "bold",
  },
  metaBody: {
    fontSize: 12,
    lineHeight: 16,
  },
  monstersDisplay: {
    gap: 6,
  },
  monstersDisplayTitle: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  monsterChipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  monsterTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    gap: 2,
  },
  rewardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rewardText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(128,128,128,0.12)",
    paddingTop: 10,
    marginTop: 4,
  },
  launchButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  launchButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
  secondaryActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
});
