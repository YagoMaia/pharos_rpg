# Especificação — Área do Jogador

> **Projeto:** Pharos RPG  
> **Versão:** 2.0 — Reestruturação de Gestão de Campanhas  
> **Última atualização:** 2026-06-16  
> **Status:** Planejamento / Em Desenvolvimento

---

## 1. Visão Geral

A Área do Jogador é reformulada para conectar o jogador ao ecossistema de campanhas criadas pelos Mestres. O jogador pode:

- Criar e gerenciar **personagens** (sistema Pharos atualmente, com suporte a novos sistemas no futuro)
- **Descobrir e entrar** em campanhas via código de acesso
- Ver o **painel de campanhas ativas** em que participa
- Acessar a **ficha de personagem** vinculada a cada campanha
- Visualizar (em modo leitura) conteúdo da campanha que o Mestre tornou público: localidades, itens relevantes, NPCs conhecidos

---

## 2. Navegação — Tab Bar do Jogador

| # | Aba | Ícone | Descrição |
|---|-----|-------|-----------|
| 1 | **Início** | `home` | Dashboard do jogador com campanhas e personagem ativo |
| 2 | **Personagens** | `person` | Lista e gestão de personagens |
| 3 | **Campanhas** | `map` | Campanhas em que o jogador participa |
| 4 | **Ficha** | `clipboard` | Ficha completa do personagem ativo (telas atuais) |

> **Nota:** A aba "Ficha" mantém as telas atuais de `home.tsx`, `combat.tsx`, `inventory.tsx`, `grimoire.tsx`, etc., do `(player)` atual.

---

## 3. Telas e Funcionalidades

### 3.1 Início (`/player/home-dashboard`)

**Objetivo:** Ponto de entrada do jogador, mostrando o estado atual de jogo.

**Conteúdo:**
- **Personagem Ativo** (card de destaque):
  - Avatar + nome + classe + nível
  - HP e Focus atuais (barra de progresso)
  - Botão "Ver Ficha Completa"
- **Minhas Campanhas** (lista horizontal de cards):
  - Nome da campanha, sistema, status
  - Mestre da campanha
  - Última atividade
  - Toque → vai para detalhe da campanha
- **Botão "Entrar em Campanha"** → abre modal de inserção de código
- **Dado de rolagem rápida** colapsável (mantido do sistema atual)

---

### 3.2 Personagens (`/player/characters`)

#### 3.2.1 Lista de Personagens

**Card de Personagem:**
- Avatar (upload ou placeholder)
- Nome, Classe e Nível
- Sistema de jogo (ex: "Pharos")
- HP atual / máximo
- Badge de campanha vinculada (se houver)
- Menu de contexto: Editar, Duplicar, Excluir, Exportar

**Ações:**
- `[+ Novo Personagem]` → abre formulário de criação
- Toque no card → vai para ficha completa

---

#### 3.2.2 Formulário de Novo Personagem

**Passo 1 — Sistema de Jogo:**
```
Escolha o sistema:
  ○ Pharos       (disponível)
  ○ D&D 5e       (em breve)
  ○ Tormenta20   (em breve)
```

> **Nota de Arquitetura:** O formulário de criação é modular. Para o sistema Pharos, carrega o fluxo de criação atual (classe, ancestralidade, origem, atributos). Futuros sistemas adicionam seus próprios formulários sem quebrar o existente.

**Passo 2 — Dados Básicos (Pharos):**
```
Nome *
Imagem / Avatar      → upload ou geração de placeholder
Classe *             → Guerreiro | Corsário | Vanguarda | Mago | Apóstata | Atirador | Orador
Ancestralidade
Origem Cultural
Nível                → padrão: 1
```

**Passo 3 — Atributos:**
```
Distribuição de pontos nos 6 atributos:
Constituição | Força | Carisma | Sabedoria | Inteligência | Destreza
```

**Passo 4 — Revisão e Criação**

---

### 3.3 Campanhas do Jogador (`/player/campaigns`)

#### 3.3.1 Lista de Campanhas

**Card de Campanha (visão do jogador):**
- Imagem de capa (fornecida pelo Mestre)
- Nome e sistema
- Nome do Mestre
- Status: `Ativa` | `Pausada` | `Encerrada`
- Personagem usado nesta campanha
- Data da última sessão

**Ações:**
- Toque no card → detalhe da campanha
- `[+ Entrar em Campanha]` (FAB) → abre modal de código

---

#### 3.3.2 Modal "Entrar em Campanha"

```
┌─────────────────────────────────┐
│  Entrar em uma Campanha         │
│                                 │
│  Código de acesso:              │
│  [  FARO-4721  ]                │
│                                 │
│  [Cancelar]     [Entrar]        │
└─────────────────────────────────┘
```

