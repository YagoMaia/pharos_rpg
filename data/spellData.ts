// src/data/spellData.ts
import { Spell } from "@/types/rpg";

export interface MagicSchoolData {
  id: string;
  name: string;
  quote: string;
  description: string;
  spells: Spell[];
}

export const MAGIC_SCHOOLS: MagicSchoolData[] = [
  {
    id: 'agua',
    name: 'Escola da Água',
    quote: '“Muito se fala sobre a natureza mutável da água dos rios, mas pouco se fala de sua orla sendo carregado por elas”',
    description: 'Estuda o Movimento Constante e a Adaptação. Seus magos agem como médicos e estrategistas, usando a fluidez para curar e controlar o campo de batalha.',
    spells: [
      {
        id: 'agua_lavar', name: 'Lavar Feridas', school: 'Água', circle: 1,
        description: 'Acelera a coagulação e limpa infecções.',
        effect: 'Cura 1d8 + INT em um aliado a até 18m.'
      },
      {
        id: 'agua_correnteza', name: 'Correnteza Auxiliadora', school: 'Água', circle: 1,
        description: 'Cria uma camada de água sob os pés de um aliado.',
        effect: 'Aliado a até 18m move metade do deslocamento a mais.'
      },
      {
        id: 'agua_congelar', name: 'Congelar Superfície', school: 'Água', circle: 1,
        description: 'Transforma o piso em uma armadilha escorregadia.',
        effect: 'Área de 6m. Salvaguarda de Destreza ou cai Prostrado.'
      },
      {
        id: 'agua_torrente', name: 'Torrente Restauradora', school: 'Água', circle: 2,
        description: 'Onda de água pura que lava toxinas.',
        effect: 'Remove 1 condição (Paralisia, Cegueira, Envenenamento, Fraqueza) de aliado a 18m.'
      },
      {
        id: 'agua_lanca', name: 'Lança Gelada', school: 'Água', circle: 2,
        description: 'Estaca de gelo dura como diamante.',
        effect: 'Ataque a 24m. 2d6+INT perfurante. Falha em CON perde metade do deslocamento.'
      },
      {
        id: 'agua_parede', name: 'Parede Congelada', school: 'Água', circle: 3,
        description: 'Barreira maciça de gelo translúcido.',
        effect: 'Cria parede (9x3m). Cobertura Total. 60 PV por seção. Destruição causa 1d6 frio.'
      }
    ]
  },
  {
    id: 'fogo',
    name: 'Escola do Fogo',
    quote: '“Um incêndio oferta tanta mudança quanto uma enchente, mas sua marca é eterna.”',
    description: 'Estuda a Mudança Violenta e a Entropia. Magos canalizam ambição e raiva em explosões controladas para purificar e devastar.',
    spells: [
      {
        id: 'fogo_labaredas', name: 'Labaredas', school: 'Fogo', circle: 1,
        description: 'Pequenos projéteis de fogo guiados.',
        effect: '3 projéteis a 18m (divisíveis). Acerto automático. 1d4+INT fogo cada.'
      },
      {
        id: 'fogo_maos', name: 'Mãos Flamejantes', school: 'Fogo', circle: 1,
        description: 'Leque de chamas pelas pontas dos dedos.',
        effect: 'Cone de 9m. Salvaguarda DES. 2d8+INT fogo (metade se passar).'
      },
      {
        id: 'fogo_cortina', name: 'Cortina de Fumaça', school: 'Fogo', circle: 1,
        description: 'Nuvem densa e sufocante.',
        effect: 'Raio de 6m. Bloqueia visão. Quem está dentro tem Vantagem para esconder.'
      },
      {
        id: 'fogo_furia', name: 'Fúria Flamejante', school: 'Fogo', circle: 2,
        description: 'Incendeia o sangue com agressividade.',
        effect: 'Alvo a 18m faz Salvaguarda SAB ou entra em Fúria (Ataca próximo com Vantagem).'
      },
      {
        id: 'fogo_esquentar', name: 'Esquentar Metal', school: 'Fogo', circle: 2,
        description: 'Faz metal brilhar em brasa.',
        effect: 'Causa 2d8 fogo. Se segurando: Salvaguarda CON para soltar ou Desvantagem em ataques.'
      },
      {
        id: 'fogo_bola', name: 'Bola de Fogo', school: 'Fogo', circle: 3,
        description: 'Detonação catastrófica de energia.',
        effect: 'Explosão raio 6m a até 36m. Salvaguarda DES. 6d6 fogo (metade se passar).'
      }
    ]
  },
  {
    id: 'terra',
    name: 'Escola da Terra',
    quote: '“Pra tirar aquela pedra vai ser uma trabalheira, melhor construir sua casa em outro canto.”',
    description: 'Estuda a Permanência e Inércia. É a magia da defesa absoluta. Seus magos não desviam, eles se tornam duros demais para serem feridos.',
    spells: [
      {
        id: 'terra_pele', name: 'Pele de Granito', school: 'Terra', circle: 1,
        description: 'Endurece a pele como rocha.',
        effect: 'Toque. Concentração (1 min). +2 na CA.'
      },
      {
        id: 'terra_projetil', name: 'Projétil de Rocha', school: 'Terra', circle: 1,
        description: 'Arremessa pedaço do solo.',
        effect: 'Ataque a 18m. 1d10+INT impacto.'
      },
      {
        id: 'terra_trincheira', name: 'Trincheira Instantânea', school: 'Terra', circle: 1,
        description: 'Ergue barreira física do solo.',
        effect: 'Parede de 3x1m adjacente. Concede Cobertura Parcial.'
      },
      {
        id: 'terra_abraco', name: 'Abraço da Terra', school: 'Terra', circle: 2,
        description: 'Mãos de pedra prendem o inimigo.',
        effect: 'Inimigo no chão a 18m. Salvaguarda FOR ou Imobilizado. Ataques contra ele têm Vantagem.'
      },
      {
        id: 'terra_onda', name: 'Onda de Tremor', school: 'Terra', circle: 2,
        description: 'Onda sísmica que derruba.',
        effect: 'Cone 6m. Salvaguarda FOR. 2d6 impacto e Prostrado. Cria terreno difícil.'
      },
      {
        id: 'terra_erupcao', name: 'Erupção de Espinhos', school: 'Terra', circle: 3,
        description: 'Zona de morte de lanças de pedra.',
        effect: 'Raio 6m a 24m. Salvaguarda DES. 4d8 perfurante. Terreno difícil perigoso.'
      }
    ]
  },
  {
    id: 'luz',
    name: 'Escola da Luz',
    quote: '“Um caminho iluminado é aquele em que se sabe onde seu pé irá tocar o chão”',
    description: 'Estuda a Clareza e a Verdade. Bane as sombras e revela o oculto. Representa a visão física e a clareza de propósito.',
    spells: [
      {
        id: 'luz_raio', name: 'Raio Guia', school: 'Luz', circle: 1,
        description: 'Feixe de luz que marca o inimigo.',
        effect: 'Ataque a 24m. 1d8+INT radiante. Próximo ataque contra alvo tem Vantagem.'
      },
      {
        id: 'luz_clarao', name: 'Clarão', school: 'Luz', circle: 1,
        description: 'Explosão súbita de luz branca.',
        effect: 'Inimigo a 9m. Salvaguarda CON ou Cego até fim do próximo turno.'
      },
      {
        id: 'luz_visao', name: 'Visão da Verdade', school: 'Luz', circle: 1,
        description: 'Permite ver através de sombras.',
        effect: 'Aliado ganha Visão no Escuro 18m e vê auras mágicas por 10 min.'
      },
      {
        id: 'luz_esfera', name: 'Esfera da Alvorada', school: 'Luz', circle: 2,
        description: 'Esfera de luz do dia pura.',
        effect: 'Luz Plena 9m raio. Anula invisibilidade e furtividade na área.'
      },
      {
        id: 'luz_marca', name: 'Marca do Julgamento', school: 'Luz', circle: 2,
        description: 'Runa de punição sobre a cabeça.',
        effect: 'Inimigo a 18m. Salvaguarda SAB ou sofre 1d8 automático todo turno (1 min).'
      },
      {
        id: 'luz_pilar', name: 'Pilar Solar', school: 'Luz', circle: 3,
        description: 'Coluna de luz solar direta do céu.',
        effect: 'Cilindro 3m raio a 24m. Salvaguarda CON. 5d8+INT radiante e Cego (1 min).'
      }
    ]
  },
  {
    id: 'energia',
    name: 'Escola de Energia',
    quote: '“A faísca de todas decisões... é o mesmo do relâmpago que incendeia uma floresta”',
    description: 'Estuda o Impulso e a Velocidade. Magia bruta do trovão, focada em reflexos ampliados e descargas instantâneas.',
    spells: [
      {
        id: 'ener_disparo', name: 'Disparo Estático', school: 'Energia', circle: 1,
        description: 'Arco de eletricidade.',
        effect: 'Ataque a 18m. 1d10+INT elétrico. Vantagem contra armadura de metal.'
      },
      {
        id: 'ener_toque', name: 'Toque de Choque', school: 'Energia', circle: 1,
        description: 'Perturba o sistema nervoso.',
        effect: 'Melee. 2d8+INT elétrico. Alvo perde Reações.'
      },
      {
        id: 'ener_reflexos', name: 'Reflexos Ampliados', school: 'Energia', circle: 1,
        description: 'Acelera a percepção do tempo.',
        effect: 'Ação Bônus. +3m deslocamento e +2 CA contra ataques de oportunidade.'
      },
      {
        id: 'ener_cadeia', name: 'Cadeia de Raios', school: 'Energia', circle: 2,
        description: 'Raio que salta entre inimigos.',
        effect: '3 alvos a 18m. Salvaguarda DES. 3d6 (primário) e 1d6 (secundários) elétrico.'
      },
      {
        id: 'ener_passo', name: 'Passo da Centelha', school: 'Energia', circle: 2,
        description: 'Transforma corpo em eletricidade.',
        effect: 'Ação Bônus. Teleporte 9m.'
      },
      {
        id: 'ener_relampago', name: 'Relâmpago', school: 'Energia', circle: 3,
        description: 'Linha devastadora de energia.',
        effect: 'Linha 30m. Salvaguarda DES. 8d6 elétrico (metade se passar).'
      }
    ]
  },
  {
    id: 'som',
    name: 'Escola do Som',
    quote: '“O som não é apenas o que seus ouvidos escutam, é a vibração que o mundo emite.”',
    description: 'Estuda a Agitação e Ressonância. Magia da influência e memória, usando vibrações para desorientar e destruir.',
    spells: [
      {
        id: 'som_trovao', name: 'Trovão Menor', school: 'Som', circle: 1,
        description: 'Cone de ar comprimido.',
        effect: 'Cone 4,5m. Salvaguarda CON. 2d6+INT trovejante e empurra 3m.'
      },
      {
        id: 'som_vibra', name: 'Vibração Perturbadora', school: 'Som', circle: 1,
        description: 'Frequência que causa náusea.',
        effect: 'Alvo a 18m. Salvaguarda CON ou 1d8+INT psíquico e Desorientado (Desvantagem).'
      },
      {
        id: 'som_vacuo', name: 'Vácuo de Silêncio', school: 'Som', circle: 2,
        description: 'Zona de silêncio absoluto.',
        effect: 'Esfera 6m raio. Silêncio total. Impede magias verbais. Imunidade trovejante.'
      },
      {
        id: 'som_ruptura', name: 'Frequência de Ruptura', school: 'Som', circle: 2,
        description: 'Ressonância que quebra rígidos.',
        effect: '4d10+INT em estruturas/Golems. Em armaduras: 3d8+INT e -1 CA.'
      },
      {
        id: 'som_eco', name: 'Eco do Comando', school: 'Som', circle: 2,
        description: 'Vibração modula voz interior.',
        effect: 'Salvaguarda SAB. Alvo obedece comando de uma palavra (Ataque, Corra, etc).'
      },
      {
        id: 'som_clamor', name: 'Clamor do Passado', school: 'Som', circle: 3,
        description: 'Grito psíquico com ecos de violência.',
        effect: 'Raio 9m a 24m. Salvaguarda INT. 4d8 psíquico e Atordoado.'
      }
    ]
  },
  {
    id: 'natureza',
    name: 'Escola da Natureza',
    quote: '“A complexa rede de um ecossistema não difere de uma teia de aranha...”',
    description: 'Estuda a Coexistência e a Sobrevivência. Conecta seres vivos, mas lembra que a vida consome vida.',
    spells: [
      {
        id: 'nat_raizes', name: 'Raízes Constritoras', school: 'Natureza', circle: 1,
        description: 'Raízes prendem o inimigo.',
        effect: 'Alvo a 18m. Salvaguarda FOR ou Imobilizado.'
      },
      {
        id: 'nat_veneno', name: 'Disparo Venenoso', school: 'Natureza', circle: 1,
        description: 'Fluídos cáusticos.',
        effect: 'Ataque. 1d10+INT veneno. Salvaguarda CON ou Envenenado.'
      },
      {
        id: 'nat_casca', name: 'Pele de Casca', school: 'Natureza', circle: 2,
        description: 'Endurece superfície do aliado.',
        effect: 'Toque. CA mínima torna-se 16 por 1 hora.'
      },
      {
        id: 'nat_ciclo', name: 'Ciclo de Predação', school: 'Natureza', circle: 2,
        description: 'Rouba força vital.',
        effect: 'Toque. 3d6+INT necrótico. Cura metade do dano em você ou aliado.'
      },
      {
        id: 'nat_memoria', name: 'Memória Instintiva', school: 'Natureza', circle: 3,
        description: 'Estimula cérebro primitivo.',
        effect: 'Raio 4,5m. Salvaguarda SAB ou perde controle (50% Fuga / 50% Ataque Cego).'
      }
    ]
  },
  {
    id: 'ceu',
    name: 'Escola do Céu',
    quote: '“Como é saber que independente do quanto você suba, sempre vai ter algo em cima de ti?”',
    description: 'Estuda o Conhecimento e Autoridade. A pressão da atmosfera e a onisciência do observador supremo.',
    spells: [
      {
        id: 'ceu_sopro', name: 'Sopro Descendente', school: 'Céu', circle: 1,
        description: 'Pressão atmosférica esmaga.',
        effect: 'Alvo a 18m. Salvaguarda FOR. 1d8+INT impacto e Prostrado.'
      },
      {
        id: 'ceu_ventos', name: 'Ventos Protetores', school: 'Céu', circle: 1,
        description: 'Rajada de autoridade física.',
        effect: 'Cone 9m. Salvaguarda FOR. Empurra 6m + 2d6 dano se colidir.'
      },
      {
        id: 'ceu_ascensao', name: 'Ascensão', school: 'Céu', circle: 2,
        description: 'Altera densidade para voar.',
        effect: 'Voo 9m (10 min). Vantagem em ataques contra alvos no chão.'
      },
      {
        id: 'ceu_vacuo', name: 'Vácuo', school: 'Céu', circle: 2,
        description: 'Remove ar ao redor da cabeça.',
        effect: 'Alvo a 18m. Salvaguarda CON. 3d6+INT necrótico e Silenciado.'
      },
      {
        id: 'ceu_opressao', name: 'Opressão Perene', school: 'Céu', circle: 3,
        description: 'Peso da atmosfera torna-se insuportável.',
        effect: 'Alvo a 18m. Salvaguarda SAB ou Paralisado/Sufocando. Dano progressivo se falhar.'
      }
    ]
  }
];

// Helper para pegar todas as magias de forma plana, se precisar
export const ALL_SPELLS = MAGIC_SCHOOLS.flatMap(school => school.spells);