import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { MonsterEntry, MonsterType, CreatureSize } from "@/types/campaign";

interface MonsterFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Omit<MonsterEntry, "id" | "createdAt" | "updatedAt"> | Partial<MonsterEntry>) => void;
  initialData?: MonsterEntry | null;
}

export function MonsterFormModal({ visible, onClose, onSave, initialData }: MonsterFormModalProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [name, setName] = useState("");
  const [type, setType] = useState<MonsterType | string>("Besta");
  const [size, setSize] = useState<CreatureSize>("Médio");
  const [cr, setCr] = useState("");
  const [environment, setEnvironment] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setName(initialData.name);
        setType(initialData.type);
        setSize(initialData.size);
        setCr(initialData.cr);
        setEnvironment(initialData.environment || "");
        setDescription(initialData.description);
      } else {
        setName("");
        setType("Besta");
        setSize("Médio");
        setCr("");
        setEnvironment("");
        setDescription("");
      }
    }
  }, [visible, initialData]);

  const handleSave = () => {
    if (!name.trim()) return;

    onSave({
      name,
      type,
      size,
      cr,
      environment,
      description,
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
          <Text style={styles.headerTitle}>{initialData ? "Editar Monstro" : "Novo Monstro"}</Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerBtn} disabled={!name.trim()}>
            <Ionicons name="checkmark" size={28} color={name.trim() ? colors.primary : colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.field}>
            <Text style={styles.label}>Nome do Monstro *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Goblin Salteador"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.fieldRow}>
            <View style={[styles.field, { flex: 1, marginRight: 16 }]}>
              <Text style={styles.label}>Nível de Desafio (CR)</Text>
              <TextInput
                style={styles.input}
                value={cr}
                onChangeText={setCr}
                placeholder="Ex: 1/4, 2, 15..."
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Ambiente</Text>
              <TextInput
                style={styles.input}
                value={environment}
                onChangeText={setEnvironment}
                placeholder="Ex: Cavernas"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Tipo *</Text>
            <View style={styles.optionsRow}>
              {renderOption(type, "Besta", setType)}
              {renderOption(type, "Morto-Vivo", setType)}
              {renderOption(type, "Elemental", setType)}
              {renderOption(type, "Humanoide", setType)}
              {renderOption(type, "Aberração", setType)}
              {renderOption(type, "Constructo", setType)}
              {renderOption(type, "Dragão", setType)}
              {renderOption(type, "Outro", setType)}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Tamanho *</Text>
            <View style={styles.optionsRow}>
              {renderOption(size, "Miúdo", setSize)}
              {renderOption(size, "Pequeno", setSize)}
              {renderOption(size, "Médio", setSize)}
              {renderOption(size, "Grande", setSize)}
              {renderOption(size, "Enorme", setSize)}
              {renderOption(size, "Colossal", setSize)}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Descrição / Táticas</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Aparência, como se comporta em combate..."
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
