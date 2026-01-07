// app/(tabs)/inventory.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
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

// Adicionado 'shield' ao tipo
type EquipSlotType = "meleeWeapon" | "rangedWeapon" | "armor" | "shield";

export default function InventoryScreen() {
  const {
    character,
    updateEquipment,
    addItem,
    removeItem,
    updateItemQuantity,
  } = useCharacter();

  // --- ESTADOS ---
  const [equipModalVisible, setEquipModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<EquipSlotType | null>(null);

  // Estados do formulário de equipamento
  const [editName, setEditName] = useState("");
  const [editStats, setEditStats] = useState(""); // Para armas
  const [editDefense, setEditDefense] = useState(""); // Para armaduras (string para input, converte depois)
  const [editDesc, setEditDesc] = useState(""); // Descrição

  // Estados de Item da Mochila (Mantidos igual)
  const [addItemModalVisible, setAddItemModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemType, setNewItemType] = useState<ItemType>("consumable");
  const [newItemQty, setNewItemQty] = useState("1");
  const [itemActionModalVisible, setItemActionModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // --- HANDLERS EQUIPAMENTO ---
  const handleEditSlot = (slot: EquipSlotType, item: EquipmentItem) => {
    setSelectedSlot(slot);
    setEditName(item.name);
    setEditStats(item.stats);
    setEditDefense(item.defense ? String(item.defense) : "0");
    setEditDesc(item.description || "");
    setEquipModalVisible(true);
  };

  const saveEquipment = () => {
    if (selectedSlot) {
      const newItem: EquipmentItem = {
        name: editName,
        stats: editStats,
        defense: parseInt(editDefense) || 0,
        description: editDesc,
      };
      updateEquipment(selectedSlot, newItem);
      setEquipModalVisible(false);
    }
  };

  // --- HANDLERS MOCHILA (Mantidos) ---
  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    const qty = parseInt(newItemQty) || 1;
    addItem(newItemName, newItemType, qty);
    setNewItemName("");
    setNewItemQty("1");
    setAddItemModalVisible(false);
  };

  const handleItemPress = (item: Item) => {
    setSelectedItem(item);
    setItemActionModalVisible(true);
  };

  const handleConsumeItem = () => {
    if (selectedItem) {
      updateItemQuantity(selectedItem.id, -1);
      Alert.alert("Item Usado", `Você usou 1x ${selectedItem.name}.`);
      setItemActionModalVisible(false);
    }
  };

  const handleDiscardItem = () => {
    if (selectedItem) {
      Alert.alert("Descartar", `Jogar fora ${selectedItem.name}?`, [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Jogar Fora",
          style: "destructive",
          onPress: () => {
            removeItem(selectedItem.id);
            setItemActionModalVisible(false);
          },
        },
      ]);
    }
  };

  // Helper de Tags da Mochila
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
      <TouchableOpacity
        style={styles.itemRow}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.itemMain}>
          <Text style={styles.itemName}>{item.name}</Text>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>
              {badge.label}
            </Text>
          </View>
        </View>
        <Text style={styles.itemQty}>x{item.quantity}</Text>
      </TouchableOpacity>
    );
  };

  // Verifica se o slot selecionado é de defesa (Armadura ou Escudo)
  const isDefenseSlot = selectedSlot === "armor" || selectedSlot === "shield";

  return (
    <View style={styles.container}>
      {/* Seção Fixa: Equipamentos (Grid 2x2) */}
      <View style={styles.equipSection}>
        <Text style={styles.sectionTitle}>Equipamento Atual</Text>

        {/* Linha 1: Armas */}
        <View style={styles.equipRow}>
          <EquipSlot
            label="Curto Alcance"
            item={character.equipment.meleeWeapon}
            icon="cut"
            type="weapon"
            onPress={() =>
              handleEditSlot("meleeWeapon", character.equipment.meleeWeapon)
            }
          />
          <EquipSlot
            label="Longo Alcance"
            item={character.equipment.rangedWeapon}
            icon="locate"
            type="weapon"
            onPress={() =>
              handleEditSlot("rangedWeapon", character.equipment.rangedWeapon)
            }
          />
        </View>

        {/* Linha 2: Defesa */}
        <View style={styles.equipRow}>
          <EquipSlot
            label="Armadura"
            item={character.equipment.armor}
            icon="shirt"
            type="defense"
            onPress={() => handleEditSlot("armor", character.equipment.armor)}
          />
          <EquipSlot
            label="Escudo"
            item={character.equipment.shield}
            icon="shield"
            type="defense"
            onPress={() => handleEditSlot("shield", character.equipment.shield)}
          />
        </View>
      </View>

      {/* Seção Scrollável: Mochila */}
      <View style={styles.backpackSection}>
        <View style={styles.backpackHeader}>
          <Text style={styles.sectionHeader}>Mochila</Text>
          <TouchableOpacity onPress={() => setAddItemModalVisible(true)}>
            <Ionicons name="add-circle" size={28} color="#6200ea" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={character.backpack}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Mochila vazia.</Text>
          }
        />
      </View>

      {/* --- MODAL 1: EDITAR EQUIPAMENTO (Dinâmico) --- */}
      <Modal
        visible={equipModalVisible}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Editar{" "}
              {selectedSlot === "shield"
                ? "Escudo"
                : selectedSlot === "armor"
                ? "Armadura"
                : "Arma"}
            </Text>

            {/* Nome */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nome do Item</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
              />
            </View>

            {/* Inputs Condicionais */}
            {isDefenseSlot ? (
              // Se for Armadura/Escudo: Mostra CA e Descrição
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Bônus de Defesa (CA)</Text>
                  <View style={styles.rowCenter}>
                    <Text style={styles.prefix}>+</Text>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={editDefense}
                      onChangeText={setEditDefense}
                      keyboardType="numeric"
                      placeholder="Ex: 2"
                    />
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Descrição / Efeito</Text>
                  <TextInput
                    style={[styles.input, { height: 60 }]}
                    value={editDesc}
                    onChangeText={setEditDesc}
                    multiline
                    placeholder="Ex: Dá desvantagem em furtividade..."
                  />
                </View>
              </>
            ) : (
              // Se for Arma: Mostra Dano
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Dano (ex: 1d6 + 2)</Text>
                <TextInput
                  style={styles.input}
                  value={editStats}
                  onChangeText={setEditStats}
                />
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setEquipModalVisible(false)}
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

      {/* --- MODAL 2: ADICIONAR ITEM NA MOCHILA --- */}
      <Modal
        visible={addItemModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Novo Item</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nome</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Poção"
                value={newItemName}
                onChangeText={setNewItemName}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Quantidade</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={newItemQty}
                onChangeText={setNewItemQty}
              />
            </View>
            <Text style={styles.inputLabel}>Tipo</Text>
            <View style={styles.typeSelector}>
              {(["consumable", "equipment", "key"] as ItemType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeChip,
                    newItemType === t && styles.typeChipActive,
                  ]}
                  onPress={() => setNewItemType(t)}
                >
                  <Text
                    style={[
                      styles.typeText,
                      newItemType === t && styles.typeTextActive,
                    ]}
                  >
                    {t === "consumable"
                      ? "Consumível"
                      : t === "equipment"
                      ? "Equip"
                      : "Chave"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setAddItemModalVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddItem} style={styles.saveBtn}>
                <Text style={styles.saveText}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- MODAL 3: AÇÕES DO ITEM --- */}
      <Modal
        visible={itemActionModalVisible}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selectedItem?.name}</Text>
            <Text style={styles.itemDesc}>
              Quantidade atual: {selectedItem?.quantity}
            </Text>
            {selectedItem?.type === "consumable" && (
              <TouchableOpacity
                style={styles.actionBtnPrimary}
                onPress={handleConsumeItem}
              >
                <Ionicons name="beaker" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>Usar Item (-1)</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionBtnDestructive}
              onPress={handleDiscardItem}
            >
              <Ionicons name="trash" size={20} color="#fff" />
              <Text style={styles.actionBtnText}>Jogar Fora (Tudo)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeBtnSimple}
              onPress={() => setItemActionModalVisible(false)}
            >
              <Text style={styles.closeBtnText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Componente EquipSlot Melhorado
const EquipSlot = ({ label, item, onPress, icon, type }: any) => {
  // Se for defesa, mostramos a CA. Se for arma, mostramos o Dano.
  const isDefense = type === "defense";
  const displayValue = isDefense
    ? item.defense > 0
      ? `+${item.defense}`
      : "+0"
    : item.stats;

  return (
    <TouchableOpacity style={styles.slot} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.slotHeader}>
        <Text style={styles.slotLabel}>{label}</Text>
        <Ionicons name={icon} size={14} color="#666" />
      </View>

      <Text style={styles.slotValue} numberOfLines={1}>
        {item.name || "Vazio"}
      </Text>

      {/* Renderiza a info extra (Dano ou CA) se houver item */}
      {item.name !== "Nenhum" && item.name !== "Vazio" && (
        <View style={styles.infoRow}>
          <View style={[styles.statsBadge, isDefense && styles.defenseBadge]}>
            <Text style={[styles.statsText, isDefense && styles.defenseText]}>
              {isDefense ? "CA " : ""}
              {displayValue}
            </Text>
          </View>
          {/* Se for defesa e tiver descrição, mostra ícone pequeno */}
          {isDefense && item.description ? (
            <Ionicons
              name="information-circle"
              size={16}
              color="#888"
              style={{ marginLeft: 4 }}
            />
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

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

  // Slot
  slot: {
    flex: 1, // Garante que ocupem espaço igual no grid
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    minHeight: 100,
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

  infoRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },

  // Badge de Arma (Cinza)
  statsBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#eceff1",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statsText: { fontSize: 12, fontWeight: "bold", color: "#546e7a" },

  // Badge de Defesa (Azul)
  defenseBadge: { backgroundColor: "#e3f2fd" },
  defenseText: { color: "#1565c0" },

  // Mochila (Styles mantidos)
  backpackSection: { flex: 1, backgroundColor: "#fff" },
  backpackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 16,
    marginBottom: 8,
    marginTop: 8,
    color: "#444",
  },
  listContent: { padding: 16 },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 20,
    fontStyle: "italic",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
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

  // Modais
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
  rowCenter: { flexDirection: "row", alignItems: "center" },
  prefix: { fontSize: 18, fontWeight: "bold", marginRight: 8, color: "#555" },

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

  typeSelector: { flexDirection: "row", gap: 8, marginBottom: 20 },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  typeChipActive: { backgroundColor: "#6200ea", borderColor: "#6200ea" },
  typeText: { fontSize: 12, color: "#666" },
  typeTextActive: { color: "#fff", fontWeight: "bold" },

  itemDesc: { textAlign: "center", marginBottom: 20, color: "#666" },
  actionBtnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00c853",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    gap: 8,
  },
  actionBtnDestructive: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e53935",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    gap: 8,
  },
  actionBtnText: { color: "#fff", fontWeight: "bold" },
  closeBtnSimple: { alignItems: "center", padding: 10, marginTop: 5 },
  closeBtnText: { color: "#666" },
});
