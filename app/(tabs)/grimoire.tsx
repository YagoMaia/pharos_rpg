// app/(tabs)/grimoire.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useCharacter } from "../../context/CharacterContext";
import { Spell } from "../../types/rpg";

const getCircleTheme = (circle: number) => {
  switch (circle) {
    case 1:
      return { primary: "#2e7d32", light: "#e8f5e9" }; // Verde (Iniciante)
    case 2:
      return { primary: "#1565c0", light: "#e3f2fd" }; // Azul (Intermediário)
    case 3:
      return { primary: "#6a1b9a", light: "#f3e5f5" }; // Roxo (Avançado)
    case 4:
      return { primary: "#c62828", light: "#ffebee" }; // Vermelho (Mestre)
    case 5:
      return { primary: "#ef6c00", light: "#fff3e0" }; // Laranja (Lendário)
    default:
      return { primary: "#455a64", light: "#eceff1" }; // Cinza (Padrão)
  }
};

export default function GrimoireScreen() {
  const { character } = useCharacter();

  const sections = useMemo(() => {
    if (!character.grimoire || character.grimoire.length === 0) return [];

    const groups = character.grimoire.reduce((acc, spell) => {
      const circleKey = spell.circle;
      if (!acc[circleKey]) {
        acc[circleKey] = [];
      }
      acc[circleKey].push(spell);
      return acc;
    }, {} as Record<number, Spell[]>);

    return Object.keys(groups)
      .map(key => Number(key))
      .sort((a, b) => a - b)
      .map(circle => ({
        title: `${circle}º Círculo`,
        circleLevel: circle, // Guardamos o nível aqui para usar no Header
        data: groups[circle],
      }));
  }, [character.grimoire]);

  if (!character.grimoire) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Seu personagem não possui um Grimório.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SpellCard spell={item} />}
        renderSectionHeader={({ section: { title, circleLevel } }) => {
          const theme = getCircleTheme(circleLevel);
          return (
            <View style={styles.sectionHeader}>
              {/* Indicador visual colorido no header */}
              <View style={[styles.circleDot, { backgroundColor: theme.primary }]} />
              <Text style={[styles.sectionTitle, { color: theme.primary }]}>{title}</Text>
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={true}
        ListEmptyComponent={
          <Text style={styles.emptyList}>Nenhuma magia aprendida ainda.</Text>
        }
      />
    </View>
  );
}

// Componente Modular para o Card de Magia
const SpellCard = ({ spell }: { spell: Spell }) => {
  const [expanded, setExpanded] = useState(false);
  const theme = getCircleTheme(spell.circle); // Pega as cores baseadas no círculo da magia

  return (
    <TouchableOpacity 
      style={[styles.card, { borderLeftColor: theme.primary }]} 
      activeOpacity={0.9} 
      onPress={() => setExpanded(!expanded)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.headerTop}>
          <Text style={styles.spellName}>{spell.name}</Text>
          
          {/* Badge da Escola usando a cor suave do círculo */}
          <View style={[styles.schoolBadge, { backgroundColor: theme.light }]}>
            <Text style={[styles.schoolText, { color: theme.primary }]}>{spell.school}</Text>
          </View>
        </View>
        
        {!expanded && (
          <Text style={styles.summaryEffect} numberOfLines={1}>
            {spell.effect}
          </Text>
        )}
      </View>

      {expanded && (
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="flash" size={14} color={theme.primary} />
            <Text style={styles.effectLabel}>Efeito: <Text style={styles.effectValue}>{spell.effect}</Text></Text>
          </View>
          
          <Text style={styles.description}>{spell.description}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // 1. Fundo padronizado com as outras telas
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingBottom: 20 },
  
  // Estilos da Seção (Cabeçalho)
  sectionHeader: {
    backgroundColor: '#f0f2f5', // Mesma cor do fundo para parecer transparente
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    // Removi a sombra e a cor roxa forçada para ficar mais limpo como o Inventário
  },
  circleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 18, // Tamanho padronizado
    fontWeight: 'bold',
    // A cor vem via style inline
  },

  // Estilos do Card (Padronizado com Inventário/Combate)
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 8,
    padding: 16,
    elevation: 2, // Sombra suave padrão
    borderLeftWidth: 4, 
    // borderLeftColor vem via inline style
  },
  cardHeader: {
    marginBottom: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  spellName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  schoolBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    // Cor de fundo vem via inline
  },
  schoolText: {
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '700',
    // Cor do texto vem via inline
  },
  summaryEffect: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  
  // Corpo Expandido
  cardBody: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  effectLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#444',
  },
  effectValue: {
    fontWeight: 'normal',
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    textAlign: 'justify', // Texto justificado para leitura mais formal
  },
  
  emptyText: { fontSize: 16, color: '#999' },
  emptyList: { textAlign: 'center', marginTop: 20, color: '#888', fontStyle: 'italic' },
});
