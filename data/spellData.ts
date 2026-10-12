// src/data/magicSchoolData.ts
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
    id: "agua",
    name: "Escola da Água",
    quote:
      "“Muito se fala sobre a natureza mutável da água dos rios, mas pouco se fala de sua orla sendo carregado por elas”",
    description:
      "A Escola da Água não estuda apenas o líquido, mas o princípio do Movimento Constante e da Adaptação. Para os acadêmicos de Pharos, a água é o relógio do mundo; ela representa a erosão que derruba montanhas e o sangue que nutre a vida. Seus magos agem como médicos e estrategistas, compreendendo que a melhor defesa não é a rigidez, mas a fluidez. Eles manipulam o ciclo hidrológico para curar, reposicionar aliados e punir a estagnação dos inimigos com a pressão esmagadora das profundezas ou a rigidez do gelo.",
    spells: [
      {
        id: "agua_lavar",
        name: "Lavar Feridas",
        school: "Agua",
        circle: 1,
        description:
          "O mago controla os fluídos de uma pessoa para acelerar a coagulação e limpar infecções.",
        effect: "Cura 2d6 + INT em um aliado a até 18m.",
        cost: 2,
        isAttack: false,
        actionType: "Padrão",
        isHealing: true,
        healFormula: "2d6",
      },
      {
        id: "agua_correnteza",
        name: "Correnteza Auxiliadora",
        school: "Agua",
        circle: 1,
        description:
          "Você cria uma fina camada de água sob os pés de um aliado, permitindo que ele deslize pelo campo de batalha como se fosse carregado por um rio.",
        effect:
          "Escolha um aliado à até 18m. Ele pode mover a metade de seu movimento padrão à mais em seu turno.",
        cost: 2,
        isAttack: false,
        actionType: "Ação Bônus",
      },
      {
        id: "agua_congelar",
        name: "Congelar Superfície",
        school: "Agua",
        circle: 1,
        description:
          " Você condensa a umidade do ar no chão e a congela instantaneamente, transformando o piso em uma armadilha escorregadia.",
        effect:
          "Você forma uma poça de água e congela  um círculo de área de 6m, todos que passam nessa superfície, ou começam seu turno nela, devem fazer um teste de Salvaguarda de Destreza, caso falhem, eles caem e ficam Prostrados.",
        cost: 2,
        isAttack: false,
        actionType: "Padrão",
      },
      {
        id: "agua_torrente",
        name: "Torrente Restauradora",
        school: "Agua",
        circle: 2,
        description:
          "Uma onda de água pura e brilhante envolve o alvo, penetrando seus poros para lavar toxinas, magias nocivas e aflições físicas.",
        effect:
          "Escolha um aliado a até 18m. Você remove imediatamente uma condição negativa que o aflija, como: Paralisia, Cegueira, Envenenamento ou Fraqueza.",
        cost: 4,
        isAttack: false,
        actionType: "Padrão",
      },
      {
        id: "agua_lanca",
        name: "Lança Gelada",
        school: "Agua",
        circle: 2,
        description:
          " Você retira a água da atmosfera e a comprime em uma estaca de gelo dura como diamante, lançando-a com violência para perfurar e congelar o inimigo",
        effect:
          "Realize um ataque mágico à distância contra um inimigo a até 24m. Se acertar, causa 3d6 + Inteligência de dano perfurante. Além disso, ele deve realizar uma Salvaguarda de Constituição, caso falhe, ele perde metade de seu deslocamento.",
        cost: 4,
        isAttack: true,
        damageFormula: "3d6+(@INT/@SAB)",
        actionType: "Padrão",
      },
      {
        id: "agua_parede",
        name: "Parede Congelada",
        school: "Agua",
        circle: 3,
        description:
          "Você ergue as mãos e invoca uma barreira maciça de gelo translúcido e espesso, capaz de bloquear exércitos e absorver impactos de canhão.",
        effect:
          "Você cria uma parede de gelo com 9m de largura, 3m de altura e 30cm de espessura em um ponto a até 18m. A parede oferece Cobertura Total. A parede possui 60 Pontos de Vida por seção de 1,5m. Se uma seção for destruída, ela deixa para trás uma nuvem de ar gélido que causa 1d6 de dano de frio a quem passar por ela.",
        cost: 6,
        isAttack: false,
        actionType: "Padrão",
      },
    ],
  },
  {
    id: "fogo",
    name: "Escola do Fogo",
    quote:
      "“Um incêndio oferta tanta mudança quanto uma enchente, mas sua marca é eterna.”",
    description:
      "A Escola do Fogo estuda o princípio da Mudança Violenta e da Entropia. Não se trata apenas da chama de uma tocha, mas do conceito científico de combustão e transformação irreversível de energia. Magos desta escola entendem que a civilização é construída sobre o calor e destruída pelo incêndio. Eles manipulam a temperatura para forjar, purificar e devastar, canalizando a ambição e a raiva em explosões controladas que limpam o campo de batalha para que algo novo (ou nada) cresça no lugar.",
    spells: [
      {
        id: "fogo_labaredas",
        name: "Labaredas",
        school: "Fogo",
        circle: 1,
        description:
          "O mago condensa energia térmica em pequenos projéteis de fogo guiados e os dispara.",
        effect:
          "Lance três projéteis independentes em inimigos a até 18 metros. Você pode dividi-los ou focar em um alvo. Cada projétil atinge automaticamente e causa 1d4 de dano de fogo.",
        cost: 2,
        isAttack: true,
        actionType: "Padrão",
        damageFormula: "3d4",
      },
      {
        id: "fogo_maos",
        name: "Mãos Flamejantes",
        school: "Fogo",
        circle: 1,
        description:
          "Você une os polegares e projeta um leque de chamas puras pelas pontas dos dedos.",
        effect:
          "Um cone de 9m a partir de você. Todas as criaturas na área devem fazer uma Salvaguarda de Destreza. Se falharem, sofrem 2d6 + Inteligência de dano de fogo; se passarem, sofrem metade do dano.",
        cost: 2,
        isAttack: true,
        damageFormula: "2d6+(@INT/@SAB)",
        actionType: "Padrão",
      },
      {
        id: "fogo_cortina",
        name: "Cortina de Fumaça",
        school: "Fogo",
        circle: 1,
        description:
          "Você superaquece o ar úmido ou queima componentes alquímicos instantaneamente para criar uma nuvem densa e sufocante.",
        effect:
          "Cria uma área de 6m de raio de fumaça espessa. A área bloqueia a visão (Cegueira para quem está dentro ou tenta ver através). Criaturas dentro da fumaça têm Vantagem para se esconder, mas não podem ver para fora.",
        cost: 2,
        isAttack: false,
        actionType: "Padrão",
      },
      {
        id: "fogo_furia",
        name: "Fúria Flamejante",
        school: "Fogo",
        circle: 2,
        description:
          "Você incendeia o sangue do alvo com uma energia volátil e potente, transformando suas emoções em pura agressividade descontrolada.",
        effect:
          " Escolha qualquer personagem em um raio de 18m. O alvo deve realizar uma Salvaguarda de Sabedoria. Se falhar, ele entrará em um estado de fúria até o final do próximo turno dele. Enquanto estiver nesse estado, a criatura é obrigada a atacar o personagem mais próximo (seja aliado ou inimigo) com Vantagem.",
        cost: 4,
        isAttack: false,
        actionType: "Padrão",
      },
      {
        id: "fogo_esquentar",
        name: "Esquentar Metal",
        school: "Fogo",
        circle: 2,
        description:
          "Você excita as moléculas de um objeto metálico manufaturado, fazendo-o brilhar em brasa incandescente instantaneamente.",
        effect:
          "Escolha um objeto de metal manufaturado (como uma arma ou armadura) que uma criatura a até 18m esteja segurando ou vestindo. A criatura sofre 3d6 de dano de fogo. Se estiver segurando o objeto, deve passar em uma Salvaguarda de Constituição ou soltá-lo imediatamente; se não puder soltar (ou for armadura), ela tem Desvantagem em jogadas de ataque e testes de habilidade enquanto o feitiço durar (requer Concentração).",
        cost: 4,
        isAttack: true,
        damageFormula: "3d6",
        actionType: "Padrão",
      },
      {
        id: "fogo_bola",
        name: "Bola de Fogo",
        school: "Fogo",
        circle: 3,
        description:
          "Você condensa uma partícula de energia instável e a arremessa, causando uma detonação catastrófica.",
        effect:
          "Escolha um ponto a até 36m. Uma esfera de 6m de raio explode em chamas. Todas as criaturas na área devem fazer uma Salvaguarda de Destreza. Se falharem, sofrem 5d6 de dano de fogo. Se passarem, sofrem metade. O fogo se espalha por cantos e inflama objetos inflamáveis que não estejam sendo usados ou carregados.",
        cost: 6,
        isAttack: true,
        damageFormula: "5d6",
        actionType: "Padrão",
      },
    ],
  },
  {
    id: "terra",
    name: "Escola da Terra",
    quote:
      "“Pra tirar aquela pedra vai ser uma trabalheira, melhor construir sua casa em outro canto.”",
    description:
      "Essa Escola estuda o princípio de permanência, inércia e imutabilidade. É a magia da estabilidade encontrada nas fundações do mundo, nas cavernas profundas e nos minerais preciosos. Onde a Água é movimento, a Terra é quietude; onde o Fogo consome, a Terra preserva. Seus magos, compreendem a magia da defesa absoluta, da gravidade e da força paciente de uma montanha. Eles não desviam de golpes; eles se tornam duros demais para serem feridos",
    spells: [
      {
        id: "terra_pele",
        name: "Pele de Granito",
        school: "Terra",
        circle: 1,
        description:
          "O mago endurece a pele do alvo, dando-lhe a resistência da rocha viva.",
        effect:
          "Toque um aliado. Por 1 minuto (Concentração), a pele dele assume uma textura rochosa. Ele ganha +2 na Classe de Armadura (CA).",
        cost: 2,
        isAttack: false,
        actionType: "Padrão",
      },
      {
        id: "terra_projetil",
        name: "Projétil de Rocha",
        school: "Terra",
        circle: 1,
        description:
          "Você arranca um pedaço do solo e o arremessa com força balística contra o inimigo.",
        effect:
          " Realize um ataque mágico à distância contra um alvo a até 18m. Se acertar, causa 2d6 + Inteligência de dano de impacto (Concussão).",
        cost: 2,
        isAttack: true,
        damageFormula: "2d6+(@INT/@SAB)",
        actionType: "Padrão",
      },
      {
        id: "terra_trincheira",
        name: "Trincheira Instantânea",
        school: "Terra",
        circle: 1,
        description:
          "Você comanda o solo a se erguer, criando uma barreira física imediata.",
        effect:
          "Você ergue uma parede de terra compactada de 3m de largura e 1m de altura em um ponto adjacente a você. Isso concede Cobertura Leve para quem estiver agachado atrás dela. A trincheira dura até ser destruída ou desfeita.",
        cost: 2,
        isAttack: false,
        actionType: "Padrão",
      },
      {
        id: "terra_abraco",
        name: "Abraço da Terra",
        school: "Terra",
        circle: 2,
        description:
          "Mãos de pedra ou raízes minerais brotam do chão e agarram as pernas do inimigo, tentando o arrastar para as profundezas da terra",
        effect:
          "Escolha um inimigo a até 18m que esteja no chão. O alvo sofre 2d6 + Inteligência imediatamente e deve realizar uma Salvaguarda de Força. Se falhar, fica Imobilizado. Para se libertar, a criatura deve gastar sua Ação para realizar um teste de Força contra sua CD. Se não o fizer, continua presa e sofre mais 1d6 de dano no início de cada turno dela.",
        cost: 4,
        isAttack: true,
        damageFormula: "2d6+(@INT/@SAB)",
        actionType: "Padrão",
      },
      {
        id: "terra_onda",
        name: "Onda de Tremor",
        school: "Terra",
        circle: 2,
        description:
          "Você bate no chão, enviando uma onda sísmica que derruba quem estiver no caminho.",
        effect:
          "Um cone de 6m a partir de você. Todas as criaturas no chão devem fazer uma Salvaguarda de Força. Se falharem, sofrem 2d8 de dano de impacto e ficam Prostradas (derrubadas). O chão na área torna-se terreno difícil (rachado).",
        cost: 4,
        isAttack: true,
        damageFormula: "2d8",
        actionType: "Padrão",
      },
      {
        id: "terra_erupcao",
        name: "Erupção de Espinhos",
        school: "Terra",
        circle: 3,
        description:
          "Você transforma o solo em uma zona de morte, fazendo lanças de pedra perfurarem tudo em uma área.",
        effect:
          "Escolha um ponto a até 24m. O chão em um raio de 6m explode em espinhos de pedra. Criaturas na área devem fazer uma Salvaguarda de Destreza. Se falharem, sofrem 4d6 de dano perfurante; se passarem, metade. A área permanece como Terreno Difícil perigoso (causa 1d4 de dano para cada 1,5m andado nela).",
        cost: 6,
        isAttack: true,
        damageFormula: "4d6",
        actionType: "Padrão",
      },
    ],
  },
  {
    id: "luz",
    name: "Escola da Luz",
    quote:
      "“Um caminho iluminado é aquele em que se sabe onde seu pé irá tocar o chão”",
    description:
      "Essa Escola estuda o princípio da clareza e da visão. Emanando do sol e do céu diurno, é a magia da verdade, da revelação e da ordem. Ela bane as sombras, tanto literal quanto metafórica. Não representa apenas a visão física, mas a 'clareza de propósito' e a capacidade de perceber os 'caminhos' do destino, revelando o que está oculto e queimando a mentira",
    spells: [
      {
        id: "luz_raio",
        name: "Raio Guia",
        school: "Luz",
        circle: 1,
        description:
          "Você dispara um feixe de luz concentrada que marca o inimigo, facilitando o próximo golpe.",
        effect:
          "Realize um ataque mágico à distância contra um inimigo a até 24m. Se acertar, causa 1d8 + Inteligência de dano radiante. Além disso, o próximo ataque realizado contra esse alvo (por você ou um aliado) tem Vantagem, pois o brilho residual guia o golpe.",
        cost: 2,
        isAttack: true,
        damageFormula: "1d8+(@INT/@SAB)",
        actionType: "Padrão",
      },
      {
        id: "luz_clarao",
        name: "Clarão",
        school: "Luz",
        circle: 1,
        description:
          "Uma explosão súbita de luz branca que sobrecarrega os olhos do inimigo.",
        effect:
          " Escolha um inimigo a até 9m. Ele deve fazer uma Salvaguarda de Constituição. Se falhar, fica Cego até o final do próximo turno dele",
        cost: 2,
        isAttack: false,
        actionType: "Padrão",
      },
      {
        id: "luz_visao",
        name: "Visão da Verdade",
        school: "Luz",
        circle: 1,
        description:
          "Você toca seus olhos ou os de um aliado, permitindo ver através de sombras e artifícios.",
        effect:
          "Toque um aliado. Por 10 minutos, ele ganha Visão no Escuro (18m) e pode ver auras mágicas ativas. Ele não pode ser surpreendido por inimigos escondidos em sombras.",
        cost: 2,
        isAttack: false,
        actionType: "Padrão",
      },
      {
        id: "luz_esfera",
        name: "Esfera da Alvorada",
        school: "Luz",
        circle: 2,
        description:
          "Você cria uma esfera flutuante de luz do dia pura, que queima a escuridão e revela inimigos escondidos.",
        effect:
          "Você cria uma luz de 9m de raio em um ponto a até 18m. A área é considerada 'Luz Plena' (anula escuridão mágica). Inimigos dentro da luz não podem se beneficiar de Invisibilidade ou Furtividade.",
        cost: 4,
        isAttack: false,
        actionType: "Padrão",
      },
      {
        id: "luz_marca",
        name: "Marca do Julgamento",
        school: "Luz",
        circle: 2,
        description:
          "Você inscreve uma runa de luz sobre a cabeça de um inimigo, punindo-o por suas ações violentas.",
        effect:
          "Escolha um inimigo a até 18m. Ele deve fazer uma Salvaguarda de Sabedoria. Se falhar, é marcado por 1 minuto (Concentração). Em todo início de seu turno, ele leva 1d8 automaticamente.",
        cost: 4,
        isAttack: false,
        actionType: "Padrão",
      },
      {
        id: "luz_pilar",
        name: "Pilar Solar",
        school: "Luz",
        circle: 3,
        description:
          "Você invoca uma coluna de luz solar direta do céu (ou do teto), incinerando tudo em um cilindro vertical.",
        effect:
          "Escolha um ponto a até 24m. Um cilindro de luz de 3m de raio e 12m de altura desce sobre o local. Todas as criaturas na área devem fazer uma Salvaguarda de Constituição. Se falharem, sofrem 4d8 + Atributo de dano radiante e ficam Cegas por 1 minuto. Se passarem, sofrem metade do dano e não ficam cegas.",
        cost: 6,
        isAttack: true,
        damageFormula: "4d8",
        actionType: "Padrão",
      },
    ],
  },
  {
    id: "energia",
    name: "Escola de Energia",
    quote:
      "“A faísca de todas decisões... é o mesmo do relâmpago que incendeia uma floresta”",
    description:
      "Essa Escola estuda o princípio do impulso e o lampejo das ideias. É o poder bruto e não refinado do trovão e do relâmpago. É a centelha da inspiração, a vontade súbita de agir e o catalisador para o fogo. Magos desta escola manipulam o potencial elétrico para reduzir a lacuna entre o pensamento e a ação, focando em velocidade extrema, reflexos ampliados e descargas de poder instantâneo que atordoam ou vaporizam a oposição.",
    spells: [
      {
        id: "ener_disparo",
        name: "Disparo Estático",
        school: "Energia",
        circle: 1,
        description:
          "Você aponta o dedo e libera um arco de eletricidade contra um inimigo.",
        effect:
          "Realize um ataque mágico à distância contra um inimigo a até 18m. Se acertar, causa 1d10 + Atributo de dano elétrico. Se o alvo estiver vestindo armadura de metal, você tem Vantagem na jogada de ataque.",
        cost: 2,
        isAttack: true,
        damageFormula: "1d10",
        actionType: "Padrão",
      },
      {
        id: "ener_toque",
        name: "Toque de Choque",
        school: "Energia",
        circle: 1,
        description:
          "Você carrega sua mão com uma carga elétrica que perturba o sistema nervoso do inimigo.",
        effect:
          "Realize um ataque corpo a corpo mágico. Se acertar, causa 2d8 + Inteligência de dano elétrico e o alvo sofre um espasmo muscular violento: ele não pode usar Reações até o início do próximo turno dele.",
        cost: 2,
        isAttack: true,
        damageFormula: "2d8+(@INT/@SAB)",
        actionType: "Padrão",
      },
      {
        id: "ener_reflexos",
        name: "Reflexos Ampliados",
        school: "Energia",
        circle: 1,
        description:
          "Você estimula seus próprios nervos com micro-descargas, acelerando sua percepção do tempo.",
        effect:
          "Até o final do seu próximo turno, seu deslocamento aumenta em 3m e você ganha +2 na Classe de Armadura (CA) contra ataques de oportunidade.",
        cost: 2,
        isAttack: false,
        actionType: "Ação Bônus",
      },
      {
        id: "ener_cadeia",
        name: "Cadeia de Raios",
        school: "Energia",
        circle: 2,
        description:
          "Você dispara um raio que atinge um inimigo e salta para outros próximos, criando uma rede de eletricidade.",
        effect:
          "Escolha um alvo a até 18m e até dois outros alvos a 3m do primeiro. Todos devem fazer uma Salvaguarda de Destreza. O alvo primário sofre 3d6 de dano elétrico e os secundários sofrem 1d6, ou metade se passarem no teste",
        cost: 4,
        isAttack: true,
        damageFormula: "3d6",
        actionType: "Padrão",
      },
      {
        id: "ener_passo",
        name: "Passo da Centelha",
        school: "Energia",
        circle: 2,
        description:
          "Você acelera suas sinapses de uma forma impossível, acelerando suas ações de forma extrema, parecendo “teleportar” para outro ponto.",
        effect:
          "Como uma Ação Bônus, você se “teleporta” para um espaço desocupado que possa ver a até 9m.",
        cost: 4,
        isAttack: false,
        actionType: "Ação Bônus",
      },
      {
        id: "ener_relampago",
        name: "Relâmpago",
        school: "Energia",
        circle: 3,
        description: "Você dispara uma linha devastadora de energia elétrica.",
        effect:
          "Uma linha de 30m de comprimento e 1,5m de largura sai de você. Todas as criaturas na linha devem fazer uma Salvaguarda de Destreza. Se falharem, sofrem 8d6 de dano elétrico. Se passarem, sofrem metade.",
        cost: 6,
        isAttack: true,
        damageFormula: "8d6",
        actionType: "Padrão",
      },
    ],
  },
  {
    id: "som",
    name: "Escola do Som",
    quote:
      "“O som não é apenas o que seus ouvidos escutam, é a vibração que o mundo emite.”",
    description:
      "A Escola do Som estuda o princípio da agitação, ressonância e os ecos do passado. Ela emana dos gritos de animais, do rugido das multidões e da vibração tectônica do próprio mundo. Para os estudiosos de Pharos, o som é a magia da influência e da memória; uma frequência, uma vez emitida, nunca desaparece completamente, apenas diminui.",
    spells: [
      {
        id: "som_trovao",
        name: "Trovão Menor",
        school: "Som",
        circle: 1,
        description:
          "Você bate as mãos ou bate o pé no chão, enviando um cone de ar comprimido e som agudo que empurra tudo à frente.",
        effect:
          "Um cone de 4,5m a partir de você. Todas as criaturas na área devem fazer uma Salvaguarda de Constituição. Se falharem, sofrem 2d6 + Atributo de dano trovejante e são empurradas 3m para trás. Se passarem, sofrem metade do dano e não são empurradas.",
        cost: 2,
        isAttack: true,
        damageFormula: "2d6+(@INT/@SAB)",
        actionType: "Padrão",
      },
      {
        id: "som_vibra",
        name: "Vibração Perturbadora",
        school: "Som",
        circle: 1,
        description:
          "Você isola uma frequência que causa náusea e desorientação, sussurrando palavras que reverberam diretamente no crânio do alvo.",
        effect:
          "Escolha uma criatura a até 18m. Ela deve realizar uma Salvaguarda de Constituição para resistir ao enjoo súbito. Se falhar: O alvo sofre 1d8 + Atributo de dano psíquico e fica Desorientado. Enquanto estiver desorientado, ele sofre Desvantagem na próxima jogada de ataque ou teste de perícia que realizar até o final do próximo turno dele. Se passar: O alvo sofre metade do dano e consegue ignorar a náusea, não sofrendo desvantagem.",
        cost: 2,
        isAttack: true,
        damageFormula: "1d8+(@INT/@SAB)",
        actionType: "Padrão",
      },
      {
        id: "som_vacuo",
        name: "Vácuo de Silêncio",
        school: "Som",
        circle: 2,
        description:
          "Você para a vibração do ar em uma área específica, criando uma zona de silêncio absoluto onde nenhum som pode ser criado ou ouvido.",
        effect:
          "Escolha um ponto a até 18m. Uma esfera de 6m de raio torna-se totalmente silenciosa (Concentração por 1 minuto). Criaturas dentro dela são consideradas Surdas, possuem Imunidade a dano trovejante e, crucialmente, não podem lançar magias que exijam componentes verbais.",
        cost: 4,
        isAttack: false,
        actionType: "Padrão",
      },
      {
        id: "som_ruptura",
        name: "Frequência de Ruptura",
        school: "Som",
        circle: 2,
        description:
          "Você emite um som contínuo e agudo focado na frequência de ressonância de materiais rígidos, fazendo metal e pedra vibrarem violentamente até racharem.",
        effect:
          "Escolha um alvo a até 18m. Se o alvo for uma estrutura inanimada ou um Constructo (Golem), ele sofre 4d6 + Atributo de dano trovejante. Se for uma criatura vestindo armadura pesada ou feita de material rígido (como quitina de insetos gigantes), ela deve fazer uma Salvaguarda de Constituição. Se falhar, sofre 3d6 + Atributo de dano e sua CA é reduzida em -1 até a armadura ser reparada",
        cost: 4,
        isAttack: true,
        damageFormula: "3d6+(@INT/@SAB)",
        actionType: "Padrão",
      },
      {
        id: "som_eco",
        name: "Eco do Comando",
        school: "Som",
        circle: 2,
        description:
          "Você isola a frequência vocal do alvo e projeta uma vibração modulada que ressoa diretamente nos ossos do ouvido dele. O comando não soa como uma ordem externa, mas como a voz interior do próprio alvo ou a ordem urgente de um aliado, enganando seu cérebro para obedecer reflexamente.",
        effect:
          "Escolha uma criatura a até 18m que possa ouvir você. Ela deve realizar uma Salvaguarda de Sabedoria. Se falhar, ela deve usar sua próxima Ação para realizar uma tarefa específica de uma palavra que você ordenar (ex: 'Ataque', 'Corra', 'Largue', 'Pare').O comando falha automaticamente se a ordem for diretamente suicida (ex: 'Pule' em um abismo ou 'Se esfaqueie').",
        cost: 4,
        isAttack: false,
        actionType: "Padrão",
      },
      {
        id: "som_clamor",
        name: "Clamor do Passado",
        school: "Som",
        circle: 3,
        description:
          "Você amplifica os 'ecos' de dor e violência que ocorreram no local ao longo dos séculos, liberando-os em um grito psíquico devastador que sobrecarrega a mente e o corpo.",
        effect:
          "Escolha um ponto a até 24m. Todas as criaturas em um raio de 9m devem fazer uma Salvaguarda de Inteligência. Se falharem, sofrem 3d8 de dano psíquico e ficam Atordoadas, até o final do seu próximo turno, oprimidas pelas visões e sons do passado. Se passarem, sofrem metade do dano e não ficam atordoadas.",
        cost: 6,
        isAttack: true,
        damageFormula: "3d8",
        actionType: "Padrão",
      },
    ],
  },
  {
    id: "natureza",
    name: "Escola da Natureza",
    quote:
      "“A complexa rede de um ecossistema não difere de uma teia de aranha...”",
    description: "A Escola da Natureza estuda o princípio da coexistência e harmonia, mas também da sobrevivência fria e indiferente. É a magia que rege todas as coisas vivas, conectando árvores, animais e os sistemas complexos de uma floresta. Para os acadêmicos de Pharos, ela representa a 'teia da vida' e a beleza do crescimento, mas eles nunca esquecem seu lado impiedoso: na natureza, a vida deve consumir outra vida para persistir..",
    spells: [
      {
        id: "nat_raizes",
        name: "Raízes Constritoras",
        school: "Natureza",
        circle: 1,
        description: "Você acelera o crescimento de raízes e cipós sob os pés do inimigo, que irrompem do solo para esmagá-lo e prendê-lo.",
        effect: "Escolha um alvo a até 18m. Ele deve fazer uma Salvaguarda de Força. Se falhar, ele fica Imobilizado. No início de cada turno dele, ele pode repetir o teste para se soltar. Se passar, não fica preso.",
        cost: 2,
        isAttack: false,
        actionType: "Padrão",
      },
      {
        id: "nat_veneno",
        name: "Disparo Venenoso",
        school: "Natureza",
        circle: 1,
        description: "Você condensa fluídos cáusticos ou veneno de serpente na ponta dos dedos e dispara contra os olhos ou feridas abertas do oponente.",
        effect: " Realize um Ataque Mágico à distância. Se acertar, causa 1d8 + Inteligência de dano de veneno. Além disso, o alvo deve fazer uma Salvaguarda de Constituição; se falhar, fica Envenenado até o final do próximo turno dele.",
        cost: 2,
        isAttack: true,
        damageFormula: "1d8+(@INT/@SAB)",
        actionType: "Padrão",
      },
      {
        id: "nat_casca",
        name: "Pele de Casca",
        school: "Natureza",
        circle: 2,
        description: "Você endurece a superfície de um aliado, concedendo-lhe a resiliência passiva de um carvalho, sem tirar sua mobilidade.",
        effect: "Toque um aliado voluntário. Por 1 hora, a CA dele não pode ser menor que 16 (independente da armadura que vista). O feitiço termina se você o lançar novamente ou se o alvo equipar uma armadura que dê CA maior",
        cost: 4,
        isAttack: false,
        actionType: "Padrão",
      },
      {
        id: "nat_ciclo",
        name: "Ciclo de Predação",
        school: "Natureza",
        circle: 2,
        description: "Você impõe a lei da selva, conectando sua força vital à do inimigo e forçando a energia dele a nutrir a sua.",
        effect: "Realize um Ataque Mágico de toque (corpo a corpo) contra uma criatura. Se acertar, causa 3d6 + Inteligência de dano necrótico. Você, ou um aliado em até 9m,  recupera Pontos de Vida iguais à metade do dano causado.",
        cost: 4,
        isAttack: true,
        damageFormula: "3d6+(@INT/@SAB)",
        actionType: "Padrão",
      },
      {
        id: "nat_memoria",
        name: "Memória Instintiva",
        school: "Natureza",
        circle: 3,
        description: "Você ignora a consciência superior do alvo e estimula diretamente a parte mais primitiva de seu cérebro, forçando uma reação biológica imediata de sobrevivência.",
        effect: "Escolha um ponto a até 18m. Todas as criaturas em um raio de 4,5m devem fazer uma Salvaguarda de Sabedoria. Se falharem, o instinto delas assume o controle por 1 turno, onde fará outro teste. No início do turno de cada criatura afetada, o Mestre (ou o jogador) joga uma moeda (ou 1d6: par/ímpar): Cara / Par (Fuga): A criatura é dominada pelo pânico. Ela gasta sua ação para realizar a ação de Correr e se mover o mais longe possível de qualquer ameaça. Se não tiver para onde fugir, ela se encolhe (Fica Caída/Prostrada). Coroa/ Ímpar (Luta): A criatura é dominada pela adrenalina cega. Ela é obrigada a atacar a criatura hostil mais próxima, mas devido ao desespero, sofre Desvantagem em todas as jogadas de ataque",
        cost: 6,
        isAttack: false,
        actionType: "Padrão",
      },
    ],
  },
  {
    id: "ceu",
    name: "Escola do Céu",
    quote:
      "“Como é saber que independente do quanto você suba, sempre vai ter algo em cima de ti?”",
    description: "A Escola do Céu estuda o princípio do conhecimento e da autoridade. Ela não rege apenas os ventos e tempestades, mas a atmosfera que pressiona o mundo, o ar que todos respiram e a vastidão intocável do cosmos. Para os acadêmicos, o céu é o observador supremo; ele está 'sempre lá, cercando tudo'. Esse ponto de vista onisciente representa a sabedoria (ver o todo), mas essa distância intocável também implica autoridade: o direito de julgar e controlar de cima para baixo.",
    spells: [
      {
        id: "ceu_sopro",
        name: "Sopro Descendente",
        school: "Céu",
        circle: 1,
        description: "Você condensa a pressão atmosférica em um ponto acima do inimigo e a faz desabar violentamente, como um martelo invisíve.",
        effect: "Escolha uma criatura a até 18m. Ela deve realizar uma Salvaguarda de Força. Se falhar, sofre 1d8 + Inteligência de dano de impacto e fica Prostrado, esmagada contra o chão pelo peso do ar. Se passar, sofre metade do dano e não cai.",
        cost: 2,
        isAttack: true,
        damageFormula: "1d8+(@INT/@SAB)",
        actionType: "Padrão",
      },
      {
        id: "ceu_ventos",
        name: "Ventos Protetores",
        school: "Céu",
        circle: 1,
        description: "Você convoca uma rajada de ar súbita e violenta, não apenas como defesa, mas como uma afirmação de autoridade física, ordenando que 'seres inferiores' se afastem imediatamente de sua presença.",
        effect:
          "Você emite um cone de vento forte de 9m a partir de você. Todas as criaturas na área devem realizar uma Salvaguarda de Força.  Se falhar: Elas são arremessadas violentamente 6m para trás em linha reta. Se, durante esse trajeto, elas colidirem com um obstáculo sólido (uma parede, árvore ou outra criatura), o movimento é interrompido e elas sofrem 2d6 + Inteligência de dano de impacto pelo choque. Se passar: Elas conseguem firmar os pés no chão, sendo empurradas apenas 3m e não sofrendo dano de colisão",
        cost: 2,
        isAttack: false,
        actionType: "Padrão",
      },
      {
        id: "ceu_ascensao",
        name: "Ascensão",
        school: "Céu",
        circle: 2,
        description: "Você altera sua densidade em relação ao ar ao redor, reivindicando seu lugar acima dos 'seres terrestres'.",
        effect: "Você ganha Deslocamento de Voo de 9m por 10 minutos (Concentração). Enquanto estiver voando, você tem Vantagem em ataques à distância contra alvos que estejam no chão (terreno mais baixo)",
        cost: 4,
        isAttack: false,
        actionType: "Padrão",
      },
      {
        id: "ceu_vacuo",
        name: "Vácuo",
        school: "Céu",
        circle: 2,
        description: "Você remove a autoridade do inimigo de respirar, criando uma bolha de baixa pressão ao redor de sua cabeça.",
        effect: "Escolha uma criatura a até 18m. Ela deve fazer uma Salvaguarda de Constituição. Se falhar, seus pulmões se esvaziam violentamente; ela sofre 3d6 + Inteligência de dano necrótico (hipóxia) e fica Silenciada (não pode falar ou conjurar magias verbais) até o final do próximo turno dela",
        cost: 4,
        isAttack: true,
        damageFormula: "3d6+(@INT/@SAB)",
        actionType: "Padrão",
      },
      {
        id: "ceu_opressao",
        name: "Opressão Perene",
        school: "Céu",
        circle: 3,
        description: "Você força a mente do inimigo a compreender o peso real da atmosfera acima dele. O ar em seus pulmões torna-se chumbo, e a simples pressão de existir torna-se insuportável.",
        effect:
          "Efeito: Escolha uma criatura a até 18m. Ela deve realizar uma Salvaguarda de Sabedoria.Se passar: A criatura engasga momentaneamente, sofrendo 2d8 de dano psíquico, e o feitiço termina.Se falhar: A criatura entra em estado de Sufocamento Mágico. Ela fica Paralisada (incapaz de se mover ou agir) enquanto agarra a própria garganta. O feitiço exige sua Concentração.No final de cada turno subsequente da criatura, ela deve repetir a Salvaguarda.A cada falha adicional: A criatura cai de joelhos (Prostrada) e sofre 4d8 de dano de força (esmagamento interno).Intervenção: Um aliado adjacente à vítima pode usar sua Ação para fazer um teste de Medicina contra a sua CD de Magia. Se tiver sucesso, ele 'acorda' a vítima do transe, encerrando o feitiço.",
        cost: 6,
        isAttack: true,
        damageFormula: "2d8",
        actionType: "Padrão",
      },
      {
        id: "ceu_folego_cume",
        name: "O Fôlego do Cume",
        school: "Céu",
        circle: 4,
        description:
          "O ar ao redor estala, tornando-se frio, rarefeito e cristalino. A pressão atmosférica aumenta sobre as feridas, fechando-as como torniquetes invisíveis.",
        effect:
          "Raio de 6m a 18m. Todas as criaturas na área recuperam 5d10 + INT/SAB de Pontos de Vida.",
        cost: 0,
        isAttack: false,
        actionType: "Padrão",
        isHealing: true,
        healFormula: "5d10",
        requiredRace: "haotai", // Exclusiva para Haotai
      },
    ],
  },
];

export const ALL_SPELLS = MAGIC_SCHOOLS.flatMap((school) => school.spells);
