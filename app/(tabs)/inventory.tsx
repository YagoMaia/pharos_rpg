// app/(tabs)/inventory.tsx
import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useCharacter } from "../../context/CharacterContext";
import { Item, ItemType } from "../../types/rpg"; // Importe o ItemType

export default function InventoryScreen() {
  const { character } = useCharacter();

  // Função auxiliar para definir cor e texto da Tag
  const getBadgeInfo = (type: ItemType) => {
    switch (type) {
      case "consumable":
        return { label: "Consumível", bg: "#e0f2f1", text: "#00695c" }; // Verde Água
      case "key":
        return { label: "Item Chave", bg: "#fff8e1", text: "#ff8f00" }; // Âmbar/Dourado
      case "equipment":
        return { label: "Equipamento", bg: "#f3e5f5", text: "#7b1fa2" }; // Roxo
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

          {/* Tag Dinâmica */}
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
        <Text style={styles.sectionTitle}>Equipado</Text>
        <View style={styles.equipRow}>
          <EquipSlot
            label="Curto Alcance"
            value={character.equipment.meleeWeapon}
          />
          <EquipSlot
            label="Longo Alcance"
            value={character.equipment.rangedWeapon}
          />
        </View>
        <EquipSlot
          label="Armadura"
          value={character.equipment.armor}
          fullWidth
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
    </View>
  );
}

const EquipSlot = ({ label, value, fullWidth }: any) => (
  <View style={[styles.slot, fullWidth ? { width: "100%" } : { flex: 1 }]}>
    <Text style={styles.slotLabel}>{label}</Text>
    <Text style={styles.slotValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f2f5" },
  equipSection: {
    backgroundColor: "#fff",
    padding: 16,
    elevation: 2,
    marginBottom: 10,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 16,
    marginBottom: 8,
    marginTop: 8,
    color: "#444",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  equipRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  slot: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  slotLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    color: "#888",
    marginBottom: 4,
  },
  slotValue: { fontSize: 16, fontWeight: "500" },
  backpackSection: { flex: 1, backgroundColor: "#fff" },
  listContent: { padding: 16 },

  // Estilos do Item da Lista Atualizados
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  itemMain: {
    flexDirection: "column", // Mudei para coluna para a tag ficar embaixo do nome (opcional) ou row para lado
    gap: 4,
    alignItems: "flex-start",
  },
  itemName: { fontSize: 16, fontWeight: "500", color: "#222" },

  // Estilos da Tag (Badge)
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start", // Garante que a tag não ocupe a largura toda
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },

  itemQty: { fontSize: 16, fontWeight: "bold", color: "#666" },
  separator: { height: 1, backgroundColor: "#eee" },
});
