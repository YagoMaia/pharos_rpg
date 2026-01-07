// src/data/origins.ts

import { CharacterClass } from "@/types/rpg";

export interface AncestryData {
  id: string;
  name: string;
  description: string;
  commonNames: string[]; // Novo campo
  attributeBonus: string;
  trait: { 
    name: string; 
    description: string;
  };
  restrictedClasses?: CharacterClass[]; // Novo campo para regra dos Haotai
}

export interface OriginData {
  id: string;
  ancestryId: string;
  name: string;
  description: string;
  culturalTrait: string;
  heritage: string;
  languages: string[];
}

// --- LISTA COMPLETA DE ANCESTRALIDADES ---
export const ANCESTRIES: AncestryData[] = [
  {
    id: 'namig',
    name: 'Namig',
    description: 'Originários das terras desoladas de Trafalgar, os Namig são baixos, robustos e sobreviventes do "O Degelo". Pragmáticos e excelentes artesãos de ossos e couro.',
    commonNames: ['Amaruq', 'Sila', 'Taktuk', 'Umiak', 'Qannik', 'Kiuq'],
    attributeBonus: '+2 em Constituição ou Força',
    trait: {
      name: 'Descendente do Gelo',
      description: 'Resistência natural a temperaturas frias extremas. Vantagem em testes de Sobrevivência ou Constituição relacionados a climas frios ou montanhosos.'
    }
  },
  {
    id: 'iliriano',
    name: 'Iliriano',
    description: 'Povo nômade de estatura baixa que viaja em carroças coloridas. Comunitários entre si, mas transacionais com forasteiros. Famosos pela alegria desafiadora e habilidade diplomática.',
    commonNames: ['Amaru', 'Thales', 'Eleni', 'Kyra', 'Nikos', 'Spiros', 'Zena'],
    attributeBonus: '+1 em Sabedoria e Carisma',
    trait: {
      name: 'Laço da Caravana',
      description: 'Proficiência em Intuição. Testes de Persuasão contra outros Ilirianos são automaticamente bem-sucedidos (se razoáveis).'
    }
  },
  {
    id: 'aeliryan',
    name: 'Aeliryan',
    description: 'Habitantes cosmopolitas do Arquipélago Aelirya. Nascidos da mistura de linhagens, valorizam a liberdade e o domínio do mar. Inimigos da rigidez, prosperam na mudança.',
    commonNames: ['Mateo', 'Inês', 'Barbossa', 'Tiago', 'Calypso', 'Dalia'],
    attributeBonus: '+1 em Força e Sabedoria',
    trait: {
      name: 'Nascido de Sal',
      description: 'Ignora terreno difícil por balanço de navios ou superfícies molhadas. Ganha +1 Ponto de Atributo à sua escolha.'
    }
  },
  {
    id: 'mavali',
    name: 'Mavali',
    description: 'Cidadãos da República de Mava, valorizam ambição, política e arte. Aprendem cedo a navegar hierarquias sociais complexas.',
    commonNames: ['Lorenzo', 'Bianca', 'Giovanni', 'Matteo', 'Beatrice', 'Luca'],
    attributeBonus: '+2 em Sabedoria ou Carisma',
    trait: {
      name: 'Homem de Classe',
      description: 'Ganha proficiência na perícia de Enganação ou Persuasão (escolha uma).'
    }
  },
  {
    id: 'kans',
    name: 'Kans',
    description: 'Humanos robustos das estepes do norte. Guerreiros temidos e fatalistas que creem que o destino é um rio que não pode ser represado.',
    commonNames: ['Batu', 'Sorghag', 'Temur', 'Altan', 'Qutluq', 'Berke'],
    attributeBonus: '+1 em Constituição e Destreza',
    trait: {
      name: 'Nascido na Sela',
      description: 'Proficiência em Lidar com Animais. Vantagem em testes relacionados a montarias.'
    }
  },
  {
    id: 'manomai',
    name: 'Manomai',
    description: 'Reivindicam ser o "primeiro povo". Famosos por astronomia, engenharia e pólvora. Cultura dividida entre misticismo do deserto e pragmatismo acadêmico.',
    commonNames: ['Farid', 'Layla', 'Amir', 'Soraya', 'Malik', 'Yasmin'],
    attributeBonus: '+2 em Sabedoria ou Inteligência',
    trait: {
      name: 'Mapa Celeste',
      description: 'Nunca se perde enquanto puder ver o céu. Vantagem em História ou Navegação sobre localização e rotas antigas.'
    }
  },
  {
    id: 'haotai',
    name: 'Haotai',
    description: 'Elfos gigantes de olhos negros dos picos de Pedra Branca. Estoicos e disciplinados, guardiões de segredos proibidos.',
    commonNames: ['Tenzin', 'Pema', 'Dorje', 'Lhamo', 'Kelsang', 'Norbu'],
    attributeBonus: '+2 em Constituição ou Força',
    restrictedClasses: ['Mago', 'Apóstata'], // Regra de restrição implementada no dado
    trait: {
      name: 'Mente Austera',
      description: 'Escolha 2 perícias para ter proficiência. Vantagem em salvaguarda contra Medo, Charme e Intimidação. Pode usar magias em extremo perigo.'
    }
  },
  {
    id: 'kadoe',
    name: 'Kadoe',
    description: 'Reclusos da Floresta Sapakatai com pequenos chifres e máscaras. Conectados aos espíritos da "Velha Fé".',
    commonNames: ['Iara', 'Cauã', 'Barden', 'Maeve', 'Brian', 'Rudá', 'Erin'],
    attributeBonus: '+1 em Destreza e Sabedoria',
    trait: {
      name: 'Máscara Protetora',
      description: 'Ignora terreno difícil não-mágico (floresta/raízes). Usando a máscara: Vantagem em testes de Espíritos e Natureza.'
    }
  },
  {
    id: 'mista',
    name: 'Mista',
    description: 'Mestiços nascidos da união de outras linhagens. Sua herança é uma combinação única.',
    commonNames: ['Qualquer nome das culturas parentais'],
    attributeBonus: 'Escolha os bônus de uma das ancestralidades parentais',
    trait: {
      name: 'Herança Híbrida',
      description: 'Escolha o Traço de uma das suas ancestralidades parentais.'
    }
  }
];

