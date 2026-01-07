// app/(tabs)/combat.tsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useCharacter } from "../../context/CharacterContext";
import { Skill } from "../../types/rpg";

export default function CombatScreen() {
  // Precisamos acessar o setCharacter diretamente para mudar o index para -1 (se o toggleStance original só alternar 0/1)
  // Se o seu contexto não exporta setCharacter, vamos criar uma função auxiliar aqui ou assumir que você alterou o Contexto.
  // Vou assumir que você vai adicionar a função `setStanceIndex` no Contexto ou usar a lógica abaixo.

  // SOLUÇÃO SIMPLES: Vamos modificar como usamos o toggleStance.
  // Se o seu contexto tiver apenas toggleStance (0 <-> 1), precisamos adicionar uma função `setStance` no Contexto.
  // Mas para não quebrar tudo agora, vou simular visualmente aqui e assumir que você adicionou `setStanceIndex` no Contexto.

  const { character, updateStat, toggleStance, setStanceIndex } =
    useCharacter();
  // ^^^ ADICIONE setStanceIndex NO SEU CONTEXTO (veja abaixo como)

  // -1 = Neutra, 0 = Postura 1, 1 = Postura 2
  const currentStanceIdx = character.currentStanceIndex ?? -1;
  const isNeutral = currentStanceIdx === -1;

  const activeStance = isNeutral ? null : character.stances[currentStanceIdx];
  const focus = character.stats.focus;

  // --- CÁLCULO DINÂMICO DA CA ---
  const armorClassInfo = useMemo(() => {
    const armorDef = character.equipment.armor.defense || 0;
    const shieldDef = character.equipment.shield.defense || 0;

    // Busca Destreza
    const dexMod =
      Object.values(character.attributes).find(
        (attr) => attr.name === "Destreza"
      )?.modifier || 0;

    // 1. Cálculo Base
    let baseAC = 0;
    if (armorDef === 0) {
      baseAC = 10 + dexMod;
    } else if (armorDef >= 16) {
      baseAC = armorDef;
    } else {
      baseAC = armorDef + Math.min(dexMod, 2);
    }
    baseAC += shieldDef;

    // 2. Modificadores de Postura
    let stanceMod = 0;

    // SÓ APLICA SE NÃO FOR NEUTRA
    if (!isNeutral && activeStance) {
      const sId = activeStance.id;
      if (sId === "gue_defensor") stanceMod = 1;
      if (sId === "gue_ofensiva") stanceMod = -2;
      if (sId === "cor_danca") stanceMod = 2;
      if (sId === "cor_explosao") stanceMod = -2;
    }

    return { total: baseAC + stanceMod, stanceMod, base: baseAC };
  }, [character.equipment, character.attributes, currentStanceIdx]);

  const renderSkill = ({ item }: { item: Skill }) => <SkillCard skill={item} />;

  return (
    <View style={styles.container}>
      {/* HUD DE COMBATE */}
      <View style={styles.combatHud}>
        <View style={styles.focusContainer}>
          <View style={styles.focusHeader}>
            <View style={styles.labelGroup}>
              <Ionicons name="flash" size={14} color="#1e88e5" />
              <Text style={styles.hudLabel}>FOCO</Text>
            </View>
            <Text style={styles.focusValue}>
              {focus.current}/{focus.max}
            </Text>
          </View>
          <View style={styles.focusBarBg}>
            <View
              style={[
                styles.focusBarFill,
                { width: `${(focus.current / focus.max) * 100}%` },
              ]}
            />
          </View>
        </View>

        <View style={styles.verticalDivider} />

        <View style={styles.acContainer}>
          <View style={styles.labelGroup}>
            <MaterialCommunityIcons name="shield" size={14} color="#555" />
            <Text style={styles.hudLabel}>DEFESA</Text>
          </View>
          <View style={styles.acValueContainer}>
            <Text style={styles.acTotal}>{armorClassInfo.total}</Text>
            {armorClassInfo.stanceMod !== 0 && (
              <View
                style={[
                  styles.modBadge,
                  {
                    backgroundColor:
                      armorClassInfo.stanceMod > 0 ? "#e8f5e9" : "#ffebee",
                  },
                ]}
              >
                <Ionicons
                  name={
                    armorClassInfo.stanceMod > 0 ? "arrow-up" : "arrow-down"
                  }
                  size={10}
                  color={armorClassInfo.stanceMod > 0 ? "green" : "red"}
                />
              </View>
            )}
          </View>
        </View>
      </View>

      {/* --- SELETOR DE POSTURA (3 BOTÕES) --- */}
      <View style={styles.stanceSelectorContainer}>
        <Text style={styles.sectionLabel}>Postura Atual</Text>
        <View style={styles.stanceToggleGroup}>
          {/* Botão Neutra */}
          <TouchableOpacity
            style={[
              styles.stanceBtn,
              isNeutral && styles.stanceBtnNeutralActive,
            ]}
            onPress={() => setStanceIndex(-1)}
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

          {/* Botão Postura 1 */}
          <TouchableOpacity
            style={[
              styles.stanceBtn,
              currentStanceIdx === 0 && styles.stanceBtnP1Active,
            ]}
            onPress={() => setStanceIndex(0)}
          >
            <Text
              style={[
                styles.stanceBtnText,
                currentStanceIdx === 0 && styles.stanceBtnTextActive,
              ]}
            >
              I
            </Text>
          </TouchableOpacity>

          {/* Botão Postura 2 */}
          <TouchableOpacity
            style={[
              styles.stanceBtn,
              currentStanceIdx === 1 && styles.stanceBtnP2Active,
            ]}
            onPress={() => setStanceIndex(1)}
          >
            <Text
              style={[
                styles.stanceBtnText,
                currentStanceIdx === 1 && styles.stanceBtnTextActive,
              ]}
            >
              II
            </Text>
          </TouchableOpacity>
        </View>

        {/* DETALHES DA POSTURA ATIVA */}
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
              Você não está focado em nenhuma técnica de combate específica. Sem
              benefícios ou penalidades.
            </Text>
          ) : (
            <View style={styles.stanceDetails}>
              <InfoRow
                label="Benefício"
                text={activeStance?.benefit || ""}
                color="#2e7d32"
              />
              <InfoRow
                label="Restrição"
                text={activeStance?.restriction || ""}
                color="#c62828"
              />
              <InfoRow
                label="Manobra"
                text={activeStance?.maneuver || ""}
                color="#1565c0"
              />
              {activeStance?.recovery && (
                <InfoRow
                  label="Recuperação"
                  text={activeStance?.recovery}
                  color="#6a1b9a"
                />
              )}
            </View>
          )}
        </View>
      </View>

      <Text style={styles.sectionHeader}>Habilidades</Text>

      <FlatList
        data={character.skills}
        keyExtractor={(item) => item.id}
        renderItem={renderSkill}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

