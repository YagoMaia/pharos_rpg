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
import { EntityType, MonsterEntry, NpcEntry } from "@/types/campaign";
import { useCampaign } from "@/context/CampaignContext";
import { useWebSocket } from "@/context/WebSocketContext";
import { useAlert } from "@/context/AlertContext";
import { libraryToCombatant } from "@/utils/combatantFactory";
import { TextInput, Modal } from "react-native";

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

  // Combat states
  const { combatants, addCombatant } = useCampaign();
  const { sendMessage, isConnected } = useWebSocket();
  const { showAlert } = useAlert();
  
  const [qtyModalVisible, setQtyModalVisible] = useState(false);
  const [selectedCombatEntity, setSelectedCombatEntity] = useState<NpcEntry | MonsterEntry | null>(null);
  const [quantity, setQuantity] = useState("1");

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

  const handleCombatAction = (entity: NpcEntry | MonsterEntry) => {
    setSelectedCombatEntity(entity);
    setQuantity("1");
    setQtyModalVisible(true);
  };

  const confirmAddToCombat = () => {
    if (!selectedCombatEntity) return;
    const qty = parseInt(quantity) || 1;

    const baseName = selectedCombatEntity.name.replace(/ #\d+$/, "").trim();

    const existingSameName = combatants.filter(
      (c) => c.name === baseName || c.name.startsWith(`${baseName} #`),
    );

    let highestNumber = 0;
    if (existingSameName.length > 0) {
      existingSameName.forEach((c) => {
        if (c.name === baseName) {
          highestNumber = Math.max(highestNumber, 1);
        } else {
          const match = c.name.match(/ #(\d+)$/);
          if (match && match[1]) {
            highestNumber = Math.max(highestNumber, parseInt(match[1]));
          }
        }
      });
    }

    for (let i = 0; i < qty; i++) {
      // Usa agilidade/destreza se houver, senao bonus base 0
      const attrs: any = (selectedCombatEntity.stats as any)?.attributes || {};
      const agiVal = attrs["Destreza"]?.modifier || attrs["Agilidade"]?.value || 0;
      const init = Math.floor(Math.random() * 20) + 1 + Number(agiVal);

      const nextNumber = highestNumber + i + 1;
      const shouldNumber = qty > 1 || existingSameName.length > 0;

      const newCombatant = libraryToCombatant(selectedCombatEntity, init, nextNumber);

      if (!shouldNumber) {
        newCombatant.name = baseName;
        newCombatant.id = newCombatant.id.replace(/ #\d+$/, ""); // Remove o id numérico gerado
      } else {
        newCombatant.name = `${baseName} #${nextNumber}`;
      }

      // Envio
      if (isConnected) {
        sendMessage("GM_ADD_NPC", newCombatant);
      } else {
        addCombatant(
          newCombatant.name,
          newCombatant.hp.max,
          init,
          "npc",
          newCombatant,
        );
      }
    }

    const modeMsg = isConnected ? "enviados ao servidor" : "adicionados (Offline)";
    showAlert("Sucesso", `${qty}x ${baseName} ${modeMsg}.`);
    setQtyModalVisible(false);
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
                onCombatAction={(activeTab === "npc" || activeTab === "monster") ? () => handleCombatAction(item as any) : undefined}
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

      {/* Modal Quantidade Combate */}
      <Modal visible={qtyModalVisible} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={styles.qtyBox}>
            <Text style={styles.qtyTitle}>Adicionar ao Combate</Text>
            <Text
              style={{
                color: colors.textSecondary,
                marginBottom: 10,
                textAlign: "center",
              }}
            >
              Quantos {selectedCombatEntity?.name}?
            </Text>
            <TextInput
              style={styles.qtyInput}
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
              autoFocus
              selectTextOnFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                onPress={() => setQtyModalVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmAddToCombat}
                style={styles.confirmBtn}
              >
                <Text style={styles.saveText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
    alignItems: "center",
  },
  qtyBox: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 12,
    width: "80%",
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qtyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  qtyInput: {
    backgroundColor: colors.inputBg,
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    padding: 12,
    borderRadius: 8,
    color: colors.text,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalBtns: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1,
    padding: 12,
    backgroundColor: colors.inputBg,
    alignItems: "center",
    borderRadius: 8,
  },
  confirmBtn: {
    flex: 1,
    padding: 12,
    backgroundColor: "#c62828",
    alignItems: "center",
    borderRadius: 8,
  },
  cancelText: { color: colors.textSecondary, fontWeight: "bold" },
  saveText: { color: "#fff", fontWeight: "bold" },
});
