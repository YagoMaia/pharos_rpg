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
import { Ionicons } from '@expo/vector-icons'; // Para ícone (opcional)

export default function CombatScreen() {
  const { character, toggleStance } = useCharacter();

  const activeStance = character.stances[character.currentStanceIndex];
  const isStanceTwo = character.currentStanceIndex === 1;
  const focus = character.stats.focus; // Atalho para o foco

  const renderSkill = ({ item }: { item: Skill }) => <SkillCard skill={item} />;

  return (
    <View style={styles.container}>
      
      {/* --- HUD DE FOCO (NOVO) --- */}
      <View style={styles.focusHud}>
        <View style={styles.focusHeader}>
          <View style={styles.focusLabelContainer}>
            <Ionicons name="flash" size={16} color="#1e88e5" />
            <Text style={styles.focusTitle}>PONTOS DE FOCO</Text>
          </View>
          <Text style={styles.focusValue}>
            <Text style={styles.focusCurrent}>{focus.current}</Text>
            <Text style={styles.focusMax}> / {focus.max}</Text>
          </Text>
        </View>
        
        {/* Barra de Progresso Visual */}
        <View style={styles.focusBarBg}>
          <View 
            style={[
              styles.focusBarFill, 
              { width: `${(focus.current / focus.max) * 100}%` }
            ]} 
          />
        </View>
      </View>

      {/* --- Toggle de Postura --- */}
      <View style={[styles.stanceContainer, isStanceTwo ? styles.stanceTwoBg : styles.stanceOneBg]}>
        
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

// ... InfoRow (Mantido igual) ...
const InfoRow = ({ label, text, color }: { label: string, text: string, color: string }) => (
  <View style={styles.infoRow}>
    <Text style={[styles.infoLabel, { color }]}>{label}:</Text>
    <Text style={styles.infoText}>{text}</Text>
  </View>
);

// ... SkillCard (Mantido igual) ...
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
  
  // --- ESTILOS DO NOVO HUD DE FOCO ---
  focusHud: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 2, // Sombra suave
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 4, // Espaço pequeno antes da postura
  },
  focusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  focusLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  focusTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e88e5',
    letterSpacing: 1,
  },
  focusValue: {
    fontSize: 14,
    color: '#555',
  },
  focusCurrent: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  focusMax: {
    fontSize: 14,
    color: '#999',
  },
  focusBarBg: {
    height: 8,
    backgroundColor: '#e3f2fd', // Azul bem claro
    borderRadius: 4,
    overflow: 'hidden',
  },
  focusBarFill: {
    height: '100%',
    backgroundColor: '#1e88e5', // Azul principal
    borderRadius: 4,
  },

  // ... (Resto dos estilos de Postura e SkillCard mantidos iguais) ...
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
  stanceOneBg: { backgroundColor: "#e3f2fd", borderLeftWidth: 5, borderLeftColor: "#1976d2" }, 
  stanceTwoBg: { backgroundColor: "#fff3e0", borderLeftWidth: 5, borderLeftColor: "#f57c00" }, 
  stanceHeader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 12, gap: 10 },
  stanceOption: { fontSize: 12, color: '#666', textTransform: 'uppercase' },
  activeOptionText: { fontWeight: 'bold', color: '#333' },
  activeStanceName: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: '#222', marginBottom: 8 },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.1)', marginBottom: 12 },
  stanceDetails: { gap: 8 },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' },
  infoLabel: { fontWeight: 'bold', marginRight: 6, fontSize: 14 },
  infoText: { fontSize: 14, color: '#444', flex: 1, lineHeight: 20 },
  sectionHeader: { fontSize: 18, fontWeight: "bold", marginLeft: 16, marginBottom: 8, color: '#333' },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
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