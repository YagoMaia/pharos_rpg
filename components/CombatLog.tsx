import { useTheme } from "@/context/ThemeContext";
import React, { useEffect, useRef } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

interface CombatLogProps {
  logs: string[];
}

export const CombatLog = ({ logs }: CombatLogProps) => {
  const { colors } = useTheme();
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll para o final quando chegar log novo
  useEffect(() => {
    if (logs.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [logs]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textSecondary }]}>
          HISTÓRICO DE COMBATE
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={logs}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={{ padding: 10 }}
        style={{ maxHeight: 150 }} // Altura fixa para não ocupar a tela toda
        renderItem={({ item }) => (
          <Text style={[styles.logText, { color: colors.text }]}>• {item}</Text>
        )}
        ListEmptyComponent={
          <Text
            style={{
              color: colors.textSecondary,
              fontStyle: "italic",
              fontSize: 12,
            }}
          >
            Nenhum evento registrado.
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  headerTitle: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  logText: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: "monospace", // Se disponível, fica estilo terminal
  },
});
