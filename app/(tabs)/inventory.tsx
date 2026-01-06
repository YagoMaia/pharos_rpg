// app/(tabs)/inventory.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useCharacter } from "../../context/CharacterContext";
import { EquipmentItem, Item, ItemType } from "../../types/rpg";

type EquipSlotType = "meleeWeapon" | "rangedWeapon" | "armor";

export default function InventoryScreen() {
  const { character, updateEquipment } = useCharacter();

  // Estados para o Modal de Edição
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<EquipSlotType | null>(null);
  const [editName, setEditName] = useState("");
  const [editStats, setEditStats] = useState("");

  // Função para abrir o modal com os dados do slot clicado
  const handleEditSlot = (slot: EquipSlotType, item: EquipmentItem) => {
    setSelectedSlot(slot);
    setEditName(item.name);
    setEditStats(item.stats);
    setModalVisible(true);
  };

  // Salvar alterações
  const saveEquipment = () => {
    if (selectedSlot) {
      updateEquipment(selectedSlot, editName, editStats);
      setModalVisible(false);
    }
  };

  // ... (Função getBadgeInfo mantida igual) ...
  const getBadgeInfo = (type: ItemType) => {
    switch (type) {
      case "consumable":
        return { label: "Consumível", bg: "#e0f2f1", text: "#00695c" };
      case "key":
        return { label: "Item Chave", bg: "#fff8e1", text: "#ff8f00" };
      case "equipment":
        return { label: "Equipamento", bg: "#f3e5f5", text: "#7b1fa2" };
      default:
        return { label: "Item", bg: "#eee", text: "#333" };
    }
  };

  const renderItem = ({ item }: { item: Item }) => {
    const badge = getBadgeInfo(item.type);
    return (
      <View style={styles.itemRow}>
        <View style={styles.itemMain}>
          <Text style={styles.itemName}>{item.name}</Text>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>
              {badge.label}
            </Text>
          </View>
        </View>
        <Text style={styles.itemQty}>x{item.quantity}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Seção Fixa: Equipamentos */}
      <View style={styles.equipSection}>
        <Text style={styles.sectionTitle}>Equipamento Atual</Text>

        <View style={styles.equipRow}>
          <EquipSlot
            label="Curto Alcance"
            item={character.equipment.meleeWeapon}
            icon="cut" // Ícone de espada/corte
            onPress={() =>
              handleEditSlot("meleeWeapon", character.equipment.meleeWeapon)
            }
          />
          <EquipSlot
            label="Longo Alcance"
            item={character.equipment.rangedWeapon}
            icon="locate" // Ícone de mira
            onPress={() =>
              handleEditSlot("rangedWeapon", character.equipment.rangedWeapon)
            }
          />
        </View>

        <EquipSlot
          label="Armadura"
          item={character.equipment.armor}
          icon="shield" // Ícone de escudo
          fullWidth
          onPress={() => handleEditSlot("armor", character.equipment.armor)}
        />
      </View>

      {/* Seção Scrollável: Mochila */}
      <View style={styles.backpackSection}>
        <Text style={styles.sectionHeader}>Mochila</Text>
        <FlatList
          data={character.backpack}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>

      {/* --- MODAL DE EDIÇÃO DE EQUIPAMENTO --- */}
      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Editar Equipamento</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nome do Item</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {selectedSlot === "armor"
                  ? "Bônus de Defesa (CA)"
                  : "Dano (ex: 1d6 + 2)"}
              </Text>
              <TextInput
                style={styles.input}
                value={editStats}
                onChangeText={setEditStats}
                placeholder={selectedSlot === "armor" ? "+2 CA" : "1d6"}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveEquipment} style={styles.saveBtn}>
                <Text style={styles.saveText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Componente EquipSlot Atualizado (Clicável e com Stats)
const EquipSlot = ({ label, item, fullWidth, onPress, icon }: any) => (
  <TouchableOpacity
    style={[styles.slot, fullWidth ? { width: "100%" } : { flex: 1 }]}
    activeOpacity={0.7}
    onPress={onPress}
  >
    <View style={styles.slotHeader}>
      <Text style={styles.slotLabel}>{label}</Text>
      <Ionicons name={icon} size={14} color="#666" />
    </View>

    <Text style={styles.slotValue} numberOfLines={1}>
      {item.name}
    </Text>

    {/* Exibe o Dano ou CA em destaque */}
    <View style={styles.statsBadge}>
      <Text style={styles.statsText}>{item.stats}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f2f5" },
  equipSection: {
    backgroundColor: "#fff",
    padding: 16,
    elevation: 2,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  equipRow: { flexDirection: "row", gap: 10, marginBottom: 10 },

  // Estilos do Slot Atualizados
  slot: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    minHeight: 90, // Altura mínima para ficar bonito
    justifyContent: "space-between",
  },
  slotHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  slotLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    color: "#888",
    fontWeight: "bold",
  },
  slotValue: { fontSize: 16, fontWeight: "bold", color: "#222" },

  statsBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#eceff1",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  statsText: { fontSize: 12, fontWeight: "bold", color: "#546e7a" },

  // Resto da lista (Mochila) mantido...
  backpackSection: { flex: 1, backgroundColor: "#fff" },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 16,
    marginBottom: 8,
    marginTop: 8,
    color: "#444",
  },
  listContent: { padding: 16 },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  itemMain: { flexDirection: "column", gap: 4, alignItems: "flex-start" },
  itemName: { fontSize: 16, fontWeight: "500", color: "#222" },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 10, fontWeight: "bold", textTransform: "uppercase" },
  itemQty: { fontSize: 16, fontWeight: "bold", color: "#666" },
  separator: { height: 1, backgroundColor: "#eee" },

  // Estilos do Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    width: "100%",
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, color: "#666", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  modalButtons: { flexDirection: "row", gap: 10, marginTop: 10 },
  cancelBtn: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  saveBtn: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#6200ea",
  },
  cancelText: { color: "#666", fontWeight: "bold" },
  saveText: { color: "#fff", fontWeight: "bold" },
});
