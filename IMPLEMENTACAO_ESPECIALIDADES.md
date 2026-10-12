# Plano de Implementação das Especialidades

## Visão Geral

Este documento descreve o plano completo para implementação do sistema de especialidades no RPG Pharos RP. O sistema permite que personagens no Nível 5 escolham uma especialização, refinando sua função dentro da Classe e desbloqueando novas habilidades específicas.

---

## Estrutura de Implementação

### 1. Estrutura de Dados

**Objetivo:** Adaptar a estrutura existente para armazenar dados estáticos das especialidades.

**Arquivos necessários:**
- `types/rpg.ts` - Atualizar as tipagens já existentes (`Specialization` e `ProficiencyChange`).
- `data/specializationsData.ts` - Arquivo TypeScript exportando o dicionário estático das especializações (substitui a necessidade de um JSON).

**Conteúdo esperado em `types/rpg.ts`:**
```typescript
export interface ProficiencyChange {
  name: string;
  description: string;
  // Campos para automação futura no combate (Fase 4)
  mechanicType?: 'armor' | 'weapon_damage' | 'immunity' | 'passive';
  mechanicValue?: number | string;
}

export interface Specialization {
  id: string;
  name: string;
  classRequired: CharacterClass;
  description: string;
  proficiencyChanges: ProficiencyChange[];
  newStances: Stance[]; // Aproveitando a interface Stance que já existe
}
```

### 2. Componentes de UI

**Objetivo:** Criar componentes para exibição e seleção de especialidades na tela de subida de nível.

**Componentes a criar:**
- `components/specializations/SpecializationCard.tsx`
- `components/specializations/SpecializationSelection.tsx`
- `components/specializations/SpecializationDetails.tsx`

### 3. Gerenciamento de Estado

**Objetivo:** Como os dados base são estáticos, não será necessário criar um Contexto Global exclusivo para eles. O gerenciamento será focado no fluxo de nível do personagem.

**Responsabilidades:**
- Importar as opções diretamente de `SPECIALIZATIONS` em `data/specializationsData.ts`.
- A escolha da especialização será salva no estado atual do Personagem (ex: via Contexto do Personagem ou Redux/Zustand já existente).
- Acionar o modal de escolha ao atingir o Nível 5.

### 4. Integração com Personagens

**Objetivo:** Conectar as especialidades ao objeto do personagem.

**Modificações necessárias:**
- O campo `specialization` já existe em `Character` (`types/rpg.ts`). O trabalho será alimentá-lo no *Level Up*.
- Substituir o array `character.stances` original pelas `newStances` da especialidade quando a escolha for confirmada.
- Resetar `character.currentStanceIndex` para 0 (garantindo que não aponte para um índice inexistente).

### 5. Sistema de Combate

**Objetivo:** Implementar as mecânicas passivas das novas posturas e habilidades.

**Componentes/Lógica:**
- `utils/combat/specializations.ts`
- O foco será durante a conversão do objeto `Character` para `Combatant`.

Funcionalidades:
- Posturas substituídas já estarão ativas nativamente se substituirmos o array do personagem na Fase 4.
- Aplicar modificadores estáticos de proficiência ao montar o `Combatant` (Ex: adicionar bônus de CA).

### 6. Validação e Testes

**Objetivo:** Garantir que todas as regras funcionem corretamente.

**Arquivos:**
- `tests/especialidades.test.ts`
- `utils/validadores/especialidades.ts`

---

## Ordem de Implementação Recomendada

### Fase 1: Fundamentos (1-2 dias)
1. Atualizar tipos e estrutura de dados
   - Refinar `Specialization` em `types/rpg.ts`.
   - Preencher todas as classes no `data/specializationsData.ts` baseadas no documento em Markdown.

### Fase 2: Interface (4-6 dias)
1. Criar componentes de exibição
   - `SpecializationCard.tsx`
   - `SpecializationDetails.tsx` com as novas Posturas e Benefícios.
2. Implementar fluxo de seleção
   - `SpecializationSelection.tsx` integrado à tela de Level Up (Nível 5).

### Fase 3: Integração no Personagem (2-3 dias)
1. Lógica de Level Up
   - Disparar seleção quando `level === 5`.
   - Modificar a função de "Salvar" para aplicar as `newStances` no array principal de posturas do Personagem.

### Fase 4: Automação das Mecânicas (6-8 dias)
1. Aplicar passivas de `ProficiencyChange`
   - Ler os modificadores da especialização ao inicializar o combate (convertendo `Character` -> `Combatant`).
2. Criar lógica de manobras e consumo de foco
   - Ajustar as mecânicas exclusivas (Ex: Regeneração baseada em acertos críticos do Caçador).

### Fase 5: Otimização e Testes (3-4 dias)
1. Testes unitários de aplicação de status
2. Testes da tabela de Caos Arcano (Apóstata)
3. Validação final de UX/UI

---

## Detalhes Técnicos por Fase

### Fase 1: Fundamentos

**Estrutura de Dados em TS:**
```typescript
// data/specializationsData.ts
import { Specialization } from "../types/rpg";

export const SPECIALIZATIONS: Record<string, Specialization> = {
  gue_encouracado: {
    id: "gue_encouracado",
    name: "Encouraçado",
    classRequired: "Guerreiro",
    description: "Sua armadura é uma extensão do próprio corpo...",
    proficiencyChanges: [
      {
        name: "Mestre das Armaduras",
        description: "Enquanto estiver usando Armadura Pesada, CA aumenta em +1.",
        mechanicType: "armor",
        mechanicValue: 1
      }
    ],
    newStances: [
      // array tipado usando a interface Stance padrão do sistema
    ]
  }
};
```

### Fase 2 e 3: Interface e Integração

**Componente Principal:**
```tsx
// components/specializations/SpecializationSelection.tsx
interface SpecializationSelectionProps {
  character: Character;
  onSelectSpecialization: (specId: string) => void; // Dispara a alteração de estado no Contexto
}
```

### Fase 4: Mecânicas no Combate

**Ajustando o Combatente:**
```typescript
// utils/combat/specializations.ts
export function applySpecializationPassives(character: Character, combatant: Combatant): void {
  if (!character.specialization) return;
  
  character.specialization.proficiencyChanges.forEach(change => {
    if (change.mechanicType === 'armor') {
      combatant.armorClass += Number(change.mechanicValue);
    }
    // Outras mecânicas passivas...
  });
}
```

---

## Próximos Passos Imediatos

Para começar a implementação, siga esta ordem:

1. **Hoje:** Ajustar a tipagem em `types/rpg.ts` e finalizar a transcrição do Markdown para o `data/specializationsData.ts`.
2. **Amanhã:** Começar o desenvolvimento visual do `SpecializationCard` e `SpecializationSelection`.
3. **Dia 3:** Integrar o componente de seleção com a lógica atual de evolução/edição do Personagem.

---

## Considerações Importantes e Riscos

- **Simplicidade de Estado:** Como as especializações são dados fixos, não os coloque em states react desnecessariamente. Apenas importe-os.
- **Substituição de Posturas:** Ao aplicar a especialização, as posturas base antigas não importam mais. Substituir direto no objeto `Character` previne bugs e reduz a complexidade da tela de combate.
- **Balanceamento e Performance:** Como a leitura de passivas ocorrerá na montagem do combate, a otimização desse cálculo não deve representar peso significativo de performance, porém deve ser exaustivamente testada em casos de borda.