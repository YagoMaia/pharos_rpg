import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useAlert } from "@/context/AlertContext";
import { useCampaign } from "@/context/CampaignContext";
import { useCharacter } from "@/context/CharacterContext";
import { useTheme } from "@/context/ThemeContext";
import { useWebSocket } from "@/context/WebSocketContext";
import { Skill } from "@/types/rpg";

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

// --- COMPONENTE: LISTA DE ESPECTADOR (QUANDO NÃO É SUA VEZ) ---
const SpectatorCard = ({ item, isCurrentTurn, colors, styles }: any) => {
  // Lógica de "Névoa de Guerra"
  // Jogadores veem HP de outros jogadores, mas não de NPCs inimigos
  const isPlayer = item.type === "player";
  const hpPercent = item.hp.max > 0 ? item.hp.current / item.hp.max : 0;

  // Status vago para NPCs
  let npcStatus = "Saudável";
  if (hpPercent < 0.5) npcStatus = "Ferido";
  if (hpPercent < 0.25) npcStatus = "Grave";
  if (item.hp.current <= 0) npcStatus = "Derrotado";

  return (
    <View
      style={[
        styles.spectatorCard,
        isCurrentTurn && { borderColor: colors.primary, borderWidth: 2 }, // Destaca quem está agindo
      ]}
    >
      {/* Coluna da Iniciativa */}
      <View style={styles.initBadge}>
        <Text style={styles.initText}>{item.initiative}</Text>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text
            style={[styles.name, isCurrentTurn && { color: colors.primary }]}
          >
            {item.name}
          </Text>
          {/* Ícone indicando tipo */}
          <MaterialCommunityIcons
            name={item.type === "player" ? "account" : "skull"}
            size={16}
            color={colors.textSecondary}
          />
        </View>

        {/* BARRA DE VIDA (Com Névoa de Guerra) */}
        <View style={styles.miniBarBg}>
          <View
            style={[
              styles.miniBarFill,
              {
                width: `${Math.max(0, hpPercent * 100)}%`,
                backgroundColor: isPlayer ? colors.success : colors.error,
              },
            ]}
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 4,
          }}
        >
          {isPlayer ? (
            <Text style={styles.tinyLabel}>
              HP: {item.hp.current}/{item.hp.max}
            </Text>
          ) : (
            <Text style={[styles.tinyLabel, { fontStyle: "italic" }]}>
              Status: {npcStatus} {/* Esconde números exatos */}
            </Text>
          )}

          {/* Se tiver postura ativa visível */}
          {item.activeStanceId && (
            <Text style={styles.tinyLabel}>Em Postura</Text>
          )}
        </View>
      </View>
    </View>
  );
};

