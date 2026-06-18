import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { NpcEntry, NpcRole } from "@/types/campaign";
import { ImagePickerSelector } from "@/components/ui/ImagePickerSelector";

interface NpcFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Omit<NpcEntry, "id" | "createdAt" | "updatedAt"> | Partial<NpcEntry>) => void;
  initialData?: NpcEntry | null;
}

export function NpcFormModal({ visible, onClose, onSave, initialData }: NpcFormModalProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [name, setName] = useState("");
  const [role, setRole] = useState<NpcRole | string>("Neutro");
  const [description, setDescription] = useState("");
  const [appearance, setAppearance] = useState("");
  const [personality, setPersonality] = useState("");
  const [secrets, setSecrets] = useState("");
  const [image, setImage] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setName(initialData.name);
        setRole(initialData.role);
        setDescription(initialData.description);
        setAppearance(initialData.appearance || "");
        setPersonality(initialData.personality || "");
        setSecrets(initialData.secrets || "");
        setImage(initialData.image);
      } else {
        setName("");
        setRole("Neutro");
        setDescription("");
        setAppearance("");
        setPersonality("");
        setSecrets("");
        setImage(undefined);
      }
    }
  }, [visible, initialData]);

  const handleSave = () => {
    if (!name.trim()) return;

    onSave({
      name,
      role,
      description,
      appearance,
      personality,
      secrets,
      image,
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
          <Text style={styles.headerTitle}>{initialData ? "Editar NPC" : "Novo NPC"}</Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerBtn} disabled={!name.trim()}>
            <Ionicons name="checkmark" size={28} color={name.trim() ? colors.primary : colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <ImagePickerSelector
            currentImage={image}
            onImageSelected={setImage}
            label="Imagem do NPC"
            round={true}
          />

          <View style={styles.field}>
            <Text style={styles.label}>Nome do NPC *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Elara, a Sábia"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Papel *</Text>
            <View style={styles.optionsRow}>
              {renderOption(role, "Aliado", setRole)}
              {renderOption(role, "Antagonista", setRole)}
              {renderOption(role, "Neutro", setRole)}
              {renderOption(role, "Comerciante", setRole)}
              {renderOption(role, "Informante", setRole)}
              {renderOption(role, "Outro", setRole)}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Ocupação, relevância na história..."
              placeholderTextColor={colors.textSecondary}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Aparência</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={appearance}
              onChangeText={setAppearance}
              placeholder="Características físicas notáveis..."
              placeholderTextColor={colors.textSecondary}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Personalidade</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={personality}
              onChangeText={setPersonality}
              placeholder="Traços de comportamento, maneirismos..."
              placeholderTextColor={colors.textSecondary}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Segredos (Apenas Mestre)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={secrets}
              onChangeText={setSecrets}
              placeholder="Informações que os jogadores não sabem..."
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
