import { useTheme } from "@/context/ThemeContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { TouchableOpacity } from "react-native";

export default function GMLayout() {
  const { colors, isDark, toggleTheme } = useTheme();

  const gmColor = "#c62828";

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: gmColor,
        tabBarInactiveTintColor: colors.textSecondary,
        headerStyle: {
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.text,
        headerRight: () => (
          <TouchableOpacity onPress={toggleTheme} style={{ marginRight: 15 }}>
            <Ionicons
              name={isDark ? "sunny" : "moon"}
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Painel",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="crown" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="campaigns"
        options={{
          title: "Campanhas",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="map" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: "Biblioteca",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="book" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="combat"
        options={{
          title: "Combate",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="sword-cross"
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="gm-combat-screen"
        options={{
          title: "Turnos",
          tabBarButton: () => null, // Hidden from tab bar
        }}
      />
      <Tabs.Screen
        name="npcs"
        options={{
          href: null, // Temporarily hiding it from tabs since we are merging into library
        }}
      />
    </Tabs>
  );
}
