import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Imports de Contexto e Tipos
import { useCharacter } from "../../context/CharacterContext";
import { useTheme } from "../../context/ThemeContext"; // <--- Hook do Tema
import { Skill } from "../../types/rpg";
import { ThemeColors } from "@/constants/theme";

export default function CombatScreen() {
  const { character, setStanceIndex, updateStat } = useCharacter();

  // Hook do Tema
  const { colors } = useTheme();
  // Gerar estilos dinâmicos
  const styles = useMemo(() => getStyles(colors), [colors]);

  const currentStanceIdx = character.currentStanceIndex ?? -1;
  const isNeutral = currentStanceIdx === -1;

  const activeStance = isNeutral ? null : character.stances[currentStanceIdx];
  const focus = character.stats.focus;

  // --- CÁLCULO DINÂMICO DA CA ---
  const armorClassInfo = useMemo(() => {
    const armorDef = character.equipment.armor.defense || 0;
    const shieldDef = character.equipment.shield.defense || 0;

    const dexMod =
      Object.values(character.attributes).find(
        (attr) => attr.name === "Destreza"
      )?.modifier || 0;

    let baseAC = 0;
    if (armorDef === 0) {
      baseAC = 10 + dexMod;
    } else if (armorDef >= 16) {
      baseAC = armorDef;
    } else {
      baseAC = armorDef + Math.min(dexMod, 2);
    }
    baseAC += shieldDef;

    let stanceMod = 0;
    if (!isNeutral && activeStance) {
      const sId = activeStance.id;
      if (sId === "gue_defensor") stanceMod = 1;
      if (sId === "gue_ofensiva") stanceMod = -2;
      if (sId === "cor_danca") stanceMod = 2;
      if (sId === "cor_explosao") stanceMod = -2;
    }

    return { total: baseAC + stanceMod, stanceMod, base: baseAC };
  }, [character.equipment, character.attributes, activeStance, isNeutral]);

  const renderSkill = ({ item }: { item: Skill }) => (
    <SkillCard
      skill={item}
      styles={styles}
      colors={colors}
      updateStat={updateStat}
      character={character}
    />
  );

  return (
    <View style={styles.container}>
      {/* HUD DE COMBATE */}
      <View style={styles.combatHud}>
        <View style={styles.focusContainer}>
          <View style={styles.focusHeader}>
            <View style={styles.labelGroup}>
              <Ionicons name="flash" size={14} color={colors.focus} />
              <Text style={styles.hudLabel}>FOCO</Text>
            </View>
            <Text style={styles.focusValue}>
              <Text style={styles.focusCurrent}>{focus.current}</Text>
              <Text style={styles.focusMax}>/{focus.max}</Text>
            </Text>
          </View>
          <View style={styles.focusBarBg}>
            <View
              style={[
                styles.focusBarFill,
                {
                  width: `${(focus.current / focus.max) * 100}%`,
                  backgroundColor: colors.focus,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.verticalDivider} />

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
            <Text style={styles.acTotal}>{armorClassInfo.total}</Text>
            {armorClassInfo.stanceMod !== 0 && (
              <View
                style={[
                  styles.modBadge,
                  {
                    backgroundColor:
                      armorClassInfo.stanceMod > 0
                        ? colors.success + "20"
                        : colors.error + "20",
                    borderColor:
                      armorClassInfo.stanceMod > 0
                        ? colors.success
                        : colors.error,
                  },
                ]}
              >
                <Ionicons
                  name={
                    armorClassInfo.stanceMod > 0 ? "arrow-up" : "arrow-down"
                  }
                  size={10}
                  color={
                    armorClassInfo.stanceMod > 0 ? colors.success : colors.error
                  }
                />
              </View>
            )}
          </View>
        </View>
      </View>

      {/* --- SELETOR DE POSTURA --- */}
      <View style={styles.stanceSelectorContainer}>
        <Text style={styles.sectionLabel}>Postura Atual</Text>

        <View style={styles.stanceToggleGroup}>
          {/* Botão Neutra */}
          <TouchableOpacity
            style={[
              styles.stanceBtn,
              isNeutral && styles.stanceBtnNeutralActive,
            ]}
            onPress={() => setStanceIndex(-1)}
          >
            <Text
              style={[
                styles.stanceBtnText,
                isNeutral && styles.stanceBtnTextActive,
              ]}
            >
              Neutra
            </Text>
          </TouchableOpacity>

          {/* Botão Postura 1 */}
          <TouchableOpacity
            style={[
              styles.stanceBtn,
              currentStanceIdx === 0 && styles.stanceBtnP1Active,
            ]}
            onPress={() => setStanceIndex(0)}
          >
            <Text
              style={[
                styles.stanceBtnText,
                currentStanceIdx === 0 && { color: "#fff" },
              ]}
            >
              I
            </Text>
          </TouchableOpacity>

          {/* Botão Postura 2 */}
          <TouchableOpacity
            style={[
              styles.stanceBtn,
              currentStanceIdx === 1 && styles.stanceBtnP2Active,
            ]}
            onPress={() => setStanceIndex(1)}
          >
            <Text
              style={[
                styles.stanceBtnText,
                currentStanceIdx === 1 && { color: "#fff" },
              ]}
            >
              II
            </Text>
          </TouchableOpacity>
        </View>

        {/* DETALHES DA POSTURA ATIVA */}
        <View
          style={[
            styles.stanceCard,
            isNeutral
              ? styles.stanceNeutralBg
              : currentStanceIdx === 0
              ? styles.stanceOneBg
              : styles.stanceTwoBg,
          ]}
        >
          <Text style={styles.activeStanceName}>
            {isNeutral ? "Postura Neutra" : activeStance?.name}
          </Text>

          <View style={styles.divider} />

          {isNeutral ? (
            <Text style={styles.neutralText}>
              Você não está focado em nenhuma técnica específica.
            </Text>
          ) : (
            <View style={styles.stanceDetails}>
              <InfoRow
                label="Benefício"
                text={activeStance?.benefit || ""}
                color={colors.success}
                styles={styles}
              />
              <InfoRow
                label="Restrição"
                text={activeStance?.restriction || ""}
                color={colors.error}
                styles={styles}
              />
              <InfoRow
                label="Manobra"
                text={activeStance?.maneuver || ""}
                color={colors.focus}
                styles={styles}
              />
              {activeStance?.recovery && (
                <InfoRow
                  label="Recuperação"
                  text={activeStance?.recovery}
                  color={colors.primary}
                  styles={styles}
                />
              )}
            </View>
          )}
        </View>
      </View>

      <Text style={styles.sectionHeader}>Habilidades</Text>

      <FlatList
        data={character.skills}
        keyExtractor={(item) => item.id}
        renderItem={renderSkill}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

// Componente InfoRow (Recebe styles/colors agora)
const InfoRow = ({ label, text, color, styles }: any) => (
  <View style={styles.infoRow}>
    <Text style={[styles.infoLabel, { color }]}>{label}:</Text>
    <Text style={styles.infoText}>{text}</Text>
  </View>
);

// Componente SkillCard (Recebe styles/colors agora)
const SkillCard = ({ skill, styles, colors, updateStat, character }: any) => {
  const [expanded, setExpanded] = useState(false);
  const hasEnoughFocus = character.stats.focus.current >= skill.cost;

  const handleUseSkill = () => {
    if (!hasEnoughFocus) {
      Alert.alert("Foco Insuficiente", "Sem foco para usar esta habilidade.");
      return;
    }
    updateStat("focus", -skill.cost);
  };

  return (
    <TouchableOpacity
      style={styles.skillCard}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.8}
    >
      <View style={styles.skillHeader}>
        <View>
          <Text style={styles.skillName}>{skill.name}</Text>
          <Text style={styles.skillType}>{skill.actionType}</Text>
        </View>
        <View
          style={[
            styles.costBadge,
            !hasEnoughFocus && styles.costBadgeDisabled,
          ]}
        >
          <Text
            style={[
              styles.costText,
              !hasEnoughFocus && styles.costTextDisabled,
            ]}
          >
            {skill.cost} Foco
          </Text>
        </View>
      </View>
      {expanded && (
        <View style={styles.skillBody}>
          <Text style={styles.description}>{skill.description}</Text>
          <TouchableOpacity
            style={[
              styles.useButton,
              !hasEnoughFocus && styles.useButtonDisabled,
            ]}
            onPress={handleUseSkill}
            disabled={!hasEnoughFocus}
          >
            <Text style={styles.useButtonText}>
              {hasEnoughFocus ? "USAR HABILIDADE" : "FOCO INSUFICIENTE"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

// --- GERADOR DE ESTILOS DINÂMICO ---
const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    // HUD
    combatHud: {
      backgroundColor: colors.surface,
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      elevation: 3,
      marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    focusContainer: { flex: 2, marginRight: 16 },
    focusHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },
    labelGroup: { flexDirection: "row", alignItems: "center", gap: 6 },
    hudLabel: { fontSize: 10, fontWeight: "bold", color: colors.textSecondary },
    focusValue: { fontSize: 12, color: colors.textSecondary },
    focusCurrent: { fontSize: 18, fontWeight: "bold", color: colors.text },
    focusMax: { fontSize: 14, color: colors.textSecondary },
    focusBarBg: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: "hidden",
    },
    focusBarFill: { height: "100%", borderRadius: 4 }, // Cor vem inline
    verticalDivider: {
      width: 1,
      height: "80%",
      backgroundColor: colors.border,
      marginHorizontal: 8,
    },
    acContainer: { flex: 1, alignItems: "center" },
    acValueContainer: { flexDirection: "row", alignItems: "center", gap: 6 },
    acTotal: { fontSize: 32, fontWeight: "bold", color: colors.text },
    modBadge: {
      width: 20,
      height: 20,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
    },

    // SELETOR DE POSTURA
    stanceSelectorContainer: { marginHorizontal: 16, marginBottom: 16 },
    sectionLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "bold",
      textTransform: "uppercase",
      marginBottom: 8,
    },

    stanceToggleGroup: {
      flexDirection: "row",
      backgroundColor: colors.inputBg, // Fundo do switch
      borderRadius: 8,
      padding: 2,
      marginBottom: 8,
    },
    stanceBtn: {
      flex: 1,
      paddingVertical: 8,
      alignItems: "center",
      borderRadius: 6,
    },
    stanceBtnText: { fontWeight: "600", color: colors.textSecondary },

    // Botões Ativos
    stanceBtnNeutralActive: { backgroundColor: colors.surface, elevation: 2 },
    stanceBtnP1Active: { backgroundColor: "#1976d2", elevation: 2 }, // Azul Fixo
    stanceBtnP2Active: { backgroundColor: "#f57c00", elevation: 2 }, // Laranja Fixo
    stanceBtnTextActive: { color: colors.text }, // Texto do neutro ativo

    // CARD DE POSTURA
    stanceCard: {
      borderRadius: 12,
      padding: 16,
      elevation: 2,
      minHeight: 120,
      backgroundColor: colors.surface, // Fundo padrão para Dark Mode
      borderWidth: 1,
      borderColor: colors.border, // Borda sutil
    },
    // Bordas Laterais Coloridas
    stanceNeutralBg: {
      borderLeftWidth: 5,
      borderLeftColor: colors.textSecondary,
    },
    stanceOneBg: { borderLeftWidth: 5, borderLeftColor: "#1976d2" },
    stanceTwoBg: { borderLeftWidth: 5, borderLeftColor: "#f57c00" },

    activeStanceName: {
      fontSize: 20,
      fontWeight: "bold",
      textAlign: "center",
      color: colors.text,
      marginBottom: 8,
    },
    divider: { height: 1, backgroundColor: colors.border, marginBottom: 12 },
    neutralText: {
      textAlign: "center",
      color: colors.textSecondary,
      fontStyle: "italic",
      marginTop: 10,
    },
    stanceDetails: { gap: 8 },

    // Info Row
    infoRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "flex-start",
    },
    infoLabel: { fontWeight: "bold", marginRight: 6, fontSize: 14 },
    infoText: {
      fontSize: 14,
      color: colors.textSecondary,
      flex: 1,
      lineHeight: 20,
    },

    // Lista
    sectionHeader: {
      fontSize: 18,
      fontWeight: "bold",
      marginLeft: 16,
      marginBottom: 8,
      color: colors.text,
    },
    listContent: { paddingHorizontal: 16, paddingBottom: 20 },

    // Skill Card
    skillCard: {
      backgroundColor: colors.surface,
      marginBottom: 10,
      borderRadius: 8,
      padding: 16,
      elevation: 1,
      borderWidth: 1,
      borderColor: colors.border, // Ajuda a separar no fundo escuro
    },
    skillHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    skillName: { fontSize: 16, fontWeight: "bold", color: colors.text },
    skillType: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

    costBadge: {
      backgroundColor: colors.inputBg,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    costBadgeDisabled: {
      backgroundColor: colors.error + "15", // Transparente
      borderWidth: 1,
      borderColor: colors.error,
    },
    costText: { fontSize: 12, fontWeight: "bold", color: colors.text },
    costTextDisabled: { color: colors.error },

    skillBody: {
      marginTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 8,
    },
    description: { fontSize: 14, lineHeight: 20, color: colors.textSecondary },
    useButton: {
      marginTop: 12,
      backgroundColor: colors.primary,
      paddingVertical: 10,
      borderRadius: 6,
      alignItems: "center",
    },
    useButtonDisabled: { backgroundColor: colors.border },
    useButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  });
