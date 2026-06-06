import { useTheme } from "@/context/ThemeContext";
import { Combatant } from "@/types/rpg";
import { rollDiceString } from "@/utils/diceUtils";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
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

// --- HELPER: Status de Vida (Névoa de Guerra) ---
const getHealthStatus = (current: number, max: number) => {
  if (current <= 0) return "Derrotado";
  const percent = current / max;
  if (percent > 0.5) return "Saudável";
  if (percent > 0.2) return "Ferido";
  return "Gravemente Ferido";
};

interface AttackModalProps {
  visible: boolean;
  onClose: () => void;
  attacker: Combatant;
  potentialTargets: Combatant[];
  onConfirmAttack: (
    targetIds: string[],
    hitTotal: number,
    damageTotal: number,
    isCrit: boolean,
  ) => void;
  isGm: boolean;
  initialBonus?: string;
  initialDamage?: string;
}

export const AttackModal = ({
  visible,
  onClose,
  attacker,
  potentialTargets,
  onConfirmAttack,
  isGm,
  initialBonus,
  initialDamage,
}: AttackModalProps) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [step, setStep] = useState(1);
  const [selectedTargets, setSelectedTargets] = useState<Combatant[]>([]);

  const [attackBonus, setAttackBonus] = useState("0");
  const [damageFormula, setDamageFormula] = useState("1d4");
  const [hitValue, setHitValue] = useState("");
  const [dmgValue, setDmgValue] = useState("");
  const [isCrit, setIsCrit] = useState(false);

  // Reset ao abrir
  useEffect(() => {
    if (visible) {
      setStep(1);
      setSelectedTargets([]);
      setHitValue("");
      setDmgValue("");
      setIsCrit(false);

      // Previsão de bônus baseada em Atributos
      const strMod = attacker.attributes["Força"]?.modifier || 0;
      const dexMod = attacker.attributes["Destreza"]?.modifier || 0;
      const bestMod = Math.max(strMod, dexMod);

      setAttackBonus(bestMod >= 0 ? `+${bestMod}` : `${bestMod}`);
      setDamageFormula(`1d6+${bestMod + 2}`);

      if (initialBonus && initialDamage) {
        // SE VEIO DE MAGIA: Usa o que veio
        setAttackBonus(initialBonus);
        setDamageFormula(initialDamage);
      } else {
        // SE É ATAQUE BÁSICO: Calcula For/Des
        const strMod = attacker.attributes["Força"]?.modifier || 0;
        const dexMod = attacker.attributes["Destreza"]?.modifier || 0;
        const bestMod = Math.max(strMod, dexMod);
        setAttackBonus(bestMod >= 0 ? `+${bestMod + 2}` : `${bestMod}`);
        setDamageFormula(`1d6+${bestMod}`);
      }
    }
  }, [visible, attacker, initialBonus, initialDamage]);

  const handleToggleTarget = (target: Combatant) => {
    setSelectedTargets((prev) => {
      const exists = prev.find((t) => t.id === target.id);
      if (exists) {
        return prev.filter((t) => t.id !== target.id);
      }
      return [...prev, target];
    });
  };

  const handleContinue = () => {
    if (selectedTargets.length > 0) {
      setStep(2);
    }
  };

  const handleAutoRoll = () => {
    const d20 = Math.floor(Math.random() * 20) + 1;
    const bonus = parseInt(attackBonus) || 0;
    const totalHit = d20 + bonus;
    const critical = d20 === 20;
    setIsCrit(critical);
    setHitValue(String(totalHit));

    const damageRoll = rollDiceString(damageFormula, critical);
    let finalDamage = damageRoll.total;

    setDmgValue(String(finalDamage));
  };

  const handleSubmit = () => {
    if (selectedTargets.length === 0) return;
    const finalHit = parseInt(hitValue) || 0;
    const finalDmg = parseInt(dmgValue) || 0;
    onConfirmAttack(
      selectedTargets.map((t) => t.id),
      finalHit,
      finalDmg,
      isCrit,
    );
    onClose();
  };

  const validTargets = potentialTargets.filter(
    (t) => t.id !== attacker.id && t.hp.current > 0,
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {step === 1 ? "Selecionar Alvos" : "Resolver Ataque"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* STEP 1: LISTA DE ALVOS (Multi-Seleção) */}
          {step === 1 && (
            <View>
              <FlatList
                data={validTargets}
                keyExtractor={(item) => item.id}
                style={{ maxHeight: 400 }}
                renderItem={({ item }) => {
                  const status = getHealthStatus(item.hp.current, item.hp.max);
                  const isSelected = selectedTargets.some(
                    (t) => t.id === item.id,
                  );

                  return (
                    <TouchableOpacity
                      style={[
                        styles.targetRow,
                        isSelected && styles.targetRowSelected,
                      ]}
                      onPress={() => handleToggleTarget(item)}
                    >
                      {/* Checkbox */}
                      <View
                        style={[
                          styles.checkbox,
                          isSelected && styles.checkboxSelected,
                        ]}
                      >
                        {isSelected && (
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        )}
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.targetName}>{item.name}</Text>
                        <Text style={styles.targetDetail}>
                          {item.type === "player" ? "Jogador" : "Inimigo"} •{" "}
                          <Text
                            style={{
                              fontWeight: isGm ? "bold" : "normal",
                              color: isGm ? colors.text : colors.textSecondary,
                            }}
                          >
                            {isGm
                              ? `HP ${item.hp.current}/${item.hp.max}`
                              : status}
                          </Text>
                        </Text>
                      </View>

                      {/* CONDICIONAL DE CA (Só GM vê o Badge) */}
                      {isGm && (
                        <View style={styles.acBadge}>
                          <MaterialCommunityIcons
                            name="shield"
                            size={14}
                            color={colors.surface}
                          />
                          <Text style={styles.acText}>CA {item.armorClass}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>Nenhum alvo válido.</Text>
                }
              />

              {/* Botão Continuar */}
              <View style={{ padding: 16 }}>
                {selectedTargets.length > 0 && (
                  <Text style={styles.selectedCount}>
                    {selectedTargets.length}{" "}
                    {selectedTargets.length === 1
                      ? "alvo selecionado"
                      : "alvos selecionados"}
                  </Text>
                )}
                <TouchableOpacity
                  style={[
                    styles.continueBtn,
                    selectedTargets.length === 0 && { opacity: 0.5 },
                  ]}
                  onPress={handleContinue}
                  disabled={selectedTargets.length === 0}
                >
                  <Text style={styles.continueBtnText}>CONTINUAR</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 2: ROLAGEM */}
          {step === 2 && selectedTargets.length > 0 && (
            <ScrollView contentContainerStyle={{ padding: 10 }}>
              {/* Lista de alvos selecionados */}
              <View style={styles.versusContainer}>
                <Text style={styles.versusText}>
                  <Text style={{ color: colors.primary }}>{attacker.name}</Text>{" "}
                  vs{" "}
                  <Text style={{ color: colors.error }}>
                    {selectedTargets.length === 1
                      ? selectedTargets[0].name
                      : `${selectedTargets.length} alvos`}
                  </Text>
                </Text>

                {/* Lista dos alvos (colapsada) */}
                {selectedTargets.length > 1 && (
                  <View style={styles.targetsList}>
                    {selectedTargets.map((t) => (
                      <View key={t.id} style={styles.targetChip}>
                        <Text style={styles.targetChipText}>{t.name}</Text>
                        {isGm && (
                          <Text style={styles.targetChipAc}>
                            CA {t.armorClass}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* CA para alvo único */}
                {selectedTargets.length === 1 &&
                  (isGm ? (
                    <Text
                      style={{ color: colors.textSecondary, fontSize: 12 }}
                    >
                      CA do Alvo: {selectedTargets[0].armorClass}
                    </Text>
                  ) : (
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 12,
                        fontStyle: "italic",
                      }}
                    >
                      Status:{" "}
                      {getHealthStatus(
                        selectedTargets[0].hp.current,
                        selectedTargets[0].hp.max,
                      )}
                    </Text>
                  ))}
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.label}>Bônus Acerto</Text>
                  <TextInput
                    style={styles.input}
                    value={attackBonus}
                    onChangeText={setAttackBonus}
                    placeholder="+0"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Dano (Ex: 1d8+3)</Text>
                  <TextInput
                    style={styles.input}
                    value={damageFormula}
                    onChangeText={setDamageFormula}
                    placeholder="1d6"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>

              <View style={styles.divider} />

              <TouchableOpacity
                style={[
                  styles.autoRollBtn,
                  isCrit && { backgroundColor: "#FFbc00" },
                ]}
                onPress={handleAutoRoll}
              >
                <MaterialCommunityIcons
                  name="dice-d20"
                  size={24}
                  color={isCrit ? "#000" : "#fff"}
                />
                <Text
                  style={[styles.autoRollText, isCrit && { color: "#000" }]}
                >
                  {isCrit ? "RE-ROLAR (DADOS)" : "ROLAR DADOS (APP)"}
                </Text>
              </TouchableOpacity>

              {/* --- AVISO VISUAL DE CRÍTICO --- */}
              {isCrit && (
                <View style={styles.critBanner}>
                  <MaterialCommunityIcons
                    name="star-four-points"
                    size={20}
                    color="#FFbc00"
                  />
                  <Text style={styles.critText}>ACERTO CRÍTICO!</Text>
                  <MaterialCommunityIcons
                    name="star-four-points"
                    size={20}
                    color="#FFbc00"
                  />
                </View>
              )}

              <Text style={styles.orText}>— OU INSIRA MANUALMENTE —</Text>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.label}>Total Acerto</Text>
                  <TextInput
                    style={styles.input}
                    value={hitValue}
                    onChangeText={setHitValue}
                    keyboardType="numeric"
                    placeholder="D20 + Mod"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Total Dano</Text>
                  <TextInput
                    style={styles.input}
                    value={dmgValue}
                    onChangeText={setDmgValue}
                    keyboardType="numeric"
                    placeholder="Dano Final"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>

              {/* Feedback Visual: ACERTOU/ERROU — multi-target mostra por alvo */}
              {hitValue !== "" && isGm && selectedTargets.length > 1 && (
                <View style={styles.multiResultContainer}>
                  {selectedTargets.map((t) => {
                    const hit =
                      isCrit || parseInt(hitValue) >= t.armorClass;
                    return (
                      <View
                        key={t.id}
                        style={[
                          styles.multiResultRow,
                          {
                            backgroundColor: hit
                              ? colors.success + "20"
                              : colors.error + "20",
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: hit ? colors.success : colors.error,
                            fontWeight: "bold",
                            flex: 1,
                          }}
                        >
                          {t.name}
                        </Text>
                        <Text
                          style={{
                            color: hit ? colors.success : colors.error,
                            fontWeight: "900",
                          }}
                        >
                          {hit ? "ACERTOU" : "ERROU"}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Feedback Visual: Single target */}
              {hitValue !== "" && selectedTargets.length === 1 && (
                <View
                  style={[
                    styles.resultBanner,
                    {
                      backgroundColor: isGm
                        ? isCrit ||
                          parseInt(hitValue) >= selectedTargets[0].armorClass
                          ? colors.success + "20"
                          : colors.error + "20"
                        : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.resultText,
                      {
                        color: isGm
                          ? isCrit ||
                            parseInt(hitValue) >= selectedTargets[0].armorClass
                            ? colors.success
                            : colors.error
                          : colors.text,
                      },
                    ]}
                  >
                    {isGm
                      ? isCrit ||
                        parseInt(hitValue) >= selectedTargets[0].armorClass
                        ? "ACERTOU!"
                        : "ERROU!"
                      : "ATAQUE ENVIADO"}
                  </Text>
                </View>
              )}

              {/* Feedback: Jogador com multi-target */}
              {hitValue !== "" && !isGm && selectedTargets.length > 1 && (
                <View
                  style={[
                    styles.resultBanner,
                    { backgroundColor: colors.border },
                  ]}
                >
                  <Text style={[styles.resultText, { color: colors.text }]}>
                    ATAQUE ENVIADO ({selectedTargets.length} alvos)
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  !hitValue && { opacity: 0.5 },
                  isCrit && styles.confirmBtnCrit,
                ]}
                onPress={handleSubmit}
                disabled={!hitValue}
              >
                <Text style={[styles.confirmText, isCrit && { color: "#000" }]}>
                  {isCrit ? "DESFERIR CRÍTICO!" : "CONFIRMAR ATAQUE"}
                </Text>
              </TouchableOpacity>

              {/* Botão voltar para seleção */}
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => setStep(1)}
              >
                <Text style={styles.backBtnText}>← Alterar alvos</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (colors: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.7)",
      justifyContent: "center",
      padding: 20,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      maxHeight: "80%",
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 16,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    title: { fontSize: 18, fontWeight: "bold", color: colors.text },
    emptyText: {
      padding: 20,
      textAlign: "center",
      color: colors.textSecondary,
    },

    targetRow: {
      flexDirection: "row",
      padding: 16,
      borderBottomWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      gap: 12,
    },
    targetRowSelected: {
      backgroundColor: colors.primary + "15",
    },
    targetName: { fontSize: 16, fontWeight: "bold", color: colors.text },
    targetDetail: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

    // Checkbox
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },

    // Selected count & Continue
    selectedCount: {
      color: colors.primary,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 8,
      fontSize: 14,
    },
    continueBtn: {
      backgroundColor: colors.primary,
      padding: 14,
      borderRadius: 8,
      alignItems: "center",
    },
    continueBtnText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 16,
      letterSpacing: 1,
    },

    acBadge: {
      backgroundColor: colors.text,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    acText: { color: colors.surface, fontWeight: "bold", fontSize: 12 },

    versusContainer: { alignItems: "center", marginBottom: 16 },
    versusText: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 4,
    },

    // Target chips (multi-target Step 2)
    targetsList: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 6,
      marginTop: 8,
    },
    targetChip: {
      backgroundColor: colors.error + "20",
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    targetChipText: {
      color: colors.error,
      fontWeight: "bold",
      fontSize: 12,
    },
    targetChipAc: {
      color: colors.textSecondary,
      fontSize: 10,
      fontWeight: "bold",
    },

    row: { flexDirection: "row", marginBottom: 16 },
    label: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
      textTransform: "uppercase",
      fontWeight: "bold",
    },
    input: {
      backgroundColor: colors.inputBg,
      padding: 12,
      borderRadius: 8,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      textAlign: "center",
      fontSize: 18,
      fontWeight: "bold",
    },
    divider: { height: 1, backgroundColor: colors.border, marginBottom: 16 },

    autoRollBtn: {
      backgroundColor: colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 14,
      borderRadius: 8,
      gap: 8,
    },
    autoRollText: { color: "#fff", fontWeight: "bold" },
    orText: {
      textAlign: "center",
      color: colors.textSecondary,
      marginVertical: 12,
      fontSize: 12,
    },

    // Multi-target result rows
    multiResultContainer: {
      gap: 4,
      marginBottom: 16,
    },
    multiResultRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 10,
      borderRadius: 8,
    },

    resultBanner: {
      padding: 10,
      borderRadius: 8,
      alignItems: "center",
      marginBottom: 16,
    },
    resultText: { fontWeight: "900", fontSize: 18, letterSpacing: 1 },

    confirmBtn: {
      backgroundColor: colors.success,
      padding: 16,
      borderRadius: 8,
      alignItems: "center",
    },
    confirmText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
    critBanner: {
      flexDirection: "row",
      backgroundColor: "rgba(255, 188, 0, 0.1)",
      padding: 12,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 16,
      borderWidth: 1,
      borderColor: "#FFbc00",
      gap: 10,
    },
    critText: {
      color: "#FFbc00",
      fontWeight: "900",
      fontSize: 18,
      letterSpacing: 2,
    },
    confirmBtnCrit: {
      backgroundColor: "#FFbc00",
      borderWidth: 2,
      borderColor: "#B8860B",
      elevation: 5,
      boxShadowColor: "#FFbc00",
      boxShadowOffset: { width: 0, height: 2 },
      boxShadowOpacity: 0.5,
      boxShadowRadius: 4,
    },

    // Back button
    backBtn: {
      padding: 12,
      alignItems: "center",
      marginTop: 8,
    },
    backBtnText: {
      color: colors.textSecondary,
      fontSize: 14,
    },
  });
