// src/data/skillData.ts
import { Skill } from "../types/rpg";

// --- HABILIDADES MARCIAIS (Guerreiro, Vanguarda) ---
export const MARTIAL_SKILLS: Skill[] = [
  {
    id: 'mar_golpe',
    name: 'Golpe Demolidor',
    cost: 2,
    actionType: 'Padrão',
    description: 'Ataque corpo a corpo com 1 dado de dano extra. Vantagem contra escudo/armadura pesada.'
  },
  {
    id: 'mar_vigor',
    name: 'Vigor de Ferro',
    cost: 2,
    actionType: 'Ação Bônus',
    description: 'Recupera 1d10 + Constituição de Pontos de Vida.'
  },
  {
    id: 'mar_varrer',
    name: 'Varrer a Linha',
    cost: 3,
    actionType: 'Padrão',
    description: 'Atinge todos os inimigos em um cone de 3m. Dano normal e empurra 1,5m.'
  },
  {
    id: 'mar_bastiao',
    name: 'Bastião Imóvel',
    cost: 3,
    actionType: 'Reação',
    description: 'Reduz dano de um ataque pela metade. Imune a ser movido/derrubado até próximo turno.'
  }
];

// --- HABILIDADES DE DESTREZA (Corsário, Atirador) ---
export const DEXTERITY_SKILLS: Skill[] = [
  {
    id: 'dex_truque',
    name: 'Truque Sujo',
    cost: 2,
    actionType: 'Ação Bônus',
    description: 'Alvo a 3m faz teste de CON ou fica Cego/Prostrado.'
  },
  {
    id: 'dex_disparo',
    name: 'Disparo Incapacitante',
    cost: 2,
    actionType: 'Padrão',
    description: 'Ataque à distância com efeito: Deslocamento 0 OU Larga item/Desvantagem.'
  },
  {
    id: 'dex_reflexo',
    name: 'Reflexo Relâmpago',
    cost: 2,
    actionType: 'Reação',
    description: 'Soma Proficiência na CA contra um ataque ou Vantagem em teste de DES.'
  },
  {
    id: 'dex_passo',
    name: 'Passo Esgueiro',
    cost: 1,
    actionType: 'Ação Bônus',
    description: 'Mova-se até 1,5m sem provocar ataque de oportunidade.'
  }
];

// --- HABILIDADES DE ORATÓRIA (Orador) ---
export const ORATORY_SKILLS: Skill[] = [
  {
    id: 'ora_comando',
    name: 'Comando Tático',
    cost: 3,
    actionType: 'Ação Bônus',
    description: 'Aliado usa Reação para realizar Ataque ou Truque imediatamente.'
  },
  {
    id: 'ora_ultimato',
    name: 'Ultimato',
    cost: 3,
    actionType: 'Padrão',
    description: 'Inimigos em cone de 5m fazem teste de SAB ou ficam Intimidados.'
  },
  {
    id: 'ora_autoridade',
    name: 'A Voz da Autoridade',
    cost: 4,
    actionType: 'Padrão',
    description: '3 Aliados ganham +2 no próximo ataque ou teste de resistência.'
  },
  {
    id: 'ora_palavra',
    name: 'Palavra de Coragem',
    cost: 2,
    actionType: 'Padrão',
    description: 'Um aliado recupera 1d6 + Carisma PV.'
  }
];