**Fluxo:**
1. Jogador insere o código fornecido pelo Mestre
2. App valida o código (local por hora, via API futuramente)
3. Exibe prévia da campanha: nome, sistema, Mestre, descrição
4. Jogador seleciona qual personagem vai usar nessa campanha
5. Se a campanha for **aberta** → entra imediatamente
6. Se for **privada** → envia solicitação e aguarda aprovação do Mestre
7. Campanha aparece na lista com status "Aguardando aprovação" se for privada

---

#### 3.3.3 Detalhe da Campanha (`/player/campaigns/[id]`)

**Tabs Internas (visão somente-leitura do que o Mestre compartilhou):**

| Tab | Conteúdo |
|-----|----------|
| **Visão Geral** | Nome, descrição, sistema, Mestre, jogadores presentes |
| **Localidades** | Locais que o Mestre marcou como "visíveis aos jogadores" |
| **NPCs Conhecidos** | NPCs que o Mestre revelou à mesa |
| **Itens** | Itens que o Mestre associou à campanha como descobertos |
| **Minha Ficha** | Atalho para a ficha do personagem vinculado |

> **Regra de Visibilidade:** O Mestre controla o que é visível. Por padrão, nada é mostrado ao jogador até o Mestre marcar como "revelado". Campos como "Segredos" de um NPC nunca são visíveis ao jogador.

---

### 3.4 Ficha Completa (`/player/sheet`)

Mantém todas as telas existentes:
- `home.tsx` → Stats, atributos, habilidades, posturas
- `combat.tsx` → Ações de combate do jogador
- `inventory.tsx` → Inventário e equipamentos
- `grimoire.tsx` → Magias (classes mágicas)
- `biography.tsx` → Histórico e origem
- `pet.tsx` → Monstro companheiro
- `dices.tsx` → Rolagem de dados

---

## 4. Tipos de Dados — `types/player.ts` (Novo)

```typescript
// ---- PARTICIPAÇÃO EM CAMPANHA ----
export type JoinStatus = "active" | "pending" | "rejected" | "removed";

export interface CampaignMembership {
  campaignId: string;
  characterId: string;       // Qual personagem o jogador usa nesta campanha
  joinedAt: string;          // ISO 8601
  status: JoinStatus;
  // Metadados da campanha (cache local para evitar buscas)
  campaignName: string;
  campaignSystem: string;
  gmName: string;
  lastActivity: string;
}

// ---- PERSONAGEM (extensão do Character existente) ----
// O tipo Character em types/rpg.ts é mantido.
// Adicionamos um wrapper para múltiplos personagens:

export interface PlayerProfile {
  id: string;
  displayName: string;
  avatarUrl?: string;
  characters: string[];      // IDs dos personagens (Character.id via CharacterContext)
  activeCharacterId?: string;
  memberships: CampaignMembership[];
  createdAt: string;
}
```

---

## 5. Contexto — `context/PlayerContext.tsx` (Novo)

### Responsabilidades
- Gerenciar múltiplos personagens do jogador (complementa o `CharacterContext` atual)
- Gerenciar participações em campanhas (`CampaignMembership`)
- Resolução de código de campanha para ingressar

### Chaves de Armazenamento
```
@player_profile
@player_memberships
```

### Interface
```typescript
interface PlayerContextType {
  // Perfil
  profile: PlayerProfile | null;
  setDisplayName(name: string): void;

  // Participação em campanhas
  memberships: CampaignMembership[];
  joinCampaignByCode(code: string): Promise<JoinResult>;
  leaveCampaign(campaignId: string): void;
  getMembershipByCampaign(campaignId: string): CampaignMembership | undefined;
  setCharacterForCampaign(campaignId: string, characterId: string): void;

  // Estado
  isLoading: boolean;
}

interface JoinResult {
  success: boolean;
  status: JoinStatus;
  campaign?: Partial<Campaign>;
  error?: string;
}
```

---

## 6. Fluxo de Entrada em Campanha

```
Jogador abre "Entrar em Campanha"
            ↓
Insere código: FARO-4721
            ↓
App busca campanha pelo código
(local: no GMContext / futuro: API)
            ↓
[Campanha não encontrada] → Exibe erro
            ↓
Campanha encontrada → Exibe prévia
            ↓
Jogador seleciona personagem
            ↓
   ┌─────────────────────┐
   │  Campanha Aberta?   │
   └──────┬──────────────┘
         SIM             NÃO
          ↓               ↓
    Entra direto    Envia solicitação
          ↓               ↓
  Campanha aparece   Status "Pendente"
  no painel          até Mestre aprovar
```

