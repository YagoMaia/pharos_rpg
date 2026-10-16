import { useTheme } from "@/context/ThemeContext";
import { ActionCostType, AttributeName, Combatant, SavingThrowSubmission } from "@/types/rpg";
import {
  calculateAreaDamage,
  calculateSaveDC,
  getTargetSaveModifier,
  resolveSavingThrow,
} from "@/utils/combatRules";
import { rollDiceString } from "@/utils/diceUtils";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
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
import { ConditionBar } from "../rpg/ConditionBadges";

const ATTRIBUTES: AttributeName[] = [
  "Destreza",
  "Constituição",
  "Força",
  "Sabedoria",
  "Inteligência",
  "Carisma",
];

const getHealthStatus = (current: number, max: number) => {
  if (current <= 0) return "Derrotado";
  const percent = current / max;
  if (percent > 0.5) return "Saudável";
  if (percent > 0.2) return "Ferido";
  return "Gravemente Ferido";
};

export interface AreaTargetResult {
  targetId: string;
  roll: number;
  total: number;
  passed: boolean;
  damageAmount: number;
  customModified?: boolean;
  playerSubmitted?: boolean;
}

interface AreaAttackModalProps {
  visible: boolean;
  onClose: () => void;
  attacker: Combatant;
  potentialTargets: Combatant[];
  onConfirmAreaAttack: (
    targetResults: {
      targetId: string;
      damageAmount: number;
      passed: boolean;
      roll: number;
      total: number;
    }[],
    baseDamage: number,
    saveDC: number,
    saveAttribute: AttributeName,
    actionName?: string,
    actionCost?: ActionCostType,
    focusCost?: number,
  ) => void;
  isGm: boolean;
  initialActionName?: string;
  initialAttribute?: AttributeName;
  initialDC?: number;
  initialDamageFormula?: string;
  initialFocusCost?: number;
  initialActionCost?: ActionCostType;
  onRequestSavingThrows?: (payload: {
    attackId: string;
    attackerId: string;
    attackerName?: string;
    actionName?: string;
    saveAttribute: AttributeName;
    saveDC: number;
    baseDamage: number;
    halfOnSave: boolean;
    targetIds: string[];
  }) => void;
  incomingSubmissions?: Record<string, SavingThrowSubmission>;
}


