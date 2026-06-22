import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, Image } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { usePlayer } from "@/context/PlayerContext";
import { useCharacter } from "@/context/CharacterContext";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { JoinCampaignModal } from "@/components/rpg/JoinCampaignModal";

export default function CampaignsScreen() {
  const { colors } = useTheme();
  const { memberships, joinCampaignByCode } = usePlayer();
  const { character } = useCharacter();
  const [isModalVisible, setModalVisible] = useState(false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Minhas Campanhas</Text>
      </View>

      <ScrollView style={styles.list}>
        {memberships.length > 0 ? (
          memberships.map((m) => (
            <TouchableOpacity 
              key={m.campaignId} 
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push(`/(player)/campaigns/${m.campaignId}`)}
            >
              <View style={[styles.coverPlaceholder, { backgroundColor: colors.primary }]} />
              <View style={styles.info}>
                <Text style={[styles.name, { color: colors.text }]}>{m.campaignName} • {m.campaignSystem}</Text>
                <Text style={{ color: colors.textSecondary }}>Mestre: {m.gmName}</Text>
                
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
                  Status: <Text style={{ fontWeight: "bold", color: m.campaignStatus === "Ativa" ? "#2ecc71" : colors.text }}>{m.campaignStatus || "Ativa"}</Text>
                </Text>

                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                  Personagem: {character.name !== "Novo Personagem" ? character.name : "Nenhum"}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                  Data da última sessão: {new Date(m.lastActivity).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Você ainda não participa de nenhuma campanha.
            </Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      <JoinCampaignModal 
        visible={isModalVisible} 
        onClose={() => setModalVisible(false)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  list: {
    padding: 16,
  },
  card: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
  },
  coverPlaceholder: {
    width: 100,
    height: "100%",
  },
  info: {
    flex: 1,
    padding: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});
