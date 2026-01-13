import { useCampaign } from "@/context/CampaignContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { Combatant } from "@/types/rpg";

export default function GMCombatScreen() {
  const {
    combatants,
    addCombatant,
    removeCombatant,
    updateCombatant,
    sortCombat,
    clearCombat,
  } = useCampaign();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [modalVisible, setModalVisible] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualHp, setManualHp] = useState("");
  const [manualInit, setManualInit] = useState("");

  const handleAddManual = () => {
    addCombatant(
      manualName || "Inimigo",
      parseInt(manualHp) || 10,
      parseInt(manualInit) || 0,
      "npc"
    );
    setModalVisible(false);
    setManualName("");
    setManualInit("");
  };

  const renderCombatant = ({ item }: { item: Combatant }) => (
    <View style={[styles.card, item.type === "player" && styles.playerBorder]}>
      {/* Iniciativa */}
      <View style={styles.initBox}>
        <TextInput
          style={styles.initInput}
          keyboardType="numeric"
          value={String(item.initiative)}
          onChangeText={(t) =>
            updateCombatant(item.id, "initiative", Number(t))
          }
          onBlur={sortCombat}
        />
        <Text style={styles.tinyLabel}>INIT</Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.type}>
          {item.type === "player" ? "JOGADOR" : "NPC"}
        </Text>
      </View>

      {/* HP Control */}
      <View style={styles.hpCtrl}>
        <TouchableOpacity
          onPress={() => updateCombatant(item.id, "hp", item.hp.current - 1)}
        >
          <Ionicons name="remove-circle" size={32} color={colors.error} />
        </TouchableOpacity>
        <View style={{ alignItems: "center", width: 50 }}>
          <Text style={styles.hpVal}>{item.hp.current}</Text>
          <Text style={styles.tinyLabel}>HP</Text>
        </View>
        <TouchableOpacity
          onPress={() => updateCombatant(item.id, "hp", item.hp.current + 1)}
        >
          <Ionicons name="add-circle" size={32} color={colors.success} />
        </TouchableOpacity>
      </View>

      {/* Delete */}
      <TouchableOpacity
        onPress={() => removeCombatant(item.id)}
        style={{ marginLeft: 8 }}
      >
        <Ionicons name="close" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Turno</Text>
        <View style={{ flexDirection: "row", gap: 15 }}>
          <TouchableOpacity onPress={sortCombat}>
            <Ionicons name="filter" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              Alert.alert("Limpar", "Remover todos?", [
                { text: "Sim", onPress: clearCombat },
                { text: "Não" },
              ])
            }
          >
            <Ionicons name="trash" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={combatants}
        renderItem={renderCombatant}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Adicione combatentes pelo Bestiário ou aqui.
          </Text>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="person-add" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Modal Manual (Caso queira adicionar rápido sem salvar no bestiário) */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Adicionar Rápido</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome"
              placeholderTextColor={colors.textSecondary}
              value={manualName}
              onChangeText={setManualName}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="HP"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={manualHp}
                onChangeText={setManualHp}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Iniciativa"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={manualInit}
                onChangeText={setManualInit}
              />
            </View>
            <TouchableOpacity onPress={handleAddManual} style={styles.addBtn}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>
                Adicionar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{ marginTop: 10, alignItems: "center" }}
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
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 16,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    title: { fontSize: 20, fontWeight: "bold", color: colors.text },
    empty: { textAlign: "center", marginTop: 50, color: colors.textSecondary },

    card: {
      backgroundColor: colors.surface,
      flexDirection: "row",
      alignItems: "center",
      padding: 10,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    playerBorder: { borderColor: "#2e7d32", borderWidth: 2 }, // Verde para players

    initBox: {
      backgroundColor: colors.inputBg,
      width: 50,
      height: 50,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    initInput: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
      padding: 0,
    },
    tinyLabel: { fontSize: 8, color: colors.textSecondary, fontWeight: "bold" },

    name: { fontSize: 16, fontWeight: "bold", color: colors.text },
    type: { fontSize: 10, color: colors.textSecondary, fontWeight: "bold" },

    hpCtrl: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.inputBg,
      borderRadius: 20,
      paddingHorizontal: 5,
    },
    hpVal: { fontSize: 18, fontWeight: "bold", color: colors.text },

    fab: {
      position: "absolute",
      bottom: 20,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: "#c62828",
      alignItems: "center",
      justifyContent: "center",
      elevation: 5,
    },

    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      padding: 20,
    },
    modal: { backgroundColor: colors.surface, padding: 20, borderRadius: 12 },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 15,
      textAlign: "center",
    },
    input: {
      backgroundColor: colors.inputBg,
      padding: 12,
      borderRadius: 8,
      marginBottom: 10,
      color: colors.text,
    },
    addBtn: {
      backgroundColor: "#c62828",
      padding: 12,
      borderRadius: 8,
      alignItems: "center",
    },
  });
