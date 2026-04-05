import { useTheme } from "@/context/ThemeContext";
import { SKILL_GROUPS } from "@/data/expertiseData";
import { AttributeName, Character, ProficiencyLevel } from "@/types/rpg";
import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface SkillListProps {
  character: Character;
  // Agora passamos o novo nível para o pai salvar
  onUpdateSkillLevel: (skillName: string, newLevel: ProficiencyLevel) => void;
  onShowDescription: (skillName: string) => void;
}

// Componente Interno de Badge para os níveis NT, T, E, EX
const ProficiencyBadge = ({
  level,
  onPress,
}: {
  level: ProficiencyLevel;
  onPress: () => void;
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const config = {
    0: { label: "NT", color: colors.textSecondary, bg: colors.inputBg },
    1: { label: "T", color: "#fff", bg: "#2e7d32" }, // Treinado (+2)
    2: { label: "E", color: "#fff", bg: "#1565c0" }, // Especialista (+4)
    3: { label: "EX", color: "#fff", bg: "#6a1b9a" }, // Expert (+6)
  };

  const current = config[level];

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.badgeContainer, { backgroundColor: current.bg }]}
    >
      <Text style={[styles.badgeText, { color: current.color }]}>
        {current.label}
      </Text>
    </TouchableOpacity>
  );
};

export const SkillList = ({
  character,
  onUpdateSkillLevel,
  onShowDescription,
}: SkillListProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const handleCycleLevel = (
    skillName: string,
    currentLevel: ProficiencyLevel,
  ) => {
    // Cicla entre 0, 1, 2, 3 e volta para 0
    const nextLevel = ((currentLevel + 1) % 4) as ProficiencyLevel;
    onUpdateSkillLevel(skillName, nextLevel);
  };

  return (
    <View style={styles.groupsWrapper}>
      {SKILL_GROUPS.map((group) => {
        const attrName = group.attribute as AttributeName;
        const attrMod = character.attributes[attrName]?.modifier || 0;
        const formattedMod = attrMod >= 0 ? `+${attrMod}` : `${attrMod}`;

        return (
          <View key={group.attribute} style={styles.groupContainer}>
            {/* CABEÇALHO DO GRUPO (ATRIBUTO) [cite: 13, 20] */}
            <View style={styles.groupHeader}>
              <Text style={styles.attributeLabel}>
                {group.attribute}{" "}
                <Text style={styles.modTextHighlight}>{formattedMod}</Text>
              </Text>
              <View style={styles.line} />
            </View>

            <View style={styles.skillsListContainer}>
              {group.skills.map((skillName) => {
                // Busca o nível da perícia no objeto do personagem
                const skillData = character.skills?.find(
                  (s) => s.name === skillName,
                );
                const currentLevel = skillData?.level || 0;

                // Cálculo de Pharos: Modificador + (Nível * 2)
                const skillTotal = attrMod + currentLevel * 2;
                const formattedTotal =
                  skillTotal >= 0 ? `+${skillTotal}` : `${skillTotal}`;

                return (
                  <View key={skillName} style={styles.skillRow}>
                    <View style={styles.skillInfo}>
                      <ProficiencyBadge
                        level={currentLevel}
                        onPress={() =>
                          handleCycleLevel(skillName, currentLevel)
                        }
                      />

                      <TouchableOpacity
                        onPress={() => onShowDescription(skillName)}
                        activeOpacity={0.6}
                      >
                        <Text style={styles.skillNameText}>{skillName}</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.totalContainer}>
                      <Text style={styles.totalText}>{formattedTotal}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const getStyles = (colors: any) =>
  StyleSheet.create({
    groupsWrapper: { gap: 28 },
    groupContainer: { gap: 12 },
    groupHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
    attributeLabel: {
      fontSize: 13,
      fontWeight: "900",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 1.2,
    },
    modTextHighlight: { color: colors.primary },
    line: { flex: 1, height: 1, backgroundColor: colors.border, opacity: 0.3 },

    // Lista em formato de linhas (mais legível para badges)
    skillsListContainer: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    skillRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + "40",
    },
    skillInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    skillNameText: {
      fontSize: 15,
      color: colors.text,
      fontWeight: "500",
    },

    // Badge Styles
    badgeContainer: {
      width: 34,
      height: 22,
      borderRadius: 4,
      justifyContent: "center",
      alignItems: "center",
    },
    badgeText: {
      fontSize: 10,
      fontWeight: "bold",
    },

    // Total Bonus Style
    totalContainer: {
      backgroundColor: colors.inputBg,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      minWidth: 35,
      alignItems: "center",
    },
    totalText: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.primary,
    },
  });
