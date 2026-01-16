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
import { ReactionOverlay } from "@/components/ReactionOverlay";
import { useAlert } from "@/context/AlertContext";
import { useCampaign } from "@/context/CampaignContext";
import { useCharacter } from "@/context/CharacterContext";
import { useTheme } from "@/context/ThemeContext";
import { useWebSocket } from "@/context/WebSocketContext";
import { generateSafeId } from "@/utils/stringUtils";

const SpectatorCard = ({ item, isCurrentTurn, colors, styles }: any) => {
  const isPlayer = item.type === "player";
  const current = item.hp?.current || 0;
  const max = item.hp?.max || 1;
  const hpPercent = Math.max(0, Math.min(1, current / max));

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

// --- COMPONENTE: INTERFACE ATIVA (Sua Vez - INTEGRADA) ---

// --- TELA PRINCIPAL (Lógica de Conexão + Renderização) ---
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

  // ID Seguro para comparação
  const mySafeId = generateSafeId(character.name);

  // Verifica quem está agindo
  const currentActor = combatants.find((c) => c.id === activeTurnId);
  const isMyTurn = currentActor ? currentActor.id === mySafeId : false;

  // Pega os dados sincronizados
  const myCombatantData = combatants.find((c) => c.id === mySafeId) || {
    ...character,
    id: mySafeId,
    hp: character.stats.hp,
    currentFocus: character.stats.focus.current,
    maxFocus: character.stats.focus.max,
  };

  // --- HANDLERS DE CONEXÃO E INICIATIVA ---
  const handleAttemptJoin = () => {
    if (!ipAddress || !sessionCode) {
      showAlert("Atenção", "Preencha IP e Código da Sala.");
      return;
    }
    // Se já estiver na lista local (reconexão rápida), entra direto
    const alreadyInCombat = combatants.find((c) => c.id === mySafeId);
    if (alreadyInCombat) {
      joinSession(ipAddress, sessionCode, alreadyInCombat.initiative);
    } else {
      setInitValue("");
      setShowInitModal(true);
    }
  };

  const handleForceReconnect = () => {
    if (!ipAddress || !sessionCode) return;
    joinSession(ipAddress, sessionCode, -1);
  };

  const rollInitiative = () => {
    setIsRolling(true);
    setTimeout(() => {
      const d20 = Math.floor(Math.random() * 20) + 1;
      const dexMod = character.attributes["Destreza"]?.modifier || 0;
      setInitValue(String(d20 + dexMod));
      setIsRolling(false);
    }, 500);
  };

  const confirmJoin = () => {
    const finalInit = parseInt(initValue);
    if (isNaN(finalInit)) {
      showAlert("Erro", "Iniciativa inválida.");
      return;
    }
    setShowInitModal(false);
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
            <Text style={styles.configTitle}>Conectar à Sessão</Text>
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
            onPress={handleAttemptJoin}
            style={styles.connectBtn}
          >
            <Text style={styles.connectBtnText}>PRÓXIMO</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleForceReconnect}
            style={{ marginTop: 20, alignSelf: "center", padding: 10 }}
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

        {/* Modal de Iniciativa */}
        <Modal
          visible={showInitModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowInitModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Iniciativa</Text>
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
                  {isRolling ? "Rolando..." : "Rolar Dado"}
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
                    ENTRAR
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    );
  }

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
        <ActiveTurnInterface
          combatant={myCombatantData}
          // styles={styles}
          // colors={colors}
        />
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
            <Text style={styles.empty}>Conectado. Aguardando...</Text>
          }
        />
      )}

      {/* --- AQUI ENTRA A BARRA DE REAÇÃO --- */}
      {/* Condições: 
          1. Não é meu turno 
          2. Tenho dados do personagem 
          3. Tenho Reação disponível (validado dentro do componente, mas bom por aqui)
      */}
      {!isMyTurn && myCombatantData && (
        <ReactionOverlay combatant={myCombatantData} />
      )}
    </View>
  );
}

// --- ESTILOS COMPLETOS (Integrando HUD e Config) ---
const getStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

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
  });
