import { ThemeColors } from "@/constants/theme";
import { CampaignSession, CampaignSessionInput, SessionStatus } from "@/services/campaignApi";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface CampaignSessionsProps {
  colors: ThemeColors;
  sessions: CampaignSession[];
  isGm: boolean;
  busy?: boolean;
  onCreateSession?: (session: CampaignSessionInput) => void;
  onUpdateSession?: (sessionId: string, session: CampaignSessionInput) => void;
  onDeleteSession?: (sessionId: string) => void;
}

const webPointer = Platform.OS === "web" ? ({ cursor: "pointer" } as const) : {};

const STATUS_LABELS: Record<SessionStatus, string> = {
  planned: "Planejada",
  active: "Em Andamento",
  completed: "Concluída",
};

export function CampaignSessions({
  colors,
  sessions,
  isGm,
  busy = false,
  onCreateSession,
  onUpdateSession,
  onDeleteSession,
}: CampaignSessionsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sessionNumber, setSessionNumber] = useState<string>(String(sessions.length + 1));
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [status, setStatus] = useState<SessionStatus>("planned");
  const [showForm, setShowForm] = useState(false);

  function resetForm() {
    setEditingId(null);
    setSessionNumber(String(sessions.length + 1));
    setTitle("");
    setSummary("");
    setScheduledAt("");
    setStatus("planned");
    setShowForm(false);
  }

  function handleStartEdit(session: CampaignSession) {
    setEditingId(session.id);
    setSessionNumber(String(session.sessionNumber));
    setTitle(session.title);
    setSummary(session.summary || "");
    setScheduledAt(session.scheduledAt || "");
    setStatus(session.status);
    setShowForm(true);
  }

  function handleSubmit() {
    const num = parseInt(sessionNumber, 10) || (sessions.length + 1);
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const payload: CampaignSessionInput = {
      sessionNumber: num,
      title: trimmedTitle,
      summary: summary.trim(),
      scheduledAt: scheduledAt.trim() || null,
      status,
    };

    if (editingId && onUpdateSession) {
      onUpdateSession(editingId, payload);
    } else if (onCreateSession) {
      onCreateSession(payload);
    }
    resetForm();
  }

  function getStatusColor(st: SessionStatus) {
    if (st === "completed") return "#4caf50";
    if (st === "active") return colors.primary;
    return colors.textSecondary;
  }

  return (
    <View style={styles.container}>
      {/* Cabeçalho da Seção */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <MaterialCommunityIcons name="calendar-clock" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Linha do Tempo de Sessões</Text>
          <View style={[styles.countBadge, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <Text style={[styles.countText, { color: colors.textSecondary }]}>{sessions.length}</Text>
          </View>
        </View>

        {isGm && !showForm && (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => {
              setSessionNumber(String(sessions.length + 1));
              setShowForm(true);
            }}
            style={[styles.addButton, { backgroundColor: colors.primary }, webPointer]}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.addButtonText}>Nova Sessão</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Formulário do Mestre (Criar / Editar) */}
      {isGm && showForm && (
        <View style={[styles.formCard, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Text style={[styles.formTitle, { color: colors.text }]}>
            {editingId ? "Editar Sessão" : "Registrar Nova Sessão"}
          </Text>

          <View style={styles.formRow}>
            <View style={{ width: 90 }}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Número</Text>
              <TextInput
                value={sessionNumber}
                onChangeText={setSessionNumber}
                keyboardType="numeric"
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Título da Sessão</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Ex: O Despertar na Taverna"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Data / Agendamento</Text>
              <TextInput
                value={scheduledAt}
                onChangeText={setScheduledAt}
                placeholder="Ex: 15/10/2026 às 19:30"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              />
            </View>

            <View style={{ width: 140 }}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Status</Text>
              <View style={styles.statusButtonsRow}>
                {(["planned", "active", "completed"] as SessionStatus[]).map((st) => (
                  <TouchableOpacity
                    key={st}
                    onPress={() => setStatus(st)}
                    style={[
                      styles.statusSelectPill,
                      {
                        backgroundColor: status === st ? getStatusColor(st) : colors.surface,
                        borderColor: colors.border,
                      },
                      webPointer,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusSelectText,
                        { color: status === st ? "#fff" : colors.textSecondary },
                      ]}
                    >
                      {st === "planned" ? "Plan" : st === "active" ? "Ativ" : "Conc"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Resumo dos Acontecimentos / XP
          </Text>
          <TextInput
            value={summary}
            onChangeText={setSummary}
            placeholder="Anotações do que aconteceu na sessão, eventos principais, recompensas..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            style={[
              styles.input,
              styles.textArea,
              { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
            ]}
          />

          <View style={styles.formActions}>
            <TouchableOpacity
              onPress={resetForm}
              style={[styles.secondaryButton, { borderColor: colors.border }, webPointer]}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={busy || !title.trim()}
              onPress={handleSubmit}
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary, opacity: busy || !title.trim() ? 0.5 : 1 },
                webPointer,
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {editingId ? "Salvar Alterações" : "Criar Sessão"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Lista de Sessões */}
      {sessions.length === 0 ? (
        <View style={[styles.emptyContainer, { borderColor: colors.border }]}>
          <MaterialCommunityIcons name="book-clock-outline" size={36} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Nenhuma sessão registrada nesta campanha ainda.
          </Text>
        </View>
      ) : (
        <View style={styles.sessionList}>
          {sessions.map((sess) => {
            const stColor = getStatusColor(sess.status);
            return (
              <View
                key={sess.id}
                style={[
                  styles.sessionCard,
                  { backgroundColor: colors.inputBg, borderColor: colors.border },
                ]}
              >
                <View style={styles.sessionHeaderRow}>
                  <View style={styles.sessionTitleGroup}>
                    <View style={[styles.sessionBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.sessionBadgeText}>#{sess.sessionNumber}</Text>
                    </View>
                    <View>
                      <Text style={[styles.sessionItemTitle, { color: colors.text }]}>{sess.title}</Text>
                      {sess.scheduledAt && (
                        <Text style={[styles.sessionDate, { color: colors.textSecondary }]}>
                          📅 {sess.scheduledAt}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.sessionRight}>
                    <View style={[styles.statusPill, { backgroundColor: `${stColor}20`, borderColor: stColor }]}>
                      <Text style={[styles.statusPillText, { color: stColor }]}>
                        {STATUS_LABELS[sess.status]}
                      </Text>
                    </View>

                    {isGm && (
                      <View style={styles.actionIcons}>
                        <TouchableOpacity
                          accessibilityLabel="Editar sessão"
                          onPress={() => handleStartEdit(sess)}
                          style={[styles.iconBtn, webPointer]}
                        >
                          <Ionicons name="pencil-outline" size={16} color={colors.primary} />
                        </TouchableOpacity>

                        {onDeleteSession && (
                          <TouchableOpacity
                            accessibilityLabel="Excluir sessão"
                            onPress={() => onDeleteSession(sess.id)}
                            style={[styles.iconBtn, webPointer]}
                          >
                            <Ionicons name="trash-outline" size={16} color={colors.error} />
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                </View>

                {sess.summary ? (
                  <Text style={[styles.sessionSummary, { color: colors.textSecondary }]}>
                    {sess.summary}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  formCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 12,
  },
  formRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  statusButtonsRow: {
    flexDirection: "row",
    gap: 4,
  },
  statusSelectPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
  },
  statusSelectText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 12,
  },
  secondaryButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  primaryButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
  },
  emptyContainer: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 13,
    marginTop: 8,
  },
  sessionList: {
    gap: 10,
  },
  sessionCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  sessionHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  sessionTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  sessionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sessionBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  sessionItemTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },
  sessionDate: {
    fontSize: 11,
    marginTop: 2,
  },
  sessionRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "600",
  },
  actionIcons: {
    flexDirection: "row",
    gap: 4,
  },
  iconBtn: {
    padding: 4,
  },
  sessionSummary: {
    fontSize: 12,
    marginTop: 8,
    lineHeight: 18,
  },
});
