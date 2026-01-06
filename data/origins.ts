// src/data/origins.ts

export interface AncestryData {
  id: string;
  name: string;
  description: string;
  attributeBonus: string; // Ex: "+2 CON ou FOR"
  trait: { name: string; description: string };
}

export interface OriginData {
  id: string;
  ancestryId: string; // Liga esta origem a uma ancestralidade específica
  name: string;
  description: string;
  culturalTrait: string;
  heritage: string;
  languages: string[];
}

// --- DADOS DE ANCESTRALIDADE ---
export const ANCESTRIES: AncestryData[] = [
  {
    id: 'namig',
    name: 'Namig',
    description: 'Originários das terras desoladas de Trafalgar, baixos e robustos.',
    attributeBonus: '+2 em Constituição ou Força',
    trait: {
      name: 'Descendente do Gelo',
      description: 'Resistência a frio extremo. Vantagem em Sobrevivência/Constituição em climas frios.'
    }
  },
  // Adicione outras ancestralidades aqui (Humano, Elfo, etc)
];

// --- DADOS DE ORIGEM CULTURAL ---
export const CULTURAL_ORIGINS: OriginData[] = [
  {
    id: 'namig_assimilado',
    ancestryId: 'namig',
    name: 'Assimilado',
    description: 'Seus pais adotaram a cultura dos homens ao sul.',
    culturalTrait: 'Proficiência em qualquer perícia (Devido à diversidade do sul).',
    heritage: '200 pratas e uma joia de preço equivalente.',
    languages: ['Namig', 'Vulgata']
  },
  {
    id: 'namig_morador',
    ancestryId: 'namig',
    name: 'Morador do Gelo',
    description: 'Criado nas tradições estritas das terras geladas.',
    culturalTrait: 'Proficiência em Sobrevivência e Ofício.',
    heritage: 'Um mês de rações, peles e um item encravado de osso.',
    languages: ['Namig', 'Vulgata']
  }
];