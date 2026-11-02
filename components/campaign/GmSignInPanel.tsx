import { AccountAuthForm } from "@/components/campaign/AccountAuthForm";
import { CampaignAuthForm } from "@/components/campaign/CampaignAuthForm";
import { ThemeColors } from "@/constants/theme";
import { AccountCredential } from "@/services/sessionSignIn";
import React, { useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type SignInMode = "table" | "account";

interface GmSignInPanelProps {
  colors: ThemeColors;
  busy: boolean;
  onTableSignIn: (baseUrl: string, name: string, pin: string) => Promise<void>;
  onAccountSignIn: (submission: { baseUrl: string } & AccountCredential) => Promise<void>;
}

const webPointer = Platform.OS === "web" ? ({ cursor: "pointer" } as const) : {};

/**
 * Duas portas, um painel: identidade da mesa (nome + PIN) para diário e combate,
 * conta (e-mail + senha) para o que é próprio do dono da campanha — criar
 * campanha, ver rascunhos de preparação e emitir credenciais do assistente.
 */
export function GmSignInPanel({ colors, busy, onTableSignIn, onAccountSignIn }: GmSignInPanelProps) {
  const [mode, setMode] = useState<SignInMode>("table");

  return (
    <View style={styles.wrapper}>
      <View style={styles.tabs}>
        <ModeTab
          colors={colors}
          label="Identidade da mesa"
          selected={mode === "table"}
          onPress={() => setMode("table")}
        />
        <ModeTab
          colors={colors}
          label="Minha conta"
          selected={mode === "account"}
          onPress={() => setMode("account")}
        />
      </View>

      {mode === "table" ? (
        <CampaignAuthForm colors={colors} role="gm" busy={busy} onSubmit={onTableSignIn} />
      ) : (
        <AccountAuthForm colors={colors} busy={busy} onSubmit={onAccountSignIn} />
      )}
    </View>
  );
}

interface ModeTabProps {
  colors: ThemeColors;
  label: string;
  selected: boolean;
  onPress: () => void;
}

function ModeTab({ colors, label, selected, onPress }: ModeTabProps) {
  return (
    <TouchableOpacity
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.tab,
        {
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.primary : colors.inputBg,
        },
        webPointer,
      ]}
    >
      <Text style={[styles.tabText, { color: selected ? "#fff" : colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: "100%", alignItems: "center", gap: 12 },
  tabs: { flexDirection: "row", gap: 8, marginBottom: 4 },
  tab: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  tabText: { fontSize: 14, fontWeight: "600" },
});
