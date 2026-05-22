import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { useCharacter } from "@/context/CharacterContext";
import { useTheme } from "@/context/ThemeContext";
import { Attribute, AttributeName, Pet, Skill } from "@/types/rpg";

const DEFAULT_ATTRIBUTES: Record<AttributeName, Attribute> = {
  Força: { name: "Força", value: 10, modifier: 0 },
  Destreza: { name: "Destreza", value: 10, modifier: 0 },
  Constituição: { name: "Constituição", value: 10, modifier: 0 },
  Inteligência: { name: "Inteligência", value: 10, modifier: 0 },
  Sabedoria: { name: "Sabedoria", value: 10, modifier: 0 },
  Carisma: { name: "Carisma", value: 10, modifier: 0 },
};

export default function PetScreen() {
  const { character, setPet, updatePet } = useCharacter();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);

  // Form state para criação/edição
  const [petName, setPetName] = useState("");
  const [petSpecies, setPetSpecies] = useState("");
  const [petHp, setPetHp] = useState("20");
  const [petAC, setPetAC] = useState("12");
  const [petFocus, setPetFocus] = useState("5");
  const [petSpeed, setPetSpeed] = useState("9m");
  const [petLevel, setPetLevel] = useState("1");
  const [petAttributes, setPetAttributes] = useState<Record<AttributeName, number>>({
    Força: 10,
    Destreza: 10,
    Constituição: 10,
    Inteligência: 6,
    Sabedoria: 8,
    Carisma: 6,
  });

  // Skill form
  const [skillName, setSkillName] = useState("");
  const [skillDamage, setSkillDamage] = useState("");
  const [skillCost, setSkillCost] = useState("0");
  const [skillDesc, setSkillDesc] = useState("");

  const pet = character.pet;

  const openCreateModal = () => {
    if (pet) {
      // Editar pet existente
      setPetName(pet.name);
      setPetSpecies(pet.species);
      setPetHp(String(pet.maxHp));
      setPetAC(String(pet.armorClass));
      setPetFocus(String(pet.maxFocus));
      setPetSpeed(pet.speed);
      setPetLevel(String(pet.level));
      const attrValues: Record<AttributeName, number> = {} as any;
      for (const key of Object.keys(pet.attributes) as AttributeName[]) {
        attrValues[key] = pet.attributes[key].value;
      }
      setPetAttributes(attrValues);
    } else {
      // Novo pet
      setPetName("");
      setPetSpecies("");
      setPetHp("20");
      setPetAC("12");
      setPetFocus("5");
      setPetSpeed("9m");
      setPetLevel("1");
      setPetAttributes({
        Força: 10,
        Destreza: 10,
        Constituição: 10,
        Inteligência: 6,
        Sabedoria: 8,
        Carisma: 6,
      });
    }
    setShowCreateModal(true);
  };

  const handleSavePet = () => {
    if (!petName.trim()) {
      Alert.alert("Erro", "O pet precisa de um nome.");
      return;
    }

    const attributes: Record<AttributeName, Attribute> = {} as any;
    for (const key of Object.keys(petAttributes) as AttributeName[]) {
      const val = petAttributes[key];
      attributes[key] = {
        name: key,
        value: val,
        modifier: Math.floor((val - 10) / 2),
      };
    }

    const newPet: Pet = {
      id: pet?.id || Date.now().toString(),
      name: petName.trim(),
      species: petSpecies.trim() || "Desconhecido",
      level: parseInt(petLevel) || 1,
      maxHp: parseInt(petHp) || 20,
      armorClass: parseInt(petAC) || 12,
      maxFocus: parseInt(petFocus) || 0,
      speed: petSpeed || "9m",
      initiativeBonus: attributes["Destreza"].modifier,
      attributes,
      stances: pet?.stances || [],
      skills: pet?.skills || [],
      spells: pet?.spells || [],
      weapons: pet?.weapons || {
        melee: {
          name: "Mordida",
          damage: "1d6",
          attribute: "Força",
          attackBonus: 0,
          range: "1.5m",
        },
      },
    };

    setPet(newPet);
    setShowCreateModal(false);
  };

  const handleRemovePet = () => {
    Alert.alert(
      "Remover Pet",
      `Tem certeza que deseja remover ${pet?.name}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => setPet(null),
        },
      ],
    );
  };

  const handleAddSkill = () => {
    if (!skillName.trim()) {
      Alert.alert("Erro", "A habilidade precisa de um nome.");
      return;
    }
    if (!pet) return;

    const newSkill: Skill = {
      id: Date.now().toString(),
      name: skillName.trim(),
      level: 1,
      cost: parseInt(skillCost) || 0,
      actionType: "Padrão",
      description: skillDesc,
      usesWeaponDamage: true,
      bonusDamage: skillDamage || undefined,
    };

    updatePet({ skills: [...(pet.skills || []), newSkill] });
    setSkillName("");
    setSkillDamage("");
    setSkillCost("0");
    setSkillDesc("");
    setShowSkillModal(false);
  };

  const handleRemoveSkill = (skillId: string) => {
    if (!pet) return;
    updatePet({ skills: pet.skills.filter((s) => s.id !== skillId) });
  };

  const updateAttr = (attr: AttributeName, value: string) => {
    const num = parseInt(value) || 0;
    setPetAttributes((prev) => ({ ...prev, [attr]: Math.max(1, Math.min(30, num)) }));
  };

  // --- SEM PET ---
  if (!pet) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="paw" size={80} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>Nenhum Companheiro</Text>
          <Text style={styles.emptySubtitle}>
            Você ainda não possui um monstro companheiro.{"\n"}
            Crie um para lutar ao seu lado no combate online!
          </Text>
          <TouchableOpacity style={styles.createBtn} onPress={openCreateModal}>
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.createBtnText}>CRIAR COMPANHEIRO</Text>
          </TouchableOpacity>
        </View>

        {renderCreateModal()}
      </View>
    );
  }

  // --- COM PET ---
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      {/* Card Principal do Pet */}
      <View style={styles.petCard}>
        <View style={styles.petHeader}>
          <MaterialCommunityIcons name="paw" size={32} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.petName}>{pet.name}</Text>
            <Text style={styles.petSpecies}>{pet.species} • Nv. {pet.level}</Text>
          </View>
          <TouchableOpacity onPress={openCreateModal}>
            <Ionicons name="create-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>HP</Text>
            <Text style={styles.statValue}>{pet.maxHp}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>CA</Text>
            <Text style={styles.statValue}>{pet.armorClass}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Foco</Text>
            <Text style={styles.statValue}>{pet.maxFocus}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Vel.</Text>
            <Text style={styles.statValue}>{pet.speed}</Text>
          </View>
        </View>

        {/* Atributos */}
        <View style={styles.attrGrid}>
          {(Object.keys(pet.attributes) as AttributeName[]).map((attr) => (
            <View key={attr} style={styles.attrItem}>
              <Text style={styles.attrName}>{attr.substring(0, 3).toUpperCase()}</Text>
              <Text style={styles.attrValue}>{pet.attributes[attr].value}</Text>
              <Text style={styles.attrMod}>
                {pet.attributes[attr].modifier >= 0 ? "+" : ""}
                {pet.attributes[attr].modifier}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Habilidades */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Habilidades</Text>
          <TouchableOpacity onPress={() => setShowSkillModal(true)}>
            <Ionicons name="add-circle" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {pet.skills.length === 0 ? (
          <Text style={styles.emptyList}>Nenhuma habilidade cadastrada.</Text>
        ) : (
          pet.skills.map((skill) => (
            <View key={skill.id} style={styles.skillItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.skillName}>{skill.name}</Text>
                <Text style={styles.skillDetail}>
                  {skill.bonusDamage ? `+${skill.bonusDamage} dano` : "Usa arma"}
                  {skill.cost > 0 ? ` • ${skill.cost} foco` : ""}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleRemoveSkill(skill.id)}>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Armas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Armas</Text>
        {pet.weapons?.melee && (
          <View style={styles.weaponItem}>
            <Ionicons name="flash" size={16} color={colors.warning || "#FFA500"} />
            <Text style={styles.weaponText}>
              {pet.weapons.melee.name} — {pet.weapons.melee.damage} ({pet.weapons.melee.range})
            </Text>
          </View>
        )}
        {pet.weapons?.ranged && (
          <View style={styles.weaponItem}>
            <Ionicons name="locate" size={16} color={colors.info || "#2196F3"} />
            <Text style={styles.weaponText}>
              {pet.weapons.ranged.name} — {pet.weapons.ranged.damage} ({pet.weapons.ranged.range})
            </Text>
          </View>
        )}
      </View>

      {/* Botão Remover */}
      <TouchableOpacity style={styles.removeBtn} onPress={handleRemovePet}>
        <Ionicons name="trash" size={18} color="#fff" />
        <Text style={styles.removeBtnText}>REMOVER COMPANHEIRO</Text>
      </TouchableOpacity>

      {renderCreateModal()}
      {renderSkillModal()}
    </ScrollView>
  );

  // --- MODAIS ---
  function renderCreateModal() {
    return (
      <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20 }}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>
                  {pet ? "Editar Companheiro" : "Criar Companheiro"}
                </Text>

                <Text style={styles.label}>Nome</Text>
                <TextInput style={styles.input} value={petName} onChangeText={setPetName} placeholder="Ex: Fenrir" placeholderTextColor={colors.textSecondary} />

                <Text style={styles.label}>Espécie</Text>
                <TextInput style={styles.input} value={petSpecies} onChangeText={setPetSpecies} placeholder="Ex: Lobo Sombrio" placeholderTextColor={colors.textSecondary} />

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Nível</Text>
                    <TextInput style={styles.input} value={petLevel} onChangeText={setPetLevel} keyboardType="numeric" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>HP Máx</Text>
                    <TextInput style={styles.input} value={petHp} onChangeText={setPetHp} keyboardType="numeric" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>CA</Text>
                    <TextInput style={styles.input} value={petAC} onChangeText={setPetAC} keyboardType="numeric" />
                  </View>
                </View>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Foco Máx</Text>
                    <TextInput style={styles.input} value={petFocus} onChangeText={setPetFocus} keyboardType="numeric" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Velocidade</Text>
                    <TextInput style={styles.input} value={petSpeed} onChangeText={setPetSpeed} placeholder="9m" placeholderTextColor={colors.textSecondary} />
                  </View>
                </View>

                {/* Atributos */}
                <Text style={[styles.label, { marginTop: 10 }]}>Atributos</Text>
                <View style={styles.attrEditGrid}>
                  {(Object.keys(petAttributes) as AttributeName[]).map((attr) => (
                    <View key={attr} style={styles.attrEditItem}>
                      <Text style={styles.attrEditLabel}>{attr.substring(0, 3)}</Text>
                      <TextInput
                        style={styles.attrEditInput}
                        value={String(petAttributes[attr])}
                        onChangeText={(v) => updateAttr(attr, v)}
                        keyboardType="numeric"
                      />
                    </View>
                  ))}
                </View>

                <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                  <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.inputBg }]} onPress={() => setShowCreateModal(false)}>
                    <Text style={{ color: colors.text }}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.success, flex: 1 }]} onPress={handleSavePet}>
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>SALVAR</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  function renderSkillModal() {
    return (
      <Modal visible={showSkillModal} transparent animationType="slide" onRequestClose={() => setShowSkillModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nova Habilidade</Text>

            <Text style={styles.label}>Nome</Text>
            <TextInput style={styles.input} value={skillName} onChangeText={setSkillName} placeholder="Ex: Mordida Venenosa" placeholderTextColor={colors.textSecondary} />

            <Text style={styles.label}>Dano Bônus (opcional)</Text>
            <TextInput style={styles.input} value={skillDamage} onChangeText={setSkillDamage} placeholder="Ex: 1d4" placeholderTextColor={colors.textSecondary} />

            <Text style={styles.label}>Custo de Foco</Text>
            <TextInput style={styles.input} value={skillCost} onChangeText={setSkillCost} keyboardType="numeric" />

            <Text style={styles.label}>Descrição</Text>
            <TextInput style={[styles.input, { minHeight: 60 }]} value={skillDesc} onChangeText={setSkillDesc} multiline placeholder="Descrição da habilidade..." placeholderTextColor={colors.textSecondary} />

            <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.inputBg }]} onPress={() => setShowSkillModal(false)}>
                <Text style={{ color: colors.text }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.success, flex: 1 }]} onPress={handleAddSkill}>
                <Text style={{ color: "#fff", fontWeight: "bold" }}>ADICIONAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    
    // Empty State
    emptyState: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
    emptyTitle: { fontSize: 22, fontWeight: "bold", color: colors.text, marginTop: 16 },
    emptySubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 20 },
    createBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 10, marginTop: 24 },
    createBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },

    // Pet Card
    petCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
    petHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
    petName: { fontSize: 20, fontWeight: "bold", color: colors.text },
    petSpecies: { fontSize: 13, color: colors.textSecondary },

    // Stats
    statsRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 16 },
    statBox: { alignItems: "center" },
    statLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: "bold", textTransform: "uppercase" },
    statValue: { fontSize: 20, fontWeight: "bold", color: colors.text },

    // Attributes
    attrGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
    attrItem: { width: "30%", alignItems: "center", marginBottom: 10, backgroundColor: colors.inputBg, borderRadius: 8, padding: 8 },
    attrName: { fontSize: 10, fontWeight: "bold", color: colors.textSecondary },
    attrValue: { fontSize: 16, fontWeight: "bold", color: colors.text },
    attrMod: { fontSize: 12, color: colors.primary },

    // Sections
    section: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: "bold", color: colors.text },
    emptyList: { color: colors.textSecondary, fontStyle: "italic", textAlign: "center", paddingVertical: 10 },

    // Skills
    skillItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderColor: colors.border },
    skillName: { fontSize: 14, fontWeight: "bold", color: colors.text },
    skillDetail: { fontSize: 12, color: colors.textSecondary },

    // Weapons
    weaponItem: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 },
    weaponText: { fontSize: 14, color: colors.text },

    // Remove
    removeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.error || "#D32F2F", padding: 14, borderRadius: 10, marginTop: 10 },
    removeBtnText: { color: "#fff", fontWeight: "bold" },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 20 },
    modalCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border },
    modalTitle: { fontSize: 18, fontWeight: "bold", color: colors.text, textAlign: "center", marginBottom: 16 },
    label: { fontSize: 12, fontWeight: "bold", color: colors.textSecondary, marginBottom: 4, textTransform: "uppercase" },
    input: { backgroundColor: colors.inputBg, padding: 12, borderRadius: 8, marginBottom: 12, color: colors.text, borderWidth: 1, borderColor: colors.border, fontSize: 15 },
    modalBtn: { padding: 14, borderRadius: 8, alignItems: "center", justifyContent: "center" },

    // Attr Edit
    attrEditGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    attrEditItem: { width: "30%", alignItems: "center" },
    attrEditLabel: { fontSize: 11, fontWeight: "bold", color: colors.textSecondary, marginBottom: 2 },
    attrEditInput: { backgroundColor: colors.inputBg, padding: 8, borderRadius: 6, width: "100%", textAlign: "center", color: colors.text, borderWidth: 1, borderColor: colors.border },
  });
