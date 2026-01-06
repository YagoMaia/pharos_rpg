// app/(tabs)/combat.tsx
import React, { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  Alert
} from "react-native";
import { useCharacter } from "../../context/CharacterContext";
import { Skill } from "../../types/rpg";

export default function CombatScreen() {
  const { character, toggleStance } = useCharacter();

  const activeStance = character.stances[character.currentStanceIndex];
  const isStanceTwo = character.currentStanceIndex === 1;

  const renderSkill = ({ item }: { item: Skill }) => <SkillCard skill={item} />;

  return (
    <View style={styles.container}>
      {/* --- Toggle de Postura Reformulado --- */}
      <View style={[styles.stanceContainer, isStanceTwo ? styles.stanceTwoBg : styles.stanceOneBg]}>
        
        {/* Cabeçalho do Toggle */}
        <View style={styles.stanceHeader}>
          <Text style={[styles.stanceOption, !isStanceTwo && styles.activeOptionText]}>
            Postura 1
          </Text>
          
          <Switch
            value={isStanceTwo}
            onValueChange={toggleStance}
            trackColor={{ false: "#90caf9", true: "#ffcc80" }}
            thumbColor={isStanceTwo ? "#f57c00" : "#1976d2"}
          />
          
          <Text style={[styles.stanceOption, isStanceTwo && styles.activeOptionText]}>
            Postura 2
          </Text>
        </View>

        <Text style={styles.activeStanceName}>{activeStance.name}</Text>

        <View style={styles.divider} />

        {/* Detalhes da Postura */}
        <View style={styles.stanceDetails}>
          <InfoRow label="Benefício" text={activeStance.benefit} color="#2e7d32" />
          <InfoRow label="Restrição" text={activeStance.restriction} color="#c62828" />
          <InfoRow label="Manobra" text={activeStance.maneuver} color="#1565c0" />
          
          {activeStance.recovery && (
            <InfoRow label="Recuperação" text={activeStance.recovery} color="#6a1b9a" />
          )}
        </View>
      </View>

      <Text style={styles.sectionHeader}>Habilidades de Classe</Text>

      <FlatList
        data={character.skills}
        keyExtractor={(item) => item.id}
        renderItem={renderSkill}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

// Componente Auxiliar para Linhas de Informação
const InfoRow = ({ label, text, color }: { label: string, text: string, color: string }) => (
  <View style={styles.infoRow}>
    <Text style={[styles.infoLabel, { color }]}>{label}:</Text>
    <Text style={styles.infoText}>{text}</Text>
  </View>
);

// --- Componente SkillCard (Mantido igual ao anterior, resumido aqui) ---
const SkillCard = ({ skill }: { skill: Skill }) => {
  const [expanded, setExpanded] = useState(false);
  const { character, updateStat } = useCharacter();
  const hasEnoughFocus = character.stats.focus.current >= skill.cost;

  const handleUseSkill = () => {
    if (!hasEnoughFocus) {
      Alert.alert("Foco Insuficiente", "Sem foco para usar esta habilidade.");
      return;
    }
    updateStat("focus", -skill.cost);
  };

  return (
    <TouchableOpacity style={styles.skillCard} onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
      <View style={styles.skillHeader}>
        <View>
          <Text style={styles.skillName}>{skill.name}</Text>
          <Text style={styles.skillType}>{skill.actionType}</Text>
        </View>
        <View style={[styles.costBadge, !hasEnoughFocus && styles.costBadgeDisabled]}>
          <Text style={[styles.costText, !hasEnoughFocus && styles.costTextDisabled]}>{skill.cost} Foco</Text>
        </View>
      </View>
      {expanded && (
        <View style={styles.skillBody}>
          <Text style={styles.description}>{skill.description}</Text>
          <TouchableOpacity 
            style={[styles.useButton, !hasEnoughFocus && styles.useButtonDisabled]}
            onPress={handleUseSkill}
            disabled={!hasEnoughFocus}
          >
            <Text style={styles.useButtonText}>{hasEnoughFocus ? "USAR HABILIDADE" : "FOCO INSUFICIENTE"}</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  
  // Estilos da Postura
  stanceContainer: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  stanceOneBg: { backgroundColor: "#e3f2fd", borderLeftWidth: 5, borderLeftColor: "#1976d2" }, // Azul
  stanceTwoBg: { backgroundColor: "#fff3e0", borderLeftWidth: 5, borderLeftColor: "#f57c00" }, // Laranja
  
  stanceHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  stanceOption: { fontSize: 12, color: '#666', textTransform: 'uppercase' },
  activeOptionText: { fontWeight: 'bold', color: '#333' },
  
  activeStanceName: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#222',
    marginBottom: 8,
  },
  
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.1)', marginBottom: 12 },
  
  stanceDetails: { gap: 8 },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' },
  infoLabel: { fontWeight: 'bold', marginRight: 6, fontSize: 14 },
  infoText: { fontSize: 14, color: '#444', flex: 1, lineHeight: 20 },

  // Estilos Gerais
  sectionHeader: { fontSize: 18, fontWeight: "bold", marginLeft: 16, marginBottom: 8, color: '#333' },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  
  // Estilos do SkillCard (Mesmos de antes)
  skillCard: { backgroundColor: "#fff", marginBottom: 10, borderRadius: 8, padding: 16, elevation: 1 },
  skillHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  skillName: { fontSize: 16, fontWeight: "bold" },
  skillType: { fontSize: 12, color: "#666", marginTop: 2 },
  costBadge: { backgroundColor: "#e0e0e0", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  costBadgeDisabled: { backgroundColor: "#ffebee", borderWidth: 1, borderColor: "#ef5350" },
  costText: { fontSize: 12, fontWeight: "bold" },
  costTextDisabled: { color: "#c62828" },
  skillBody: { marginTop: 12, borderTopWidth: 1, borderTopColor: "#eee", paddingTop: 8 },
  description: { fontSize: 14, lineHeight: 20, color: "#444" },
  useButton: { marginTop: 12, backgroundColor: "#6200ea", paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  useButtonDisabled: { backgroundColor: "#bdbdbd" },
  useButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
});