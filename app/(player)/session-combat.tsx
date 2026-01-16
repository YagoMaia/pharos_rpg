import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
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

import { ActiveTurnInterface } from "@/components/ActiveTurnInterface";
import { useAlert } from "@/context/AlertContext";
import { useCampaign } from "@/context/CampaignContext";
import { useCharacter } from "@/context/CharacterContext";
import { useTheme } from "@/context/ThemeContext";
import { useWebSocket } from "@/context/WebSocketContext";
import { generateSafeId } from "@/utils/stringUtils";

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

// --- COMPONENTE: CARD DE ESPECTADOR (Outros turnos) ---
const SpectatorCard = ({ item, isCurrentTurn, colors, styles }: any) => {
  const isPlayer = item.type === "player";
  const current = item.hp?.current || 0;
  const max = item.hp?.max || 1;
  const hpPercent = Math.max(0, Math.min(1, current / max));

  // Névoa de Guerra: Esconde valores exatos de NPCs
  let statusText = `${current}/${max}`;
  let barColor = isPlayer ? colors.success : colors.error;

  if (!isPlayer) {
    if (hpPercent > 0.5) statusText = "Saudável";
    else if (hpPercent > 0.2) statusText = "Ferido";
    else if (current > 0) statusText = "Gravemente Ferido";
    else statusText = "Derrotado";
  }

  return (
    <View
      style={[
        styles.spectatorCard,
        isCurrentTurn && { borderColor: colors.primary, borderWidth: 2 },
      ]}
    >
      <View style={styles.initBadge}>
        <Text style={styles.initText}>{item.initiative}</Text>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text
            style={[
              styles.spectatorName,
              isCurrentTurn && { color: colors.primary },
            ]}
          >
            {item.name}
          </Text>
          <MaterialCommunityIcons
            name={isPlayer ? "account" : "skull"}
            size={16}
            color={colors.textSecondary}
          />
        </View>

        {/* Barra Pequena */}
        <View style={styles.miniBarBg}>
          <View
            style={[
              styles.miniBarFill,
              { width: `${hpPercent * 100}%`, backgroundColor: barColor },
            ]}
          />
        </View>

        <Text style={styles.spectatorStatus}>
          {isPlayer ? `HP: ${statusText}` : `Status: ${statusText}`}
        </Text>
      </View>
    </View>
  );
};

// --- COMPONENTE: INTERFACE ATIVA (Sua Vez) ---

