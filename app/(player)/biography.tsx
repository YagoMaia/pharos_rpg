import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Imports de Contexto e Tipos
import { ThemeColors } from "@/constants/theme";
import { useAlert } from "@/context/AlertContext";
import { useCharacter } from "@/context/CharacterContext";
import { useTheme } from "@/context/ThemeContext";
import { SKILL_DESCRIPTIONS, SKILL_GROUPS } from "@/data/expertiseData";
import { AttributeName } from "@/types/rpg";

export default function BiographyScreen() {
  const { character, updateBackstory, toggleTrainedSkill } = useCharacter();

  // Hook do Tema
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { showAlert } = useAlert();

  // Bônus de Proficiência Base
  const PROFICIENCY_BONUS = 2;

  const handleShowDescription = (skill: string) => {
    showAlert(skill, SKILL_DESCRIPTIONS[skill] || "Sem descrição disponível.");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: colors.background }}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* --- SEÇÃO 1: PERÍCIAS TREINADAS --- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="school" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Perícias Treinadas</Text>
          </View>
          <Text style={styles.helperText}>
            Toque para treinar (+{PROFICIENCY_BONUS}). Segure para ver a
            descrição.
          </Text>

          {/* Renderização Agrupada */}
          <View style={styles.groupsWrapper}>
            {SKILL_GROUPS.map((group) => {
              const attrName = group.attribute as AttributeName;
              const attrMod = character.attributes[attrName]?.modifier || 0;
              const formattedMod = attrMod >= 0 ? `+${attrMod}` : `${attrMod}`;

              return (
                <View key={group.attribute} style={styles.groupContainer}>
                  {/* CABEÇALHO DO GRUPO */}
                  <View style={styles.groupHeader}>
                    <Text style={styles.attributeLabel}>
                      {group.attribute}{" "}
                      <Text style={styles.modTextHighlight}>
                        {formattedMod}
                      </Text>
                    </Text>
                    <View style={styles.line} />
                  </View>

                  <View style={styles.skillsContainer}>
                    {group.skills.map((skill) => {
                      const isTrained =
                        character.trainedSkills?.includes(skill);

                      // Cálculo do Bônus Total
                      const skillTotal =
                        attrMod + (isTrained ? PROFICIENCY_BONUS : 0);
                      const formattedTotal =
                        skillTotal >= 0 ? `+${skillTotal}` : `${skillTotal}`;

                      return (
                        <TouchableOpacity
                          key={skill}
                          style={[
                            styles.skillChip,
                            isTrained && styles.skillChipActive,
                          ]}
                          onPress={() => toggleTrainedSkill(skill)}
                          onLongPress={() => handleShowDescription(skill)} // <--- Descrição aqui
                          delayLongPress={500}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.skillText,
                              isTrained && styles.skillTextActive,
                            ]}
                          >
                            {skill}
                          </Text>

                          {/* Pílula do Valor */}
                          <View
                            style={[
                              styles.modPill,
                              isTrained
                                ? { backgroundColor: "rgba(255,255,255,0.25)" }
                                : { backgroundColor: colors.border },
                            ]}
                          >
                            <Text
                              style={[
                                styles.modPillText,
                                isTrained && styles.skillTextActive,
                              ]}
                            >
                              {formattedTotal}
                            </Text>
                          </View>

                          {isTrained && (
                            <Ionicons
                              name="checkmark-circle"
                              size={16}
                              color="#fff"
                              style={{ marginLeft: 4 }}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.divider} />

        {/* --- SEÇÃO 2: HISTÓRIA --- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="book" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>História do Personagem</Text>
          </View>

          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              multiline={true}
              placeholder="Escreva aqui a origem, feitos e motivações do seu personagem..."
              placeholderTextColor={colors.textSecondary}
              value={character.backstory}
              onChangeText={updateBackstory}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --- ESTILOS DINÂMICOS ---
const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16 },

    section: { marginBottom: 30 },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 8,
    },
    sectionTitle: { fontSize: 18, fontWeight: "bold", color: colors.text },
    helperText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 12,
      fontStyle: "italic",
    },

    divider: { height: 1, backgroundColor: colors.border, marginVertical: 20 },

    // Grupos
    groupsWrapper: { gap: 24 },
    groupContainer: { gap: 10 },

    groupHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    attributeLabel: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    modTextHighlight: {
      color: colors.primary,
    },
    line: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
      opacity: 0.5,
    },

    // Chips
    skillsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    skillChip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.inputBg,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 1,
    },
    skillChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      elevation: 3,
    },
    skillText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: "500",
      marginRight: 6,
    },
    skillTextActive: {
      color: "#fff",
      fontWeight: "bold",
    },

    // Pílula do Modificador
    modPill: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
      minWidth: 26,
      alignItems: "center",
      justifyContent: "center",
    },
    modPillText: {
      fontSize: 12,
      fontWeight: "bold",
      color: colors.text,
    },

    // Textarea
    textAreaContainer: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      height: 300,
      elevation: 2,
      marginBottom: 50,
    },
    textArea: {
      flex: 1,
      fontSize: 16,
      lineHeight: 24,
      color: colors.text,
      // height: "50%",
      textAlignVertical: "top",
    },
  });
