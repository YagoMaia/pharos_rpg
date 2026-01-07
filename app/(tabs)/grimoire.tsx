// app/(tabs)/grimoire.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useCharacter } from "../../context/CharacterContext";
import { MAGIC_SCHOOLS } from "../../data/spellData"; // Importe os dados criados anteriormente
import { Spell } from "../../types/rpg";

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
  const [learnModalVisible, setLearnModalVisible] = useState(false);

  // Agrupamento de magias (Código existente mantido)
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
      {/* HUD DE FOCO (Para visualizar o gasto) */}
      {/* <View style={styles.focusHud}>
        <View style={styles.focusHeader}>
          <Text style={styles.focusTitle}>PONTOS DE FOCO</Text>
          <Text style={styles.focusValue}>
            {focus.current} / {focus.max}
          </Text>
        </View>
        <View style={styles.focusBarBg}>
          <View
            style={[
              styles.focusBarFill,
              { width: `${(focus.current / focus.max) * 100}%` },
            ]}
          />
        </View>
      </View> */}

      {/* --- HUD DE FOCO (NOVO) --- */}
      <View style={styles.focusHud}>
        <View style={styles.focusHeader}>
          <View style={styles.focusLabelContainer}>
            <Ionicons name="flash" size={16} color="#1e88e5" />
            <Text style={styles.focusTitle}>PONTOS DE FOCO</Text>
          </View>
          <Text style={styles.focusValue}>
            <Text style={styles.focusCurrent}>{focus.current}</Text>
            <Text style={styles.focusMax}> / {focus.max}</Text>
          </Text>
        </View>

        {/* Barra de Progresso Visual */}
        <View style={styles.focusBarBg}>
          <View
            style={[
              styles.focusBarFill,
              { width: `${(focus.current / focus.max) * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* Botão de Adicionar Magia no Topo */}
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
        renderItem={({ item }) => <SpellCard spell={item} />}
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
            Nenhuma magia aprendida. Clique em &quotAprender&quot para
            adicionar.
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
                  // Verifica se já tem a magia
                  const isLearned = character.grimoire?.some(
                    (s) => s.id === spell.id
                  );
                  const theme = getCircleTheme(spell.circle);

                  return (
                    <TouchableOpacity
                      key={spell.id}
                      style={[
                        styles.learnCard,
                        isLearned && styles.learnCardDisabled,
                      ]}
                      disabled={isLearned}
                      onPress={() => {
                        addSpell(spell);
                        Alert.alert(
                          "Magia Aprendida",
                          `${spell.name} foi adicionada ao grimório.`
                        );
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.learnName,
                            isLearned && { color: "#999" },
                          ]}
                        >
                          {spell.name}
                        </Text>
                        <Text style={styles.learnInfo}>
                          Círculo {spell.circle} • {spell.school}
                        </Text>
                      </View>
                      {isLearned ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color="#aaa"
                        />
                      ) : (
                        <Ionicons
                          name="add-circle"
                          size={24}
                          color={theme.primary}
                        />
                      )}
                    </TouchableOpacity>
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

// --- CARD DA MAGIA COM BOTÃO DE CONJURAR ---
const SpellCard = ({ spell }: { spell: Spell }) => {
  const [expanded, setExpanded] = useState(false);
  const { character, updateStat, removeSpell } = useCharacter();
  const theme = getCircleTheme(spell.circle);

  // LÓGICA DE CUSTO: 2 * Círculo
  const castCost = spell.circle * 2;
  const currentFocus = character.stats.focus.current;
  const canCast = currentFocus >= castCost;

  const handleCast = () => {
    if (!canCast) {
      Alert.alert("Foco Insuficiente", `Você precisa de ${castCost} de foco.`);
      return;
    }

    Alert.alert(
      "Conjurar Magia",
      `Gastar ${castCost} de Foco para lançar ${spell.name}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Conjurar",
          onPress: () => {
            updateStat("focus", -castCost);
            // Opcional: Feedback visual ou som
          },
        },
      ]
    );
  };

  const handleForget = () => {
    Alert.alert("Esquecer Magia", "Tem certeza?", [
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

          {/* RODAPÉ DE AÇÕES */}
          <View style={styles.actionsFooter}>
            {/* Botão Esquecer (Lixeira) */}
            <TouchableOpacity style={styles.forgetBtn} onPress={handleForget}>
              <Ionicons name="trash-outline" size={20} color="#e53935" />
            </TouchableOpacity>

            {/* Botão Conjurar */}
            <TouchableOpacity
              style={[
                styles.castBtn,
                !canCast && styles.castBtnDisabled,
                { backgroundColor: canCast ? theme.primary : "#ccc" },
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f2f5" },

  // HUD Foco
  focusHud: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 2, // Sombra suave
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 4, // Espaço pequeno antes da postura
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
    color: "#1e88e5",
    letterSpacing: 1,
  },
  focusValue: {
    fontSize: 14,
    color: "#555",
  },
  focusCurrent: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  focusMax: {
    fontSize: 14,
    color: "#999",
  },
  focusBarBg: {
    height: 8,
    backgroundColor: "#e3f2fd", // Azul bem claro
    borderRadius: 4,
    overflow: "hidden",
  },
  focusBarFill: {
    height: "100%",
    backgroundColor: "#1e88e5", // Azul principal
    borderRadius: 4,
  },

  // Barra de Ação (Título + Botão Aprender)
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f0f2f5",
  },
  screenTitle: { fontSize: 24, fontWeight: "bold", color: "#333" },
  addBtn: {
    flexDirection: "row",
    backgroundColor: "#6200ea",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: "center",
    gap: 4,
  },
  addBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },

  // Listagem
  listContent: { paddingBottom: 20 },
  sectionHeader: {
    backgroundColor: "#f0f2f5",
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
    color: "#888",
    fontStyle: "italic",
    paddingHorizontal: 40,
  },

  // Card
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    borderLeftWidth: 4,
  },
  cardHeader: { marginBottom: 4 },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  spellName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  schoolBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  schoolText: { fontSize: 10, textTransform: "uppercase", fontWeight: "700" },
  summaryEffect: { fontSize: 12, color: "#666", fontStyle: "italic" },
  cardBody: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  effectLabel: { fontSize: 14, fontWeight: "bold", color: "#444" },
  effectValue: { fontWeight: "normal", color: "#333" },
  description: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    textAlign: "justify",
    marginBottom: 16,
  },

  // Botões do Card
  actionsFooter: { flexDirection: "row", alignItems: "center", gap: 10 },
  forgetBtn: {
    padding: 10,
    backgroundColor: "#ffebee",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  castBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  castBtnDisabled: { backgroundColor: "#e0e0e0" },
  castBtnText: {
    color: "#fff",
    fontWeight: "bold",
    textTransform: "uppercase",
    fontSize: 14,
  },

  // Modal Aprender
  modalContainer: { flex: 1, backgroundColor: "#f5f5f5" },
  modalHeader: {
    padding: 16,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  closeText: { color: "#6200ea", fontWeight: "600" },
  modalContent: { padding: 16 },
  schoolGroup: { marginBottom: 24 },
  schoolTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  schoolQuote: {
    fontSize: 12,
    fontStyle: "italic",
    color: "#666",
    marginBottom: 12,
  },
  learnCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    elevation: 1,
  },
  learnCardDisabled: { backgroundColor: "#f9f9f9", elevation: 0 },
  learnName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  learnInfo: { fontSize: 12, color: "#666" },
});
