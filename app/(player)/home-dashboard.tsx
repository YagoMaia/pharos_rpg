import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Image } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { useCharacter } from "@/context/CharacterContext";
import { usePlayer } from "@/context/PlayerContext";
import { useAlert } from "@/context/AlertContext";
import { DiceRoller } from "@/components/rpg/DiceRoller";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function HomeDashboard() {
  const { colors } = useTheme();
  const { character } = useCharacter();
  const { profile, memberships, joinCampaignByCode } = usePlayer();
  const { showAlert } = useAlert();
  const [isModalVisible, setModalVisible] = useState(false);
  const [code, setCode] = useState("");
  const [isDiceCollapsed, setIsDiceCollapsed] = useState(true);

  const handleJoinCampaign = async () => {
    if (!code) return;
    const res = await joinCampaignByCode(code.trim().toUpperCase());
    if (res.success) {
      showAlert("Sucesso", "Você entrou na campanha!");
      setModalVisible(false);
      setCode("");
    } else {
      showAlert("Erro", res.error || "Erro ao entrar na campanha.");
    }
  };

  const handleRollResult = (sides: number, result: number) => {
    showAlert(`Resultado do D${sides}`, `Você rolou: ${result}`);
  };

  const hasActiveCharacter = character && (character.class !== undefined || character.name !== "Novo Personagem");

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.greeting, { color: colors.text }]}>
        Bem-vindo, {profile?.displayName || "Jogador"}!
      </Text>

      {/* Personagem Ativo */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Personagem Ativo</Text>
        {hasActiveCharacter ? (
          <View>
            <View style={styles.characterInfo}>
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary, overflow: "hidden" }]}>
                {character.image ? (
                  <Image source={{ uri: character.image }} style={{ width: "100%", height: "100%" }} />
                ) : null}
              </View>
              <View style={styles.characterDetails}>
                <Text style={[styles.characterName, { color: colors.text }]}>{character.name}</Text>
                <Text style={{ color: colors.textSecondary }}>{character.class || "Sem Classe"} - Nível {character.level}</Text>
              </View>
            </View>
            
            <View style={styles.barsContainer}>
              {/* HP Bar */}
              <View style={styles.barWrapper}>
                <Text style={[{ color: colors.text }, styles.barLabel]}>HP: {character.stats?.hp?.current ?? character.hp?.current} / {character.stats?.hp?.max ?? character.hp?.max}</Text>
                <View style={styles.barBackground}>
                  <View style={[styles.barFill, { backgroundColor: "#e74c3c", width: `${((character.stats?.hp?.current || character.hp?.current || 0) / (character.stats?.hp?.max || character.hp?.max || 1)) * 100}%` }]} />
                </View>
              </View>

              {/* Focus Bar */}
              <View style={styles.barWrapper}>
                <Text style={[{ color: colors.text }, styles.barLabel]}>Focus: {character.stats?.focus?.current ?? character.focus?.current} / {character.stats?.focus?.max ?? character.focus?.max}</Text>
                <View style={styles.barBackground}>
                  <View style={[styles.barFill, { backgroundColor: "#3498db", width: `${((character.stats?.focus?.current || character.focus?.current || 0) / (character.stats?.focus?.max || character.focus?.max || 1)) * 100}%` }]} />
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: colors.primary, marginTop: 10 }]}
              onPress={() => router.push("/(player)/sheet/home")}
            >
              <Text style={styles.buttonText}>Ver Ficha Completa</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ alignItems: "center", paddingVertical: 10 }}>
            <Text style={{ color: colors.textSecondary, marginBottom: 12 }}>Nenhum personagem ativo.</Text>
            <TouchableOpacity 
              style={[styles.outlineButton, { borderColor: colors.primary, width: "100%" }]}
              onPress={() => router.push("/(player)/characters/create")}
            >
              <Text style={{ color: colors.primary, fontWeight: "bold" }}>Criar um Personagem</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Minhas Campanhas */}
      <View style={{ marginTop: 20 }}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Minhas Campanhas</Text>
        {memberships.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {memberships.map((m) => (
              <TouchableOpacity
                key={m.campaignId}
                style={[styles.campaignCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => router.push(`/(player)/campaigns/${m.campaignId}`)}
              >
                <Text style={[styles.campaignName, { color: colors.text }]} numberOfLines={1}>
                  {m.campaignName}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{m.campaignSystem}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>Mestre: {m.gmName}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                  Última atividade: {new Date(m.lastActivity).toLocaleDateString()}
                </Text>
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>{m.status}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <Text style={{ color: colors.textSecondary, marginBottom: 10 }}>Você não participa de nenhuma campanha.</Text>
        )}

        <TouchableOpacity 
          style={[styles.outlineButton, { borderColor: colors.primary }]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="log-in-outline" size={20} color={colors.primary} />
          <Text style={[styles.outlineButtonText, { color: colors.primary }]}> Entrar em Campanha</Text>
        </TouchableOpacity>
      </View>

      {/* Dado Rápido */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 20 }]}>
        <TouchableOpacity 
          style={styles.collapsibleHeader} 
          onPress={() => setIsDiceCollapsed(!isDiceCollapsed)}
          activeOpacity={0.7}
        >
          <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 0 }]}>Rolagem Rápida</Text>
          <Ionicons name={isDiceCollapsed ? "chevron-down" : "chevron-up"} size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        
        {!isDiceCollapsed && (
          <View style={{ marginTop: 16 }}>
            <DiceRoller onRoll={handleRollResult} color={colors.primary} />
          </View>
        )}
      </View>

      {/* Modal Entrar em Campanha */}
      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Entrar em uma Campanha</Text>
            <Text style={{ color: colors.textSecondary, marginBottom: 10 }}>Insira o código fornecido pelo Mestre:</Text>
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

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  characterInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  characterDetails: {
    flex: 1,
  },
  characterName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  barsContainer: {
    marginBottom: 12,
  },
  barWrapper: {
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 14,
    fontWeight: "bold",
  },
  barBackground: {
    height: 8,
    backgroundColor: "#333",
    borderRadius: 4,
    marginTop: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  collapsibleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  horizontalScroll: {
    marginBottom: 16,
  },
  campaignCard: {
    width: 160,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 12,
  },
  campaignName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  badge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  outlineButton: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineButtonText: {
    fontWeight: "bold",
    fontSize: 16,
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
