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
import { useCharacter } from "../../context/CharacterContext";
import { useTheme } from "../../context/ThemeContext";
import { AttributeName } from "../../types/rpg";

// Definição dos Grupos de Perícias
const SKILL_GROUPS = [
  {
    attribute: "Força",
    skills: ["Atletismo"],
  },
  {
    attribute: "Destreza",
    skills: ["Acrobacia", "Furtividade", "Prestidigitação"],
  },
  {
    attribute: "Inteligência",
    skills: ["Arcanismo", "História", "Investigação", "Natureza", "Religião"],
  },
  {
    attribute: "Sabedoria",
    skills: [
      "Adestrar Animais",
      "Intuição",
      "Medicina",
      "Percepção",
      "Sobrevivência",
    ],
  },
  {
    attribute: "Carisma",
    skills: ["Atuação", "Enganação", "Intimidação", "Persuasão"],
  },
];

export default function BiographyScreen() {
  const { character, updateBackstory, toggleTrainedSkill } = useCharacter();

  // Hook do Tema
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  // Bônus de Proficiência (Fixo em +2 para nível 1)
  const PROFICIENCY_BONUS = 2;

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
            Toque para marcar as perícias em que você é proficiente (+
            {PROFICIENCY_BONUS}).
          </Text>

          {/* Renderização Agrupada */}
          <View style={styles.groupsWrapper}>
            {SKILL_GROUPS.map((group) => {
              // 1. BUSCA O MODIFICADOR DO ATRIBUTO DESTE GRUPO
              const attrName = group.attribute as AttributeName;
              const attrMod = character.attributes[attrName]?.modifier || 0;
              const formattedMod = attrMod >= 0 ? `+${attrMod}` : `${attrMod}`;

              return (
                <View key={group.attribute} style={styles.groupContainer}>
                  {/* CABEÇALHO DO GRUPO COM O MODIFICADOR */}
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

                      // Calcula o valor final da perícia (Mod Atributo + Proficiência se treinado)
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
                          activeOpacity={0.7}
                        >
                          {/* Nome da Perícia */}
                          <Text
                            style={[
                              styles.skillText,
                              isTrained && styles.skillTextActive,
                            ]}
                          >
                            {skill}
                          </Text>

                          {/* Valor Total da Perícia (Pílula pequena) */}
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

    // Header do Grupo (Ex: FORÇA +2)
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
      color: colors.primary, // Cor de destaque para o número (+2)
    },
    line: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
      opacity: 0.5,
    },

    // Chips de Perícia
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

    // Pílula do Modificador Individual da Perícia
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

    // Área de Texto
    textAreaContainer: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      minHeight: 300,
      elevation: 2,
      marginBottom: 50,
    },
    textArea: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.text,
      height: "100%",
      textAlignVertical: "top",
    },
  });
