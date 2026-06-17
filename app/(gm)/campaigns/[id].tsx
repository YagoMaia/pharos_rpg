import React, { useState } from "react";
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, FlatList, TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useGMContext } from "@/context/GMContext";
import { useTheme } from "@/context/ThemeContext";
import { EntityCard } from "@/components/gm/EntityCard";
import { LibraryPickerModal } from "@/components/gm/LibraryPickerModal";
import { EntityType } from "@/types/campaign";

type Tab = "overview" | "npc" | "monster" | "item" | "location" | "notes";

export default function CampaignDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const { getCampaignById, updateCampaign, unlinkEntityFromCampaign, npcs, monsters, items, locations } = useGMContext();
  const campaign = getCampaignById(id);

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [pickerType, setPickerType] = useState<EntityType | null>(null);

  if (!campaign) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text }}>Campanha não encontrada.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.primary }}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderTabBtn = (tab: Tab, label: string) => (
    <TouchableOpacity
      style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderOverview = () => (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Informações</Text>
        <Text style={styles.infoRow}><Text style={styles.infoLabel}>Sistema:</Text> {campaign.system}</Text>
        <Text style={styles.infoRow}><Text style={styles.infoLabel}>Visibilidade:</Text> {campaign.visibility === "open" ? "Aberta" : "Privada"}</Text>
        <Text style={styles.infoRow}><Text style={styles.infoLabel}>Máx. Jogadores:</Text> {campaign.maxPlayers}</Text>
        <Text style={styles.infoRow}><Text style={styles.infoLabel}>Status:</Text> {campaign.status}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Código de Acesso</Text>
        <View style={styles.codeBox}>
          <Text style={styles.codeText}>{campaign.accessCode}</Text>
          {/* Note: expo-clipboard would be used here in a real app */}
          <Ionicons name="copy-outline" size={20} color={colors.primary} />
        </View>
        <Text style={styles.codeHint}>Compartilhe este código com os jogadores para que eles possam entrar na campanha.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Descrição</Text>
        <Text style={styles.descriptionText}>
          {campaign.description || "Nenhuma descrição fornecida."}
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Jogadores ({campaign.playerIds.length}/{campaign.maxPlayers})</Text>
        </View>
        {campaign.playerIds.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum jogador entrou ainda.</Text>
        ) : (
          <Text style={styles.emptyText}>Jogadores aparecerão aqui.</Text>
        )}
      </View>
    </ScrollView>
  );

  const renderEntityList = (type: EntityType) => {
    let linkedIds: string[] = [];
    let sourceData: any[] = [];
    
    switch (type) {
      case "npc": linkedIds = campaign.linkedNpcIds; sourceData = npcs; break;
      case "monster": linkedIds = campaign.linkedMonsterIds; sourceData = monsters; break;
      case "item": linkedIds = campaign.linkedItemIds; sourceData = items; break;
      case "location": linkedIds = campaign.linkedLocationIds; sourceData = locations; break;
    }

    const linkedEntities = sourceData.filter(e => linkedIds.includes(e.id));

    return (
      <View style={styles.tabContentFlex}>
        <FlatList
          data={linkedEntities}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Nenhum item adicionado.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <EntityCard
              entity={item}
              type={type}
              onPress={() => {}}
              actionIcon="remove"
              onAction={() => unlinkEntityFromCampaign(campaign.id, type, item.id)}
            />
          )}
        />
        <TouchableOpacity style={styles.addBtn} onPress={() => setPickerType(type)}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Adicionar da Biblioteca</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderNotes = () => (
    <View style={styles.tabContentFlex}>
      <TextInput
        style={styles.notesInput}
        multiline
        placeholder="Anotações do mestre..."
        placeholderTextColor={colors.textSecondary}
        value={campaign.notes}
        onChangeText={(text) => updateCampaign(campaign.id, { notes: text })}
        textAlignVertical="top"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{campaign.name}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push(`/(gm)/campaigns/new?edit=${campaign.id}`)} style={styles.headerBtn}>
          <Ionicons name="pencil" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsContent}>
          {renderTabBtn("overview", "Visão Geral")}
          {renderTabBtn("npc", "NPCs")}
          {renderTabBtn("monster", "Monstros")}
          {renderTabBtn("item", "Itens")}
          {renderTabBtn("location", "Locais")}
          {renderTabBtn("notes", "Notas")}
        </ScrollView>
      </View>

      {activeTab === "overview" && renderOverview()}
      {activeTab === "npc" && renderEntityList("npc")}
      {activeTab === "monster" && renderEntityList("monster")}
      {activeTab === "item" && renderEntityList("item")}
      {activeTab === "location" && renderEntityList("location")}
      {activeTab === "notes" && renderNotes()}

      {pickerType && (
        <LibraryPickerModal
          visible={true}
          campaignId={campaign.id}
          entityType={pickerType}
          onClose={() => setPickerType(null)}
        />
      )}
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  tabsScroll: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.inputBg,
  },
  tabBtnActive: {
    backgroundColor: "#c62828",
  },
  tabText: {
    color: colors.textSecondary,
    fontWeight: "bold",
  },
  tabTextActive: {
    color: "#fff",
  },
  tabContent: {
    padding: 16,
    gap: 16,
  },
  tabContentFlex: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 12,
  },
  infoRow: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 6,
  },
  infoLabel: {
    fontWeight: "bold",
    color: colors.textSecondary,
  },
  codeBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.inputBg,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  codeText: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    letterSpacing: 2,
  },
  codeHint: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  descriptionText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
  emptyState: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  addBtn: {
    flexDirection: "row",
    backgroundColor: "#c62828",
    padding: 14,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  notesInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    color: colors.text,
    fontSize: 16,
  },
});
