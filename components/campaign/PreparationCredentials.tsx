import { ThemeColors } from "@/constants/theme";
import { CampaignApiError, createCampaignApi, PreparationToken } from "@/services/campaignApi";
import * as Clipboard from "expo-clipboard";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface Props {
  campaignId: string;
  baseUrl: string;
  sessionToken: string;
  colors: ThemeColors;
  onSessionExpired: () => void;
}

/** Credenciais ficam apenas em memória e são descartadas ao sair da aba ou da campanha. */
export function PreparationCredentials({ campaignId, baseUrl, sessionToken, colors, onSessionExpired }: Props) {
  const [items, setItems] = useState<PreparationToken[]>([]);
  const [label, setLabel] = useState("");
  const [secret, setSecret] = useState("");
  const [issuedId, setIssuedId] = useState<string | null>(null);
  const [pendingRevoke, setPendingRevoke] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const active = useRef(false);
  const client = useMemo(() => createCampaignApi({
    baseUrl, getAccessToken: () => sessionToken,
  }), [baseUrl, sessionToken]);

  const showFailure = useCallback((cause: unknown) => {
    if (!active.current) return;
    if (cause instanceof CampaignApiError && cause.status === 401) {
      onSessionExpired();
      return;
    }
    setError("Não foi possível concluir. Confira a conexão e tente novamente.");
  }, [onSessionExpired]);

  useEffect(() => {
    active.current = true;
    setBusy(true);
    client.listPreparationTokens(campaignId)
      .then((result) => { if (active.current) setItems(result.items); })
      .catch(showFailure)
      .finally(() => { if (active.current) setBusy(false); });
    return () => { active.current = false; };
  }, [campaignId, client, showFailure]);

  async function issue() {
    if (busy || secret) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const issued = await client.issuePreparationToken(campaignId, label);
      if (!active.current) return;
      const { token, campaignId: _campaignId, ...summary } = issued;
      setSecret(token);
      setIssuedId(issued.id);
      setItems((previous) => [summary, ...previous]);
      setLabel("");
    } catch (cause) {
      if (cause instanceof CampaignApiError && cause.status === 401) showFailure(cause);
      else if (active.current) setError("Não foi possível confirmar a emissão. Confira a lista antes de tentar novamente; o valor perdido não pode ser recuperado.");
    } finally {
      if (active.current) setBusy(false);
    }
  }

  async function revoke(id: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const updated = await client.revokePreparationToken(campaignId, id);
      if (!active.current) return;
      setItems((previous) => previous.map((item) => item.id === id ? updated : item));
      setPendingRevoke(null);
      if (id === issuedId) { setSecret(""); setIssuedId(null); }
      setNotice("Credencial revogada. O agente não conseguirá mais usá-la.");
    } catch (cause) {
      showFailure(cause);
    } finally {
      if (active.current) setBusy(false);
    }
  }

  async function copySecret() {
    try {
      await Clipboard.setStringAsync(secret);
      if (active.current) setNotice("Credencial copiada. Cole-a na configuração do agente.");
    } catch {
      if (active.current) setError("Não foi possível copiar. Selecione o texto e copie manualmente.");
    }
  }

  async function refresh() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await client.listPreparationTokens(campaignId);
      if (active.current) setItems(result.items);
    } catch (cause) {
      showFailure(cause);
    } finally {
      if (active.current) setBusy(false);
    }
  }

  return (
    <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>Credenciais do agente</Text>
      <Text style={{ color: colors.textSecondary }}>
        O agente pode ler e preparar notas desta campanha. Ele não pode aplicar rascunhos.
      </Text>
      <Text style={{ color: colors.textSecondary }}>Endereço MCP: {baseUrl.replace(/\/$/, "")}/mcp</Text>
      <TextInput accessibilityLabel="Nome da credencial" value={label} onChangeText={setLabel}
        maxLength={80} placeholder="Ex.: computador do Victor" placeholderTextColor={colors.textSecondary}
        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg }]} />
      <Button label="Gerar credencial" disabled={busy || !!secret} colors={colors} onPress={issue} />
      {!!secret && (
        <View style={[styles.secret, { borderColor: colors.primary }]}>
          <Text style={{ color: colors.text, fontWeight: "700" }}>Copie agora: o valor não será exibido novamente.</Text>
          <Text selectable accessibilityLabel="Credencial gerada" style={{ color: colors.text }}>{secret}</Text>
          <Button label="Copiar credencial" colors={colors} onPress={copySecret} />
          <Button label="Já copiei — ocultar" colors={colors} onPress={() => { setSecret(""); setNotice(""); }} />
        </View>
      )}
      {!!error && <Text accessibilityRole="alert" style={{ color: colors.error }}>{error}</Text>}
      {!!notice && <Text accessibilityRole="alert" style={{ color: colors.text }}>{notice}</Text>}
      {busy && <ActivityIndicator accessibilityLabel="Carregando credenciais" color={colors.primary} />}
      <Button label="Atualizar lista" disabled={busy} colors={colors} onPress={refresh} />
      {!busy && items.length === 0 && <Text style={{ color: colors.textSecondary }}>Nenhuma credencial criada.</Text>}
      {items.map((item) => (
        <View key={item.id} style={[styles.item, { borderColor: colors.border }]}>
          <Text style={{ color: colors.text, fontWeight: "700" }}>{item.label || "Sem nome"}</Text>
          <Text style={{ color: colors.textSecondary }}>
            {item.revokedAt ? "Revogada" : "Ativa"} · Criada em {new Date(item.createdAt).toLocaleString("pt-BR")}
          </Text>
          {item.lastUsedAt && <Text style={{ color: colors.textSecondary }}>Último uso: {new Date(item.lastUsedAt).toLocaleString("pt-BR")}</Text>}
          {!item.revokedAt && pendingRevoke !== item.id && (
            <Button label="Revogar" disabled={busy} colors={colors} onPress={() => setPendingRevoke(item.id)} />
          )}
          {!item.revokedAt && pendingRevoke === item.id && (
            <View style={styles.actions}>
              <Text style={{ color: colors.error }}>O agente perderá o acesso. Confirmar?</Text>
              <Button label="Confirmar revogação" disabled={busy} colors={colors} onPress={() => revoke(item.id)} />
              <Button label="Cancelar" disabled={busy} colors={colors} onPress={() => setPendingRevoke(null)} />
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

function Button({ label, onPress, colors, disabled = false }: {
  label: string; onPress: () => void; colors: ThemeColors; disabled?: boolean;
}) {
  return (
    <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled}
      onPress={onPress} style={[styles.button, { backgroundColor: colors.primary, opacity: disabled ? 0.5 : 1 }]}>
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  panel: { borderWidth: 1, borderRadius: 12, padding: 16, marginTop: 14, gap: 12 },
  title: { fontSize: 18, fontWeight: "700" },
  input: { borderWidth: 1, borderRadius: 8, padding: 10 },
  secret: { borderWidth: 1, borderRadius: 8, padding: 12, gap: 10 },
  item: { borderWidth: 1, borderRadius: 8, padding: 12, gap: 8 },
  actions: { gap: 8 },
  button: { alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 },
  buttonText: { color: "#fff", fontWeight: "700" },
});
