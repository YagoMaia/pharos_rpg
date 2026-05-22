import { useTheme } from "@/context/ThemeContext";
import { Stance } from "@/types/rpg";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface StanceSelectorProps {
  stances: Stance[];
  activeStanceId?: string | null;
  turnActions: { bonus: boolean };
  onStanceChange: (newIndex: number) => void;
}

export const StanceSelector = ({
  stances,
  activeStanceId,
  turnActions,
  onStanceChange,
}: StanceSelectorProps) => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  if (!stances || stances.length === 0) return null;

  const currentStanceIdx = stances.findIndex((s) => s.id === activeStanceId);
  const isNeutral = currentStanceIdx === -1;
  const activeStance = isNeutral ? null : stances[currentStanceIdx];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Postura de Combate</Text>

      <View style={styles.toggleGroup}>
        <TouchableOpacity
          style={[styles.btn, isNeutral && styles.btnNeutralActive]}
          onPress={() => onStanceChange(-1)}
          activeOpacity={0.7}
        >
          <Text style={[styles.btnText, isNeutral && styles.btnTextActive]}>
            Neutra
          </Text>
        </TouchableOpacity>

        {stances.map((stance, index) => {
          const isActive = currentStanceIdx === index;
          const canSwitch = isActive || turnActions.bonus;

          return (
            <TouchableOpacity
              key={stance.id || index}
              style={[
                styles.btn,
                isActive && (index === 0 ? styles.btnP1Active : styles.btnP2Active),
                !canSwitch && { opacity: 0.4 },
              ]}
              onPress={() => canSwitch && onStanceChange(index)}
              disabled={!canSwitch}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.stanceName, isActive && styles.activeText]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {stance.name}
              </Text>

              {!isActive && !turnActions.bonus && (
                <View style={styles.lockBadge}>
                  <Ionicons name="lock-closed" size={8} color={colors.textSecondary} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View
        style={[
          styles.card,
          isNeutral
            ? styles.cardNeutral
            : currentStanceIdx === 0
              ? styles.cardP1
              : styles.cardP2,
        ]}
      >
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons 
            name={isNeutral ? "shield-outline" : "sword-cross"} 
            size={20} 
            color={isNeutral ? colors.textSecondary : colors.primary} 
          />
          <Text style={styles.cardTitle}>
            {isNeutral ? "Postura Neutra" : activeStance?.name}
          </Text>
        </View>

        <View style={styles.divider} />

        {isNeutral ? (
          <Text style={styles.neutralDesc}>
            Equilíbrio entre ataque e defesa. Sem bônus ou restrições específicas.
          </Text>
        ) : (
          <View style={styles.detailsList}>
            <InfoRow
              icon="plus-circle-outline"
              label="Benefício"
              text={activeStance?.benefit}
              color={colors.success}
              styles={styles}
            />
            <InfoRow
              icon="minus-circle-outline"
              label="Restrição"
              text={activeStance?.restriction}
              color={colors.error}
              styles={styles}
            />
            <InfoRow
              icon="flash-outline"
              label="Manobra"
              text={activeStance?.maneuver}
              color={colors.focus}
              styles={styles}
            />
            {activeStance?.recovery && (
              <InfoRow
                icon="refresh-circle-outline"
                label="Recuperação"
                text={activeStance.recovery}
                color={colors.primary}
                styles={styles}
              />
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const InfoRow = ({ icon, label, text, color, styles }: any) => (
  <View style={styles.infoRow}>
    <View style={styles.labelCol}>
      <MaterialCommunityIcons name={icon} size={14} color={color} />
      <Text style={[styles.infoLabel, { color }]}>{label}</Text>
    </View>
    <Text style={styles.infoText}>{text}</Text>
  </View>
);

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: { marginBottom: 16 },
    label: {
      fontSize: 14,
      fontWeight: "900",
      color: colors.textSecondary,
      marginBottom: 10,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    toggleGroup: {
      flexDirection: "row",
      backgroundColor: colors.inputBg,
      borderRadius: 12,
      padding: 4,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    btn: {
      flex: 1,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 10,
      position: "relative",
    },
    btnText: {
      fontWeight: "bold",
      color: colors.textSecondary,
      fontSize: 13,
    },
    btnTextActive: { color: colors.text },
    btnNeutralActive: { backgroundColor: colors.surface, elevation: 2 },
    btnP1Active: { backgroundColor: colors.primary, elevation: 4 },
    btnP2Active: { backgroundColor: "#c62828", elevation: 4 },
    lockBadge: {
      position: "absolute",
      top: 2,
      right: 2,
      backgroundColor: "rgba(0,0,0,0.1)",
      padding: 2,
      borderRadius: 4,
    },
    card: {
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginBottom: 8,
    },
    cardNeutral: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    cardP1: {
      backgroundColor: isDark ? colors.primary + "10" : colors.primary + "05",
      borderColor: colors.primary + "30",
    },
    cardP2: {
      backgroundColor: isDark ? "#c6282810" : "#c6282805",
      borderColor: "#c6282830",
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: "900",
      color: colors.text,
      textAlign: "center",
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginBottom: 12,
      opacity: 0.5,
    },
    neutralDesc: {
      textAlign: "center",
      fontStyle: "italic",
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    detailsList: { gap: 10 },
    infoRow: { flexDirection: "row", gap: 12 },
    labelCol: {
      width: 100,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    infoLabel: { fontWeight: "900", fontSize: 11, textTransform: "uppercase" },
    infoText: { 
      color: colors.text, 
      flex: 1, 
      fontSize: 13, 
      lineHeight: 18,
      fontWeight: "500"
    },
    stanceName: { color: colors.textSecondary, fontWeight: "bold", fontSize: 13 },
    activeText: { color: "#fff" },
  });
