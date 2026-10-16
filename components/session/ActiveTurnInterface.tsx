import { useCampaign } from "@/context/CampaignContext";
import { stanceArmorBonus, weaponDamageFormula } from "@/utils/combatRules";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAlert } from "@/context/AlertContext";
import { useTheme } from "@/context/ThemeContext";
import { useWebSocket } from "@/context/WebSocketContext";
import {
  ActionCostType,
  AttributeName,
  Combatant,
  ResolveActionPayload,
  Skill,
  Spell,
} from "@/types/rpg";
import { getActionKey } from "@/utils/rpgUtils";

import { AreaAttackModal } from "../modals/AreaAttackModal";
import { AttackModal } from "../modals/AttackModal";
import { ConditionManagerModal } from "../modals/ConditionManagerModal";
import { HealModal } from "../modals/HealModal";
import { ActionTracker } from "../rpg/ActionTracker";
import { CombatHud } from "../rpg/CombatHud";
import { DeathSaveMonitor } from "../rpg/DeathSaveMonitor";
import { SkillCard } from "../rpg/SkillCard";
import { SpellCard } from "../rpg/SpellCard";
import { StanceSelector } from "../rpg/StanceSelector";
import { SpectatorCard } from "./SpectatorCard";

interface Props {
  combatant: Combatant;
  isGm?: boolean;
}

