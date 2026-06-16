# Especificação — Área do Mestre (GM)

> **Projeto:** Pharos RPG  
> **Versão:** 2.0 — Reestruturação de Gestão de Campanhas  
> **Última atualização:** 2026-06-16  
> **Status:** Planejamento / Em Desenvolvimento

---

## 1. Visão Geral

A Área do Mestre é o núcleo de criação e gestão do app. Um Mestre pode:

- Criar e administrar múltiplas **campanhas**
- Construir uma **biblioteca pessoal** de NPCs, Monstros, Itens e Localidades
- **Vincular** qualquer entidade da biblioteca a uma ou mais campanhas (relação muitos-para-muitos)
- Publicar campanhas para que **jogadores possam entrar** via código ou convite
- Gerenciar sessões de combate em tempo real (funcionalidade atual, preservada)

---

## 2. Navegação — Tab Bar do Mestre

| # | Aba | Ícone | Descrição |
|---|-----|-------|-----------|
| 1 | **Painel** | `crown` | Dashboard com campanhas ativas e acesso rápido |
| 2 | **Campanhas** | `map` | Lista e gestão de todas as campanhas |
| 3 | **Biblioteca** | `book-open` | Repositório global de NPCs, Monstros, Itens e Localidades |
| 4 | **Combate** | `sword-cross` | Tela de combate em tempo real (existente) |

---

## 3. Telas e Funcionalidades

### 3.1 Painel (`/gm/dashboard`)

**Objetivo:** Visão rápida do estado atual do Mestre.

**Conteúdo:**
- Cards das **campanhas ativas** (máx. 3 em destaque), com:
  - Nome da campanha
  - Sistema (Pharos, D&D 5e, Tormenta20, etc.)
  - Número de jogadores que entraram
  - Status: `Ativa` | `Pausada` | `Encerrada`
  - Botão de acesso rápido
- Seção **"Adicionados Recentemente"**: últimos 4 itens criados na biblioteca (NPCs, Itens, Localidades)
- Botão **"Nova Campanha"** fixo (FAB)
- DiceRoller colapsável (mantido do sistema atual)

---

### 3.2 Campanhas (`/gm/campaigns`)

#### 3.2.1 Lista de Campanhas

**Filtros:** Todas | Ativas | Pausadas | Encerradas

**Card de Campanha exibe:**
- Imagem de capa (ou placeholder com gradiente)
- Nome e sistema de jogo
- Data de criação / última sessão
- Contadores: `X Jogadores` · `X NPCs` · `X Locais`
- Badge de status colorido
- Menu de contexto (editar, pausar, encerrar, duplicar, excluir)

**Ações:**
- `[+ Nova Campanha]` → abre formulário de criação

---

#### 3.2.2 Formulário de Nova/Editar Campanha

**Campos obrigatórios:**
```
Nome *
Sistema de Jogo *     → Pharos | D&D 5e | Tormenta20 | Call of Cthulhu | Outro
Descrição
Imagem de Capa       → upload ou geração de placeholder
```

**Campos gerados automaticamente:**
```
ID único (para link de convite)
Código de Acesso     → código curto alfanumérico (ex: FARO-4721)
Status               → "Ativa" por padrão
Data de criação
```

**Configurações:**
```
Visibilidade:
  ○ Aberta (qualquer jogador pode entrar com o código)
  ○ Privada (somente com aprovação do Mestre)
Número máximo de jogadores: [input numérico]
```

---

#### 3.2.3 Detalhe da Campanha (`/gm/campaigns/[id]`)

**Tabs Internas:**

| Tab | Conteúdo |
|-----|----------|
| **Visão Geral** | Descrição, código de acesso, lista de jogadores, notas |
| **NPCs** | NPCs vinculados + botão "Adicionar da Biblioteca" |
| **Monstros** | Monstros vinculados + botão "Adicionar da Biblioteca" |
| **Itens** | Itens vinculados + botão "Adicionar da Biblioteca" |
| **Localidades** | Locais vinculados + botão "Adicionar da Biblioteca" |
| **Notas** | Editor de texto livre (markdown simples) |

