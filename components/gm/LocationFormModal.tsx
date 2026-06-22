import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { LocationEntry, LocationType } from "@/types/campaign";

interface LocationFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Omit<LocationEntry, "id" | "createdAt" | "updatedAt"> | Partial<LocationEntry>) => void;
  initialData?: LocationEntry | null;
}

export function LocationFormModal({ visible, onClose, onSave, initialData }: LocationFormModalProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [name, setName] = useState("");
  const [type, setType] = useState<LocationType | string>("Cidade");
  const [region, setRegion] = useState("");
  const [description, setDescription] = useState("");
  const [lore, setLore] = useState("");

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setName(initialData.name);
        setType(initialData.type);
        setRegion(initialData.region || "");
        setDescription(initialData.description);
        setLore(initialData.lore || "");
      } else {
        setName("");
        setType("Cidade");
        setRegion("");
        setDescription("");
        setLore("");
      }
    }
  }, [visible, initialData]);

  const handleSave = () => {
    if (!name.trim()) return;

    onSave({
      name,
      type,
      region,
      description,
      lore,
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
          <Text style={styles.headerTitle}>{initialData ? "Editar Localidade" : "Nova Localidade"}</Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerBtn} disabled={!name.trim()}>
            <Ionicons name="checkmark" size={28} color={name.trim() ? colors.primary : colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.field}>
            <Text style={styles.label}>Nome do Local *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Taverna do Javali"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Tipo *</Text>
            <View style={styles.optionsRow}>
              {renderOption(type, "Cidade", setType)}
              {renderOption(type, "Vila", setType)}
              {renderOption(type, "Taverna", setType)}
              {renderOption(type, "Masmorra", setType)}
              {renderOption(type, "Floresta", setType)}
              {renderOption(type, "Ruínas", setType)}
              {renderOption(type, "Castelo", setType)}
              {renderOption(type, "Outro", setType)}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Região / Mundo</Text>
            <TextInput
              style={styles.input}
              value={region}
              onChangeText={setRegion}
              placeholder="Ex: Costa da Espada"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="O que os personagens veem quando chegam..."
              placeholderTextColor={colors.textSecondary}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>História / Lore</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={lore}
              onChangeText={setLore}
              placeholder="Segredos, lendas, eventos passados..."
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
