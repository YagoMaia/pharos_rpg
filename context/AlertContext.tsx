import { useTheme } from "@/context/ThemeContext";
import React, { createContext, ReactNode, useContext, useState } from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Tipos iguais ao do Alert nativo
interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface AlertContextType {
  showAlert: (title: string, message?: string, buttons?: AlertButton[]) => void;
  closeAlert: () => void;
}

const AlertContext = createContext<AlertContextType>({} as AlertContextType);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState({
    title: "",
    message: "",
    buttons: [] as AlertButton[],
  });

  // Animação de fade (opcional, mas fica bonito)
  const [fadeAnim] = useState(new Animated.Value(0));

  const showAlert = (
    title: string,
    message: string = "",
    buttons: AlertButton[] = []
  ) => {
    // Se não passar botões, cria um "OK" padrão
    const finalButtons =
      buttons.length > 0 ? buttons : [{ text: "OK ", style: "default" }];

    setConfig({ title, message, buttons: finalButtons as AlertButton[] });
    setVisible(true);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const closeAlert = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  // Renderiza os botões dinamicamente
  const renderButtons = () => {
    return (
      <View
        style={[
          styles.buttonRow,
          config.buttons.length > 2 && styles.buttonColumn,
        ]}
      >
        {config.buttons.map((btn, index) => {
          // Estilo do texto baseado no tipo (cancel, destructive, default)
          let textColor = colors.primary;
          if (btn.style === "cancel") textColor = colors.textSecondary;
          if (btn.style === "destructive") textColor = colors.error;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.button,
                config.buttons.length > 2 && styles.fullWidthButton,
              ]}
              onPress={() => {
                if (btn.onPress) btn.onPress();
                closeAlert();
              }}
            >
              <Text style={[styles.buttonText, { color: textColor }]}>
                {btn.text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // Estilos Dinâmicos
  const dynamicStyles = {
    overlay: { backgroundColor: "rgba(0,0,0,0.6)" },
    box: { backgroundColor: colors.surface, borderColor: colors.border },
    title: { color: colors.text },
    message: { color: colors.textSecondary },
  };

  return (
    <AlertContext.Provider value={{ showAlert, closeAlert }}>
      {children}

      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={() => {}}
      >
        <View style={styles.overlay}>
          <Animated.View
            style={[
              styles.alertBox,
              dynamicStyles.box,
              { opacity: fadeAnim, transform: [{ scale: fadeAnim }] },
            ]}
          >
            <Text style={[styles.title, dynamicStyles.title]}>
              {config.title}
            </Text>
            {!!config.message && (
              <Text style={[styles.message, dynamicStyles.message]}>
                {config.message}
              </Text>
            )}

            <View style={styles.buttonsContainer}>{renderButtons()}</View>
          </Animated.View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)", // Dim background
    padding: 24,
  },
  alertBox: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonsContainer: {
    width: "100%",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 16,
  },
  buttonColumn: {
    flexDirection: "column",
    gap: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidthButton: {
    width: "100%",
    alignItems: "flex-end", // Ou center, conforme preferência
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
});
