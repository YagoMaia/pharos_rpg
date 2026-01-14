import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Imports de Contexto e Dados
import { ThemeColors } from "@/constants/theme";
import { useAlert } from "@/context/AlertContext";
import { useCharacter } from "@/context/CharacterContext";
import { useTheme } from "@/context/ThemeContext";
import { MAGIC_SCHOOLS } from "@/data/spellData";
import { Spell } from "@/types/rpg";

// Helper de Cores dos Círculos
const getCircleTheme = (circle: number) => {
  switch (circle) {
    case 1:
      return { primary: "#2e7d32", light: "#e8f5e9" };
    case 2:
      return { primary: "#1565c0", light: "#e3f2fd" };
    case 3:
      return { primary: "#6a1b9a", light: "#f3e5f5" };
    case 4:
      return { primary: "#c62828", light: "#ffebee" };
    case 5:
      return { primary: "#ef6c00", light: "#fff3e0" };
    default:
      return { primary: "#455a64", light: "#eceff1" };
  }
};

export default function GrimoireScreen() {
  const { character, addSpell } = useCharacter();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [learnModalVisible, setLearnModalVisible] = useState(false);
  const { showAlert } = useAlert();

  // Agrupamento de magias
  const sections = useMemo(() => {
    if (!character.grimoire || character.grimoire.length === 0) return [];

    const groups = character.grimoire.reduce((acc, spell) => {
      const circleKey = spell.circle;
      if (!acc[circleKey]) acc[circleKey] = [];
      acc[circleKey].push(spell);
      return acc;
    }, {} as Record<number, Spell[]>);

    return Object.keys(groups)
      .map((key) => Number(key))
      .sort((a, b) => a - b)
      .map((circle) => ({
        title: `${circle}º Círculo`,
        circleLevel: circle,
        data: groups[circle],
      }));
  }, [character.grimoire]);

  const focus = character.stats.focus;

  return (
    <View style={styles.container}>
      {/* --- HUD DE FOCO --- */}
      <View style={styles.focusHud}>
        <View style={styles.focusHeader}>
          <View style={styles.focusLabelContainer}>
            <Ionicons name="flash" size={16} color={colors.focus} />
            <Text style={styles.focusTitle}>PONTOS DE FOCO</Text>
          </View>
          <Text style={styles.focusValue}>
            <Text style={styles.focusCurrent}>{focus.current}</Text>
            <Text style={styles.focusMax}> / {focus.max}</Text>
          </Text>
        </View>
        <View style={styles.focusBarBg}>
          <View
            style={[
              styles.focusBarFill,
              { width: `${Math.min(100, (focus.current / focus.max) * 100)}%` },
            ]}
          />
        </View>
      </View>

      {/* Botão de Adicionar Magia */}
      <View style={styles.actionBar}>
        <Text style={styles.screenTitle}>Grimório</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setLearnModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addBtnText}>Aprender</Text>
        </TouchableOpacity>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SpellCard spell={item} styles={styles} colors={colors} />
        )}
        renderSectionHeader={({ section: { title, circleLevel } }) => {
          const theme = getCircleTheme(circleLevel);
          return (
            <View style={styles.sectionHeader}>
              <View
                style={[styles.circleDot, { backgroundColor: theme.primary }]}
              />
              <Text style={[styles.sectionTitle, { color: theme.primary }]}>
                {title}
              </Text>
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={true}
        ListEmptyComponent={
          <Text style={styles.emptyList}>
            Nenhuma magia aprendida. Clique em Aprender para adicionar.
          </Text>
        }
      />

      {/* --- MODAL DE APRENDER MAGIAS --- */}
      <Modal
        visible={learnModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Biblioteca Arcana</Text>
            <TouchableOpacity onPress={() => setLearnModalVisible(false)}>
              <Text style={styles.closeText}>Fechar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {MAGIC_SCHOOLS.map((school) => (
              <View key={school.id} style={styles.schoolGroup}>
                <Text style={styles.schoolTitle}>{school.name}</Text>
                <Text style={styles.schoolQuote}>{school.quote}</Text>

                {school.spells.map((spell) => {
                  const isLearned = character.grimoire?.some(
                    (s) => s.id === spell.id
                  );

                  // Renderiza o novo componente Item de Aprendizado
                  return (
                    <LearnSpellItem
                      key={spell.id}
                      spell={spell}
                      isLearned={!!isLearned}
                      onLearn={() => {
                        addSpell(spell);
                        showAlert(
                          "Sucesso",
                          `${spell.name} adicionada ao grimório.`
                        );
                      }}
                      styles={styles}
                      colors={colors}
                    />
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// --- NOVO COMPONENTE: ITEM DE APRENDIZADO (EXPANSÍVEL) ---
const LearnSpellItem = ({ spell, isLearned, onLearn, styles, colors }: any) => {
  const [expanded, setExpanded] = useState(false);
  const theme = getCircleTheme(spell.circle);

  return (
    <View
      style={[styles.learnCardContainer, isLearned && styles.learnCardDisabled]}
    >
      {/* Cabeçalho Clicável */}
      <TouchableOpacity
        style={styles.learnCardHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.learnName,
              isLearned && { color: colors.textSecondary },
            ]}
          >
            {spell.name}
          </Text>
          <Text style={styles.learnInfo}>
            Círculo {spell.circle} • {spell.school}
          </Text>
        </View>

        {/* Ícone: Check se aprendeu, ou Seta se pode aprender */}
        {isLearned ? (
          <Ionicons
            name="checkmark-circle"
            size={24}
            color={colors.textSecondary}
          />
        ) : (
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={24}
            color={theme.primary}
          />
        )}
      </TouchableOpacity>

      {/* Corpo Expansível */}
      {expanded && (
        <View style={styles.learnCardBody}>
          <Text style={styles.learnDescription}>{spell.description}</Text>
          <Text style={styles.learnEffect}>Efeito: {spell.effect}</Text>

          {!isLearned && (
            <TouchableOpacity
              style={[styles.learnBtn, { backgroundColor: theme.primary }]}
              onPress={onLearn}
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.learnBtnText}>Adicionar ao Grimório</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

// --- COMPONENTE: CARD DO GRIMÓRIO (JÁ APRENDIDO) ---
const SpellCard = ({
  spell,
  styles,
  colors,
}: {
  spell: Spell;
  styles: any;
  colors: ThemeColors;
}) => {
  const [expanded, setExpanded] = useState(false);
  const { character, updateStat, removeSpell } = useCharacter();
  const theme = getCircleTheme(spell.circle);

  const castCost = spell.circle * 2;
  const currentFocus = character.stats.focus.current;
  const canCast = currentFocus >= castCost;
  const { showAlert } = useAlert();

  const handleCast = () => {
    if (!canCast) {
      showAlert("Foco Insuficiente", `Você precisa de ${castCost} de foco.`);
      return;
    }
    showAlert(
      "Conjurar Magia",
      `Gastar ${castCost} de Foco para lançar ${spell.name}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Conjurar", onPress: () => updateStat("focus", -castCost) },
      ]
    );
  };

  const handleForget = () => {
    showAlert("Esquecer Magia", "Tem certeza?", [
      { text: "Não", style: "cancel" },
      {
        text: "Sim",
        style: "destructive",
        onPress: () => removeSpell(spell.id),
      },
    ]);
  };

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: theme.primary }]}
      activeOpacity={0.9}
      onPress={() => setExpanded(!expanded)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.headerTop}>
          <Text style={styles.spellName}>{spell.name}</Text>
          <View style={[styles.schoolBadge, { backgroundColor: theme.light }]}>
            <Text style={[styles.schoolText, { color: theme.primary }]}>
              {spell.school}
            </Text>
          </View>
        </View>
        {!expanded && (
          <Text style={styles.summaryEffect} numberOfLines={1}>
            {spell.effect}
          </Text>
        )}
      </View>

      {expanded && (
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="flash" size={14} color={theme.primary} />
            <Text style={styles.effectLabel}>
              Efeito: <Text style={styles.effectValue}>{spell.effect}</Text>
            </Text>
          </View>
          <Text style={styles.description}>{spell.description}</Text>

          <View style={styles.actionsFooter}>
            <TouchableOpacity style={styles.forgetBtn} onPress={handleForget}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.castBtn,
                !canCast && styles.castBtnDisabled,
                { backgroundColor: canCast ? theme.primary : colors.border },
              ]}
              onPress={handleCast}
              disabled={!canCast}
            >
              <Text style={styles.castBtnText}>
                {canCast
                  ? `CONJURAR (-${castCost} Foco)`
                  : `Custo: ${castCost} Foco`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

// --- ESTILOS DINÂMICOS ---
const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    // HUD Foco
    focusHud: {
      backgroundColor: colors.surface,
      paddingVertical: 12,
      paddingHorizontal: 16,
      elevation: 2,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 4,
    },
    focusHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    focusLabelContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    focusTitle: {
      fontSize: 12,
      fontWeight: "bold",
      color: colors.focus,
      letterSpacing: 1,
    },
    focusValue: { fontSize: 14, color: colors.textSecondary },
    focusCurrent: { fontSize: 20, fontWeight: "bold", color: colors.text },
    focusMax: { fontSize: 14, color: colors.textSecondary },
    focusBarBg: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: "hidden",
    },
    focusBarFill: {
      height: "100%",
      backgroundColor: colors.focus,
      borderRadius: 4,
    },

    // Action Bar
    actionBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      backgroundColor: colors.background,
    },
    screenTitle: { fontSize: 24, fontWeight: "bold", color: colors.text },
    addBtn: {
      flexDirection: "row",
      backgroundColor: colors.primary,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      alignItems: "center",
      gap: 4,
    },
    addBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },

    // List
    listContent: { paddingBottom: 20 },
    sectionHeader: {
      backgroundColor: colors.background,
      paddingVertical: 8,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    circleDot: { width: 8, height: 8, borderRadius: 4 },
    sectionTitle: { fontSize: 18, fontWeight: "bold" },
    emptyList: {
      textAlign: "center",
      marginTop: 40,
      color: colors.textSecondary,
      fontStyle: "italic",
      paddingHorizontal: 40,
    },

    // Spell Card (Grimório)
    card: {
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      marginVertical: 6,
      borderRadius: 8,
      padding: 16,
      elevation: 2,
      borderLeftWidth: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: { marginBottom: 4 },
    headerTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    spellName: { fontSize: 16, fontWeight: "bold", color: colors.text },
    schoolBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    schoolText: { fontSize: 10, textTransform: "uppercase", fontWeight: "700" },
    summaryEffect: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: "italic",
    },
    cardBody: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
      gap: 6,
    },
    effectLabel: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.textSecondary,
    },
    effectValue: { fontWeight: "normal", color: colors.text },
    description: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      textAlign: "justify",
      marginBottom: 16,
    },

    // Footer Buttons
    actionsFooter: { flexDirection: "row", alignItems: "center", gap: 10 },
    forgetBtn: {
      padding: 10,
      backgroundColor: colors.error + "15",
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.error + "50",
    },
    castBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: "center",
    },
    castBtnDisabled: { opacity: 0.7 },
    castBtnText: {
      color: "#fff",
      fontWeight: "bold",
      textTransform: "uppercase",
      fontSize: 14,
    },

    // Modal Learning
    modalContainer: { flex: 1, backgroundColor: colors.background },
    modalHeader: {
      padding: 16,
      backgroundColor: colors.surface,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: { fontSize: 18, fontWeight: "bold", color: colors.text },
    closeText: { color: colors.primary, fontWeight: "600" },
    modalContent: { padding: 16 },
    schoolGroup: { marginBottom: 24 },
    schoolTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 4,
    },
    schoolQuote: {
      fontSize: 12,
      fontStyle: "italic",
      color: colors.textSecondary,
      marginBottom: 12,
    },

    // --- ESTILOS DO CARD DE APRENDER (LearnSpellItem) ---
    learnCardContainer: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      marginBottom: 8,
      elevation: 1,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    learnCardDisabled: {
      backgroundColor: colors.inputBg,
      elevation: 0,
      opacity: 0.8,
    },
    learnCardHeader: {
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    learnName: { fontSize: 16, fontWeight: "bold", color: colors.text },
    learnInfo: { fontSize: 12, color: colors.textSecondary },

    learnCardBody: {
      padding: 12,
      paddingTop: 0,
      borderTopWidth: 1,
      borderTopColor: colors.border + "50", // Mais sutil
    },
    learnDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 8,
      lineHeight: 20,
      marginBottom: 8,
    },
    learnEffect: {
      fontSize: 12,
      fontStyle: "italic",
      color: colors.text,
      marginBottom: 12,
    },
    learnBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      borderRadius: 6,
    },
    learnBtnText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 14,
    },
  });
