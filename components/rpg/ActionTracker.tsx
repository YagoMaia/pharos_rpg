import { useTheme } from "@/context/ThemeContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Definição dos tipos de ação
export type ActionType = "standard" | "bonus" | "reaction";

interface ActionTrackerProps {
  turnActions: {
    standard: boolean;
    bonus: boolean;
    reaction: boolean;
  };
  onToggle: (type: ActionType) => void;
}

export const ActionTracker = ({
  turnActions,
  onToggle,
}: ActionTrackerProps) => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const actionsConfig: {
    type: ActionType;
    label: string;
    icon: any;
    color: string;
  }[] = [
    {
      type: "standard",
      label: "Padrão",
      icon: "sword-cross",
      color: colors.primary,
    },
    {
      type: "bonus",
      label: "Bônus",
      icon: "star-four-points",
      color: "#fb8c00",
    },
    {
      type: "reaction",
      label: "Reação",
      icon: "shield-alert",
      color: "#8e24aa",
    },
  ];

  return (
    <View style={styles.actionsRow}>
      {actionsConfig.map(({ type, label, icon, color }) => {
        const isActive = turnActions[type];

        return (
          <TouchableOpacity
            key={type}
            style={[
              styles.actionBtn,
              {
                backgroundColor: isActive ? color : isDark ? "#2c2c2c" : "#f0f0f0",
                borderColor: isActive ? color : colors.border,
              },
            ]}
            onPress={() => onToggle(type)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.iconCircle,
              { backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.05)" }
            ]}>
              <MaterialCommunityIcons
                name={icon}
                size={16}
                color={isActive ? "#fff" : colors.textSecondary}
              />
            </View>
            <Text
              style={[
                styles.actionBtnText,
                { color: isActive ? "#fff" : colors.textSecondary },
              ]}
            >
              {label}
            </Text>
            {!isActive && (
              <View style={styles.spentOverlay}>
                <MaterialCommunityIcons name="close" size={12} color={colors.textSecondary} />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    actionsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 10,
      marginBottom: 16,
    },
    actionBtn: {
      flex: 1,
      height: 72,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
      borderWidth: 1,
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      position: "relative",
    },
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    actionBtnText: {
      fontWeight: "900",
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    spentOverlay: {
      position: "absolute",
      top: 4,
      right: 4,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: isDark ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.5)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    }
  });
