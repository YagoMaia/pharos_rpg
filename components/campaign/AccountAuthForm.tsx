import { ThemeColors } from "@/constants/theme";
import { AccountCredential } from "@/services/sessionSignIn";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface AccountAuthFormProps {
  colors: ThemeColors;
  busy: boolean;
  onSubmit: (submission: { baseUrl: string } & AccountCredential) => Promise<void>;
}

const webPointer = Platform.OS === "web" ? ({ cursor: "pointer" } as const) : {};

const DEFAULT_SERVER_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://pharos-server.yagomaia.com.br";

/**
 * Conta do mestre: e-mail + senha. A senha fica só no formulário e é apagada
 * depois do envio; registro exige 8 caracteres, como no servidor.
 */
export function AccountAuthForm({ colors, busy, onSubmit }: AccountAuthFormProps) {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_SERVER_URL);
  const [action, setAction] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");

  const registering = action === "register";
  const canSubmit = !busy && email.trim().length > 0 && password.length >= 8
    && (!registering || displayName.trim().length > 0);

  async function submit() {
    try {
      if (!canSubmit) return;
      await onSubmit({
        baseUrl: baseUrl.trim() || DEFAULT_SERVER_URL,
        action,
        email: email.trim(),
        password,
        ...(registering ? { displayName: displayName.trim() } : {}),
      });
    } finally {
      setPassword("");
    }
  }

  const inputStyle = [
    styles.input,
    { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg },
  ];

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Ionicons name="person-circle-outline" size={32} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>
          {registering ? "Criar conta de mestre" : "Entrar com minha conta"}
        </Text>
      </View>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        A conta é o que dá acesso às campanhas e às credenciais do assistente de preparação.
      </Text>

      <View style={styles.fieldSection}>
        <Text style={[styles.label, { color: colors.text }]}>Endereço do Servidor</Text>
        <TextInput
          accessibilityLabel="URL da API"
          value={baseUrl}
          onChangeText={setBaseUrl}
          placeholder={DEFAULT_SERVER_URL}
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          style={inputStyle}
        />
      </View>

      <View style={styles.fieldSection}>
        <Text style={[styles.label, { color: colors.text }]}>E-mail</Text>
        <TextInput
          accessibilityLabel="E-mail"
          value={email}
          onChangeText={setEmail}
          placeholder="voce@exemplo.com"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          style={inputStyle}
        />
      </View>

      {registering ? (
        <View style={styles.fieldSection}>
          <Text style={[styles.label, { color: colors.text }]}>Nome de exibição</Text>
          <TextInput
            accessibilityLabel="Nome de exibição"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Mestre"
            placeholderTextColor={colors.textSecondary}
            style={inputStyle}
          />
        </View>
      ) : null}

      <View style={styles.fieldSection}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: colors.text }]}>Senha</Text>
          <Text style={[styles.labelNote, { color: colors.textSecondary }]}>mínimo 8 caracteres</Text>
        </View>
        <TextInput
          accessibilityLabel="Senha"
          value={password}
          onChangeText={setPassword}
          placeholder="Digite sua senha"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          autoCapitalize="none"
          style={inputStyle}
        />
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        disabled={busy}
        onPress={submit}
        style={[styles.button, { backgroundColor: colors.primary, opacity: canSubmit ? 1 : 0.5 }, webPointer]}
      >
        <Ionicons name={busy ? "hourglass-outline" : "log-in-outline"} size={20} color="#fff" />
        <Text style={styles.buttonText}>
          {busy ? "Autenticando..." : registering ? "Criar conta e entrar" : "Entrar"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        disabled={busy}
        onPress={() => setAction(registering ? "login" : "register")}
        style={[styles.link, webPointer]}
      >
        <Text style={[styles.linkText, { color: colors.primary }]}>
          {registering ? "Já tenho conta" : "Não tenho conta"}
        </Text>
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
  },
  header: { alignItems: "center", marginBottom: 8, gap: 8 },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center" },
  description: { fontSize: 14, textAlign: "center", marginBottom: 20, lineHeight: 20 },
  fieldSection: { marginBottom: 16 },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  labelNote: { fontSize: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
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
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  link: { alignItems: "center", marginTop: 12, paddingVertical: 4 },
  linkText: { fontSize: 14, fontWeight: "600" },
});
