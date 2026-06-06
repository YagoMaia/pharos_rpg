import { useTheme } from "@/context/ThemeContext";
import { useWebSocket } from "@/context/WebSocketContext";
import { ActiveCondition, Combatant, ConditionName } from "@/types/rpg";
import { CONDITION_CONFIG } from "@/utils/conditionConfig";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ALL_CONDITIONS = Object.keys(CONDITION_CONFIG) as ConditionName[];

interface ConditionManagerModalProps {
  visible: boolean;
  onClose: () => void;
  combatant: Combatant;
}

export const ConditionManagerModal = ({
  visible,
  onClose,
  combatant,
}: ConditionManagerModalProps) => {
  const { colors } = useTheme();
  const { sendMessage } = useWebSocket();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [selectedCondition, setSelectedCondition] = useState<ConditionName | null>(null);
  const [durationInput, setDurationInput] = useState("");

  const activeConditions = combatant.conditions || [];

  const handleApply = () => {
    if (!selectedCondition) return;

    const config = CONDITION_CONFIG[selectedCondition];
    const duration = durationInput.trim() ? parseInt(durationInput) : undefined;

    sendMessage("APPLY_CONDITION", {
      combatantId: combatant.id,
      conditionName: selectedCondition,
      durationTurns: duration && !isNaN(duration) ? duration : undefined,
      description: config?.description || "",
    });

    setSelectedCondition(null);
    setDurationInput("");
  };

  const handleRemove = (conditionId: string) => {
    sendMessage("REMOVE_CONDITION", {
      combatantId: combatant.id,
      conditionId,
    });
  };

  const renderConditionOption = (name: ConditionName) => {
    const config = CONDITION_CONFIG[name];
    const isSelected = selectedCondition === name;
    const isAlreadyActive = activeConditions.some((c) => c.name === name);

    return (
      <TouchableOpacity
        key={name}
        style={[
          styles.conditionOption,
          isSelected && { borderColor: config.color, backgroundColor: config.color + "15" },
          isAlreadyActive && { opacity: 0.4 },
        ]}
        onPress={() => {
          if (!isAlreadyActive) setSelectedCondition(isSelected ? null : name);
        }}
        disabled={isAlreadyActive}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name={config.icon}
          size={20}
          color={config.color}
        />
        <Text
          style={[
            styles.conditionOptionText,
            isSelected && { color: config.color, fontWeight: "bold" },
          ]}
        >
          {name}
        </Text>
        {isAlreadyActive && (
          <Text style={styles.activeLabel}>Ativa</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.header}>
          <Text style={styles.headerTitle}>
            Condições — {combatant.name}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: colors.primary, fontWeight: "bold" }}>
              Fechar
            </Text>
          </TouchableOpacity>
        </SafeAreaView>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {/* ────── CONDIÇÕES ATIVAS ────── */}
          {activeConditions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Condições Ativas</Text>
              {activeConditions.map((cond) => {
                const config = CONDITION_CONFIG[cond.name];
                return (
                  <View
                    key={cond.id}
                    style={[
                      styles.activeRow,
                      { borderLeftColor: config?.color || colors.border },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={config?.icon || "help-circle"}
                      size={22}
                      color={config?.color || colors.text}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.activeName}>{cond.name}</Text>
                      <Text style={styles.activeDesc} numberOfLines={2}>
                        {cond.description || config?.description}
                      </Text>
                      {cond.durationTurns !== undefined && cond.durationTurns !== null ? (
                        <Text style={[styles.activeDuration, { color: config?.color }]}>
                          ⏱ {cond.durationTurns} {cond.durationTurns === 1 ? "turno restante" : "turnos restantes"}
                        </Text>
                      ) : (
                        <Text style={[styles.activeDuration, { color: colors.error }]}>
                          ∞ Permanente
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => handleRemove(cond.id)}
                    >
                      <MaterialCommunityIcons
                        name="close-circle"
                        size={24}
                        color={colors.error}
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          {/* ────── APLICAR NOVA ────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Aplicar Condição</Text>

            <View style={styles.conditionGrid}>
              {ALL_CONDITIONS.map(renderConditionOption)}
            </View>

            {/* Configuração da selecionada */}
            {selectedCondition && (
              <View style={styles.applySection}>
                <View style={styles.applyHeader}>
                  <MaterialCommunityIcons
                    name={CONDITION_CONFIG[selectedCondition].icon}
                    size={24}
                    color={CONDITION_CONFIG[selectedCondition].color}
                  />
                  <Text style={[styles.applyTitle, { color: CONDITION_CONFIG[selectedCondition].color }]}>
                    {selectedCondition}
                  </Text>
                </View>

                <Text style={styles.applyDesc}>
                  {CONDITION_CONFIG[selectedCondition].description}
                </Text>

                <View style={styles.durationRow}>
                  <Text style={styles.durationLabel}>Duração (turnos):</Text>
                  <TextInput
                    style={styles.durationInput}
                    value={durationInput}
                    onChangeText={setDurationInput}
                    keyboardType="numeric"
                    placeholder="∞ (vazio = permanente)"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.applyBtn,
                    {
                      backgroundColor: CONDITION_CONFIG[selectedCondition].color,
                    },
                  ]}
                  onPress={handleApply}
                >
                  <MaterialCommunityIcons name="check" size={20} color="#fff" />
                  <Text style={styles.applyBtnText}>
                    APLICAR {selectedCondition.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
    },

    // Sections
    section: { marginBottom: 24 },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "bold",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 12,
    },

    // Active conditions list
    activeRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 12,
      marginBottom: 8,
      gap: 12,
      borderLeftWidth: 4,
      elevation: 1,
    },
    activeName: {
      fontSize: 15,
      fontWeight: "bold",
      color: colors.text,
    },
    activeDesc: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    activeDuration: {
      fontSize: 11,
      fontWeight: "bold",
      marginTop: 4,
    },
    removeBtn: {
      padding: 4,
    },

    // Condition picker grid
    conditionGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    conditionOption: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    conditionOptionText: {
      fontSize: 13,
      color: colors.text,
    },
    activeLabel: {
      fontSize: 9,
      color: colors.textSecondary,
      fontWeight: "bold",
      textTransform: "uppercase",
    },

    // Apply section
    applySection: {
      marginTop: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    applyHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 8,
    },
    applyTitle: {
      fontSize: 18,
      fontWeight: "900",
    },
    applyDesc: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: 12,
    },
    durationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 16,
    },
    durationLabel: {
      fontSize: 13,
      color: colors.text,
      fontWeight: "600",
    },
    durationInput: {
      flex: 1,
      backgroundColor: colors.inputBg,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      color: colors.text,
      fontSize: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    applyBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 14,
      borderRadius: 10,
      gap: 8,
    },
    applyBtnText: {
      color: "#fff",
      fontWeight: "900",
      fontSize: 14,
      letterSpacing: 1,
    },
  });
