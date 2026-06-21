import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { usePlayer } from "@/context/PlayerContext";
import { useCharacter } from "@/context/CharacterContext";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CampaignDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { getMembershipByCampaign } = usePlayer();
  const { character } = useCharacter();
  
  const membership = getMembershipByCampaign(id);
  const [activeTab, setActiveTab] = useState("overview");

  if (!membership) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={{ color: colors.text }}>Campanha não encontrada.</Text>
        <TouchableOpacity onPress={() => router.navigate("/(player)/campaigns")} style={{ marginTop: 20 }}>
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
    { id: "sheet", label: "Minha Ficha" },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header com voltar */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.navigate("/(player)/campaigns")} style={styles.backButton}>
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
              onPress={() => {
                if (tab.id === "sheet") {
                  router.push("/(player)/sheet");
                } else {
                  setActiveTab(tab.id);
                }
              }}
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
              <Text style={[styles.label, { color: colors.textSecondary }]}>Descrição</Text>
              <Text style={[styles.value, { color: colors.text }]}>Uma jornada épica pelas terras do Norte, enfrentando as criaturas de gelo.</Text>

              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>Mestre</Text>
              <Text style={[styles.value, { color: colors.text }]}>{membership.gmName}</Text>
              
              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>Sistema</Text>
              <Text style={[styles.value, { color: colors.text }]}>{membership.campaignSystem}</Text>

              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>Jogadores Presentes</Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {membership.characterId ? "Você e mais 3 jogadores" : "3 jogadores"}
              </Text>

              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>Seu Personagem</Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {character.name !== "Novo Personagem" ? `${character.name} (${character.class || "Sem classe"})` : "Nenhum personagem vinculado ainda"}
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
          <View>
            <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>Locais revelados pelo Mestre:</Text>
            {[
              { id: 1, name: "Taverna do Javali Saltitante", desc: "Ponto de encontro inicial da party. O taverneiro se chama Gus." },
              { id: 2, name: "Cavernas de Gelo", desc: "Local do último combate. Frio extremo e presença de elementais." }
            ].map(loc => (
              <View key={loc.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                  <Ionicons name="location" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.value, { color: colors.text, fontWeight: "bold" }]}>{loc.name}</Text>
                </View>
                <Text style={{ color: colors.textSecondary }}>{loc.desc}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === "npcs" && (
          <View>
            <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>NPCs conhecidos pela mesa:</Text>
            {[
              { id: 1, name: "Kaelen, o Justo", role: "Capitão da Guarda", icon: "person" },
              { id: 2, name: "Elara", role: "Maga Mercenária (Contato de Confiança)", icon: "star" }
            ].map(npc => (
              <View key={npc.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, flexDirection: "row", alignItems: "center" }]}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                  <Ionicons name={npc.icon as any} size={20} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.value, { color: colors.text, fontWeight: "bold" }]}>{npc.name}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{npc.role}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === "items" && (
          <View>
            <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>Itens da campanha descobertos:</Text>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, flexDirection: "row", alignItems: "center" }]}>
              <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: "rgba(255, 152, 0, 0.2)", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                <Ionicons name="flask" size={20} color="#FF9800" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.value, { color: colors.text, fontWeight: "bold" }]}>Amuleto de Gelo Escuro</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Item Mágico • Requer Sintonização</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
