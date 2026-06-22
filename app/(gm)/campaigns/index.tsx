import React, { useState } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity, Text } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useGMContext } from "@/context/GMContext";
import { useTheme } from "@/context/ThemeContext";
import { CampaignCard } from "@/components/gm/CampaignCard";
import { CampaignStatus } from "@/types/campaign";

type FilterOption = "all" | CampaignStatus;

export default function CampaignsScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const { campaigns, deleteCampaign, updateCampaign, createCampaign } = useGMContext();
  const [filter, setFilter] = useState<FilterOption>("all");

  const filteredCampaigns = campaigns.filter((c) => filter === "all" || c.status === filter);

  const duplicateCampaign = (id: string) => {
    const camp = campaigns.find(c => c.id === id);
    if (!camp) return;
    createCampaign({
      name: `${camp.name} (Cópia)`,
      description: camp.description,
      system: camp.system,
      status: "paused",
      visibility: camp.visibility,
      maxPlayers: camp.maxPlayers,
      coverImage: camp.coverImage,
      playerIds: [],
      linkedNpcIds: [...camp.linkedNpcIds],
      linkedMonsterIds: [...camp.linkedMonsterIds],
      linkedItemIds: [...camp.linkedItemIds],
      linkedLocationIds: [...camp.linkedLocationIds],
      notes: camp.notes,
    });
  };

  const renderFilterBtn = (label: string, value: FilterOption) => (
    <TouchableOpacity
      style={[styles.filterBtn, filter === value && styles.filterBtnActive]}
      onPress={() => setFilter(value)}
    >
      <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Campanhas</Text>
      </View>

      <View style={styles.filterScroll}>
        {renderFilterBtn("Todas", "all")}
        {renderFilterBtn("Ativas", "active")}
        {renderFilterBtn("Pausadas", "paused")}
        {renderFilterBtn("Encerradas", "finished")}
      </View>

      <FlatList
        data={filteredCampaigns}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="map-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyText}>Nenhuma campanha encontrada.</Text>
            {filter !== "all" && (
              <TouchableOpacity onPress={() => setFilter("all")}>
                <Text style={styles.emptyAction}>Ver todas</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <CampaignCard
            campaign={item}
            onPress={() => router.push(`/(gm)/campaigns/${item.id}`)}
            onEdit={() => router.push(`/(gm)/campaigns/new?edit=${item.id}`)}
            onDelete={() => deleteCampaign(item.id)}
            onDuplicate={() => duplicateCampaign(item.id)}
            onStatusChange={(status) => updateCampaign(item.id, { status })}
          />
        )}
      />

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push("/(gm)/campaigns/new")}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 16,
    paddingTop: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
  },
  filterScroll: {
    flexDirection: "row",
    padding: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterBtnActive: {
    backgroundColor: "#c62828",
    borderColor: "#c62828",
  },
  filterText: {
    color: colors.textSecondary,
    fontWeight: "bold",
  },
  filterTextActive: {
    color: "#fff",
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyAction: {
    marginTop: 16,
    fontSize: 16,
    color: colors.primary,
    fontWeight: "bold",
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
