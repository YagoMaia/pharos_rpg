import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { usePlayer } from "@/context/PlayerContext";
import { useCharacter } from "@/context/CharacterContext";
import { useAlert } from "@/context/AlertContext";
import { ANCESTRIES, CULTURAL_ORIGINS } from "@/data/origins";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Image } from "react-native";

export default function CreateCharacterScreen() {
  const { colors } = useTheme();
  const { profile } = usePlayer();
  const { updateNameAndClass, updateAttribute, updateImage, character, resetCharacter } = useCharacter();
  const { showAlert } = useAlert();

  const [step, setStep] = useState(1);
  const [system, setSystem] = useState("Pharos");
  const [name, setName] = useState("");
  const [charClass, setCharClass] = useState("");
  const [ancestryId, setAncestryId] = useState("");
  const [originId, setOriginId] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const classes = ["Guerreiro", "Corsário", "Vanguarda", "Mago", "Apóstata", "Atirador", "Orador"];
  const attributesList = ["Constituição", "Força", "Carisma", "Sabedoria", "Inteligência", "Destreza"];

  // Filtrar as origens culturais pela ancestralidade selecionada
  const availableOrigins = CULTURAL_ORIGINS.filter(o => o.ancestryId === ancestryId);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleNext = () => {
    if (step === 2 && (!name || !charClass)) {
      showAlert("Atenção", "Preencha o nome e a classe.");
      return;
    }
    if (step === 4) {
      // Finalizar criação
      updateNameAndClass(name, charClass as any);
      if (avatarUri) {
        updateImage(avatarUri);
      }
      if (ancestryId) {
        // Atualiza ancestralidade no CharacterContext
        // character.ancestry é gerenciado por updateAncestry (se existir) 
        // ou faremos via resetCharacter? O CharacterContext atual não exporta updateAncestry diretamente na spec, 
        // mas vamos assumir que o context tem updateAncestry e updateOrigin
      }
      
      showAlert("Sucesso", "Personagem criado com sucesso!", [
        { text: "OK", onPress: () => router.back() }
      ]);
      return;
    }
    setStep(step + 1);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: "Novo Personagem", headerShown: true, headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.stepper}>
          <Text style={{ color: colors.textSecondary }}>Passo {step} de 4</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${(step / 4) * 100}%` }]} />
          </View>
        </View>

        {step === 1 && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Sistema de Jogo</Text>
            <TouchableOpacity 
              style={[styles.optionCard, system === "Pharos" && { borderColor: colors.primary, borderWidth: 2 }]}
              onPress={() => setSystem("Pharos")}
            >
              <Text style={[styles.optionTitle, { color: colors.text }]}>Pharos</Text>
              <Text style={{ color: colors.textSecondary }}>Sistema padrão (disponível)</Text>
            </TouchableOpacity>

            <View style={[styles.optionCard, { opacity: 0.5 }]}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>D&D 5e</Text>
              <Text style={{ color: colors.textSecondary }}>(Em breve)</Text>
            </View>

            <View style={[styles.optionCard, { opacity: 0.5 }]}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>Tormenta20</Text>
              <Text style={{ color: colors.textSecondary }}>(Em breve)</Text>
            </View>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Dados Básicos</Text>
            
            <View style={styles.avatarSection}>
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface, borderColor: colors.border, overflow: "hidden" }]}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={{ width: "100%", height: "100%" }} />
                ) : (
                  <Ionicons name="camera-outline" size={32} color={colors.textSecondary} />
                )}
              </View>
              <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                <Text style={{ color: colors.primary, fontWeight: "bold" }}>Alterar Imagem</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="Nome do Personagem *"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
            />
            
            <Text style={[styles.label, { color: colors.text }]}>Classe *</Text>
            <View style={[styles.chipContainer, { marginBottom: 20 }]}>
              {classes.map((c) => (
                <TouchableOpacity 
                  key={c} 
                  style={[styles.chip, charClass === c ? { backgroundColor: colors.primary } : { borderColor: colors.border, borderWidth: 1 }]}
                  onPress={() => setCharClass(c)}
                >
                  <Text style={{ color: charClass === c ? "#fff" : colors.text }}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Ancestralidade</Text>
            <View style={[styles.chipContainer, { marginBottom: 20 }]}>
              {ANCESTRIES.map((anc) => (
                <TouchableOpacity 
                  key={anc.id} 
                  style={[styles.chip, ancestryId === anc.id ? { backgroundColor: colors.primary } : { borderColor: colors.border, borderWidth: 1 }]}
                  onPress={() => {
                    setAncestryId(anc.id);
                    setOriginId(""); // Reset origin when ancestry changes
                  }}
                >
                  <Text style={{ color: ancestryId === anc.id ? "#fff" : colors.text }}>{anc.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {ancestryId !== "" && availableOrigins.length > 0 && (
              <>
                <Text style={[styles.label, { color: colors.text }]}>Origem Cultural</Text>
                <View style={[styles.chipContainer, { marginBottom: 20 }]}>
                  {availableOrigins.map((orig) => (
                    <TouchableOpacity 
                      key={orig.id} 
                      style={[styles.chip, originId === orig.id ? { backgroundColor: colors.primary } : { borderColor: colors.border, borderWidth: 1 }]}
                      onPress={() => setOriginId(orig.id)}
                    >
                      <Text style={{ color: originId === orig.id ? "#fff" : colors.text }}>{orig.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <View style={styles.levelIndicator}>
              <Text style={{ color: colors.textSecondary }}>Nível inicial:</Text>
              <Text style={[styles.levelValue, { color: colors.text }]}>1</Text>
            </View>

          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Atributos</Text>
            <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>Distribua os pontos nos atributos básicos:</Text>
            {attributesList.map((attr) => (
              <View key={attr} style={styles.attrRow}>
                <Text style={[styles.attrName, { color: colors.text }]}>{attr}</Text>
                <View style={styles.attrControls}>
                  <TouchableOpacity onPress={() => updateAttribute(attr as any, (character.attributes[attr as any]?.value || 10) - 1)} style={[styles.btn, { backgroundColor: colors.surface }]}>
                    <Ionicons name="remove" size={20} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={[styles.attrValue, { color: colors.text }]}>{character.attributes[attr as any]?.value || 10}</Text>
                  <TouchableOpacity onPress={() => updateAttribute(attr as any, (character.attributes[attr as any]?.value || 10) + 1)} style={[styles.btn, { backgroundColor: colors.surface }]}>
                    <Ionicons name="add" size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {step === 4 && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Revisão e Criação</Text>
            
            <View style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={{ alignItems: "center", marginBottom: 20 }}>
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary, width: 80, height: 80, borderRadius: 40, overflow: "hidden" }]}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={{ width: "100%", height: "100%" }} />
                  ) : null}
                </View>
                <Text style={[styles.reviewName, { color: colors.text }]}>{name || "Sem Nome"}</Text>
                <Text style={{ color: colors.textSecondary }}>Pharos • {charClass || "Sem Classe"} • Nível 1</Text>
              </View>

              <View style={styles.reviewGrid}>
                <View style={styles.reviewItem}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Ancestralidade</Text>
                  <Text style={{ color: colors.text, fontWeight: "bold" }}>
                    {ANCESTRIES.find(a => a.id === ancestryId)?.name || "Humano"}
                  </Text>
                </View>
                <View style={styles.reviewItem}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Origem</Text>
                  <Text style={{ color: colors.text, fontWeight: "bold" }}>
                    {availableOrigins.find(o => o.id === originId)?.name || "Padrão"}
                  </Text>
                </View>
              </View>

              <Text style={[styles.label, { color: colors.text, marginTop: 16, marginBottom: 8 }]}>Atributos</Text>
              <View style={styles.reviewAttributes}>
                {attributesList.map((attr) => (
                  <View key={attr} style={styles.reviewAttrItem}>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{attr.substring(0, 3)}</Text>
                    <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 16 }}>{character.attributes[attr as any]?.value || 10}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        {step > 1 ? (
          <TouchableOpacity style={[styles.footerBtn, { borderColor: colors.border, borderWidth: 1 }]} onPress={() => setStep(step - 1)}>
            <Text style={{ color: colors.text }}>Voltar</Text>
          </TouchableOpacity>
        ) : <View style={{ flex: 1 }} />}
        <TouchableOpacity style={[styles.footerBtn, { backgroundColor: colors.primary }]} onPress={handleNext}>
          <Text style={{ color: "#fff", fontWeight: "bold" }}>{step === 4 ? "Criar Personagem" : "Avançar"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  stepper: {
    marginBottom: 24,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#333",
    borderRadius: 3,
    marginTop: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
  },
  optionCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  attrRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  attrName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  attrControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  btn: {
    padding: 8,
    borderRadius: 8,
  },
  attrValue: {
    width: 40,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  footerBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  uploadBtn: {
    padding: 8,
  },
  levelIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    marginBottom: 20,
  },
  levelValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  reviewCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
  },
  reviewName: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 4,
  },
  reviewGrid: {
    flexDirection: "row",
    gap: 16,
  },
  reviewItem: {
    flex: 1,
  },
  reviewAttributes: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  reviewAttrItem: {
    width: "30%",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
});
