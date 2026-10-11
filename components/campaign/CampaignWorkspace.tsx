import { ThemeColors } from "@/constants/theme";
import { CampaignDetails, CampaignInvite, CampaignSummary, JournalEntry, JournalEntryInput } from "@/services/campaignApi";
import { CampaignJournalEditor, CampaignJournalList } from "./CampaignJournal";
import React from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from "react-native";

interface CampaignWorkspaceProps {
  colors: ThemeColors;
  campaigns: CampaignSummary[];
  selected: CampaignDetails | null;
  invite: CampaignInvite | null;
  name: string;
  busy: boolean;
  entries: JournalEntry[];
  draft: JournalEntryInput;
  editingEntry: boolean;
  onNameChange: (name: string) => void;
  onCreate: () => void;
  onRefresh: () => void;
  onSelect: (id: string) => void;
  onInvite: () => void;
  onCopyInvite: () => void;
  onLogout: () => void;
  onStartCombat: () => void;
  onDraftChange: (draft: JournalEntryInput) => void;
  onSaveEntry: () => void;
  onEditEntry: (entry: JournalEntry) => void;
  onCancelEdit: () => void;
}

function ActionButton({ label, onPress, disabled, color }: {
  label: string; onPress: () => void; disabled?: boolean; color: string;
}) {
  return (
    <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={onPress}
      style={[styles.button, { backgroundColor: color, opacity: disabled ? 0.5 : 1 }]}>
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Painel responsivo para preparar a campanha em desktop ou no celular. */
export function CampaignWorkspace(props: CampaignWorkspaceProps) {
  const { colors, campaigns, selected, invite, busy } = props;
  const { width } = useWindowDimensions();
  const panel = [styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }];

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <View style={styles.heading}>
        <Text style={[styles.title, { color: colors.text }]}>Campanhas do mestre</Text>
        <ActionButton label="Sair" color={colors.error} disabled={busy} onPress={props.onLogout} />
      </View>
      <View style={width >= 900 ? styles.columns : styles.stack}>
        <View style={[panel, styles.sidebar]}>
          <Text style={[styles.subtitle, { color: colors.text }]}>Criar campanha</Text>
          <TextInput accessibilityLabel="Nome da campanha" value={props.name}
            onChangeText={props.onNameChange} placeholder="Nome da campanha"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { borderColor: colors.border, color: colors.text }]} />
          <ActionButton label="Criar" disabled={busy || !props.name.trim()}
            color={colors.primary} onPress={props.onCreate} />
          <View style={styles.heading}>
            <Text style={[styles.subtitle, { color: colors.text }]}>Minhas campanhas</Text>
            <ActionButton label="Atualizar" disabled={busy} color={colors.primary} onPress={props.onRefresh} />
          </View>
          {campaigns.length === 0 && <Text style={{ color: colors.textSecondary }}>
            Nenhuma campanha encontrada para este mestre.
          </Text>}
          {campaigns.map((campaign) => (
            <TouchableOpacity key={campaign.id} accessibilityRole="button" disabled={busy}
              onPress={() => props.onSelect(campaign.id)}
              style={[styles.campaign, { borderColor: colors.border }]}>
              <Text style={{ color: colors.text, fontWeight: "bold" }}>{campaign.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={[panel, styles.detail]}>
          {!selected ? <Text style={{ color: colors.textSecondary }}>
            Selecione uma campanha para ver membros e gerar convites.
          </Text> : <>
            <Text style={[styles.subtitle, { color: colors.text }]}>{selected.name}</Text>
            <Text style={{ color: colors.textSecondary, marginBottom: 12 }}>
              ID da campanha: {selected.id}
            </Text>
            <ActionButton label="Abrir combate da campanha" disabled={busy}
              color={colors.primary} onPress={props.onStartCombat} />
            <ActionButton label="Gerar convite (uso único, 24 horas)" disabled={busy}
              color={colors.primary} onPress={props.onInvite} />
            {invite && <View style={[styles.invite, { borderColor: colors.border }]}>
              <Text selectable style={{ color: colors.text }}>Código: {invite.code}</Text>
              <Text style={{ color: colors.textSecondary }}>Expira em: {invite.expiresAt}</Text>
              <ActionButton label="Copiar código" color={colors.primary} onPress={props.onCopyInvite} />
            </View>}
            <Text style={[styles.subtitle, { color: colors.text, marginTop: 20 }]}>Membros</Text>
            {selected.members.map((member) => <View key={member.id}
              style={[styles.member, { borderColor: colors.border }]}>
              <Text style={{ color: colors.text, fontWeight: "bold" }}>{member.name}</Text>
              <Text style={{ color: colors.textSecondary }}>
                {member.role === "gm" ? "Mestre" : "Jogador"}
                {member.characterId ? ` · Personagem: ${member.characterId}` : " · Sem personagem vinculado"}
              </Text>
            </View>)}
            <CampaignJournalEditor colors={colors} draft={props.draft} editing={props.editingEntry}
              busy={busy} onChange={props.onDraftChange} onSave={props.onSaveEntry}
              onCancel={props.onCancelEdit} />
            <CampaignJournalList colors={colors} entries={props.entries} onEdit={props.onEditEntry} />
          </>}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: 1200, alignSelf: "center", padding: 16, gap: 16 },
  heading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: "bold", flexShrink: 1 },
  subtitle: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  columns: { flexDirection: "row", gap: 16, alignItems: "flex-start" },
  stack: { gap: 16 },
  panel: { padding: 18, borderRadius: 12, borderWidth: 1 },
  sidebar: { flex: 1 },
  detail: { flex: 2 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  button: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold" },
  campaign: { borderWidth: 1, borderRadius: 8, padding: 14, marginTop: 8 },
  invite: { borderWidth: 1, borderRadius: 8, padding: 12, marginTop: 12, gap: 8 },
  member: { borderBottomWidth: 1, paddingVertical: 10 },
});
