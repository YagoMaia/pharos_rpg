import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

// Contexto e Componentes
import { DiceRoller } from "@/components/rpg/DiceRoller";
import { useTheme } from "@/context/ThemeContext";
import { useGMContext } from "@/context/GMContext";

export default function GMDashboard() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const router = useRouter();

  const { campaigns, npcs, monsters, items, locations } = useGMContext();

  const [history, setHistory] = useState<{ dice: string; val: number }[]>([]);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [showDice, setShowDice] = useState(false);

  const activeCampaigns = campaigns.filter((c) => c.status === "active").slice(0, 3);
  
  // Combina todas as entidades para pegar as mais recentes
  const recentEntities = useMemo(() => {
    const all = [
      ...npcs.map(e => ({ ...e, _type: "NPC", icon: "account" })),
      ...monsters.map(e => ({ ...e, _type: "Monstro", icon: "skull" })),
      ...items.map(e => ({ ...e, _type: "Item", icon: "sword" })),
      ...locations.map(e => ({ ...e, _type: "Local", icon: "map-marker" })),
    ];
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4);
  }, [npcs, monsters, items, locations]);

  const handleRollResult = (sides: number, result: number) => {
    setLastRoll(result);
    setHistory((prev) => [{ dice: `d${sides}`, val: result }, ...prev].slice(0, 10));
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* --- CAMPANHAS ATIVAS --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Campanhas Ativas</Text>
          <TouchableOpacity onPress={() => router.push("/(gm)/campaigns")}>
            <Text style={styles.seeAll}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        {activeCampaigns.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nenhuma campanha ativa</Text>
          </View>
        ) : (
          activeCampaigns.map((camp) => (
            <TouchableOpacity 
              key={camp.id} 
              style={styles.campaignCard}
              onPress={() => router.push(`/(gm)/campaigns/${camp.id}`)}
            >
              <View>
                <Text style={styles.campaignName}>{camp.name}</Text>
                <Text style={styles.campaignSystem}>{camp.system} • {camp.playerIds.length} jogadores</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))
        )}

        {/* --- ADICIONADOS RECENTEMENTE --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Adicionados Recentemente</Text>
          <TouchableOpacity onPress={() => router.push("/(gm)/library")}>
            <Text style={styles.seeAll}>Biblioteca</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recentGrid}>
          {recentEntities.length === 0 ? (
            <Text style={styles.emptyText}>Biblioteca vazia</Text>
          ) : (
            recentEntities.map((entity) => (
              <View key={entity.id} style={styles.recentCard}>
                <MaterialCommunityIcons name={entity.icon as any} size={24} color={colors.primary} />
                <View style={styles.recentInfo}>
                  <Text style={styles.recentName} numberOfLines={1}>{entity.name}</Text>
                  <Text style={styles.recentType}>{entity._type}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* --- DICE ROLLER COLAPSÁVEL --- */}
        <TouchableOpacity 
          style={styles.diceHeader} 
          onPress={() => setShowDice(!showDice)}
        >
          <View style={styles.diceHeaderLeft}>
            <MaterialCommunityIcons name="dice-d20" size={24} color="#c62828" />
            <Text style={styles.sectionTitle}>Rolador de Dados</Text>
          </View>
          <Ionicons name={showDice ? "chevron-up" : "chevron-down"} size={24} color={colors.text} />
        </TouchableOpacity>

        {showDice && (
          <View style={styles.diceContainer}>
            <View style={styles.resultContainer}>
              <Text style={styles.resultLabel}>Último Resultado</Text>
              <Text style={styles.resultValue}>{lastRoll !== null ? lastRoll : "-"}</Text>
            </View>
            <DiceRoller onRoll={handleRollResult} color="#c62828" />
            
            <View style={styles.historySection}>
              <View style={styles.historyHeader}>
                <MaterialCommunityIcons name="history" size={20} color={colors.textSecondary} />
                <Text style={styles.historyTitle}>Histórico de Rolagens</Text>
              </View>
              <View style={styles.historyList}>
                {history.length === 0 ? (
                  <Text style={styles.emptyText}>Nenhum dado rolado ainda.</Text>
                ) : (
                  history.map((h, i) => (
                    <View key={i} style={styles.historyRow}>
                      <Text style={styles.historyDice}>{h.dice}</Text>
                      <View style={styles.dots} />
                      <Text style={styles.historyValue}>{h.val}</Text>
                    </View>
                  ))
                )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* FAB - Nova Campanha */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push("/(gm)/campaigns/new")}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 100 },
    
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 20,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
    },
    seeAll: {
      color: colors.primary,
      fontSize: 14,
    },
    emptyCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 20,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: "dashed",
    },
    emptyText: {
      color: colors.textSecondary,
      fontStyle: "italic",
    },
    campaignCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    campaignName: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 4,
    },
    campaignSystem: {
      fontSize: 12,
      color: colors.textSecondary,
    },

    recentGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    recentCard: {
      width: "48%",
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    recentInfo: {
      marginLeft: 10,
      flex: 1,
    },
    recentName: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.text,
    },
    recentType: {
      fontSize: 12,
      color: colors.textSecondary,
    },

    diceHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 30,
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    diceHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    diceContainer: {
      marginTop: 16,
    },
    resultContainer: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      alignItems: "center",
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    resultLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      textTransform: "uppercase",
      fontWeight: "bold",
      letterSpacing: 1,
    },
    resultValue: {
      fontSize: 60,
      fontWeight: "bold",
      color: "#c62828",
    },
    historySection: {
      marginTop: 20,
      backgroundColor: colors.inputBg,
      borderRadius: 16,
      padding: 16,
    },
    historyHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 10,
    },
    historyTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
    },
    historyList: { gap: 8 },
    historyRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 4,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + "40",
    },
    historyDice: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: "bold",
      textTransform: "uppercase",
    },
    dots: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: 10,
      opacity: 0.3,
    },
    historyValue: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
    },

    fab: {
      position: "absolute",
      bottom: 20,
      right: 20,
      backgroundColor: "#c62828",
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
  });
