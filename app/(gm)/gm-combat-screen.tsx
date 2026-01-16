import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// import { CombatLog } from "@/components/CombatLog";
import { useAlert } from "@/context/AlertContext";
import { useCampaign } from "@/context/CampaignContext";
import { useTheme } from "@/context/ThemeContext";
import { useWebSocket } from "@/context/WebSocketContext";

// --- COMPONENTE: LOG DE COMBATE (Estilo Terminal) ---
const CombatLog = ({
  logs,
  colors,
  styles,
}: {
  logs: string[];
  colors: any;
  styles: any;
}) => {
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll para o final
  useEffect(() => {
    if (logs.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [logs]);

  return (
    <View
      style={[
        styles.logContainer,
        { backgroundColor: "#1e1e1e", borderColor: colors.border },
      ]}
    >
      <View style={styles.logHeader}>
        <Text style={styles.logTitle}>TERMINAL DO SISTEMA</Text>
      </View>
      <FlatList
        ref={flatListRef}
        data={logs}
        keyExtractor={(_, index) => index.toString()}
        style={{ maxHeight: 120 }}
        contentContainerStyle={{ padding: 8 }}
        renderItem={({ item }) => (
          <Text style={styles.logText}>
            <Text style={{ color: colors.primary }}>{"> "}</Text>
            {item}
          </Text>
        )}
        ListEmptyComponent={
          <Text style={[styles.logText, { opacity: 0.5 }]}>
            Aguardando eventos...
          </Text>
        }
      />
    </View>
  );
};

// --- COMPONENTE: CARD DO MESTRE (Editável) ---
const GMCombatantCard = ({
  item,
  isActive,
  colors,
  styles,
  onUpdate,
  onRemove,
}: any) => {
  const isPlayer = item.type === "player";

  return (
    <View
      style={[
        styles.card,
        isActive && { borderColor: colors.primary, borderWidth: 2 },
        { backgroundColor: colors.surface },
      ]}
    >
      {/* Header: Iniciativa + Nome + Remover */}
      <View style={styles.cardHeader}>
        <View style={styles.initBadge}>
          <Text style={styles.initText}>{item.initiative}</Text>
        </View>

        <View style={{ flex: 1, paddingHorizontal: 10 }}>
          <Text style={[styles.name, isActive && { color: colors.primary }]}>
            {item.name}
          </Text>
          <Text style={styles.typeLabel}>
            {isPlayer ? "JOGADOR" : "NPC"} • CA {item.armorClass}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => onRemove(item.id)}
          style={{ padding: 5 }}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      {/* Controle de HP Rápido */}
      <View style={styles.statsRow}>
        <View style={styles.statControl}>
          <TouchableOpacity
            onPress={() => onUpdate(item.id, "hp", item.hp.current - 1)}
          >
            <Ionicons name="remove-circle" size={28} color={colors.error} />
          </TouchableOpacity>
          <View style={{ alignItems: "center", minWidth: 60 }}>
            <Text style={[styles.statValue, { color: colors.hp || "#ef5350" }]}>
              {item.hp.current}/{item.hp.max}
            </Text>
            <Text style={styles.statLabel}>PV</Text>
          </View>
          <TouchableOpacity
            onPress={() => onUpdate(item.id, "hp", item.hp.current + 1)}
          >
            <Ionicons name="add-circle" size={28} color={colors.success} />
          </TouchableOpacity>
        </View>

        {/* Controle de Foco Rápido */}
        <View style={styles.statControl}>
          <TouchableOpacity
            onPress={() =>
              onUpdate(item.id, "focus", Math.max(0, item.currentFocus - 1))
            }
          >
            <Ionicons
              name="remove-circle-outline"
              size={28}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          <View style={{ alignItems: "center", minWidth: 50 }}>
            <Text style={[styles.statValue, { color: colors.focus }]}>
              {item.currentFocus}
            </Text>
            <Text style={styles.statLabel}>FOCO</Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              onUpdate(
                item.id,
                "focus",
                Math.min(item.maxFocus, item.currentFocus + 1)
              )
            }
          >
            <Ionicons
              name="add-circle-outline"
              size={28}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// --- TELA PRINCIPAL DO MESTRE ---
export default function GMCombatScreen() {
  const { combatants, activeTurnId, logs, addCombatant } = useCampaign();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { showAlert } = useAlert();

  // WebSocket (Usamos connectToRoute diretamente para conectar como "GM")
  // ATENÇÃO: O WebSocketContext precisa expor 'connectToRoute' ou você pode adaptar o 'joinSession'
  const { isConnected, sendMessage, connectToRoute, disconnect } =
    useWebSocket();

  // Estados Locais
  const [ipAddress, setIpAddress] = useState("");
  const [sessionCode, setSessionCode] = useState("");

  // Modal Adicionar NPC
  const [showNpcModal, setShowNpcModal] = useState(false);
  const [npcName, setNpcName] = useState("");
  const [npcHp, setNpcHp] = useState("10");
  const [npcInit, setNpcInit] = useState("");

  // --- AÇÕES DO MESTRE ---

  const handleConnectGM = () => {
    if (!ipAddress || !sessionCode) {
      showAlert("Erro", "Preencha IP e Sala.");
      return;
    }

    // Payload especial do GM
    const gmData = {
      id: "GM_ADMIN",
      name: "Mestre",
      type: "gm",
    };

    // Conecta usando a função exposta do Contexto
    // Se o seu contexto não expõe 'connectToRoute', você precisará exportá-la lá.
    if (connectToRoute) {
      connectToRoute(ipAddress, sessionCode, "GM_ADMIN", gmData);
    } else {
      showAlert("Erro", "Contexto WebSocket não exporta connectToRoute.");
    }
  };

  const handleNextTurn = () => {
    sendMessage("END_TURN", { manual: true });
  };

  const handleUpdateStat = (
    id: string,
    type: "hp" | "focus",
    value: number
  ) => {
    sendMessage("GM_UPDATE_COMBATANT", {
      combatantId: id,
      field: type === "hp" ? "hp_current" : "current_focus",
      value: value,
    });
    // O servidor vai devolver o estado atualizado, então não precisamos atualizar localmente se for rápido.
    // Mas para UX instantânea, poderíamos chamar updateCombatant aqui também.
  };

  const handleRemoveCombatant = (id: string) => {
    Alert.alert("Remover", "Tem certeza?", [
      { text: "Cancelar" },
      {
        text: "Remover",
        style: "destructive",
        onPress: () => sendMessage("GM_REMOVE_COMBATANT", { targetId: id }),
      },
    ]);
  };

  const handleAddNpc = () => {
    const hp = parseInt(npcHp) || 10;
    const init = parseInt(npcInit) || Math.floor(Math.random() * 20) + 1;

    sendMessage("GM_ADD_NPC", {
      name: npcName || "Inimigo",
      hp: hp,
      initiative: init,
      type: "npc",
    });

    setShowNpcModal(false);
    setNpcName("");
    setNpcInit("");
    setNpcHp("10");
  };

  // 1. TELA DE LOGIN DO MESTRE
  if (!isConnected) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.container, { justifyContent: "center", padding: 20 }]}
      >
        <View style={styles.configCard}>
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <MaterialCommunityIcons
              name="crown"
              size={50}
              color={colors.primary}
            />
            <Text style={styles.configTitle}>Painel do Mestre</Text>
            <Text style={{ color: colors.textSecondary, textAlign: "center" }}>
              Conecte-se ao servidor rodando no seu PC para gerenciar o combate.
            </Text>
          </View>

          <Text style={styles.label}>IP do Servidor (PC)</Text>
          <TextInput
            value={ipAddress}
            onChangeText={setIpAddress}
            placeholder="Ex: 192.168.0.10"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            style={styles.input}
          />

          <Text style={styles.label}>ID da Sessão</Text>
          <TextInput
            value={sessionCode}
            onChangeText={setSessionCode}
            placeholder="Ex: MESA_01"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="characters"
            style={styles.input}
          />

          <TouchableOpacity onPress={handleConnectGM} style={styles.connectBtn}>
            <Text style={styles.connectBtnText}>CONECTAR COMO MESTRE</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // 2. TELA DE CONTROLE
  return (
    <View style={styles.container}>
      {/* Header com Controles Principais */}
      <View style={styles.gmHeader}>
        <View>
          <Text style={styles.sessionLabel}>SESSÃO: {sessionCode}</Text>
          <Text style={styles.turnLabel}>
            ATUAL:{" "}
            {combatants.find((c) => c.id === activeTurnId)?.name || "Ninguém"}
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity onPress={handleNextTurn} style={styles.nextTurnBtn}>
            <Text style={styles.nextTurnText}>PRÓXIMO</Text>
            <Ionicons name="play-skip-forward" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={disconnect} style={styles.iconBtn}>
            <Ionicons name="close" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Logs em tempo real */}
      <CombatLog logs={logs} colors={colors} styles={styles} />

      {/* Lista de Combatentes */}
      <FlatList
        data={combatants}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <GMCombatantCard
            item={item}
            isActive={item.id === activeTurnId}
            colors={colors}
            styles={styles}
            onUpdate={handleUpdateStat}
            onRemove={handleRemoveCombatant}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhum combatente na sessão.</Text>
        }
      />

      {/* FAB para Adicionar NPC */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowNpcModal(true)}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Modal ADD NPC */}
      <Modal
        visible={showNpcModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNpcModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Adicionar NPC Rápido</Text>

            <TextInput
              placeholder="Nome (ex: Goblin)"
              placeholderTextColor={colors.textSecondary}
              value={npcName}
              onChangeText={setNpcName}
              style={styles.input}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TextInput
                placeholder="HP"
                placeholderTextColor={colors.textSecondary}
                value={npcHp}
                onChangeText={setNpcHp}
                keyboardType="numeric"
                style={[styles.input, { flex: 1 }]}
              />
              <TextInput
                placeholder="Iniciativa (Opcional)"
                placeholderTextColor={colors.textSecondary}
                value={npcInit}
                onChangeText={setNpcInit}
                keyboardType="numeric"
                style={[styles.input, { flex: 1 }]}
              />
            </View>

            <TouchableOpacity onPress={handleAddNpc} style={styles.connectBtn}>
              <Text style={styles.connectBtnText}>ADICIONAR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowNpcModal(false)}
              style={{ marginTop: 15, alignItems: "center" }}
            >
              <Text style={{ color: colors.textSecondary }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    // LOGIN
    configCard: {
      backgroundColor: colors.surface,
      padding: 24,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 5,
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
    },
    connectBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

    // HEADER
    gmHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    sessionLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      fontWeight: "bold",
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

    // LOGS
    logContainer: {
      margin: 16,
      borderRadius: 8,
      borderWidth: 1,
      overflow: "hidden",
    },
    logHeader: {
      backgroundColor: "rgba(0,0,0,0.2)",
      padding: 5,
      paddingHorizontal: 10,
    },
    logTitle: { color: "#888", fontSize: 10, fontWeight: "bold" },
    logText: {
      fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
      fontSize: 12,
      color: "#ddd",
      marginBottom: 2,
    },

    // LISTA
    card: {
      marginBottom: 10,
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    initBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.inputBg,
      alignItems: "center",
      justifyContent: "center",
    },
    initText: { fontWeight: "bold", color: colors.text },
    name: { fontSize: 16, fontWeight: "bold", color: colors.text },
    typeLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      fontWeight: "bold",
    },

    statsRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      borderTopWidth: 1,
      borderColor: colors.border,
      paddingTop: 10,
    },
    statControl: { flexDirection: "row", alignItems: "center", gap: 10 },
    statValue: { fontSize: 18, fontWeight: "bold" },
    statLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      fontWeight: "bold",
    },

    fab: {
      position: "absolute",
      bottom: 20,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      elevation: 6,
    },
    empty: { textAlign: "center", marginTop: 50, color: colors.textSecondary },

    // MODAL
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
  });
