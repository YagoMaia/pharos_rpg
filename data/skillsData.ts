// src/data/skillData.ts
import { Skill } from "../types/rpg";

// Skills exclusivas dos haotai (mudam apanas as descricoes -- Wayne que ta codando)
export const HAOTAI_SKILLS: Skill[] = [
 // Nível 1
  {
    id: "golpe_demolidor",
    name: "Golpe Demolidor",
    cost: 2,
    actionType: "Padrão",
    level: 1,
    description:
      "Você canaliza toda a sua força em um único golpe devastador para romper defesas. Faça um ataque corpo a corpo. Se acertar, você adiciona um dado de dano extra da arma ao total. Se o alvo estiver usando escudo ou armadura pesada, você tem Vantagem na jogada de ataque.",
    usesWeaponDamage: true,
    weaponType: "melee",
    bonusDamage: "1d6",
    damageType: "Físico",
  },
  {
    id: "vigor_ferro",
    name: "Vigor de Ferro",
    cost: 3,
    actionType: "Ação Bônus",
    level: 1,
    description:
      "Você ignora a dor através de pura disciplina marcial. Você recupera uma quantidade de Pontos de Vida igual a 1d10 + Constituição.",
    isHealing: true,
    healFormula: "1d10 + @CON",
  },
  {
    id: "varrer_linha",
    name: "Varrer a Linha",
    cost: 4,
    actionType: "Padrão",
    weaponType: "melee",
    level: 1,
    description:
      "Usando o alcance de uma arma de haste ou um golpe amplo de espada, você atinge todos os inimigos em um arco à sua frente. Faça uma única jogada de ataque e compare com a CA de todos os inimigos em um cone de 3m (ou adjacentes). Quem for atingido sofre o dano normal da arma e é empurrado 1,5m para trás.",
    usesWeaponDamage: true,
    damageType: "Físico",
  },
  {
    id: "bastiao_imovel",
    name: "Bastião Imóvel",
    cost: 3,
    actionType: "Reação",
    level: 1,
    description:
      "Você se recusa a cair. Você reduz o dano recebido de um único ataque pela metade. Além disso, você não pode ser movido, derrubado ou empurrado até o início do seu próximo turno.",
  },
  // Nível 2
  {
    id: "investida_ariete",
    name: "Investida de Aríete",
    cost: 5,
    actionType: "Padrão",
    level: 2,
    description:
      "Você usa seu corpo ou escudo como uma arma de cerco. Mova-se até o dobro do seu deslocamento em linha reta em direção a um inimigo. Faça uma jogada de ataque com Vantagem. Se acertar, o alvo sofre o dano da arma e deve passar em um teste de Força ou ser empurrado 3m para trás e ficar Caído (Prostrado).",
    weaponType: "melee",
    usesWeaponDamage: true,
    saveRequest: {
      attribute: "Força",
      effect: "Empurrado 3m e Derrubado (Prostrado)",
    },
  },
  {
    id: "concussao",
    name: "Concussão",
    cost: 3,
    actionType: "Padrão",
    level: 2,
    description:
      "Você foca sua força na cabeça do inimigo. Faça uma jogada de ataque, se acertar cause o dano da sua arma e o inimigo deve fazer uma salvaguarda de Constituição, se falhar, o alvo fica Confuso, o alvo deve repetir o teste de Constituição ao final de cada turno dele. O efeito termina em um sucesso.",
    usesWeaponDamage: true,
    weaponType: "melee",
    saveRequest: {
      attribute: "Constituição",
      effect: "Confuso",
    },
  },
  {
    id: "martir",
    name: "Mártir",
    cost: 4,
    actionType: "Reação",
    level: 2,
    description:
      "Você se atira na frente do perigo para salvar um companheiro. Você troca de lugar com o aliado alvo (ou se move para a frente dele) e recebe o ataque ou efeito no lugar dele. O dano que você recebe dessa ação é reduzido pela metade, mas você não pode usar nenhuma outra habilidade para reduzir ou anular esse dano ainda mais (como Bastião Imóvel).",
  },
  {
    id: "ataque_redemoinho",
    name: "Ataque Redemoinho",
    cost: 4,
    actionType: "Padrão",
    level: 2,
    description:
      "Você gira em um redemoinho furioso, transformando-se em uma zona de morte momentânea. Realize uma única jogada de ataque corpo-a-corpo e compare o resultado com a Classe de Armadura (CA) de todos os inimigos adjacentes a você (dentro de 1,5m). Todo inimigo cujo a CA for superada sofre o dano normal da sua arma.",
  },
]