---

## 7. Visibilidade de Conteúdo — Regras

| Conteúdo | Mestre Controla? | Visível ao Jogador por Padrão |
|----------|-----------------|-------------------------------|
| Nome e descrição da campanha | ✅ | ✅ Sim |
| Lista de jogadores | ✅ | ✅ Sim |
| Localidades | ✅ | ❌ Não (revelado pelo Mestre) |
| NPCs | ✅ | ❌ Não (revelado pelo Mestre) |
| Segredos de NPC | ❌ Nunca | ❌ Nunca |
| Itens | ✅ | ❌ Não (revelado pelo Mestre) |
| Notas do Mestre | ❌ Nunca | ❌ Nunca |
| Monstros | ✅ | ❌ Não (revelado pelo Mestre) |

> **Implementação:** Cada entidade vinculada a uma campanha terá um campo `isRevealedToPlayers: boolean` que o Mestre pode alternar no detalhe da campanha.

---

## 8. Múltiplos Personagens por Jogador

O sistema atual suporta **um personagem ativo** via `CharacterContext`. A nova arquitetura expande para múltiplos:

```
CharacterContext (existente)
  └── personagem ativo (Character)     ← mantido sem alteração

PlayerContext (novo)
  └── profile.characters[]             ← lista de IDs de personagens
  └── memberships[]                    ← qual personagem vai em qual campanha
```

**Regras:**
- Um jogador pode ter N personagens
- Cada campanha usa um personagem específico (definido pelo jogador no momento de entrar)
- O personagem pode participar de múltiplas campanhas simultaneamente
- O "personagem ativo" no `CharacterContext` é o que aparece nas telas de ficha

---

## 9. Compatibilidade de Sistemas de Jogo

**Fase 1 (atual):** Criação de personagem somente para **Pharos**.

**Fase 2 (futura):** Arquitetura modular para novos sistemas:

```
/data/
  classData.ts          ← Pharos (existente)
  skillsData.ts         ← Pharos (existente)
  spellData.ts          ← Pharos (existente)
  systems/
    dnd5e/              ← D&D 5e (futuro)
    tormenta20/         ← Tormenta20 (futuro)
```

O formulário de criação de personagem detecta o sistema da campanha (ou o escolhido pelo jogador) e carrega o módulo correspondente.

---

## 10. O que é Preservado (Sem Alteração)

| Arquivo/Contexto | Status |
|---|---|
| `context/CharacterContext.tsx` | ✅ Mantido |
| `app/(player)/home.tsx` | ✅ Mantido (ficha ativa) |
| `app/(player)/combat.tsx` | ✅ Mantido |
| `app/(player)/inventory.tsx` | ✅ Mantido |
| `app/(player)/grimoire.tsx` | ✅ Mantido |
| `app/(player)/biography.tsx` | ✅ Mantido |
| `app/(player)/pet.tsx` | ✅ Mantido |
| `app/(player)/dices.tsx` | ✅ Mantido |
| `app/(player)/session-combat.tsx` | ✅ Mantido |
| `types/rpg.ts` | ✅ Mantido |

---

## 11. Roadmap de Implementação

| Fase | Entregável | Prioridade |
|------|-----------|-----------|
| 1 | `types/player.ts` | 🔴 Alta |
| 2 | `context/PlayerContext.tsx` | 🔴 Alta |
| 3 | `app/_layout.tsx` (adicionar PlayerProvider) | 🔴 Alta |
| 4 | `app/(player)/_layout.tsx` (nova tab bar) | 🔴 Alta |
| 5 | `app/(player)/home-dashboard.tsx` | 🔴 Alta |
| 6 | `app/(player)/characters/index.tsx` | 🟠 Média |
| 7 | Modal "Entrar em Campanha" (código) | 🟠 Média |
| 8 | `app/(player)/campaigns/index.tsx` | 🟠 Média |
| 9 | `app/(player)/campaigns/[id].tsx` | 🟠 Média |
| 10 | Formulário modular de criação de personagem | 🟡 Baixa |
| 11 | Integração com GMContext (resolução de código) | 🟡 Baixa |
| 12 | Backend/API para multi-usuário real (futuro) | ⚪ Futuro |

---

## 12. Dependências entre Especificações

Este documento depende de:
- [`SPEC_MESTRE.md`](./SPEC_MESTRE.md) — onde as campanhas são criadas e os códigos gerados
- `types/campaign.ts` — tipos compartilhados entre GM e Jogador

A resolução de código de campanha (passo 2 do fluxo de entrada) busca no `GMContext` localmente enquanto não há backend. Quando houver API, a busca passará por ela.
