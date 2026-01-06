import { Tabs } from "expo-router";
import React from "react";

import { Ionicons } from "@expo/vector-icons"; // Biblioteca de ícones padrão do Expo
import { useCharacter } from "../../context/CharacterContext";

export default function TabLayout() {
  const { character } = useCharacter();

  // Verifica se a classe atual tem acesso a magia
  // const canUseMagic = MAGIC_CLASSES.includes(character.class);
  const canUseMagic = true;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#6200ea",
        headerStyle: { backgroundColor: "#f5f5f5" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Visão Geral",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="combat"
        options={{
          title: "Combate",
          tabBarIcon: ({ color }) => (
            <Ionicons name="shield-half" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: "Inventário",
          tabBarIcon: ({ color }) => (
            <Ionicons name="briefcase" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="biography"
        options={{
          title: "Biografia",
          tabBarIcon: ({ color }) => (
            <Ionicons name="document-text" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="grimoire"
        options={{
          title: "Grimório",
          href: canUseMagic ? "/grimoire" : null, // Esconde o botão da tab se não for mágico
          tabBarIcon: ({ color }) => (
            <Ionicons name="book" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
