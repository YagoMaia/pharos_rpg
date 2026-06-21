import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { usePlayer } from "@/context/PlayerContext";
import { Ionicons } from "@expo/vector-icons";

export default function CampaignDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { getMembershipByCampaign } = usePlayer();
  const membership = getMembershipByCampaign(id);
  const [activeTab, setActiveTab] = useState("overview");

  if (!membership) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={{ color: colors.text }}>Campanha não encontrada.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.primary }}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const tabs = [
    { id: "overview", label: "Visão Geral" },
    { id: "locations", label: "Localidades" },
    { id: "npcs", label: "NPCs" },
    { id: "items", label: "Itens" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header com voltar */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {membership.campaignName}
        </Text>
      </View>

      {/* Tabs Menu */}
      <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, activeTab === tab.id && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.tabText, { color: activeTab === tab.id ? colors.primary : colors.textSecondary }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === "overview" && (
          <View>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Mestre</Text>
              <Text style={[styles.value, { color: colors.text }]}>{membership.gmName}</Text>
              
              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>Sistema</Text>
              <Text style={[styles.value, { color: colors.text }]}>{membership.campaignSystem}</Text>

              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>Seu Personagem</Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {membership.characterId ? `Personagem vinculado (${membership.characterId})` : "Nenhum personagem vinculado ainda"}
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/(player)/sheet")}
            >
              <Ionicons name="clipboard-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.actionButtonText}>Abrir Ficha de Personagem</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === "locations" && (
          <View style={styles.emptyState}>
            <Text style={{ color: colors.textSecondary }}>O Mestre ainda não revelou localidades.</Text>
          </View>
        )}

        {activeTab === "npcs" && (
          <View style={styles.emptyState}>
            <Text style={{ color: colors.textSecondary }}>O Mestre ainda não revelou NPCs conhecidos.</Text>
          </View>
        )}

        {activeTab === "items" && (
          <View style={styles.emptyState}>
            <Text style={{ color: colors.textSecondary }}>Nenhum item revelado para você nesta campanha.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
  },
  tabsContainer: {
    borderBottomWidth: 1,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabText: {
    fontWeight: "bold",
  },
  content: {
    padding: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    textTransform: "uppercase",
    fontWeight: "bold",
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 8,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
});
