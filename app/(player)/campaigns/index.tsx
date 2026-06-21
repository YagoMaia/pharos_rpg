import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { usePlayer } from "@/context/PlayerContext";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";

export default function CampaignsScreen() {
  const { colors } = useTheme();
  const { memberships, joinCampaignByCode } = usePlayer();
  const [isModalVisible, setModalVisible] = useState(false);
  const [code, setCode] = useState("");

  const handleJoinCampaign = async () => {
    if (!code) return;
    const res = await joinCampaignByCode(code.trim().toUpperCase());
    if (res.success) {
      Alert.alert("Sucesso", "Você entrou na campanha!");
      setModalVisible(false);
      setCode("");
    } else {
      Alert.alert("Erro", res.error || "Erro ao entrar na campanha.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
                <Text style={[styles.name, { color: colors.text }]}>{m.campaignName}</Text>
                <Text style={{ color: colors.textSecondary }}>{m.campaignSystem} • Mestre: {m.gmName}</Text>
                <View style={styles.statusRow}>
                  <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.badgeText}>{m.status}</Text>
                  </View>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    Última sessão: {new Date(m.lastActivity).toLocaleDateString()}
                  </Text>
                </View>
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

      {/* Modal Entrar em Campanha */}
      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Entrar em uma Campanha</Text>
            <Text style={{ color: colors.textSecondary, marginBottom: 10 }}>Insira o código de acesso:</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="Ex: FARO-4721"
              placeholderTextColor={colors.textSecondary}
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
                <Text style={{ color: colors.text }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.primary }]} onPress={handleJoinCampaign}>
                <Text style={{ color: "#fff", fontWeight: "bold" }}>Entrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
});