**Jogadores na campanha:**
- Lista de jogadores que aceitaram o convite
- Mostra: avatar, nome do personagem, classe, nível, sistema
- Ações: remover jogador, ver ficha (read-only)

**Vinculação de entidades:**
- Modal "Adicionar da Biblioteca" → busca + seleção múltipla
- Cada entidade vinculada mostra um badge "Nesta campanha"
- Desvincular sem excluir da biblioteca (independência)

---

### 3.3 Biblioteca (`/gm/library`)

**Objetivo:** Repositório global e reutilizável. Tudo criado aqui pode ser vinculado a qualquer campanha.

#### Tabs da Biblioteca:

---

##### 3.3.1 NPCs

**Card de NPC:**
- Foto/avatar (upload ou placeholder)
- Nome e papel (ex: "Mercador", "Aliado", "Antagonista")
- Tags coloridas (ex: `#nobre`, `#suspeito`, `#recorrente`)
- Badge: "Em X campanhas"

**Formulário de criação/edição:**
```
Nome *
Papel / Função *      → ex: Aliado, Antagonista, Neutro, Comerciante
Descrição             → texto livre
Aparência             → texto livre
Personalidade         → texto livre
Segredos              → campo oculto (só o Mestre vê)
Tags                  → campo múltiplo
Imagem                → upload
Vincular a campanha   → seleção múltipla (opcional)

--- Stats (Opcionais, sistema Pharos) ---
Nível, HP, Focus, CA
Atributos (For, Des, Con, Int, Sab, Car)
Perícias e Habilidades
Armas
```

> **Nota de Arquitetura:** Os stats seguem o `NpcTemplate` existente em `types/rpg.ts`. Campos de stat são opcionais — um NPC pode ser puramente descritivo (sem stats de combate).

---

##### 3.3.2 Monstros

Semelhante a NPCs, mas com campos específicos:

```
Nome *
Tipo *                → Besta, Morto-Vivo, Elemental, Humanoide, Aberração, etc.
CR (Challenge Rating) → campo de texto (ex: "1/4", "5", "20")
Tamanho               → Miúdo, Pequeno, Médio, Grande, Enorme, Colossal
Ambiente              → Floresta, Dungeon, Planícies, etc.
Descrição
Tags
Imagem

--- Stats (Opcionais, sistema Pharos) ---
[igual ao NpcTemplate]
```

---

##### 3.3.3 Itens

```
Nome *
Tipo *                → Consumível | Equipamento | Chave | Mágico | Tesouro
Raridade *            → Comum | Incomum | Raro | Épico | Lendário
Peso (kg)
Valor (Prata/Ouro)
Descrição
Efeito / Propriedades mágicas
Tags
Imagem
Vincular a campanha   → seleção múltipla (opcional)
```

---

##### 3.3.4 Localidades

```
Nome *
Tipo *                → Cidade | Vila | Masmorra | Floresta | Ruínas | Taverna | etc.
Região / Mundo        → texto livre
Descrição
História / Lore
Habitantes notáveis   → referência a NPCs da biblioteca
Tags
Imagem
Vincular a campanha   → seleção múltipla (opcional)
```

---

## 4. Tipos de Dados — `types/campaign.ts` (Novo)