const ActiveTurnInterfaceComponent = ({ combatant, isGm = false }: Props) => {
  const { updateCombatant, combatants, activeTurnId, isOfflineMode, nextTurn } =
    useCampaign();
  const { sendMessage } = useWebSocket();
  const { showAlert } = useAlert();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const [attackModalOpen, setAttackModalOpen] = useState(false);
  const [areaAttackModalOpen, setAreaAttackModalOpen] = useState(false);
  const [battlefieldVisible, setBattlefieldVisible] = useState(false);
  const [spellAttackConfig, setSpellAttackConfig] = useState<{
    bonus: string;
    damage: string;
    name: string;
    cost: number;
    actionKey: keyof Combatant["turnActions"];
  } | null>(null);

  const [healModalOpen, setHealModalOpen] = useState(false);
  const [spellHealConfig, setSpellHealConfig] = useState<{
    formula: string;
    name: string;
    cost: number;
    modifier: number;
    actionKey: keyof Combatant["turnActions"];
  } | null>(null);

  const [conditionModalOpen, setConditionModalOpen] = useState(false);

  // Garante que actions existe com valores padrão
  const incapacitated = (combatant.conditions ?? []).some((c) =>
    ["Incapacitado", "Paralisado", "Atordoado"].includes(c.name));
  const turnActions = incapacitated ? { standard: false, bonus: false, reaction: false } : combatant.turnActions || {
    standard: true,
    bonus: true,
    reaction: true,
  };

  const [isEndingTurn, setIsEndingTurn] = useState(false);

  const handleEndTurn = () => {
    if (isEndingTurn) return;
    setIsEndingTurn(true);

    if (isOfflineMode && nextTurn) {
      nextTurn();
    } else {
      sendMessage("END_TURN", { character_id: combatant.id });
    }

    setTimeout(() => {
      setIsEndingTurn(false);
    }, 2000);
  };

  // --- LÓGICA DE DEATH SAVES ---
  const handleDeathSaveRoll = (manualRoll?: number) => {
    let d20: number;

    if (manualRoll !== undefined) {
      if (isNaN(manualRoll) || manualRoll < 1 || manualRoll > 20) {
        showAlert("Valor Inválido", "Insira um valor entre 1 e 20.");
        return;
      }
      d20 = manualRoll;
    } else {
      d20 = Math.floor(Math.random() * 20) + 1;
    }

    const currentSuccesses = combatant?.deathSaves?.successes || 0;
    const currentFailures = combatant?.deathSaves?.failures || 0;

    let newSuccesses = currentSuccesses;
    let newFailures = currentFailures;
    let hpUpdate = 0;
    let died = false;
    let resultText = "";

    if (d20 === 20) {
      hpUpdate = 1;
      newSuccesses = 0;
      newFailures = 0;
      resultText = "20 NATURAL! Você renasce com 1 PV!";
    } else if (d20 === 1) {
      newFailures += 2;
      resultText = "FALHA CRÍTICA! (2 Falhas)";
    } else if (d20 >= 10) {
      newSuccesses += 1;
      resultText = "SUCESSO.";
    } else {
      newFailures += 1;
      resultText = "FALHA.";
    }

    // Verifica Estabilização ou Morte
    if (newSuccesses >= 3 && hpUpdate === 0) {
      newSuccesses = 0;
      newFailures = 0;
      hpUpdate = 1;
      resultText += "\n\nESTABILIZOU! (Você acorda com 1 PV)";
    } else if (newFailures >= 3) {
      died = true;
      resultText += "\n\nSEU PERSONAGEM MORREU.";
    }

    // Atualiza HP e Status
    if (hpUpdate > 0) {
      updateCombatant(combatant.id, "hp", {
        ...combatant.hp,
        current: hpUpdate,
      });
      updateCombatant(combatant.id, "deathSaves", {
        successes: 0,
        failures: 0,
      });
    } else {
      updateCombatant(combatant.id, "deathSaves", {
        successes: Math.min(3, newSuccesses),
        failures: Math.min(3, newFailures),
      });
    }

    // Gasta Ação Padrão caso seja necessário
    if (turnActions.standard) {
      updateCombatant(combatant.id, "turnActions", {
        ...turnActions,
        standard: false,
      });
    }

    // Dispara via Socket
    if (!isOfflineMode) {
      sendMessage("ROLL_DEATH_SAVE", {
        combatantId: combatant.id,
        rollValue: d20,
      });
    }

    showAlert(
      hpUpdate > 0 ? "Salvo!" : died ? "Morte" : "Teste de Morte",
      `Rolagem: ${d20}\n${resultText}`,
    );

    handleEndTurn();
  };

  // --- RENDERIZAÇÃO CONDICIONAL DE MORTE ---
  if (combatant.hp.current <= 0) {
    if (combatant.type !== "player") return (
      <View style={{ padding: 20 }}>
        <Text style={{ color: colors.text }}>
          {(combatant.currentPhaseIndex ?? 0) < (combatant.phases?.length ?? 0)
            ? "Aguardando o mestre avançar para a próxima fase."
            : "Combatente derrotado."}
        </Text>
        <TouchableOpacity onPress={handleEndTurn}>
          <Text style={{ color: colors.primary, paddingVertical: 16 }}>PASSAR TURNO</Text>
        </TouchableOpacity>
      </View>
    );
    return (
      <DeathSaveMonitor
        successes={combatant.deathSaves?.successes || 0}
        failures={combatant.deathSaves?.failures || 0}
        onUpdateSave={(type, val) => {
          // O GM ou o Jogador clicou direto na "bolinha"
          updateCombatant(combatant.id, "deathSaves", {
            ...(combatant.deathSaves || { successes: 0, failures: 0 }),
            [type]: val,
          });
        }}
        onRoll={handleDeathSaveRoll}
        onEndTurn={handleEndTurn}
      />
    );
  }

  // --- LÓGICA DE DADOS (Combate Ativo) ---
  const stances = combatant.stances || [];
  const currentStanceIdx = stances.findIndex(
    (s: any) => s.id === combatant.activeStanceId,
  );
  const isNeutral = currentStanceIdx === -1;
  const activeStance = isNeutral ? null : stances[currentStanceIdx];
  const stanceBonus = stanceArmorBonus(activeStance, combatant);

  // --- HANDLERS DE AÇÕES (Magias, Habilidades, etc) ---
  const handleCastSpell = (spell: Spell) => {
    if (combatant.focus.current < spell.cost) {
      showAlert("Sem Foco", "Foco insuficiente.");
      return;
    }
    const actionKey = getActionKey(spell.actionType || "standard");
    if (actionKey && !turnActions[actionKey]) {
      showAlert("Sem Ação", "Ação indisponível.");
      return;
    }

    const intMod = combatant.attributes?.["Inteligência"]?.modifier || 0;
    const wisMod = combatant.attributes?.["Sabedoria"]?.modifier || 0;
    const magicMod = Math.max(intMod, wisMod);

    if (spell.isAttack) {
      setSpellAttackConfig({
        bonus: magicMod >= 0 ? `+${magicMod}` : `${magicMod}`,
        damage: spell.damageFormula || "1d4",
        name: spell.name,
        cost: spell.cost,
        actionKey: actionKey ?? "standard",
      });

      setAttackModalOpen(true);
    } else if (spell.isHealing) {
      setSpellHealConfig({
        formula: spell.healFormula || "1d4",
        name: spell.name,
        cost: spell.cost,
        modifier: magicMod,
        actionKey: actionKey ?? "standard",
      });
      setHealModalOpen(true);
    } else {
      const payload: ResolveActionPayload = {
        attackerId: combatant.id,
        targetId: null,
        actionName: spell.name,
        costType: actionKey || "standard",
        focusCost: spell.cost,
        damageAmount: 0,
        healingAmount: 0,
      };

      if (!isOfflineMode) {
        sendMessage("RESOLVE_ACTION", payload);
      }

      updateCombatant(
        combatant.id,
        "focus",
        Math.max(0, combatant.focus.current - spell.cost),
      );

      if (actionKey) {
        updateCombatant(combatant.id, "turnActions", {
          ...turnActions,
          [actionKey]: false,
        });
      }

      showAlert("Magia", `${spell.name} conjurada!`);
    }
  };

  const handleConfirmHeal = (targetId: string, healAmount: number) => {
    if (!spellHealConfig) return;
    const actionKey = spellHealConfig.actionKey;
    if (incapacitated || !turnActions[actionKey] || combatant.focus.current < spellHealConfig.cost) {
      showAlert("Ação indisponível", "Confira as ações e o foco disponíveis antes de confirmar a cura.");
      return;
    }

    const target = combatants.find((c) => c.id === targetId);
    if (!target) return;

    const payload: ResolveActionPayload = {
      attackerId: combatant.id,
      targetId: targetId,
      actionName: spellHealConfig.name,
      costType: actionKey,
      focusCost: spellHealConfig.cost,
      damageAmount: 0,
      healingAmount: healAmount,
    };

    if (!isOfflineMode) {
      sendMessage("RESOLVE_ACTION", payload);
      setSpellHealConfig(null);
      setHealModalOpen(false);
      return; // O evento do servidor confirma PV, foco e ações.
    }

    if (target) {
      if (target.hp.current <= 0) {
        updateCombatant(targetId, "deathSaves", { successes: 0, failures: 0 });
      }
      const newHp = Math.min(target.hp.max, target.hp.current + healAmount);
      updateCombatant(targetId, "hp", { ...target.hp, current: newHp });
    }

    updateCombatant(
      combatant.id,
      "focus",
      Math.max(0, combatant.focus.current - spellHealConfig.cost),
    );

    if (turnActions[actionKey]) {
      updateCombatant(combatant.id, "turnActions", {
        ...turnActions,
        [actionKey]: false,
      });
    }

    setSpellHealConfig(null);
    showAlert("Cura Realizada", `${healAmount} PV restaurados.`);
  };

  // ActiveTurnInterface.tsx

  const handleUseSkill = (skill: Skill) => {
    const actionKey = getActionKey(skill.actionType);
    console.log("DADOS SKILL USADA: ", skill);

    if (combatant.focus.current < skill.cost) {
      showAlert("Sem Foco", "Foco insuficiente.");
      return;
    }
    if (actionKey && !turnActions[actionKey]) {
      showAlert("Sem Ação", "Ação indisponível neste turno.");
      return;
    }

    // 2. É UMA HABILIDADE DE ATAQUE? (Usa arma ou tem dano bônus)
    if (skill.usesWeaponDamage || skill.bonusDamage) {
      // Descobrir qual arma usar
      let weaponToUse = combatant.weapons?.melee; // Padrão é corpo-a-corpo

      if (skill.weaponType === "ranged") {
        weaponToUse = combatant.weapons?.ranged;
      } else if (skill.weaponType === "any") {
        // Se pode usar qualquer uma, pega a que tiver o melhor atributo (ou deixa o jogador escolher depois, mas aqui simplificamos para a melee como fallback)
        weaponToUse = combatant.weapons?.melee;
      }

      // Descobrir o Modificador de Atributo (Força ou Destreza)
      const attrName = weaponToUse?.attribute || "Força";
      const attrMod = combatant.attributes?.[attrName]?.modifier || 0;

      // Bônus de Acerto (+Força ou +Destreza)
      const attackBonusString = attrMod >= 0 ? `+${attrMod}` : `${attrMod}`;

      // Montar a Fórmula de Dano
      let damageFormulaElements = [];

      if (skill.usesWeaponDamage && weaponToUse?.damage) {
        // Adiciona o dano da arma + o atributo (ex: "1d8+3")
        // Obs: Se o dano da arma no JSON já vier com o "+3" embutido, não soma de novo.
        // Assumindo que weapon.damage é só os dados (ex: "1d8")
        const baseDmg = weaponDamageFormula(weaponToUse, attrMod);

        damageFormulaElements.push(baseDmg);
      }

      if (skill.bonusDamage) {
        damageFormulaElements.push(skill.bonusDamage); // Adiciona o bônus da skill (ex: "1d6")
      }

      const finalDamageFormula = damageFormulaElements.join(" + ") || "0";

      // Abre o Modal de Ataque com as informações pré-preenchidas
      setSpellAttackConfig({
        name: skill.name,
        cost: skill.cost,
        bonus: attackBonusString,
        damage: finalDamageFormula,
        actionKey: actionKey ?? "standard",
      });
      setAttackModalOpen(true);
    }
    // 3. É UMA HABILIDADE DE CURA?
    else if (skill.isHealing) {
      // Lógica de cura (similar ao que você já tem no handleCastSpell)
      const intMod = combatant.attributes?.["Inteligência"]?.modifier || 0;
      setSpellHealConfig({
        formula: skill.healFormula || "1d4",
        name: skill.name,
        cost: skill.cost,
        modifier: intMod,
        actionKey: actionKey ?? "standard",
      });
      setHealModalOpen(true);
    }
    // 4. É UM BUFF / HABILIDADE DE SUPORTE (Resolução Imediata)
    else {
      // Consome o Foco e a Ação imediatamente
      updateCombatant(
        combatant.id,
        "focus",
        Math.max(0, combatant.focus.current - skill.cost),
      );
      if (actionKey) {
        updateCombatant(combatant.id, "turnActions", {
          ...turnActions,
          [actionKey]: false,
        });
      }

      const payload: ResolveActionPayload = {
        attackerId: combatant.id,
        targetId: null,
        actionName: skill.name,
        costType: actionKey || "standard",
        focusCost: skill.cost,
        damageAmount: 0,
        healingAmount: 0,
      };

      if (!isOfflineMode) {
        sendMessage("RESOLVE_ACTION", payload);
      }
      showAlert("Habilidade", `${skill.name} utilizada.`);
    }
  };

  const handleStanceChange = (newIndex: number) => {
    if (incapacitated) return;
    const currentActiveStance = combatant.stances?.find(
      (s) => s.id === combatant.activeStanceId,
    );
    const currentBonusOnServer = stanceArmorBonus(currentActiveStance, combatant);
    const safeBaseAC = combatant.armorClass - currentBonusOnServer;

    let nextStanceId = null;
    let nextAC = safeBaseAC;

    if (newIndex !== -1) {
      const newStance = combatant.stances[newIndex];
      if (combatant.activeStanceId === newStance.id) return;

      if (!turnActions.bonus) {
        showAlert("Ação Indisponível", "Entrar em postura requer Ação Bônus.");
        return;
      }

      nextStanceId = newStance.id;
      nextAC = safeBaseAC + stanceArmorBonus(newStance, combatant);

      const newActions = { ...turnActions, bonus: false };
      updateCombatant(combatant.id, "turnActions", newActions);
    }

    updateCombatant(combatant.id, "activeStanceId", nextStanceId);
    updateCombatant(combatant.id, "armorClass", nextAC);

    if (!isOfflineMode) {
      sendMessage("CHANGE_STANCE", {
        combatantId: combatant.id,
        stanceId: nextStanceId,
        newAC: nextAC,
      });
    }
  };

  const handleCloseModal = () => {
    setAttackModalOpen(false);
    setSpellAttackConfig(null);
  };

  const handleConfirmAttack = (
    targetIds: string[],
    hitTotal: number,
    damageTotal: number,
    isCrit: boolean,
  ) => {
    if (targetIds.length === 0) {
      showAlert("Erro", "Nenhum alvo selecionado.");
      return;
    }

    const isSpecialAction = !!spellAttackConfig;
    let baseActionName = isSpecialAction ? spellAttackConfig.name : "Ataque Básico";
    if (isCrit) baseActionName += " (Crítico!)";

    const focusCost = isSpecialAction ? spellAttackConfig.cost : 0;
    const actionSpent = spellAttackConfig?.actionKey ?? "standard";
    if (incapacitated || !turnActions[actionSpent] || combatant.focus.current < focusCost) {
      showAlert("Ação indisponível", "Confira as ações e o foco disponíveis antes de confirmar o ataque.");
      return;
    }

    // Monta lista de alvos com dano individual baseado no acerto vs CA
    const targets = targetIds
      .map((tid) => {
        const t = combatants.find((c) => c.id === tid);
        if (!t) return null;
        const isHit = isCrit || hitTotal >= t.armorClass;
        return {
          targetId: tid,
          damageAmount: isHit ? damageTotal : 0,
          healingAmount: 0,
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null);

    if (targets.length === 0) return;

    // Determina o nome da ação final
    let actionName = baseActionName;
    if (!isCrit && targetIds.length === 1) {
      const singleTarget = combatants.find((c) => c.id === targetIds[0]);
      if (singleTarget && hitTotal < singleTarget.armorClass) {
        actionName = baseActionName.replace(" (Crítico!)", "") + " (Errou)";
      }
    }

    const payload: ResolveActionPayload = {
      attackerId: combatant.id,
      targetId: targetIds.length === 1 ? targetIds[0] : null,
      targets: targets,
      actionName: actionName,
      costType: actionSpent,
      focusCost: focusCost,
      damageAmount: targetIds.length === 1 ? targets[0]?.damageAmount ?? 0 : 0,
      healingAmount: 0,
    };

    // 1. Envia para o Servidor
    if (!isOfflineMode) {
      sendMessage("RESOLVE_ACTION", payload);
      setSpellAttackConfig(null);
      setAttackModalOpen(false);
      return; // Sem dano local antecipado para comandos que podem ser rejeitados.
    }

    // 2. Resolução offline — cada alvo
    targets.forEach((t) => {
      if (t.damageAmount > 0) {
        const target = combatants.find((c) => c.id === t.targetId);
        if (target) {
          const newHp = Math.max(0, target.hp.current - t.damageAmount);
          updateCombatant(t.targetId, { hp: { ...target.hp, current: newHp } });
        }
      }
    });

    // Consome o mesmo tipo de ação enviado ao servidor.
    if (turnActions[actionSpent]) {
      updateCombatant(combatant.id, {
        turnActions: { ...turnActions, [actionSpent]: false },
      });
    }

    // Atualiza Foco do Atacante
    if (focusCost > 0) {
      const newFocus = Math.max(0, combatant.focus.current - focusCost);
      updateCombatant(combatant.id, {
        focus: { ...combatant.focus, current: newFocus },
      });
    }

    setSpellAttackConfig(null);
    setAttackModalOpen(false);

    // Feedback
    if (targetIds.length === 1) {
      const singleTarget = combatants.find((c) => c.id === targetIds[0]);
      const isHit = isCrit || (singleTarget && hitTotal >= singleTarget.armorClass);
      showAlert(
        isHit ? "Sucesso" : "Errou",
        isHit
          ? `Causou ${damageTotal} de dano!`
          : isGm
            ? `Não superou a CA ${singleTarget?.armorClass}.`
            : `O ataque não superou a defesa do alvo.`,
      );
    } else {
      const hitCount = targets.filter((t) => t.damageAmount > 0).length;
      showAlert(
        "Ataque em Área",
        `${hitCount} de ${targetIds.length} alvos atingidos!${hitCount > 0 ? ` (${damageTotal} de dano cada)` : ""}`,
      );
    }
  };

  const handleConfirmAreaAttack = (
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
    actionName: string = "Ataque em Área",
    costType: ActionCostType = "standard",
    focusCost: number = 0,
  ) => {
    if (targetResults.length === 0) {
      showAlert("Erro", "Nenhum alvo selecionado para a área.");
      return;
    }

    const actionSpent = costType ?? "standard";
    if (
      incapacitated ||
      (actionSpent !== "free" && !turnActions[actionSpent]) ||
      combatant.focus.current < focusCost
    ) {
      showAlert(
        "Ação indisponível",
        "Confira as ações e o foco disponíveis antes de confirmar o ataque em área.",
      );
      return;
    }

    const targets = targetResults
      .map((tr) => {
        const t = combatants.find((c) => c.id === tr.targetId);
        if (!t) return null;
        return {
          targetId: tr.targetId,
          damageAmount: tr.damageAmount,
          healingAmount: 0,
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null);

    if (targets.length === 0) return;

    const payload: ResolveActionPayload = {
      attackerId: combatant.id,
      targetId: null,
      targets: targets,
      actionName: actionName,
      costType: actionSpent,
      focusCost: focusCost,
      damageAmount: 0,
      healingAmount: 0,
    };

    if (!isOfflineMode) {
      sendMessage("RESOLVE_ACTION", payload);
      setAreaAttackModalOpen(false);
      return;
    }

    // Resolução offline
    targets.forEach((t) => {
      if (t.damageAmount > 0) {
        const target = combatants.find((c) => c.id === t.targetId);
        if (target) {
          const newHp = Math.max(0, target.hp.current - t.damageAmount);
          updateCombatant(t.targetId, { hp: { ...target.hp, current: newHp } });
        }
      }
    });

    if (actionSpent !== "free" && turnActions[actionSpent]) {
      updateCombatant(combatant.id, {
        turnActions: { ...turnActions, [actionSpent]: false },
      });
    }

    if (focusCost > 0) {
      const newFocus = Math.max(0, combatant.focus.current - focusCost);
      updateCombatant(combatant.id, {
        focus: { ...combatant.focus, current: newFocus },
      });
    }

    setAreaAttackModalOpen(false);

    const hitCount = targets.filter((t) => t.damageAmount > 0).length;
    showAlert(
      "Ataque em Área Realizado",
      `${actionName} (CD ${saveDC} ${saveAttribute})\n${hitCount} de ${targets.length} alvos sofreram dano.`,
    );
  };

  // --- RENDERIZAÇÃO NORMAL (Combate Ativo) ---
  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, marginTop: 10, marginBottom: 5 }}>
        <TouchableOpacity
          style={styles.battlefieldBtn}
          onPress={() => setBattlefieldVisible(true)}
        >
          <MaterialCommunityIcons name="eye" size={20} color={colors.text} />
          <Text style={[styles.battlefieldBtnText, { color: colors.text }]}>
            VER CAMPO DE BATALHA
          </Text>
        </TouchableOpacity>
      </View>

      {/* --- HUD DE COMBATE --- */}
      <CombatHud
        health={combatant.hp}
        focus={combatant.focus}
        armorClass={combatant.armorClass}
        stanceMod={stanceBonus}
        conditions={combatant.conditions || []}
      />

      <View style={{ paddingHorizontal: 16 }}>
        {((combatant.feats?.length ?? 0) > 0 || combatant.factionFeat || combatant.specialFeat) && (
          <View style={styles.combatSection}>
            <Text style={styles.sectionHeader}>Façanhas</Text>
            {[...(combatant.feats ?? []), combatant.factionFeat, combatant.specialFeat].filter((feat) => !!feat).map((feat) => (
              <View key={feat.id} style={{ marginBottom: 8 }}>
                <Text style={{ color: colors.text, fontWeight: "bold" }}>{feat.name}</Text>
                <Text style={{ color: colors.textSecondary }}>{feat.benefit}</Text>
              </View>
            ))}
            <Text style={{ color: colors.textSecondary }}>Bônus numéricos automáticos já estão na ficha. Efeitos condicionais e façanhas customizadas são resolvidos manualmente.</Text>
          </View>
        )}
        {/* --- SELETOR DE POSTURA --- */}
        {combatant.stances && combatant.stances.length > 0 && (
          <StanceSelector
            stances={combatant.stances}
            activeStanceId={combatant.activeStanceId}
            turnActions={turnActions}
            onStanceChange={handleStanceChange}
          />
        )}

        {/* --- BOTÃO GERENCIAR CONDIÇÕES (GM) --- */}
        {isGm && (
          <TouchableOpacity
            style={styles.conditionBtn}
            onPress={() => setConditionModalOpen(true)}
          >
            <MaterialCommunityIcons name="shield-alert" size={18} color={colors.text} />
            <Text style={[styles.battlefieldBtnText, { color: colors.text }]}>
              GERENCIAR CONDIÇÕES{combatant.conditions?.length ? ` (${combatant.conditions.length})` : ""}
            </Text>
          </TouchableOpacity>
        )}

        {/* --- RASTREADOR DE AÇÕES --- */}
        <View style={styles.combatSection}>
          <Text style={styles.sectionHeader}>Ações</Text>
          <ActionTracker turnActions={turnActions} onToggle={(type) => {
            if (isOfflineMode && !incapacitated) updateCombatant(combatant.id, "turnActions", {
              ...turnActions, [type]: !turnActions[type],
            });
          }} />

          <View style={styles.attackButtonGroup}>
            <TouchableOpacity
              style={[
                styles.mainAttackBtn,
                !turnActions.standard && { opacity: 0.5 },
                { flex: 1, marginRight: 8 },
              ]}
              onPress={() => {
                if (turnActions.standard) setAttackModalOpen(true);
                else showAlert("Sem Ação", "Você já usou sua ação padrão.");
              }}
            >
              <MaterialCommunityIcons name="sword" size={20} color="#fff" />
              <Text style={styles.mainAttackText}>ATAQUE DIRETO</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.areaAttackBtn,
                !turnActions.standard && { opacity: 0.5 },
                { flex: 1 },
              ]}
              onPress={() => {
                if (turnActions.standard) setAreaAttackModalOpen(true);
                else showAlert("Sem Ação", "Você já usou sua ação padrão.");
              }}
            >
              <MaterialCommunityIcons name="image-filter-vintage" size={20} color="#fff" />
              <Text style={styles.areaAttackBtnText}>ATAQUE EM ÁREA</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- SEÇÃO GRIMÓRIO --- */}
        {combatant.spells && combatant.spells.length > 0 && (
          <View style={styles.combatSection}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <MaterialCommunityIcons
                name="auto-fix"
                size={20}
                color="#b39ddb"
              />
              <Text
                style={[
                  styles.sectionHeader,
                  { marginBottom: 0, color: "#b39ddb" },
                ]}
              >
                Grimório
              </Text>
            </View>

            {combatant.spells.map((spell) => (
              <SpellCard
                key={spell.id}
                spell={spell}
                character={combatant}
                onCast={handleCastSpell}
              />
            ))}
          </View>
        )}

        {/* --- HABILIDADES FÍSICAS --- */}
        {combatant.skills && combatant.skills.length > 0 && (
          <View style={styles.combatSection}>
            <Text style={styles.sectionHeader}>Habilidades</Text>
            {combatant.skills.map((skill: Skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                character={combatant}
                onPress={() => handleUseSkill(skill)}
                showAlert={showAlert}
              />
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.endTurnBtnBig, isEndingTurn && { opacity: 0.5 }]}
          onPress={handleEndTurn}
          disabled={isEndingTurn}
        >
          <Text style={styles.endTurnText}>
            {isEndingTurn ? "ENCERRANDO..." : "ENCERRAR MEU TURNO"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />

      <AttackModal
        visible={attackModalOpen}
        onClose={handleCloseModal}
        attacker={combatant}
        potentialTargets={combatants}
        onConfirmAttack={handleConfirmAttack}
        isGm={isGm}
        initialBonus={spellAttackConfig?.bonus}
        initialDamage={spellAttackConfig?.damage}
        onSwitchToAreaAttack={() => {
          setAttackModalOpen(false);
          setAreaAttackModalOpen(true);
        }}
      />

      <AreaAttackModal
        visible={areaAttackModalOpen}
        onClose={() => setAreaAttackModalOpen(false)}
        attacker={combatant}
        potentialTargets={combatants}
        onConfirmAreaAttack={handleConfirmAreaAttack}
        isGm={isGm}
      />

      {spellHealConfig && (
        <HealModal
          visible={healModalOpen}
          onClose={() => {
            setHealModalOpen(false);
            setSpellHealConfig(null);
          }}
          healer={combatant}
          potentialTargets={combatants}
          onConfirmHeal={handleConfirmHeal}
          spellName={spellHealConfig.name}
          healFormula={spellHealConfig.formula}
          modifier={spellHealConfig.modifier}
        />
      )}

      {/* --- MODAL DO CAMPO DE BATALHA --- */}
      <Modal
        visible={battlefieldVisible}
        animationType="slide"
        presentationStyle="pageSheet" // Estilo card no iOS
        onRequestClose={() => setBattlefieldVisible(false)}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <SafeAreaView
            style={[styles.modalHeader, { borderColor: colors.border }]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: colors.text, marginBottom: 0 },
              ]}
            >
              Situação do Combate
            </Text>
            <TouchableOpacity onPress={() => setBattlefieldVisible(false)}>
              <Text style={{ color: colors.primary, fontWeight: "bold" }}>
                Voltar para Ação
              </Text>
            </TouchableOpacity>
          </SafeAreaView>

          <FlatList
            data={combatants}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <SpectatorCard
                item={item}
                activeTurnId={activeTurnId}
                colors={colors}
                isGm={isGm}
              />
            )}
          />
        </View>
      </Modal>

      {/* --- MODAL GERENCIAR CONDIÇÕES --- */}
      <ConditionManagerModal
        visible={conditionModalOpen}
        onClose={() => setConditionModalOpen(false)}
        combatant={combatant}
      />
    </ScrollView>
  );
};

