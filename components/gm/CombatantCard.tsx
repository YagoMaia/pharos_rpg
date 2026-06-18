import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useAlert } from "@/context/AlertContext";
import { useCampaign } from "@/context/CampaignContext";
import { useTheme } from "@/context/ThemeContext";
import { Combatant, Skill } from "@/types/rpg";
import { AvatarPortrait } from "@/components/ui/AvatarPortrait";
import { formatMod, getActionKey } from "@/utils/rpgUtils";

export const CombatantCard = ({ item }: { item: Combatant }) => {
  const [expanded, setExpanded] = useState(false);
  const { removeCombatant, updateCombatant, sortCombat } = useCampaign();

  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { showAlert } = useAlert();

  const actions = item.turnActions || {
    standard: true,
    bonus: true,
    reaction: true,
  };

  const activeStance = item.stances?.find((s) => s.id === item.activeStanceId);
  const stanceBonus = activeStance?.acBonus || 0;
  const totalAC = (item.armorClass || 10) + stanceBonus;

  const toggleAction = (type: "standard" | "bonus" | "reaction") => {
    const newActions = { ...actions, [type]: !actions[type] };
    updateCombatant(item.id, "turnActions", newActions);
  };

  const handleUseSkill = (skill: Skill) => {
    if (item.focus.current < skill.cost) {
      showAlert("Sem Foco", `${item.name} precisa de ${skill.cost} foco.`);
      return;
    }

    const actionKey = getActionKey(skill.actionType);

    if (actionKey && !actions[actionKey]) {
      showAlert(
        "Ação Indisponível",
        `${item.name} já gastou sua ${skill.actionType || "ação"} neste turno.`,
      );
      return;
    }

    updateCombatant(item.id, "focus", item.focus.current - skill.cost);

    if (actionKey) {
      const newActions = { ...actions, [actionKey]: false };
      updateCombatant(item.id, "turnActions", newActions);
    }

    showAlert(
      "Habilidade Usada",
      `${item.name} usou ${skill.name}!\n\n${skill.description}`,
    );
  };

  const handleStanceChange = (newStanceId: string | null) => {
    if (newStanceId !== null) {
      if (item.activeStanceId === newStanceId) return;

      if (!actions.bonus) {
        showAlert(
          "Ação Indisponível",
          "Mudar de postura requer uma Ação Bônus neste turno.",
        );
        return;
      }

      const newActions = { ...actions, bonus: false };
      updateCombatant(item.id, "turnActions", newActions);
    }

    updateCombatant(item.id, "activeStanceId", newStanceId);
  };

  return (
    <View
      style={[
        styles.cardContainer,
        item.type === "player" ? styles.playerCard : styles.npcCard,
      ]}
    >
      <TouchableOpacity
        style={styles.mainRow}
        activeOpacity={0.8}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.initBox}>
          <TextInput
            style={styles.initInput}
            keyboardType="numeric"
            value={String(item.initiative)}
            onChangeText={(t) =>
              updateCombatant(item.id, "initiative", Number(t))
            }
            onBlur={sortCombat}
            selectTextOnFocus
          />
          <Text style={styles.tinyLabel}>INI</Text>
        </View>

        <View style={{ marginLeft: 8 }}>
          <AvatarPortrait imageUrl={item.image} name={item.name} size={40} />
        </View>

        <View style={styles.infoCol}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.miniBadge, { backgroundColor: colors.primary + "15" }]}>
              <MaterialCommunityIcons name="shield" size={10} color={colors.primary} />
              <Text style={[styles.miniBadgeText, { color: colors.primary }]}>{totalAC}</Text>
            </View>
            {item.focus.max > 0 && (
              <View style={[styles.miniBadge, { backgroundColor: colors.focus + "15" }]}>
                <Ionicons name="flash" size={10} color={colors.focus} />
                <Text style={[styles.miniBadgeText, { color: colors.focus }]}>{item.focus.current}</Text>
              </View>
            )}
            <Text style={styles.typeLabel}>{item.type.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.hpCtrl}>
          <TouchableOpacity
            style={styles.hpBtn}
            onPress={() => updateCombatant(item.id, "hp", item.hp.current - 1)}
          >
            <Ionicons name="remove" size={20} color={colors.error} />
          </TouchableOpacity>
          <View style={styles.hpDisplay}>
            <Text style={[styles.hpVal, item.hp.current <= 0 && { color: colors.error }]}>
              {item.hp.current}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.hpBtn}
            onPress={() => updateCombatant(item.id, "hp", item.hp.current + 1)}
          >
            <Ionicons name="add" size={20} color={colors.success} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.detailsBody}>
          <View style={styles.actionTrackerRow}>
            <TouchableOpacity
              style={[styles.miniActionBtn, actions.standard && { backgroundColor: colors.primary }]}
              onPress={() => toggleAction("standard")}
            >
              <Text style={[styles.miniActionText, !actions.standard && { color: colors.textSecondary }]}>P</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.miniActionBtn, actions.bonus && { backgroundColor: "#fb8c00" }]}
              onPress={() => toggleAction("bonus")}
            >
              <Text style={[styles.miniActionText, !actions.bonus && { color: colors.textSecondary }]}>B</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.miniActionBtn, actions.reaction && { backgroundColor: "#8e24aa" }]}
              onPress={() => toggleAction("reaction")}
            >
              <Text style={[styles.miniActionText, !actions.reaction && { color: colors.textSecondary }]}>R</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.resetTurnBtn}
              onPress={() => updateCombatant(item.id, "turnActions", { standard: true, bonus: true, reaction: true })}
            >
              <Ionicons name="refresh" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {item.stances && item.stances.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionHeader}>Posturas</Text>
              <View style={styles.chipGrid}>
                <TouchableOpacity
                  onPress={() => handleStanceChange(null)}
                  style={[styles.chip, !item.activeStanceId && styles.activeChip]}
                >
                  <Text style={[styles.chipText, !item.activeStanceId && styles.activeChipText]}>Neutra</Text>
                </TouchableOpacity>
                {item.stances.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => handleStanceChange(s.id)}
                    style={[styles.chip, item.activeStanceId === s.id && styles.activeChip, !actions.bonus && item.activeStanceId !== s.id && { opacity: 0.5 }]}
                  >
                    <Text style={[styles.chipText, item.activeStanceId === s.id && styles.activeChipText]}>
                      {s.name} ({s.acBonus >= 0 ? `+${s.acBonus}` : s.acBonus})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {item.skills && item.skills.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionHeader}>Habilidades</Text>
              {item.skills.map((skill) => {
                const actionKey = getActionKey(skill.actionType);
                const canUse = item.focus.current >= skill.cost && (!actionKey || actions[actionKey]);
                return (
                  <TouchableOpacity
                    key={skill.id}
                    style={[styles.skillRow, !canUse && { opacity: 0.4 }]}
                    onPress={() => handleUseSkill(skill)}
                    disabled={!canUse}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.skillName}>{skill.name}</Text>
                      <Text style={styles.skillDesc} numberOfLines={1}>{skill.description}</Text>
                    </View>
                    <View style={styles.skillCostBadge}>
                      <Text style={styles.skillCostText}>{skill.cost}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={styles.footerActions}>
            <TouchableOpacity onPress={() => removeCombatant(item.id)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={16} color={colors.error} />
              <Text style={styles.deleteText}>Remover</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    cardContainer: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      elevation: 2,
    },
    playerCard: { borderLeftWidth: 4, borderLeftColor: colors.success },
    npcCard: { borderLeftWidth: 4, borderLeftColor: "#c62828" },
    mainRow: { flexDirection: "row", alignItems: "center", padding: 8 },
    initBox: {
      width: 44,
      height: 44,
      borderRadius: 8,
      backgroundColor: colors.inputBg,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    initInput: { fontSize: 18, fontWeight: "900", color: colors.text, textAlign: "center", padding: 0 },
    tinyLabel: { fontSize: 8, fontWeight: "bold", color: colors.textSecondary, marginTop: -2 },
    infoCol: { flex: 1, marginLeft: 12, gap: 2 },
    name: { fontSize: 15, fontWeight: "bold", color: colors.text },
    badgeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    miniBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, gap: 2 },
    miniBadgeText: { fontSize: 11, fontWeight: "bold" },
    typeLabel: { fontSize: 9, color: colors.textSecondary, fontWeight: "900", marginLeft: 4 },
    hpCtrl: { flexDirection: "row", alignItems: "center", backgroundColor: colors.inputBg, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
    hpBtn: { padding: 8 },
    hpDisplay: { minWidth: 32, alignItems: "center" },
    hpVal: { fontSize: 16, fontWeight: "900", color: colors.text },
    detailsBody: { padding: 12, backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", borderTopWidth: 1, borderTopColor: colors.border },
    actionTrackerRow: { flexDirection: "row", gap: 8, marginBottom: 12, alignItems: "center" },
    miniActionBtn: { width: 32, height: 28, borderRadius: 6, alignItems: "center", justifyContent: "center", backgroundColor: colors.border },
    miniActionText: { fontSize: 12, fontWeight: "bold", color: "#fff" },
    resetTurnBtn: { marginLeft: "auto", padding: 6, backgroundColor: colors.inputBg, borderRadius: 6, borderWidth: 1, borderColor: colors.border },
    detailSection: { marginBottom: 12 },
    sectionHeader: { fontSize: 10, fontWeight: "bold", color: colors.textSecondary, textTransform: "uppercase", marginBottom: 6, letterSpacing: 0.5 },
    chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    chip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6, backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border },
    activeChip: { backgroundColor: "#c62828", borderColor: "#c62828" },
    chipText: { fontSize: 11, fontWeight: "bold", color: colors.textSecondary },
    activeChipText: { color: "#fff" },
    skillRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, padding: 8, borderRadius: 8, marginBottom: 4, borderWidth: 1, borderColor: colors.border },
    skillName: { fontSize: 13, fontWeight: "bold", color: colors.text },
    skillDesc: { fontSize: 11, color: colors.textSecondary },
    skillCostBadge: { marginLeft: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: colors.inputBg, minWidth: 24, alignItems: "center" },
    skillCostText: { fontSize: 12, fontWeight: "bold", color: colors.text },
    footerActions: { marginTop: 4, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 },
    deleteBtn: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-end" },
    deleteText: { fontSize: 12, fontWeight: "bold", color: colors.error }
  });
