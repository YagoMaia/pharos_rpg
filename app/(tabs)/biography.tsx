// app/(tabs)/biography.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useCharacter } from "../../context/CharacterContext";
import { ALL_SKILLS } from "../../types/rpg"; // Importe a lista

export default function BiographyScreen() {
  const { character, updateBackstory, toggleTrainedSkill } = useCharacter();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={100} // Ajuste para o teclado não cobrir tudo
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* --- SEÇÃO 1: PERÍCIAS TREINADAS --- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="school" size={20} color="#6200ea" />
            <Text style={styles.sectionTitle}>Perícias Treinadas</Text>
          </View>
          <Text style={styles.helperText}>
            Toque para marcar as perícias em que você é proficiente.
          </Text>

          <View style={styles.skillsContainer}>
            {ALL_SKILLS.map((skill) => {
              const isTrained = character.trainedSkills?.includes(skill);

              return (
                <TouchableOpacity
                  key={skill}
                  style={[
                    styles.skillChip,
                    isTrained && styles.skillChipActive,
                  ]}
                  onPress={() => toggleTrainedSkill(skill)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.skillText,
                      isTrained && styles.skillTextActive,
                    ]}
                  >
                    {skill}
                  </Text>
                  {isTrained && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#fff"
                      style={{ marginLeft: 6 }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.divider} />

        {/* --- SEÇÃO 2: HISTÓRIA DO PERSONAGEM --- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="book" size={20} color="#6200ea" />
            <Text style={styles.sectionTitle}>História do Personagem</Text>
          </View>

          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              multiline={true}
              placeholder="Escreva aqui a origem, feitos e motivações do seu personagem..."
              value={character.backstory}
              onChangeText={updateBackstory}
              textAlignVertical="top" // Importante para Android
            />
          </View>
        </View>

        {/* Espaço extra no final para scroll */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  content: { padding: 16 },

  section: { marginBottom: 50 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  helperText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 12,
    fontStyle: "italic",
  },

  divider: { height: 1, backgroundColor: "#e0e0e0", marginVertical: 10 },

  // --- ESTILOS DAS PERÍCIAS (Chips) ---
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    elevation: 1, // Sombra leve
  },
  skillChipActive: {
    backgroundColor: "#6200ea", // Roxo (Cor da marca)
    borderColor: "#6200ea",
    elevation: 3,
  },
  skillText: {
    fontSize: 14,
    color: "#555",
    fontWeight: "500",
  },
  skillTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },

  // --- ESTILOS DA ÁREA DE TEXTO (História) ---
  textAreaContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    minHeight: 300, // Altura mínima grande para escrever bastante
    elevation: 2,
    marginBottom: 50,
  },
  textArea: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    height: "70%", // Ocupa todo o container
  },
});