export const AreaAttackModal = ({
  visible,
  onClose,
  attacker,
  potentialTargets,
  onConfirmAreaAttack,
  isGm,
  initialActionName,
  initialAttribute = "Destreza",
  initialDC,
  initialDamageFormula = "2d6",
  initialFocusCost = 0,
  initialActionCost = "standard",
  onRequestSavingThrows,
  incomingSubmissions,
}: AreaAttackModalProps) => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTargets, setSelectedTargets] = useState<Combatant[]>([]);

  // Configurações do ataque em área
  const [actionName, setActionName] = useState("Ataque em Área");
  const [saveAttribute, setSaveAttribute] = useState<AttributeName>(initialAttribute);
  const [saveDC, setSaveDC] = useState("13");
  const [damageFormula, setDamageFormula] = useState("2d6");
  const [baseDamage, setBaseDamage] = useState("0");
  const [halfOnSave, setHalfOnSave] = useState(true);

  // Resultados individuais dos alvos
  const [targetStates, setTargetStates] = useState<Record<string, AreaTargetResult>>({});
  const [isAwaitingPlayers, setIsAwaitingPlayers] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    if (visible) {
      setStep(1);
      setSelectedTargets([]);
      setActionName(initialActionName || "Ataque em Área");
      setSaveAttribute(initialAttribute);
      const computedDC = initialDC !== undefined ? initialDC : calculateSaveDC(attacker, initialAttribute);
      setSaveDC(String(computedDC));
      setDamageFormula(initialDamageFormula || "2d6");
      setBaseDamage("0");
      setHalfOnSave(true);
      setTargetStates({});
      setIsAwaitingPlayers(false);
      setRequestSent(false);
    }
  }, [visible, attacker, initialActionName, initialAttribute, initialDC, initialDamageFormula]);

  // Atualiza em tempo real quando respostas dos jogadores chegam
  useEffect(() => {
    if (!incomingSubmissions) return;
    const subs = Object.values(incomingSubmissions);
    if (subs.length === 0) return;

    setTargetStates((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const sub of subs) {
        const targetId = (sub as any).targetId || (sub as any).combatantId;
        if (!targetId) continue;
        if (selectedTargets.some((t) => t.id === targetId)) {
          const current = next[targetId];
          const roll = (sub as any).roll ?? (sub as any).rollValue ?? 0;
          const total = (sub as any).total ?? roll;
          const passed = Boolean((sub as any).passed);
          const damageAmount = (sub as any).damageAmount ?? 0;
          if (!current || current.roll !== roll || current.total !== total) {
            next[targetId] = {
              targetId,
              roll,
              total,
              passed,
              damageAmount,
              customModified: false,
              playerSubmitted: true,
            };
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
  }, [incomingSubmissions, selectedTargets]);


  // Atualiza DC padrão ao mudar o atributo (se não for customizada manualmente)
  const handleSelectAttribute = (attr: AttributeName) => {
    setSaveAttribute(attr);
    const newDC = calculateSaveDC(attacker, attr);
    setSaveDC(String(newDC));

    // Recalcula salvaguardas já roladas com o novo atributo
    setTargetStates((prev) => {
      const next = { ...prev };
      const dcNum = parseInt(String(newDC), 10) || 10;
      const dmgNum = parseInt(baseDamage, 10) || 0;
      for (const target of selectedTargets) {
        if (next[target.id] && next[target.id].roll > 0) {
          const mod = getTargetSaveModifier(target, attr);
          const total = next[target.id].roll + mod;
          const passed = next[target.id].roll === 20 || (next[target.id].roll !== 1 && total >= dcNum);
          next[target.id] = {
            ...next[target.id],
            total,
            passed,
            damageAmount: next[target.id].customModified
              ? next[target.id].damageAmount
              : calculateAreaDamage(dmgNum, passed, halfOnSave),
          };
        }
      }
      return next;
    });
  };

  const handleToggleTarget = (target: Combatant) => {
    setSelectedTargets((prev) => {
      const exists = prev.find((t) => t.id === target.id);
      if (exists) {
        return prev.filter((t) => t.id !== target.id);
      }
      return [...prev, target];
    });
  };

  const handleSelectAllEnemies = () => {
    const isPlayerTeam = attacker.type === "player" || attacker.type === "pet";
    const enemies = potentialTargets.filter(
      (t) =>
        t.id !== attacker.id &&
        t.hp.current > 0 &&
        (isPlayerTeam
          ? t.type !== "player" && t.type !== "pet"
          : t.type === "player" || t.type === "pet"),
    );
    setSelectedTargets(enemies);
  };

  const handleSelectAll = () => {
    const all = potentialTargets.filter((t) => t.id !== attacker.id && t.hp.current > 0);
    setSelectedTargets(all);
  };

  const handleClearSelection = () => {
    setSelectedTargets([]);
  };

  // Rolar dano da área
  const handleRollDamage = () => {
    const rolled = rollDiceString(damageFormula, false, attacker.attributes);
    const total = rolled.total;
    setBaseDamage(String(total));
    recalculateAllTargets(total, parseInt(saveDC, 10) || 10, halfOnSave);
  };

  const handleManualDamageChange = (val: string) => {
    setBaseDamage(val);
    const total = parseInt(val, 10) || 0;
    recalculateAllTargets(total, parseInt(saveDC, 10) || 10, halfOnSave);
  };

  const handleToggleHalfOnSave = (half: boolean) => {
    setHalfOnSave(half);
    const dmg = parseInt(baseDamage, 10) || 0;
    const dc = parseInt(saveDC, 10) || 10;
    recalculateAllTargets(dmg, dc, half);
  };

  // Recalcula o dano de todos os alvos que já rolaram salvaguarda
  const recalculateAllTargets = (dmg: number, dc: number, half: boolean) => {
    setTargetStates((prev) => {
      const next = { ...prev };
      for (const target of selectedTargets) {
        if (next[target.id] && next[target.id].roll > 0) {
          const mod = getTargetSaveModifier(target, saveAttribute);
          const total = next[target.id].roll + mod;
          const passed = next[target.id].roll === 20 || (next[target.id].roll !== 1 && total >= dc);
          if (!next[target.id].customModified) {
            next[target.id] = {
              ...next[target.id],
              total,
              passed,
              damageAmount: calculateAreaDamage(dmg, passed, half),
            };
          }
        }
      }
      return next;
    });
  };

  // Rolar salvaguarda de um alvo específico
  const handleRollTargetSave = (target: Combatant, manualD20?: number) => {
    const d20 = manualD20 !== undefined ? manualD20 : Math.floor(Math.random() * 20) + 1;
    const dcNum = parseInt(saveDC, 10) || 10;
    const saveRes = resolveSavingThrow(target, saveAttribute, dcNum, d20);
    const dmgNum = parseInt(baseDamage, 10) || 0;
    const dmg = calculateAreaDamage(dmgNum, saveRes.passed, halfOnSave);

    setTargetStates((prev) => ({
      ...prev,
      [target.id]: {
        targetId: target.id,
        roll: d20,
        total: saveRes.total,
        passed: saveRes.passed,
        damageAmount: dmg,
        customModified: false,
      },
    }));
  };

  // Rolar salvaguarda para TODOS os alvos selecionados
  const handleRollAllSaves = () => {
    const dcNum = parseInt(saveDC, 10) || 10;
    const dmgNum = parseInt(baseDamage, 10) || 0;
    const next: Record<string, AreaTargetResult> = {};

    for (const target of selectedTargets) {
      const d20 = Math.floor(Math.random() * 20) + 1;
      const saveRes = resolveSavingThrow(target, saveAttribute, dcNum, d20);
      const dmg = calculateAreaDamage(dmgNum, saveRes.passed, halfOnSave);
      next[target.id] = {
        targetId: target.id,
        roll: d20,
        total: saveRes.total,
        passed: saveRes.passed,
        damageAmount: dmg,
        customModified: false,
      };
    }
    setTargetStates(next);
  };

  // Rolar salvaguarda apenas para os alvos que ainda NÃO rolaram
  const handleRollPendingSaves = () => {
    const dcNum = parseInt(saveDC, 10) || 10;
    const dmgNum = parseInt(baseDamage, 10) || 0;
    setTargetStates((prev) => {
      const next = { ...prev };
      for (const target of selectedTargets) {
        if (!next[target.id] || next[target.id].roll === 0) {
          const d20 = Math.floor(Math.random() * 20) + 1;
          const saveRes = resolveSavingThrow(target, saveAttribute, dcNum, d20);
          const dmg = calculateAreaDamage(dmgNum, saveRes.passed, halfOnSave);
          next[target.id] = {
            targetId: target.id,
            roll: d20,
            total: saveRes.total,
            passed: saveRes.passed,
            damageAmount: dmg,
            customModified: false,
            playerSubmitted: false,
          };
        }
      }
      return next;
    });
  };

  // Solicitar salvaguardas interativas aos jogadores
  const handleRequestPlayerSaves = () => {
    if (selectedTargets.length === 0) return;
    const dcNum = parseInt(saveDC, 10) || 10;
    const dmgNum = parseInt(baseDamage, 10) || 0;
    const attackId = `area_${Date.now()}`;
    setIsAwaitingPlayers(true);
    setRequestSent(true);

    if (onRequestSavingThrows) {
      onRequestSavingThrows({
        attackId,
        requestId: attackId,
        attackerId: attacker.id,
        attackerName: attacker.name,
        actionName,
        saveAttribute,
        attribute: saveAttribute,
        saveDC: dcNum,
        baseDamage: dmgNum,
        halfOnSave,
        targetIds: selectedTargets.map((t) => t.id),
        costType: "none",
        focusCost: 0,
      } as any);
    }
  };


  // Alternar manualmente entre passou/falhou de um alvo
  const handleToggleTargetPassed = (targetId: string) => {
    const current = targetStates[targetId];
    if (!current) return;
    const newPassed = !current.passed;
    const dmgNum = parseInt(baseDamage, 10) || 0;
    const newDmg = calculateAreaDamage(dmgNum, newPassed, halfOnSave);
    setTargetStates((prev) => ({
      ...prev,
      [targetId]: {
        ...current,
        passed: newPassed,
        damageAmount: newDmg,
        customModified: false,
      },
    }));
  };

  // Ajustar dano específico de um alvo manualmente
  const handleCustomDamageChange = (targetId: string, val: string) => {
    const num = parseInt(val, 10) || 0;
    setTargetStates((prev) => {
      const current = prev[targetId];
      if (!current) return prev;
      return {
        ...prev,
        [targetId]: {
          ...current,
          damageAmount: Math.max(0, num),
          customModified: true,
        },
      };
    });
  };

  const handleSubmit = () => {
    if (selectedTargets.length === 0) return;
    const dcNum = parseInt(saveDC, 10) || 10;
    const baseDmgNum = parseInt(baseDamage, 10) || 0;

    // Garante que todo alvo tenha um resultado (mesmo se não rolou d20 explícito, assume falha com dano base)
    const results = selectedTargets.map((target) => {
      const st = targetStates[target.id];
      if (st && st.roll > 0) {
        return {
          targetId: target.id,
          damageAmount: st.damageAmount,
          passed: st.passed,
          roll: st.roll,
          total: st.total,
        };
      }
      return {
        targetId: target.id,
        damageAmount: baseDmgNum,
        passed: false,
        roll: 10,
        total: 10 + getTargetSaveModifier(target, saveAttribute),
      };
    });

    onConfirmAreaAttack(
      results,
      baseDmgNum,
      dcNum,
      saveAttribute,
      actionName,
      initialActionCost,
      initialFocusCost,
    );
    onClose();
  };

  const validTargets = potentialTargets.filter(
    (t) => t.id !== attacker.id && t.hp.current > 0,
  );

  const passedCount = selectedTargets.filter((t) => targetStates[t.id]?.passed).length;
  const failedCount = selectedTargets.filter((t) => targetStates[t.id] && !targetStates[t.id].passed).length;
  const pendingTargetsCount = selectedTargets.filter((t) => !targetStates[t.id] || targetStates[t.id].roll === 0).length;
  const totalDamageDealt = selectedTargets.reduce(
    (acc, t) => acc + (targetStates[t.id]?.damageAmount ?? 0),
    0,
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
          {/* HEADER */}
          <View style={styles.header}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <MaterialCommunityIcons
                name="image-filter-vintage"
                size={22}
                color={colors.primary}
              />
              <Text style={styles.title}>
                {step === 1 ? "Ataque em Área: Alvos" : "Ataque em Área: Resolução"}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* STEP 1: SELEÇÃO DE ALVOS */}
          {step === 1 && (
            <View style={{ flex: 1 }}>
              {/* Botões de Ação Rápida */}
              <View style={styles.quickSelectBar}>
                <TouchableOpacity
                  style={styles.quickSelectBtn}
                  onPress={handleSelectAllEnemies}
                >
                  <Text style={styles.quickSelectText}>Inimigos</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickSelectBtn}
                  onPress={handleSelectAll}
                >
                  <Text style={styles.quickSelectText}>Todos</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickSelectBtn}
                  onPress={handleClearSelection}
                >
                  <Text style={styles.quickSelectText}>Limpar</Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={validTargets}
                keyExtractor={(item) => item.id}
                style={{ maxHeight: 380 }}
                renderItem={({ item }) => {
                  const isSelected = selectedTargets.some((t) => t.id === item.id);
                  const status = getHealthStatus(item.hp.current, item.hp.max);
                  const mod = getTargetSaveModifier(item, saveAttribute);

                  return (
                    <TouchableOpacity
                      style={[
                        styles.targetRow,
                        isSelected && styles.targetRowSelected,
                      ]}
                      onPress={() => handleToggleTarget(item)}
                    >
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
                          {item.type === "player" ? "Jogador" : item.type === "pet" ? "Pet (Aliado)" : "Inimigo"} •{" "}
                          <Text
                            style={{
                              fontWeight: isGm ? "bold" : "normal",
                              color: isGm ? colors.text : colors.textSecondary,
                            }}
                          >
                            {isGm ? `HP ${item.hp.current}/${item.hp.max}` : status}
                          </Text>
                          {" • "}
                          <Text style={{ color: colors.primary }}>
                            {saveAttribute.substring(0, 3).toUpperCase()}: {mod >= 0 ? `+${mod}` : mod}
                          </Text>
                        </Text>
                        {item.conditions && item.conditions.length > 0 && (
                          <View style={{ marginTop: 4 }}>
                            <ConditionBar conditions={item.conditions} size="small" />
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>Nenhum combatente válido disponível.</Text>
                }
              />

              <View style={styles.bottomFooter}>
                <Text style={styles.selectedCount}>
                  {selectedTargets.length}{" "}
                  {selectedTargets.length === 1 ? "alvo na área" : "alvos na área"}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.continueBtn,
                    selectedTargets.length === 0 && { opacity: 0.5 },
                  ]}
                  onPress={() => setStep(2)}
                  disabled={selectedTargets.length === 0}
                >
                  <Text style={styles.continueBtnText}>AVANÇAR PARA SALVAGUARDAS</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 2: CONFIGURAÇÃO DO ATAQUE E SALVAGUARDAS */}
          {step === 2 && (
            <ScrollView
              contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Nome da Ação */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Nome do Ataque / Efeito</Text>
                <TextInput
                  style={styles.textInput}
                  value={actionName}
                  onChangeText={setActionName}
                  placeholder="Ex: Bola de Fogo, Sopro do Dragão..."
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              {/* Seletor de Atributo da Salvaguarda */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Salvaguarda Exigida</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.attrScroll}>
                  {ATTRIBUTES.map((attr) => {
                    const isSelected = saveAttribute === attr;
                    return (
                      <TouchableOpacity
                        key={attr}
                        style={[
                          styles.attrPill,
                          isSelected && styles.attrPillSelected,
                        ]}
                        onPress={() => handleSelectAttribute(attr)}
                      >
                        <Text
                          style={[
                            styles.attrPillText,
                            isSelected && styles.attrPillTextSelected,
                          ]}
                        >
                          {attr}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Linha CD e Regra de Metade do Dano */}
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.fieldLabel}>CD da Salvaguarda</Text>
                  <TextInput
                    style={styles.textInput}
                    value={saveDC}
                    onChangeText={(val) => {
                      setSaveDC(val);
                      recalculateAllTargets(
                        parseInt(baseDamage, 10) || 0,
                        parseInt(val, 10) || 10,
                        halfOnSave,
                      );
                    }}
                    keyboardType="numeric"
                    placeholder="13"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Ao Passar</Text>
                  <View style={styles.toggleRow}>
                    <TouchableOpacity
                      style={[
                        styles.toggleBtn,
                        halfOnSave && styles.toggleBtnActive,
                      ]}
                      onPress={() => handleToggleHalfOnSave(true)}
                    >
                      <Text
                        style={[
                          styles.toggleBtnText,
                          halfOnSave && styles.toggleBtnTextActive,
                        ]}
                      >
                        ½ Dano
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.toggleBtn,
                        !halfOnSave && styles.toggleBtnActive,
                      ]}
                      onPress={() => handleToggleHalfOnSave(false)}
                    >
                      <Text
                        style={[
                          styles.toggleBtnText,
                          !halfOnSave && styles.toggleBtnTextActive,
                        ]}
                      >
                        0 Dano
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Dano da Área */}
              <View style={styles.row}>
                <View style={{ flex: 1.2, marginRight: 8 }}>
                  <Text style={styles.fieldLabel}>Fórmula de Dano</Text>
                  <TextInput
                    style={styles.textInput}
                    value={damageFormula}
                    onChangeText={setDamageFormula}
                    placeholder="2d6"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                <View style={{ flex: 0.8 }}>
                  <Text style={styles.fieldLabel}>Dano Total</Text>
                  <TextInput
                    style={styles.textInput}
                    value={baseDamage}
                    onChangeText={handleManualDamageChange}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>

              {/* Botão Rolar Dano */}
              <TouchableOpacity
                style={styles.rollDamageBtn}
                onPress={handleRollDamage}
              >
                <MaterialCommunityIcons name="dice-multiple" size={20} color="#fff" />
                <Text style={styles.rollDamageBtnText}>ROLAR DANO DA ÁREA</Text>
              </TouchableOpacity>

              <View style={styles.sectionDivider} />

              {/* SEÇÃO SALVAGUARDAS DOS ATORES */}
              <View style={styles.savesSectionHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Salvaguardas dos Atores ({selectedTargets.length})</Text>
                  <Text style={styles.sectionSubtitle}>
                    {saveAttribute} vs CD {saveDC}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {onRequestSavingThrows && (
                    <TouchableOpacity
                      style={[
                        styles.requestPlayersBtn,
                        requestSent && styles.requestPlayersBtnSent,
                      ]}
                      onPress={handleRequestPlayerSaves}
                    >
                      <MaterialCommunityIcons
                        name={requestSent ? "account-clock" : "send"}
                        size={15}
                        color="#fff"
                      />
                      <Text style={styles.requestPlayersBtnText}>
                        {requestSent ? "SOLICITADO" : "SOLICITAR"}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {pendingTargetsCount > 0 && pendingTargetsCount < selectedTargets.length && (
                    <TouchableOpacity
                      style={styles.rollPendingBtn}
                      onPress={handleRollPendingSaves}
                    >
                      <MaterialCommunityIcons name="dice-d20" size={15} color="#fff" />
                      <Text style={styles.rollPendingBtnText}>
                        PENDENTES ({pendingTargetsCount})
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.rollAllBtn}
                    onPress={handleRollAllSaves}
                  >
                    <MaterialCommunityIcons name="dice-multiple" size={15} color="#fff" />
                    <Text style={styles.rollAllBtnText}>ROLAR TODAS</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {isAwaitingPlayers && (
                <View style={styles.awaitingBanner}>
                  <MaterialCommunityIcons name="clock-outline" size={16} color="#e65100" />
                  <Text style={styles.awaitingBannerText}>
                    Salvaguarda solicitada aos jogadores. As respostas atualizarão em tempo real. Você pode rolar pelos ausentes a qualquer momento.
                  </Text>
                </View>
              )}

              {/* Lista dos Atores e seus testes */}
              {selectedTargets.map((target) => {
                const state = targetStates[target.id];
                const mod = getTargetSaveModifier(target, saveAttribute);
                const hasRolled = state && state.roll > 0;
                const passed = state?.passed ?? false;
                const dmgAmount = state ? state.damageAmount : (parseInt(baseDamage, 10) || 0);

                return (
                  <View key={target.id} style={styles.actorCard}>
                    <View style={styles.actorHeader}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Text style={styles.actorName}>{target.name}</Text>
                          {state?.playerSubmitted && (
                            <View style={styles.playerSubmittedBadge}>
                              <Ionicons name="checkmark-done" size={12} color="#2e7d32" />
                              <Text style={styles.playerSubmittedText}>Jogador</Text>
                            </View>
                          )}
                          {!hasRolled && isAwaitingPlayers && (target.type === "player" || target.type === "pet") && (
                            <View style={styles.awaitingBadge}>
                              <Text style={styles.awaitingBadgeText}>Aguardando...</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.actorDetail}>
                          Mod: {mod >= 0 ? `+${mod}` : mod} • CA {target.armorClass} •{" "}
                          {isGm ? `HP: ${target.hp.current}/${target.hp.max}` : getHealthStatus(target.hp.current, target.hp.max)}
                        </Text>
                      </View>

                      {/* Botão individual de rolagem */}
                      <TouchableOpacity
                        style={styles.singleRollBtn}
                        onPress={() => handleRollTargetSave(target)}
                      >
                        <MaterialCommunityIcons name="dice-d20" size={16} color={colors.primary} />
                        <Text style={styles.singleRollText}>
                          {hasRolled ? `${state.roll} (${state.total})` : "Rolar d20"}
                        </Text>
                      </TouchableOpacity>
                    </View>


                    {/* Linha de Status de Salvaguarda e Dano */}
                    <View style={styles.actorResultRow}>
                      <TouchableOpacity
                        style={[
                          styles.statusBadge,
                          hasRolled && passed && styles.statusBadgePassed,
                          hasRolled && !passed && styles.statusBadgeFailed,
                        ]}
                        onPress={() => handleToggleTargetPassed(target.id)}
                        disabled={!hasRolled}
                      >
                        <Ionicons
                          name={passed ? "checkmark-circle" : "close-circle"}
                          size={16}
                          color={hasRolled ? (passed ? "#2e7d32" : "#c62828") : colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.statusBadgeText,
                            hasRolled && (passed ? { color: "#2e7d32" } : { color: "#c62828" }),
                          ]}
                        >
                          {hasRolled ? (passed ? "PASSOU (Sucesso)" : "FALHOU") : "Não rolou"}
                        </Text>
                      </TouchableOpacity>

                      <View style={styles.damageInputGroup}>
                        <Text style={styles.damageLabel}>Dano:</Text>
                        <TextInput
                          style={styles.damageInput}
                          value={String(dmgAmount)}
                          onChangeText={(v) => handleCustomDamageChange(target.id, v)}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  </View>
                );
              })}

              {/* Resumo do Ataque em Área */}
              <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>Resumo da Resolução</Text>
                <Text style={styles.summaryText}>
                  {selectedTargets.length} alvos afetados • {failedCount} falharam • {passedCount} passaram
                </Text>
                <Text style={styles.summaryDamage}>
                  Dano Total Aplicado: {totalDamageDealt} PV
                </Text>
              </View>

              {/* Botão Confirmar e Aplicar */}
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  parseInt(baseDamage, 10) === 0 && { opacity: 0.5 },
                ]}
                onPress={handleSubmit}
                disabled={parseInt(baseDamage, 10) === 0}
              >
                <MaterialCommunityIcons name="flash" size={20} color="#fff" />
                <Text style={styles.confirmBtnText}>APLICAR DANO EM ÁREA</Text>
              </TouchableOpacity>

              {/* Voltar para seleção */}
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => setStep(1)}
              >
                <Text style={styles.backBtnText}>← Alterar alvos selecionados</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
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
      padding: 12,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      maxHeight: "92%",
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: isDark ? "#1f1f1f" : "#f5f5f5",
    },
    title: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
    },
    quickSelectBar: {
      flexDirection: "row",
      padding: 10,
      gap: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    quickSelectBtn: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
      backgroundColor: isDark ? "#2a2a2a" : "#e0e0e0",
    },
    quickSelectText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.text,
    },
    targetRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    targetRowSelected: {
      backgroundColor: colors.primary + "15",
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: colors.textSecondary,
      marginRight: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    targetName: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.text,
    },
    targetDetail: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    emptyText: {
      textAlign: "center",
      color: colors.textSecondary,
      padding: 24,
    },
    bottomFooter: {
      padding: 14,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    selectedCount: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.primary,
      marginBottom: 8,
      textAlign: "center",
    },
    continueBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: "center",
    },
    continueBtnText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 14,
    },
    fieldGroup: {
      marginBottom: 12,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary,
      marginBottom: 4,
    },
    textInput: {
      backgroundColor: colors.inputBg || (isDark ? "#2a2a2a" : "#ececec"),
      color: colors.text,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    attrScroll: {
      flexDirection: "row",
      marginVertical: 4,
    },
    attrPill: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: 6,
      backgroundColor: isDark ? "#222" : "#f0f0f0",
    },
    attrPillSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    attrPillText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    attrPillTextSelected: {
      color: "#fff",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    toggleRow: {
      flexDirection: "row",
      backgroundColor: isDark ? "#222" : "#f0f0f0",
      borderRadius: 8,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    toggleBtn: {
      flex: 1,
      paddingVertical: 9,
      alignItems: "center",
    },
    toggleBtnActive: {
      backgroundColor: colors.primary,
    },
    toggleBtnText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    toggleBtnTextActive: {
      color: "#fff",
    },
    rollDamageBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: "#e65100",
      paddingVertical: 11,
      borderRadius: 8,
      marginTop: 4,
    },
    rollDamageBtnText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 13,
    },
    sectionDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 16,
    },
    savesSectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.text,
    },
    sectionSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    rollAllBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.primary,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
    },
    rollAllBtnText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 12,
    },
    requestPlayersBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "#6a1b9a",
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 8,
    },
    requestPlayersBtnSent: {
      backgroundColor: "#4a148c",
      opacity: 0.85,
    },
    requestPlayersBtnText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 11,
    },
    rollPendingBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "#e65100",
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 8,
    },
    rollPendingBtnText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 11,
    },
    awaitingBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: isDark ? "#2a1805" : "#fff8e1",
      borderWidth: 1,
      borderColor: "#ffe082",
      padding: 10,
      borderRadius: 8,
      marginBottom: 10,
    },
    awaitingBannerText: {
      fontSize: 11,
      color: isDark ? "#ffb74d" : "#e65100",
      flex: 1,
    },
    playerSubmittedBadge: {
      backgroundColor: "#e8f5e9",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    playerSubmittedText: {
      fontSize: 10,
      color: "#2e7d32",
      fontWeight: "600",
    },
    awaitingBadge: {
      backgroundColor: isDark ? "#3e2723" : "#fff3e0",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    awaitingBadgeText: {
      fontSize: 10,
      color: "#e65100",
      fontWeight: "600",
    },

    actorCard: {
      backgroundColor: isDark ? "#222" : "#fafafa",
      borderRadius: 8,
      padding: 10,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actorHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    actorName: {
      fontSize: 13,
      fontWeight: "bold",
      color: colors.text,
    },
    actorDetail: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    singleRollBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.primary + "15",
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 6,
    },
    singleRollText: {
      fontSize: 11,
      fontWeight: "bold",
      color: colors.primary,
    },
    actorResultRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 6,
      backgroundColor: isDark ? "#333" : "#e0e0e0",
    },
    statusBadgePassed: {
      backgroundColor: "#e8f5e9",
    },
    statusBadgeFailed: {
      backgroundColor: "#ffebee",
    },
    statusBadgeText: {
      fontSize: 11,
      fontWeight: "bold",
      color: colors.textSecondary,
    },
    damageInputGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    damageLabel: {
      fontSize: 12,
      fontWeight: "bold",
      color: colors.text,
    },
    damageInput: {
      backgroundColor: colors.inputBg || (isDark ? "#333" : "#fff"),
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      paddingVertical: 2,
      paddingHorizontal: 8,
      minWidth: 44,
      textAlign: "center",
      fontWeight: "bold",
      fontSize: 13,
    },
    summaryBox: {
      backgroundColor: isDark ? "#1a2332" : "#e3f2fd",
      borderRadius: 8,
      padding: 12,
      marginVertical: 12,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    summaryTitle: {
      fontSize: 12,
      fontWeight: "bold",
      color: colors.primary,
      textTransform: "uppercase",
    },
    summaryText: {
      fontSize: 12,
      color: colors.text,
      marginTop: 4,
    },
    summaryDamage: {
      fontSize: 13,
      fontWeight: "bold",
      color: colors.text,
      marginTop: 4,
    },
    confirmBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: "#b71c1c",
      paddingVertical: 14,
      borderRadius: 8,
    },
    confirmBtnText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 14,
    },
    backBtn: {
      alignItems: "center",
      paddingVertical: 12,
    },
    backBtnText: {
      color: colors.textSecondary,
      fontSize: 12,
    },
  });
