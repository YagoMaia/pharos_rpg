// app/index.tsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function RoleSelectionScreen() {
  const router = useRouter();
  //   const { toggleGameMasterMode } = useCharacter();
  // Nota: Você pode adaptar o contexto para setar o modo explicitamente aqui

  const handleSelectPlayer = () => {
    // Define modo jogador no contexto (se precisar)
    // isGameMaster = false
    router.replace("/(player)/home"); // Redireciona para as abas de jogador
  };

  const handleSelectGM = () => {
    // Define modo mestre no contexto
    // toggleGameMasterMode(); // ou setIsGameMaster(true)
    router.replace("/(gm)/dashboard"); // Redireciona para as abas de mestre
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PHAROS RPG</Text>
      <Text style={styles.subtitle}>Escolha seu caminho</Text>

      <View style={styles.cardContainer}>
        {/* Card Jogador */}
        <TouchableOpacity
          style={styles.card}
          onPress={handleSelectPlayer}
          activeOpacity={0.8}
        >
          <View style={[styles.iconCircle, { backgroundColor: "#e8f5e9" }]}>
            <Ionicons name="person" size={40} color="#2e7d32" />
          </View>
          <Text style={styles.roleTitle}>Jogador</Text>
          <Text style={styles.roleDesc}>
            Gerencie sua ficha, inventário e magias.
          </Text>
        </TouchableOpacity>

        {/* Card Mestre */}
        <TouchableOpacity
          style={styles.card}
          onPress={handleSelectGM}
          activeOpacity={0.8}
        >
          <View style={[styles.iconCircle, { backgroundColor: "#ffebee" }]}>
            <MaterialCommunityIcons name="crown" size={40} color="#c62828" />
          </View>
          <Text style={styles.roleTitle}>Mestre</Text>
          <Text style={styles.roleDesc}>
            Gerencie combates, NPCs e segredos.
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212", // Fundo escuro dramático
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 18,
    color: "#aaa",
    marginBottom: 60,
    textTransform: "uppercase",
  },
  cardContainer: {
    flexDirection: "row", // Ou 'column' se preferir um embaixo do outro
    gap: 20,
    width: "100%",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#1e1e1e",
    width: 160,
    height: 220,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#333",
    elevation: 5,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  roleDesc: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
  },
});
