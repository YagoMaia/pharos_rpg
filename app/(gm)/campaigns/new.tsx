import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Text, TextInput, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useGMContext } from "@/context/GMContext";
import { useTheme } from "@/context/ThemeContext";
import { GameSystem, CampaignVisibility, CampaignStatus } from "@/types/campaign";

export default function CampaignFormScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const { edit } = useLocalSearchParams<{ edit: string }>();
  const { createCampaign, updateCampaign, getCampaignById } = useGMContext();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [system, setSystem] = useState<GameSystem>("Pharos");
  const [visibility, setVisibility] = useState<CampaignVisibility>("private");
  const [maxPlayers, setMaxPlayers] = useState("5");
  const [status, setStatus] = useState<CampaignStatus>("active");

  const isEditing = !!edit;

  useEffect(() => {
    if (isEditing) {
      const camp = getCampaignById(edit);
      if (camp) {
        setName(camp.name);
        setDescription(camp.description);
        setSystem(camp.system);
        setVisibility(camp.visibility);
        setMaxPlayers(camp.maxPlayers.toString());
        setStatus(camp.status);
      }
    }
  }, [edit]);

  const handleSave = () => {
    if (!name.trim()) return;

    if (isEditing) {
      updateCampaign(edit, {
        name,
        description,
        system,
        visibility,
        maxPlayers: parseInt(maxPlayers) || 5,
        status,
      });
    } else {
      createCampaign({
        name,
        description,
        system,
        visibility,
        maxPlayers: parseInt(maxPlayers) || 5,
        status: "active",
        playerIds: [],
        linkedNpcIds: [],
        linkedMonsterIds: [],
        linkedItemIds: [],
        linkedLocationIds: [],
        notes: "",
      });
    }
    router.back();
  };

  const renderRadio = (label: string, value: string, currentValue: string, onSelect: (v: any) => void) => (
    <TouchableOpacity style={styles.radioBtn} onPress={() => onSelect(value)}>
      <View style={[styles.radioOuter, currentValue === value && styles.radioOuterSelected]}>
        {currentValue === value && <View style={styles.radioInner} />}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? "Editar Campanha" : "Nova Campanha"}</Text>
        <TouchableOpacity onPress={handleSave} style={styles.headerBtn} disabled={!name.trim()}>
          <Ionicons name="checkmark" size={28} color={name.trim() ? colors.primary : colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.field}>
          <Text style={styles.label}>Nome da Campanha *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ex: A Maldição de Strahd"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Um breve resumo da história..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Sistema de Jogo *</Text>
          <View style={styles.radioGroup}>
            {renderRadio("Pharos", "Pharos", system, setSystem)}
            {renderRadio("D&D 5e", "D&D 5e", system, setSystem)}
            {renderRadio("Tormenta20", "Tormenta20", system, setSystem)}
            {renderRadio("Call of Cthulhu", "Call of Cthulhu", system, setSystem)}
            {renderRadio("Outro", "Outro", system, setSystem)}
          </View>
        </View>

        <View style={styles.fieldRow}>
          <View style={[styles.field, { flex: 1, marginRight: 16 }]}>
            <Text style={styles.label}>Máx. Jogadores</Text>
            <TextInput
              style={styles.input}
              value={maxPlayers}
              onChangeText={setMaxPlayers}
              keyboardType="number-pad"
            />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Visibilidade</Text>
            <View style={styles.radioGroup}>
              {renderRadio("Privada", "private", visibility, setVisibility)}
              {renderRadio("Aberta", "open", visibility, setVisibility)}
            </View>
          </View>
        </View>

        {isEditing && (
          <View style={styles.field}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.radioGroupRow}>
              {renderRadio("Ativa", "active", status, setStatus)}
              {renderRadio("Pausada", "paused", status, setStatus)}
              {renderRadio("Encerrada", "finished", status, setStatus)}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
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
    paddingTop: 20,
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
  radioGroup: {
    gap: 12,
  },
  radioGroupRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  radioBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  radioOuterSelected: {
    borderColor: "#c62828",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#c62828",
  },
  radioLabel: {
    fontSize: 16,
    color: colors.text,
  },
});
