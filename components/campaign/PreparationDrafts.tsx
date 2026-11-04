import { ThemeColors } from "@/constants/theme";
import {
  CampaignApiError, createCampaignApi, PreparationDraft, PreparationDraftSummary,
  PreparationSourceRef, PreparationSourceRevision,
} from "@/services/campaignApi";
import { buildDraftApplication, requiresPlayerAcknowledgement } from "@/services/draftReview";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  campaignId: string;
  baseUrl: string;
  sessionToken: string;
  colors: ThemeColors;
  onSessionExpired: () => void;
  onApplied: () => void;
}

const kindNames: Record<PreparationDraftSummary["kind"], string> = {
  session: "Sessão", encounter: "Encontro", npc: "NPC", quest: "Missão",
};
const statusNames: Record<PreparationDraftSummary["status"], string> = {
  draft: "Rascunho", approved: "Aprovado", rejected: "Rejeitado",
};
const fieldNames: Record<string, string> = {
  kind: "Tipo", name: "Nome", title: "Título", role: "Papel", description: "Descrição",
  gmNotes: "Notas do mestre", visibility: "Visibilidade", status: "Estado", attitude: "Atitude",
  sessionNumber: "Número da sessão", summary: "Resumo", scheduledAt: "Data prevista",
  tactics: "Táticas", rewards: "Recompensas", reward: "Recompensa", monstersData: "Criaturas",
  combatData: "Dados de combate",
};

