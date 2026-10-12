import { ThemeColors } from "@/constants/theme";
import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface CampaignAuthFormProps {
  colors: ThemeColors;
  busy: boolean;
  onSubmit: (mode: "login" | "register", baseUrl: string, email: string, name: string, password: string) => Promise<void>;
}

/** A senha permanece apenas no formulário até o envio e é apagada depois. */
export function CampaignAuthForm({ colors, busy, onSubmit }: CampaignAuthFormProps) {
  const [baseUrl, setBaseUrl] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");

  async function submit() {
    try {
      await onSubmit(mode, baseUrl, email, name, password);
    } finally {
      setPassword("");
    }
  }

  const inputStyle = [styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg }];

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>Acesso à campanha</Text>
      <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>
        Use HTTPS para servidores remotos. Em desenvolvimento web, use http://localhost:8000.
        A sessão será encerrada ao fechar o aplicativo.
      </Text>
      <TextInput accessibilityLabel="URL da API" value={baseUrl} onChangeText={setBaseUrl}
        placeholder="https://servidor.exemplo" placeholderTextColor={colors.textSecondary}
        autoCapitalize="none" autoCorrect={false} keyboardType="url" style={inputStyle} />
      <TextInput accessibilityLabel="Email" value={email} onChangeText={setEmail}
        placeholder="Email" placeholderTextColor={colors.textSecondary}
        autoCapitalize="none" autoCorrect={false} keyboardType="email-address" style={inputStyle} />
      {mode === "register" && <TextInput accessibilityLabel="Nome" value={name} onChangeText={setName}
        placeholder="Seu nome" placeholderTextColor={colors.textSecondary} style={inputStyle} />}
      <TextInput accessibilityLabel="Senha" value={password} onChangeText={setPassword}
        placeholder="Senha (mínimo 8 caracteres para cadastro)" placeholderTextColor={colors.textSecondary}
        secureTextEntry autoCapitalize="none" style={inputStyle} />
      <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={submit}
        style={[styles.button, { backgroundColor: colors.primary }]}>
        <Text style={styles.buttonText}>{busy ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" disabled={busy}
        onPress={() => setMode(mode === "login" ? "register" : "login")} style={styles.switch}>
        <Text style={{ color: colors.primary }}>
          {mode === "login" ? "Criar uma conta" : "Já tenho uma conta"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 12, padding: 20, width: "100%", maxWidth: 460, alignSelf: "center" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  button: { borderRadius: 8, padding: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  switch: { padding: 14, alignItems: "center" },
});
