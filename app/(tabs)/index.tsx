// app/(tabs)/index.tsx
import { Ionicons } from "@expo/vector-icons";

import { ANCESTRIES, CULTURAL_ORIGINS } from "@/data/origins";
import { ALL_CLASSES, AttributeName } from "@/types/rpg";
import * as ImagePicker from "expo-image-picker"; // Importação da biblioteca
import React, { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useCharacter } from "../../context/CharacterContext";

export default function HomeScreen() {
  const {
    character,
    updateStat,
    updateImage,
    resetCharacter,
    updateMaxStat,
    updateAttribute,
    updateNameAndClass,
    updateSilver,
    performShortRest,
    performLongRest,
    updateOrigin,
    updateAncestry,
  } = useCharacter();

  // Estado para controlar a visibilidade do Modal de Edição
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [showOriginDetails, setShowOriginDetails] = useState(false); // Toggle para ver detalhes

  const [isMoneyModalVisible, setMoneyModalVisible] = useState(false);
  const [tempSilver, setTempSilver] = useState("");

  const openMoneyModal = () => {
    setTempSilver(String(character.silver || 0));
    setMoneyModalVisible(true);
  };

  const saveMoney = () => {
    const val = parseInt(tempSilver);
    if (!isNaN(val)) {
      updateSilver(val);
    }
    setMoneyModalVisible(false);
  };

  const handleShortRest = () => {
    Alert.alert(
      "Descanso Curto",
      "Deseja gastar algumas horas para descansar? Isso recuperará metade da sua Vida e Foco máximos.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Confirmar", onPress: performShortRest },
      ]
    );
  };

  const handleLongRest = () => {
    Alert.alert(
      "Descanso Longo",
      "Deseja dormir uma noite completa? Isso recuperará TODA a sua Vida e Foco.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Dormir", onPress: performLongRest }, // style default (azul)
      ]
    );
  };

  const availableOrigins = CULTURAL_ORIGINS.filter(
    (o) => o.ancestryId === character.ancestry.id
  );

  const handleReset = () => {
    Alert.alert(
      "Resetar Ficha",
      "Tem a certeza? Isto apagará todo o progresso e restaurará os dados iniciais do código.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sim, Resetar",
          style: "destructive",
          onPress: () => resetCharacter(), // <--- Chama a função
        },
      ]
    );
  };

  // Função para abrir a galeria
  const pickImage = async () => {
    // Pede permissão (automático no Expo moderno, mas boa prática)
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Permissão necessária",
        "É necessário permitir o acesso à galeria para mudar a foto."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], // Apenas imagens
      allowsEditing: true, // Permite recortar (crop)
      aspect: [1, 1], // Força formato quadrado
      quality: 0.5, // Qualidade média para não pesar no armazenamento
      base64: true, // Importante para salvar no AsyncStorage
    });

    if (!result.canceled && result.assets[0].base64) {
      // Salva a imagem como string base64 data URI
      const imageUri = `data:image/jpeg;base64,${result.assets[0].base64}`;
      updateImage(imageUri);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* Header com Botão de Editar */}
        <View style={styles.topBar}>
          <Text style={styles.screenTitle}>Ficha</Text>
          <TouchableOpacity
            onPress={() => setEditModalVisible(true)}
            style={styles.editIconBtn}
          >
            <Ionicons name="settings-sharp" size={24} color="#6200ea" />
          </TouchableOpacity>
        </View>
        {/* --- Seção do Avatar e Header --- */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            onPress={pickImage}
            activeOpacity={0.8}
            style={styles.avatarContainer}
          >
            {character.image ? (
              <Image
                source={{ uri: character.image }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="camera" size={32} color="#999" />
                <Text style={styles.avatarText}>Foto</Text>
              </View>
            )}
            {/* Ícone de edição flutuante */}
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={12} color="#fff" />
            </View>
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.charName}>{character.name}</Text>
            <Text style={styles.subtext}>
              {character.class} • {character.ancestry.name}
            </Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Nível 1</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.walletContainer}>
          <View style={styles.walletHeader}>
            <View style={styles.walletLabelBox}>
              <Ionicons name="cash-outline" size={20} color="#f9a825" />
              <Text style={styles.walletLabel}>Pratas</Text>
            </View>

            <TouchableOpacity onPress={openMoneyModal}>
              <Text style={styles.walletValue}>{character.silver || 0}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        {/* --- CARD DE ANCESTRALIDADE E ORIGEM (NOVO) --- */}
        <TouchableOpacity
          style={styles.originCard}
          activeOpacity={0.9}
          onPress={() => setShowOriginDetails(!showOriginDetails)}
        >
          <View style={styles.originHeader}>
            <View>
              <Text style={styles.originLabel}>Ancestralidade & Origem</Text>
              <Text style={styles.originValue}>
                {character.ancestry.name}{" "}
                <Text style={{ fontWeight: "normal" }}>•</Text>{" "}
                {character.culturalOrigin.name}
              </Text>
            </View>
            <Ionicons
              name={showOriginDetails ? "chevron-up" : "chevron-down"}
              size={20}
              color="#666"
            />
          </View>

          {showOriginDetails && (
            <View style={styles.originBody}>
              {/* Traço Racial */}
              <View style={styles.traitRow}>
                <Text style={styles.traitName}>
                  Trait: {character.ancestry.traitName}
                </Text>
                <Text style={styles.traitDesc}>
                  {character.ancestry.traitDescription}
                </Text>
              </View>

              {/* Traço Cultural */}
              <View style={styles.traitRow}>
                <Text style={styles.traitName}>
                  Cultura: {character.culturalOrigin.culturalTrait}
                </Text>
              </View>

              {/* Herança */}
              <View style={styles.infoBlock}>
                <Ionicons
                  name="gift-outline"
                  size={14}
                  color="#555"
                  style={{ marginTop: 2 }}
                />
                <Text style={styles.infoText}>
                  <Text style={{ fontWeight: "bold" }}>Herança: </Text>
                  {character.culturalOrigin.heritage}
                </Text>
              </View>

              {/* Línguas */}
              <View style={styles.infoBlock}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={14}
                  color="#555"
                  style={{ marginTop: 2 }}
                />
                <Text style={styles.infoText}>
                  <Text style={{ fontWeight: "bold" }}>Línguas: </Text>
                  {character.culturalOrigin.languages.join(", ")}
                </Text>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Barras de Recursos (Código existente) */}
        <ResourceControl
          label="Vida"
          current={character.stats.hp.current}
          max={character.stats.hp.max}
          color="#e53935"
          onIncrement={() => updateStat("hp", 1)}
          onDecrement={() => updateStat("hp", -1)}
        />

        <ResourceControl
          label="Foco"
          current={character.stats.focus.current}
          max={character.stats.focus.max}
          color="#1e88e5"
          onIncrement={() => updateStat("focus", 1)}
          onDecrement={() => updateStat("focus", -1)}
        />

        <View style={styles.divider} />

        {/* Atributos (Código existente) */}
        <View style={styles.attributesGrid}>
          {Object.values(character.attributes).map((attr) => (
            <View key={attr.name} style={styles.attrCard}>
              <Text style={styles.attrLabel}>
                {attr.name.substring(0, 3).toUpperCase()}
              </Text>
              <Text style={styles.attrValue}>{attr.value}</Text>
              <View style={styles.modBadge}>
                <Text style={styles.modText}>
                  {attr.modifier >= 0 ? "+" : ""}
                  {attr.modifier}
                </Text>
              </View>
            </View>
          ))}
        </View>
        <View style={styles.debugSection}>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetText}>⚠ Resetar Ficha (Debug)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* --- SEÇÃO DE DESCANSO (NOVO) --- */}
        <Text style={styles.sectionLabel}>Recuperação</Text>
        <View style={styles.restContainer}>
          {/* Botão Descanso Curto */}
          <TouchableOpacity
            style={styles.restButtonShort}
            onPress={handleShortRest}
          >
            <View style={styles.iconCircleShort}>
              <Ionicons name="cafe" size={20} color="#f57c00" />
            </View>
            <View>
              <Text style={styles.restTitle}>Descanso Curto</Text>
              <Text style={styles.restDesc}>Recupera 50%</Text>
            </View>
          </TouchableOpacity>

          {/* Botão Descanso Longo */}
          <TouchableOpacity
            style={styles.restButtonLong}
            onPress={handleLongRest}
          >
            <View style={styles.iconCircleLong}>
              <Ionicons name="moon" size={20} color="#5e35b1" />
            </View>
            <View>
              <Text style={styles.restTitle}>Descanso Longo</Text>
              <Text style={styles.restDesc}>Recupera Tudo</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Espaço extra para não colar no final */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* --- MODAL ESPECÍFICO PARA DINHEIRO --- */}
      <Modal visible={isMoneyModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.smallModal}>
            <Text style={styles.smallModalTitle}>Gerenciar Pratas</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="cash"
                size={20}
                color="#888"
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={styles.moneyInput}
                keyboardType="numeric"
                value={tempSilver}
                onChangeText={setTempSilver}
                autoFocus
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setMoneyModalVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveMoney} style={styles.saveBtn}>
                <Text style={styles.saveText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- MODAL DE EDIÇÃO DE PERSONAGEM --- */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        presentationStyle="pageSheet" // Estilo iOS moderno (funciona em Android como full)
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editar Personagem</Text>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Text style={styles.closeText}>Concluir</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* 1. Dados Básicos */}
            <Text style={styles.sectionTitle}>Dados Básicos</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                style={styles.input}
                value={character.name}
                onChangeText={(txt) => updateNameAndClass(txt, character.class)}
              />
            </View>
            {/* SELETOR DE CLASSE (SUBSTITUI O TEXTINPUT) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Classe</Text>
              <View style={styles.classSelector}>
                {ALL_CLASSES.map((cls) => {
                  const isSelected = character.class === cls;
                  return (
                    <TouchableOpacity
                      key={cls}
                      style={[
                        styles.classChip,
                        isSelected && styles.classChipActive,
                      ]}
                      onPress={() => updateNameAndClass(character.name, cls)}
                    >
                      <Text
                        style={[
                          styles.classChipText,
                          isSelected && styles.classChipTextActive,
                        ]}
                      >
                        {cls}
                      </Text>
                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color="#fff"
                          style={{ marginLeft: 4 }}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 2. ANCESTRALIDADE (Novo Seletor) */}
            <Text style={styles.sectionTitle}>Ancestralidade</Text>
            <View style={styles.chipContainer}>
              {ANCESTRIES.map((anc) => (
                <TouchableOpacity
                  key={anc.id}
                  style={[
                    styles.chip,
                    character.ancestry.id === anc.id && styles.chipActive,
                  ]}
                  onPress={() => updateAncestry(anc.id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      character.ancestry.id === anc.id && styles.chipTextActive,
                    ]}
                  >
                    {anc.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.helperText}>
              Bônus:{" "}
              {
                ANCESTRIES.find((a) => a.id === character.ancestry.id)
                  ?.attributeBonus
              }
            </Text>

            {/* 3. ORIGEM CULTURAL (Novo Seletor - Filtrado) */}
            <Text style={styles.sectionTitle}>Origem Cultural</Text>
            <View style={styles.listSelector}>
              {/* Mostra apenas as origens compatíveis com a ancestralidade escolhida */}
              {CULTURAL_ORIGINS.filter(
                (o) => o.ancestryId === character.ancestry.id
              ).map((orig) => (
                <TouchableOpacity
                  key={orig.id}
                  style={[
                    styles.listItem,
                    character.culturalOrigin.id === orig.id &&
                      styles.listItemActive,
                  ]}
                  onPress={() => updateOrigin(orig.id)}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.listItemTitle,
                        character.culturalOrigin.id === orig.id &&
                          styles.listItemTitleActive,
                      ]}
                    >
                      {orig.name}
                    </Text>
                    <Text style={styles.listItemDesc}>{orig.description}</Text>
                  </View>
                  {character.culturalOrigin.id === orig.id && (
                    <Ionicons name="checkmark" size={20} color="#6200ea" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* 2. Stats Máximos */}
            <Text style={styles.sectionTitle}>Status Máximos</Text>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Vida Máxima</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(character.stats.hp.max)}
                  onChangeText={(txt) => updateMaxStat("hp", Number(txt) || 0)}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Foco Máximo</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(character.stats.focus.max)}
                  onChangeText={(txt) =>
                    updateMaxStat("focus", Number(txt) || 0)
                  }
                />
              </View>
            </View>

            {/* 3. Atributos */}
            <Text style={styles.sectionTitle}>Atributos</Text>
            <View style={styles.attributesEditor}>
              {Object.values(character.attributes).map((attr) => (
                <View key={attr.name} style={styles.attrEditRow}>
                  <Text style={styles.attrEditLabel}>{attr.name}</Text>

                  <View style={styles.stepper}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() =>
                        updateAttribute(
                          attr.name as AttributeName,
                          attr.value - 1
                        )
                      }
                    >
                      <Ionicons name="remove" size={20} color="#555" />
                    </TouchableOpacity>

                    <Text style={styles.attrEditValue}>{attr.value}</Text>

                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() =>
                        updateAttribute(
                          attr.name as AttributeName,
                          attr.value + 1
                        )
                      }
                    >
                      <Ionicons name="add" size={20} color="#555" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.modPreview}>
                    Mod: {attr.modifier >= 0 ? "+" : ""}
                    {attr.modifier}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// Componente ResourceControl mantido igual...
const ResourceControl = ({
  label,
  current,
  max,
  color,
  onIncrement,
  onDecrement,
}: any) => (
  <View style={styles.resourceContainer}>
    <View style={styles.resourceHeader}>
      <Text style={styles.resourceLabel}>{label}</Text>
      <Text style={styles.resourceValues}>
        {current} / {max}
      </Text>
    </View>
    <View style={styles.barBackground}>
      <View
        style={[
          styles.barFill,
          { width: `${(current / max) * 100}%`, backgroundColor: color },
        ]}
      />
    </View>
    <View style={styles.buttonsRow}>
      <TouchableOpacity onPress={onDecrement} style={styles.btn}>
        <Text>-</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onIncrement} style={styles.btn}>
        <Text>+</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 16 },
  mainContainer: { flex: 1, backgroundColor: "#fff" },

  // Estilos do Header com Avatar
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    position: "relative",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 40,
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 10,
    color: "#999",
    marginTop: 2,
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#6200ea",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  headerText: {
    flex: 1,
    justifyContent: "center",
  },
  charName: { fontSize: 24, fontWeight: "bold", color: "#333" },
  subtext: { fontSize: 14, color: "#666", marginTop: 2 },
  levelBadge: {
    marginTop: 6,
    backgroundColor: "#333",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  levelText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },

  divider: { height: 1, backgroundColor: "#f0f0f0", marginVertical: 16 },

  // Estilos de Atributos (Mantidos)
  attributesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  attrCard: {
    width: "30%",
    backgroundColor: "#f9f9f9",
    padding: 10,
    alignItems: "center",
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  attrLabel: { fontSize: 12, fontWeight: "bold", color: "#555" },
  attrValue: { fontSize: 22, fontWeight: "bold" },
  modBadge: {
    backgroundColor: "#333",
    borderRadius: 4,
    paddingHorizontal: 6,
    marginTop: 4,
  },
  modText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  resourceContainer: { marginBottom: 16 },
  resourceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  resourceLabel: { fontWeight: "600" },
  resourceValues: { color: "#555" },
  barBackground: {
    height: 12,
    backgroundColor: "#eee",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 8,
  },
  barFill: { height: "100%" },
  buttonsRow: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  btn: {
    width: 40,
    height: 30,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  debugSection: {
    marginTop: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: "#ffcdd2", // Vermelho claro
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e53935",
  },
  resetText: {
    color: "#c62828",
    fontWeight: "bold",
  },
  // --- ESTILOS DO MODAL ---
  modalContainer: { flex: 1, backgroundColor: "#fff" },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  closeText: { color: "#6200ea", fontSize: 16, fontWeight: "600" },
  modalContent: { padding: 20, paddingBottom: 50 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 12,
    color: "#444",
    textTransform: "uppercase",
  },

  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, color: "#666", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  row: { flexDirection: "row" },

  // Editor de Atributos
  attributesEditor: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 10,
  },
  attrEditRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  attrEditLabel: { fontSize: 16, fontWeight: "500", width: 100 },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  stepBtn: { padding: 10 },
  attrEditValue: {
    fontSize: 18,
    fontWeight: "bold",
    width: 40,
    textAlign: "center",
  },
  modPreview: { width: 60, textAlign: "right", color: "#666", fontSize: 14 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  screenTitle: { fontSize: 28, fontWeight: "bold", color: "#222" },
  editIconBtn: { padding: 8 },
  // ESTILOS NOVOS DO SELECTOR DE CLASSE
  classSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  classChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  classChipActive: {
    backgroundColor: "#6200ea", // Roxo principal
    borderColor: "#6200ea",
  },
  classChipText: {
    fontSize: 14,
    color: "#444",
    fontWeight: "500",
  },
  classChipTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  // Estilos do Card de Origem
  originCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    padding: 12,
    marginBottom: 16,
  },
  originHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  originLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    color: "#888",
    fontWeight: "bold",
  },
  originValue: { fontSize: 16, fontWeight: "bold", color: "#333" },
  originBody: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  traitRow: { marginBottom: 8 },
  traitName: { fontSize: 14, fontWeight: "bold", color: "#444" },
  traitDesc: { fontSize: 13, color: "#666", lineHeight: 18 },
  infoBlock: { flexDirection: "row", gap: 6, marginBottom: 4 },
  infoText: { fontSize: 13, color: "#555", flex: 1 },

  // Chips (Ancestralidade)
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  chipActive: { backgroundColor: "#6200ea" },
  chipText: { color: "#444", fontWeight: "500" },
  chipTextActive: { color: "#fff" },
  helperText: {
    fontSize: 12,
    color: "#888",
    marginBottom: 16,
    fontStyle: "italic",
  },

  // Lista (Origem)
  listSelector: { gap: 8 },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },
  listItemActive: { borderColor: "#6200ea", backgroundColor: "#f3e5f5" },
  listItemTitle: { fontWeight: "bold", fontSize: 14, color: "#333" },
  listItemTitleActive: { color: "#6200ea" },
  listItemDesc: { fontSize: 12, color: "#666", marginTop: 2 },
  // --- ESTILOS DA CARTEIRA ---
  walletContainer: {
    backgroundColor: "#fff8e1", // Fundo amarelo bem claro (cor de moeda)
    borderRadius: 12,
    padding: 16,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: "#ffecb3",
    elevation: 1,
  },
  walletHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 0,
  },
  walletLabelBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  walletLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#f57f17", // Laranja escuro
    textTransform: "uppercase",
  },
  walletValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  walletActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  walletSpacer: {
    flex: 1, // Empurra os botões para as pontas
    height: 1,
    backgroundColor: "#ffecb3",
  },
  walletBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f9a825",
    justifyContent: "center",
    alignItems: "center",
  },
  walletBtnSmall: {
    paddingHorizontal: 10,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f9a825",
    justifyContent: "center",
    alignItems: "center",
  },
  walletBtnText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#f57f17",
  },

  // --- ESTILOS DO MODAL PEQUENO (Dinheiro) ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  smallModal: {
    backgroundColor: "#fff",
    width: "80%",
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  smallModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  moneyInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  modalButtons: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  saveBtn: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#fbc02d",
  }, // Amarelo Ouro
  cancelText: { color: "#666", fontWeight: "bold" },
  saveText: { color: "#fff", fontWeight: "bold" },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#888",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  restContainer: {
    flexDirection: "row",
    gap: 12,
  },

  // Estilo Base do Botão
  restButtonShort: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3e0", // Laranja bem claro
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ffe0b2",
    elevation: 1,
  },
  restButtonLong: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ede7f6", // Roxo bem claro
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1c4e9",
    elevation: 1,
  },

  // Ícones Circulares
  iconCircleShort: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  iconCircleLong: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  // Textos
  restTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  restDesc: {
    fontSize: 10,
    color: "#666",
    marginTop: 2,
  },
});
