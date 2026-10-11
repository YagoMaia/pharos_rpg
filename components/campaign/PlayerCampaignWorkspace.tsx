import { ThemeColors } from "@/constants/theme";
import { CampaignSummary, JournalEntry } from "@/services/campaignApi";
import { CampaignJournalList } from "./CampaignJournal";
import React from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface PlayerCampaignWorkspaceProps {
  colors: ThemeColors;
  campaigns: CampaignSummary[];
  entries: JournalEntry[];
  selected: CampaignSummary | null;
  inviteCode: string;
  characterName: string;
  characterId?: string;
  busy: boolean;
  onInviteChange: (code: string) => void;
  onJoin: () => void;
  onLink: () => void;
  onRefresh: () => void;
  onSelect: (campaign: CampaignSummary) => void;
  onLogout: () => void;
  onStartCombat: () => void;
}

function CampaignButton({ label, onPress, disabled, color }: {
  label: string; onPress: () => void; disabled?: boolean; color: string;
}) {
  return (
    <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={onPress}
      style={[styles.button, { backgroundColor: color, opacity: disabled ? 0.5 : 1 }]}>
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Entrada e vínculo explícito: uma falha no vínculo não exige novo convite. */
export function PlayerCampaignWorkspace(props: PlayerCampaignWorkspaceProps) {
  const { colors, campaigns, selected, busy } = props;
  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Minhas campanhas</Text>
        <CampaignButton label="Sair" disabled={busy} color={colors.error} onPress={props.onLogout} />
      </View>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.subtitle, { color: colors.text }]}>Entrar com convite</Text>
        <TextInput accessibilityLabel="Código do convite" value={props.inviteCode}
          onChangeText={props.onInviteChange} autoCapitalize="none" autoCorrect={false}
          placeholder="Código enviado pelo mestre" placeholderTextColor={colors.textSecondary}
          style={[styles.input, { color: colors.text, borderColor: colors.border }]} />
        <CampaignButton label="Entrar na campanha" disabled={busy || !props.inviteCode.trim()}
          color={colors.primary} onPress={props.onJoin} />
      </View>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.header}>
          <Text style={[styles.subtitle, { color: colors.text }]}>Campanhas</Text>
          <CampaignButton label="Atualizar" disabled={busy} color={colors.primary} onPress={props.onRefresh} />
        </View>
        {campaigns.length === 0 && <Text style={{ color: colors.textSecondary }}>
          Você ainda não participa de nenhuma campanha como jogador.
        </Text>}
        {campaigns.map((campaign) => <TouchableOpacity key={campaign.id}
          accessibilityRole="button" disabled={busy} onPress={() => props.onSelect(campaign)}
          style={[styles.row, { borderColor: colors.border }]}>
          <Text style={{ color: colors.text, fontWeight: "bold" }}>{campaign.name}</Text>
          <Text style={{ color: colors.textSecondary }}>
            {campaign.characterId ? "Ficha vinculada" : "Toque para vincular sua ficha"}
          </Text>
        </TouchableOpacity>)}
      </View>
      {selected && <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.subtitle, { color: colors.text }]}>{selected.name}</Text>
        <Text style={{ color: colors.text, marginBottom: 10 }}>
          Personagem local: {props.characterName}
        </Text>
        <Text style={{ color: colors.textSecondary, marginBottom: 12 }}>
          {selected.characterId === props.characterId && props.characterId
            ? "Esta ficha já está vinculada à campanha."
            : selected.characterId ? "Outra ficha está vinculada. Troca de ficha ainda não disponível."
              : "Vincule a ficha deste dispositivo à campanha."}
        </Text>
        {selected.characterId !== props.characterId && <CampaignButton label="Vincular minha ficha"
          disabled={busy || !props.characterId || !!selected.characterId}
          color={colors.primary} onPress={props.onLink} />}
        {selected.characterId === props.characterId && props.characterId &&
          <CampaignButton label="Rolar iniciativa e abrir combate" disabled={busy}
            color={colors.primary} onPress={props.onStartCombat} />}
        <CampaignJournalList colors={colors} entries={props.entries} />
      </View>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: 720, alignSelf: "center", padding: 16, gap: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  title: { fontSize: 24, fontWeight: "bold", flexShrink: 1 },
  subtitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  card: { borderRadius: 12, borderWidth: 1, padding: 18 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 12 },
  button: { borderRadius: 8, padding: 11, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold" },
  row: { paddingVertical: 12, borderBottomWidth: 1 },
});
