import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { usePlayer } from "@/context/PlayerContext";
import { useCharacter } from "@/context/CharacterContext";
import { useAlert } from "@/context/AlertContext";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";

export default function CharactersScreen() {
  const { colors } = useTheme();
  const { profile, memberships } = usePlayer();
  const { character, resetCharacter } = useCharacter();
  const { showAlert } = useAlert();

  const hasCharacter = character && (character.class !== undefined || character.name !== "Novo Personagem");

  const handleContextMenu = () => {
    showAlert("Ações do Personagem", "O que deseja fazer?", [
      { text: "Editar", style: "default" },
      { text: "Duplicar", style: "default" },
      { text: "Exportar", style: "default" },
      { 
        text: "Excluir", 
        style: "destructive", 
        onPress: () => {
          resetCharacter();
          showAlert("Excluído", "Personagem removido com sucesso.");
        } 
      },
      { text: "Cancelar", style: "cancel" }
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Meus Personagens</Text>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={() => router.push("/(player)/characters/create")}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Novo</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.list}>
        {hasCharacter ? (
          <TouchableOpacity 
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push("/(player)/sheet/home")}
          >
            <View style={[styles.avatar, { backgroundColor: colors.primary, overflow: "hidden" }]}>
              {character.image ? (
                <Image source={{ uri: character.image }} style={{ width: "100%", height: "100%" }} />
              ) : null}
            </View>
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.text }]}>{character.name}</Text>
              <Text style={{ color: colors.textSecondary }}>Pharos • {character.class || "Sem Classe"} • Nível {character.level}</Text>
              <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
                HP: {character.stats?.hp?.current ?? character.hp?.current} / {character.stats?.hp?.max ?? character.hp?.max}
              </Text>
              
              {memberships && memberships.length > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
                  <Ionicons name="map" size={12} color={colors.primary} />
                  <Text style={[styles.badgeText, { color: colors.primary }]}>
                    {memberships[0].campaignName}
                  </Text>
                </View>
              )}
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <TouchableOpacity style={{ padding: 8 }} onPress={handleContextMenu}>
                <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} style={{ marginTop: 8 }} />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Você ainda não tem nenhum personagem.
            </Text>
            <TouchableOpacity style={[styles.createButton, { borderColor: colors.primary }]} onPress={() => router.push("/(player)/characters/create")}>
              <Text style={{ color: colors.primary, fontWeight: "bold" }}>Criar Personagem</Text>
            </TouchableOpacity>
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
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 4,
  },
  list: {
    padding: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  createButton: {
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
});