/** Revisão humana: nenhum pedido de aplicação ocorre ao abrir ou listar propostas. */
export function PreparationDrafts({ campaignId, baseUrl, sessionToken, colors, onSessionExpired, onApplied }: Props) {
  const [items, setItems] = useState<PreparationDraftSummary[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [draft, setDraft] = useState<PreparationDraft | null>(null);
  const [source, setSource] = useState<PreparationSourceRevision | null>(null);
  const [target, setTarget] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [needsReload, setNeedsReload] = useState(false);
  const active = useRef(false);
  const locked = useRef(false);
  const client = useMemo(() => createCampaignApi({ baseUrl, getAccessToken: () => sessionToken }), [baseUrl, sessionToken]);

  const handleFailure = useCallback((cause: unknown) => {
    if (!active.current) return;
    if (cause instanceof CampaignApiError && cause.status === 401) return onSessionExpired();
    if (cause instanceof CampaignApiError && cause.status === 409) {
      setNeedsReload(true);
      setConfirming(false);
      setAcknowledged(false);
      return setError("O rascunho ou seu destino mudou, ou já foi aplicado. Reabra e confira antes de tentar novamente.");
    }
    setError("Não foi possível concluir. Verifique a conexão e tente novamente.");
  }, [onSessionExpired]);

  const run = useCallback(async (work: () => Promise<void>) => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try { await work(); } catch (cause) { handleFailure(cause); }
    finally { locked.current = false; if (active.current) setBusy(false); }
  }, [handleFailure]);

  const loadPage = useCallback(async (next?: string | null) => {
    const page = await client.listPreparationDrafts(campaignId, next);
    if (!active.current) return;
    setItems((previous) => next ? [...previous, ...page.items] : page.items);
    setCursor(page.nextCursor);
  }, [campaignId, client]);

  useEffect(() => {
    active.current = true;
    void run(() => loadPage());
    return () => { active.current = false; };
  }, [loadPage, run]);

  function openDraft(id: string) {
    setDraft(null);
    setSource(null);
    setTarget(null);
    setNotice("");
    setConfirming(false);
    setAcknowledged(false);
    setNeedsReload(false);
    void run(async () => {
      const loaded = await client.readPreparationDraft(campaignId, id);
      const currentTarget = loaded.targetId ? await readCurrentTarget(client, campaignId, loaded) : null;
      if (active.current) { setTarget(currentTarget); setDraft(loaded); }
    });
  }

  function openSource(ref: PreparationSourceRef) {
    setSource(null);
    void run(async () => {
      const loaded = await client.readPreparationSource(campaignId, ref.sourceId, ref.revision);
      if (active.current) setSource(loaded);
    });
  }

  function applyDraft() {
    if (!draft || !confirming || needsReload || draft.application || draft.status === "rejected") return;
    void run(async () => {
      const input = buildDraftApplication(draft, acknowledged);
      const result = await client.applyPreparationDraft(campaignId, draft.id, input);
      if (!active.current) return;
      setConfirming(false);
      setNotice(`Aplicado: ${result.action === "updated" ? "registro atualizado" : "registro criado"} (revisão ${result.draftRevision}).`);
      // Bloqueia nova aplicação mesmo se a atualização posterior da lista falhar.
      setDraft({ ...draft, application: { ...result, action: result.action } });
      onApplied();
      await loadPage();
    });
  }

  return (
    <View style={[styles.panel, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.text }]}>Rascunhos de preparação</Text>
      <Text style={{ color: colors.textSecondary }}>Propostas do agente não alteram a campanha até você revisá-las e aplicar.</Text>
      <Button label="Atualizar lista" colors={colors} disabled={busy} onPress={() => void run(() => loadPage())} />
      {!!error && <Text accessibilityRole="alert" style={{ color: colors.error }}>{error}</Text>}
      {!!notice && <Text accessibilityRole="alert" style={{ color: colors.text }}>{notice}</Text>}
      {busy && <ActivityIndicator accessibilityLabel="Carregando rascunhos" color={colors.primary} />}
      {!draft && !busy && !items.length && !error && <Text style={{ color: colors.textSecondary }}>Nenhum rascunho nesta campanha.</Text>}
      {!draft && items.map((item) => (
        <TouchableOpacity key={item.id} accessibilityRole="button" accessibilityLabel={`Revisar ${item.title}`}
          disabled={busy} onPress={() => openDraft(item.id)} style={[styles.item, { borderColor: colors.border }]}>
          <Text style={{ color: colors.text, fontWeight: "700" }}>{item.title}</Text>
          <Text style={{ color: colors.textSecondary }}>{kindNames[item.kind]} · {statusNames[item.status]} · Revisão {item.revision}</Text>
        </TouchableOpacity>
      ))}
      {!draft && cursor && <Button label="Carregar mais" colors={colors} disabled={busy} onPress={() => void run(() => loadPage(cursor))} />}
      {draft && (
        <View style={[styles.detail, { borderColor: colors.primary }]}>
          <Button label="Voltar à lista" colors={colors} disabled={busy} onPress={() => { setDraft(null); setSource(null); setNotice(""); setConfirming(false); setAcknowledged(false); }} />
          <Text style={[styles.title, { color: colors.text }]}>{draft.title}</Text>
          <Text style={{ color: colors.textSecondary }}>
            {kindNames[draft.kind]} · Revisão {draft.revision} · {draft.targetId ? `Atualiza registro ${draft.targetId}` : "Cria novo registro"}
          </Text>
          {!!draft.application && <Text style={{ color: colors.text }}>Já aplicado · Revisão {draft.application.draftRevision}</Text>}
          {draft.status === "rejected" && <Text style={{ color: colors.error }}>Proposta rejeitada; não pode ser aplicada nesta tela.</Text>}
          {draft.targetId && <View style={[styles.item, { borderColor: colors.border }]}>
            <Text style={[styles.heading, { color: colors.text }]}>Registro atual — será substituído</Text>
            <Text selectable style={{ color: colors.text }}>{JSON.stringify(target, null, 2)}</Text>
          </View>}
          <Text style={[styles.heading, { color: colors.text }]}>Conteúdo proposto</Text>
          <PayloadFields payload={draft.payload} colors={colors} />
          <Text style={{ color: colors.textSecondary }}>Para corrigir o conteúdo, peça ao agente para editar o rascunho e volte a abri-lo antes de aplicar.</Text>
          <StringList title="Avisos" items={draft.warnings} colors={colors} />
          <StringList title="Incertezas para o mestre" items={draft.uncertainties} colors={colors} />
          {draft.possibleTargets.length > 0 && (
            <Text style={{ color: colors.error }}>Possíveis registros existentes: {draft.possibleTargets.map((item) => `${item.label} (${item.id})`).join(", ")}. Aplicar criará um novo registro se não houver destino vinculado.</Text>
          )}
          <Text style={[styles.heading, { color: colors.text }]}>Fontes vinculadas</Text>
          {!draft.sourceRefs.length && <Text style={{ color: colors.textSecondary }}>Nenhuma fonte vinculada.</Text>}
          {draft.sourceRefs.map((ref) => <Button key={`${ref.sourceId}:${ref.revision}`} colors={colors} disabled={busy}
            label={`Ver fonte ${ref.sourceId} · revisão ${ref.revision}`} onPress={() => openSource(ref)} />)}
          {source && <View style={[styles.item, { borderColor: colors.border }]}>
            <Text style={{ color: colors.text, fontWeight: "700" }}>{source.title} · revisão {source.revision}</Text>
            <Text style={{ color: colors.textSecondary }}>{source.relativePath}</Text>
            <Text selectable style={{ color: colors.text }}>{source.content}</Text>
          </View>}
          {needsReload && <Button label="Reler rascunho" colors={colors} disabled={busy} onPress={() => openDraft(draft.id)} />}
          {!draft.application && draft.status !== "rejected" && !needsReload && !confirming && (
            <Button label="Revisar aplicação" colors={colors} disabled={busy} onPress={() => setConfirming(true)} />
          )}
          {confirming && !draft.application && (
            <View style={[styles.item, { borderColor: colors.error }]}>
              <Text style={{ color: colors.text, fontWeight: "700" }}>Aplicar a revisão {draft.revision} à campanha?</Text>
              <Text style={{ color: colors.textSecondary }}>Isso altera registros oficiais. Confira as fontes e incertezas antes de continuar.</Text>
              {requiresPlayerAcknowledgement(draft.payload) && (
                <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: acknowledged }}
                  onPress={() => setAcknowledged(!acknowledged)} style={styles.check}>
                  <Text style={{ color: colors.error }}>{acknowledged ? "☑" : "☐"} Confirmo que revisei o conteúdo que ficará visível aos jogadores.</Text>
                </TouchableOpacity>
              )}
              <Button label="Confirmar e aplicar" colors={colors} disabled={busy || (requiresPlayerAcknowledgement(draft.payload) && !acknowledged)} onPress={applyDraft} />
              <Button label="Cancelar" colors={colors} disabled={busy} onPress={() => { setConfirming(false); setAcknowledged(false); }} />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function PayloadFields({ payload, colors }: { payload: Record<string, unknown>; colors: ThemeColors }) {
  return <View style={styles.group}>
    {Object.entries(payload).map(([key, value]) => (
      <View key={key} style={styles.group}>
        <Text style={{ color: colors.textSecondary, fontWeight: "700" }}>{fieldNames[key] || key}</Text>
        <Text selectable style={{ color: colors.text }}>{formatField(value)}</Text>
      </View>
    ))}
  </View>;
}

function formatField(value: unknown): string {
  if (value === null || value === "") return "—";
  return typeof value === "string" ? value : JSON.stringify(value, null, 2) ?? "—";
}

async function readCurrentTarget(
  client: ReturnType<typeof createCampaignApi>, campaignId: string, draft: PreparationDraft,
): Promise<unknown> {
  const records = draft.kind === "session" ? await client.listSessions(campaignId)
    : draft.kind === "npc" ? await client.listNpcs(campaignId)
    : draft.kind === "quest" ? await client.listQuests(campaignId)
    : await client.listEncounters(campaignId);
  const target = records.find((record) => record.id === draft.targetId);
  if (!target) throw new Error("Destino não encontrado; releia a campanha antes de aplicar.");
  return target;
}

function StringList({ title, items, colors }: { title: string; items: string[]; colors: ThemeColors }) {
  if (!items.length) return null;
  return <View style={styles.group}><Text style={[styles.heading, { color: colors.text }]}>{title}</Text>
    {items.map((item, index) => <Text key={index} style={{ color: colors.text }}>• {item}</Text>)}</View>;
}

function Button({ label, onPress, colors, disabled = false }: { label: string; onPress: () => void; colors: ThemeColors; disabled?: boolean }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={[styles.button, { backgroundColor: colors.primary, opacity: disabled ? 0.5 : 1 }]}><Text style={styles.buttonText}>{label}</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
  panel: { borderWidth: 1, borderRadius: 12, padding: 16, marginTop: 14, gap: 12 },
  title: { fontSize: 18, fontWeight: "700" },
  heading: { fontSize: 15, fontWeight: "700" },
  item: { borderWidth: 1, borderRadius: 8, padding: 12, gap: 8 },
  detail: { borderWidth: 1, borderRadius: 8, padding: 14, gap: 12 },
  group: { gap: 6 },
  check: { paddingVertical: 8 },
  button: { alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 },
  buttonText: { color: "#fff", fontWeight: "700" },
});
