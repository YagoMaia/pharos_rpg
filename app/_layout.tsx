// app/_layout.tsx
import { Stack } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { CharacterProvider, useCharacter } from "../context/CharacterContext";
import { ThemeProvider } from "../context/ThemeContext"; // <--- Importe

// Componente Wrapper para gerenciar o Loading
function AppContent() {
  const { isLoading } = useCharacter();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" color="#6200ea" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function Layout() {
  return (
    <ThemeProvider>
      <CharacterProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </CharacterProvider>
    </ThemeProvider>
  );
}
