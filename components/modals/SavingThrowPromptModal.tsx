import { useTheme } from "@/context/ThemeContext";
import { Character, SavingThrowRequest, SavingThrowSubmission } from "@/types/rpg";
import { calculateAreaDamage, getTargetSaveModifier, resolveSavingThrow } from "@/utils/combatRules";
import { generateSafeId } from "@/utils/stringUtils";

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface TargetRollState {
  roll: number;
  total: number;
  passed: boolean;
  damageAmount: number;
  submitted: boolean;
}

interface ControlledTarget {
  id: string;
  name: string;
  isPet: boolean;
  attributes: Record<string, { name?: string; value?: number; modifier?: number } | undefined>;
}

interface SavingThrowPromptModalProps {
  visible: boolean;
  request: SavingThrowRequest | null;
  character: Character;
  onClose: () => void;
  onSubmitSave: (submission: SavingThrowSubmission) => void;
}

export const SavingThrowPromptModal = ({
  visible,
  request,
  character,
  onClose,
  onSubmitSave,
}: SavingThrowPromptModalProps) => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const [targetStates, setTargetStates] = useState<Record<string, TargetRollState>>({});
  const [manualInputs, setManualInputs] = useState<Record<string, string>>({});
  const [rollingTargetId, setRollingTargetId] = useState<string | null>(null);

  // Identifica quais alvos pertencem a este jogador
  const controlledTargets = useMemo<ControlledTarget[]>(() => {
    if (!request || !character.name) return [];
    const targets: ControlledTarget[] = [];
    const mySafeId = generateSafeId(character.name);

    if (request.targetIds.includes(mySafeId)) {
      targets.push({
        id: mySafeId,
        name: character.name,
        isPet: false,
        attributes: character.attributes,
      });
    }

    if (character.pet?.name) {
      const myPetSafeId = generateSafeId(`${character.name}_pet_${character.pet.name}`);
      if (request.targetIds.includes(myPetSafeId)) {
        targets.push({
          id: myPetSafeId,
          name: character.pet.name,
          isPet: true,
          attributes: character.pet.attributes,
        });
      }
    }

    return targets;
  }, [request, character]);

  useEffect(() => {
    if (visible && request) {
      setTargetStates({});
      setManualInputs({});
      setRollingTargetId(null);
    }
  }, [visible, request]);


  if (!visible || !request || controlledTargets.length === 0) {
    return null;
  }

  const handleRollTarget = (target: ControlledTarget, manualD20?: number) => {
    setRollingTargetId(target.id);
    const d20 = manualD20 !== undefined ? manualD20 : Math.floor(Math.random() * 20) + 1;

    setTimeout(
      () => {
        const saveRes = resolveSavingThrow(target, request.saveAttribute, request.saveDC, d20);
        const dmg = calculateAreaDamage(request.baseDamage, saveRes.passed, request.halfOnSave);

        setTargetStates((prev) => ({
          ...prev,
          [target.id]: {
            roll: d20,
            total: saveRes.total,
            passed: saveRes.passed,
            damageAmount: dmg,
            submitted: false,
          },
        }));
        setRollingTargetId(null);
      },
      manualD20 !== undefined ? 0 : 350,
    );
  };

  const handleManualInputChange = (targetId: string, val: string) => {
    setManualInputs((prev) => ({ ...prev, [targetId]: val }));
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 20) {
      const target = controlledTargets.find((t) => t.id === targetId);
      if (target) {
        handleRollTarget(target, parsed);
      }
    }
  };

  const handleSubmit = (target: ControlledTarget) => {
    const state = targetStates[target.id];
    if (!state) return;

    onSubmitSave({
      attackId: request.attackId,
      targetId: target.id,
      targetName: target.name,
      roll: state.roll,
      total: state.total,
      passed: state.passed,
      damageAmount: state.damageAmount,
    });

    setTargetStates((prev) => ({
      ...prev,
      [target.id]: {
        ...state,
        submitted: true,
      },
    }));

    // Verifica se todos os alvos controlados já foram enviados
    const updatedStates = {
      ...targetStates,
      [target.id]: { ...state, submitted: true },
    };
    const allSubmitted = controlledTargets.every((t) => updatedStates[t.id]?.submitted);
    if (allSubmitted) {
      setTimeout(() => {
        onClose();
      }, 700);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* HEADER COM ALERTA */}
          <View style={styles.header}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <MaterialCommunityIcons name="shield-alert" size={24} color="#e65100" />
              <Text style={styles.title}>Salvaguarda Exigida!</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {/* INFORMAÇÕES DO ATAQUE */}
            <View style={styles.infoBox}>
              <Text style={styles.actionName}>
                {request.attackerName ? `${request.attackerName} usou ` : ""}
                <Text style={{ fontWeight: "bold", color: colors.primary }}>
                  {request.actionName || "Ataque em Área"}
                </Text>
              </Text>
              <View style={styles.dcRow}>
                <View style={styles.dcBadge}>
                  <Text style={styles.dcBadgeText}>
                    CD {request.saveDC} {request.saveAttribute.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.damageInfo}>
                  Dano Base: <Text style={{ fontWeight: "bold" }}>{request.baseDamage} PV</Text>
                  {" • "}
                  {request.halfOnSave
                    ? `Sucesso: ${Math.floor(request.baseDamage / 2)} PV (½)`
                    : "Sucesso: 0 PV"}
                </Text>
              </View>
            </View>

            {/* CARDS DOS ALVOS DO JOGADOR */}
            {controlledTargets.map((target) => {
              const state = targetStates[target.id];
              const mod = getTargetSaveModifier(target, request.saveAttribute);
              const isRolling = rollingTargetId === target.id;
              const hasRolled = !!state;
              const isSubmitted = state?.submitted ?? false;

              return (
                <View key={target.id} style={styles.targetCard}>
                  <View style={styles.targetCardHeader}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      {target.isPet && (
                        <MaterialCommunityIcons name="paw" size={18} color="#9c27b0" />
                      )}
                      <Text style={styles.targetName}>
                        {target.name} {target.isPet ? "(Companheiro)" : ""}
                      </Text>
                    </View>
                    <View style={styles.modBadge}>
                      <Text style={styles.modBadgeText}>
                        Mod: {mod >= 0 ? `+${mod}` : mod}
                      </Text>
                    </View>
                  </View>

                  {!hasRolled ? (
                    <View style={styles.rollActions}>
                      <TouchableOpacity
                        style={styles.rollBtn}
                        onPress={() => handleRollTarget(target)}
                        disabled={isRolling}
                      >
                        <MaterialCommunityIcons name="dice-d20" size={22} color="#fff" />
                        <Text style={styles.rollBtnText}>
                          {isRolling ? "Rolando d20..." : "ROLAR SALVAGUARDA"}
                        </Text>
                      </TouchableOpacity>

                      <View style={styles.manualRow}>
                        <Text style={styles.manualLabel}>Ou d20 físico:</Text>
                        <TextInput
                          style={styles.manualInput}
                          placeholder="1-20"
                          placeholderTextColor={colors.textSecondary}
                          keyboardType="numeric"
                          maxLength={2}
                          value={manualInputs[target.id] || ""}
                          onChangeText={(v) => handleManualInputChange(target.id, v)}
                        />
                      </View>
                    </View>
                  ) : (
                    <View style={styles.resultContainer}>
                      <View style={styles.mathRow}>
                        <Text style={styles.mathText}>
                          d20: <Text style={{ fontWeight: "bold" }}>{state.roll}</Text> + {mod} ={" "}
                          <Text style={{ fontWeight: "bold", fontSize: 16 }}>{state.total}</Text>
                          {" vs CD "}
                          <Text style={{ fontWeight: "bold" }}>{request.saveDC}</Text>
                        </Text>
                        <View
                          style={[
                            styles.outcomeBadge,
                            state.passed ? styles.outcomePassed : styles.outcomeFailed,
                          ]}
                        >
                          <Ionicons
                            name={state.passed ? "checkmark-circle" : "close-circle"}
                            size={16}
                            color={state.passed ? "#2e7d32" : "#c62828"}
                          />
                          <Text
                            style={[
                              styles.outcomeText,
                              state.passed ? { color: "#2e7d32" } : { color: "#c62828" },
                            ]}
                          >
                            {state.passed ? "SUCESSO (Passou)" : "FALHA"}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.damageResultText}>
                        Dano que você sofrerá:{" "}
                        <Text style={{ fontWeight: "bold", color: colors.error }}>
                          {state.damageAmount} PV
                        </Text>
                      </Text>

                      {!isSubmitted ? (
                        <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                          <TouchableOpacity
                            style={styles.rerollBtn}
                            onPress={() => handleRollTarget(target)}
                          >
                            <Ionicons name="refresh" size={16} color={colors.textSecondary} />
                            <Text style={styles.rerollText}>Rolar de novo</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.submitBtn}
                            onPress={() => handleSubmit(target)}
                          >
                            <Ionicons name="send" size={16} color="#fff" />
                            <Text style={styles.submitBtnText}>ENVIAR SALVAGUARDA</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.submittedBanner}>
                          <Ionicons name="checkmark-done-circle" size={18} color="#2e7d32" />
                          <Text style={styles.submittedText}>
                            Salvaguarda enviada! Aguardando o mestre aplicar o dano...
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.75)",
      justifyContent: "center",
      padding: 16,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      maxHeight: "90%",
      borderWidth: 1.5,
      borderColor: "#e65100",
      overflow: "hidden",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: isDark ? "#2a1b0a" : "#fff3e0",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 17,
      fontWeight: "bold",
      color: isDark ? "#ffb74d" : "#e65100",
    },
    content: {
      padding: 16,
    },
    infoBox: {
      backgroundColor: isDark ? "#1f1f1f" : "#f5f5f5",
      borderRadius: 10,
      padding: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionName: {
      fontSize: 15,
      color: colors.text,
      marginBottom: 8,
    },
    dcRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 8,
    },
    dcBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
    },
    dcBadgeText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 12,
    },
    damageInfo: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    targetCard: {
      backgroundColor: isDark ? "#242424" : "#ffffff",
      borderRadius: 12,
      padding: 14,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    targetCardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    targetName: {
      fontSize: 15,
      fontWeight: "bold",
      color: colors.text,
    },
    modBadge: {
      backgroundColor: isDark ? "#333" : "#e0e0e0",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    modBadgeText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.text,
    },
    rollActions: {
      alignItems: "center",
      gap: 10,
    },
    rollBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 10,
      width: "100%",
    },
    rollBtnText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 14,
    },
    manualRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    manualLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    manualInput: {
      width: 60,
      height: 36,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      textAlign: "center",
      fontSize: 15,
      fontWeight: "bold",
      color: colors.text,
      backgroundColor: colors.inputBg,
    },
    resultContainer: {
      gap: 8,
    },
    mathRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    mathText: {
      fontSize: 14,
      color: colors.text,
    },
    outcomeBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    outcomePassed: {
      backgroundColor: "#e8f5e9",
    },
    outcomeFailed: {
      backgroundColor: "#ffebee",
    },
    outcomeText: {
      fontSize: 12,
      fontWeight: "bold",
    },
    damageResultText: {
      fontSize: 13,
      color: colors.text,
      marginTop: 4,
    },
    rerollBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    rerollText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    submitBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.success,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    submitBtnText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 13,
    },
    submittedBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: isDark ? "#1b3320" : "#e8f5e9",
      padding: 10,
      borderRadius: 8,
      marginTop: 6,
    },
    submittedText: {
      fontSize: 12,
      color: isDark ? "#81c784" : "#2e7d32",
      flex: 1,
    },
  });
