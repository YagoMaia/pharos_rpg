import React, { useState } from "react";
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGMContext } from "@/context/GMContext";
import { useTheme } from "@/context/ThemeContext";
import { EntityCard } from "@/components/gm/EntityCard";

import { NpcFormModal } from "@/components/gm/NpcFormModal";
import { MonsterFormModal } from "@/components/gm/MonsterFormModal";
import { ItemFormModal } from "@/components/gm/ItemFormModal";
import { LocationFormModal } from "@/components/gm/LocationFormModal";
import { EntityType } from "@/types/campaign";

export default function LibraryScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const { 
    npcs, createNpc, updateNpc, deleteNpc, 
    monsters, createMonster, updateMonster, deleteMonster,
    items, createItem, updateItem, deleteItem,
    locations, createLocation, updateLocation, deleteLocation 
  } = useGMContext();

  const [activeTab, setActiveTab] = useState<EntityType>("npc");

  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const handleCreate = () => {
    setEditingItem(null);
    setModalVisible(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    switch (activeTab) {
      case "npc": deleteNpc(id); break;
      case "monster": deleteMonster(id); break;
      case "item": deleteItem(id); break;
      case "location": deleteLocation(id); break;
    }
  };

  const renderTabBtn = (tab: EntityType, label: string) => (
    <TouchableOpacity
      style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const getSourceData = () => {
    switch (activeTab) {
      case "npc": return npcs;
      case "monster": return monsters;
      case "item": return items;
      case "location": return locations;
      default: return [];
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Biblioteca</Text>
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsContent}>
          {renderTabBtn("npc", "NPCs")}
          {renderTabBtn("monster", "Monstros")}
          {renderTabBtn("item", "Itens")}
          {renderTabBtn("location", "Localidades")}
        </ScrollView>
      </View>

      <FlatList
        data={getSourceData()}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyText}>Biblioteca vazia nesta categoria.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <EntityCard
                entity={item}
                type={activeTab}
                onPress={() => handleEdit(item)}
                showCampaignBadge={true}
              />
            </View>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
              <Ionicons name="trash" size={20} color="#f44336" />
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={handleCreate}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Modals */}
      <NpcFormModal
        visible={modalVisible && activeTab === "npc"}
        onClose={() => setModalVisible(false)}
        onSave={(data) => editingItem ? updateNpc(editingItem.id, data) : createNpc(data as any)}
        initialData={editingItem}
      />
      
      <MonsterFormModal
        visible={modalVisible && activeTab === "monster"}
        onClose={() => setModalVisible(false)}
        onSave={(data) => editingItem ? updateMonster(editingItem.id, data) : createMonster(data as any)}
        initialData={editingItem}
      />

      <ItemFormModal
        visible={modalVisible && activeTab === "item"}
        onClose={() => setModalVisible(false)}
        onSave={(data) => editingItem ? updateItem(editingItem.id, data) : createItem(data as any)}
        initialData={editingItem}
      />

      <LocationFormModal
        visible={modalVisible && activeTab === "location"}
        onClose={() => setModalVisible(false)}
        onSave={(data) => editingItem ? updateLocation(editingItem.id, data) : createLocation(data as any)}
        initialData={editingItem}
      />
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
  },
  tabsScroll: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.inputBg,
  },
  tabBtnActive: {
    backgroundColor: "#c62828",
  },
  tabText: {
    color: colors.textSecondary,
    fontWeight: "bold",
  },
  tabTextActive: {
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
  deleteBtn: {
    padding: 12,
    marginLeft: 8,
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