// --- TELA PRINCIPAL ---
export default function SessionCombatScreen() {
  const { combatants, activeTurnId } = useCampaign();
  const { character } = useCharacter();
  const { colors } = useTheme();
  const { showAlert } = useAlert();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const { joinSession, disconnect, isConnected } = useWebSocket();
  const [ipAddress, setIpAddress] = useState("");
  const [initValue, setInitValue] = useState("");
  const [sessionCode, setSessionCode] = useState("");
  const [showInitModal, setShowInitModal] = useState(false);
  const [isRolling, setIsRolling] = useState(false);

  const mySafeId = generateSafeId(character.name);

  // Verifica quem está agindo
  const currentActor = combatants.find((c) => c.id === activeTurnId);

  // LÓGICA DE ID SEGURA: Compara nome, pois o ID do servidor é gerado via nome
  const isMyTurn = currentActor ? currentActor.name === character.name : false;

  // Pega os dados sincronizados do servidor
  const myCombatantData = combatants.find((c) => c.name === character.name) || {
    ...character,
    id: generateSafeId(character.name), // Fallback ID temporário
    hp: character.stats.hp,
    currentFocus: character.stats.focus.current,
    maxFocus: character.stats.focus.max,
  };

  // --- FUNÇÕES DE INICIATIVA ---

  const openInitModal = () => {
    if (!ipAddress || !sessionCode) {
      showAlert("Atenção", "Preencha IP e Código da Sala.");
      return;
    }
    // Reseta o valor e abre o modal
    setInitValue("");
    setShowInitModal(true);
  };

  // --- FUNÇÕES DE CONEXÃO ---

  // 1. Tentar Entrar (Verifica se já existe localmente)
  const handleAttemptJoin = () => {
    if (!ipAddress || !sessionCode) {
      showAlert("Atenção", "Preencha IP e Código da Sala.");
      return;
    }

    // [INTELIGÊNCIA] Verifica se já estou na lista de combatentes (Reconexão Rápida)
    // Isso acontece se a internet caiu mas o app não fechou
    const alreadyInCombat = combatants.find((c) => c.id === mySafeId);

    if (alreadyInCombat) {
      // Pula o modal e usa a iniciativa que já está salva
      joinSession(ipAddress, sessionCode, alreadyInCombat.initiative);
    } else {
      // Se não estou na lista local, abre modal para rolar
      setInitValue("");
      setShowInitModal(true);
    }
  };

  // 2. Reconexão Forçada (Para quando o App reiniciou)
  const handleForceReconnect = () => {
    if (!ipAddress || !sessionCode) {
      showAlert("Atenção", "Preencha IP e Código da Sala.");
      return;
    }
    // Envia -1 (ou outro código) para o servidor saber que deve manter a iniciativa
    joinSession(ipAddress, sessionCode, -1);
  };

  const rollInitiative = () => {
    setIsRolling(true);
    // Simula uma rolagem "visual" rápida
    setTimeout(() => {
      const d20 = Math.floor(Math.random() * 20) + 1;
      const dexMod = character.attributes["Destreza"].modifier || 0;
      const total = d20 + dexMod;

      setInitValue(String(total));
      setIsRolling(false);
      showAlert("Rolagem", `🎲 D20 (${d20}) + DES (${dexMod}) = ${total}`);
    }, 500);
  };

  const confirmJoin = () => {
    const finalInit = parseInt(initValue);
    if (isNaN(finalInit)) {
      showAlert("Erro", "Insira um valor válido para a iniciativa.");
      return;
    }

    setShowInitModal(false);
    // Chama a função do contexto passando a iniciativa
    joinSession(ipAddress, sessionCode, finalInit);
  };

  if (!isConnected) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.container, { justifyContent: "center", padding: 20 }]}
      >
        <View style={styles.configCard}>
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <Ionicons name="wifi" size={40} color={colors.primary} />
            <Text style={styles.configTitle}>Conectar à Sessão </Text>
            <Text style={{ color: colors.textSecondary, textAlign: "center" }}>
              Insira o IP do Host e o código da sala.
            </Text>
          </View>

          <Text style={styles.label}>IP do Servidor</Text>
          <TextInput
            value={ipAddress}
            onChangeText={setIpAddress}
            placeholder="Ex: 192.168.0.10"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            style={styles.input}
          />

          <Text style={styles.label}>ID da Sala</Text>
          <TextInput
            value={sessionCode}
            onChangeText={setSessionCode}
            placeholder="Ex: MESA_01"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="characters"
            style={styles.input}
          />

          <TouchableOpacity
            onPress={openInitModal} // <--- Abre o modal em vez de conectar direto
            style={styles.connectBtn}
          >
            <Text style={styles.connectBtnText}>PRÓXIMO </Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleForceReconnect}
            style={{ marginTop: 20, alignSelf: "center", flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <Text
              style={{
                color: colors.primary,
                fontWeight: "bold",
                textDecorationLine: "underline",
              }}
            >
              Já estou no combate (Reconectar)
            </Text>
          </TouchableOpacity>
        </View>

        {/* --- MODAL DE INICIATIVA --- */}
        <Modal
          visible={showInitModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowInitModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Definir Iniciativa</Text>
              <Text style={styles.modalSubtitle}>
                Role agora ou insira o valor do dado físico.
              </Text>

              {/* Botão de Rolar */}
              <TouchableOpacity
                style={styles.rollBtn}
                onPress={rollInitiative}
                disabled={isRolling}
              >
                <MaterialCommunityIcons
                  name="dice-d20"
                  size={24}
                  color="#fff"
                />
                <Text style={styles.rollBtnText}>
                  {isRolling
                    ? "Rolando..."
                    : `Rolar (D20 + ${
                        character.attributes["Destreza"].modifier || 0
                      })`}
                </Text>
              </TouchableOpacity>

              <Text
                style={{
                  alignSelf: "center",
                  marginVertical: 10,
                  color: colors.textSecondary,
                }}
              >
                — OU —
              </Text>

              {/* Input Manual */}
              <Text style={styles.label}>Valor Final</Text>
              <TextInput
                style={[
                  styles.input,
                  { textAlign: "center", fontSize: 24, fontWeight: "bold" },
                ]}
                keyboardType="numeric"
                value={initValue}
                onChangeText={setInitValue}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />

              {/* Botões de Ação */}
              <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: colors.inputBg }]}
                  onPress={() => setShowInitModal(false)}
                >
                  <Text style={{ color: colors.text }}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    { backgroundColor: colors.success, flex: 1 },
                  ]}
                  onPress={confirmJoin}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    ENTRAR NO COMBATE.
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    );
  }

  // 2. TELA DE COMBATE
  return (
    <View style={styles.container}>
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
              : `VEZ DE: ${
                  currentActor?.name?.toUpperCase() || "AGUARDANDO..."
                }`}
          </Text>
        </View>
        <TouchableOpacity onPress={disconnect} style={styles.disconnectBtn}>
          <Ionicons
            name="close-circle"
            size={24}
            color={isMyTurn ? "#fff" : colors.error}
          />
        </TouchableOpacity>
      </View>

      {isMyTurn ? (
        <ActiveTurnInterface combatant={myCombatantData} />
      ) : (
        <FlatList
          data={combatants}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <SpectatorCard
              item={item}
              isCurrentTurn={item.id === activeTurnId}
              colors={colors}
              styles={styles}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              Conectado. Aguardando início do combate pelo Mestre...
            </Text>
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

    // --- HUD ATIVO (NOVO LAYOUT) ---
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
    acTotal: {
      fontSize: 28,
      fontWeight: "bold",
      color: colors.text,
      includeFontPadding: false,
    },
    modBadge: {
      width: 18,
      height: 18,
      borderRadius: 9,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
    },

    // --- CONFIG ---
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
      justifyContent: "center",
    },
    connectBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

    // --- SECTIONS & GERAL ---
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
    detailText: { color: colors.textSecondary, fontSize: 12 },
    skillCost: {
      justifyContent: "center",
      paddingLeft: 10,
      borderLeftWidth: 1,
      borderColor: colors.border,
    },
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
    },
    initText: { fontWeight: "bold", color: colors.text, alignSelf: "center" },
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
    rollBtnText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 16,
    },
    modalBtn: {
      padding: 14,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
  });
