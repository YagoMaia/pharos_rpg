// src/components/rpg/EquipSlot.tsx
import { useTheme } from "@/context/ThemeContext";
import { EquipmentItem } from "@/types/rpg";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AvatarPortrait } from "../ui/AvatarPortrait";

interface EquipSlotProps {
  label: string;
  item: EquipmentItem;
  icon: keyof typeof Ionicons.glyphMap;
  type: "weapon" | "defense";
  onPress: () => void;
}

export const EquipSlot = ({
  label,
  item,
  icon,
  type,
  onPress,
}: EquipSlotProps) => {
  const { colors, isDark } = useTheme();
  const isEmpty = !item.name || item.name === "Vazio";
  const styles = useMemo(() => getStyles(colors, isDark, isEmpty), [colors, isDark, isEmpty]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Ionicons name={icon} size={12} color={isEmpty ? colors.textSecondary : colors.primary} />
        <Text style={styles.label}>{label}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.imageWrapper}>
          {item.image ? (
            <AvatarPortrait imageUrl={item.image} size={44} />
          ) : (
            <View style={styles.iconPlaceholder}>
              <MaterialCommunityIcons
                name={type === "weapon" ? "sword" : "shield-outline"}
                size={24}
                color={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}
              />
            </View>
          )}
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.itemName} numberOfLines={1}>
            {isEmpty ? "Vazio" : item.name}
          </Text>
          {!isEmpty && (
            <View style={styles.statBadge}>
              <Text style={styles.itemStats}>
                {type === "weapon" ? item.stats : `DEF +${item.defense}`}
              </Text>
            </View>
          )}
        </View>
      </View>
      
      {!isEmpty && (
        <View style={styles.cornerIndicator} />
      )}
    </TouchableOpacity>
  );
};

const getStyles = (colors: any, isDark: boolean, isEmpty: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isEmpty ? colors.inputBg : colors.surface,
    borderWidth: 1,
    borderColor: isEmpty ? colors.border : colors.primary + "40",
    borderRadius: 16,
    padding: 12,
    elevation: isEmpty ? 0 : 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isEmpty ? 0 : 0.1,
    shadowRadius: 4,
    position: "relative",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  label: { 
    fontSize: 9, 
    fontWeight: "900", 
    textTransform: "uppercase",
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  content: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 12 
  },
  imageWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: isDark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.5)",
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  iconPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: { 
    flex: 1,
    gap: 4,
  },
  itemName: { 
    fontSize: 14, 
    fontWeight: "bold",
    color: isEmpty ? colors.textSecondary : colors.text,
  },
  statBadge: {
    backgroundColor: colors.primary + "15",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  itemStats: { 
    fontSize: 10, 
    fontWeight: "900", 
    color: colors.primary,
  },
  cornerIndicator: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderRightWidth: 12,
    borderTopWidth: 12,
    borderRightColor: colors.primary,
    borderTopColor: "transparent",
    transform: [{ rotate: "90deg" }],
    opacity: 0.8,
  }
});
