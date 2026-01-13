import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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

// Ajuste os caminhos conforme sua pasta real
import { useCampaign } from "@/context/CampaignContext";
import { useTheme } from "@/context/ThemeContext";
import { NpcTemplate } from "@/types/rpg";

export default function NpcScreen() {
  const { npcLibrary, saveNpcToLibrary, deleteNpcFromLibrary, addCombatant } =
    useCampaign();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  // Modais
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [qtyModalVisible, setQtyModalVisible] = useState(false);

  // States de Criação
  const [name, setName] = useState("");
  const [hp, setHp] = useState("");
  const [ac, setAc] = useState("");
  const [notes, setNotes] = useState("");

  // State para Adicionar ao Combate
  const [selectedNpc, setSelectedNpc] = useState<NpcTemplate | null>(null);
  const [quantity, setQuantity] = useState("1");

  // --- LÓGICA DE SALVAR NO BESTIÁRIO ---
  const handleSave = () => {
    if (!name) return;
    saveNpcToLibrary({
      name,
      maxHp: parseInt(hp) || 10,
      armorClass: parseInt(ac) || 10,
      notes,
    });
    setCreateModalVisible(false);
    resetForm();
  };

  const resetForm = () => {
    setName("");
    setHp("");
    setAc("");
    setNotes("");
  };

  // --- LÓGICA DE PREPARAR ADIÇÃO ---
  const openAddModal = (npc: NpcTemplate) => {
    setSelectedNpc(npc);
    setQuantity("1");
    setQtyModalVisible(true);
  };

  // --- LÓGICA DE EFETIVAR ADIÇÃO AO COMBATE ---
  const confirmAddToCombat = () => {
    if (!selectedNpc) return;

    const qty = parseInt(quantity) || 1;

    for (let i = 0; i < qty; i++) {
      const init = Math.floor(Math.random() * 20) + 1; // D20 Simples
      // Dica: Se quiser somar destreza futuramente, adicione 'initBonus' no NpcTemplate

      addCombatant(selectedNpc.name, selectedNpc.maxHp, init, "npc");
    }

    setQtyModalVisible(false);
    Alert.alert(
      "Sucesso",
      `${qty}x ${selectedNpc.name} enviados para o combate.`
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={npcLibrary}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum NPC salvo.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSub}>
                HP: {item.maxHp} | CA: {item.armorClass}
              </Text>
              {item.notes ? (
                <Text style={styles.cardNotes} numberOfLines={2}>
                  {item.notes}
                </Text>
              ) : null}
            </View>
            <View style={styles.actions}>
              {/* Botão de Espada: Abre Modal de Quantidade */}
              <TouchableOpacity
                onPress={() => openAddModal(item)}
                style={styles.actionBtn}
              >
                <MaterialCommunityIcons name="sword" size={20} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => deleteNpcFromLibrary(item.id)}
                style={[styles.actionBtn, { backgroundColor: colors.inputBg }]}
              >
                <Ionicons name="trash" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setCreateModalVisible(true)}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* --- MODAL 1: CRIAR NOVO NPC --- */}
      <Modal visible={createModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Novo NPC</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome (ex: Goblin)"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="HP Máx"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={hp}
                onChangeText={setHp}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="CA (Defesa)"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={ac}
                onChangeText={setAc}
              />
            </View>
            <TextInput
              style={[styles.input, { height: 60 }]}
              placeholder="Notas / Ataques"
              placeholderTextColor={colors.textSecondary}
              multiline
              value={notes}
              onChangeText={setNotes}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                onPress={() => setCreateModalVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                <Text style={styles.saveText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- MODAL 2: QUANTIDADE (Funciona no Android) --- */}
      <Modal visible={qtyModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { width: "80%" }]}>
            <Text style={styles.modalTitle}>Adicionar ao Combate</Text>
            <Text style={{ color: colors.textSecondary, marginBottom: 10 }}>
              Quantos {selectedNpc?.name} deseja adicionar?
            </Text>

            <TextInput
              style={[
                styles.input,
                { textAlign: "center", fontSize: 24, fontWeight: "bold" },
              ]}
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
              autoFocus
              selectTextOnFocus
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                onPress={() => setQtyModalVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmAddToCombat}
                style={styles.saveBtn}
              >
                <Text style={styles.saveText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    empty: { textAlign: "center", marginTop: 50, color: colors.textSecondary },
    card: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      flexDirection: "row",
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 2,
    },
    cardTitle: { fontSize: 18, fontWeight: "bold", color: colors.text },
    cardSub: { fontSize: 14, color: colors.textSecondary, marginVertical: 4 },
    cardNotes: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: "italic",
    },
    actions: { justifyContent: "center", gap: 8, marginLeft: 10 },
    actionBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#c62828", // Vermelho do Mestre
      alignItems: "center",
      justifyContent: "center",
    },
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
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center", // Centraliza o modal menor
      padding: 20,
    },
    modalCard: {
      backgroundColor: colors.surface,
      padding: 20,
      borderRadius: 12,
      width: "100%",
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 15,
      textAlign: "center",
    },
    input: {
      backgroundColor: colors.inputBg,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      color: colors.text,
    },
    modalBtns: { flexDirection: "row", gap: 10, marginTop: 10 },
    cancelBtn: {
      flex: 1,
      padding: 12,
      alignItems: "center",
      backgroundColor: colors.inputBg,
      borderRadius: 8,
    },
    saveBtn: {
      flex: 1,
      padding: 12,
      alignItems: "center",
      backgroundColor: "#c62828",
      borderRadius: 8,
    },
    cancelText: { color: colors.textSecondary, fontWeight: "bold" },
    saveText: { color: "#fff", fontWeight: "bold" },
  });