```typescript
// ---- CAMPANHA ----
export type GameSystem = "Pharos" | "D&D 5e" | "Tormenta20" | "Call of Cthulhu" | "Outro";
export type CampaignStatus = "active" | "paused" | "finished";
export type CampaignVisibility = "open" | "private";

export interface Campaign {
  id: string;
  name: string;
  description: string;
  coverImage?: string;
  system: GameSystem;
  status: CampaignStatus;
  visibility: CampaignVisibility;
  accessCode: string;         // Código curto para os jogadores entrarem
  maxPlayers: number;
  createdAt: string;          // ISO 8601
  updatedAt: string;

  // Jogadores que aceitaram entrar
  playerIds: string[];        // IDs de jogadores (futuro: via auth)

  // Vinculações (muitos-para-muitos)
  linkedNpcIds: string[];
  linkedMonsterIds: string[];
  linkedItemIds: string[];
  linkedLocationIds: string[];

  notes: string;              // Notas do Mestre (markdown)
}

// ---- NPC ----
export type NpcRole = "Aliado" | "Antagonista" | "Neutro" | "Comerciante" | "Informante" | "Outro";

export interface NpcEntry {
  id: string;
  name: string;
  image?: string;
  role: NpcRole | string;
  description: string;
  appearance?: string;
  personality?: string;
  secrets?: string;           // Visível apenas para o Mestre
  tags: string[];
  linkedCampaignIds: string[];
  stats?: object;             // Compatível com NpcTemplate (types/rpg.ts)
  createdAt: string;
  updatedAt: string;
}

// ---- MONSTRO ----
export type MonsterType = "Besta" | "Morto-Vivo" | "Elemental" | "Humanoide" | "Aberração" | "Constructo" | "Dragão" | "Outro";
export type CreatureSize = "Miúdo" | "Pequeno" | "Médio" | "Grande" | "Enorme" | "Colossal";

export interface MonsterEntry {
  id: string;
  name: string;
  image?: string;
  type: MonsterType | string;
  cr: string;
  size: CreatureSize;
  environment?: string;
  description: string;
  tags: string[];
  linkedCampaignIds: string[];
  stats?: object;             // Compatível com NpcTemplate (types/rpg.ts)
  createdAt: string;
  updatedAt: string;
}

// ---- ITEM ----
export type ItemRarity = "Comum" | "Incomum" | "Raro" | "Épico" | "Lendário";
export type LibraryItemType = "Consumível" | "Equipamento" | "Chave" | "Mágico" | "Tesouro";

export interface ItemEntry {
  id: string;
  name: string;
  image?: string;
  type: LibraryItemType;
  rarity: ItemRarity;
  weight?: number;
  value?: string;             // Ex: "50 Pratas", "2 Ouros"
  description: string;
  properties?: string;        // Efeitos mágicos, propriedades especiais
  tags: string[];
  linkedCampaignIds: string[];
  createdAt: string;
  updatedAt: string;
}

// ---- LOCALIDADE ----
export type LocationType = "Cidade" | "Vila" | "Masmorra" | "Floresta" | "Ruínas" | "Taverna" | "Castelo" | "Outro";

export interface LocationEntry {
  id: string;
  name: string;
  image?: string;
  type: LocationType | string;
  region?: string;
  description: string;
  lore?: string;
  notableNpcIds?: string[];   // Referências a NpcEntry.id
  tags: string[];
  linkedCampaignIds: string[];
  createdAt: string;
  updatedAt: string;
}
```

---

## 5. Contexto — `context/GMContext.tsx`

### Responsabilidades
- CRUD completo para: `campaigns`, `npcs`, `monsters`, `items`, `locations`
- Vinculação/desvinculação entre campanhas e entidades
- Persistência via `AsyncStorage`

### Chaves de Armazenamento
```
@gm_campaigns
@gm_npcs
@gm_monsters
@gm_items
@gm_locations
```

