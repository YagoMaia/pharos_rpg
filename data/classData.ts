// src/data/classData.ts
import { CharacterClass, Skill, Stance } from "../types/rpg";
import { MARTIAL_SKILLS, DEXTERITY_SKILLS, ORATORY_SKILLS } from "./skillsData";

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
          "+1 na CA. Se usar escudo, usa Reação para impor Desvantagem em ataque contra aliado adjacente.",
        restriction:
          'Deslocamento reduzido à metade. Não pode usar ação "Correr".',
        maneuver:
          "Gaste 2 Focos para reduzir (1d10 + CON) de dano de um ataque contra você.",
      },
      {
        id: "gue_ofensiva",
        name: "Postura: Ofensiva",
        benefit: "Dobra bônus de Proficiência ao acerto de ataque.",
        restriction: '-2 na CA. Não pode usar ação "Esquivar".',
        maneuver: "Gaste 2 Focos para ganhar Vantagem em um ataque.",
        recovery: "Ao reduzir inimigo a 0 PV, recupera 1d4 de Foco.",
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
          "Não pode usar armas de fogo nem se movimentar voluntariamente.",
        maneuver:
          "1x/turno inimigos que entram no alcance provocam Ataque de Oportunidade.",
        recovery:
          "Ao reduzir a 0 PV inimigo que entrou no alcance, recupera 1d4 de Foco.",
      },
      {
        id: "van_mista",
        name: "Postura: Tática Mista",
        benefit:
          "Sem Desvantagem em armas de fogo à queima-roupa. Ação bônus para recarregar.",
        restriction:
          "Perde alcance extra da haste. Desvantagem em ataques corpo-a-corpo.",
        maneuver:
          "Após acertar corpo-a-corpo, gaste 2 Focos para disparar como Ação Bônus.",
      },
    ],
    skills: MARTIAL_SKILLS,
  },

  Mago: {
    stances: [
      {
        id: "mag_canalizador",
        name: "Postura: Canalizador",
        benefit: "Aumenta a CD das magias em +1.",
        restriction: "Não consegue recuperar foco.",
        maneuver:
          "Gaste 2 Focos para aumentar CD em +2 ou adicionar dado extra de dano.",
      },
      {
        id: "mag_recuperacao",
        name: "Postura: Recuperação",
        benefit: "Vantagem em testes de Concentração.",
        restriction: "Não pode lançar magias de dano direto.",
        maneuver:
          "Gaste Ação para regenerar (2d4 + CON) de Foco se não sofreu dano.",
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
          'Role 1d4 extra ao lançar magia para definir a "Qualidade do Caos" na tabela d100.',
        restriction:
          "Sujeito aos efeitos da Tabela de Caos (Catástrofe, Instabilidade, Fluxo, Perfeição).",
        maneuver:
          "Gaste 2 Focos para rerrolar o d4 de Caos ou o d100 da Tabela.",
      },
      {
        id: "apo_cacofonia",
        name: "Postura: Cacofonia de Espíritos",
        benefit: "Imune a detecção mágica. Vantagem em Furtividade.",
        restriction: "Não pode lançar magias (quebra a postura).",
        maneuver:
          "Ação: Sorteie 1 de 4 criaturas próximas. Ela sofre 1d4 necrótico e você recupera Foco igual ao dano.",
      },
    ],
    skills: [],
  },

  Atirador: {
    stances: [
      {
        id: "ati_franco",
        name: "Postura: Franco-atirador",
        benefit: "Dobra bônus de proficiência no ataque e dobra alcance.",
        restriction: "Deslocamento 0. Postura quebra se movido/derrubado.",
        maneuver:
          "Gaste 3 Focos antes de atacar para ignorar cobertura e armadura (ataca contra CA 10 + DES).",
        recovery: "Ao matar nesta postura, recupera 1d4 de Foco.",
      },
      {
        id: "ati_barragem",
        name: "Postura: Barragem",
        benefit:
          'Ignora "Recarga". Pode fazer ataque adicional como Ação Bônus ao atacar.',
        restriction: "-2 em todas as jogadas de ataque.",
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
          "1x/turno: Aliado a 3m ganha Vantagem em uma rolagem até seu próximo turno.",
        restriction: 'Deve falar e ser ouvido. Não pode usar "Esconder-se".',
        maneuver:
          "Gaste 2 Focos: Aliado usa Reação para atacar ou mover metade do deslocamento.",
        recovery:
          "Se aliados matarem 2+ inimigos com sua Vantagem, recupera 1d4 de Foco.",
      },
      {
        id: "ora_intimidar",
        name: "Postura: Intimidador",
        benefit:
          "1x/turno: Inimigo a 3m sofre Desvantagem em uma rolagem até seu próximo turno.",
        restriction: "Não pode usar Cobertura (alvo ostensivo).",
        maneuver:
          "Gaste 2 Focos ao interagir/atacar: Alvo faz teste de SAB ou fica Amedrontado.",
      },
    ],
    skills: ORATORY_SKILLS,
  },

  Corsário: {
    stances: [
      {
        id: "cor_danca",
        name: "Postura: Dança",
        benefit: '+2 na CA vs corpo-a-corpo. "Desengajar" como Ação Bônus.',
        restriction: "Deve sempre se mover no turno ou postura quebra.",
        maneuver:
          "Reação ao ser atingido (Gaste 1 Foco): Reduz dano em 1d8+DES. Se zerar, faz Ataque de Oportunidade.",
        recovery: "3 turnos sem ser atingido? Recupere 1d4 de Foco.",
      },
      {
        id: "cor_explosao",
        name: "Postura: Explosão",
        benefit:
          "Dano de armas de fogo/explosivos sobe um passo (d6->d8) a até 3m.",
        restriction:
          "-2 na CA. Inimigos têm Vantagem em Oportunidade contra você.",
        maneuver:
          "Gaste 4 Focos ao acertar: Dano máximo + 1 dado extra. Arma trava e precisa de limpeza (2 Ações).",
      },
    ],
    skills: DEXTERITY_SKILLS,
  },
};
