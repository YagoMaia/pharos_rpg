// src/data/classData.ts
import { CharacterClass, Skill, Stance } from "../types/rpg";
import { DEXTERITY_SKILLS, MARTIAL_SKILLS, ORATORY_SKILLS } from "./skillsData";

// Define a estrutura dos dados padrão de uma classe
interface ClassDefaultData {
  skills: Skill[];
  stances: [Stance, Stance]; // Sempre 2 posturas
}

export const CLASS_DATA: Record<CharacterClass, ClassDefaultData> = {
  Guerreiro: {
    stances: [
      {
        id: "gue_defensor",
        name: "Postura: Defensor",
        benefit:
          "+1 na CA. Se estiver usando escudo, pode usar Reação para impor Desvantagem em ataque contra aliado adjacente.",
        restriction:
          'Deslocamento reduzido à metade. Não pode realizar a ação de "Correr".',
        maneuver:
          "Como Reação, gaste 2 Focos para reduzir (1d8 + Constituição) o dano de um ataque contra você.",
        acBonus: 1,
      },
      {
        id: "gue_ofensiva",
        name: "Postura: Ofensiva",
        benefit:
          "Dobra bônus de Proficiência ao acerto de ataque corpo-a-corpo.",
        restriction: '-2 na CA. Não pode usar a ação de "Esquivar".',
        maneuver: "Gaste 2 Focos para ganhar Vantagem em um ataque.",
        recovery: "Ao reduzir inimigo a 0 PV nesta postura, recupera 1d4 de Foco.",
        acBonus: -2,
      },
    ],
    skills: MARTIAL_SKILLS,
  },

  Vanguarda: {
    stances: [
      {
        id: "van_lanceiro",
        name: "Postura: Lanceiro",
        benefit:
          "Ataques corpo-a-corpo ganham alcance extra (se a arma permitir).",
        restriction:
          "Não pode usar armas de fogo nesta postura e nem se movimentar voluntariamente.",
        maneuver:
          "Como Reação, inimigos que entrarem no seu alcance provocam um Ataque de Oportunidade.",
        recovery:
          "Ao reduzir a 0 PV um inimigo que se aproximou (entrou no alcance), recupera 1d4 de Foco.",
      },
      {
        id: "van_mista",
        name: "Postura: Tática Mista",
        benefit:
          "Sem Desvantagem ao disparar armas de fogo à queima-roupa (adjacente). Pode usar Ação Bônus para recarregar.",
        restriction:
          "Perde o benefício de alcance da arma de haste. Desvantagem em ataques corpo-a-corpo.",
        maneuver:
          "Após acertar um ataque corpo-a-corpo, gaste 2 Focos para realizar um disparo como Ação Bônus.",
      },
    ],
    skills: MARTIAL_SKILLS,
  },

  Mago: {
    stances: [
      {
        id: "mag_canalizador",
        name: "Postura: Canalizador",
        benefit:
          "Escolha um efeito passivo para suas magias: +2 na CD ou +1 Dado de Dano em todas as magias lançadas.",
        restriction: "Não consegue recuperar foco.",
        maneuver:
          "Contra-Magia (Reação): Ao ver criatura a até 18m conjurando, gaste Foco igual ao Círculo da magia (mín. 2). Teste oposto de Inteligência (Arcanismo). Se vencer, a magia falha e o foco do inimigo é gasto.",
      },
      {
        id: "mag_recuperacao",
        name: "Postura: Recuperação",
        benefit: "Vantagem em testes de Concentração.",
        restriction:
          "Não pode lançar magias que causem dano direto nesta postura.",
        maneuver:
          "Gaste sua Ação para regenerar (2d4 + Constituição) de Foco no início do seu turno, caso não tenha sofrido dano.",
      },
    ],
    skills: [],
  },

  Apóstata: {
    stances: [
      {
        id: "apo_caos",
        name: "Postura: Caos Esperado",
        benefit:
          "Caos Mágico: Ao lançar qualquer magia, role 1d4 extra. 1 = Catástrofe (2d100, menor), 2 = Calmaria (nada acontece), 3 = Fluxo (1d100 normal), 4 = Perfeição (2d100, maior).",
        restriction:
          "Sujeito aos efeitos da Tabela de Caos Arcano (d100) conforme o resultado do d4.",
        maneuver:
          "Após rolar o d4 de Caos ou o d100 da Tabela, gaste 2 Focos para rerrolar o dado.",
      },
      {
        id: "apo_cacofonia",
        name: "Postura: Cacofonia de Espíritos",
        benefit:
          "Imune a magias de detecção (como Detectar Magia). Vantagem em testes de Furtividade.",
        restriction:
          "Não pode lançar magias. Se lançar qualquer magia, a postura é quebrada imediatamente.",
        maneuver:
          "Ação: Escolha as 4 criaturas mais próximas em 9m, atribua números 1-4. Role 1d4: a criatura sorteada sofre 1d4 necrótico (sem teste) e você recupera Foco igual ao dano.",
      },
    ],
    skills: [],
  },

  Atirador: {
    stances: [
      {
        id: "ati_franco",
        name: "Postura: Franco-atirador",
        benefit:
          "Dobra bônus de proficiência nas jogadas de ataque à distância e dobra o alcance.",
        restriction:
          "Deslocamento torna-se 0. Se for movido à força ou derrubado, a postura é quebrada imediatamente.",
        maneuver:
          "Antes de atacar, gaste 4 Focos para ignorar qualquer cobertura (exceto total) e armadura do inimigo (ataca contra CA 10 + Destreza do alvo).",
        recovery: "Ao matar alguém nesta postura, recupera 1d4 de Foco.",
      },
      {
        id: "ati_barragem",
        name: "Postura: Barragem",
        benefit:
          "Ignora propriedade \"Recarga\" (recarregar torna-se ação livre). Ao atacar, pode fazer ataque adicional como Ação Bônus.",
        restriction: "Perde proficiência em jogadas de ataque.",
        maneuver:
          "Gaste 2 Focos ao atacar para dobrar a quantidade de ataques daquela ação.",
      },
    ],
    skills: DEXTERITY_SKILLS,
  },

  Orador: {
    stances: [
      {
        id: "ora_inspiracao",
        name: "Postura: Inspiração",
        benefit:
          "Como Ação Bônus, escolha um aliado a até 3m. Ele ganha Vantagem em qualquer rolagem (ataque, teste de habilidade ou resistência) até o início do seu próximo turno.",
        restriction:
          "Deve ser capaz de falar alto e ser ouvido. Se silenciado, postura quebra. Não pode usar \"Esconder-se\".",
        maneuver:
          "Gaste 2 Focos: Comande um aliado que possa te ouvir. Ele usa Reação para atacar ou mover metade do deslocamento.",
        recovery:
          "Se aliados matarem 2+ inimigos usando a Vantagem concedida, recupera 1d4 de Foco.",
      },
      {
        id: "ora_intimidar",
        name: "Postura: Intimidador",
        benefit:
          "Como Ação Bônus, escolha um inimigo a até 3m. Ele sofre Desvantagem em uma rolagem (ataque, teste de habilidade ou resistência) até o início do seu próximo turno.",
        restriction:
          "Alvo prioritário e ostensivo. Não pode se beneficiar de Cobertura enquanto nesta postura.",
        maneuver:
          "Ao atingir inimigo com ataque ou interação social, gaste 2 Focos para forçar teste de Sabedoria. Se falhar, fica Amedrontado.",
      },
    ],
    skills: ORATORY_SKILLS,
  },

  Corsário: {
    stances: [
      {
        id: "cor_danca",
        name: "Postura: Dança",
        benefit:
          "+2 na CA contra ataques corpo a corpo. Pode realizar \"Desengajar\" como Ação Bônus.",
        restriction:
          "Deve sempre se manter em movimento. Se não se mover no turno, a postura é quebrada.",
        maneuver:
          "Reação ao ser atingido corpo a corpo: Gaste 2 Focos para reduzir dano em 1d8 + Destreza. Se o dano for reduzido a 0, pode fazer Ataque de Oportunidade contra o atacante.",
        recovery: "3 turnos sem ser atingido? Recupere 1d4 de Foco ao entrar nesta postura.",
        acBonus: 2,
      },
      {
        id: "cor_explosao",
        name: "Postura: Explosão",
        benefit:
          "Dado de dano de armas de fogo sobe 2 passos a até 6m (d6→d10, d8→d12, d10→d12+1, d12→d12+2). Recarregar é Ação Livre. Impacto Explosivo: ao rolar dano máximo, criaturas a 1,5m do alvo sofrem 1d6 de fogo.",
        restriction:
          "-2 na CA. Inimigos têm Vantagem em Ataques de Oportunidade contra você. Não pode se beneficiar de Cobertura.",
        maneuver:
          "Carga Dupla: Gaste 3 Focos ao atacar com arma de fogo. Escolha ponto a até 9m, explosão em cone de 4,5m. Alvos fazem Salvaguarda de DES (CD 8 + Proficiência + DES). Falha = dano total, sucesso = metade. Arma entope (Ação Bônus para limpar).",
        recovery: "Se matar 2+ inimigos com um único ataque (Impacto Explosivo ou Carga Dupla), recupera 1d4 de Foco.",
        acBonus: -2,
      },
    ],
    skills: DEXTERITY_SKILLS,
  },
};
