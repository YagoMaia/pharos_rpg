import { useCampaign } from "@/context/CampaignContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAlert } from "@/context/AlertContext";

import { useTheme } from "@/context/ThemeContext";
import { useWebSocket } from "@/context/WebSocketContext";
import { Combatant, Skill } from "@/types/rpg";

// --- HELPERS ---
const getActionKey = (
  actionString?: string
): "standard" | "bonus" | "reaction" | null => {
  if (!actionString) return null;
  const lower = actionString.toLowerCase();
  if (lower.includes("bônus") || lower.includes("bonus")) return "bonus";
  if (lower.includes("reação") || lower.includes("reacao")) return "reaction";
  return "standard";
};

interface Props {
  combatant: Combatant;
  isGm?: boolean; // Flag para saber se é o mestre controlando
}

export const ActiveTurnInterface = ({ combatant, isGm = false }: Props) => {
  const { updateCombatant } = useCampaign();
  const { sendMessage } = useWebSocket();
  const { showAlert } = useAlert();
  const { colors } = useTheme();

  const actions = combatant.turnActions || {
    standard: true,
    bonus: true,
    reaction: true,
  };

  const styles = useMemo(() => getStyles(colors), [colors]);

  // Cálculos
  const activeStance = combatant.stances?.find(
    (s: any) => s.id === combatant.activeStanceId
  );
  const stanceBonus = activeStance?.acBonus || 0;
  const totalAC = (combatant.armorClass || 10) + stanceBonus;

  const hpPercent = Math.min(
    100,
    (combatant.hp.current / combatant.hp.max) * 100
  );
  const focusPercent = Math.min(
    100,
    (combatant.currentFocus / combatant.maxFocus) * 100
  );

  // --- HANDLERS ---
  const handleUseSkill = (skill: Skill) => {
    if (combatant.currentFocus < skill.cost) {
      showAlert("Sem Foco", "Foco insuficiente.");
      return;
    }
    const actionKey = getActionKey(skill.actionType);
    if (actionKey && !actions[actionKey]) {
      showAlert(
        "Ação Indisponível",
        `Você já gastou sua ${skill.actionType || "ação"}.`
      );
      return;
    }

    // Update Local
    updateCombatant(
      combatant.id,
      "currentFocus",
      combatant.currentFocus - skill.cost
    );
    let newActions = { ...actions };
    if (actionKey) {
      newActions[actionKey] = false;
      updateCombatant(combatant.id, "turnActions", newActions);
    }

    // Send to Server
    // sendMessage("RESOLVE_ACTION", {
    //   characterId: combatant.id,
    //   action_type: "USE_SKILL",
    //   payload: {
    //     skill_name: skill.name,
    //     cost: skill.cost,
    //     action_key: actionKey,
    //   },
    // });
    sendMessage("RESOLVE_ACTION", {
      combatantId: combatant.id,
      skillId: skill.id,
    });

    showAlert("Sucesso", `Usou ${skill.name}`);
  };

  const handleToggleAction = (type: "standard" | "bonus" | "reaction") => {
    const newVal = !actions[type];
    const newActions = { ...actions, [type]: newVal };
    updateCombatant(combatant.id, "turnActions", newActions);

    sendMessage("PLAYER_ACTION", {
      character_id: combatant.id,
      action_type: "TOGGLE_ACTION",
      payload: { action_key: type, value: newVal },
    });
  };

  const handleEndTurn = () => {
    sendMessage("END_TURN", { character_id: combatant.id });
  };

  return (
    <ScrollView style={{ flex: 1 }}>
      {/* --- HUD DE COMBATE (LAYOUT NOVO) --- */}
      <View style={styles.combatHud}>
        {/* LINHA DE CIMA: VIDA (Esq) + CA (Dir) */}
        <View style={styles.topRow}>
          {/* Vida */}
          <View style={styles.healthContainer}>
            <View style={styles.resourceHeader}>
              <View style={styles.labelGroup}>
                <Ionicons
                  name="heart"
                  size={14}
                  color={colors.hp || "#ef5350"}
                />
                <Text style={styles.hudLabel}>VIDA</Text>
              </View>
              <Text style={styles.resourceValue}>
                <Text
                  style={[
                    styles.resourceCurrent,
                    { color: colors.hp || "#ef5350" },
                  ]}
                >
                  {combatant.hp.current}
                </Text>
                <Text style={styles.resourceMax}>/{combatant.hp.max}</Text>
              </Text>
            </View>
            <View style={styles.barBackground}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${hpPercent}%`,
                    backgroundColor: colors.hp || "#ef5350",
                  },
                ]}
              />
            </View>
          </View>

          {/* Separador */}
          <View style={styles.verticalSeparator} />

          {/* Defesa */}
          <View style={styles.acContainer}>
            <View style={styles.labelGroup}>
              <MaterialCommunityIcons
                name="shield"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.hudLabel}>DEFESA</Text>
            </View>
            <View style={styles.acValueContainer}>
              <Text style={styles.acTotal}>{totalAC}</Text>
              {stanceBonus !== 0 && (
                <View
                  style={[
                    styles.modBadge,
                    {
                      borderColor:
                        stanceBonus > 0 ? colors.success : colors.error,
                    },
                  ]}
                >
                  <Ionicons
                    name={stanceBonus > 0 ? "arrow-up" : "arrow-down"}
                    size={10}
                    color={stanceBonus > 0 ? colors.success : colors.error}
                  />
                </View>
              )}
            </View>
          </View>
        </View>

        {/* LINHA DE BAIXO: FOCO */}
        <View style={styles.bottomRow}>
          <View style={styles.resourceHeader}>
            <View style={styles.labelGroup}>
              <Ionicons name="flash" size={14} color={colors.focus} />
              <Text style={styles.hudLabel}>FOCO</Text>
            </View>
            <Text style={styles.resourceValue}>
              <Text style={[styles.resourceCurrent, { color: colors.focus }]}>
                {combatant.currentFocus}
              </Text>
              <Text style={styles.resourceMax}>/{combatant.maxFocus}</Text>
            </Text>
          </View>
          <View style={styles.barBackground}>
            <View
              style={[
                styles.barFill,
                { width: `${focusPercent}%`, backgroundColor: colors.focus },
              ]}
            />
          </View>
        </View>
      </View>

      {/* --- RASTREADOR DE AÇÕES --- */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Ações do Turno</Text>
        <View style={styles.actionsRow}>
          {["standard", "bonus", "reaction"].map((type) => {
            const key = type as "standard" | "bonus" | "reaction";
            const isActive = actions[key];
            const color =
              key === "standard"
                ? colors.primary
                : key === "bonus"
                ? "#fb8c00"
                : "#8e24aa";

            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.actionBtn,
                  {
                    backgroundColor: isActive ? color : colors.inputBg,
                    opacity: isActive ? 1 : 0.5,
                  },
                ]}
                onPress={() => handleToggleAction(key)}
              >
                <Text style={styles.actionBtnText}>
                  {key === "standard"
                    ? "Padrão"
                    : key === "bonus"
                    ? "Bônus"
                    : "Reação"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* --- LISTA DE HABILIDADES --- */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Habilidades</Text>
        {combatant.skills?.map((skill: any) => {
          const actionKey = getActionKey(skill.actionType || skill.action);
          const isAvailable = actionKey ? actions[actionKey] : true;
          const hasFocus = combatant.currentFocus >= skill.cost;
          const canUse = isAvailable && hasFocus;

          return (
            <TouchableOpacity
              key={skill.id}
              style={[styles.skillRow, !canUse && { opacity: 0.5 }]}
              disabled={!canUse}
              onPress={() => handleUseSkill(skill)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.skillName}>{skill.name}</Text>
                {skill.actionType && (
                  <Text
                    style={[
                      styles.detailText,
                      {
                        color: colors.primary,
                        fontSize: 10,
                        fontWeight: "bold",
                        marginTop: 5,
                        // padding: 5,
                      },
                    ]}
                  >
                    {skill.actionType.toUpperCase()}
                  </Text>
                )}
                <Text style={styles.detailText}>{skill.description}</Text>
              </View>
              <View style={styles.skillCost}>
                <Text style={{ fontWeight: "bold", color: colors.text }}>
                  {skill.cost} Foco
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* --- BOTÃO ENCERRAR --- */}
      <TouchableOpacity style={styles.endTurnBtnBig} onPress={handleEndTurn}>
        <Text style={styles.endTurnText}>ENCERRAR MEU TURNO</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    // --- HUD ATIVO (NOVO LAYOUT) ---
    combatHud: {
      backgroundColor: colors.surface,
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginBottom: 16,
      borderBottomWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    healthContainer: { flex: 1, marginRight: 16 },
    verticalSeparator: {
      width: 1,
      height: 40,
      backgroundColor: colors.border,
      marginRight: 16,
    },
    acContainer: { alignItems: "center", minWidth: 60 },
    bottomRow: { width: "100%" },

    resourceHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginBottom: 6,
    },
    labelGroup: { flexDirection: "row", alignItems: "center", gap: 6 },
    hudLabel: { fontSize: 11, fontWeight: "bold", color: colors.textSecondary },
    resourceValue: { fontSize: 12, color: colors.textSecondary },
    resourceCurrent: { fontSize: 16, fontWeight: "900" },
    resourceMax: { fontSize: 12, fontWeight: "600", opacity: 0.7 },

    barBackground: {
      height: 10,
      backgroundColor: colors.inputBg,
      borderRadius: 5,
      overflow: "hidden",
    },
    barFill: { height: "100%", borderRadius: 5 },

    acValueContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 2,
    },
    acTotal: {
      fontSize: 28,
      fontWeight: "bold",
      color: colors.text,
      includeFontPadding: false,
    },
    modBadge: {
      width: 18,
      height: 18,
      borderRadius: 9,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
    },

    // --- CONFIG ---
    configCard: {
      backgroundColor: colors.surface,
      padding: 24,
      borderRadius: 16,
      elevation: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    configTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: colors.text,
      marginVertical: 8,
    },
    label: {
      fontSize: 12,
      fontWeight: "bold",
      color: colors.textSecondary,
      marginBottom: 6,
      textTransform: "uppercase",
    },
    input: {
      backgroundColor: colors.inputBg,
      padding: 14,
      borderRadius: 8,
      marginBottom: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      fontSize: 16,
    },
    connectBtn: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 8,
    },
    connectBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

    // --- SECTIONS & GERAL ---
    section: { paddingHorizontal: 16, marginBottom: 20 },
    sectionHeader: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.textSecondary,
      textTransform: "uppercase",
      marginBottom: 10,
    },
    actionsRow: { flexDirection: "row", gap: 10 },
    actionBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: "center" },
    actionBtnText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 11,
      textTransform: "uppercase",
    },
    skillRow: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    skillName: { fontWeight: "bold", color: colors.text, fontSize: 14 },
    detailText: { color: colors.textSecondary, fontSize: 12 },
    skillCost: {
      justifyContent: "center",
      paddingLeft: 10,
      borderLeftWidth: 1,
      borderColor: colors.border,
    },
    endTurnBtnBig: {
      margin: 16,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.success,
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
      borderStyle: "dashed",
    },
    endTurnText: {
      color: colors.success,
      fontWeight: "900",
      fontSize: 16,
      letterSpacing: 1,
    },
    turnBanner: {
      padding: 12,
      paddingHorizontal: 16,
      alignItems: "center",
      borderBottomWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    turnBannerText: { fontWeight: "bold", fontSize: 16, color: colors.text },
    disconnectBtn: { padding: 4 },
    spectatorCard: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      marginBottom: 10,
      borderRadius: 8,
      padding: 10,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    initBadge: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.inputBg,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },
    initText: { fontWeight: "bold", color: colors.text },
    spectatorName: { fontWeight: "bold", fontSize: 16, color: colors.text },
    spectatorStatus: {
      fontSize: 10,
      color: colors.textSecondary,
      marginTop: 2,
      fontStyle: "italic",
    },
    miniBarBg: {
      height: 6,
      backgroundColor: colors.inputBg,
      borderRadius: 3,
      marginTop: 6,
      overflow: "hidden",
    },
    miniBarFill: { height: "100%", borderRadius: 3 },
    empty: { textAlign: "center", marginTop: 50, color: colors.textSecondary },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      padding: 20,
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      elevation: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
      textAlign: "center",
      marginBottom: 8,
    },
    modalSubtitle: {
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 20,
    },
    rollBtn: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      marginBottom: 10,
    },
    rollBtnText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 16,
    },
    modalBtn: {
      padding: 14,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
  });
