import { Specialization } from "../types/rpg";

export const SPECIALIZATIONS: Record<string, Specialization> = {
  // ================= GUERREIRO =================
  gue_encouracado: {
    id: "gue_encouracado",
    name: "Encouraçado",
    classRequired: "Guerreiro",
    description: "Enquanto outros guerreiros buscam a glória na ofensiva, você se tornou uma fortaleza ambulante. Sua armadura é uma extensão do próprio corpo e sua presença transforma qualquer campo de batalha em um muro impossível de atravessar.",
    proficiencyChanges: [
      {
        name: "Mestre das Armaduras",
        description: "Enquanto estiver usando Armadura Pesada, sua Classe de Armadura aumenta em +1. Além disso, você não pode ser Empurrado ou Derrubado por criaturas do mesmo tamanho ou menores.",
        mechanicType: "armor",
        mechanicValue: 1,
      }
    ],
    newStances: [
      {
        id: "gue_bastiao",
        name: "Postura: Bastião (Substitui 'Defensor')",
        benefit: "Você recebe +2 na CA. Sempre que um aliado adjacente sofrer um ataque, você pode usar sua Reação para tornar-se o novo alvo do ataque.",
        restriction: "Seu deslocamento torna-se 3m. Você não pode usar a ação Disparada.",
        maneuver: "(2 Focos - Reação): Quando sofrer dano, reduza-o em 2d8 + Constituição. Caso todo o dano seja reduzido a 0, você recupera 1d4 Pontos de Foco.",
        recovery: "Sempre que impedir completamente o dano de um aliado utilizando sua Reação, recupere 1d4 Pontos de Foco.",
        acBonus: 2
      },
      {
        id: "gue_guarda_implacavel",
        name: "Postura: Guarda Implacável (Substitui 'Ofensiva')",
        benefit: "Sempre que atingir um inimigo com um ataque corpo-a-corpo, ele sofre Desvantagem para atacar qualquer criatura que não seja você até o início do seu próximo turno.",
        restriction: "Seu deslocamento é reduzido pela metade.",
        maneuver: "(4 Focos - Ação Bônus): Escolha uma criatura a até 3m. Até o início do seu próximo turno, ela sofre Desvantagem para atacar qualquer alvo diferente de você.",
        recovery: "Sempre que uma criatura errar um ataque contra você, recupere 1 Ponto de Foco."
      }
    ]
  },
  gue_veterano: {
    id: "gue_veterano",
    name: "O Veterano",
    classRequired: "Guerreiro",
    description: "O Veterano já sobreviveu a batalhas demais para depender apenas da força. Cada cicatriz representa uma lição aprendida, e cada golpe inimigo é percebido. Sua experiência transforma erros dos adversários em oportunidades fatais.",
    proficiencyChanges: [
      {
        name: "Experiência de Guerra",
        description: "Sempre que uma criatura errar um ataque corpo a corpo contra você, seu próximo ataque contra ela recebe +2 na jogada de ataque até o final do seu próximo turno.",
        mechanicType: "passive"
      }
    ],
    newStances: [
      {
        id: "gue_guarda_experiente",
        name: "Postura: Guarda Experiente (Substitui 'Defensiva')",
        benefit: "Sempre que uma criatura errar um ataque corpo a corpo contra você, ela provoca um Ataque de Oportunidade, mesmo que permaneça adjacente.",
        restriction: "Você não pode utilizar a ação Disparada enquanto permanecer nesta postura.",
        maneuver: "(2 Focos - Reação): Quando uma criatura errar um ataque contra você, realize imediatamente um ataque corpo a corpo contra ela. Caso acerte, adicione seu modificador de Constituição ao dano.",
        recovery: "Sempre que acertar um Ataque de Oportunidade, recupere 1d4 Focos."
      },
      {
        id: "gue_ofensiva_calculada",
        name: "Postura: Ofensiva Calculada (Substitui 'Ofensiva')",
        benefit: "Sempre que acertar um ataque corpo a corpo, seu próximo ataque contra a mesma criatura recebe +2 na jogada de ataque.",
        restriction: "Você sofre -1 na CA e não pode utilizar Escudos.",
        maneuver: "(4 Focos - Ação): Sequência Implacável. Realize dois ataques consecutivos contra a mesma criatura. Caso ambos acertem, ela deve realizar uma Salvaguarda de Constituição. Em caso de falha, fica Desequilibrada (Desvantagem na próxima jogada de ataque).",
        recovery: "Ao reduzir uma criatura a 0 PV utilizando um Ataque de Oportunidade ou Sequência Implacável, recupere 1d4 Focos.",
        acBonus: -1
      }
    ]
  },
  gue_espada_escudo: {
    id: "gue_espada_escudo",
    name: "Espada e Escudo",
    classRequired: "Guerreiro",
    description: "Enquanto muitos enxergam o escudo apenas como proteção, você o transformou em uma arma. Cada bloqueio cria uma abertura, e cada abertura termina com um golpe preciso.",
    proficiencyChanges: [
      {
        name: "Mestre da Guarda",
        description: "Enquanto empunhar uma espada em uma mão e um escudo na outra, você recebe +1 na CA e +1 nas jogadas de dano.",
        mechanicType: "passive"
      }
    ],
    newStances: [
      {
        id: "gue_guarda_fechada",
        name: "Postura: Guarda Fechada (Substitui 'Defensiva')",
        benefit: "Sempre que reduzir o dano de um ataque utilizando sua Manobra de Postura, seu próximo ataque contra o atacante possui Vantagem.",
        restriction: "Deve permanecer empunhando um Escudo.",
        maneuver: "(2 Focos - Reação): Quando sofrer dano corpo a corpo, reduza-o em 1d10 + FOR. Se reduzir a 0, empurre o atacante 3m (fica Caído se colidir).",
        recovery: "Sempre que uma criatura ficar Caída por efeito da sua Manobra, recupere 1d4 Focos."
      },
      {
        id: "gue_avanco_tatico",
        name: "Postura: Avanço Tático (Substitui 'Ofensiva')",
        benefit: "Sempre que acertar um ataque corpo a corpo, você pode empurrar o alvo 1,5m sem realizar testes.",
        restriction: "Deve empunhar uma espada e um escudo. Não pode utilizar armas de duas mãos.",
        maneuver: "(4 Focos - Ação): Investida de Escudo. Faça um ataque corpo a corpo. Se acertar, causa dano normal, alvo faz Salvaguarda de Constituição ou fica Caído, e você faz outro ataque corpo a corpo com Vantagem.",
        recovery: "Ao acertar um ataque contra uma criatura Caída, recupere 1d4 Focos."
      }
    ]
  },

  // ================= CORSÁRIO =================
  cor_espada: {
    id: "cor_espada",
    name: "O Caminho da Espada",
    classRequired: "Corsário",
    description: "Você encontrou na lâmina uma forma de arte. Cada passo, giro e golpe compõe uma bela dança.",
    proficiencyChanges: [
      {
        name: "Desdém pela Pólvora",
        description: "Você perde a proficiência com armas de fogo de curto alcance (Pistolas, Bacamartes). Em troca, sua dedicação à espada concede benefícios nas posturas.",
        mechanicType: "passive"
      }
    ],
    newStances: [
      {
        id: "cor_duelo",
        name: "Postura: Duelo (Substitui 'Dança')",
        benefit: "+2 na CA contra ataques corpo a corpo. Você pode realizar a ação 'Desengajar' como Ação Bônus e se mover através de inimigos.",
        restriction: "Deve se mover pelo menos 3m por turno ou a postura quebra. Não pode usar armas de duas mãos.",
        maneuver: "(2 Focos - Reação): Quando for atingido corpo a corpo, reduza o dano em 1d10 + DES. Se reduzir a 0, faça um contra-ataque com Vantagem.",
        recovery: "Se ficar 3 turnos sem ser atingido, recupere 1d4 Focos.",
        acBonus: 2
      },
      {
        id: "cor_corte_fantasma",
        name: "Postura: Corte Fantasma (Substitui 'Explosão')",
        benefit: "Ao usar Ação de Ataque, pode fazer 1 ataque adicional com arma elegante. Seus ataques com armas elegantes causam +2 de dano fixo.",
        restriction: "Inimigos têm Vantagem em Ataques de Oportunidade contra você. Deve empunhar apenas uma arma elegante.",
        maneuver: "(4 Focos - Ação): Redemoinho de Aço. Um único teste de ataque contra a CA de todos os inimigos a 1,5m. Pode se mover 1,5m após cada acerto.",
        recovery: "Ao reduzir 2 ou mais inimigos a 0 PV em um único turno, recupere 1d4 Focos."
      }
    ]
  },
  cor_bacamarte: {
    id: "cor_bacamarte",
    name: "O Caminho do Bacamarte",
    classRequired: "Corsário",
    description: "Você trocou a dança das lâminas pelo trovão dos canhões. Carregando pólvora suficiente para uma pequena artilharia.",
    proficiencyChanges: [
      {
        name: "Desdém pelo Aço",
        description: "Você perde a proficiência com Armas Elegantes (Rapieira, Sabre, Florete)."
      },
      {
        name: "Mãos de Fuligem",
        description: "Habilidade passiva Municiar: Pode recarregar armas com a propriedade Recarga usando uma Ação Bônus."
      }
    ],
    newStances: [
      {
        id: "cor_queima_roupa",
        acAttribute: "Constituição",
        name: "Postura: Queima-Roupa (Substitui 'Dança')",
        benefit: "Sem Desvantagem em ataques à distância adjacentes (1,5m). Soma modificador de Constituição à sua CA.",
        restriction: "Não pode se mover mais que metade do seu deslocamento.",
        maneuver: "(2 Focos - Reação): O Troco. Se atingido corpo a corpo, dispara (sem gastar munição). Se acertar, causa 1d10 de fogo e empurra 1,5m.",
        recovery: "Se matar um inimigo a até 1,5m de distância, recupere 1d4 Focos."
      },
      {
        id: "cor_terra_arrasada",
        name: "Postura: Terra Arrasada (Substitui 'Explosão')",
        benefit: "Dano de armas de fogo ignora Resistência a perfurante. Bacamarte ignora penalidade de distância longa.",
        restriction: "-2 na CA. A cada disparo, você é empurrado 1,5m para trás pelo recuo.",
        maneuver: "(4 Focos - Ação): Chuva de Chumbo. Cone de 4,5m, Salvaguarda de Destreza. Metade do dano em caso de sucesso.",
        recovery: "Se atingir 3 ou mais inimigos com um único ataque/manobra, recupere 1d4 Focos.",
        acBonus: -2
      }
    ]
  },
  cor_pistola: {
    id: "cor_pistola",
    name: "O Caminho da Pistola",
    classRequired: "Corsário",
    description: "Você prefere carregar um arsenal inteiro preso ao corpo. Cada pistola representa uma oportunidade.",
    proficiencyChanges: [
      {
        name: "Arsenal Ambulante",
        description: "Você pode manter Pistolas Preparadas igual ao seu modificador de Destreza (min 2, max 5). Todas começam carregadas. Troca Instintiva: ao disparar, pode sacar outra sem gastar ação. Recarga em Movimento: Ao percorrer 6m sem atacar, recarrega até duas.",
        mechanicType: "passive"
      }
    ],
    newStances: [
      {
        id: "cor_tempestade_chumbo",
        name: "Postura: Tempestade de Chumbo (Substitui 'Dança')",
        benefit: "Sempre que realizar um ataque com Pistola Preparada, pode sacar imediatamente outra.",
        restriction: "Não pode utilizar armas de duas mãos nem Bacamartes nesta postura.",
        maneuver: "(2 Focos - Ação Bônus): Disparo em Sequência. Após acertar ataque com Pistola, realize um segundo ataque com OUTRA pistola contra alvo a até 6m do primeiro.",
        recovery: "Sempre que atingir duas criaturas diferentes no mesmo turno com Pistolas Preparadas, recupere 1d4 Focos."
      },
      {
        id: "cor_ultima_cartada",
        name: "Postura: Última Cartada (Substitui 'Explosão')",
        benefit: "Seus ataques com Pistolas ignoram Meia Cobertura.",
        restriction: "Você não pode recarregar armas enquanto permanecer nesta postura.",
        maneuver: "(4 Focos - Ação): Rajada de Pistolas. Realize um ataque com CADA Pistola Preparada que estiver carregando, escolhendo livremente os alvos.",
        recovery: "Sempre que esvaziar completamente todas as suas Pistolas Preparadas em um único combate, recupere 2d4 Focos."
      }
    ]
  },

  // ================= VANGUARDA =================
  van_flanqueador: {
    id: "van_flanqueador",
    name: "Flanqueador",
    classRequired: "Vanguarda",
    description: "Você estudou a arte de romper formações inimigas pela retaguarda e pontos cegos.",
    proficiencyChanges: [
      {
        name: "Olho Tático",
        description: "Uma vez por turno, ao atingir criatura com arma de haste ou fogo, você cria 'Brecha' nela (Dura até o final do seu próximo turno. Primeiro ataque ignora bônus de armadura/escudo, alvo tem Desvantagem em testes de FOR/CON contra magias)."
      }
    ],
    newStances: [
      {
        id: "van_cerco",
        name: "Postura: Cerco (Substitui 'Lanceiro')",
        benefit: "Sempre que atingir criatura com Brecha usando arma de haste, pode empurrá-la ou puxá-la 1,5m sem testes (não provoca Ataque de Oportunidade).",
        restriction: "Deve empunhar arma de haste. Não pode utilizar armas de fogo, deslocamento reduzido em 3m.",
        maneuver: "(3 Focos - Ação): Rasteira Traiçoeira. Ataque corpo a corpo contra alvo com Brecha. Se acertar, empurra/puxa 1,5m. Se colidir com criatura, ambas fazem Salvaguarda FOR ou ficam Prostradas.",
        recovery: "Sempre que criatura movida ou derrubada for reduzida a 0 PV antes do seu próximo turno, recupere 1d4 Focos."
      },
      {
        id: "van_posicao_vantagem",
        name: "Postura: Posição de Vantagem (Substitui 'Tática Mista')",
        benefit: "Como Ação Bônus, aplique Brecha em criatura adjacente. Ataques contra criaturas com Brecha causam dano adicional igual ao seu Bônus de Proficiência.",
        restriction: "Perde alcance adicional das armas de haste e não pode realizar a ação Evadir.",
        maneuver: "(4 Focos - Reação): Oportunismo Implacável. Quando aliado atingir criatura com Brecha, desloque-se até 4,5m e realize um ataque corpo a corpo contra ela.",
        recovery: "Quando uma criatura com Brecha for reduzida a 0 PV (por você ou aliado), recupere 1d4 Focos."
      }
    ]
  },
  van_lanceiro: {
    id: "van_lanceiro",
    name: "Lanceiro",
    classRequired: "Vanguarda",
    description: "Você transformou sua posição em uma fortaleza. Enquanto permanecer de pé, sua arma de haste mantém o inimigo à distância.",
    proficiencyChanges: [
      {
        name: "Maestria de Zona",
        description: "Ao realizar Ataque de Oportunidade com arma de haste, adiciona Bônus de Proficiência ao dano. Se acertar, deslocamento do alvo é reduzido a zero até o final do turno dele."
      }
    ],
    newStances: [
      {
        id: "van_falange",
        name: "Postura: Falange Inflexível (Substitui 'Lanceiro')",
        benefit: "Alcance de armas de haste aumenta em 1,5m. Qualquer espaço sob o alcance é considerado Terreno Difícil para inimigos.",
        restriction: "Não pode usar armas de fogo nem se movimentar voluntariamente.",
        maneuver: "(2 Focos - Reação): Recepção Brutal. Quando inimigo entrar no alcance, Ataque de Oportunidade. Se acertar, empurra 1,5m para trás.",
        recovery: "Ao reduzir a 0 PV inimigo que se aproximou, recupere 1d4 Focos."
      },
      {
        id: "van_guarda_interceptadora",
        name: "Postura: Guarda Interceptadora (Substitui 'Tática Mista')",
        benefit: "Sem Desvantagem ao disparar à queima-roupa. Se acertar disparo em criatura adjacente, ela provoca Ataque de Oportunidade se mover-se voluntariamente.",
        restriction: "Perde alcance extra da arma de haste e tem Desvantagem em ataques corpo a corpo.",
        maneuver: "(4 Focos - Ação Bônus): Tiro de Supressão. Disparo com pistola. Se acertar, além do dano, deslocamento do alvo cai a 0 até o final do próximo turno.",
        recovery: "Sempre que criatura impedida de mover-se for reduzida a 0 PV, recupere 1d4 Focos."
      }
    ]
  },
  van_distraidor: {
    id: "van_distraidor",
    name: "Distraidor",
    classRequired: "Vanguarda",
    description: "Você aprendeu a manipular a atenção dos inimigos como uma arma, criando aberturas para aliados.",
    proficiencyChanges: [
      {
        name: "Isca Tática",
        description: "Uma vez por turno, ao atingir criatura alternando o tipo de arma (haste para fogo ou vice-versa), ela recebe a condição Distraído (não pode realizar Ataque de Oportunidade)."
      }
    ],
    newStances: [
      {
        id: "van_falsa_guarda",
        name: "Postura: Falsa Guarda (Substitui 'Lanceiro')",
        benefit: "Alcance das armas de haste +1,5m. Quando criatura Distraída errar ataque corpo a corpo contra você, aliado adjacente a ela pode fazer Ataque de Oportunidade.",
        restriction: "Não pode usar armas de fogo e Deslocamento reduzido em 3m.",
        maneuver: "(3 Focos - Reação): Giro Desorientador. Ataque corpo a corpo (haste) contra Distraído. Se acertar, ele perde Reações e tem Desvantagem na próxima Salvaguarda.",
        recovery: "Quando aliado atingir inimigo usando o Ataque de Oportunidade desta postura, recupere 1d4 Focos."
      },
      {
        id: "van_atirador_ardil",
        name: "Postura: Atirador Ardil (Substitui 'Tática Mista')",
        benefit: "Sem Desvantagem disparando à queima-roupa. Ao acertar Distraído com disparo, pode mover-se 3m sem provocar Ataque de Oportunidade.",
        restriction: "Perde alcance extra da haste e Desvantagem em ataques corpo a corpo.",
        maneuver: "(4 Focos - Ação Bônus): Tiro Assustador. Disparo perto do rosto de alvo Distraído a até 3m. Salvaguarda Constituição ou fica Cego até final do próximo turno.",
        recovery: "Se alvo Distraído for reduzido a 0 PV, recupere 1d4 Focos."
      }
    ]
  },

  // ================= MAGO =================
  mag_artificista: {
    id: "mag_artificista",
    name: "Artificista",
    classRequired: "Mago",
    description: "Você transformou a engenharia em uma extensão da magia, construindo Artefatos capazes de canalizar mana.",
    proficiencyChanges: [
      {
        name: "Engenharia Arcana & Canalização",
        description: "Pode vincular uma magia a um objeto, servindo como Foco Arcano (limite igual ao Bônus de Proficiência). Você pode criar Artefatos e usar neles magias embutidas."
      }
    ],
    newStances: [
      {
        id: "mag_engenheiro_arcano",
        name: "Postura: Engenheiro Arcano (Substitui 'Canalizador')",
        benefit: "Uma vez por turno, ao lançar magia por objeto vinculado/Artefato, pode somar Mod. Inteligência ao dano OU receber +2 na CD da magia.",
        restriction: "Deve empunhar objeto vinculado ou controlar Artefato.",
        maneuver: "(2 Focos - Ação Bônus): Sobrecarga. Próxima magia/efeito do objeto até o final do seu próximo turno causa +1 dado de dano ou +9m de alcance.",
        recovery: "Quando magia ou efeito de Artefato reduzir criatura a 0 PV, recupere 1d4 Focos."
      },
      {
        id: "mag_maquina_arcana",
        name: "Postura: Máquina Arcana (Substitui 'Recuperação')",
        benefit: "Ao lançar magia por objeto vinculado, pode armazená-la nele em vez de ativá-la. Permanece até o início do próximo turno.",
        restriction: "Enquanto armazenada, não pode usar o mesmo objeto para outra magia.",
        maneuver: "(4 Focos - Ação Bônus): Descarga Automática. Ativa a magia armazenada sem gastar Ação.",
        recovery: "Sempre que magia armazenada atingir duas ou mais criaturas, recupere 1d4 Focos."
      }
    ]
  },
  mag_glifista: {
    id: "mag_glifista",
    name: "Glifista",
    classRequired: "Mago",
    description: "Deixa as fórmulas inscritas no mundo, aguardando o momento da ativação.",
    proficiencyChanges: [
      {
        name: "Inscrição Arcana",
        description: "Transforma magia preparada em Glifo (limite = Bônus Proficiência). Define condição de ativação. Usa a CD da magia e consome Foco. Não pode armazenar Concentração."
      }
    ],
    newStances: [
      {
        id: "mag_campo_runico",
        name: "Postura: Campo Rúnico (Substitui 'Canalizador')",
        benefit: "Pode criar Glifo como Ação Bônus a até 1,5m no combate. Área de efeito dos Glifos aumenta em 1,5m.",
        restriction: "Glifos criados no combate só podem ser ativados no seu próximo turno.",
        maneuver: "(2 Focos - Ação Bônus): Ativação Remota. Ativa Glifo a até 18m ignorando condição de ativação.",
        recovery: "Quando um Glifo afetar duas ou mais criaturas, recupere 1d4 Focos."
      },
      {
        id: "mag_runa_reativa",
        name: "Postura: Runa Reativa (Substitui 'Recuperação')",
        benefit: "Pode manter um Glifo em seu próprio equipamento. Quando a condição ocorrer, ativa usando Reação.",
        restriction: "Só pode manter Glifo em si mesmo enquanto nesta postura.",
        maneuver: "(Reação): Contrarruna. Ao ver conjuração a 18m, gaste Foco (igual ao custo da magia). Teste Arcanismo vs Arcanismo. Vencendo, interrompe a magia.",
        recovery: "Quando uma Contrarruna interromper magia, recupere 1d4 Focos."
      }
    ]
  },
  mag_evocador: {
    id: "mag_evocador",
    name: "Evocador",
    classRequired: "Mago",
    description: "Comprime e expande a mana à sua vontade, alterando a forma das magias.",
    proficiencyChanges: [
      {
        name: "Moldar Evocação",
        description: "Ao lançar magia de dano, gaste foco adicional (igual ao custo) para: Concentrar (Transforma área em alvo único, dano dobrado) ou Expandir (Alvo único em área de 3m, dano cai à metade)."
      }
    ],
    newStances: [
      {
        id: "mag_compressao",
        name: "Postura: Compressão Arcana (Substitui 'Canalizador')",
        benefit: "Quando usar Concentrar, além de dobrar dano, adiciona +2 dados de dano à magia.",
        restriction: "Alcance das magias cai à metade. Não pode utilizar Expandir.",
        maneuver: "(3 Focos - Ação Bônus): Ponto de Fuga. Antes de lançar magia Concentrada, o alvo sofre Desvantagem na Salvaguarda ou você Vantagem no ataque mágico.",
        recovery: "Ao reduzir criatura a 0 PV com magia Concentrada, recupere 1d4 Focos."
      },
      {
        id: "mag_expansao",
        name: "Postura: Expansão Arcana (Substitui 'Recuperação')",
        benefit: "Ao utilizar Expandir, você pode dobrar o raio da área.",
        restriction: "Não pode utilizar Concentrar. Sofre Desvantagem em Ataques Mágicos adjacentes.",
        maneuver: "(4 Focos - Ação Bônus): Expansão Máxima. Antes de Expandir, pode dobrar o raio NOVAMENTE (o dano é reduzido à metade de novo).",
        recovery: "Ao afetar quatro ou mais criaturas com magia Expandida, recupere 1d4 Focos."
      }
    ]
  },

  // ================= APÓSTATA =================
  apo_antigo: {
    id: "apo_antigo",
    name: "Mago Antigo",
    classRequired: "Apóstata",
    description: "Você invoca um poder arcaico, quebrando as leis da própria realidade e pagando com seu sangue.",
    proficiencyChanges: [
      {
        name: "Violação Arcana",
        description: "Ao lançar magia, pague Foco extra para violar leis: Imaterialidade (atravessa paredes), Distância (sem visão), Persistência (duração 2x) ou Inércia (move imovíveis). Preço: Sofre 1d6 dano Arcano por Círculo (ignora resistências). Caos rola normalmente."
      }
    ],
    newStances: [
      {
        id: "apo_lei_quebrada",
        name: "Postura: Lei Quebrada (Substitui 'Caos Esperado')",
        benefit: "Ao usar Violação Arcana, pode escolher DUAS leis ao invés de uma.",
        restriction: "Dano sofrido pelo Preço da Violação é dobrado.",
        maneuver: "(3 Focos - Reação): Paradoxo. Quando magia for anulada/impedida, faça Violação Arcana sem custo de Foco (apenas sofrendo o Preço de Dano) e ela ignora a resistência.",
        recovery: "Quando Violação causar dano a você reduzindo sua vida à metade ou menos, recupere 1d4 Focos."
      },
      {
        id: "apo_corpo_impossivel",
        name: "Postura: Corpo Impossível (Substitui 'Cacofonia')",
        acBonus: -2,
        benefit: "Violação no próprio corpo (gravidade, matéria, inércia ou distância) até início do próximo turno.",
        restriction: "-2 na CA. Não recupera Foco por outras habilidades.",
        maneuver: "(4 Focos - Ação): Transgressão. Até final do turno, atravessa paredes, ignora gravidade ou teleporta até 9m. Após o efeito, sofre 2d6 dano Arcano.",
        recovery: "Se usar Transgressão para atravessar criatura e atacá-la neste turno, recupere 1d4 Focos."
      }
    ]
  },
  apo_generalista: {
    id: "apo_generalista",
    name: "Generalista",
    classRequired: "Apóstata",
    description: "Toda magia pode ser adaptada, modificada ou reaproveitada.",
    proficiencyChanges: [
      {
        name: "Flexibilidade Arcaica",
        description: "Gaste Foco igual ao custo da magia para transmutar seu tipo de dano para outro elemento das Escolas de Magia."
      }
    ],
    newStances: [
      {
        id: "apo_mente_aberta",
        name: "Postura: Mente Aberta (Substitui 'Caos Esperado')",
        benefit: "Fluxo Arcano: Lançar magias DIFERENTES reduz o custo das próximas. (Ex: Magia 1 custa base+base, Magia 2 custa base+base-1, etc). Lançar a mesma reinicia penalidade.",
        restriction: "Deve pagar as flutuações de Custo Adicional das magias.",
        maneuver: "(3 Focos - Ação Bônus): Adaptação Instintiva. A próxima magia lançada usa a Salvaguarda de OUTRA magia que você conheça.",
        recovery: "Ao lançar magia com Salvaguarda trocada e causar dano/condição, recupere 1d4 Focos."
      },
      {
        id: "apo_mimetismo",
        name: "Postura: Mimetismo (Substitui 'Cacofonia')",
        benefit: "Ganha Resistência ao tipo de dano mágico do último feitiço hostil presenciado no combate.",
        restriction: "Não pode copiar a mesma magia mais de uma vez por combate.",
        maneuver: "(4 Focos - Reação): Mimetizar. Ao ver magia lançada, teste Arcanismo (CD 10 + 2xCírculo). Sucesso: Lança ela uma vez até final do próximo turno pagando Foco.",
        recovery: "Ao copiar feitiço com sucesso e causar dano com ele, recupere 1d4 Focos."
      }
    ]
  },
  apo_primordial: {
    id: "apo_primordial",
    name: "Primordial",
    classRequired: "Apóstata",
    description: "O Caos é uma roleta onde você joga contra a realidade e aprende a vencer mesmo perdendo o controle.",
    proficiencyChanges: [
      {
        name: "Caos Primordial e Paritário",
        description: "Ao rolar no Caos Arcano, rola 2x e escolhe 1. No d20 de Caos, Pares = Perfeição, Ímpares = Catástrofe."
      }
    ],
    newStances: [
      {
        id: "apo_paradoxo_caotico",
        name: "Postura: Paradoxo Caótico (Substitui 'Caos Esperado')",
        benefit: "Sobreposição: Não precisa descartar o 2º resultado do Caos imediatamente; ficam suspensos até final do turno.",
        restriction: "Se não usar manobra, um é descartado no final do turno.",
        maneuver: "(2 Focos - Reação): Paradoxo. Aplica AMBOS os efeitos suspensos do Caos simultaneamente na mesma magia.",
        recovery: "Ao aplicar dois resultados do Caos juntos, recupere 1d4 Focos."
      },
      {
        id: "apo_roda_caos",
        name: "Postura: Roda do Caos (Substitui 'Cacofonia')",
        benefit: "Antes de rolar Caos, escolha criatura a 9m. O efeito será aplicado a ela em vez de você.",
        restriction: "Não pode escolher a mesma criatura 2x consecutivas.",
        maneuver: "(3 Focos - Reação): Aposta. Após escolher alvo, role 1d6. 1-3 = Fica nela. 4-6 = Você escolhe outra criatura a 9m para receber o Caos.",
        recovery: "Sempre que resultado afetar criatura DIFERENTE da originalmente escolhida, recupere 1d4 Focos."
      }
    ]
  },

  // ================= ATIRADOR =================
  ati_franco_atirador: {
    id: "ati_franco_atirador",
    name: "Franco-Atirador",
    classRequired: "Atirador",
    description: "Um único tiro, no lugar certo, vale mais que uma centena disparados ao acaso.",
    proficiencyChanges: [
      {
        name: "Instinto Predador",
        description: "Se não se mover no turno, escolhe número de 1 a 20. Se o d20 do ataque der esse número, é Crítico. Acertos críticos adicionam +1 dado de dano extra da arma."
      }
    ],
    newStances: [
      {
        id: "ati_olho_tempestade",
        name: "Postura: Olho da Tempestade (Substitui 'Franco')",
        benefit: "Dobra Proficiência em ataques e alcance. Em Acerto Crítico, escolhe: alvo perde metade do Deslocamento ou sofre Desvantagem no próximo ataque.",
        restriction: "Deslocamento 0. Postura quebra se movido/derrubado.",
        maneuver: "(4 Focos - Ação Livre): Antes de atacar, ignora cobertura (exceto total) e mira na (10 + Destreza do alvo) no lugar da CA normal.",
        recovery: "Ao matar alguém com Crítico nesta postura, recupere 1d4 Focos."
      },
      {
        id: "ati_tiro_misericordia",
        name: "Postura: Tiro de Misericórdia (Substitui 'Barragem')",
        benefit: "+2 em ataques contra alvo com metade dos PV ou menos. Em Crítico contra esses alvos, 1 dado de dano é automaticamente maximizado.",
        restriction: "Perde proficiência em ataques contra alvos com MAIS da metade da Vida.",
        maneuver: "(3 Focos - Ação Bônus): Golpe Final. Próximo ataque no turno contra alvo ferido, se for Crítico, dá DANO MÁXIMO ABSOLUTO (todos dados máximos).",
        recovery: "Ao reduzir inimigo a 0 PV com Crítico nesta postura, recupere 1d4 Focos."
      }
    ]
  },
  ati_cacador: {
    id: "ati_cacador",
    name: "Caçador",
    classRequired: "Atirador",
    description: "Transforma cada disparo em uma armadilha, explorando as fraquezas dos inimigos.",
    proficiencyChanges: [
      {
        name: "Munição Especial",
        description: "Prepara munições no descanso igual à Proficiência: Elemental (1d6 extra), Envenenada (Salv. CON ou Envenenado) ou Imobilizadora (-3m Deslocamento)."
      }
    ],
    newStances: [
      {
        id: "ati_cacada",
        name: "Postura: Caçada (Substitui 'Franco')",
        benefit: "Presa Marcada: Ao atingir com disparo, marca como Presa até o fim do combate (Vantagem nos ataques contra ela). Apenas 1 Presa por vez.",
        restriction: "Sofre Desvantagem ao atacar QUALQUER OUTRA criatura que não a Presa.",
        maneuver: "(3 Focos - Ação Bônus): Cercar a Presa. Até 3 criaturas perto da Presa perdem 3m de mov e não podem Disparar.",
        recovery: "Quando Presa chegar a 0 PV, recupere 1d4 Focos."
      },
      {
        id: "ati_armadilha_viva",
        name: "Postura: Armadilha Viva (Substitui 'Barragem')",
        benefit: "Ao atingir com Munição Especial, o EFEITO (não dano extra) se espalha para criatura adjacente ao alvo.",
        restriction: "Não pode usar a mesma Munição Especial 2x consecutivas.",
        maneuver: "(3 Focos - Reação): Disparo de Contenção. Quando inimigo se mover, atire. Se acertar, deslocamento cai a 0.",
        recovery: "Quando deslocamento cair a 0 por sua habilidade (1x por rodada), recupere 1d4 Focos."
      }
    ]
  },
  ati_artilheiro: {
    id: "ati_artilheiro",
    name: "Artilheiro",
    classRequired: "Atirador",
    description: "Você não busca elegância, busca impacto. Disparos com peso de canhão.",
    proficiencyChanges: [
      {
        name: "Doutrina e Pressão de Fogo",
        description: "Perde proficiência com Arcos/Bestas. Pólvora ignora +2 de armadura física. Alvo atingido fica 'Sob Pressão' (Desvantagem no 1º ataque, perde meia cobertura)."
      }
    ],
    newStances: [
      {
        id: "ati_bombardeio",
        name: "Postura: Bombardeio Direto (Substitui 'Franco')",
        benefit: "Dano adicional de pólvora = Bônus Proficiência. Disparo que deixe alvo abaixo de meia vida exige Salvaguarda de CON ou fica Prostrado.",
        restriction: "Exige arma Duas Mãos (Mosquete/Bacamarte). Deslocamento reduzido em 3m.",
        maneuver: "(4 Focos - Ação): Tiro de Demolição. Dano maximizado, empurra alvo 3m (1d6 colisão). Arma inutiliza até Ação Bônus para limpar.",
        recovery: "Ao reduzir criatura a 0 PV com um único disparo, recupere 1d4 Focos."
      },
      {
        id: "ati_supressao",
        name: "Postura: Fogo de Supressão (Substitui 'Barragem')",
        benefit: "Ação Bônus: cria Zona de 3m. Inimigos lá sofrem 'Sob Pressão'.",
        restriction: "Na Zona, você não se move mais de 1,5m e perde proficiência em ataques.",
        maneuver: "(3 Focos - Reação): Rajada. Se alvo Sob Pressão tentar sair da zona ou atacar, atire. Acertando, anula o mov ou impõe Desvantagem.",
        recovery: "Se alvo Sob Pressão terminar turno sem ações ofensivas, recupere 1d4 Focos."
      }
    ]
  },

  // ================= ORADOR =================
  ora_comandante: {
    id: "ora_comandante",
    name: "Comandante",
    classRequired: "Orador",
    description: "Você não luta para vencer sozinho. Conduz seus aliados como uma única força.",
    proficiencyChanges: [
      {
        name: "Ordem de Combate",
        description: "1x por turno, aliado fazendo ação, gaste 1 Foco para permitir que ele faça uma Ação Bônus adicional imediata."
      }
    ],
    newStances: [
      {
        id: "ora_voz_comando",
        name: "Postura: Voz de Comando (Substitui 'Inspiração')",
        benefit: "Escolha 3 aliados. Sempre que atacarem, podem mover 1,5m antes/depois sem Ataque de Oportunidade.",
        restriction: "Deve poder falar e ser ouvido.",
        maneuver: "(3 Focos - Reação): Avançar! Aliado atacado pode mover metade do deslocamento ANTES do ataque resolver.",
        recovery: "Se aliado evitar ataque/vantagem por Manobra, recupere 1d4 Focos."
      },
      {
        id: "ora_pressao",
        name: "Postura: Pressão (Substitui 'Intimidador')",
        benefit: "Ação Bônus (3m): Alvo tem Desvantagem no primeiro ataque que fizer contra qualquer um que NÃO SEJA VOCÊ.",
        restriction: "Não pode usar Cobertura (precisa ficar visível).",
        maneuver: "(3 Focos - Reação): Quando alvo atacar aliado, force Salvaguarda SAB. Falha: redireciona para você (se alcance).",
        recovery: "Quando alvo atacar você em vez de aliado, recupere 1d4 Focos."
      }
    ]
  },
  ora_arauto: {
    id: "ora_arauto",
    name: "Arauto",
    classRequired: "Orador",
    description: "O campo é um palco, e um grito seu faz formações inteiras hesitarem.",
    proficiencyChanges: [
      {
        name: "Voz Dominante",
        description: "Alcance das habilidades de orador que exigem Audição +6m."
      }
    ],
    newStances: [
      {
        id: "ora_proclamacao",
        name: "Postura: Proclamação (Substitui 'Inspiração')",
        benefit: "Ação Bônus: 3 alvos a 6m fazem Salvaguarda SAB. Falha = Abalada (Desv. próximo ataque, perde Atq Oportunidade).",
        restriction: "Afeta apenas 1x por turno cada alvo.",
        maneuver: "(3 Focos - Ação): Grito de Guerra. Inimigos 6m Salvaguarda SAB ou 2d6 Psíquico + Abalada.",
        recovery: "Se 3 ou mais falharem na Salvaguarda nesta postura, recupere 1d4 Focos."
      },
      {
        id: "ora_intimidacao",
        name: "Postura: Intimidação (Substitui 'Intimidador')",
        benefit: "Quando criatura ficar Abalada, obriga outra a 3m dela a fazer teste ou também ficar Abalada.",
        restriction: "Não funciona se estiver Surdo ou Mudo.",
        maneuver: "(3 Focos - Reação): Palavra de Terror. Inimigo ataca = Salvaguarda SAB. Falha = muda alvo ou perde ataque.",
        recovery: "Se inimigo falhar e não atingir alvo original, recupere 1d4 Focos."
      }
    ]
  },
  ora_maestro: {
    id: "ora_maestro",
    name: "Maestro",
    classRequired: "Orador",
    description: "Você conduz o combate como uma partitura musical, marcando ritmos exatos.",
    proficiencyChanges: [
      {
        name: "Compasso de Batalha",
        description: "Ações DIFERENTES do turno passado geram +1 Compasso (Max 3). Gasta 3 para: Acelerar (+3m mov), Intensificar (+1d6 dano) ou Interromper (-3m mov de alvo Reação)."
      }
    ],
    newStances: [
      {
        id: "ora_ritmo_marcial",
        name: "Postura: Ritmo Marcial (Substitui 'Inspiração')",
        benefit: "Ao gastar 3 Compassos, pode mover 1,5m imediatamente sem provocar ataques.",
        restriction: "Terminar turno SEM ação ZERA os Compassos.",
        maneuver: "(3 Focos - Ação Bônus): Quebrar o Ritmo. Gasta TODOS Compassos. Cada 1 gasta gera +1,5m passo ou +1d6 dano.",
        recovery: "Se gastar 3 Compassos no mesmo turno, recupere 1d4 Focos."
      },
      {
        id: "ora_contratempo",
        name: "Postura: Contratempo (Substitui 'Intimidador')",
        benefit: "Quando criatura a 3m ERRAR ataque em você, ganha +1 Compasso.",
        restriction: "Terminar turno SEM ação ZERA os Compassos.",
        maneuver: "(2 Focos - Reação): Quando alvo errar ataque, gaste até 3 Compassos (+1,5m passo ou +1d6 dano por compasso gasto contra ele).",
        recovery: "Se gastar 3 Compassos numa Reação, recupere 1d4 Focos."
      }
    ]
  }
};