// --- 2. ORIGENS CULTURAIS ---
export const CULTURAL_ORIGINS: OriginData[] = [
  // NAMIG
  {
    id: 'namig_assimilado', ancestryId: 'namig', name: 'Assimilado',
    description: 'Adotaram a cultura do sul, mas lembram do gelo.',
    culturalTrait: 'Proficiência em qualquer perícia.',
    heritage: '200 pratas e uma joia equivalente.',
    languages: ['Namig', 'Vulgata']
  },
  {
    id: 'namig_morador', ancestryId: 'namig', name: 'Morador do Gelo',
    description: 'Tradições estritas das terras geladas.',
    culturalTrait: 'Proficiência em Sobrevivência e Ofício.',
    heritage: '1 mês de rações, peles e item de osso.',
    languages: ['Namig', 'Vulgata']
  },

  // ILIRIANO
  {
    id: 'iliriano_caravaneiro', ancestryId: 'iliriano', name: 'Caravaneiro',
    description: 'Vida na estrada, negociando e defendendo a caravana.',
    culturalTrait: 'Proficiência em Navegação ou Persuasão.',
    heritage: 'Instrumento musical, mapa de rotas e punhal decorado.',
    languages: ['Iliriano', 'Vulgata', '1 Língua Humana']
  },
  {
    id: 'iliriano_escolastico', ancestryId: 'iliriano', name: 'Escolástico',
    description: 'Focado no conhecimento, buscando a cura da praga mágica.',
    culturalTrait: 'Proficiência em Arcanismo e (Medicina ou História).',
    heritage: 'Conjunto de livros e recomendação de estudioso.',
    languages: ['Iliriano', 'Vulgata', 'Arcanum']
  },

  // AELIRYAN
  {
    id: 'aeliryan_marinheiro', ancestryId: 'aeliryan', name: 'Marinheiro',
    description: 'Sua casa é o navio. Conhece ventos e o mar.',
    culturalTrait: 'Proficiência em Pilotagem e (Acrobacia ou Navegação).',
    heritage: 'Luneta, jogos, amuleto e descontos em viagens.',
    languages: ['Aeliryan', 'Vulgata']
  },
  {
    id: 'aeliryan_cidadao', ancestryId: 'aeliryan', name: 'Cidadão das Costas',
    description: 'Cresceu em portos movimentados e comércio.',
    culturalTrait: 'Proficiência em Investigação ou Intuição.',
    heritage: 'Caixa de produtos exóticos e documentação mercantil.',
    languages: ['Aeliryan', 'Mavali (Ambos dialetos)']
  },

  // MAVALI
  {
    id: 'mavali_alta', ancestryId: 'mavali', name: 'Alta Classe',
    description: 'Regras sociais, política e poder.',
    culturalTrait: 'Proficiência em Etiqueta ou Intuição.',
    heritage: 'Crédito de 1000 pratas e item decorativo valioso.',
    languages: ['Mavali (Ambos)', '1 Língua Livre']
  },
  {
    id: 'mavali_baixa', ancestryId: 'mavali', name: 'Baixa Classe',
    description: 'Periferia e luta diária pela sobrevivência.',
    culturalTrait: 'Proficiência em Manha e Ofício.',
    heritage: '3 favores de rede criminosa/comercial e arma personalizada.',
    languages: ['Mavali (Nativo)', '1 Língua Livre']
  },

  // KANS
  {
    id: 'kans_andarilho', ancestryId: 'kans', name: 'Clã Andarilho',
    description: 'Tradições nômades, migração e caça.',
    culturalTrait: 'Proficiência em Pilotagem e Sobrevivência.',
    heritage: 'Conjunto de viagem de couro de alta qualidade e símbolo de hospitalidade.',
    languages: ['Kan', 'Vulgata']
  },
  {
    id: 'kans_cidade', ancestryId: 'kans', name: 'Clã das Cidades',
    description: 'Vida urbana atrás das muralhas, artesão ou guarda.',
    culturalTrait: 'Proficiência em Ofício ou Intimidação.',
    heritage: 'Ferramentas de artesão ou Meia-Armadura Kan.',
    languages: ['Kan', 'Vulgata']
  },
  {
    id: 'kans_semcla', ancestryId: 'kans', name: 'Sem-Clã',
    description: 'Independente, rompeu laços com os clãs.',
    culturalTrait: 'Proficiência em Enganação ou Manha.',
    heritage: 'Roupas do corpo, faca simples e um favor questionável.',
    languages: ['Kan', 'Vulgata']
  },

  // MANOMAI
  {
    id: 'manomai_oasis', ancestryId: 'manomai', name: 'Observador dos Oásis',
    description: 'Guardião dos recursos e mestre do calor.',
    culturalTrait: 'Proficiência em Natureza ou Medicina.',
    heritage: 'Odre térmico, roupas de calor e kit de herbalismo.',
    languages: ['Manomai', 'Vulgata']
  },
  {
    id: 'manomai_cidade', ancestryId: 'manomai', name: 'Observador das Cidades',
    description: 'Tradições urbanas, astrologia e administração.',
    culturalTrait: 'Proficiência em História ou Engenharia.',
    heritage: 'Astrolábio, mapa estelar e tinta de qualidade.',
    languages: ['Manomai', 'Vulgata']
  },

  // HAOTAI
  {
    id: 'haotai_emissario', ancestryId: 'haotai', name: 'Emissário',
    description: 'Disciplina rigorosa e domínio do corpo.',
    culturalTrait: 'Proficiência em Furtividade.',
    heritage: 'Manto de camuflagem e diário codificado.',
    languages: ['Haotai', 'Vulgata']
  },
  {
    id: 'haotai_exilado', ancestryId: 'haotai', name: 'Exilado',
    description: 'Fugitivo de sua terra natal após um crime.',
    culturalTrait: 'Proficiência em Intuição.',
    heritage: 'Arma cerimonial Haotai (quebrada/manchada).',
    languages: ['Haotai', 'Vulgata']
  },

  // KADOE
  {
    id: 'kadoe_mascarado', ancestryId: 'kadoe', name: 'Mascarado',
    description: 'Guardião selvagem, mestre em emboscadas.',
    culturalTrait: 'Proficiência em Furtividade ou Natureza.',
    heritage: 'Máscara de madeira e pequeno animal de estimação.',
    languages: ['Kadoe', 'Vulgata']
  },
  {
    id: 'kadoe_arvore', ancestryId: 'kadoe', name: 'Árvore Solitária',
    description: 'Eremita introspectivo conectado a local sagrado.',
    culturalTrait: 'Proficiência em Atletismo ou Natureza.',
    heritage: 'Cajado da Yvyra e sementes raras.',
    languages: ['Kadoe', 'Vulgata']
  },

  // --- ORIGENS ESPECIAIS (Disponíveis se selecionar "Mista/Especial" ou se você mudar a lógica para permitir 'any') ---
  
  // COMPANHIA MAVALI
  {
    id: 'mavali_agente', ancestryId: 'mista', name: 'Agente Industrial (Mavali)',
    description: 'Treinado em subterfúgio e ações ilícitas para a Companhia.',
    culturalTrait: 'Proficiência em Ladinagem ou Intimidação.',
    heritage: 'Kit de ladrão, uniforme CCM e salvo-conduto.',
    languages: ['Mavali (Ambos)', '1 Língua Livre']
  },
  {
    id: 'mavali_burocrata', ancestryId: 'mista', name: 'Burocrata (Mavali)',
    description: 'Mestre da papelada e registros.',
    culturalTrait: 'Proficiência em Investigação ou Ofício.',
    heritage: 'Livro-razão, selo oficial e carta de crédito.',
    languages: ['Mavali (Nativo)', 'Aeliryan', 'Vulgata']
  },

  // ESCOLAS
  {
    id: 'escolas_magiscido', ancestryId: 'mista', name: 'Magiscido (Escolas)',
    description: 'Criado nas academias, dom inato.',
    culturalTrait: 'Proficiência em Arcanismo e (Inteligência ou Sabedoria).',
    heritage: 'Pedra-Mana gasta, vestes e acesso a bibliotecas.',
    languages: ['Arcanum', 'Vulgata', 'Lê Mavali']
  },
  {
    id: 'escolas_estudos', ancestryId: 'mista', name: 'Estudos Imparáveis (Escolas)',
    description: 'Sem dom inato, magia por esforço brutal.',
    culturalTrait: 'Proficiência em (Sabedoria ou Concentração).',
    heritage: 'Pergaminhos, óculos de leitura e componentes.',
    languages: ['Arcanum', 'Vulgata']
  },

  // APÓSTATA
  {
    id: 'apostata_fugido', ancestryId: 'mista', name: 'Fugido das Escolas',
    description: 'Desertou do treinamento formal com segredos.',
    culturalTrait: 'Proficiência em Enganação ou Furtividade.',
    heritage: 'Artefato roubado e tatuagem mágica inativa.',
    languages: ['Arcanum', 'Vulgata']
  },
  {
    id: 'apostata_nascido', ancestryId: 'mista', name: 'Nascido de Fora',
    description: 'Magia instintiva e bruta, sem treinamento.',
    culturalTrait: 'Proficiência em Ocultismo ou perícia de Carisma.',
    heritage: 'Foco primitivo (Artefato quebrado).',
    languages: ['1 Livre', 'Mavali']
  },

  // ORIGEM LIVRE
  {
    id: 'origem_livre', ancestryId: 'mista', name: 'Origem Livre',
    description: 'Mistura única de aspectos culturais.',
    culturalTrait: 'Escolha uma perícia.',
    heritage: 'Escolha itens de duas origens diferentes.',
    languages: ['1 Livre', 'Vulgata']
  }
];