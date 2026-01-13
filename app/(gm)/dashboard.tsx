import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const DICES = [4, 6, 8, 10, 12, 20, 100];

export default function GMDashboard() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [history, setHistory] = useState<string[]>([]);
  const [lastRoll, setLastRoll] = useState<number | null>(null);

  const rollDice = (sides: number) => {
    const result = Math.floor(Math.random() * sides) + 1;
    setLastRoll(result);
    setHistory(prev => [`d${sides}: ${result}`, ...prev].slice(0, 5)); // Guarda os últimos 5
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Último Resultado (Destaque) */}
      <View style={styles.resultContainer}>
        <Text style={styles.resultLabel}>Resultado</Text>
        <Text style={styles.resultValue}>{lastRoll !== null ? lastRoll : "-"}</Text>
      </View>

      {/* Botões de Dados */}
      <Text style={styles.sectionTitle}>Rolagem Rápida</Text>
      <View style={styles.diceGrid}>
        {DICES.map(d => (
          <TouchableOpacity 
            key={d} 
            style={styles.diceBtn} 
            onPress={() => rollDice(d)}
          >
            <MaterialCommunityIcons name={`dice-d${d}` as any} size={32} color="#fff" />
            <Text style={styles.diceText}>D{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Histórico */}
      <View style={styles.historyBox}>
        <Text style={styles.sectionTitle}>Histórico</Text>
        {history.map((h, i) => (
          <Text key={i} style={styles.historyText}>{h}</Text>
        ))}
      </View>
    </ScrollView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20 },
  resultContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3
  },
  resultLabel: { fontSize: 14, color: colors.textSecondary, textTransform: 'uppercase' },
  resultValue: { fontSize: 64, fontWeight: 'bold', color: "#c62828" }, // Vermelho Mestre
  
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 12 },
  diceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 3 },
  diceBtn: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: "#c62828",
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    elevation: 2
  },
  diceText: { color: '#fff', fontWeight: 'bold', marginTop: 4 },
  
  historyBox: {
    backgroundColor: colors.inputBg,
    padding: 16,
    borderRadius: 12,
  },
  historyText: { fontSize: 16, color: colors.textSecondary, marginBottom: 4 }
});