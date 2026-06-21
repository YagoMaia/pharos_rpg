import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { TouchableOpacity } from "react-native";

// Contextos
import { useTheme } from "@/context/ThemeContext"; // <--- Importe o Tema

export default function PlayerLayout() {
  // Pegamos as cores e a função de trocar tema aqui no Layout
  const { colors, isDark, toggleTheme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        // --- CORES DA TAB BAR (Inferior) ---
        tabBarStyle: {
          backgroundColor: colors.surface, // Fundo da barra
          borderTopColor: colors.border, // Borda fina no topo da barra
        },
        tabBarActiveTintColor: colors.primary, // Cor do ícone ativo
        tabBarInactiveTintColor: colors.textSecondary, // Cor do ícone inativo

        // --- CORES DO HEADER (Superior) ---
        headerStyle: {
          backgroundColor: colors.background, // Fundo do cabeçalho
          // No Android, remove a sombra "feia" padrão se quiser um visual flat:
          elevation: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.text, // Cor do Título e botões de voltar
        headerTitleStyle: {
          fontWeight: "bold",
        },

        // --- BOTÃO DE TEMA NO TOPO (Direita) ---
        headerRight: () => (
          <TouchableOpacity
            onPress={toggleTheme}
            style={{ marginRight: 15 }} // Espaçamento da margem direita
            activeOpacity={0.7}
          >
            <Ionicons
              name={isDark ? "sunny" : "moon"} // Muda o ícone
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="home-dashboard"
        options={{
          title: "Início",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="characters"
        options={{
          title: "Personagens",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="campaigns"
        options={{
          title: "Campanhas",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="map" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sheet"
        options={{
          title: "Ficha",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="clipboard" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
