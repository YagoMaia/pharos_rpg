import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useAlert } from "@/context/AlertContext";
import { useCampaign } from "@/context/CampaignContext";
import { useTheme } from "@/context/ThemeContext";
import { Combatant, NpcSkill } from "@/types/rpg";

// Função auxiliar para mod
const getMod = (val: number) => Math.floor((val - 10) / 2);
const formatMod = (val: number) => {
  const mod = getMod(val);
  return mod >= 0 ? `+${mod}` : `${mod}`;
};

const CombatantCard = ({ item }: { item: Combatant }) => {
  const [expanded, setExpanded] = useState(false);
  const { removeCombatant, updateCombatant, sortCombat } = useCampaign();

  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { showAlert } = useAlert();

  const activeStance = item.stances?.find((s) => s.id === item.activeStanceId);
  const stanceBonus = activeStance?.acBonus || 0;
  const totalAC = (item.armorClass || 10) + stanceBonus;

  // 2. Lógica de Habilidade
  const handleUseSkill = (skill: NpcSkill) => {
    if (item.currentFocus < skill.cost) {
      showAlert(
        "Sem Foco",
        `${item.name} precisa de ${skill.cost} foco (Tem ${item.currentFocus}).`
      );
      return;
    }

    // Atualiza o foco no contexto
    updateCombatant(item.id, "currentFocus", item.currentFocus - skill.cost);

    showAlert(
      "Habilidade Usada",
      `${item.name} usou ${skill.name}!\n\n${
        skill.description
      }\n\nFoco restante: ${item.currentFocus - skill.cost}`
    );
  };

  return (
    <View
      style={[
        styles.cardContainer,
        item.type === "player" && styles.playerBorder,
      ]}
    >
      {/* CABEÇALHO (Sempre visível) */}
      <TouchableOpacity
        style={styles.mainRow}
        activeOpacity={0.8}
        onPress={() => setExpanded(!expanded)}
      >
        {/* Iniciativa */}
        <View style={styles.initBox}>
          <TextInput
            style={styles.initInput}
            keyboardType="numeric"
            value={String(item.initiative)}
            onChangeText={(t) =>
              updateCombatant(item.id, "initiative", Number(t))
            }
            onBlur={sortCombat}
          />
          <Text style={styles.tinyLabel}>INIT</Text>
        </View>

        {/* Info Principal */}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.name}>{item.name}</Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginTop: 4,
            }}
          >
            <Text style={styles.type}>
              {item.type === "player" ? "JOGADOR" : "NPC"}
            </Text>

            {/* Badge de CA Dinâmica */}
            <View
              style={[
                styles.miniBadge,
                stanceBonus !== 0 && {
                  backgroundColor:
                    stanceBonus > 0 ? colors.primary : colors.error,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="shield"
                size={12}
                color={stanceBonus !== 0 ? "#fff" : colors.textSecondary}
              />
              <Text
                style={[
                  styles.miniBadgeText,
                  stanceBonus !== 0 && { color: "#fff" },
                ]}
              >
                {totalAC}
              </Text>
            </View>

            {/* Badge de Foco */}
            {item.maxFocus > 0 && (
              <View style={styles.miniBadge}>
                <Ionicons name="flash" size={12} color={colors.focus} />
                <Text style={styles.miniBadgeText}>
                  {item.currentFocus}/{item.maxFocus}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Controle de HP */}
        <View style={styles.hpCtrl}>
          <TouchableOpacity
            onPress={() => updateCombatant(item.id, "hp", item.hp.current - 1)}
          >
            <Ionicons name="remove-circle" size={32} color={colors.error} />
          </TouchableOpacity>
          <View style={{ alignItems: "center", minWidth: 40 }}>
            <Text
              style={[
                styles.hpVal,
                item.hp.current === 0 && { color: colors.error },
              ]}
            >
              {item.hp.current}
            </Text>
            <Text style={styles.tinyLabel}>HP</Text>
          </View>
          <TouchableOpacity
            onPress={() => updateCombatant(item.id, "hp", item.hp.current + 1)}
          >
            <Ionicons name="add-circle" size={32} color={colors.success} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
      {/* <--- MUDANÇA CRUCIAL: O Touchable fecha AQUI, antes do expanded */}

      {/* ÁREA EXPANDIDA (Agora é irmã do cabeçalho, não filha) */}
      {expanded && (
        <View
          style={styles.detailsBody}
          // Esses props abaixo não são mais estritamente necessários agora,
          // mas mal não fazem.
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <View style={styles.divider} />

          {/* SELETOR DE POSTURAS */}
          {item.stances && item.stances.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Postura Ativa</Text>
              <View style={styles.stanceContainer}>
                {/* Botão Neutra */}
                <TouchableOpacity
                  onPress={() =>
                    updateCombatant(item.id, "activeStanceId", null)
                  }
                  style={[
                    styles.stanceBtn,
                    !item.activeStanceId && styles.activeStanceBtn,
                  ]}
                >
                  <Text
                    style={[
                      styles.stanceBtnText,
                      !item.activeStanceId && { color: "#fff" },
                    ]}
                  >
                    Neutra
                  </Text>
                </TouchableOpacity>

                {/* Botões das Posturas */}
                {item.stances.map((s) => {
                  const isActive = item.activeStanceId === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      onPress={() =>
                        updateCombatant(item.id, "activeStanceId", s.id)
                      }
                      style={[
                        styles.stanceBtn,
                        isActive && styles.activeStanceBtn,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stanceBtnText,
                          isActive && { color: "#fff" },
                        ]}
                      >
                        {s.name} ({s.acBonus >= 0 ? `+${s.acBonus}` : s.acBonus}
                        )
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {activeStance && (
                <Text style={styles.detailText}>
                  {activeStance.description}
                </Text>
              )}
            </View>
          )}

          {/* LISTA DE HABILIDADES */}
          {item.skills && item.skills.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Habilidades</Text>
              {item.skills.map((skill) => {
                const canUse = item.currentFocus >= skill.cost;
                return (
                  <TouchableOpacity
                    key={skill.id}
                    style={[styles.skillRow, !canUse && { opacity: 0.5 }]}
                    onPress={() => handleUseSkill(skill)}
                    disabled={!canUse}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.skillName}>{skill.name}</Text>
                      <Text style={styles.detailText}>{skill.description}</Text>
                    </View>
                    <View style={styles.skillCost}>
                      <Ionicons name="flash" size={12} color={colors.text} />
                      <Text style={styles.skillCostText}>{skill.cost}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Status Detalhados (Atributos e Foco Manual) */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>FOCO MANUAL</Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
              >
                <TouchableOpacity
                  onPress={() =>
                    updateCombatant(
                      item.id,
                      "currentFocus",
                      Math.max(0, item.currentFocus - 1)
                    )
                  }
                >
                  <Ionicons
                    name="remove-circle-outline"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
                <Text style={styles.statValue}>
                  {item.currentFocus}/{item.maxFocus}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    updateCombatant(
                      item.id,
                      "currentFocus",
                      Math.min(item.maxFocus, item.currentFocus + 1)
                    )
                  }
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {item.attributes && (
            <View style={styles.attrGrid}>
              {Object.entries(item.attributes).map(([key, val]) => (
                <View key={key} style={styles.attrBox}>
                  <Text style={styles.attrLabel}>
                    {key.toUpperCase().slice(0, 3)}
                  </Text>
                  <Text style={styles.attrVal}>{val}</Text>
                  <Text style={styles.attrMod}>{formatMod(val)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Ações / Equipamento (Texto Simples) */}
          {!!item.actions && (
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>
                Ações Básicas / Equipamento
              </Text>
              <Text style={styles.detailText}>{item.actions}</Text>
              {!!item.equipment && (
                <Text style={[styles.detailText, { marginTop: 4 }]}>
                  {item.equipment}
                </Text>
              )}
            </View>
          )}

          {/* Botão de Remover */}
          <TouchableOpacity
            onPress={() => removeCombatant(item.id)}
            style={styles.deleteBtn}
          >
            <Ionicons name="trash-outline" size={18} color={colors.error} />
            <Text style={{ color: colors.error, fontWeight: "bold" }}>
              Remover do Combate
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default function GMCombatScreen() {
  const { combatants, addCombatant, sortCombat, clearCombat } = useCampaign();

  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { showAlert } = useAlert();

  const [modalVisible, setModalVisible] = useState(false);

  // Estados manuais
  const [manualName, setManualName] = useState("");
  const [manualHp, setManualHp] = useState("");
  const [manualInit, setManualInit] = useState("");
  const [manualAc, setManualAc] = useState("");

  const handleAddManual = () => {
    addCombatant(
      manualName || "Inimigo",
      parseInt(manualHp) || 10,
      parseInt(manualInit) || 0,
      "npc",
      { armorClass: parseInt(manualAc) || 10 }
    );
    setModalVisible(false);
    setManualName("");
    setManualInit("");
    setManualHp("");
    setManualAc("");
  };

  // --- CARD DE COMBATENTE ---

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.gmHeader}>
        <Text style={styles.gmTitle}>Turno</Text>
        <View style={{ flexDirection: "row", gap: 15 }}>
          <TouchableOpacity onPress={sortCombat}>
            <Ionicons name="filter" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              showAlert("Limpar", "Remover todos?", [
                { text: "Sim", onPress: clearCombat },
                { text: "Não" },
              ])
            }
          >
            <Ionicons name="trash" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={combatants}
        renderItem={({ item }) => <CombatantCard item={item} />}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={
          <Text style={styles.empty}>Adicione combatentes pelo Bestiário.</Text>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="person-add" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Modal Manual */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Adicionar Rápido</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome"
              placeholderTextColor={colors.textSecondary}
              value={manualName}
              onChangeText={setManualName}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="HP"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={manualHp}
                onChangeText={setManualHp}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Init"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={manualInit}
                onChangeText={setManualInit}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="CA"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={manualAc}
                onChangeText={setManualAc}
              />
            </View>
            <TouchableOpacity onPress={handleAddManual} style={styles.addBtn}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>
                Adicionar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{ marginTop: 10, alignItems: "center" }}
            >
              <Text style={{ color: colors.textSecondary }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    gmHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 16,
      borderBottomWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    gmTitle: { fontSize: 20, fontWeight: "bold", color: colors.text },
    empty: { textAlign: "center", marginTop: 50, color: colors.textSecondary },

    // CARD PRINCIPAL
    cardContainer: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    playerBorder: { borderColor: "#2e7d32", borderWidth: 2 },
    mainRow: { flexDirection: "row", alignItems: "center", padding: 10 },

    // Init Box
    initBox: {
      backgroundColor: colors.inputBg,
      width: 50,
      height: 50,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    initInput: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
      padding: 0,
    },
    tinyLabel: {
      fontSize: 8,
      color: colors.textSecondary,
      fontWeight: "bold",
    },

    // Info Header
    name: { fontSize: 16, fontWeight: "bold", color: colors.text },
    type: { fontSize: 10, color: colors.textSecondary, fontWeight: "bold" },
    miniBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.inputBg,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      gap: 4,
    },
    miniBadgeText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "bold",
    },

    // HP Control
    hpCtrl: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.inputBg,
      borderRadius: 20,
      paddingHorizontal: 5,
    },
    hpVal: { fontSize: 18, fontWeight: "bold", color: colors.text },

    // EXPANDED AREA
    detailsBody: {
      backgroundColor: colors.inputBg + "40",
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    divider: { height: 1, backgroundColor: colors.border, marginBottom: 10 },
    section: { marginBottom: 12 },
    sectionHeader: {
      fontSize: 12,
      fontWeight: "bold",
      color: "#c62828", // Vermelho do Mestre
      textTransform: "uppercase",
      marginBottom: 6,
    },
    detailText: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },

    // Stances
    stanceContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 6,
    },
    stanceBtn: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    activeStanceBtn: {
      backgroundColor: "#c62828", // Ativo Mestre
      borderColor: "#c62828",
    },
    stanceBtnText: {
      fontSize: 12,
      fontWeight: "bold",
      color: colors.textSecondary,
    },

    // Skills
    skillRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      padding: 8,
      borderRadius: 8,
      marginBottom: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    skillName: { fontWeight: "bold", color: colors.text, fontSize: 14 },
    skillCost: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 8,
      borderLeftWidth: 1,
      borderColor: colors.border,
      marginLeft: 8,
    },
    skillCostText: { fontWeight: "bold", fontSize: 14, color: colors.text },

    deleteBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 10,
      backgroundColor: colors.inputBg,
      borderRadius: 8,
      marginTop: 10,
      gap: 8,
    },

    // Stats Row (Focus Manual)
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    statItem: { alignItems: "center", flexDirection: "row", gap: 6 },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "bold",
    },
    statValue: { fontSize: 16, fontWeight: "bold", color: colors.text },

    // Attrs
    attrGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
      backgroundColor: colors.inputBg,
      borderRadius: 8,
      padding: 8,
      marginBottom: 12,
    },
    attrBox: { alignItems: "center", width: 40 },
    attrLabel: { fontSize: 9, fontWeight: "bold", color: colors.textSecondary },
    attrVal: { fontSize: 14, fontWeight: "bold", color: colors.text },
    attrMod: { fontSize: 10, color: colors.textSecondary },

    // Base UI
    fab: {
      position: "absolute",
      bottom: 20,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: "#c62828",
      alignItems: "center",
      justifyContent: "center",
      elevation: 5,
    },
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      padding: 20,
    },
    modal: { backgroundColor: colors.surface, padding: 20, borderRadius: 12 },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 15,
      textAlign: "center",
    },
    input: {
      backgroundColor: colors.inputBg,
      padding: 12,
      borderRadius: 8,
      marginBottom: 10,
      color: colors.text,
    },
    addBtn: {
      backgroundColor: "#c62828",
      padding: 12,
      borderRadius: 8,
      alignItems: "center",
    },
  });
