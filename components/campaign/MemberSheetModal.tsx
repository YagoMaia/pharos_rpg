import { ThemeColors } from "@/constants/theme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";

interface MemberSheetModalProps {
  visible: boolean;
  memberName: string;
  sheet: any | null;
  colors: ThemeColors;
  onClose: () => void;
}

const webPointer = Platform.OS === "web" ? ({ cursor: "pointer" } as const) : {};

export function MemberSheetModal({
  visible,
  memberName,
  sheet,
  colors,
  onClose,
}: MemberSheetModalProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  if (!visible) return null;

  const characterName = sheet?.name || memberName;
  const charClass = sheet?.class || "Sem classe";
  const level = sheet?.level || 1;
  const ancestry = sheet?.ancestry?.name || sheet?.race || "Humano";
  const hp = sheet?.stats?.hp || { current: 10, max: 10 };
  const focus = sheet?.stats?.focus || { current: 0, max: 0 };
  const attributes = sheet?.attributes || {};
  const equipment = sheet?.equipment || {};
  const silver = sheet?.silver ?? 0;

  const attrList: { key: string; label: string }[] = [
    { key: "Força", label: "FOR" },
    { key: "Destreza", label: "DES" },
    { key: "Constituição", label: "CON" },
    { key: "Inteligência", label: "INT" },
    { key: "Sabedoria", label: "SAB" },
    { key: "Carisma", label: "CAR" },
  ];

  const hpPercent = Math.max(0, Math.min(100, Math.round((hp.current / Math.max(1, hp.max)) * 100)));
  const focusPercent = focus.max > 0
    ? Math.max(0, Math.min(100, Math.round((focus.current / focus.max) * 100)))
    : 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              width: isDesktop ? 680 : "92%",
              maxHeight: "90%",
            },
          ]}
        >
          {/* Header do Modal */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>{characterName.slice(0, 2).toUpperCase()}</Text>
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>{characterName}</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Jogador: {memberName} • Nível {level} {charClass}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.inputBg }, webPointer]}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {!sheet ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="file-question-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Nenhum dado completo da ficha foi sincronizado ainda por este jogador.
                </Text>
              </View>
            ) : (
              <>
                {/* Badges Principais */}
                <View style={styles.badgeRow}>
                  <View style={[styles.badge, { backgroundColor: "rgba(187, 134, 252, 0.15)" }]}>
                    <Text style={[styles.badgeText, { color: colors.primary }]}>Classe: {charClass}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: "rgba(3, 218, 198, 0.15)" }]}>
                    <Text style={[styles.badgeText, { color: colors.secondary || colors.info }]}>Ancestralidade: {ancestry}</Text>
                  </View>
                  {sheet.specialization?.name && (
                    <View style={[styles.badge, { backgroundColor: "rgba(255, 179, 0, 0.15)" }]}>
                      <Text style={[styles.badgeText, { color: "#ffb300" }]}>
                        Espec: {sheet.specialization.name}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Seção de HP e Foco/Mana */}
                <View style={styles.statsRow}>
                  {/* Card HP */}
                  <View style={[styles.statCard, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                    <View style={styles.statHeader}>
                      <Ionicons name="heart" size={16} color={colors.error} />
                      <Text style={[styles.statLabel, { color: colors.text }]}>Vida (HP)</Text>
                      <Text style={[styles.statValue, { color: colors.text }]}>
                        {hp.current} / {hp.max}
                      </Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${hpPercent}%`,
                            backgroundColor: hpPercent > 25 ? colors.error : "#ff3333",
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Card Foco */}
                  <View style={[styles.statCard, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                    <View style={styles.statHeader}>
                      <Ionicons name="flash" size={16} color={colors.primary} />
                      <Text style={[styles.statLabel, { color: colors.text }]}>Foco / Mana</Text>
                      <Text style={[styles.statValue, { color: colors.text }]}>
                        {focus.current} / {focus.max}
                      </Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${focusPercent}%`,
                            backgroundColor: colors.primary,
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>

                {/* Grid de Atributos */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Atributos</Text>
                <View style={styles.attributeGrid}>
                  {attrList.map((attr) => {
                    const data = attributes[attr.key] || { value: 10, modifier: 0 };
                    const modStr = data.modifier >= 0 ? `+${data.modifier}` : `${data.modifier}`;
                    return (
                      <View
                        key={attr.key}
                        style={[styles.attrCard, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                      >
                        <Text style={[styles.attrLabel, { color: colors.textSecondary }]}>{attr.label}</Text>
                        <Text style={[styles.attrValue, { color: colors.text }]}>{data.value}</Text>
                        <View style={[styles.modPill, { backgroundColor: colors.primary }]}>
                          <Text style={styles.modText}>{modStr}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* Equipamentos Principais */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Equipamento Equipado</Text>
                <View style={styles.equipmentGrid}>
                  <View style={[styles.equipCard, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                    <Text style={[styles.equipLabel, { color: colors.textSecondary }]}>Arma Corpo a Corpo</Text>
                    <Text style={[styles.equipName, { color: colors.text }]}>
                      {equipment.meleeWeapon?.name || "Nenhuma"}
                    </Text>
                    {equipment.meleeWeapon?.damage && (
                      <Text style={[styles.equipDetail, { color: colors.primary }]}>
                        Dano: {equipment.meleeWeapon.damage}
                      </Text>
                    )}
                  </View>

                  <View style={[styles.equipCard, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                    <Text style={[styles.equipLabel, { color: colors.textSecondary }]}>Armadura / Proteção</Text>
                    <Text style={[styles.equipName, { color: colors.text }]}>
                      {equipment.armor?.name || "Sem armadura"}
                    </Text>
                    {equipment.armor?.acBonus !== undefined && (
                      <Text style={[styles.equipDetail, { color: colors.secondary || colors.info }]}>
                        CA: +{equipment.armor.acBonus}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Moedas e Recursos */}
                <View style={[styles.resourceRow, { borderColor: colors.border }]}>
                  <View style={styles.resourceItem}>
                    <MaterialCommunityIcons name="cash-multiple" size={18} color="#ffd700" />
                    <Text style={[styles.resourceText, { color: colors.text }]}>
                      Pratas: <Text style={{ fontWeight: "bold" }}>{silver}</Text>
                    </Text>
                  </View>
                  {sheet.stances && sheet.stances.length > 0 && (
                    <View style={styles.resourceItem}>
                      <MaterialCommunityIcons name="shield-sword" size={18} color={colors.primary} />
                      <Text style={[styles.resourceText, { color: colors.text }]}>
                        Postura Atual:{" "}
                        <Text style={{ fontWeight: "bold" }}>
                          {sheet.stances[sheet.currentStanceIndex]?.name || "Padrão"}
                        </Text>
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  container: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 16,
  },
  emptyState: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
    flex: 1,
  },
  statValue: {
    fontSize: 13,
    fontWeight: "bold",
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 4,
  },
  attributeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  attrCard: {
    flex: 1,
    minWidth: 70,
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
    alignItems: "center",
  },
  attrLabel: {
    fontSize: 11,
    fontWeight: "bold",
  },
  attrValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 2,
  },
  modPill: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  modText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  equipmentGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  equipCard: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  equipLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  equipName: {
    fontSize: 13,
    fontWeight: "600",
  },
  equipDetail: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  resourceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingTop: 12,
  },
  resourceItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  resourceText: {
    fontSize: 13,
  },
});
