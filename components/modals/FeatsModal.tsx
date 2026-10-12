import { useAlert } from "@/context/AlertContext"; // <--- Importar Alert
import { useCharacter } from "@/context/CharacterContext";
import { useTheme } from "@/context/ThemeContext";
import { FEATS_DATA } from "@/data/progression";
import { AttributeName, Feat } from "@/types/rpg";
import { FEAT_ATTRIBUTES, FEAT_LEVELS, featAutomationLabel } from "@/utils/featRules";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const FeatsModal = ({ visible, onClose }: Props) => {
  const { colors } = useTheme();
  // Adicione removeFeat aqui 👇
  const { character, addFeat, removeFeat } = useCharacter();
  const { showAlert } = useAlert(); // <--- Hook de Alerta

  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [pendingFeat, setPendingFeat] = useState<Feat | null>(null);
  const [choices, setChoices] = useState<AttributeName[]>([]);
  const closeSelector = () => {
    setSelectedSlot(null);
    setPendingFeat(null);
    setChoices([]);
  };
  useEffect(() => {
    if (!visible || (selectedSlot !== null && (character.level < selectedSlot ||
      character.feats?.some((feat) => feat.slotLevel === selectedSlot)))) {
      setSelectedSlot(null);
      setPendingFeat(null);
      setChoices([]);
    }
  }, [visible, selectedSlot, character.level, character.feats]);

  // Calcula slots (Mantido igual)
  const slots = useMemo(() => {
    return FEAT_LEVELS.map((level) => ({
      level,
      unlocked: (character.level || 1) >= level,
      // Proteção extra caso feats seja undefined
      feat: character.feats?.find((feat) => feat.slotLevel === level),
    }));
  }, [character.level, character.feats]);

  const availableFeats = FEATS_DATA.filter(
    (f) => !character.feats?.some((owned) => owned.id === f.id),
  );

  const featsByCat = [
    {
      title: "Geral",
      data: availableFeats.filter((f) => f.category === "Geral"),
    },
    {
      title: "Marcial & Sobrevivência",
      data: availableFeats.filter((f) => f.category === "Marcial"),
    },
    {
      title: "Social",
      data: availableFeats.filter((f) => f.category === "Social"),
    },
    {
      title: "Mágico & Mental",
      data: availableFeats.filter((f) => f.category === "Mágico"),
    },
  ];

  const handleSelectFeat = (feat: Feat) => {
    if (selectedSlot === null || character.level < selectedSlot ||
      character.feats.some((item) => item.slotLevel === selectedSlot)) return;
    if (feat.id === "habilidoso" && choices.length !== 2) {
      setPendingFeat(feat);
      return;
    }
    addFeat(feat, selectedSlot, choices);
    closeSelector();
  };

  // NOVA FUNÇÃO: Remover com confirmação
  const handleRemove = (feat: Feat) => {
    showAlert(
      "Remover Façanha",
      `Deseja remover "${feat.name}"? Bônus automáticos serão revertidos. Ajustes manuais precisam ser desfeitos na ficha.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => removeFeat(feat.id),
        },
      ],
    );
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      padding: 20,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
    },
    backBtn: { marginRight: 10 },
    title: { fontSize: 20, fontWeight: "bold", color: colors.text },

    content: { padding: 16 },
    slotCard: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
    },
    slotLocked: { opacity: 0.5, backgroundColor: colors.inputBg },
    slotIcon: { width: 40, alignItems: "center" },
    slotInfo: { flex: 1, marginLeft: 10 },
    slotTitle: { fontSize: 16, fontWeight: "bold", color: colors.text },
    slotDesc: { fontSize: 12, color: colors.textSecondary },
    addBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    addText: { color: "#fff", fontWeight: "bold", fontSize: 12 },

    // Estilo do botão de remover
    removeBtn: {
      padding: 8,
      backgroundColor: colors.inputBg,
      borderRadius: 8,
      marginLeft: 8,
    },

    // Modal Interno (Lista) - Mantido igual
    listHeader: {
      backgroundColor: colors.background,
      padding: 10,
      paddingHorizontal: 16,
    },
    listHeaderTitle: {
      color: colors.primary,
      fontWeight: "bold",
      textTransform: "uppercase",
      fontSize: 12,
    },
    featItem: {
      backgroundColor: colors.surface,
      padding: 16,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    featName: { fontSize: 16, fontWeight: "bold", color: colors.text },
    featObj: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
      fontStyle: "italic",
    },
    featBenefit: { fontSize: 13, color: colors.text, marginTop: 4 },
  });

  // Modal Seletor (Mantido igual, apenas omitido aqui para brevidade)
  if (visible && selectedSlot !== null) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={closeSelector}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={closeSelector}
              style={styles.backBtn}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Façanha — Nível {selectedSlot}</Text>
          </View>
          {pendingFeat ? (
            <ScrollView contentContainerStyle={styles.content}>
              <Text style={styles.featName}>Habilidoso: escolha dois atributos</Text>
              <Text style={styles.featBenefit}>Cada atributo recebe +1, até o máximo de 18.</Text>
              {FEAT_ATTRIBUTES.map((name) => (
                <TouchableOpacity key={name} style={styles.featItem} onPress={() => setChoices((prev) =>
                  prev.includes(name) ? prev.filter((item) => item !== name) : prev.length < 2 ? [...prev, name] : prev)}>
                  <Text style={styles.featName}>{choices.includes(name) ? "✓ " : "○ "}{name}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity disabled={choices.length !== 2} style={[styles.addBtn, { opacity: choices.length === 2 ? 1 : 0.5 }]}
                onPress={() => handleSelectFeat(pendingFeat)}>
                <Text style={styles.addText}>CONFIRMAR ATRIBUTOS</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setPendingFeat(null); setChoices([]); }} style={styles.removeBtn}>
                <Text style={styles.featBenefit}>Escolher outra façanha</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : <SectionList
            sections={featsByCat}
            keyExtractor={(item) => item.id}
            renderSectionHeader={({ section: { title } }) => (
              <View style={styles.listHeader}>
                <Text style={styles.listHeaderTitle}>{title}</Text>
              </View>
            )}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.featItem}
                onPress={() => handleSelectFeat(item)}
              >
                <Text style={styles.featName}>{item.name}</Text>
                <Text style={styles.featObj}>🎯 {item.objective}</Text>
                <Text style={styles.featBenefit}>💎 {item.benefit}</Text>
                <Text style={styles.featObj}>{featAutomationLabel({ ...item, manualBenefits: false })}</Text>
              </TouchableOpacity>
            )}
          />}
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Façanhas & Objetivos</Text>
        </View>

        <ScrollView style={styles.content}>
          <Text
            style={{
              color: colors.textSecondary,
              marginBottom: 20,
              textAlign: "center",
            }}
          >
            Escolha a façanha no slot desejado após cumprir seu objetivo. Ao reduzir o nível, as escolhas são mantidas como inativas. Efeitos manuais precisam ser resolvidos na partida.
          </Text>

          {slots.map((slot) => (
            <View
              key={slot.level}
              style={[styles.slotCard, !slot.unlocked && styles.slotLocked]}
            >
              <View style={styles.slotIcon}>
                <Ionicons
                  name={
                    slot.feat
                      ? "trophy"
                      : slot.unlocked
                        ? "lock-open"
                        : "lock-closed"
                  }
                  size={24}
                  color={slot.feat ? "#FFD700" : colors.textSecondary}
                />
              </View>

              <View style={styles.slotInfo}>
                <Text style={styles.slotTitle}>Slot Nível {slot.level}</Text>
                {slot.feat ? (
                    <View>
                      <Text
                        style={{ color: colors.primary, fontWeight: "bold" }}
                      >
                        {slot.feat.name}
                      </Text>
                      <Text style={styles.slotDesc}>{slot.feat.benefit}</Text>
                      {!slot.unlocked && <Text style={styles.slotDesc}>Inativa até o nível {slot.level}. Bônus automáticos suspensos.</Text>}
                      <Text style={styles.featObj}>{featAutomationLabel(slot.feat)}</Text>
                    </View>
                  ) : slot.unlocked ? (
                    <Text style={styles.slotDesc}>
                      Disponível. Selecione um objetivo.
                    </Text>
                ) : (
                  <Text style={styles.slotDesc}>
                    Desbloqueia no nível {slot.level}
                  </Text>
                )}
              </View>

              {/* AÇÕES: Adicionar ou Remover */}
              {slot.unlocked && !slot.feat && (
                <TouchableOpacity
                  onPress={() => setSelectedSlot(slot.level)}
                  style={styles.addBtn}
                >
                  <Text style={styles.addText}>DEFINIR</Text>
                </TouchableOpacity>
              )}

              {/* Botão de Remover (Lixeira) */}
              {slot.feat && (
                <TouchableOpacity
                  onPress={() => handleRemove(slot.feat!)}
                  style={styles.removeBtn}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={colors.error}
                  />
                </TouchableOpacity>
              )}
            </View>
          ))}
          {(character.feats ?? []).filter((feat) => !FEAT_LEVELS.some((level) => level === feat.slotLevel)).map((feat) => (
            <View key={feat.id} style={styles.slotCard}>
              <View style={styles.slotInfo}>
                <Text style={styles.featName}>{feat.name}</Text>
                <Text style={styles.slotDesc}>Importada sem slot disponível — inativa.</Text>
                <Text style={styles.slotDesc}>{feat.benefit}</Text>
              </View>
              <TouchableOpacity onPress={() => handleRemove(feat)} style={styles.removeBtn}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};