// --- COMPONENTE: INTERFACE ATIVA (SUA VEZ) ---
// Basicamente o CombatantCard que fizemos antes, mas focado no "Meu Personagem"
const ActiveTurnInterface = ({ combatant, styles, colors }: any) => {
  const { updateCombatant } = useCampaign(); // Atualiza o servidor/sessão
  const { character } = useCharacter(); // Apenas para ler dados estáticos se precisar
  const { showAlert } = useAlert();
  const { sendMessage } = useWebSocket(); // <--- PEGUE ISSO AQUI

  // Garante actions
  const actions = combatant.turnActions || {
    standard: true,
    bonus: true,
    reaction: true,
  };
  const activeStance = combatant.stances?.find(
    (s: any) => s.id === combatant.activeStanceId
  );
  const stanceBonus = activeStance?.acBonus || 0;
  const totalAC = (combatant.armorClass || 10) + stanceBonus;

  // Handlers
  const toggleAction = (type: "standard" | "bonus" | "reaction") => {
    const newActions = { ...actions, [type]: !actions[type] };
    updateCombatant(combatant.id, "turnActions", newActions);
  };

  const handleUseSkill = (skill: Skill) => {
    // 1. Checagens
    if (combatant.currentFocus < skill.cost) {
      showAlert("Sem Foco", "Foco insuficiente.");
      return;
    }
    const actionKey = getActionKey(skill.actionType);
    if (actionKey && !actions[actionKey]) {
      showAlert("Ação Indisponível", `Você já gastou sua ${skill.actionType}.`);
      return;
    }

    // 2. Execução (Atualiza a Sessão)
    updateCombatant(
      combatant.id,
      "currentFocus",
      combatant.currentFocus - skill.cost
    );

    let newActions = { ...actions };
    if (actionKey) {
      newActions = { ...actions, [actionKey]: false };
      updateCombatant(combatant.id, "turnActions", newActions);
    }

    // 2. ENVIA PARA O SERVIDOR (AQUI ESTÁ A MÁGICA)
    sendMessage("PLAYER_ACTION", {
      combatantId: combatant.id,
      actionType: "USE_SKILL",
      payload: {
        skillName: skill.name,
        cost: skill.cost,
        newFocus: combatant.currentFocus - skill.cost,
        newTurnActions: newActions,
      },
    });

    showAlert("Sucesso", `Usou ${skill.name}`);
  };

  const handleStanceChange = (newStanceId: string | null) => {
    // Mesma lógica de postura criada anteriormente...
    if (newStanceId !== null) {
      if (combatant.activeStanceId === newStanceId) return;
      if (!actions.bonus) {
        showAlert("Indisponível", "Requer Ação Bônus.");
        return;
      }
      const newActions = { ...actions, bonus: false };
      updateCombatant(combatant.id, "turnActions", newActions);
    }
    updateCombatant(combatant.id, "activeStanceId", newStanceId);
  };

  return (
    <ScrollView style={{ flex: 1 }}>
      {/* 1. STATUS HEADER GRANDÃO */}
      <View style={styles.activeHeader}>
        <Text style={styles.yourTurnText}>SUA VEZ!</Text>
        <View style={styles.statsRowLarge}>
          {/* HP */}
          <View style={styles.statBoxLarge}>
            <Text style={[styles.statValueLarge, { color: colors.error }]}>
              {combatant.hp.current}
            </Text>
            <Text style={styles.statLabelLarge}>PV</Text>
          </View>

          {/* CA */}
          <View style={styles.statBoxLarge}>
            <Text style={[styles.statValueLarge, { color: colors.primary }]}>
              {totalAC}
            </Text>
            <Text style={styles.statLabelLarge}>CA</Text>
          </View>

          {/* FOCO */}
          <View style={styles.statBoxLarge}>
            <Text style={[styles.statValueLarge, { color: colors.focus }]}>
              {combatant.currentFocus}
            </Text>
            <Text style={styles.statLabelLarge}>FOCO</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* 2. ACTIONS TRACKER */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Ações Disponíveis</Text>
        <View style={styles.actionsRow}>
          {/* Botões Padrão/Bônus/Reação (Mesmo estilo anterior) */}
          <TouchableOpacity
            style={[
              styles.actionBtn,
              actions.standard
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.inputBg, opacity: 0.5 },
            ]}
            onPress={() => toggleAction("standard")}
          >
            <Text style={styles.actionBtnText}>Padrão</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              actions.bonus
                ? { backgroundColor: "#fb8c00" }
                : { backgroundColor: colors.inputBg, opacity: 0.5 },
            ]}
            onPress={() => toggleAction("bonus")}
          >
            <Text style={styles.actionBtnText}>Bônus</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              actions.reaction
                ? { backgroundColor: "#8e24aa" }
                : { backgroundColor: colors.inputBg, opacity: 0.5 },
            ]}
            onPress={() => toggleAction("reaction")}
          >
            <Text style={styles.actionBtnText}>Reação</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. SKILLS LIST */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Habilidades</Text>
        {combatant.skills?.map((skill: any) => {
          const actionKey = getActionKey(skill.action);
          const isAvailable = actionKey ? actions[actionKey] : true;
          const hasFocus = combatant.currentFocus >= skill.cost;
          const canUse = isAvailable && hasFocus;

          return (
            <TouchableOpacity
              key={skill.id}
              style={[styles.skillRow, !canUse && { opacity: 0.5 }]}
              disabled={!canUse}
              onPress={() => handleUseSkill(skill)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.skillName}>{skill.name}</Text>
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

      {/* 4. BOTÃO ENCERRAR TURNO */}
      <TouchableOpacity
        style={styles.endTurnBtnBig}
        onPress={() => {
          // Reset local
          updateCombatant(combatant.id, "turnActions", {
            standard: true,
            bonus: true,
            reaction: true,
          });

          // AVISA O SERVIDOR
          sendMessage("END_TURN", {
            combatantId: combatant.id,
          });
        }}
      >
        <Text style={styles.endTurnText}>ENCERRAR MEU TURNO</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

// --- TELA PRINCIPAL ---
export default function SessionCombatScreen() {
  const { combatants } = useCampaign(); // Lista vinda do servidor/mestre
  const { character } = useCharacter(); // Meu personagem local
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  // --- NOVOS ESTADOS PARA A CONEXÃO ---
  const { joinSession, disconnect, isConnected } = useWebSocket();
  const [ipAddress, setIpAddress] = useState(""); // Ex: 192.168.1.5
  const [sessionCode, setSessionCode] = useState(""); // Ex: MESA_01

  // Identifica quem está agindo agora (O primeiro da lista ordenada por iniciativa)
  const currentActor = combatants.length > 0 ? combatants[0] : null;

  // Verifica se sou EU (compara ID ou Nome)
  // Ajuste a lógica de comparação conforme seu ID (se character.id for igual ao do combatant)
  const isMyTurn = currentActor?.name === character.name; // Usando nome por segurança no mock

  // Encontra meu objeto de combatente dentro da sessão para manipular HP/Foco reais da sessão
  const myCombatantData = combatants.find((c) => c.name === character.name);

  if (!isConnected) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.container, { justifyContent: "center", padding: 20 }]}
      >
        <View style={styles.configCard}>
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <Ionicons name="wifi" size={40} color={colors.primary} />
            <Text style={styles.configTitle}>Conectar à Sessão</Text>
            <Text style={{ color: colors.textSecondary, textAlign: "center" }}>
              Insira o IP do Mestre e o código da sala para entrar no combate.
            </Text>
          </View>

          <Text style={styles.label}>Endereço IP do Mestre</Text>
          <TextInput
            value={ipAddress}
            onChangeText={setIpAddress}
            placeholder="Ex: 192.168.0.10"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric" // Ajuda a digitar IP
            style={styles.input}
          />

          <Text style={styles.label}>Código da Sessão</Text>
          <TextInput
            value={sessionCode}
            onChangeText={setSessionCode}
            placeholder="Ex: SALA_RPG"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="characters"
            style={styles.input}
          />

          <TouchableOpacity
            onPress={() => joinSession(ipAddress, sessionCode)}
            style={styles.connectBtn}
          >
            <Text style={styles.connectBtnText}>CONECTAR</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // 2. TELA DE COMBATE (Se estiver conectado)
  return (
    <View style={styles.container}>
      {/* TOPO: Informação de Turno + Botão Sair */}
      <View
        style={[
          styles.turnBanner,
          isMyTurn
            ? { backgroundColor: colors.success }
            : { backgroundColor: colors.surface },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.turnBannerText, isMyTurn && { color: "#fff" }]}>
            {isMyTurn
              ? "SUA VEZ DE AGIR"
              : `VEZ DE: ${currentActor?.name?.toUpperCase() || "..."}`}
          </Text>
        </View>

        {/* Botão para desconectar e voltar para config */}
        <TouchableOpacity onPress={disconnect} style={styles.disconnectBtn}>
          <Ionicons
            name="close-circle"
            size={24}
            color={isMyTurn ? "#fff" : colors.error}
          />
        </TouchableOpacity>
      </View>

      {isMyTurn && myCombatantData ? (
        <ActiveTurnInterface
          combatant={myCombatantData}
          styles={styles}
          colors={colors}
        />
      ) : (
        <FlatList
          data={combatants}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <SpectatorCard
              item={item}
              isCurrentTurn={item.id === currentActor?.id}
              colors={colors}
              styles={styles}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Aguardando início do combate...</Text>
          }
        />
      )}
    </View>
  );
}

// --- ESTILOS ---
const getStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    // // Banner Topo
    // turnBanner: {
    //   padding: 12,
    //   alignItems: "center",
    //   borderBottomWidth: 1,
    //   borderColor: colors.border,
    // },
    // turnBannerText: { fontWeight: "bold", fontSize: 16, color: colors.text },

    // Spectator Card
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
    name: { fontWeight: "bold", fontSize: 16, color: colors.text },
    miniBarBg: {
      height: 6,
      backgroundColor: colors.inputBg,
      borderRadius: 3,
      marginTop: 6,
      overflow: "hidden",
    },
    miniBarFill: { height: "100%", borderRadius: 3 },
    tinyLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },

    // Active View
    activeHeader: {
      padding: 20,
      alignItems: "center",
      backgroundColor: colors.surface,
    },
    yourTurnText: {
      fontSize: 24,
      fontWeight: "900",
      color: colors.success,
      marginBottom: 16,
    },
    statsRowLarge: { flexDirection: "row", gap: 30 },
    statBoxLarge: { alignItems: "center" },
    statValueLarge: { fontSize: 32, fontWeight: "bold" },
    statLabelLarge: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "bold",
    },

    divider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },
    section: { paddingHorizontal: 16, marginBottom: 20 },
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
      fontSize: 12,
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
    skillCost: {
      justifyContent: "center",
      paddingLeft: 10,
      borderLeftWidth: 1,
      borderColor: colors.border,
    },
    detailText: { color: colors.textSecondary, fontSize: 12 },

    endTurnBtnBig: {
      margin: 16,
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
    empty: { textAlign: "center", marginTop: 50, color: colors.textSecondary },

    configCard: {
      backgroundColor: colors.surface,
      padding: 24,
      borderRadius: 16,
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
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
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 8,
    },
    connectBtnText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 16,
    },

    // ESTILOS DO HEADER DE COMBATE (Com botão sair)
    turnBanner: {
      padding: 12,
      paddingHorizontal: 16,
      alignItems: "center",
      borderBottomWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    turnBannerText: {
      fontWeight: "bold",
      fontSize: 16,
      color: colors.text,
    },
    disconnectBtn: {
      padding: 4,
    },
  });
