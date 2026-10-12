import { ThemeColors } from "@/constants/theme";
import { tableNamesForRole, TableRole } from "@/services/tableRoster";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface CampaignAuthFormProps {
  colors: ThemeColors;
  busy: boolean;
  role: TableRole;
  onSubmit: (baseUrl: string, name: string, pin: string) => Promise<void>;
}

const webPointer = Platform.OS === "web" ? ({ cursor: "pointer" } as const) : {};

/** O PIN permanece apenas no formulário até o envio e é apagado depois. */
export function CampaignAuthForm({ colors, busy, role, onSubmit }: CampaignAuthFormProps) {
  const [baseUrl, setBaseUrl] = useState("");
  const [name, setName] = useState<string | null>(null);
  const [pin, setPin] = useState("");

  async function submit() {
    try {
      if (!name) return;
      await onSubmit(baseUrl, name, pin);
    } finally {
      setPin("");
    }
  }

  const inputStyle = [
    styles.input,
    {
      color: colors.text,
      borderColor: colors.border,
      backgroundColor: colors.inputBg,
    },
  ];

  const isGm = role === "gm";

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: colors.text,
        },
      ]}
    >
      {/* Cabeçalho */}
      <View style={styles.header}>
        <View
          style={[
            styles.iconWrapper,
            { backgroundColor: isGm ? "rgba(187, 134, 252, 0.15)" : "rgba(3, 218, 198, 0.15)" },
          ]}
        >
          {isGm ? (
            <MaterialCommunityIcons name="shield-crown" size={32} color={colors.primary} />
          ) : (
            <Ionicons name="dice-outline" size={32} color={colors.secondary || colors.primary} />
          )}
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          {isGm ? "Painel do Mestre" : "Acesso dos Jogadores"}
        </Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: isGm ? "rgba(187, 134, 252, 0.12)" : "rgba(3, 218, 198, 0.12)" },
          ]}
        >
          <Text style={[styles.badgeText, { color: isGm ? colors.primary : colors.secondary || colors.primary }]}>
            {isGm ? "Identidade do Mestre" : "Mesa Pharos"}
          </Text>
        </View>
      </View>

      <Text style={[styles.description, { color: colors.textSecondary }]}>
        Conecte-se à mesa para sincronizar campanhas, diário e combate em tempo real.
      </Text>

      {/* URL do Servidor */}
      <View style={styles.fieldSection}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: colors.text }]}>Endereço do Servidor</Text>
          <Text style={[styles.labelNote, { color: colors.textSecondary }]}>HTTP local ou HTTPS</Text>
        </View>
        <TextInput
          accessibilityLabel="URL da API"
          value={baseUrl}
          onChangeText={setBaseUrl}
          placeholder="http://localhost:8000"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          style={inputStyle}
        />

        {/* Atalhos rápidos para web / rede local */}
        <View style={styles.quickChips}>
          <Text style={[styles.quickText, { color: colors.textSecondary }]}>Atalhos:</Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setBaseUrl("http://localhost:8000")}
            style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.inputBg }, webPointer]}
          >
            <Text style={[styles.chipText, { color: colors.text }]}>localhost:8000</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setBaseUrl("http://127.0.0.1:8000")}
            style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.inputBg }, webPointer]}
          >
            <Text style={[styles.chipText, { color: colors.text }]}>127.0.0.1:8000</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Seleção do Nome */}
      <View style={styles.fieldSection}>
        <Text style={[styles.label, { color: colors.text }]}>Identidade na Mesa</Text>
        <View style={styles.names}>
          {tableNamesForRole(role).map((member) => {
            const isSelected = name === member;
            return (
              <TouchableOpacity
                key={member}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                disabled={busy}
                onPress={() => setName(member)}
                style={[
                  styles.choice,
                  {
                    borderColor: isSelected ? colors.primary : colors.border,
                    backgroundColor: isSelected ? colors.primary : colors.inputBg,
                  },
                  webPointer,
                ]}
              >
                <Ionicons
                  name={isSelected ? "checkmark-circle" : "person-outline"}
                  size={16}
                  color={isSelected ? "#fff" : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.choiceText,
                    {
                      color: isSelected ? "#fff" : colors.text,
                      fontWeight: isSelected ? "bold" : "normal",
                    },
                  ]}
                >
                  {member}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* PIN */}
      <View style={styles.fieldSection}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: colors.text }]}>PIN de Acesso</Text>
          <Text style={[styles.labelNote, { color: colors.textSecondary }]}>
            {name ? `dica: ${name.toLowerCase()}` : "seu nome em minúsculas"}
          </Text>
        </View>
        <TextInput
          accessibilityLabel="PIN"
          value={pin}
          onChangeText={setPin}
          placeholder="Digite seu PIN"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          autoCapitalize="none"
          style={inputStyle}
        />
      </View>

      {/* Botão de Envio */}
      <TouchableOpacity
        accessibilityRole="button"
        disabled={busy || !name || !pin}
        onPress={submit}
        style={[
          styles.button,
          {
            backgroundColor: colors.primary,
            opacity: busy || !name || !pin ? 0.5 : 1,
          },
          webPointer,
        ]}
      >
        <Ionicons name={busy ? "hourglass-outline" : "log-in-outline"} size={20} color="#fff" />
        <Text style={styles.buttonText}>{busy ? "Autenticando..." : "Entrar na Mesa"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    ...Platform.select({
      web: {
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.12)",
      },
      default: {
        elevation: 4,
      },
    }),
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  fieldSection: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  labelNote: {
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  quickChips: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  quickText: {
    fontSize: 12,
    marginRight: 2,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  names: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  choice: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  choiceText: {
    fontSize: 14,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
