import { StatBar } from "@/components/ui/StatBar";
import { useTheme } from "@/context/ThemeContext";
import { ActiveCondition } from "@/types/rpg";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ConditionBar } from "./ConditionBadges";

interface Resource {
  current: number;
  max: number;
}

interface CombatHudProps {
  health: Resource;
  focus: Resource;
  armorClass: number; // Valor Total
  stanceMod?: number; // Modificador da Postura (opcional, para exibir a setinha)
  conditions?: ActiveCondition[]; // Condições ativas
}

export const CombatHud = ({
  health,
  focus,
  armorClass,
  stanceMod = 0,
  conditions = [],
}: CombatHudProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={styles.combatHud}>
      <View style={styles.topRow}>
        {/* --- VIDA --- */}
        <View style={styles.healthContainer}>
          <View style={styles.resourceHeader}>
            <View style={styles.labelGroup}>
              <Ionicons name="heart" size={14} color={colors.hp || "#ef5350"} />
              <Text style={styles.hudLabel}>VIDA</Text>
            </View>
            <Text style={styles.resourceValue}>
              <Text
                style={[
                  styles.resourceCurrent,
                  { color: colors.hp || "#ef5350" },
                ]}
              >
                {health.current}
              </Text>
              <Text style={styles.resourceMax}>/{health.max}</Text>
            </Text>
          </View>
          <StatBar
            current={health.current}
            max={health.max}
            color={colors.hp || "#ef5350"}
            backgroundColor={colors.inputBg}
            height={10}
          />
        </View>

        <View style={styles.verticalSeparator} />

        {/* --- DEFESA --- */}
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
            <Text style={styles.acTotal}>{armorClass}</Text>

            {/* Badge de Modificador de Postura */}
            {stanceMod !== 0 && (
              <View
                style={[
                  styles.modBadge,
                  {
                    borderColor: stanceMod > 0 ? colors.success : colors.error,
                    backgroundColor:
                      stanceMod > 0
                        ? colors.success + "20"
                        : colors.error + "20",
                  },
                ]}
              >
                <Ionicons
                  name={stanceMod > 0 ? "arrow-up" : "arrow-down"}
                  size={10}
                  color={stanceMod > 0 ? colors.success : colors.error}
                />
              </View>
            )}
          </View>
        </View>
      </View>

      {/* --- FOCO --- */}
      <View style={styles.bottomRow}>
        <View style={styles.resourceHeader}>
          <View style={styles.labelGroup}>
            <Ionicons name="flash" size={14} color={colors.focus} />
            <Text style={styles.hudLabel}>FOCO</Text>
          </View>
          <Text style={styles.resourceValue}>
            <Text style={[styles.resourceCurrent, { color: colors.focus }]}>
              {focus.current}
            </Text>
            <Text style={styles.resourceMax}>/{focus.max}</Text>
          </Text>
        </View>
        <StatBar
          current={focus.current}
          max={focus.max}
          color={colors.focus}
          backgroundColor={colors.inputBg}
          height={10}
        />
      </View>

      {/* --- CONDIÇÕES ATIVAS --- */}
      {conditions.length > 0 && (
        <View style={styles.conditionsRow}>
          <ConditionBar conditions={conditions} size="medium" />
        </View>
      )}
    </View>
  );
};

const getStyles = (colors: any) =>
  StyleSheet.create({
    combatHud: {
      backgroundColor: colors.surface,
      paddingVertical: 12,
      paddingHorizontal: 16,
      elevation: 4,
      marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 12,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    healthContainer: { flex: 1, marginRight: 16 },
    bottomRow: { width: "100%" },
    conditionsRow: {
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border + "40",
    },
    verticalSeparator: {
      width: 1,
      height: 40,
      backgroundColor: colors.border,
      marginRight: 16,
    },
    acContainer: { alignItems: "center", minWidth: 60 },
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
    acValueContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 2,
    },
    acTotal: { fontSize: 28, fontWeight: "bold", color: colors.text },
    modBadge: {
      width: 18,
      height: 18,
      borderRadius: 9,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
    },
  });
