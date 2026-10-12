import { ThemeColors } from "@/constants/theme";
import { JournalEntry, JournalEntryInput } from "@/services/campaignApi";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface JournalListProps {
  colors: ThemeColors;
  entries: JournalEntry[];
  onEdit?: (entry: JournalEntry) => void;
}

const webPointer = Platform.OS === "web" ? ({ cursor: "pointer" } as const) : {};

/** Lista notas já filtradas pelo servidor de acordo com o papel do membro. */
export function CampaignJournalList({ colors, entries, onEdit }: JournalListProps) {
  return (
    <View style={styles.list}>
      <View style={styles.sectionHeader}>
        <Ionicons name="book-outline" size={20} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Diário da Campanha</Text>
        <View style={[styles.countBadge, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Text style={[styles.countText, { color: colors.textSecondary }]}>{entries.length}</Text>
        </View>
      </View>

      {entries.length === 0 && (
        <View style={[styles.emptyContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Ionicons name="document-text-outline" size={32} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Nenhuma anotação registrada ainda.
          </Text>
        </View>
      )}

      {entries.map((entry) => {
        const isGmOnly = entry.visibility === "gm";
        return (
          <View
            key={entry.id}
            style={[
              styles.entry,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.entryHeader}>
              <Text style={[styles.entryTitle, { color: colors.text }]}>{entry.title}</Text>
              <View
                style={[
                  styles.visibilityBadge,
                  {
                    backgroundColor: isGmOnly
                      ? "rgba(229, 57, 53, 0.12)"
                      : "rgba(30, 136, 229, 0.12)",
                  },
                ]}
              >
                <Ionicons
                  name={isGmOnly ? "lock-closed-outline" : "people-outline"}
                  size={12}
                  color={isGmOnly ? colors.error : colors.info || colors.primary}
                />
                <Text
                  style={[
                    styles.visibilityText,
                    { color: isGmOnly ? colors.error : colors.info || colors.primary },
                  ]}
                >
                  {isGmOnly ? "Privada (Mestre)" : "Grupo"}
                </Text>
              </View>
            </View>

            <Text style={[styles.entryBody, { color: colors.text }]}>{entry.body}</Text>

            {onEdit && (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => onEdit(entry)}
                style={[styles.editButton, webPointer]}
              >
                <Ionicons name="pencil-outline" size={14} color={colors.primary} />
                <Text style={[styles.editText, { color: colors.primary }]}>Editar nota</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </View>
  );
}

interface JournalEditorProps {
  colors: ThemeColors;
  draft: JournalEntryInput;
  editing: boolean;
  busy: boolean;
  onChange: (draft: JournalEntryInput) => void;
  onSave: () => void;
  onCancel: () => void;
}

/** Novas notas são privadas por padrão para evitar divulgação acidental. */
export function CampaignJournalEditor(props: JournalEditorProps) {
  const { colors, draft, busy } = props;
  const inputStyle = [
    styles.input,
    {
      borderColor: colors.border,
      color: colors.text,
      backgroundColor: colors.inputBg,
    },
  ];

  const canSave = !busy && draft.title.trim().length > 0 && draft.body.trim().length > 0;

  return (
    <View style={[styles.editorCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.sectionHeader}>
        <Ionicons name={props.editing ? "pencil" : "add-circle-outline"} size={20} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {props.editing ? "Editar Anotação" : "Nova Anotação no Diário"}
        </Text>
      </View>

      <TextInput
        accessibilityLabel="Título da nota"
        value={draft.title}
        onChangeText={(title) => props.onChange({ ...draft, title })}
        placeholder="Título da anotação..."
        placeholderTextColor={colors.textSecondary}
        style={inputStyle}
      />

      <TextInput
        accessibilityLabel="Conteúdo da nota"
        value={draft.body}
        multiline
        onChangeText={(body) => props.onChange({ ...draft, body })}
        placeholder="Descreva eventos, pistas, PNJs ou acontecimentos da sessão..."
        placeholderTextColor={colors.textSecondary}
        style={[inputStyle, styles.bodyInput]}
      />

      {/* Seletor de Visibilidade */}
      <View style={styles.visibilityRow}>
        <Text style={[styles.visibilityLabel, { color: colors.textSecondary }]}>Visibilidade:</Text>
        <View style={styles.visibilityGroup}>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => props.onChange({ ...draft, visibility: "gm" })}
            style={[
              styles.choice,
              {
                borderColor: draft.visibility === "gm" ? colors.primary : colors.border,
                backgroundColor: draft.visibility === "gm" ? colors.primary : colors.inputBg,
              },
              webPointer,
            ]}
          >
            <Ionicons
              name="lock-closed"
              size={14}
              color={draft.visibility === "gm" ? "#fff" : colors.textSecondary}
            />
            <Text
              style={[
                styles.choiceText,
                { color: draft.visibility === "gm" ? "#fff" : colors.text },
              ]}
            >
              Só Mestre
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => props.onChange({ ...draft, visibility: "party" })}
            style={[
              styles.choice,
              {
                borderColor: draft.visibility === "party" ? colors.primary : colors.border,
                backgroundColor: draft.visibility === "party" ? colors.primary : colors.inputBg,
              },
              webPointer,
            ]}
          >
            <Ionicons
              name="people"
              size={14}
              color={draft.visibility === "party" ? "#fff" : colors.textSecondary}
            />
            <Text
              style={[
                styles.choiceText,
                { color: draft.visibility === "party" ? "#fff" : colors.text },
              ]}
            >
              Compartilhar com Grupo
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Botões de Ação */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          accessibilityRole="button"
          disabled={!canSave}
          onPress={props.onSave}
          style={[
            styles.saveButton,
            {
              backgroundColor: colors.primary,
              opacity: canSave ? 1 : 0.5,
            },
            webPointer,
          ]}
        >
          <Ionicons name="checkmark-outline" size={18} color="#fff" />
          <Text style={styles.saveText}>{props.editing ? "Salvar Alterações" : "Criar Anotação"}</Text>
        </TouchableOpacity>

        {props.editing && (
          <TouchableOpacity
            accessibilityRole="button"
            disabled={busy}
            onPress={props.onCancel}
            style={[
              styles.cancelButton,
              { borderColor: colors.border },
              webPointer,
            ]}
          >
            <Ionicons name="close-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  countBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyContainer: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
  },
  entry: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    ...Platform.select({
      web: {
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
      },
    }),
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    flexShrink: 1,
  },
  visibilityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  visibilityText: {
    fontSize: 11,
    fontWeight: "600",
  },
  entryBody: {
    fontSize: 14,
    lineHeight: 22,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  editText: {
    fontSize: 13,
    fontWeight: "bold",
  },
  editorCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    gap: 12,
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  bodyInput: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  visibilityRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  visibilityLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  visibilityGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  choice: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  choiceText: {
    fontSize: 13,
    fontWeight: "500",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  saveButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  saveText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  cancelButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
