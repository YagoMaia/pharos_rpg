import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";

interface ImagePickerSelectorProps {
  currentImage?: string;
  onImageSelected: (uri: string) => void;
  label?: string;
  round?: boolean;
}

export function ImagePickerSelector({ currentImage, onImageSelected, label = "Adicionar Imagem", round = false }: ImagePickerSelectorProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors, round);

  const pickImage = async () => {
    // Solicitar permissão
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("É necessário dar permissão para acessar a galeria de fotos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: round ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      onImageSelected(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
        {currentImage ? (
          <Image source={{ uri: currentImage }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="camera-outline" size={32} color={colors.textSecondary} />
            <Text style={styles.placeholderText}>{label}</Text>
          </View>
        )}
      </TouchableOpacity>
      {currentImage ? (
        <TouchableOpacity style={styles.changeBtn} onPress={pickImage}>
          <Text style={styles.changeBtnText}>Alterar Imagem</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const getStyles = (colors: any, round: boolean) => StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 20,
  },
  imageContainer: {
    width: round ? 120 : "100%",
    height: round ? 120 : 200,
    borderRadius: round ? 60 : 12,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  changeBtn: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  changeBtnText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "500",
  },
});
