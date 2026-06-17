import React, { useState } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGMContext } from "@/context/GMContext";
import { useTheme } from "@/context/ThemeContext";
import { EntityCard } from "./EntityCard";
import { EntityType } from "@/types/campaign";

interface LibraryPickerModalProps {
  visible: boolean;
  campaignId: string;
  entityType: EntityType;
  onClose: () => void;
}

export function LibraryPickerModal({ visible, campaignId, entityType, onClose }: LibraryPickerModalProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { npcs, monsters, items, locations, linkEntityToCampaign, getCampaignById } = useGMContext();
  const [search, setSearch] = useState("");

  const campaign = getCampaignById(campaignId);

  const getSourceData = () => {
    switch (entityType) {
      case "npc": return npcs;
      case "monster": return monsters;
      case "item": return items;
      case "location": return locations;
      default: return [];
    }
  };

  const getLinkedIds = () => {
    if (!campaign) return [];
    switch (entityType) {
      case "npc": return campaign.linkedNpcIds;
      case "monster": return campaign.linkedMonsterIds;
      case "item": return campaign.linkedItemIds;
      case "location": return campaign.linkedLocationIds;
      default: return [];
    }
  };

  const sourceData = getSourceData();
  const linkedIds = getLinkedIds();

  // Filter out already linked and by search
  const availableEntities = sourceData.filter(e => {
    if (linkedIds.includes(e.id)) return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getTitle = () => {
    switch (entityType) {
      case "npc": return "Adicionar NPC";
      case "monster": return "Adicionar Monstro";
      case "item": return "Adicionar Item";
      case "location": return "Adicionar Local";
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{getTitle()}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar na biblioteca..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <FlatList
          data={availableEntities}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Nenhum item disponível na biblioteca (ou todos já foram adicionados).
            </Text>
          }
          renderItem={({ item }) => (
            <EntityCard
              entity={item}
              type={entityType}
              onPress={() => {
                linkEntityToCampaign(campaignId, entityType, item.id);
                // Optionally close after one selection, but multiple is nicer
              }}
              actionIcon="add"
              onAction={() => linkEntityToCampaign(campaignId, entityType, item.id)}
            />
          )}
        />
      </View>
    </Modal>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBg,
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    color: colors.text,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
  emptyText: {
    textAlign: "center",
    color: colors.textSecondary,
    marginTop: 32,
    fontStyle: "italic",
  },
});
