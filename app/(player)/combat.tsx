import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Imports de Contexto e Tipos
import { ThemeColors } from "@/constants/theme";
import { useAlert } from "@/context/AlertContext";
import { useCharacter } from "@/context/CharacterContext";
import { useTheme } from "@/context/ThemeContext";
import { Skill } from "@/types/rpg";

const SkillCard = ({ skill, styles, updateStat, character }: any) => {
  const [expanded, setExpanded] = useState(false);
  const { toggleAction } = useCharacter();
  // const hasEnoughFocus = character.stats.focus.current >= skill.cost;
  const { showAlert } = useAlert();

  // const handleUseSkill = () => {
  //   if (!hasEnoughFocus) {
  //     showAlert("Foco Insuficiente", "Sem foco para usar esta habilidade.");
  //     return;
  //   }
  //   updateStat("focus", -skill.cost);
  //   toggleAction(skill.actionType);
  // };

  const getActionKey = (
    actionString: string
  ): "standard" | "bonus" | "reaction" | null => {
    if (!actionString) return null;
    const lower = actionString.toLowerCase();
    if (lower.includes("bônus") || lower.includes("bonus")) return "bonus";
    if (lower.includes("reação") || lower.includes("reacao")) return "reaction";
    // Assume padrão para "Ação Padrão", "Ataque", etc.
    return "standard";
  };

  const actionKey = getActionKey(skill.action || skill.actionType);

  // 2. Verificações
  const hasEnoughFocus = character.stats.focus.current >= skill.cost;

  // Verifica se a ação está disponível (true) no turno
  // Se actionKey for null (ex: passiva), assume que está disponível
  const isActionAvailable = actionKey ? character.turnActions[actionKey] : true;

  const handleUseSkill = () => {
    // Checa Foco
    if (!hasEnoughFocus) {
      showAlert(
        "Foco Insuficiente",
        "Você não tem foco para usar esta habilidade."
      );
      return;
    }

    // Checa Ação
    if (!isActionAvailable) {
      showAlert(
        "Ação Indisponível",
        `Você já gastou sua ${skill.action || "ação"} neste turno.`
      );
      return;
    }

    // 3. Executa o Gasto
    updateStat("focus", -skill.cost);

    // Só consome a ação se ela existir e for mapeável
    if (actionKey) {
      toggleAction(actionKey);
    }

    // Opcional: Feedback visual ou fechar o card
    // setExpanded(false);
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
              (!hasEnoughFocus || !isActionAvailable) &&
                styles.useButtonDisabled,
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

export default function CombatScreen() {
  const { character, setStanceIndex, updateStat, toggleAction, endTurn } =
    useCharacter();

  const turnActions = character.turnActions || {
    standard: true,
    bonus: true,
    reaction: true,
  };

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
    } else if (armorDef >= 13) {
      baseAC = armorDef + Math.min(dexMod, 2);
    } else {
      baseAC = armorDef + dexMod;
    }
    baseAC += shieldDef;

    let stanceMod = activeStance?.acBonus || 0;

    return { total: baseAC + stanceMod, stanceMod, base: baseAC };
  }, [character.equipment, character.attributes, activeStance]);

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
      <ScrollView
        style={{ maxHeight: 800 }}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={true}
      >
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

        {/* --- RASTREADOR DE AÇÕES (ACTIONS TRACKER) --- */}
        <View style={styles.combatSection}>
          <View style={[styles.sectionHeader, { marginBottom: 8 }]}>
            {/* <Ionicons name="skull-outline" size={20} color={colors.primary} /> */}
            <Text style={styles.sectionTitle}>Turno & Ações</Text>
          </View>

          <View style={styles.actionsRow}>
            {/* Ação Padrão */}
            <TouchableOpacity
              style={[
                styles.actionBtn,
                turnActions.standard
                  ? { backgroundColor: colors.primary } // Azul
                  : { backgroundColor: colors.inputBg, opacity: 0.4 },
              ]}
              onPress={() => toggleAction("standard")}
            >
              <MaterialCommunityIcons
                name="sword-cross"
                size={18}
                color={turnActions.standard ? "#fff" : colors.textSecondary}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  {
                    color: turnActions.standard ? "#fff" : colors.textSecondary,
                  },
                ]}
              >
                Padrão
              </Text>
            </TouchableOpacity>

            {/* Ação Bônus */}
            <TouchableOpacity
              style={[
                styles.actionBtn,
                turnActions.bonus
                  ? { backgroundColor: "#fb8c00" } // Laranja
                  : { backgroundColor: colors.inputBg, opacity: 0.4 },
              ]}
              onPress={() => toggleAction("bonus")}
            >
              <MaterialCommunityIcons
                name="star-four-points"
                size={18}
                color={turnActions.bonus ? "#fff" : colors.textSecondary}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  {
                    color: turnActions.bonus ? "#fff" : colors.textSecondary,
                  },
                ]}
              >
                Bônus
              </Text>
            </TouchableOpacity>

            {/* Reação */}
            <TouchableOpacity
              style={[
                styles.actionBtn,
                turnActions.reaction
                  ? { backgroundColor: "#8e24aa" } // Roxo
                  : { backgroundColor: colors.inputBg, opacity: 0.4 },
              ]}
              onPress={() => toggleAction("reaction")}
            >
              <MaterialCommunityIcons
                name="shield-alert"
                size={18}
                color={turnActions.reaction ? "#fff" : colors.textSecondary}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  {
                    color: turnActions.reaction ? "#fff" : colors.textSecondary,
                  },
                ]}
              >
                Reação
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.endTurnBtn} onPress={endTurn}>
            <Text style={styles.endTurnText}>ENCERRAR TURNO ↻</Text>
          </TouchableOpacity>
        </View>

        {/* <Text style={styles.sectionHeader}>Habilidades</Text> */}

        {/* <Text style={styles.subHeader}>Nível 1</Text>

      <FlatList
        data={skillsLevel1}
        keyExtractor={(item) => item.id}
        renderItem={renderSkill}
        contentContainerStyle={styles.listContent}
      />

      <Text style={styles.subHeader}>Nível 2</Text>

      <FlatList
        data={skillsLevel2}
        keyExtractor={(item) => item.id}
        renderItem={renderSkill}
        contentContainerStyle={styles.listContent}
      /> */}
        {/* 1. Lógica de Filtro (Pode ficar antes do return ou aqui mesmo) */}
        {(() => {
          const level1Skills = character.skills.filter(
            (s) => (s.level || 1) === 1
          );

          // Nível 2 sempre terá a chave, pois são novos.
          const level2Skills = character.skills.filter((s) => s.level === 2);

          // Verifica se o personagem tem nível suficiente para ver a seção 2
          const showLevel2 =
            (character.level || 1) >= 2 && level2Skills.length > 0;

          return (
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Habilidades</Text>

              {/* --- ADICIONADO: ScrollView Interno --- */}
              {/* --- SEÇÃO NÍVEL 1 --- */}
              <Text style={styles.subHeader}>Nível 1</Text>
              <View style={styles.listContent}>
                {level1Skills.length > 0 ? (
                  level1Skills.map((item) => (
                    <React.Fragment key={item.id}>
                      {renderSkill({ item })}
                    </React.Fragment>
                  ))
                ) : (
                  <Text
                    style={{ color: colors.textSecondary, fontStyle: "italic" }}
                  >
                    Nenhuma habilidade.
                  </Text>
                )}
              </View>

              {/* --- SEÇÃO NÍVEL 2 (Condicional) --- */}
              {showLevel2 && (
                <>
                  <Text style={[styles.subHeader, { marginTop: 16 }]}>
                    Nível 2
                  </Text>
                  <View style={styles.listContent}>
                    {level2Skills.map((item) => (
                      <React.Fragment key={item.id}>
                        {renderSkill({ item })}
                      </React.Fragment>
                    ))}
                  </View>
                </>
              )}

              {/* Um espaçamento extra no final do scroll interno */}
              <View style={{ height: 20 }} />
            </View>
          );
        })()}
      </ScrollView>
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
    subHeader: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.primary, // Ou uma cor de destaque
      marginBottom: 8,
      marginLeft: 16,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    section: {
      // backgroundColor: colors.surface,
      borderRadius: 12,
      // padding: 16,
      marginBottom: 24, // Espaço entre uma seção e outra
      // borderWidth: 1,
      borderColor: colors.border,
      // Sombra suave para destacar do fundo
      elevation: 2, // Android
      shadowColor: "#000", // iOS
      shadowOffset: { width: 0, height: 2 }, // iOS
      shadowOpacity: 0.1, // iOS
      shadowRadius: 4, // iOS
    },
    // RASTREADOR DE AÇÕES (Combat Section)
    combatSection: { marginHorizontal: 16, marginTop: 12, marginBottom: 20 },
    sectionTitle: { fontSize: 18, fontWeight: "bold", color: colors.text },

    actionsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
      marginBottom: 12,
    },
    actionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      borderRadius: 8,
      gap: 4,
      elevation: 2,
    },
    actionBtnText: {
      fontWeight: "bold",
      fontSize: 11,
      textTransform: "uppercase",
    },

    endTurnBtn: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
      borderStyle: "dashed",
    },
    endTurnText: {
      color: colors.primary,
      fontWeight: "bold",
      fontSize: 14,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
  });
