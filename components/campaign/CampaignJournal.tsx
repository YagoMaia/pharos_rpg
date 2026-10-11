import { ThemeColors } from "@/constants/theme";
import { JournalEntry, JournalEntryInput } from "@/services/campaignApi";
import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface JournalListProps {
  colors: ThemeColors;
  entries: JournalEntry[];
  onEdit?: (entry: JournalEntry) => void;
}

/** Lista notas já filtradas pelo servidor de acordo com o papel do membro. */
export function CampaignJournalList({ colors, entries, onEdit }: JournalListProps) {
  return <View style={styles.list}>
    <Text style={[styles.title, { color: colors.text }]}>Diário da campanha</Text>
    {entries.length === 0 && <Text style={{ color: colors.textSecondary }}>Nenhuma nota publicada.</Text>}
    {entries.map((entry) => <View key={entry.id} style={[styles.entry, { borderColor: colors.border }]}>
      <Text style={[styles.entryTitle, { color: colors.text }]}>{entry.title}</Text>
      <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>
        {entry.visibility === "gm" ? "Privada do mestre" : "Visível aos jogadores"}
      </Text>
      <Text style={{ color: colors.text }}>{entry.body}</Text>
      {onEdit && <TouchableOpacity accessibilityRole="button" onPress={() => onEdit(entry)}>
        <Text style={[styles.edit, { color: colors.primary }]}>Editar nota</Text>
      </TouchableOpacity>}
    </View>)}
  </View>;
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
  const inputStyle = [styles.input, { borderColor: colors.border, color: colors.text }];
  return <View style={styles.editor}>
    <Text style={[styles.title, { color: colors.text }]}>
      {props.editing ? "Editar nota" : "Nova nota"}
    </Text>
    <TextInput accessibilityLabel="Título da nota" value={draft.title}
      onChangeText={(title) => props.onChange({ ...draft, title })}
      placeholder="Título" placeholderTextColor={colors.textSecondary} style={inputStyle} />
    <TextInput accessibilityLabel="Conteúdo da nota" value={draft.body} multiline
      onChangeText={(body) => props.onChange({ ...draft, body })}
      placeholder="O que aconteceu na sessão?" placeholderTextColor={colors.textSecondary}
      style={[inputStyle, styles.body]} />
    <View style={styles.visibility}>
      {(["gm", "party"] as const).map((visibility) =>
        <TouchableOpacity key={visibility} accessibilityRole="button"
          onPress={() => props.onChange({ ...draft, visibility })}
          style={[styles.choice, { borderColor: colors.border,
            backgroundColor: draft.visibility === visibility ? colors.primary : colors.surface }]}>
          <Text style={{ color: draft.visibility === visibility ? "#fff" : colors.text }}>
            {visibility === "gm" ? "Só mestre" : "Compartilhar com jogadores"}
          </Text>
        </TouchableOpacity>)}
    </View>
    <TouchableOpacity accessibilityRole="button" disabled={busy || !draft.title.trim() || !draft.body.trim()}
      onPress={props.onSave} style={[styles.save, { backgroundColor: colors.primary,
        opacity: busy || !draft.title.trim() || !draft.body.trim() ? 0.5 : 1 }]}>
      <Text style={styles.saveText}>{props.editing ? "Salvar alterações" : "Criar nota"}</Text>
    </TouchableOpacity>
    {props.editing && <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={props.onCancel}>
      <Text style={[styles.edit, { color: colors.primary }]}>Cancelar edição</Text>
    </TouchableOpacity>}
  </View>;
}

const styles = StyleSheet.create({
  list: { gap: 8, marginTop: 16 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  entry: { borderWidth: 1, borderRadius: 8, padding: 12 },
  entryTitle: { fontSize: 16, fontWeight: "bold" },
  edit: { marginTop: 10, fontWeight: "bold" },
  editor: { marginTop: 20, gap: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
  body: { minHeight: 100, textAlignVertical: "top" },
  visibility: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: { borderWidth: 1, borderRadius: 8, padding: 10 },
  save: { borderRadius: 8, alignItems: "center", padding: 12 },
  saveText: { color: "#fff", fontWeight: "bold" },
});
