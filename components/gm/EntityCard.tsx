import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useTheme } from "@/context/ThemeContext";

interface EntityCardProps {
  entity: any;
  type: "npc" | "monster" | "item" | "location";
  onPress: () => void;
  actionIcon?: "add" | "remove" | "chevron-forward";
  onAction?: () => void;
  showCampaignBadge?: boolean;
  onCombatAction?: () => void;
  isRevealed?: boolean;
  onToggleReveal?: () => void;
}

export function EntityCard({ entity, type, onPress, actionIcon = "chevron-forward", onAction, showCampaignBadge = false, onCombatAction, isRevealed, onToggleReveal }: EntityCardProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const getIcon = () => {
    switch (type) {
      case "npc": return "account";
      case "monster": return "skull";
      case "item": return "sword";
      case "location": return "map-marker";
      default: return "help";
    }
  };

  const getSubtitle = () => {
    switch (type) {
      case "npc": return entity.role;
      case "monster": return `${entity.type} (CR: ${entity.cr})`;
      case "item": return `${entity.type} • ${entity.rarity}`;
      case "location": return entity.type;
      default: return "";
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.iconContainer}>
        {entity.image ? (
          <Image source={{ uri: entity.image }} style={styles.image} contentFit="cover" />
        ) : (
          <MaterialCommunityIcons name={getIcon() as any} size={28} color={colors.primary} />
        )}
      </View>
      
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{entity.name}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{getSubtitle()}</Text>
        
        {showCampaignBadge && entity.linkedCampaignIds && entity.linkedCampaignIds.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Em {entity.linkedCampaignIds.length} camp.</Text>
          </View>
        )}
      </View>

      {onAction || onCombatAction || onToggleReveal ? (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {onToggleReveal && (
            <TouchableOpacity style={[styles.actionBtn, { marginRight: 4 }]} onPress={onToggleReveal}>
              <Ionicons 
                name={isRevealed ? "eye" : "lock-closed"} 
                size={22} 
                color={isRevealed ? colors.primary : colors.textSecondary} 
              />
            </TouchableOpacity>
          )}
          {onCombatAction && (type === "npc" || type === "monster") && (
            <TouchableOpacity style={styles.actionBtn} onPress={onCombatAction}>
              <MaterialCommunityIcons name="sword-cross" size={22} color={"#c62828"} />
            </TouchableOpacity>
          )}
          {onAction && (
            <TouchableOpacity style={styles.actionBtn} onPress={onAction}>
              <Ionicons name={actionIcon as any} size={24} color={actionIcon === "remove" ? "#f44336" : colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <Ionicons name={actionIcon as any} size={20} color={colors.textSecondary} />
      )}
    </TouchableOpacity>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  badge: {
    backgroundColor: colors.inputBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: "bold",
  },
  actionBtn: {
    padding: 8,
  },
});
