import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View, StatusBar } from "react-native";

// Contexto e Componentes
import { DiceRoller } from "@/components/rpg/DiceRoller";
import { useTheme } from "@/context/ThemeContext";

export default function DiceScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const [history, setHistory] = useState<{ dice: string; val: number }[]>([]);
  const [lastRoll, setLastRoll] = useState<number | null>(null);

  const handleRollResult = (sides: number, result: number) => {
    setLastRoll(result);
    setHistory((prev) =>
      [{ dice: `d${sides}`, val: result }, ...prev].slice(0, 10),
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* --- RESULTADO DESTAQUE --- */}
      <View style={styles.resultContainer}>
        <Text style={styles.resultLabel}>Resultado</Text>
        <View style={styles.valueCircle}>
          <Text style={styles.resultValue}>
            {lastRoll !== null ? lastRoll : "?"}
          </Text>
        </View>
      </View>

      <View style={styles.diceSection}>
        <Text style={styles.sectionTitle}>Mesa de Dados</Text>
        <DiceRoller onRoll={handleRollResult} color={colors.primary} />
      </View>

      {/* --- HISTÓRICO --- */}
      <View style={styles.historySection}>
        <View style={styles.historyHeader}>
          <MaterialCommunityIcons
            name="history"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.historyTitle}>Histórico Recente</Text>
        </View>

        <View style={styles.historyList}>
          {history.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="dice-multiple-outline" size={40} color={colors.border} />
              <Text style={styles.emptyText}>Role os dados para começar</Text>
            </View>
          ) : (
            history.map((h, i) => (
              <View key={i} style={styles.historyRow}>
                <View style={styles.diceIconBox}>
                  <Text style={styles.historyDice}>{h.dice}</Text>
                </View>
                <View style={styles.dots} />
                <Text style={styles.historyValue}>{h.val}</Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 40 },

    resultContainer: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 24,
      alignItems: "center",
      marginBottom: 32,
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
    },
    resultLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      textTransform: "uppercase",
      fontWeight: "900",
      letterSpacing: 2,
      marginBottom: 16,
    },
    valueCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.inputBg,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 4,
      borderColor: colors.primary,
    },
    resultValue: {
      fontSize: 56,
      fontWeight: "900",
      color: colors.text,
      includeFontPadding: false,
    },

    diceSection: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "900",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 1.5,
      marginBottom: 16,
    },

    // Histórico
    historySection: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    historyHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 20,
    },
    historyTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
    },
    historyList: { gap: 12 },
    historyRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 8,
    },
    diceIconBox: {
      backgroundColor: colors.inputBg,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    historyDice: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: "bold",
      textTransform: "uppercase",
    },
    dots: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: 12,
      opacity: 0.5,
    },
    historyValue: {
      fontSize: 18,
      fontWeight: "900",
      color: colors.text,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 40,
      gap: 12,
    },
    emptyText: {
      textAlign: "center",
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: "500",
    },
  });