### Interface
```typescript
interface GMContextType {
  // Campanhas
  campaigns: Campaign[];
  createCampaign(data: Omit<Campaign, "id" | "createdAt" | "updatedAt" | "accessCode">): void;
  updateCampaign(id: string, data: Partial<Campaign>): void;
  deleteCampaign(id: string): void;
  getCampaignById(id: string): Campaign | undefined;

  // NPCs
  npcs: NpcEntry[];
  createNpc(data: Omit<NpcEntry, "id" | "createdAt" | "updatedAt">): void;
  updateNpc(id: string, data: Partial<NpcEntry>): void;
  deleteNpc(id: string): void;

  // Monstros
  monsters: MonsterEntry[];
  createMonster(data: Omit<MonsterEntry, "id" | "createdAt" | "updatedAt">): void;
  updateMonster(id: string, data: Partial<MonsterEntry>): void;
  deleteMonster(id: string): void;

  // Itens
  items: ItemEntry[];
  createItem(data: Omit<ItemEntry, "id" | "createdAt" | "updatedAt">): void;
  updateItem(id: string, data: Partial<ItemEntry>): void;
  deleteItem(id: string): void;

  // Localidades
  locations: LocationEntry[];
  createLocation(data: Omit<LocationEntry, "id" | "createdAt" | "updatedAt">): void;
  updateLocation(id: string, data: Partial<LocationEntry>): void;
  deleteLocation(id: string): void;

  // Vinculação
  linkEntityToCampaign(campaignId: string, entityType: EntityType, entityId: string): void;
  unlinkEntityFromCampaign(campaignId: string, entityType: EntityType, entityId: string): void;
}

type EntityType = "npc" | "monster" | "item" | "location";
```

---

## 6. Fluxo de Publicação de Campanha

```
Mestre cria campanha
       ↓
Sistema gera código único (ex: FARO-4721)
       ↓
Mestre compartilha código com jogadores
       ↓
Jogador insere código no app → entra na campanha
       ↓
[Se privada] Mestre aprova/recusa o ingresso
       ↓
Campanha aparece no painel do jogador
```

---

## 7. Regras de Negócio

1. **Uma entidade pode pertencer a múltiplas campanhas** — excluí-la da biblioteca remove o vínculo de todas as campanhas.
2. **Desvincular ≠ Excluir** — remover de uma campanha não apaga da biblioteca.
3. **O código de acesso** é gerado automaticamente e é único; pode ser regenerado pelo Mestre a qualquer momento.
4. **Campanhas encerradas** ficam em modo somente-leitura para os jogadores.
5. **Stats são opcionais** — NPCs e Monstros podem ser puramente descritivos.
6. **O sistema de combate existente** continua funcionando; a aba "Combate" usa o `CampaignContext` atual sem alterações.

---

## 8. O que é Preservado (Sem Alteração)

| Arquivo/Contexto | Status |
|---|---|
| `context/CampaignContext.tsx` | ✅ Mantido (combate) |
| `context/CharacterContext.tsx` | ✅ Mantido |
| `context/WebSocketContext.tsx` | ✅ Mantido |
| `app/(player)/` (todas as telas) | ✅ Mantido |
| `app/(gm)/combat.tsx` | ✅ Mantido |
| `app/(gm)/gm-combat-screen.tsx` | ✅ Mantido |
| `types/rpg.ts` | ✅ Mantido |
| `constants/theme.ts` | ✅ Mantido |

---

## 9. Roadmap de Implementação

| Fase | Entregável | Prioridade |
|------|-----------|-----------|
| 1 | `types/campaign.ts` | 🔴 Alta |
| 2 | `context/GMContext.tsx` | 🔴 Alta |
| 3 | `app/_layout.tsx` (adicionar GMProvider) | 🔴 Alta |
| 4 | `app/(gm)/_layout.tsx` (nova tab bar) | 🔴 Alta |
| 5 | `app/(gm)/dashboard.tsx` (reescrever) | 🔴 Alta |
| 6 | `app/(gm)/campaigns/index.tsx` | 🟠 Média |
| 7 | `app/(gm)/campaigns/[id].tsx` | 🟠 Média |
| 8 | `app/(gm)/library/index.tsx` | 🟠 Média |
| 9 | Modais de criação (NPC, Monstro, Item, Local) | 🟠 Média |
| 10 | Componentes de card reutilizáveis | 🟡 Baixa |
| 11 | Integração jogador ↔ campanha (ver SPEC_JOGADOR) | 🟡 Baixa |
