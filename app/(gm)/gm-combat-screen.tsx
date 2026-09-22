import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Contextos
import { useAlert } from "@/context/AlertContext";
import { useCampaign } from "@/context/CampaignContext";
import { useTheme } from "@/context/ThemeContext";
import { useWebSocket } from "@/context/WebSocketContext";
import { Combatant } from "@/types/rpg";

// Componentes
import { CombatLog } from "@/components/gm/CombatLog";
import { GMCombatantCard } from "@/components/gm/GMCombatantCard";
import { ConditionManagerModal } from "@/components/modals/ConditionManagerModal";
import { ActiveTurnInterface } from "@/components/session/ActiveTurnInterface";
import { ConnectionForm } from "@/components/session/ConnectionForm";

export default function GMCombatScreen() {
  const {
    combatants,
    activeTurnId,
    logs,
    isOfflineMode,
    setOfflineMode,
    nextTurn,
    updateCombatant,
    removeCombatant,
    advancePhase,
    endCombat,
  } = useCampaign();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { showAlert } = useAlert();

  const { isConnected, sendMessage, connectToRoute, disconnect } =
    useWebSocket();

  const [conditionModalOpen, setConditionModalOpen] = React.useState(false);
  const [showRoster, setShowRoster] = React.useState(false);
  const [selectedConditionCombatant, setSelectedConditionCombatant] = React.useState<Combatant | null>(null);

  const handleConnectGM = (ip: string, code: string) => {
    if (!ip || !code) {
      showAlert("Erro", "Preencha IP e Sala.");
      return;
    }
    if (connectToRoute) {
      connectToRoute(ip, code, {
        id: "GM_ADMIN",
        name: "Mestre",
        type: "gm",
      });
    } else {
      showAlert("Erro", "Contexto WebSocket não exporta connectToRoute.");
    }
  };

  const handleNextTurn = () => {
    if (isOfflineMode) nextTurn();
    else sendMessage("END_TURN", { manual: true });
  };

  const handleUpdateStat = (
    id: string,
    type: "hp" | "focus",
    value: number,
  ) => {
    if (isOfflineMode) {
      const c = combatants.find((x) => x.id === id);
      if (c)
        updateCombatant(id, type === "hp" ? "hp" : "focus", {
          ...c[type],
          current: value,
        });
    } else {
      sendMessage("GM_UPDATE_COMBATANT", {
        combatantId: id,
        field: type === "hp" ? "hp_current" : "current_focus",
        value: value,
      });
    }
  };

  const handleRemoveCombatant = (id: string) => {
    showAlert("Remover", "Tem certeza?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: () =>
          isOfflineMode
            ? removeCombatant(id)
            : sendMessage("GM_REMOVE_COMBATANT", { combatantId: id }),
      },
    ]);
  };

  const handleEndCombat = () => {
    showAlert(
      "Finalizar Combate",
      "Deseja encerrar o combate? Isso avisará todos os jogadores.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Finalizar",
          onPress: () => isOfflineMode ? endCombat() : sendMessage("END_COMBAT", { endCombat: true }),
          style: "default",
        },
      ],
    );
  };
  const activeCombatant = combatants.find((c) => c.id === activeTurnId);
  const handleAdvancePhase = (id: string) => {
    const actor = combatants.find((c) => c.id === id);
    if (!actor) return;
    showAlert("Avançar Fase", `Avançar ${actor.name}? A vida será restaurada e a postura ficará neutra.`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Avançar", onPress: () => isOfflineMode ? advancePhase(id) :
        sendMessage("GM_ADVANCE_PHASE", { combatantId: id, expectedPhaseIndex: actor.currentPhaseIndex ?? 0 }) },
    ]);
  };
  const isNpcTurn = activeCombatant && activeCombatant.type === "npc";

  // 1. TELA DE LOGIN
  if (!isConnected && !isOfflineMode) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ConnectionForm
          onConnect={handleConnectGM}
          title="Painel do Mestre"
          btnLabel="CONECTAR COMO MESTRE"
          extraButton={
            <TouchableOpacity
              onPress={() => setOfflineMode(true)}
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.primary,
                marginTop: 12,
                padding: 16,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.primary, fontWeight: "bold" }}>
                MODO OFFLINE (LOCAL)
              </Text>
            </TouchableOpacity>
          }
        />
      </View>
    );
  }

  // 2. TELA DE CONTROLE
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.gmHeader}>
        <View>
          <Text style={styles.turnLabel}>
            ATUAL: {activeCombatant?.name || "Ninguém"}
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {isNpcTurn && (
            <TouchableOpacity onPress={() => setShowRoster((prev) => !prev)} style={styles.iconBtn}
              accessibilityLabel={showRoster ? "Controlar NPC" : "Gerenciar combatentes"}>
              <Ionicons name={showRoster ? "game-controller" : "list"} size={24} color={colors.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleNextTurn} style={styles.nextTurnBtn}>
            <Text style={styles.nextTurnText}>PRÓXIMO</Text>
            <Ionicons name="play-skip-forward" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setOfflineMode(false);
              disconnect();
            }}
            style={styles.iconBtn}
          >
            <Ionicons name="close" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <CombatLog logs={logs} colors={colors} />

      {isNpcTurn && !showRoster ? (
        // VEZ DO NPC (Controlador Ativo)
        <View
          style={{ flex: 1, borderTopWidth: 1, borderColor: colors.primary }}
        >
          <View
            style={{
              padding: 8,
              backgroundColor: colors.primary + "20",
              alignItems: "center",
            }}
          >
            <Text style={{ color: colors.primary, fontWeight: "bold" }}>
              🎮 CONTROLANDO: {activeCombatant.name}
            </Text>
            {(activeCombatant.currentPhaseIndex ?? 0) < (activeCombatant.phases?.length ?? 0) && (
              <TouchableOpacity onPress={() => handleAdvancePhase(activeCombatant.id)} style={styles.nextTurnBtn}>
                <Text style={styles.nextTurnText}>AVANÇAR FASE</Text>
              </TouchableOpacity>
            )}
          </View>
          <ActiveTurnInterface combatant={activeCombatant} isGm={true} />
        </View>
      ) : (
        // VEZ DO PLAYER (Lista Passiva)
        <FlatList
          data={combatants}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <GMCombatantCard
              item={item}
              isActive={item.id === activeTurnId}
              colors={colors}
              onUpdate={handleUpdateStat}
              onRemove={handleRemoveCombatant}
              onAdvancePhase={handleAdvancePhase}
              onManageConditions={(c) => {
                setSelectedConditionCombatant(c);
                setConditionModalOpen(true);
              }}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Nenhum combatente.</Text>
          }
        />
      )}

      {(!isNpcTurn || showRoster) && (
        <TouchableOpacity
          onPress={handleEndCombat}
          style={styles.fab}
          activeOpacity={0.7}
        >
          <Ionicons name="flag" size={20} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Modal Add NPC Rápido */}

      {/* Modal Gerenciar Condições */}
      {selectedConditionCombatant && (
        <ConditionManagerModal
          visible={conditionModalOpen}
          onClose={() => setConditionModalOpen(false)}
          combatant={selectedConditionCombatant}
        />
      )}
    </View>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    gmHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    turnLabel: { fontSize: 16, fontWeight: "bold", color: colors.text },
    nextTurnBtn: {
      flexDirection: "row",
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 6,
      alignItems: "center",
      gap: 6,
    },
    nextTurnText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
    iconBtn: { padding: 8 },
    fab: {
      position: "absolute",
      bottom: 20,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      elevation: 6,
      backgroundColor: "#2e7d32",
    },
    empty: { textAlign: "center", marginTop: 50, color: colors.textSecondary },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.7)",
      justifyContent: "center",
      padding: 20,
    },
    modalCard: {
      backgroundColor: colors.surface,
      padding: 20,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 16,
      textAlign: "center",
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
    },
    connectBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
    finishBtn: {
      backgroundColor: "#2e7d32",
      padding: 8,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
  });
