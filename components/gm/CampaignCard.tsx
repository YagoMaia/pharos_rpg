import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { Campaign, CampaignStatus } from "@/types/campaign";
import { useTheme } from "@/context/ThemeContext";

interface CampaignCardProps {
  campaign: Campaign;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onStatusChange?: (status: CampaignStatus) => void;
}

export function CampaignCard({
  campaign,
  onPress,
  onEdit,
  onDelete,
  onDuplicate,
  onStatusChange,
}: CampaignCardProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const getStatusColor = () => {
    switch (campaign.status) {
      case "active": return "#4caf50";
      case "paused": return "#ff9800";
      case "finished": return "#9e9e9e";
      default: return colors.textSecondary;
    }
  };

  const statusLabel = {
    active: "Ativa",
    paused: "Pausada",
    finished: "Encerrada",
  }[campaign.status];

  const confirmDelete = () => {
    Alert.alert(
      "Excluir Campanha",
      `Tem certeza que deseja excluir "${campaign.name}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: onDelete },
      ]
    );
  };

  const confirmStatusChange = (newStatus: CampaignStatus) => {
    const labels: Record<CampaignStatus, string> = {
      active: "reativar",
      paused: "pausar",
      finished: "encerrar",
    };
    Alert.alert(
      "Alterar Status",
      `Deseja ${labels[newStatus]} a campanha "${campaign.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Confirmar", onPress: () => onStatusChange?.(newStatus) },
      ]
    );
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{campaign.name}</Text>
          <View style={[styles.badge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.badgeText}>{statusLabel}</Text>
          </View>
        </View>
        <Text style={styles.system}>{campaign.system} • Cód: {campaign.accessCode}</Text>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Ionicons name="people" size={16} color={colors.textSecondary} />
          <Text style={styles.statText}>{campaign.playerIds.length} Jogs</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="account" size={16} color={colors.textSecondary} />
          <Text style={styles.statText}>{campaign.linkedNpcIds.length} NPCs</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="map-marker" size={16} color={colors.textSecondary} />
          <Text style={styles.statText}>{campaign.linkedLocationIds.length} Locs</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {/* Quick status pills */}
        <View style={styles.statusActions}>
          {onStatusChange && campaign.status === "active" && (
            <TouchableOpacity
              style={[styles.statusBtn, { borderColor: "#ff9800" }]}
              onPress={() => confirmStatusChange("paused")}
            >
              <Ionicons name="pause" size={13} color="#ff9800" />
              <Text style={[styles.statusBtnText, { color: "#ff9800" }]}>Pausar</Text>
            </TouchableOpacity>
          )}
          {onStatusChange && campaign.status === "paused" && (
            <TouchableOpacity
              style={[styles.statusBtn, { borderColor: "#4caf50" }]}
              onPress={() => confirmStatusChange("active")}
            >
              <Ionicons name="play" size={13} color="#4caf50" />
              <Text style={[styles.statusBtnText, { color: "#4caf50" }]}>Retomar</Text>
            </TouchableOpacity>
          )}
          {onStatusChange && campaign.status !== "finished" && (
            <TouchableOpacity
              style={[styles.statusBtn, { borderColor: "#9e9e9e" }]}
              onPress={() => confirmStatusChange("finished")}
            >
              <Ionicons name="checkmark-done" size={13} color="#9e9e9e" />
              <Text style={[styles.statusBtnText, { color: "#9e9e9e" }]}>Encerrar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Icon actions */}
        <View style={styles.iconActions}>
          {onEdit && (
            <TouchableOpacity style={styles.actionBtn} onPress={onEdit}>
              <Ionicons name="pencil" size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
          {onDuplicate && (
            <TouchableOpacity style={styles.actionBtn} onPress={onDuplicate}>
              <Ionicons name="copy" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity style={styles.actionBtn} onPress={confirmDelete}>
              <Ionicons name="trash" size={18} color="#f44336" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
      overflow: "hidden",
    },
    header: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    titleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      flex: 1,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      marginLeft: 8,
    },
    badgeText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "bold",
      textTransform: "uppercase",
    },
    system: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    stats: {
      flexDirection: "row",
      padding: 12,
      backgroundColor: colors.inputBg,
      justifyContent: "space-around",
    },
    statItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    statText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    statusActions: {
      flexDirection: "row",
      gap: 8,
      flex: 1,
    },
    statusBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 16,
      borderWidth: 1,
    },
    statusBtnText: {
      fontSize: 12,
      fontWeight: "bold",
    },
    iconActions: {
      flexDirection: "row",
      gap: 4,
    },
    actionBtn: {
      padding: 8,
    },
  });
