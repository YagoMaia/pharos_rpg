import { useCampaign } from "@/context/CampaignContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAlert } from "@/context/AlertContext";

import { useTheme } from "@/context/ThemeContext";
import { useWebSocket } from "@/context/WebSocketContext";
import { Combatant, ResolveActionPayload, Skill } from "@/types/rpg";
import { AttackModal } from "./AttackModal";

// --- HELPERS ---
const getActionKey = (
  actionString?: string
): "standard" | "bonus" | "reaction" | null => {
  if (!actionString) return null;
  const lower = actionString.toLowerCase();
  if (lower.includes("bônus") || lower.includes("bonus")) return "bonus";
  if (lower.includes("reação") || lower.includes("reacao")) return "reaction";
  return "standard";
};

interface Props {
  combatant: Combatant;
  isGm?: boolean; // Flag para saber se é o mestre controlando
}

export const ActiveTurnInterface = ({ combatant, isGm = false }: Props) => {
  const { updateCombatant, combatants } = useCampaign(); // Atualiza visualmente rápido
  const { sendMessage } = useWebSocket(); // Envia para o servidor
  const { showAlert } = useAlert();
  const { colors } = useTheme();
  const [attackModalOpen, setAttackModalOpen] = useState(false);

  const styles = useMemo(() => getStyles(colors), [colors]);

  // Garante que actions existe
  const turnActions = combatant.turnActions || {
    standard: true,
    bonus: true,
    reaction: true,
  };

  // --- LÓGICA DE DADOS ---
  // Identifica o índice da postura atual para o layout de botões (0, 1, ou -1)
  const stances = combatant.stances || [];
  const currentStanceIdx = stances.findIndex(
    (s: any) => s.id === combatant.activeStanceId
  );
  const isNeutral = currentStanceIdx === -1;
  const activeStance = isNeutral ? null : stances[currentStanceIdx];

  // Cálculo de CA (Base + Bonus da Postura)
  // const stanceBonus = activeStance?.acBonus || 0;
  const stanceBonus = activeStance?.acBonus || 0;
  const totalAC = combatant.armorClass || 10;
  // Barras
  const hpPercent = Math.min(
    100,
    (combatant.hp.current / combatant.hp.max) * 100
  );
  const focusPercent = Math.min(
    100,
    (combatant.currentFocus / combatant.maxFocus) * 100
  );

  // --- HANDLERS INTEGRADOS ---

  const handleUseSkill = (skill: Skill) => {
    // Validações de custo (Foco e Ação)
    const actionKey = getActionKey(skill.actionType);
    if (combatant.currentFocus < skill.cost) {
      showAlert("Sem Foco", "Foco insuficiente.");
      return;
    }
    if (actionKey && !turnActions[actionKey]) {
      showAlert("Sem Ação", "Ação indisponível.");
      return;
    }

    // Update Local (Feedback)
    updateCombatant(
      combatant.id,
      "currentFocus",
      combatant.currentFocus - skill.cost
    );
    if (actionKey) {
      const newActions = { ...turnActions, [actionKey]: false };
      updateCombatant(combatant.id, "turnActions", newActions);
    }

    // Monta Payload
    // Nota: Skills podem ter lógica complexa.
    // Se a skill causa dano direto, você precisaria de um modal similar ao de ataque.
    // Aqui estou assumindo que é um "Uso de Skill" genérico que o Mestre aplica o efeito ou é self-buff.
    const payload: ResolveActionPayload = {
      attackerId: combatant.id,
      targetId: null, // Skill genérica geralmente não tem alvo definido no clique simples
      actionName: skill.name,

      costType: actionKey || "standard",
      focusCost: skill.cost,

      damageAmount: 0, // Skills complexas precisariam de input de dano
      healingAmount: 0,
    };

    sendMessage("RESOLVE_ACTION", payload);
    showAlert("Habilidade", `${skill.name} utilizada.`);
  };

  const handleToggleAction = (type: "standard" | "bonus" | "reaction") => {
    const newVal = !turnActions[type];
    const newActions = { ...turnActions, [type]: newVal };

    updateCombatant(combatant.id, "turnActions", newActions);

    sendMessage("PLAYER_ACTION", {
      character_id: combatant.id,
      action_type: "TOGGLE_ACTION",
      payload: { action_key: type, value: newVal },
    });
  };

  const handleStanceChange = (newIndex: number) => {
    // --- PASSO 1: CALCULAR CA BASE REAL (Recálculo Seguro) ---
    // Em vez de confiar no 'combatant.armorClass' (que pode estar sujo com bônus antigos),
    // recalculamos quanto seria a CA "pelada" baseada na ficha.

    const dexMod = combatant.attributes["Destreza"]?.modifier || 0;
    // Tenta achar defesa de armadura/escudo nos atributos ou usa lógica padrão
    // Se você não tiver esses campos detalhados no combatant, precisaremos confiar no valor atual
    // Mas vamos tentar limpar o bônus atual de forma agressiva:

    // Procura a postura que o sistema ACHA que está ativa
    const currentActiveStance = combatant.stances?.find(
      (s) => s.id === combatant.activeStanceId
    );
    const currentBonusOnServer = currentActiveStance?.acBonus || 0;

    // CA Base estimada = CA do Banco - Bônus da Postura Ativa no Banco
    let baseAC = (combatant.armorClass || 10) - currentBonusOnServer;

    // (Opcional: Trava de segurança para não ficar menor que 10+Des se estiver sem armadura)
    // if (baseAC < 10 + dexMod) baseAC = 10 + dexMod;

    // --- PASSO 2: CALCULAR NOVA CA ---
    let nextStanceId = null;
    let nextAC = baseAC; // Se for neutra, volta para a base limpa

    // Cenário: Entrar em Postura
    if (newIndex !== -1) {
      const newStance = combatant.stances[newIndex];

      if (combatant.activeStanceId === newStance.id) return;

      if (!turnActions.bonus) {
        showAlert("Ação Indisponível", "Entrar em postura requer Ação Bônus.");
        return;
      }

      nextStanceId = newStance.id;
      nextAC = baseAC + (newStance.acBonus || 0);

      // Consome ação
      const newActions = { ...turnActions, bonus: false };
      updateCombatant(combatant.id, "turnActions", newActions);
    }

    // --- LOG PARA DEBUG (Veja no console do celular) ---
    console.log(`🛡️ Mudança de CA:
      Atual no Banco: ${combatant.armorClass}
      Postura Ativa Detectada: ${
        currentActiveStance?.name || "Nenhuma"
      } (Bônus: ${currentBonusOnServer})
      Base Calculada: ${baseAC}
      Nova Postura ID: ${nextStanceId}
      Nova CA Enviada: ${nextAC}
    `);

    // 3. Atualiza Localmente
    updateCombatant(combatant.id, "activeStanceId", nextStanceId);
    updateCombatant(combatant.id, "armorClass", nextAC);

    // 4. Envia
    sendMessage("CHANGE_STANCE", {
      combatantId: combatant.id,
      stanceId: nextStanceId,
      newAC: nextAC,
    });
  };

  const handleEndTurn = () => {
    sendMessage("END_TURN", { character_id: combatant.id });
  };

  const handleConfirmAttack = (
    targetId: string,
    hitTotal: number,
    damageTotal: number,
    isCrit: boolean
  ) => {
    // 1. Busca o alvo para validar a CA (Lógica no Frontend)
    const target = combatants.find((c) => c.id === targetId);

    if (!target) {
      showAlert("Erro", "Alvo não encontrado.");
      return;
    }

    // 2. Verifica se Acertou
    // Se for Crítico, acerta sempre. Se não, compara Totais.
    const isHit = isCrit || hitTotal >= target.armorClass;

    // 3. Define o Dano Final
    // Se errou, manda 0 de dano (o backend registra a ação, mas sem efeito na vida)
    const finalDamage = isHit ? damageTotal : 0;

    // 4. Nome da Ação para o Log
    let actionName = "Ataque Básico";
    if (isCrit) actionName += " (Crítico!)";
    else if (!isHit) actionName += " (Errou)";

    // 5. Monta o Payload EXATO do Python
    const payload: ResolveActionPayload = {
      attackerId: combatant.id,
      targetId: targetId,
      actionName: actionName,

      // Custos (Ataque básico geralmente é Ação Padrão e 0 Foco)
      costType: "standard",
      focusCost: 0,

      // Efeitos
      damageAmount: finalDamage,
      healingAmount: 0,
    };

    // 6. Envia para o servidor
    // O Backend recebe, subtrai o HP se damage > 0 e gera o log
    sendMessage("RESOLVE_ACTION", payload);

    // 7. Consome a Ação Padrão visualmente (Feedback Imediato)
    if (turnActions.standard) {
      const newActions = { ...turnActions, standard: false };
      updateCombatant(combatant.id, "turnActions", newActions);

      // Avisa server que gastou a ação (se o RESOLVE_ACTION já não fizer isso no seu back)
      // Se o seu RESOLVE_ACTION no python já consome a ação baseado no costType,
      // essa linha abaixo NÃO é necessária.
      // sendMessage("PLAYER_ACTION", { ... });
    }

    showAlert(
      isHit ? "Sucesso" : "Errou",
      isHit
        ? `Causou ${finalDamage} de dano!`
        : isGm
        ? `Não superou a CA ${target.armorClass}.` // Mestre vê o número
        : `O ataque não superou a defesa do alvo.` // Jogador vê mensagem vaga
    );
  };

  const getActionColor = (type: string) => {
    const lower = type.toLowerCase();

    if (lower.includes("bônus") || lower.includes("bonus")) return "#fb8c00"; // Laranja
    if (lower.includes("reação") || lower.includes("reaction"))
      return "#8e24aa"; // Roxo
    if (lower.includes("padrão") || lower.includes("standard"))
      return colors.primary; // Azul/Cor do tema

    return colors.textSecondary; // Cor padrão caso não ache
  };

  return (
    <ScrollView style={{ flex: 1 }}>
      {/* --- HUD --- */}
      <View style={styles.combatHud}>
        <View style={styles.topRow}>
          {/* VIDA */}
          <View style={styles.healthContainer}>
            <View style={styles.resourceHeader}>
              <View style={styles.labelGroup}>
                <Ionicons
                  name="heart"
                  size={14}
                  color={colors.hp || "#ef5350"}
                />
                <Text style={styles.hudLabel}>VIDA</Text>
              </View>
              <Text style={styles.resourceValue}>
                <Text
                  style={[
                    styles.resourceCurrent,
                    { color: colors.hp || "#ef5350" },
                  ]}
                >
                  {combatant.hp.current}
                </Text>
                <Text style={styles.resourceMax}>/{combatant.hp.max}</Text>
              </Text>
            </View>
            <View style={styles.barBackground}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${hpPercent}%`,
                    backgroundColor: colors.hp || "#ef5350",
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.verticalSeparator} />

          {/* CA */}
          <View style={styles.acContainer}>
            <View style={styles.labelGroup}>
              <MaterialCommunityIcons
                name="shield"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.hudLabel}>DEFESA</Text>
            </View>
            <View style={styles.acValueContainer}>
              <Text style={styles.acTotal}>{totalAC}</Text>
              {stanceBonus !== 0 && (
                <View
                  style={[
                    styles.modBadge,
                    {
                      borderColor:
                        stanceBonus > 0 ? colors.success : colors.error,
                    },
                  ]}
                >
                  <Ionicons
                    name={stanceBonus > 0 ? "arrow-up" : "arrow-down"}
                    size={10}
                    color={stanceBonus > 0 ? colors.success : colors.error}
                  />
                </View>
              )}
            </View>
          </View>
        </View>

        {/* FOCO */}
        <View style={styles.bottomRow}>
          <View style={styles.resourceHeader}>
            <View style={styles.labelGroup}>
              <Ionicons name="flash" size={14} color={colors.focus} />
              <Text style={styles.hudLabel}>FOCO</Text>
            </View>
            <Text style={styles.resourceValue}>
              <Text style={[styles.resourceCurrent, { color: colors.focus }]}>
                {combatant.currentFocus}
              </Text>
              <Text style={styles.resourceMax}>/{combatant.maxFocus}</Text>
            </Text>
          </View>
          <View style={styles.barBackground}>
            <View
              style={[
                styles.barFill,
                { width: `${focusPercent}%`, backgroundColor: colors.focus },
              ]}
            />
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        {/* --- SELETOR DE POSTURA --- */}
        <View style={styles.stanceSelectorContainer}>
          <Text style={styles.sectionLabel}>Postura Atual</Text>
          <View style={styles.stanceToggleGroup}>
            {/* Neutra */}
            <TouchableOpacity
              style={[
                styles.stanceBtn,
                isNeutral && styles.stanceBtnNeutralActive,
              ]}
              onPress={() => handleStanceChange(-1)}
            >
              <Text
                style={[
                  styles.stanceBtnText,
                  isNeutral && styles.stanceBtnTextActive,
                ]}
              >
                Neutra
              </Text>
            </TouchableOpacity>

            {/* Postura 1 */}
            <TouchableOpacity
              style={[
                styles.stanceBtn,
                currentStanceIdx === 0 && styles.stanceBtnP1Active,
                currentStanceIdx !== 0 &&
                  !turnActions.bonus && { opacity: 0.5 },
              ]}
              onPress={() => handleStanceChange(0)}
              disabled={currentStanceIdx !== 0 && !turnActions.bonus}
            >
              <Text
                style={[
                  styles.stanceBtnText,
                  currentStanceIdx === 0 && { color: "#fff" },
                ]}
              >
                I
              </Text>
            </TouchableOpacity>

            {/* Postura 2 */}
            <TouchableOpacity
              style={[
                styles.stanceBtn,
                currentStanceIdx === 1 && styles.stanceBtnP2Active,
                currentStanceIdx !== 1 &&
                  !turnActions.bonus && { opacity: 0.5 },
              ]}
              onPress={() => handleStanceChange(1)}
              disabled={currentStanceIdx !== 1 && !turnActions.bonus}
            >
              <Text
                style={[
                  styles.stanceBtnText,
                  currentStanceIdx === 1 && { color: "#fff" },
                ]}
              >
                II
              </Text>
            </TouchableOpacity>
          </View>

          {/* Detalhes da Postura */}
          <View
            style={[
              styles.stanceCard,
              isNeutral
                ? styles.stanceNeutralBg
                : currentStanceIdx === 0
                ? styles.stanceOneBg
                : styles.stanceTwoBg,
            ]}
          >
            <Text style={styles.activeStanceName}>
              {isNeutral ? "Postura Neutra" : activeStance?.name}
            </Text>
            <View style={styles.divider} />
            {isNeutral ? (
              <Text style={styles.neutralText}>
                Você não está focado em nenhuma técnica específica.
              </Text>
            ) : (
              <View style={styles.stanceDetails}>
                <InfoRow
                  label="Benefício"
                  text={activeStance?.benefit}
                  color={colors.success}
                  styles={styles}
                />
                <InfoRow
                  label="Restrição"
                  text={activeStance?.restriction}
                  color={colors.error}
                  styles={styles}
                />
                <InfoRow
                  label="Manobra"
                  text={activeStance?.maneuver}
                  color={colors.focus}
                  styles={styles}
                />
                {activeStance?.recovery && (
                  <InfoRow
                    label="Recuperação"
                    text={activeStance.recovery}
                    color={colors.primary}
                    styles={styles}
                  />
                )}
              </View>
            )}
          </View>
        </View>

        {/* --- RASTREADOR DE AÇÕES --- */}
        <View style={styles.combatSection}>
          <Text style={styles.sectionHeader}>Ações</Text>
          <View style={styles.actionsRow}>
            {["standard", "bonus", "reaction"].map((type) => {
              const key = type as "standard" | "bonus" | "reaction";
              const isActive = turnActions[key];
              const color =
                key === "standard"
                  ? colors.primary
                  : key === "bonus"
                  ? "#fb8c00"
                  : "#8e24aa";
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: isActive ? color : colors.inputBg,
                      opacity: isActive ? 1 : 0.5,
                    },
                  ]}
                  onPress={() => handleToggleAction(key)}
                >
                  <Text style={styles.actionBtnText}>
                    {key === "standard"
                      ? "Padrão"
                      : key === "bonus"
                      ? "Bônus"
                      : "Reação"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {/* <Text style={styles.sectionHeader}>Ações</Text> */}

          {/* BOTÃO GRANDE DE ATAQUE */}
          <TouchableOpacity
            style={[
              styles.mainAttackBtn,
              !turnActions.standard && { opacity: 0.5 },
            ]}
            onPress={() => {
              if (turnActions.standard) setAttackModalOpen(true);
              else showAlert("Sem Ação", "Você já usou sua ação padrão.");
            }}
          >
            <MaterialCommunityIcons name="sword" size={24} color="#fff" />
            <Text style={styles.mainAttackText}>REALIZAR ATAQUE</Text>
          </TouchableOpacity>
        </View>

        {/* --- HABILIDADES --- */}
        <View style={styles.combatSection}>
          <Text style={styles.sectionHeader}>Habilidades</Text>
          {combatant.skills?.map((skill: any) => {
            const actionKey = getActionKey(skill.actionType || skill.action);
            const isAvailable = actionKey ? turnActions[actionKey] : true;
            const hasFocus = combatant.currentFocus >= skill.cost;
            const canUse = isAvailable && hasFocus;

            return (
              <TouchableOpacity
                key={skill.id || Math.random()}
                style={[styles.skillRow, !canUse && { opacity: 0.5 }]}
                disabled={!canUse}
                onPress={() => handleUseSkill(skill)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.skillName}>{skill.name}</Text>
                  <Text
                    style={[
                      styles.skillType,
                      { color: getActionColor(skill.actionType) },
                    ]}
                  >
                    {skill.actionType}
                  </Text>
                  <Text style={styles.detailText}>{skill.description}</Text>
                </View>
                <View style={styles.skillCost}>
                  <Text style={{ fontWeight: "bold", color: colors.text }}>
                    {skill.cost} Foco
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.endTurnBtnBig} onPress={handleEndTurn}>
          <Text style={styles.endTurnText}>ENCERRAR MEU TURNO</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 40 }} />

      <AttackModal
        visible={attackModalOpen}
        onClose={() => setAttackModalOpen(false)}
        attacker={combatant}
        potentialTargets={combatants}
        onConfirmAttack={handleConfirmAttack}
        isGm={isGm}
      />
    </ScrollView>
  );
};

const InfoRow = ({ label, text, color, styles }: any) => (
  <View style={styles.infoRow}>
    <Text style={[styles.infoLabel, { color }]}>{label}:</Text>
    <Text style={styles.infoText}>{text}</Text>
  </View>
);

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    // HUD ATIVO
    combatHud: {
      backgroundColor: colors.surface,
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginBottom: 16,
      borderBottomWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    healthContainer: { flex: 1, marginRight: 16 },
    verticalSeparator: {
      width: 1,
      height: 40,
      backgroundColor: colors.border,
      marginRight: 16,
    },
    acContainer: { alignItems: "center", minWidth: 60 },
    bottomRow: { width: "100%" },
    resourceHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginBottom: 6,
    },
    labelGroup: { flexDirection: "row", alignItems: "center", gap: 6 },
    hudLabel: { fontSize: 11, fontWeight: "bold", color: colors.textSecondary },
    resourceValue: { fontSize: 12, color: colors.textSecondary },
    resourceCurrent: { fontSize: 16, fontWeight: "900" },
    resourceMax: { fontSize: 12, fontWeight: "600", opacity: 0.7 },
    barBackground: {
      height: 10,
      backgroundColor: colors.inputBg,
      borderRadius: 5,
      overflow: "hidden",
    },
    barFill: { height: "100%", borderRadius: 5 },
    acValueContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 2,
    },
    acTotal: { fontSize: 28, fontWeight: "bold", color: colors.text },
    modBadge: {
      width: 18,
      height: 18,
      borderRadius: 9,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
    },

    // STANCE & SECTIONS
    stanceSelectorContainer: { marginBottom: 16 },
    sectionLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "bold",
      textTransform: "uppercase",
      marginBottom: 8,
    },
    stanceToggleGroup: {
      flexDirection: "row",
      backgroundColor: colors.inputBg,
      borderRadius: 8,
      padding: 2,
      marginBottom: 8,
    },
    stanceBtn: {
      flex: 1,
      paddingVertical: 8,
      alignItems: "center",
      borderRadius: 6,
    },
    stanceBtnText: { fontWeight: "600", color: colors.textSecondary },
    stanceBtnNeutralActive: { backgroundColor: colors.surface, elevation: 2 },
    stanceBtnP1Active: { backgroundColor: "#1976d2", elevation: 2 },
    stanceBtnP2Active: { backgroundColor: "#f57c00", elevation: 2 },
    stanceBtnTextActive: { color: colors.text },
    stanceCard: {
      borderRadius: 12,
      padding: 16,
      elevation: 2,
      minHeight: 120,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    stanceNeutralBg: {
      borderLeftWidth: 5,
      borderLeftColor: colors.textSecondary,
    },
    stanceOneBg: { borderLeftWidth: 5, borderLeftColor: "#1976d2" },
    stanceTwoBg: { borderLeftWidth: 5, borderLeftColor: "#f57c00" },
    activeStanceName: {
      fontSize: 20,
      fontWeight: "bold",
      textAlign: "center",
      color: colors.text,
      marginBottom: 8,
    },
    divider: { height: 1, backgroundColor: colors.border, marginBottom: 12 },
    neutralText: {
      textAlign: "center",
      color: colors.textSecondary,
      fontStyle: "italic",
      marginTop: 10,
    },
    stanceDetails: { gap: 8 },
    infoRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "flex-start",
    },
    infoLabel: { fontWeight: "bold", marginRight: 6, fontSize: 14 },
    infoText: {
      fontSize: 14,
      color: colors.textSecondary,
      flex: 1,
      lineHeight: 20,
    },

    combatSection: { marginBottom: 20 },
    sectionHeader: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.textSecondary,
      textTransform: "uppercase",
      marginBottom: 10,
    },
    actionsRow: { flexDirection: "row", gap: 10 },
    actionBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: "center" },
    actionBtnText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 11,
      textTransform: "uppercase",
    },
    skillRow: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    skillName: { fontWeight: "bold", color: colors.text, fontSize: 14 },
    skillType: { fontSize: 12, color: colors.primary, marginTop: 2 },
    detailText: { color: colors.textSecondary, fontSize: 12 },
    skillCost: {
      justifyContent: "center",
      paddingLeft: 10,
      borderLeftWidth: 1,
      borderColor: colors.border,
    },
    endTurnBtnBig: {
      marginVertical: 16,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.success,
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
      borderStyle: "dashed",
    },
    endTurnText: {
      color: colors.success,
      fontWeight: "900",
      fontSize: 16,
      letterSpacing: 1,
    },

    // SPECTATOR & COMMON
    spectatorCard: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      marginBottom: 10,
      borderRadius: 8,
      padding: 10,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    initBadge: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.inputBg,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },
    initText: { fontWeight: "bold", color: colors.text },
    spectatorName: { fontWeight: "bold", fontSize: 16, color: colors.text },
    spectatorStatus: {
      fontSize: 10,
      color: colors.textSecondary,
      marginTop: 2,
      fontStyle: "italic",
    },
    miniBarBg: {
      height: 6,
      backgroundColor: colors.inputBg,
      borderRadius: 3,
      marginTop: 6,
      overflow: "hidden",
    },
    miniBarFill: { height: "100%", borderRadius: 3 },
    empty: { textAlign: "center", marginTop: 50, color: colors.textSecondary },
    turnBanner: {
      padding: 12,
      paddingHorizontal: 16,
      alignItems: "center",
      borderBottomWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    turnBannerText: { fontWeight: "bold", fontSize: 16, color: colors.text },
    disconnectBtn: { padding: 4 },

    // CONFIG & MODALS
    configCard: {
      backgroundColor: colors.surface,
      padding: 24,
      borderRadius: 16,
      elevation: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    configTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: colors.text,
      marginVertical: 8,
    },
    label: {
      fontSize: 12,
      fontWeight: "bold",
      color: colors.textSecondary,
      marginBottom: 6,
      textTransform: "uppercase",
    },
    input: {
      backgroundColor: colors.inputBg,
      padding: 14,
      borderRadius: 8,
      marginBottom: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      fontSize: 16,
    },
    connectBtn: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 8,
      flexDirection: "row",
      gap: 8,
      justifyContent: "center",
    },
    connectBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      padding: 20,
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      elevation: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
      textAlign: "center",
      marginBottom: 8,
    },
    modalSubtitle: {
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 20,
    },
    rollBtn: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      marginBottom: 10,
    },
    rollBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
    modalBtn: {
      padding: 14,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    mainAttackBtn: {
      backgroundColor: "#d32f2f", // Vermelho sangue
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      borderRadius: 8,
      marginBottom: 12,
      marginTop: 12,
      gap: 8,
      elevation: 3,
    },
    mainAttackText: {
      color: "#fff",
      fontWeight: "900",
      fontSize: 16,
      letterSpacing: 1,
    },
  });