// 1. FORÇA / CONSTITUIÇÃO (Guerreiro, Vanguarda)
export const MARTIAL_SKILLS: Skill[] = [
  // Nível 1
  {
    id: "golpe_demolidor",
    name: "Golpe Demolidor",
    cost: 2,
    actionType: "Padrão",
    level: 1,
    description:
      "Você canaliza toda a sua força em um único golpe devastador para romper defesas. Faça um ataque corpo a corpo. Se acertar, você adiciona um dado de dano extra da arma ao total. Se o alvo estiver usando escudo ou armadura pesada, você tem Vantagem na jogada de ataque.",
    usesWeaponDamage: true,
    weaponType: "melee",
    bonusDamage: "1d6",
    damageType: "Físico",
  },
  {
    id: "vigor_ferro",
    name: "Vigor de Ferro",
    cost: 3,
    actionType: "Ação Bônus",
    level: 1,
    description:
      "Você ignora a dor através de pura disciplina marcial. Você recupera uma quantidade de Pontos de Vida igual a 1d10 + Constituição.",
    isHealing: true,
    healFormula: "1d10 + @CON",
  },
  {
    id: "varrer_linha",
    name: "Varrer a Linha",
    cost: 4,
    actionType: "Padrão",
    weaponType: "melee",
    level: 1,
    description:
      "Usando o alcance de uma arma de haste ou um golpe amplo de espada, você atinge todos os inimigos em um arco à sua frente. Faça uma única jogada de ataque e compare com a CA de todos os inimigos em um cone de 3m (ou adjacentes). Quem for atingido sofre o dano normal da arma e é empurrado 1,5m para trás.",
    usesWeaponDamage: true,
    damageType: "Físico",
  },
  {
    id: "bastiao_imovel",
    name: "Bastião Imóvel",
    cost: 3,
    actionType: "Reação",
    level: 1,
    description:
      "Você se recusa a cair. Você reduz o dano recebido de um único ataque pela metade. Além disso, você não pode ser movido, derrubado ou empurrado até o início do seu próximo turno.",
  },
  // Nível 2
  {
    id: "investida_ariete",
    name: "Investida de Aríete",
    cost: 5,
    actionType: "Padrão",
    level: 2,
    description:
      "Você usa seu corpo ou escudo como uma arma de cerco. Mova-se até o dobro do seu deslocamento em linha reta em direção a um inimigo. Faça uma jogada de ataque com Vantagem. Se acertar, o alvo sofre o dano da arma e deve passar em um teste de Força ou ser empurrado 3m para trás e ficar Caído (Prostrado).",
    weaponType: "melee",
    usesWeaponDamage: true,
    saveRequest: {
      attribute: "Força",
      effect: "Empurrado 3m e Derrubado (Prostrado)",
    },
  },
  {
    id: "concussao",
    name: "Concussão",
    cost: 3,
    actionType: "Padrão",
    level: 2,
    description:
      "Você foca sua força na cabeça do inimigo. Faça uma jogada de ataque, se acertar cause o dano da sua arma e o inimigo deve fazer uma salvaguarda de Constituição, se falhar, o alvo fica Confuso, o alvo deve repetir o teste de Constituição ao final de cada turno dele. O efeito termina em um sucesso.",
    usesWeaponDamage: true,
    weaponType: "melee",
    saveRequest: {
      attribute: "Constituição",
      effect: "Confuso",
    },
  },
  {
    id: "martir",
    name: "Mártir",
    cost: 4,
    actionType: "Reação",
    level: 2,
    description:
      "Você se atira na frente do perigo para salvar um companheiro. Você troca de lugar com o aliado alvo (ou se move para a frente dele) e recebe o ataque ou efeito no lugar dele. O dano que você recebe dessa ação é reduzido pela metade, mas você não pode usar nenhuma outra habilidade para reduzir ou anular esse dano ainda mais (como Bastião Imóvel).",
  },
  {
    id: "ataque_redemoinho",
    name: "Ataque Redemoinho",
    cost: 4,
    actionType: "Padrão",
    level: 2,
    description:
      "Você gira em um redemoinho furioso, transformando-se em uma zona de morte momentânea. Realize uma única jogada de ataque corpo-a-corpo e compare o resultado com a Classe de Armadura (CA) de todos os inimigos adjacentes a você (dentro de 1,5m). Todo inimigo cujo a CA for superada sofre o dano normal da sua arma.",
  },
];

