import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, Image } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { usePlayer } from "@/context/PlayerContext";
import { useCharacter } from "@/context/CharacterContext";
import { Ionicons } from "@expo/vector-icons";

interface JoinCampaignModalProps {
  visible: boolean;
  onClose: () => void;
}

export function JoinCampaignModal({ visible, onClose }: JoinCampaignModalProps) {
  const { colors } = useTheme();
  const { joinCampaignByCode } = usePlayer();
  const { character } = useCharacter();

  const [modalStep, setModalStep] = useState(1);
  const [code, setCode] = useState("");
  const [previewData, setPreviewData] = useState<any>(null);

  const resetAndClose = () => {
    setCode("");
    setModalStep(1);
    setPreviewData(null);
    onClose();
  };

  const handleValidateCode = () => {
    if (!code) return;
    // Simulating a code validation
    setPreviewData({
      name: "Campanha " + code.trim().toUpperCase(),
      system: "Pharos",
      gm: "Mestre Supremo",
      description: "Uma jornada épica pelas terras do Norte."
    });
    setModalStep(2);
  };

  const handleJoinCampaign = async () => {
    const res = await joinCampaignByCode(code.trim().toUpperCase());
    if (res.success) {
      Alert.alert("Sucesso", "Você entrou na campanha!");
      resetAndClose();
    } else {
      Alert.alert("Erro", res.error || "Erro ao entrar na campanha.");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={resetAndClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          
          {modalStep === 1 && (
            <>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Entrar em uma Campanha</Text>
              <Text style={{ color: colors.textSecondary, marginBottom: 10 }}>Insira o código de acesso fornecido pelo Mestre:</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="Ex: FARO-4721"
                placeholderTextColor={colors.textSecondary}
                value={code}
                onChangeText={setCode}
                autoCapitalize="characters"
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalButton} onPress={resetAndClose}>
                  <Text style={{ color: colors.text }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.primary }]} onPress={handleValidateCode}>
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>Avançar</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {modalStep === 2 && previewData && (
            <>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Resumo da Campanha</Text>
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 18 }}>{previewData.name}</Text>
                <Text style={{ color: colors.textSecondary }}>Sistema: {previewData.system} • Mestre: {previewData.gm}</Text>
                <Text style={{ color: colors.textSecondary, marginTop: 8, fontStyle: "italic" }}>"{previewData.description}"</Text>
              </View>

              <Text style={{ color: colors.text, fontWeight: "bold", marginBottom: 8 }}>Selecione seu Personagem:</Text>
              <View style={[styles.characterSelectCard, { borderColor: colors.primary, backgroundColor: "rgba(0,0,0,0.1)" }]}>
                <View style={[styles.avatarSmall, { backgroundColor: colors.primary, overflow: "hidden" }]}>
                  {character.image ? (
                    <Image source={{ uri: character.image }} style={{ width: "100%", height: "100%" }} />
                  ) : (
                    <Ionicons name="person" size={16} color="#fff" />
                  )}
                </View>
                <View>
                  <Text style={{ color: colors.text, fontWeight: "bold" }}>{character.name}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Nível {character.level} • {character.class || "Sem classe"}</Text>
                </View>
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} style={{ marginLeft: "auto" }} />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalButton} onPress={() => setModalStep(1)}>
                  <Text style={{ color: colors.text }}>Voltar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.primary }]} onPress={handleJoinCampaign}>
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>Entrar na Campanha</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  characterSelectCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 2,
    borderRadius: 8,
    marginBottom: 20,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
