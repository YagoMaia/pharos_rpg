// src/data/skillData.ts
import { Skill } from "../types/rpg";

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
      "Você concentra toda a força em um único golpe devastador com sua arma corpo a corpo, adicionando 1d6 de dano extra ao impacto. O ataque é tão violento que pode rachar escudos e deformar armaduras.",
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
      "Através de pura força de vontade, você ignora a dor e fecha suas feridas pela determinação. Recupera 1d10 + modificador de Constituição de Pontos de Vida. Não funciona se estiver inconsciente.",
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
      "Você gira sua arma em um arco amplo, atingindo todos os inimigos em um cone de 3 metros à sua frente. Cada alvo na área sofre o dano normal da arma. Ideal contra grupos aglomerados.",
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
      "Ao ser atingido por um ataque, você firma os pés e endurece o corpo, reduzindo o dano recebido pela metade. Requer que você não tenha se movido neste turno. Não acumulável com outras reduções de dano.",
  },
  // Nível 2
  {
    id: "investida_ariete",
    name: "Investida de Aríete",
    cost: 5,
    actionType: "Padrão",
    level: 2,
    description:
      "Você avança o dobro do seu deslocamento em linha reta e desfere um golpe com todo o momento. Causa o dano normal da arma e o alvo deve fazer uma Salvaguarda de Força ou ser derrubado (Prostrado). Você não provoca ataques de oportunidade durante o avanço.",
    weaponType: "melee",
    usesWeaponDamage: true,
    saveRequest: {
      attribute: "Força",
      effect: "Derrubado (Prostrado)",
    },
  },
  {
    id: "concussao",
    name: "Concussão",
    cost: 3,
    actionType: "Padrão",
    level: 2,
    description:
      "Um golpe preciso direcionado à cabeça do oponente. Causa o dano normal da arma e o alvo deve fazer uma Salvaguarda de Constituição ou ficar Confuso até o final do próximo turno dele, sofrendo Desvantagem em testes de ataque e habilidade.",
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
      "Quando um aliado a até 3 metros sofreria dano de um ataque, você se interpõe heroicamente. Troque de lugar com o aliado e receba o ataque em seu lugar. O dano que você sofre é reduzido pela metade. Não acumulável com outras reduções.",
  },
  {
    id: "ataque_redemoinho",
    name: "Ataque Redemoinho",
    cost: 4,
    actionType: "Padrão",
    level: 2,
    description:
      "Você gira com sua arma em um círculo completo, atacando todos os inimigos adjacentes (1,5m). Faça uma única jogada de ataque e compare com a CA de cada alvo. Todos que forem atingidos sofrem o dano normal da arma.",
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
      "Você joga areia nos olhos, puxa uma capa sobre o rosto do inimigo ou chuta terra — qualquer truque vale. Um alvo a até 3 metros deve fazer uma Salvaguarda de Constituição ou ficar Cego ou Prostrado (à sua escolha) até o final do próximo turno dele.",
  },
  {
    id: "disparo_incapacitante",
    name: "Disparo Incapacitante",
    cost: 2,
    actionType: "Padrão",
    level: 1,
    description:
      "Um tiro calculado que visa articulações ou pontos vulneráveis. Causa o dano normal da arma à distância. Se acertar, o alvo tem seu deslocamento reduzido pela metade até o final do próximo turno dele.",
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
      "Seus reflexos afiados permitem uma esquiva instintiva. Ao ser alvo de um ataque, escolha: adicionar seu bônus de Proficiência à CA contra esse ataque específico, OU ganhar Vantagem em um teste de Destreza provocado pelo ataque.",
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
      "Um golpe preciso que explora aberturas na guarda do oponente. Se você tiver Vantagem no ataque (ou o alvo estiver Cego/Prostrado), causa +1 dado de dano da arma. Além disso, o alvo perde todas as Reações até o início do próximo turno dele.",
    usesWeaponDamage: true,
    weaponType: "melee",
  },
  // Nível 2
  {
    id: "movimento_dancante",
    name: "Movimento Dançante",
    cost: 3,
    actionType: "Reação",
    level: 2,
    description:
      "Quando um inimigo erra um ataque corpo a corpo contra você, seus pés se movem como em uma dança. Mova-se até 3 metros sem provocar ataques de oportunidade e ganhe Vantagem em testes de Furtividade ou Acrobacia até o final do turno.",
  },
  {
    id: "granada_fumaca",
    name: "Granada de Fumaça",
    cost: 3,
    actionType: "Padrão",
    level: 2,
    description:
      "Você arremessa um dispositivo que gera uma densa nuvem de fumaça em uma área de 6 metros. Todas as criaturas dentro ficam Cegas e são consideradas invisíveis para quem está fora da nuvem. A fumaça dura 1 rodada. Requer 1 uso de Kit de Explosivos.",
  },
  {
    id: "mira_calculada",
    name: "Mira Calculada",
    cost: 3,
    actionType: "Ação Bônus",
    level: 2,
    description:
      "Você respira fundo e alinha sua mira com precisão cirúrgica. Seu próximo ataque neste turno causa +1 dado de dano da arma. Se o ataque errar, o Foco gasto não é recuperado. Não acumulável consigo mesmo.",
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
      "Com voz trovejante, você declara uma ameaça que faz o sangue gelar. Todos os inimigos em um cone de 3 metros devem fazer uma Salvaguarda de Sabedoria ou ficam Intimidados até o final do próximo turno deles, sofrendo Desvantagem em ataques contra você.",
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
      "Sua voz carrega o peso de um líder nato. Até 3 aliados que possam ouvi-lo ganham +2 no próximo ataque ou teste de resistência que fizerem. O bônus dura até o início do seu próximo turno ou até ser usado.",
  },
  {
    id: "palavra_coragem",
    name: "Palavra de Coragem",
    cost: 2,
    actionType: "Padrão",
    level: 1,
    description:
      "Você profere palavras de encorajamento que renovam a determinação de um aliado. O alvo recupera 1d6 + seu modificador de Carisma de Pontos de Vida. Funciona à distância desde que o aliado possa ouvi-lo (até 9m).",
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
      "Quando um aliado a até 9 metros sofrer dano, você grita uma advertência ou distrai o atacante com palavras afiadas. O dano sofrido pelo aliado é reduzido em 1d10 + seu modificador de Carisma. Se reduzir a 0, o ataque é completamente negado.",
  },
  {
    id: "coordenacao_aliada",
    name: "Coordenação Aliada",
    cost: 5,
    actionType: "Padrão",
    level: 2,
    description:
      "Você designa um inimigo e coordena um ataque combinado. Dois aliados ao alcance podem usar suas Reações para atacar o alvo imediatamente. Se o primeiro aliado causar uma condição (Prostrado, Cego, etc.), o segundo aliado ganha Vantagem em seu ataque.",
  },
];
