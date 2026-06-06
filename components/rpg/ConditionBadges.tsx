import { useTheme } from "@/context/ThemeContext";
import { ActiveCondition, ConditionName } from "@/types/rpg";
import { CONDITION_CONFIG } from "@/utils/conditionConfig";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─────────────────────────────────────────────────
// Mini Badge (usado no SpectatorCard)
// ─────────────────────────────────────────────────

interface ConditionBadgeProps {
  conditionName: ConditionName;
  size?: "small" | "medium";
  durationTurns?: number | null;
}

export const ConditionBadge = ({
  conditionName,
  size = "small",
  durationTurns,
}: ConditionBadgeProps) => {
  const config = CONDITION_CONFIG[conditionName];
  if (!config) return null;

  const iconSize = size === "small" ? 12 : 16;
  const badgeSize = size === "small" ? 22 : 28;

  return (
    <View
      style={[
        badgeStyles.badge,
        {
          width: badgeSize,
          height: badgeSize,
          borderRadius: badgeSize / 2,
          backgroundColor: config.color + "25",
          borderColor: config.color + "60",
        },
      ]}
    >
      <MaterialCommunityIcons
        name={config.icon}
        size={iconSize}
        color={config.color}
      />
      {durationTurns !== undefined && durationTurns !== null && size === "medium" && (
        <View style={[badgeStyles.durationBubble, { backgroundColor: config.color }]}>
          <Text style={badgeStyles.durationText}>{durationTurns}</Text>
        </View>
      )}
    </View>
  );
};

const badgeStyles = StyleSheet.create({
  badge: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  durationBubble: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
  },
  durationText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "bold",
  },
});

// ─────────────────────────────────────────────────
// Barra de Condições (row de badges clicáveis)
// ─────────────────────────────────────────────────

interface ConditionBarProps {
  conditions: ActiveCondition[];
  size?: "small" | "medium";
}

export const ConditionBar = ({ conditions, size = "small" }: ConditionBarProps) => {
  const [detailCondition, setDetailCondition] = useState<ActiveCondition | null>(null);
  const { colors } = useTheme();

  if (!conditions || conditions.length === 0) return null;

  return (
    <>
      <View style={barStyles.container}>
        {conditions.map((cond) => (
          <TouchableOpacity
            key={cond.id}
            onPress={() => setDetailCondition(cond)}
            activeOpacity={0.7}
          >
            <ConditionBadge
              conditionName={cond.name}
              size={size}
              durationTurns={cond.durationTurns}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Tooltip / Detail Modal */}
      {detailCondition && (
        <ConditionDetailModal
          condition={detailCondition}
          visible={!!detailCondition}
          onClose={() => setDetailCondition(null)}
        />
      )}
    </>
  );
};

const barStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
});

// ─────────────────────────────────────────────────
// Modal de Detalhe (ao clicar numa condição)
// ─────────────────────────────────────────────────

interface ConditionDetailModalProps {
  condition: ActiveCondition;
  visible: boolean;
  onClose: () => void;
}

const ConditionDetailModal = ({
  condition,
  visible,
  onClose,
}: ConditionDetailModalProps) => {
  const { colors } = useTheme();
  const config = CONDITION_CONFIG[condition.name];
  const styles = useMemo(() => getDetailStyles(colors), [colors]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.card}>
          {/* Header */}
          <View
            style={[
              styles.header,
              { backgroundColor: config?.color + "15" },
            ]}
          >
            <MaterialCommunityIcons
              name={config?.icon || "help-circle"}
              size={28}
              color={config?.color || colors.text}
            />
            <Text style={styles.title}>{condition.name}</Text>
            {condition.durationTurns !== undefined && condition.durationTurns !== null && (
              <View
                style={[
                  styles.turnBadge,
                  { backgroundColor: config?.color + "30" },
                ]}
              >
                <Text
                  style={[styles.turnBadgeText, { color: config?.color }]}
                >
                  {condition.durationTurns} {condition.durationTurns === 1 ? "turno" : "turnos"}
                </Text>
              </View>
            )}
            {(condition.durationTurns === undefined || condition.durationTurns === null) && (
              <View
                style={[
                  styles.turnBadge,
                  { backgroundColor: colors.error + "20" },
                ]}
              >
                <Text style={[styles.turnBadgeText, { color: colors.error }]}>
                  Permanente
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.body}>
            <Text style={styles.descTitle}>Efeito Mecânico</Text>
            <Text style={styles.descText}>
              {condition.description || config?.description || "Sem descrição."}
            </Text>

            {/* Rules text from config */}
            {config?.description && condition.description !== config.description && (
              <>
                <Text style={[styles.descTitle, { marginTop: 12 }]}>
                  Regra Completa
                </Text>
                <Text style={styles.descText}>{config.description}</Text>
              </>
            )}
          </View>

          {/* Close */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={[styles.closeBtnText, { color: colors.primary }]}>
              Fechar
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const getDetailStyles = (colors: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      width: "100%",
      maxWidth: 360,
      overflow: "hidden",
      elevation: 8,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      gap: 12,
    },
    title: {
      flex: 1,
      fontSize: 20,
      fontWeight: "900",
      color: colors.text,
    },
    turnBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    turnBadgeText: {
      fontSize: 11,
      fontWeight: "bold",
    },
    body: {
      padding: 16,
      paddingTop: 4,
    },
    descTitle: {
      fontSize: 11,
      fontWeight: "bold",
      color: colors.textSecondary,
      textTransform: "uppercase",
      marginBottom: 4,
      letterSpacing: 0.5,
    },
    descText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    closeBtn: {
      padding: 14,
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    closeBtnText: {
      fontWeight: "bold",
      fontSize: 14,
    },
  });
