import { Feat, Specialization, Stance } from "@/types/rpg";


// --- LISTA DE FAÇANHAS ---
export const FEATS_DATA: Feat[] = [
  // --- GERAIS ---
  {
    id: "habilidoso",
    name: "Habilidoso",
    category: "Geral",
    objective: "Treinamento rigoroso ou Crítico decisivo com atributo.",
    benefit: "+1 em dois Atributos (máx 18).",
  },
  {
    id: "competente",
    name: "Competente",
    category: "Geral",
    objective: "Mentor, livro raro ou feito notável com perícia.",
    benefit: "Nova Perícia e o Dobro de Proficiência em uma já conhecida.",
  },
  {
    id: "vigoroso",
    name: "Vigoroso",
    category: "Geral",
    objective: "Sobreviver a 0 PV ou doença potente.",
    benefit: "+1 CON (máx 18). +1 PV por nível.",
  },
  {
    id: "iniciativa",
    name: "Iniciativa Aprimorada",
    category: "Geral",
    objective: "Frustrar emboscada ou reagir primeiro em surpresa.",
    benefit: "Soma SAB na Iniciativa. Não pode ser Surpreendido.",
  },
  {
    id: "sortudo",
    name: "Sortudo",
    category: "Geral",
    objective: "Escapar da morte por acaso ou vencer aposta de alto risco.",
    benefit: "Gastar 3 Focos para re-rolar um d20 (1/descanso).",
  },

  // --- MARCIAIS ---
  {
    id: "matador_mago",
    name: "Matador de Mago",
    category: "Marcial",
    objective: "Derrotar conjurador sozinho ou destruir foco.",
    benefit: "Reação para atacar quem conjura a 1,5m (impõe Desvantagem).",
  },
  {
    id: "fortemente_armadurado",
    name: "Fortemente Armadurado",
    category: "Marcial",
    objective: "Sofrer dano massivo (75% PV) de armadura pesada e ficar de pé.",
    benefit:
      "Resistência a corte/perfuro/concussão (não-mágico) com Armadura Pesada.",
  },
  {
    id: "guerreiro_montado",
    name: "Guerreiro Montado",
    category: "Marcial",
    objective: "Adestrar montaria e lutar sem cair.",
    benefit: "Comandar montarias e vantagem tática montada.",
  },
  {
    id: "medico_campo",
    name: "Médico de Campo",
    category: "Marcial",
    objective: "Estabilizar aliado (0 PV) em combate sem magia.",
    benefit: "Ação: Kit Médico cura 1d6+Medicina. Estabiliza e cura 1 PV auto.",
  },
  {
    id: "especialista_polvora",
    name: "Especialista em Pólvora",
    category: "Marcial",
    objective: "Fabricar munição precária ou consertar arma em luta.",
    benefit: "Ignora 'Recarga'. 1 Foco (Bônus): Destravar ou criar munição.",
  },

  // --- SOCIAIS ---
  {
    id: "ator",
    name: "Ator",
    category: "Social",
    objective: "Infiltração com identidade falsa ou performance pública.",
    benefit: "+1 CAR (máx 18). Vantagem em Enganação/Atuação disfarçado.",
  },
  {
    id: "lider",
    name: "Líder",
    category: "Social",
    objective: "Reanimar grupo, resolver conflito interno ou liderar vitória.",
    benefit: "Discurso (Descanso Longo): PV Temp (CAR + Nível) aos aliados.",
  },
  {
    id: "negociador",
    name: "Negociador",
    category: "Social",
    objective: "Contrato vantajoso, lucro alto ou suborno de autoridade.",
    benefit:
      "Compra -20%, Venda +20%. Habilidade: Suborno automático (1/descanso).",
  },

  // --- MÁGICOS E MENTAIS ---
  {
    id: "poliglota",
    name: "Poliglota",
    category: "Mágico",
    objective: "Tradutor em crise, decifrar texto antigo ou imersão.",
    benefit: "2 idiomas, +1 INT (máx 18), comunicação rudimentar universal.",
  },
  {
    id: "mente_ferro",
    name: "Mente de Ferro",
    category: "Mágico",
    objective: "Manter concentração após muito dano.",
    benefit:
      "Vantagem em CON para Concentração. Pode manter 2 magias (falha perde ambas).",
  },
  {
    id: "especialista_elemental",
    name: "Especialista Elemental",
    category: "Mágico",
    objective: "Estudo obsessivo ou sobreviver a dano elemental massivo.",
    benefit:
      "Ignora Resistência ao elemento escolhido. Pode rolar novamente qualquer dado de dano dessa escola.",
  },
  {
    id: "memoria_fotografica",
    name: "Memória Fotográfica",
    category: "Mágico",
    objective:
      "Tarefa de dedução impossível (Crítico) ou transcrever tomo antigo sem dormir.",
    benefit:
      "+4 Slots de Memória (Magias). Por 3 Focos (Descanso Longo): Recordar qualquer memória de 30 dias perfeitamente.",
  },
];
