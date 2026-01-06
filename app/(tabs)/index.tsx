// app/(tabs)/index.tsx
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker"; // Importação da biblioteca
import React from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useCharacter } from "../../context/CharacterContext";

export default function HomeScreen() {
  const { character, updateStat, updateImage, resetCharacter } = useCharacter();

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
    </ScrollView>
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
});