export const ActiveTurnInterface = React.memo(
  ActiveTurnInterfaceComponent,
  (prev, next) => {
    return (
      prev.combatant === next.combatant &&
      prev.isGm === next.isGm
    );
  },
);

export default ActiveTurnInterface;

// ESTILOS LIMPOS (Sem rastros do antigo menu de Death Saves)
const getStyles = (colors: any, isDark: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    // SECTIONS & HUD
    combatSection: { marginBottom: 20 },
    sectionHeader: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.textSecondary,
      textTransform: "uppercase",
      marginBottom: 10,
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

    // BUTTONS
    attackButtonGroup: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 12,
    },
    mainAttackBtn: {
      backgroundColor: "#d32f2f", // Vermelho sangue
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 14,
      borderRadius: 8,
      gap: 6,
      elevation: 3,
    },
    mainAttackText: {
      color: "#fff",
      fontWeight: "900",
      fontSize: 13,
      letterSpacing: 0.5,
    },
    areaAttackBtn: {
      backgroundColor: "#c2185b", // Magenta / explosão
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 14,
      borderRadius: 8,
      gap: 6,
      elevation: 3,
    },
    areaAttackBtnText: {
      color: "#fff",
      fontWeight: "900",
      fontSize: 13,
      letterSpacing: 0.5,
    },
    battlefieldBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
      marginBottom: 8,
    },
    battlefieldBtnText: {
      fontWeight: "bold",
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    conditionBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#ff7043" + "60",
      gap: 8,
      marginBottom: 12,
    },

    // MODAL
    modalContainer: { flex: 1 },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      backgroundColor: colors.surface,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      textAlign: "center",
    },
  });
