import { useCharacter } from "@/context/CharacterContext";
import { useTheme } from "@/context/ThemeContext";
import { CustomFeat } from "@/types/rpg";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FeatType = "faction" | "special";

interface Props {
  visible: boolean;
  onClose: () => void;
  type: FeatType;
}

export const CustomFeatModal = ({ visible, onClose, type }: Props) => {
  const { colors } = useTheme();
  const { character, setFactionFeat, setSpecialFeat } = useCharacter();

  const currentFeat =
    type === "faction" ? character.factionFeat : character.specialFeat;

  const [name, setName] = useState(currentFeat?.name || "");
  const [category, setCategory] = useState(currentFeat?.category || "");
  const [benefit, setBenefit] = useState(currentFeat?.benefit || "");

  // Sync state when modal opens or feat changes
  useEffect(() => {
    if (visible) {
      setName(currentFeat?.name || "");
      setCategory(currentFeat?.category || "");
      setBenefit(currentFeat?.benefit || "");
    }
  }, [visible, currentFeat]);

  const title =
    type === "faction" ? "Façanha Faccional" : "Façanha Especial";
  const icon = type === "faction" ? "flag" : "star";
  const description =
    type === "faction"
      ? "Uma façanha ligada à sua facção. Preencha com o nome, categoria e benefício."
      : "Uma façanha especial única do seu personagem. Preencha com o nome, categoria e benefício.";

  const handleSave = () => {
    if (!name.trim()) return;

    const feat: CustomFeat = {
      id: `${type}_feat_${Date.now()}`,
      name: name.trim(),
      category: category.trim(),
      benefit: benefit.trim(),
    };

    if (type === "faction") {
      setFactionFeat(feat);
    } else {
      setSpecialFeat(feat);
    }

    onClose();
  };

  const handleClear = () => {
    if (type === "faction") {
      setFactionFeat(null);
    } else {
      setSpecialFeat(null);
    }
    setName("");
    setCategory("");
    setBenefit("");
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
    titleText: { fontSize: 20, fontWeight: "bold", color: colors.text },
    content: { padding: 16 },
    description: {
      color: colors.textSecondary,
      marginBottom: 20,
      textAlign: "center",
      fontSize: 13,
    },
    iconContainer: {
      alignItems: "center",
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 6,
      marginTop: 12,
    },
    input: {
      backgroundColor: colors.inputBg || colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 12,
      fontSize: 15,
      color: colors.text,
    },
    multilineInput: {
      minHeight: 80,
      textAlignVertical: "top",
    },
    saveBtn: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 24,
    },
    saveBtnDisabled: {
      opacity: 0.5,
    },
    saveBtnText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 16,
    },
    clearBtn: {
      padding: 14,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 12,
      borderWidth: 1,
      borderColor: colors.error,
    },
    clearBtnText: {
      color: colors.error,
      fontWeight: "bold",
      fontSize: 14,
    },
    currentCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.primary,
      marginBottom: 16,
    },
    currentTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.primary,
    },
    currentCategory: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
      textTransform: "uppercase",
    },
    currentBenefit: {
      fontSize: 13,
      color: colors.text,
      marginTop: 8,
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.titleText}>{title}</Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={icon as any}
              size={40}
              color={colors.primary}
            />
          </View>

          <Text style={styles.description}>{description}</Text>

          {/* Exibe a façanha atual se existir */}
          {currentFeat && (
            <View style={styles.currentCard}>
              <Text style={styles.currentTitle}>{currentFeat.name}</Text>
              <Text style={styles.currentCategory}>
                {currentFeat.category}
              </Text>
              <Text style={styles.currentBenefit}>
                💎 {currentFeat.benefit}
              </Text>
            </View>
          )}

          {/* Formulário */}
          <Text style={styles.label}>Nome da Façanha</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ex: Manto da Sombra"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>Categoria</Text>
          <TextInput
            style={styles.input}
            value={category}
            onChangeText={setCategory}
            placeholder="Ex: Faccional, Ofensiva, Defensiva..."
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>Benefício</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={benefit}
            onChangeText={setBenefit}
            placeholder="Descreva o efeito mecânico da façanha..."
            placeholderTextColor={colors.textSecondary}
            multiline
          />

          <TouchableOpacity
            style={[styles.saveBtn, !name.trim() && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!name.trim()}
          >
            <Text style={styles.saveBtnText}>
              {currentFeat ? "Atualizar" : "Salvar"}
            </Text>
          </TouchableOpacity>

          {currentFeat && (
            <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
              <Text style={styles.clearBtnText}>Remover Façanha</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};
