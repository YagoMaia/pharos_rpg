import { ThemeColors } from "@/constants/theme";
import { tableNamesForRole, TableRole } from "@/services/tableRoster";
import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface CampaignAuthFormProps {
  colors: ThemeColors;
  busy: boolean;
  role: TableRole;
  onSubmit: (baseUrl: string, name: string, pin: string) => Promise<void>;
}

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

  const inputStyle = [styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg }];

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>Acesso à mesa</Text>
      <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>
        Use HTTPS para servidores remotos. Em desenvolvimento web, use http://localhost:8000.
        A sessão será encerrada ao fechar o aplicativo.
      </Text>
      <TextInput accessibilityLabel="URL da API" value={baseUrl} onChangeText={setBaseUrl}
        placeholder="https://servidor.exemplo" placeholderTextColor={colors.textSecondary}
        autoCapitalize="none" autoCorrect={false} keyboardType="url" style={inputStyle} />
      <Text style={{ color: colors.text }}>Selecione seu nome</Text>
      <View style={styles.names}>
        {tableNamesForRole(role).map((member) => <TouchableOpacity key={member}
          accessibilityRole="radio" accessibilityState={{ selected: name === member }}
          disabled={busy} onPress={() => setName(member)}
          style={[styles.choice, { borderColor: colors.border,
            backgroundColor: name === member ? colors.primary : colors.surface }]}>
          <Text style={{ color: name === member ? "#fff" : colors.text }}>{member}</Text>
        </TouchableOpacity>)}
      </View>
      <Text style={{ color: colors.textSecondary }}>PIN: nome escolhido em letras minúsculas.</Text>
      <TextInput accessibilityLabel="PIN" value={pin} onChangeText={setPin}
        placeholder="PIN" placeholderTextColor={colors.textSecondary}
        secureTextEntry autoCapitalize="none" style={inputStyle} />
      <TouchableOpacity accessibilityRole="button" disabled={busy || !name || !pin} onPress={submit}
        style={[styles.button, { backgroundColor: colors.primary }]}>
        <Text style={styles.buttonText}>{busy ? "Aguarde..." : "Entrar na mesa"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 12, padding: 20, width: "100%", maxWidth: 460, alignSelf: "center" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  names: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 12 },
  choice: { borderWidth: 1, borderRadius: 8, padding: 10 },
  button: { borderRadius: 8, padding: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