// ... InfoRow e SkillCard (Mantidos iguais) ...
const InfoRow = ({
  label,
  text,
  color,
}: {
  label: string;
  text: string;
  color: string;
}) => (
  <View style={styles.infoRow}>
    <Text style={[styles.infoLabel, { color }]}>{label}:</Text>
    <Text style={styles.infoText}>{text}</Text>
  </View>
);

const SkillCard = ({ skill }: { skill: Skill }) => {
  const [expanded, setExpanded] = useState(false);
  const { character, updateStat } = useCharacter();
  const hasEnoughFocus = character.stats.focus.current >= skill.cost;

  const handleUseSkill = () => {
    if (!hasEnoughFocus) {
      Alert.alert("Foco Insuficiente", "Sem foco para usar esta habilidade.");
      return;
    }
    updateStat("focus", -skill.cost);
  };

  return (
    <TouchableOpacity
      style={styles.skillCard}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.8}
    >
      <View style={styles.skillHeader}>
        <View>
          <Text style={styles.skillName}>{skill.name}</Text>
          <Text style={styles.skillType}>{skill.actionType}</Text>
        </View>
        <View
          style={[
            styles.costBadge,
            !hasEnoughFocus && styles.costBadgeDisabled,
          ]}
        >
          <Text
            style={[
              styles.costText,
              !hasEnoughFocus && styles.costTextDisabled,
            ]}
          >
            {skill.cost} Foco
          </Text>
        </View>
      </View>
      {expanded && (
        <View style={styles.skillBody}>
          <Text style={styles.description}>{skill.description}</Text>
          <TouchableOpacity
            style={[
              styles.useButton,
              !hasEnoughFocus && styles.useButtonDisabled,
            ]}
            onPress={handleUseSkill}
            disabled={!hasEnoughFocus}
          >
            <Text style={styles.useButtonText}>
              {hasEnoughFocus ? "USAR HABILIDADE" : "FOCO INSUFICIENTE"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },

  // HUD
  combatHud: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 3,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  focusContainer: { flex: 2, marginRight: 16 },
  focusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  labelGroup: { flexDirection: "row", alignItems: "center", gap: 6 },
  hudLabel: { fontSize: 10, fontWeight: "bold", color: "#666" },
  focusValue: { fontSize: 12, color: "#555" },
  focusBarBg: {
    height: 8,
    backgroundColor: "#e3f2fd",
    borderRadius: 4,
    overflow: "hidden",
  },
  focusBarFill: { height: "100%", backgroundColor: "#1e88e5" },
  verticalDivider: {
    width: 1,
    height: "80%",
    backgroundColor: "#eee",
    marginHorizontal: 8,
  },
  acContainer: { flex: 1, alignItems: "center" },
  acValueContainer: { flexDirection: "row", alignItems: "center", gap: 6 },
  acTotal: { fontSize: 32, fontWeight: "bold", color: "#333" },
  modBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  // SELETOR DE POSTURA
  stanceSelectorContainer: { marginHorizontal: 16, marginBottom: 16 },
  sectionLabel: {
    fontSize: 12,
    color: "#888",
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 8,
  },

  stanceToggleGroup: {
    flexDirection: "row",
    backgroundColor: "#e0e0e0",
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
  stanceBtnText: { fontWeight: "600", color: "#666" },

  // Cores dos Botões Ativos
  stanceBtnNeutralActive: { backgroundColor: "#fff", elevation: 2 },
  stanceBtnP1Active: { backgroundColor: "#1976d2", elevation: 2 }, // Azul
  stanceBtnP2Active: { backgroundColor: "#f57c00", elevation: 2 }, // Laranja

  stanceBtnTextActive: { color: "#333" }, // Para Neutra
  // Caso P1 e P2 precisem de texto branco, ajuste condicionalmente no JSX ou crie estilos separados,
  // mas aqui simplifiquei. Se quiser texto branco nos coloridos:
  // style={[styles.stanceBtnText, isActive && { color: isNeutral ? '#333' : '#fff' }]}

  // CARD DE POSTURA
  stanceCard: { borderRadius: 12, padding: 16, elevation: 2, minHeight: 120 },
  stanceNeutralBg: {
    backgroundColor: "#fff",
    borderLeftWidth: 5,
    borderLeftColor: "#999",
  },
  stanceOneBg: {
    backgroundColor: "#e3f2fd",
    borderLeftWidth: 5,
    borderLeftColor: "#1976d2",
  },
  stanceTwoBg: {
    backgroundColor: "#fff3e0",
    borderLeftWidth: 5,
    borderLeftColor: "#f57c00",
  },

  activeStanceName: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: "#222",
    marginBottom: 8,
  },
  divider: { height: 1, backgroundColor: "rgba(0,0,0,0.1)", marginBottom: 12 },
  neutralText: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
    marginTop: 10,
  },
  stanceDetails: { gap: 8 },

  // Info Row e Skills
  infoRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start" },
  infoLabel: { fontWeight: "bold", marginRight: 6, fontSize: 14 },
  infoText: { fontSize: 14, color: "#444", flex: 1, lineHeight: 20 },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 16,
    marginBottom: 8,
    color: "#333",
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  skillCard: {
    backgroundColor: "#fff",
    marginBottom: 10,
    borderRadius: 8,
    padding: 16,
    elevation: 1,
  },
  skillHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skillName: { fontSize: 16, fontWeight: "bold" },
  skillType: { fontSize: 12, color: "#666", marginTop: 2 },
  costBadge: {
    backgroundColor: "#e0e0e0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  costBadgeDisabled: {
    backgroundColor: "#ffebee",
    borderWidth: 1,
    borderColor: "#ef5350",
  },
  costText: { fontSize: 12, fontWeight: "bold" },
  costTextDisabled: { color: "#c62828" },
  skillBody: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 8,
  },
  description: { fontSize: 14, lineHeight: 20, color: "#444" },
  useButton: {
    marginTop: 12,
    backgroundColor: "#6200ea",
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  useButtonDisabled: { backgroundColor: "#bdbdbd" },
  useButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
});
