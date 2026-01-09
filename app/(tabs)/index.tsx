// app/(tabs)/index.tsx
import { Ionicons } from "@expo/vector-icons";

import { ThemeColors } from "@/constants/theme";
import { ANCESTRIES, CULTURAL_ORIGINS } from "@/data/origins";
import { ALL_CLASSES, AttributeName, CharacterClass } from "@/types/rpg";
import * as ImagePicker from "expo-image-picker"; // Importação da biblioteca
import React, { useMemo, useState } from "react";
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
import { useTheme } from "../../context/ThemeContext"; // <--- Importe o hook

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
    updateDeathSave,
  } = useCharacter();

  const { colors } = useTheme(); // <--- Pegue as cores

  // 3. Gerar Estilos baseados nas cores atuais
  const styles = useMemo(() => getStyles(colors), [colors]);

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

  const adjustMoney = (amount: number) => {
    // 1. Converte o texto atual para número (ou 0 se estiver vazio)
    const currentVal = parseInt(tempSilver) || 0;

    // 2. Calcula o novo valor, garantindo que não seja menor que 0
    const newVal = Math.max(0, currentVal + amount);

    // 3. Atualiza o estado do input (convertendo de volta para string)
    setTempSilver(String(newVal));
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* --- HEADER --- */}
        <View style={styles.topBar}>
          <Text style={styles.screenTitle}>Ficha</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {/* Botão de Editar */}
            <TouchableOpacity
              onPress={() => setEditModalVisible(true)}
              style={styles.iconBtn}
            >
              <Ionicons
                name="settings-sharp"
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- AVATAR E INFO --- */}
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
                <Ionicons name="camera" size={32} color={colors.iconDefault} />
                <Text style={styles.avatarText}>Foto</Text>
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={12} color="#fff" />
            </View>
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.charName}>{character.name}</Text>
            <Text style={styles.subtext}>
              {character.class || "Sem Classe"} •{" "}
              {character.ancestry?.name || "Sem Origem"}
            </Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Nível 1</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* --- CARTEIRA --- */}
        <View style={styles.walletContainer}>
          <View style={styles.walletHeader}>
            <View style={styles.walletLabelBox}>
              <Ionicons name="cash-outline" size={20} color={colors.gold} />
              <Text style={styles.walletLabel}>Pratas</Text>
            </View>
            <TouchableOpacity onPress={openMoneyModal}>
              <Text style={styles.walletValue}>{character.silver || 0}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        {/* --- ANCESTRALIDADE & ORIGEM --- */}
        <TouchableOpacity
          style={styles.originCard}
          activeOpacity={0.9}
          onPress={() => {
            if (!character.ancestry || !character.culturalOrigin) {
              setEditModalVisible(true);
            } else {
              setShowOriginDetails(!showOriginDetails);
            }
          }}
          onLongPress={() => setEditModalVisible(true)}
        >
          <View style={styles.originHeader}>
            <View>
              <Text style={styles.originLabel}>Ancestralidade & Origem</Text>
              {character.ancestry && character.culturalOrigin ? (
                <Text style={styles.originValue}>
                  {character.ancestry.name} • {character.culturalOrigin.name}
                </Text>
              ) : (
                <Text
                  style={[
                    styles.originValue,
                    { color: colors.textSecondary, fontStyle: "italic" },
                  ]}
                >
                  Toque para definir sua origem
                </Text>
              )}
            </View>
            <Ionicons
              name={
                !character.ancestry
                  ? "create-outline"
                  : showOriginDetails
                  ? "chevron-up"
                  : "chevron-down"
              }
              size={20}
              color={
                !character.ancestry ? colors.primary : colors.textSecondary
              }
            />
          </View>

          {showOriginDetails &&
            character.ancestry &&
            character.culturalOrigin && (
              <View style={styles.originBody}>
                <View style={styles.traitRow}>
                  <Text style={styles.traitName}>
                    Trait: {character.ancestry.traitName}
                  </Text>
                  <Text style={styles.traitDesc}>
                    {character.ancestry.traitDescription}
                  </Text>
                </View>
                <View style={styles.traitRow}>
                  <Text style={styles.traitName}>
                    Cultura: {character.culturalOrigin.culturalTrait}
                  </Text>
                </View>
                <View style={styles.infoBlock}>
                  <Ionicons
                    name="gift-outline"
                    size={14}
                    color={colors.textSecondary}
                    style={{ marginTop: 2 }}
                  />
                  <Text style={styles.infoText}>
                    <Text style={{ fontWeight: "bold" }}>Herança: </Text>
                    {character.culturalOrigin.heritage}
                  </Text>
                </View>
                <View style={styles.infoBlock}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={14}
                    color={colors.textSecondary}
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

        {/* --- RECURSOS (HP/FOCO) --- */}
        <ResourceControl
          label="Vida"
          current={character.stats.hp.current}
          max={character.stats.hp.max}
          color={colors.hp} // Usando cor do tema
          onIncrement={() => updateStat("hp", 1)}
          onDecrement={() => updateStat("hp", -1)}
          styles={styles} // Passando estilos
          colors={colors} // Passando cores
        />

        <ResourceControl
          label="Foco"
          current={character.stats.focus.current}
          max={character.stats.focus.max}
          color={colors.focus} // Usando cor do tema
          onIncrement={() => updateStat("focus", 1)}
          onDecrement={() => updateStat("focus", -1)}
          styles={styles}
          colors={colors}
        />

        {/* --- SEÇÃO DE DEATH SAVES (CONDICIONAL) --- */}
        {character.stats.hp.current === 0 && (
          <View style={styles.deathSaveContainer}>
            <Text style={styles.deathSaveTitle}>TESTES DE MORTE</Text>

            <View style={styles.deathSaveRow}>
              {/* Sucessos */}
              <View style={styles.deathSaveGroup}>
                <Text style={styles.deathSaveLabel}>Sucessos</Text>
                <View style={styles.dotsContainer}>
                  {[1, 2, 3].map((i) => (
                    <TouchableOpacity
                      key={`succ-${i}`}
                      style={[
                        styles.deathSaveDot,
                        character.deathSaves.successes >= i &&
                          styles.deathSaveDotSuccess,
                      ]}
                      onPress={() =>
                        updateDeathSave(
                          "success",
                          character.deathSaves.successes === i ? i - 1 : i
                        )
                      }
                    />
                  ))}
                </View>
              </View>

              {/* Falhas */}
              <View style={styles.deathSaveGroup}>
                <Text style={styles.deathSaveLabel}>Falhas</Text>
                <View style={styles.dotsContainer}>
                  {[1, 2, 3].map((i) => (
                    <TouchableOpacity
                      key={`fail-${i}`}
                      style={[
                        styles.deathSaveDot,
                        character.deathSaves.failures >= i &&
                          styles.deathSaveDotFailure,
                      ]}
                      onPress={() =>
                        updateDeathSave(
                          "failure",
                          character.deathSaves.failures === i ? i - 1 : i
                        )
                      }
                    />
                  ))}
                </View>
              </View>
            </View>

            <Text style={styles.deathSaveHelp}>
              Se chegar a 3 sucessos, você estabiliza. Se chegar a 3 falhas, o
              personagem morre.
            </Text>
          </View>
        )}

        <View style={styles.divider} />

        {/* --- ATRIBUTOS --- */}
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

        {/* --- BOTÃO RESET --- */}
        {/* <View style={styles.debugSection}>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetText}>⚠ Resetar Ficha (Debug)</Text>
          </TouchableOpacity>
        </View> */}

        <View style={styles.divider} />

        {/* --- DESCANSO --- */}
        <Text style={styles.sectionLabel}>Recuperação</Text>
        <View style={styles.restContainer}>
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

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* --- MODAL DINHEIRO --- */}
      <Modal visible={isMoneyModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.smallModal}>
            <Text style={styles.smallModalTitle}>Gerenciar Pratas</Text>

            {/* Input Principal */}
            <View style={styles.inputWrapper}>
              <Ionicons
                name="cash"
                size={20}
                color={colors.textSecondary}
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={styles.moneyInput}
                keyboardType="numeric"
                value={tempSilver}
                onChangeText={setTempSilver}
                autoFocus
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {/* Botões de Ajuste Rápido */}
            <View style={styles.quickAdjustContainer}>
              <View style={styles.quickAdjustRow}>
                <TouchableOpacity
                  onPress={() => adjustMoney(-10)}
                  style={styles.adjustBtn}
                >
                  <Text style={styles.adjustBtnText}>-10</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => adjustMoney(-1)}
                  style={styles.adjustBtn}
                >
                  <Text style={styles.adjustBtnText}>-1</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => adjustMoney(1)}
                  style={styles.adjustBtn}
                >
                  <Text style={styles.adjustBtnText}>+1</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => adjustMoney(10)}
                  style={styles.adjustBtn}
                >
                  <Text style={styles.adjustBtnText}>+10</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Botões de Ação */}
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

      {/* --- MODAL EDIÇÃO --- */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editar Personagem</Text>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Text style={styles.closeText}>Concluir</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* 1. Identidade */}
            <Text style={styles.sectionTitle}>Identidade</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                style={styles.input}
                value={character.name}
                onChangeText={(txt) =>
                  updateNameAndClass(txt, character.class as CharacterClass)
                }
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Classe</Text>
              <View style={styles.classSelector}>
                {ALL_CLASSES.map((cls) => {
                  const isSelected = character.class === cls;
                  const currentAncestry = ANCESTRIES.find(
                    (a) => a.id === character.ancestry?.id
                  );
                  const isRestricted =
                    currentAncestry?.restrictedClasses?.includes(cls);

                  return (
                    <TouchableOpacity
                      key={cls}
                      disabled={isRestricted}
                      style={[
                        styles.classChip,
                        isSelected && styles.classChipActive,
                        isRestricted && styles.classChipDisabled,
                      ]}
                      onPress={() => updateNameAndClass(character.name, cls)}
                    >
                      <Text
                        style={[
                          styles.classChipText,
                          isSelected && styles.classChipTextActive,
                          isRestricted && styles.classChipTextDisabled,
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

            {/* 2. Ancestralidade */}
            <Text style={styles.sectionTitle}>Ancestralidade</Text>
            <View style={styles.chipContainer}>
              {ANCESTRIES.map((anc) => (
                <TouchableOpacity
                  key={anc.id}
                  style={[
                    styles.chip,
                    character.ancestry?.id === anc.id && styles.chipActive,
                  ]}
                  onPress={() => updateAncestry(anc.id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      character.ancestry?.id === anc.id &&
                        styles.chipTextActive,
                    ]}
                  >
                    {anc.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.helperText}>
              Bônus:{" "}
              {ANCESTRIES.find((a) => a.id === character.ancestry?.id)
                ?.attributeBonus || "-"}
            </Text>

            {/* 3. Origem */}
            <Text style={styles.sectionTitle}>Origem Cultural</Text>
            <View style={styles.listSelector}>
              {CULTURAL_ORIGINS.filter(
                (o) =>
                  o.ancestryId === character.ancestry?.id ||
                  o.ancestryId === "mista"
              ).map((orig) => (
                <TouchableOpacity
                  key={orig.id}
                  style={[
                    styles.listItem,
                    character.culturalOrigin?.id === orig.id &&
                      styles.listItemActive,
                  ]}
                  onPress={() => updateOrigin(orig.id)}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.listItemTitle,
                        character.culturalOrigin?.id === orig.id &&
                          styles.listItemTitleActive,
                      ]}
                    >
                      {orig.name}
                    </Text>
                    <Text style={styles.listItemDesc}>{orig.description}</Text>
                  </View>
                  {character.culturalOrigin?.id === orig.id && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* 4. Stats & Atributos (Simplificado para brevidade, use a mesma lógica de cores do input acima) */}
            <Text style={styles.sectionTitle}>Status Máximos</Text>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Vida Máx</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(character.stats.hp.max)}
                  onChangeText={(t) => updateMaxStat("hp", Number(t))}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Foco Máx</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(character.stats.focus.max)}
                  onChangeText={(t) => updateMaxStat("focus", Number(t))}
                />
              </View>
            </View>

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
                      <Ionicons name="remove" size={20} color={colors.text} />
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
                      <Ionicons name="add" size={20} color={colors.text} />
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

// --- COMPONENTE DE RECURSO (MODIFICADO PARA RECEBER ESTILOS/CORES) ---
const ResourceControl = ({
  label,
  current,
  max,
  color,
  onIncrement,
  onDecrement,
  styles,
  colors,
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
          {
            width: `${Math.min(100, (current / max) * 100)}%`,
            backgroundColor: color,
          },
        ]}
      />
    </View>
    <View style={styles.buttonsRow}>
      <TouchableOpacity onPress={onDecrement} style={styles.btn}>
        <Text style={{ color: colors.text }}>-</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onIncrement} style={styles.btn}>
        <Text style={{ color: colors.text }}>+</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// --- GERADOR DE ESTILOS DINÂMICO ---
const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },
    content: { padding: 16 },

    // Top Bar
    topBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    screenTitle: { fontSize: 28, fontWeight: "bold", color: colors.text },
    iconBtn: { padding: 8 },

    // Header
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
      backgroundColor: colors.surface,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: colors.border,
    },
    avatarImage: { width: "100%", height: "100%", borderRadius: 40 },
    avatarPlaceholder: { alignItems: "center", justifyContent: "center" },
    avatarText: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
    editBadge: {
      position: "absolute",
      bottom: 0,
      right: 0,
      backgroundColor: colors.primary,
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: colors.surface,
    },

    headerText: { flex: 1 },
    charName: { fontSize: 24, fontWeight: "bold", color: colors.text },
    subtext: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
    levelBadge: {
      marginTop: 6,
      backgroundColor: colors.text,
      alignSelf: "flex-start",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    levelText: {
      color: colors.background,
      fontSize: 10,
      fontWeight: "bold",
      textTransform: "uppercase",
    },

    divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },

    // Carteira (Mantive as cores originais mas adaptei o texto e fundo)
    walletContainer: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.gold,
    },
    walletHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    walletLabelBox: { flexDirection: "row", alignItems: "center", gap: 8 },
    walletLabel: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.gold,
      textTransform: "uppercase",
    },
    walletValue: { fontSize: 28, fontWeight: "bold", color: colors.text },

    // Origin Card
    originCard: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
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
      color: colors.textSecondary,
      fontWeight: "bold",
    },
    originValue: { fontSize: 16, fontWeight: "bold", color: colors.text },
    originBody: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    traitRow: { marginBottom: 8 },
    traitName: { fontSize: 14, fontWeight: "bold", color: colors.text },
    traitDesc: { fontSize: 13, color: colors.textSecondary },
    infoBlock: { flexDirection: "row", gap: 6, marginBottom: 4 },
    infoText: { fontSize: 13, color: colors.textSecondary, flex: 1 },

    // Resources
    resourceContainer: { marginBottom: 16 },
    resourceHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    resourceLabel: { fontWeight: "600", color: colors.text },
    resourceValues: { color: colors.textSecondary },
    barBackground: {
      height: 12,
      backgroundColor: colors.border,
      borderRadius: 6,
      overflow: "hidden",
      marginBottom: 8,
    },
    barFill: { height: "100%" },
    buttonsRow: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
    btn: {
      width: 40,
      height: 30,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },

    // Atributos
    attributesGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    attrCard: {
      width: "30%",
      backgroundColor: colors.surface,
      padding: 10,
      alignItems: "center",
      marginBottom: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    attrLabel: {
      fontSize: 12,
      fontWeight: "bold",
      color: colors.textSecondary,
    },
    attrValue: { fontSize: 22, fontWeight: "bold", color: colors.text },
    modBadge: {
      backgroundColor: colors.text,
      borderRadius: 4,
      paddingHorizontal: 6,
      marginTop: 4,
    },
    modText: { color: colors.background, fontSize: 12, fontWeight: "bold" },

    // Debug
    debugSection: { marginTop: 20, alignItems: "center", marginBottom: 20 },
    resetButton: {
      backgroundColor: colors.error + "20",
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.error,
    },
    resetText: { color: colors.error, fontWeight: "bold" },

    // Rest
    sectionLabel: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.textSecondary,
      marginBottom: 10,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    restContainer: { flexDirection: "row", gap: 12 },
    // Cards de descanso mantidos com cor fixa para identidade visual, mas texto adaptado
    restButtonShort: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#fff3e0",
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#ffe0b2",
    },
    restButtonLong: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#ede7f6",
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#d1c4e9",
    },
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
    restTitle: { fontSize: 14, fontWeight: "bold", color: "#333" }, // Fixo para contraste com o fundo claro
    restDesc: { fontSize: 10, color: "#666", marginTop: 2 }, // Fixo

    // Modais
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    smallModal: {
      backgroundColor: colors.surface,
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
      color: colors.text,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.inputBg,
      borderRadius: 8,
      paddingHorizontal: 12,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    moneyInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
    },
    modalButtons: { flexDirection: "row", gap: 10 },
    cancelBtn: {
      flex: 1,
      padding: 12,
      alignItems: "center",
      borderRadius: 8,
      backgroundColor: colors.inputBg,
    },
    saveBtn: {
      flex: 1,
      padding: 12,
      alignItems: "center",
      borderRadius: 8,
      backgroundColor: colors.gold,
    },
    cancelText: { color: colors.textSecondary, fontWeight: "bold" },
    saveText: { color: "#fff", fontWeight: "bold" },

    // Edit Modal Full
    modalContainer: { flex: 1, backgroundColor: colors.background },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: { fontSize: 18, fontWeight: "bold", color: colors.text },
    closeText: { color: colors.primary, fontSize: 16, fontWeight: "600" },
    modalContent: { padding: 20, paddingBottom: 50 },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "bold",
      marginTop: 20,
      marginBottom: 12,
      color: colors.textSecondary,
      textTransform: "uppercase",
    },

    inputGroup: { marginBottom: 16 },
    label: { fontSize: 14, color: colors.textSecondary, marginBottom: 6 },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: colors.inputBg,
      color: colors.text,
    },

    // Chips
    classSelector: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    classChip: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    classChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    classChipDisabled: { backgroundColor: colors.inputBg, opacity: 0.5 },
    classChipText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    classChipTextActive: { color: "#fff", fontWeight: "bold" },
    classChipTextDisabled: {
      textDecorationLine: "line-through",
      color: colors.error,
    },

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
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: { backgroundColor: colors.primary },
    chipText: { color: colors.textSecondary, fontWeight: "500" },
    chipTextActive: { color: "#fff" },
    helperText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 16,
      fontStyle: "italic",
    },

    listSelector: { gap: 8 },
    listItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    listItemActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + "10",
    }, // Tint leve
    listItemTitle: { fontWeight: "bold", fontSize: 14, color: colors.text },
    listItemTitleActive: { color: colors.primary },
    listItemDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

    // Attr Editor
    attributesEditor: {
      backgroundColor: colors.inputBg,
      borderRadius: 12,
      padding: 10,
    },
    attrEditRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    attrEditLabel: {
      fontSize: 16,
      fontWeight: "500",
      width: 100,
      color: colors.text,
    },
    stepper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    stepBtn: { padding: 10 },
    attrEditValue: {
      fontSize: 18,
      fontWeight: "bold",
      width: 40,
      textAlign: "center",
      color: colors.text,
    },
    modPreview: {
      width: 60,
      textAlign: "right",
      color: colors.textSecondary,
      fontSize: 14,
    },
    row: { flexDirection: "row" },
    // Quick Adjust (Novos Estilos)
    quickAdjustContainer: {
      marginBottom: 20,
    },
    quickAdjustRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
    },
    adjustBtn: {
      flex: 1,
      backgroundColor: colors.inputBg,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    adjustBtnText: {
      fontWeight: "bold",
      color: colors.text,
    },

    deathSaveContainer: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.error, // Vermelho para chamar atenção
      marginBottom: 16,
      alignItems: "center",
    },
    deathSaveTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.error,
      marginBottom: 12,
      letterSpacing: 2,
    },
    deathSaveRow: {
      flexDirection: "row",
      gap: 40,
      marginBottom: 12,
    },
    deathSaveGroup: {
      alignItems: "center",
    },
    deathSaveLabel: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.textSecondary,
      marginBottom: 8,
      textTransform: "uppercase",
    },
    dotsContainer: {
      flexDirection: "row",
      gap: 8,
    },
    deathSaveDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.textSecondary,
      backgroundColor: "transparent",
    },
    deathSaveDotSuccess: {
      backgroundColor: colors.success, // Verde
      borderColor: colors.success,
    },
    deathSaveDotFailure: {
      backgroundColor: colors.error, // Vermelho
      borderColor: colors.error,
    },
    deathSaveHelp: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: "italic",
      textAlign: "center",
    },
  });
