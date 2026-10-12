import { ThemeColors } from "@/constants/theme";
import { formatSessionDate, getSuggestedNextSessionDate, toDatetimeLocalString } from "@/utils/sessionDate";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface DateTimePickerFieldProps {
  colors: ThemeColors;
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

const webPointer = Platform.OS === "web" ? ({ cursor: "pointer" } as const) : {};

export function DateTimePickerField({
  colors,
  value,
  onChange,
  label = "Data / Horário da Sessão",
}: DateTimePickerFieldProps) {
  const [modalVisible, setModalVisible] = useState(false);

  // Estados locais para edição mobile
  const [tempDate, setTempDate] = useState<Date>(() => {
    if (value && value.includes("T")) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  });

  function handleOpenMobileModal() {
    if (value && value.includes("T")) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        setTempDate(parsed);
      } else {
        setTempDate(new Date());
      }
    } else {
      setTempDate(new Date());
    }
    setModalVisible(true);
  }

  function handleQuickSelect(type: "today" | "tomorrow" | "saturday" | "sunday") {
    const d = new Date();
    d.setHours(19, 30, 0, 0); // Horário padrão da mesa: 19:30
    if (type === "tomorrow") {
      d.setDate(d.getDate() + 1);
    } else if (type === "saturday") {
      const daysUntilSaturday = (6 - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + daysUntilSaturday);
    } else if (type === "sunday") {
      const daysUntilSunday = (0 - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + daysUntilSunday);
    }
    const iso = toDatetimeLocalString(d);
    onChange(iso);
    setTempDate(d);
    setModalVisible(false);
  }

  function handleConfirmMobile() {
    onChange(toDatetimeLocalString(tempDate));
    setModalVisible(false);
  }

  function adjustDateDays(delta: number) {
    const next = new Date(tempDate);
    next.setDate(next.getDate() + delta);
    setTempDate(next);
  }

  function adjustHours(delta: number) {
    const next = new Date(tempDate);
    next.setHours((next.getHours() + delta + 24) % 24);
    setTempDate(next);
  }

  function adjustMinutes(delta: number) {
    const next = new Date(tempDate);
    let m = next.getMinutes() + delta;
    if (m >= 60) m = 0;
    if (m < 0) m = 45;
    next.setMinutes(m);
    setTempDate(next);
  }

  return (
    <View style={styles.container}>
      {!!label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}

      {Platform.OS === "web" ? (
        // Versão Web: input nativo datetime-local do browser com visual integrado
        <View style={styles.webRow}>
          <View
            style={[
              styles.webInputContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name="calendar-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
            {/* @ts-ignore - React Native Web renderiza <input> */}
            <input
              type="datetime-local"
              value={value || ""}
              onChange={(e: any) => onChange(e.target.value)}
              style={{
                backgroundColor: "transparent",
                color: colors.text,
                border: "none",
                outline: "none",
                fontFamily: "inherit",
                fontSize: "14px",
                flex: 1,
                cursor: "pointer",
                colorScheme: "dark",
              }}
            />
          </View>

          <TouchableOpacity
            onPress={() => onChange(getSuggestedNextSessionDate())}
            style={[
              styles.quickButton,
              { backgroundColor: colors.inputBg, borderColor: colors.border },
              webPointer,
            ]}
          >
            <Ionicons name="sparkles" size={14} color={colors.primary} />
            <Text style={[styles.quickButtonText, { color: colors.primary }]}>Próx. Sáb 19:30</Text>
          </TouchableOpacity>

          {!!value && (
            <TouchableOpacity
              onPress={() => onChange("")}
              style={[
                styles.iconOnlyButton,
                { backgroundColor: colors.inputBg, borderColor: colors.border },
                webPointer,
              ]}
            >
              <Ionicons name="close" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        // Versão Mobile: botão de toque que abre modal interativo
        <>
          <TouchableOpacity
            onPress={handleOpenMobileModal}
            style={[
              styles.mobileTrigger,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.triggerLeft}>
              <Ionicons name="calendar" size={18} color={colors.primary} />
              <Text style={[styles.triggerText, { color: value ? colors.text : colors.textSecondary }]}>
                {value ? formatSessionDate(value) : "Tocar para definir data e hora"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Modal de Seleção de Data/Hora Mobile */}
          <Modal
            visible={modalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Agendar Sessão</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Prévia da data atual selecionada */}
                <View style={[styles.previewBadge, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Ionicons name="time" size={18} color={colors.primary} />
                  <Text style={[styles.previewText, { color: colors.primary }]}>
                    {formatSessionDate(toDatetimeLocalString(tempDate))}
                  </Text>
                </View>

                {/* Atalhos Rápidos */}
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Atalhos da Mesa</Text>
                <View style={styles.shortcutsRow}>
                  <TouchableOpacity
                    onPress={() => handleQuickSelect("today")}
                    style={[styles.shortcutPill, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                  >
                    <Text style={[styles.shortcutText, { color: colors.text }]}>Hoje 19:30</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleQuickSelect("tomorrow")}
                    style={[styles.shortcutPill, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                  >
                    <Text style={[styles.shortcutText, { color: colors.text }]}>Amanhã 19:30</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleQuickSelect("saturday")}
                    style={[
                      styles.shortcutPill,
                      { backgroundColor: "rgba(187, 134, 252, 0.15)", borderColor: colors.primary },
                    ]}
                  >
                    <Text style={[styles.shortcutText, { color: colors.primary, fontWeight: "bold" }]}>
                      Sábado 19:30
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleQuickSelect("sunday")}
                    style={[styles.shortcutPill, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                  >
                    <Text style={[styles.shortcutText, { color: colors.text }]}>Domingo 19:30</Text>
                  </TouchableOpacity>
                </View>

                {/* Controles de Ajuste Fino */}
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary, marginTop: 12 }]}>
                  Ajuste Fino
                </Text>
                <View style={styles.adjustRow}>
                  {/* Dia */}
                  <View style={[styles.adjustGroup, { borderColor: colors.border }]}>
                    <Text style={[styles.adjustLabel, { color: colors.textSecondary }]}>Dia</Text>
                    <View style={styles.adjustControl}>
                      <TouchableOpacity onPress={() => adjustDateDays(-1)} style={styles.adjustBtn}>
                        <Ionicons name="remove" size={16} color={colors.text} />
                      </TouchableOpacity>
                      <Text style={[styles.adjustVal, { color: colors.text }]}>{tempDate.getDate()}</Text>
                      <TouchableOpacity onPress={() => adjustDateDays(1)} style={styles.adjustBtn}>
                        <Ionicons name="add" size={16} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Hora */}
                  <View style={[styles.adjustGroup, { borderColor: colors.border }]}>
                    <Text style={[styles.adjustLabel, { color: colors.textSecondary }]}>Hora</Text>
                    <View style={styles.adjustControl}>
                      <TouchableOpacity onPress={() => adjustHours(-1)} style={styles.adjustBtn}>
                        <Ionicons name="remove" size={16} color={colors.text} />
                      </TouchableOpacity>
                      <Text style={[styles.adjustVal, { color: colors.text }]}>
                        {String(tempDate.getHours()).padStart(2, "0")}h
                      </Text>
                      <TouchableOpacity onPress={() => adjustHours(1)} style={styles.adjustBtn}>
                        <Ionicons name="add" size={16} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Minuto */}
                  <View style={[styles.adjustGroup, { borderColor: colors.border }]}>
                    <Text style={[styles.adjustLabel, { color: colors.textSecondary }]}>Minutos</Text>
                    <View style={styles.adjustControl}>
                      <TouchableOpacity onPress={() => adjustMinutes(-15)} style={styles.adjustBtn}>
                        <Ionicons name="remove" size={16} color={colors.text} />
                      </TouchableOpacity>
                      <Text style={[styles.adjustVal, { color: colors.text }]}>
                        {String(tempDate.getMinutes()).padStart(2, "0")}m
                      </Text>
                      <TouchableOpacity onPress={() => adjustMinutes(15)} style={styles.adjustBtn}>
                        <Ionicons name="add" size={16} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Botões de Ação do Modal */}
                <View style={styles.modalActionRow}>
                  <TouchableOpacity
                    onPress={() => {
                      onChange("");
                      setModalVisible(false);
                    }}
                    style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                  >
                    <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Limpar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleConfirmMobile}
                    style={[styles.modalConfirmBtn, { backgroundColor: colors.primary }]}
                  >
                    <Text style={styles.modalConfirmText}>Confirmar Data</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  webRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  webInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 42,
  },
  quickButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 42,
  },
  quickButtonText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  iconOnlyButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mobileTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  triggerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  triggerText: {
    fontSize: 13,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalBox: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  previewBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 14,
  },
  previewText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  shortcutsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  shortcutPill: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  shortcutText: {
    fontSize: 12,
  },
  adjustRow: {
    flexDirection: "row",
    gap: 8,
  },
  adjustGroup: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 6,
    alignItems: "center",
  },
  adjustLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  adjustControl: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  adjustBtn: {
    padding: 4,
  },
  adjustVal: {
    fontSize: 14,
    fontWeight: "bold",
  },
  modalActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 18,
  },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    fontSize: 13,
  },
  modalConfirmBtn: {
    flex: 2,
    borderRadius: 8,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
  },
});
