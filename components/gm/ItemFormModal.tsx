import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { ItemEntry, ItemRarity, LibraryItemType } from "@/types/campaign";

interface ItemFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Omit<ItemEntry, "id" | "createdAt" | "updatedAt"> | Partial<ItemEntry>) => void;
  initialData?: ItemEntry | null;
}

export function ItemFormModal({ visible, onClose, onSave, initialData }: ItemFormModalProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [name, setName] = useState("");
  const [type, setType] = useState<LibraryItemType>("Equipamento");
  const [rarity, setRarity] = useState<ItemRarity>("Comum");
  const [description, setDescription] = useState("");
  const [properties, setProperties] = useState("");
  const [weight, setWeight] = useState("");
  const [value, setValue] = useState("");

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setName(initialData.name);
        setType(initialData.type);
        setRarity(initialData.rarity);
        setDescription(initialData.description);
        setProperties(initialData.properties || "");
        setWeight(initialData.weight ? initialData.weight.toString() : "");
        setValue(initialData.value || "");
      } else {
        setName("");
        setType("Equipamento");
        setRarity("Comum");
        setDescription("");
        setProperties("");
        setWeight("");
        setValue("");
      }
    }
  }, [visible, initialData]);

  const handleSave = () => {
    if (!name.trim()) return;

    onSave({
      name,
      type,
      rarity,
      description,
      properties,
      weight: parseFloat(weight) || undefined,
      value,
      tags: [],
      linkedCampaignIds: initialData ? initialData.linkedCampaignIds : [],
    });
    onClose();
  };

  const renderOption = (current: string, val: string, setFn: (v: any) => void) => (
    <TouchableOpacity 
      style={[styles.optionBtn, current === val && styles.optionBtnActive]} 
      onPress={() => setFn(val)}
    >
      <Text style={[styles.optionText, current === val && styles.optionTextActive]}>{val}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{initialData ? "Editar Item" : "Novo Item"}</Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerBtn} disabled={!name.trim()}>
            <Ionicons name="checkmark" size={28} color={name.trim() ? colors.primary : colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.field}>
            <Text style={styles.label}>Nome do Item *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Espada Longa"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Tipo *</Text>
            <View style={styles.optionsRow}>
              {renderOption(type, "Equipamento", setType)}
              {renderOption(type, "Consumível", setType)}
              {renderOption(type, "Mágico", setType)}
              {renderOption(type, "Tesouro", setType)}
              {renderOption(type, "Chave", setType)}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Raridade *</Text>
            <View style={styles.optionsRow}>
              {renderOption(rarity, "Comum", setRarity)}
              {renderOption(rarity, "Incomum", setRarity)}
              {renderOption(rarity, "Raro", setRarity)}
              {renderOption(rarity, "Épico", setRarity)}
              {renderOption(rarity, "Lendário", setRarity)}
            </View>
          </View>

          <View style={styles.fieldRow}>
            <View style={[styles.field, { flex: 1, marginRight: 16 }]}>
              <Text style={styles.label}>Peso (kg)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                placeholder="Ex: 1.5"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Valor</Text>
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={setValue}
                placeholder="Ex: 15 PO"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Aparência, história, material..."
              placeholderTextColor={colors.textSecondary}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Propriedades / Efeitos</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={properties}
              onChangeText={setProperties}
              placeholder="Dano 1d8 cortante, cura 2d4, etc."
              placeholderTextColor={colors.textSecondary}
              multiline
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
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
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  field: {
    marginBottom: 24,
  },
  fieldRow: {
    flexDirection: "row",
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    fontSize: 16,
  },
  textArea: {
    height: 100,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionBtnActive: {
    backgroundColor: "#c62828",
    borderColor: "#c62828",
  },
  optionText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  optionTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
});