// 2. DESTREZA (Corsário, Atirador)
export const DEXTERITY_SKILLS: Skill[] = [
  // Nível 1
  {
    id: "truque_sujo",
    name: "Truque Sujo",
    cost: 2,
    actionType: "Ação Bônus",
    level: 1,
    description:
      "Você joga areia nos olhos, dispara pólvora no rosto do inimigo ou chuta alguma parte sensível. Um alvo a até 3m deve passar num teste de Constituição, caso falhe, ele fica Cego ou Prostrado até o final do próximo turno dele.",
  },
  {
    id: "disparo_incapacitante",
    name: "Disparo Incapacitante",
    cost: 2,
    actionType: "Padrão",
    level: 1,
    description:
      "Você mira em um ponto funcional do inimigo. Faça um ataque à distância. Se acertar, causa dano normal e escolhe um efeito: Asa/Perna: O deslocamento do alvo torna-se 0. Mão/Garra: O alvo larga um item que esteja segurando ou tem Desvantagem no próximo ataque.",
    usesWeaponDamage: true,
    weaponType: "ranged",
  },
  {
    id: "reflexo_relampago",
    name: "Reflexo Relâmpago",
    cost: 2,
    actionType: "Reação",
    level: 1,
    description:
      "Sua velocidade salva sua vida. Você adiciona seu bônus de Proficiência à sua CA contra um ataque, ou recebe Vantagem em um teste de resistência de Destreza.",
  },
  {
    id: "passo_esgueiro",
    name: "Passo Esgueiro",
    cost: 1,
    actionType: "Ação Bônus",
    level: 1,
    description:
      "Com um movimento fluido e silencioso, você desliza 1,5 metro em qualquer direção sem provocar ataques de oportunidade. Perfeito para reposicionamento tático ou fuga de alcance corpo a corpo.",
  },
  {
    id: "estocada_traicoeira",
    name: "Estocada Traiçoeira",
    cost: 2,
    actionType: "Padrão",
    level: 1,
    description:
      "Você aproveita uma distração momentânea para atingir um ponto vital. Realize um ataque corpo a corpo com uma espada. Se você tiver Vantagem na jogada de ataque (ou se o alvo estiver sob uma condição negativa como Cego ou Prostrado), o golpe causa + 1 dado de dano da arma e o alvo fica Incapaz de realizar Reações até o início do próximo turno dele.",
    usesWeaponDamage: true,
    weaponType: "melee",
  },
  // Nível 2
  {
    id: "movimento_dancante",
    name: "Movimento Dançante",
    cost: 2,
    actionType: "Reação",
    level: 2,
    description:
      "Você usa o erro do inimigo como impulso. Você pode se mover até 3m sem provocar ataques de oportunidade e ganha Vantagem no próximo teste de Furtividade ou Acrobacia até o fim do turno.",
  },
  {
    id: "granada_fumaca",
    name: "Granada de Fumaça",
    cost: 3,
    actionType: "Padrão",
    level: 2,
    description:
      "Você joga uma granada que explode e gera uma área coberta de fumaça, deixando todos em sua área de 6m cegos e fora do campo de visão para aqueles que olham de fora para dentro. Requer 1 uso de Kit de Explosivos.",
  },
  {
    id: "mira_calculada",
    name: "Mira Calculada",
    cost: 3,
    actionType: "Ação Bônus",
    level: 2,
    description:
      "Você respira fundo e ajusta cada detalhe do disparo. O próximo ataque à distância que você realizar neste turno: Ignora Desvantagem por cobertura leve e causa mais um dado de dano da arma se acertar.",
  },
];

// 3. ORATÓRIA / CARISMA (Orador)
export const ORATORY_SKILLS: Skill[] = [
  // Nível 1
  {
    id: "comando_tatico",
    name: "Comando Tático",
    cost: 3,
    actionType: "Ação Bônus",
    level: 1,
    description:
      "Você grita uma ordem precisa no calor da batalha. Escolha um aliado que possa ouvi-lo — ele pode usar sua Reação imediatamente para realizar um ataque corpo a corpo ou à distância contra um alvo à escolha dele.",
  },
  {
    id: "ultimato",
    name: "Ultimato",
    cost: 3,
    actionType: "Padrão",
    level: 1,
    description:
      "Você emite uma ordem ou ameaça que paralisa os inimigos. Todos os inimigos hostis em um cone de 5m devem fazer um teste de resistência de Sabedoria. Se falharem, eles ficam Intimidados até o próximo turno.",
    saveRequest: {
      attribute: "Sabedoria",
      effect: "Intimidado",
    },
  },
  {
    id: "voz_autoridade",
    name: "A Voz da Autoridade",
    cost: 4,
    actionType: "Padrão",
    level: 1,
    description:
      "Você impõe sua vontade sobre o campo de batalha. Escolha até 3 aliados que possam te ouvir. Cada Aliado pode aumentar em +2 sua próxima jogada de ataque ou teste de resistência até o final do próximo turno.",
  },
  {
    id: "palavra_coragem",
    name: "Palavra de Coragem",
    cost: 2,
    actionType: "Padrão",
    level: 1,
    description:
      "Você reforça o espírito de um aliado. Ele recupera (1d6 + Carisma) Pontos de vida.",
    isHealing: true,
    healFormula: "1d6 + @CHA",
  },
  // Nível 2
  {
    id: "intervencao_retorica",
    name: "Intervenção Retórica",
    cost: 3,
    actionType: "Reação",
    level: 2,
    description:
      "Você grita um aviso ou distrai o atacante com uma provocação no último segundo. O dano sofrido pelo aliado é reduzido em 1d10 + Carisma.",
  },
  {
    id: "coordenacao_aliada",
    name: "Coordenação Aliada",
    cost: 5,
    actionType: "Padrão",
    level: 2,
    description:
      "Você orquestra um ataque simultâneo, explorando a distração do inimigo. Escolha um inimigo que você possa ver. Dois aliados seus que estejam ao alcance de ataque desse inimigo podem usar suas Reações para realizar um ataque imediato (corpo a corpo ou à distância) contra ele. Sinergia: Como os ataques ocorrem simultaneamente, se o primeiro aliado acertar e derrubar/atordoar o inimigo, o segundo aliado se beneficia dessa condição no ataque dele (Vantagem).",
  },
];
