# Análise: App Desktop para o Mestre — Electron vs alternativas

> Data: 2026-10-30
> Escopo: avaliar a viabilidade de um app desktop onde o Mestre organiza sessões, encontros e
> monstros, com sincronização ao servidor para alimentar players (mobile) e o app web.

---

## 1. Estado atual (o que já existe)

### 1.1 O ecossistema

| Camada | Stack | Tamanho |
|---|---|---|
| `pharos_rp` (cliente) | Expo 54 / RN 0.81 / React 19 / TS 5.9 / expo-router 6 | ~31k LOC (app 6.2k, components 18.6k, services 385) |
| `pharos_rpg_server` (backend) | FastAPI + SQLite cru + Redis (pub/sub + estado de combate) | ~3.7k LOC app + 2.8k LOC testes, 41 rotas HTTP + 1 rota WS |

### 1.2 Descoberta central: **a versão web já existe e está no ar**

Este é o fato que muda toda a decisão. O `pharos_rp` já:

- tem `react-native-web ~0.21` + `react-dom` como dependências;
- tem script `"web": "expo start --web"` e `app.json → web.output: "static"`;
- é **exportado e publicado como SPA hoje**: `Dockerfile` (`npx expo export --platform web`),
  `nginx.conf`, `docker-compose.yml` (frontend :3000 + Cloudflare Tunnel →
  `pharos-server.yagomaia.com.br` é a base da API).

Ou seja: **o mestre hoje já consegue abrir a versão web da ferramenta no navegador do desktop.**
O gargalo não é "não existe desktop", é "a UI é mobile-first e o tempo real tem fragilidades".

### 1.3 O backend já começou o caminho "mestre desktop/mobile sync"

- Branch/PR já mergesado: `feat/master-mobile-desktop-sync` (PR #5) — criou a
  **biblioteca de templates de NPC por usuário** (`/npc-library`) com **sync em lote**:
  `POST /npc-library/sync` aceita `id` e `updatedAt` gerados no cliente, aplica
  last-write-wins e devolve a lista autoritativa. Isso é, literalmente, o primitive de
  sincronização offline-first que um app desktop precisaria — para bestiário.
- `POST /campaigns/{id}/encounters/{eid}/launch` (HTTP) sorteia iniciativa, injeta monstros
  no ambiente Redis `campaign-{id}` e faz `broadcast_state` na sala WS. **O fluxo
  "mestre monta encontro no desktop → players no mobile veem na iniciativa" funciona hoje**,
  sem trabalho extra.
- Sessões (`campaign_sessions`), quests, diário (`journal_entries`), encontros
  (`campaign_encounters` com `monsters_data` JSON) e dossiês de NPC (`campaign_npcs`) já têm
  CRUD REST com papéis (`gm`/`party`) **validados no servidor**, e `created_at`/`updated_at`
  em todas as tabelas.
- `GET /campaigns/{id}/members/{memberId}/sheet` deixa o GM ler fichas dos players;
  `PUT .../character/sheet` é push de blob (já é um modelo de sync por substituição).

### 1.4 O que o GM já tem (e onde dói)

Telas GM em `(gm)/`: `dashboard` (só rolagem de dados — sem visão geral de campanha),
`campaigns` (540 LOC + `CampaignWorkspace` 996 LOC com abas de sessões, quests, encontros,
NPCs, diário), `npcs` (bestiário com sync), `combat` e `gm-combat-screen`.

Dor real para o Mestre: modais dimensionados para celular (`AddNpcModal` 1.813 LOC,
`AreaAttackModal` 1.368 LOC), sem atalhos de teclado, sem layout de painel em telas grandes,
e entrada de texto longa (descrever encontros, monstros, diário) no teclado do celular.

### 1.5 Débitos que afetam qualquer app desktop

Confirmados no código:

1. **WS não passa pelo nginx/túnel.** O `nginx.conf` do frontend só serve estáticos; o cliente
   conecta `ws(s)://host` direto no backend (`ws://{host}:8000/ws/...` no modo legado). Um
   cliente desktop atrás do Cloudflare Tunnel precisa de proxy `/ws` + HTTPS (wss).
2. **Sala legada sem autenticação**: `/ws/{session_id}` que não começa com `campaign-` é aceita
   sem token (`websocket.py`), com `identity.role=None`. Porta de entrada a fechar antes de
   distribuir um client fora do círculo próximo.
3. **Hardcodes de mesa**: `TABLE_NAMES = (Gabriel, Leandro, Yago, Luiz, Amom, Victor, Wayne,
   Visitante)`, PIN == nome minúsculo, e `create_campaign` só para `"Victor"`
   (`campaign_store.py:294-298`). No cliente, `services/tableRoster.ts` é roster fixo.
4. **Sem sync incremental** para sessões/quests/diário/encontros/NPCs de campanha: não existe
   `?since=`, cursor, tombstone/soft-delete, version ou ETag. Toda listagem é coleção completa
   e o `PUT` é substituição (segundo escritor ganha em silêncio). Diário tem `LIMIT 100` fixo.
5. **Comparação lexicográfica de timestamps** (`campaign_store.sync_npc_templates`) — formatos
   mistos (`Z` vs `+00:00`) quebram ordenação de last-write-wins.
6. **Combate ao vivo**: sem snapshot ao conectar (cliente novo recebe nada até o próximo evento
   estrutural), `state:{room}` no Redis com TTL 3600s, `logs[]` sem limite, sem event id/
   replay, e `gmClientId` em slot único → **desktop GM + mobile GM se pisam**.
7. **Token no AsyncStorage** (plaintext, `@pharos_session_1`) no mobile; sem refresh token;
   CORS `*`; sem rate limit HTTP.
8. `campaign_store.py` (1.140), `player_service.py` (834) e `campaigns.py` (571) violam a regra
   do próprio AGENTS.md (500 linhas) — estender sync neles sem dividir piora o débito.
9. `ruff` está prescrito no AGENTS.md mas não está no `pyproject.toml`/`requirements.txt`
   (drift de config).
10. `pharos_rp` não tem script `test` no `package.json` embora o AGENTS.md prescreva
    `pnpm test` (os testes `.cjs` rodam com `node --test tests/`).

---

## 2. A premissa precisa ser reformulada

A pergunta foi "vale fazer um app desktop (Electron ou outro) para o mestre organizar sessões,
encontros e monstros". A análise sugere uma leitura diferente:

> O problema real é **ergonomia de autoria para o GM em tela grande + resiliência de rede**,
> não "falta um binário desktop".

Evidências:

- O alvo é uma mesa fixa (uma mesa de jogo, ~8 pessoas). Multi-tenancy hoje é por campanha e
  há hardcode de Victor/nomes da mesa: isto é um produto para uso próprio, não SaaS.
- O app web **já está publicado** e é a mesma base de código do mobile.
- O sync que o desktop precisaria já começou pelo lado do servidor (`/npc-library/sync`).

Consequência: a decisão "Electron vs Tauri vs PWA" é **a última** a ser tomada, e é barata.
As decisões caras e inevitáveis são outras, e valem para **qualquer** caminho:

1. Extrair contrato de API/tipos/WS num pacote compartilhado.
2. Fazer o layout web responsivo para tela grande (painel GM em duas colunas, tabelas,
   atalhos de teclado).
3. Fazer proxy `/ws` no nginx/túnel (wss) — sem isso, **nenhum** client desktop funciona bem.
4. Ganhar sync incremental no backend se o offline for requisito.

---

## 3. Alternativas, com prós e contras

### A. PWA / web app instalado (browser, sem shell)

Empacotar o que já existe: responsivo + manifest + service worker.

| Prós | Contras |
|---|---|
| Custo incremental mínimo: a base já exporta web e já faz deploy | Depende de o layout mobile-first ser adaptado (o trabalho real) |
| Zero distribuição: o mestre só abre o browser / "instalar app" | Offline real é limitado (SW + IndexedDB dá, mas exige sync bem feito) |
| Atualização contínua, sem instalador nem canal de release | WebView do browser varia; sem APIs nativas (notificação de sistema OK via Push, mas mais atrito) |
| Mesmo código no mobile, web e desktop → 1 superfície de bugs | Service worker + WS + auth exige cuidado (cache de SPA e token) |

### B. Electron

| Prós | Contras |
|---|---|
| Chromium: o build `expo export --platform web` roda quase sem ajuste | ~200–300 MB instalado, 150–300 MB RAM por janela |
| Node no main process: fácil fazer SQLite local, fila de sync, fs, keytar/DPAPI p/ token | Empacotar/atualizar/distribuir é trabalho próprio (electron-builder + assinatura de código no Windows) |
| Controle total de janela, atalhos globais, multi-janela (tela do mestre + tela de projeção) | Superfície de segurança maior (contextIsolation, preload, CSP) |
| Ecossistema maduro, docs, milhares de exemplos | Team não tem nenhuma expertise Electron no repo; custo de manutenção perpétuo |
| Bom para multi-processo: janela de "projeção para a mesa" + janela de GM | Overkill para um app que é uma SPA atrás de um túnel Cloudflare |

### C. Tauri v2

| Prós | Contras |
|---|---|
| ~5–10 MB, RAM muito menor (usa WebView2, presente no Windows 10/11) | WebView2 ≠ Chromium 100%: reanimated/gesture-handler no web já é o ponto fraco hoje |
| Rust sidecar com SQLite nativo forte, auto-update oficial | Rust no caminho crítico do projeto — team é TS + Python |
| Security model mais restrito por padrão | Tipos do domínio precisam ser duplicados/marshalled em Rust (fricção com `types/rpg.ts`) |
| Boa história de distribuição Windows (MSI) | Menos exemplos de "Expo web dentro do Tauri" que dentro do Electron |

### D. Web app desktop dedicado (mesmo monorepo, pacote compartilhado)

Extrair `@pharos/api` + `@pharos/types` + `@pharos/ws` do `pharos_rp` e criar um app web
propositado para GM (Next/Vite + shadcn), mantendo o mobile como está.

| Prós | Contras |
|---|---|
| UI feita de verdade para tela grande e teclado, sem remendos de RN-web | Segundo app para manter: segunda stack de UI, dois deploys |
| Liberdade de componentes de desktop (tabelas, dnd, virtualização) | Duplicação de negócio se a extração do pacote compartilhado for mal feita |
| Não adiciona shell nativo nem Rust ao projeto | O esforço de extração é o maior up-front de todas as opções |
| WebSockets/túnel precisam ser consertados de qualquer forma | Risco de divergência de comportamento mobile vs desktop |

### E. React Native Desktop (fork comunitário do RN)

| Prós | Contras |
|---|---|
| Reaproveitaria JSX/RN direto | Projeto comunitário, não o RN oficial; risco de abandono |
| — | Expo + New Arch + reanimated no macOS/Windows: suporte incerto |
| — | Não resolve layout desktop nem sync, que são os problemas reais |

**Veredito: descartar.**

### F. Focar em tablet (landscape) em vez de desktop

| Prós | Contras |
|---|---|
| Zero nova plataforma: é o app que já existe | Não dá teclado físico nem multi-janela (projeção) |
| Mesa física com iPad/tabs de mesa é o caso de uso mais natural de um RPG de mesa | Layout atual ainda precisa ser refatorado |

### Tabela-resumo

| Critério | A PWA | B Electron | C Tauri | D Web dedicado | E RN Desktop | F Tablet |
|---|---|---|---|---|---|---|
| Reuso do código atual | ★★★ | ★★★ | ★★☆ | ★★☆ | ★★★ | ★★★ |
| Esforço inicial | ★★☆ (baixo) | ★★☆ | ★☆☆ | ★☆☆ (alto) | ★★☆ | ★★★ |
| Offline-first real | ★★☆ | ★★★ | ★★★ | ★★☆ | ★★☆ | ★☆☆ |
| Ergonomia desktop real | ★★☆ | ★★★ | ★★★ | ★★★ | ★★☆ | ★☆☆ |
| Custo de manutenção | ★★★ | ★☆☆ | ★★☆ | ★★☆ | ★★☆ | ★★★ |
| Multi-janela / projeção | ★☆☆ | ★★★ | ★★☆ | ★☆☆ | ★☆☆ | ★☆☆ |
| Risco técnico | baixo | médio | médio-alto | médio | alto | baixo |
| Adequado ao porte do projeto | ★★★★★ | ★★☆ | ★★★ | ★★★ | ★ | ★★★★ |

---

## 4. Recomendação

**Recomendação: caminho em duas etapas, com PWA como entrega e Electron como shell opcional
tardio. Não abrir com Electron.**

**Etapa 1 (fazer já, é pré-requisito de qualquer opção):**
consolidar a experiência web do GM — proxy `/ws` no nginx/túnel, layout responsivo de painel,
endurecer auth/WS. Ao final disso, o Mestre tem um "app desktop" instalável pelo navegador com
zero custo de distribuição. **Esta etapa resolve ~80% da dor descrita** (organizar sessões,
encontros e monstros em tela grande, sincronizando com mobile), com o código que já existe.

**Etapa 2 (só se offline e/ou multi-janela forem requisito duro):**
empacotar o **mesmo** bundle web exportado dentro de um shell. Entre Electron e Tauri:

- **Electron** se você quer SQLite local no main process, Node para fila de sync, keytar para
  token, e não se importa com 250 MB + assinatura de código. É a aposta de menor atrito
  técnico com Expo web, e o mais indicado **para este projeto específico**, porque a equipe é
  TS e o shell seria fino (quase só janela + storage).
- **Tauri** se tamanho e RAM importam e você aceita Rust no build. Para offline com SQLite é
  mais elegante, mas adiciona fricção de tipos com `types/rpg.ts` (501 LOC de domínio TS).

Se offline-first for o motivo de existir do desktop, o Electron tende a ganhar porque o
trabalho de sync fica em TS (mesmo idioma do app), não em Rust.

**Não recomendado:** criar um app web desktop separado (opção D) antes da etapa 1. O esforço de
extração de pacote compartilhado vale a pena, mas um segundo front de UI só se justifica se,
depois da etapa 1, o RN-web continuar insuficiente para o painel GM.

### 4.1 Registro de decisão (2026-10-30)

Três respostas do dono do projeto fecharam a equação:

| Pergunta | Resposta | Consequência |
|---|---|---|
| Offline é requisito? | **Conveniência** — backend e frontend ficam deployados no VPS | Fases 3 e 4 (sync incremental + offline-first) caem do escopo |
| Projeção para a mesa importa? | **Não** — jogadores acompanham pelo próprio celular | Fase 5 (shell desktop) e a rota `table` caem do escopo |
| Vai sair do grupo atual? | **Não** — ferramenta de um grupo fixo de 5 pessoas | Multi-tenant, onboarding self-service e distribuição assinada caem do escopo |

**Decisão: caminho PWA/web. Electron descartado.**

Com as três respostas, os três justificadores que um shell nativo teria — offline real,
multi-janela/projeção e distribuição para terceiros — desaparecem todos. Sobra apenas a
ergonomia de tela grande, e isso o build web já publicado entrega.

Ganho colateral importante: **o argumento para a Fase 1 (criar `packages/pharos-core`) também
enfraquece.** Extrair um pacote compartilhado só se paga quando existe um segundo consumidor
(app desktop separado, outro front). Sem segundo consumidor, o que resta é higiene interna do
`pharos_rp` — que ainda vale pela regra de 500 linhas do AGENTS.md, mas não justifica montar
workspace npm novo.

---

## 5. Plano de implementação

Estimativas em "sessões de trabalho" (não dias corridos). Cada fase tem validação explícita e
termina em commit/PR próprio.

### Fase 0 — Pré-requisitos de infraestrutura (sem UI nova)
*Reutiliza código existente; destrava tudo o resto.*

1. Proxy de WebSocket no `nginx.conf` do `pharos_rp`: `location /ws/ { proxy_pass http://backend:8000; proxy_http_version 1.1; proxy_set_header Upgrade ...; proxy_set_header Connection "upgrade"; }`. Unificar o cliente para **sempre** usar `wss://<mesmo host>/ws/campaign-{id}` — remover o caminho legado `ws://{host}:8000` do `WebSocketContext`.
2. Fechar a sala legada não autenticada no backend (rejeitar `session_id` sem prefixo `campaign-`), com teste cobrindo o close 1008.
3. Snapshot ao conectar: ao autenticar, enviar o `CombatSession` atual se existir (elimina o "cold start" — essencial para desktop).
4. `pnpm test` real: adicionar script `"test": "node --test tests/"` no `package.json`; adicionar `ruff` ao `pyproject.toml` [dependency-groups dev].

Validação: `uv run pytest`, `uv run ruff check .`, `pnpm lint`, `pnpm test`, teste manual de WS via túnel em `https://pharos-server.yagomaia.com.br`.
Esforço: ~2–4 sessões. **Depois desta fase, o GM pode usar a web no desktop de forma confiável.**

### Fase 1 — Extração do contrato compartilhado
*Barato agora, caro depois. Não precisa de app novo.*

1. Criar `packages/pharos-core` (o repo já tem `pnpm-workspace.yaml`): mover
   `services/campaignApi.ts`, `services/campaignView.ts`, `types/rpg.ts`, `types/websocket.ts`,
   `utils/campaignSocket.ts` e `data/*`.
2. Mover os tipos de campanha (hoje dentro de `campaignApi.ts`: `CampaignSummary/Details/
   Session/Quest/Encounter/NpcTemplate/JournalEntry`) para `types/campaign.ts`.
3. Canais de WS tipados (discriminated union cobrindo os 3 shapes de frame do servidor:
   snapshot, delta `{"type","payload"}` e `{"error"}`).
4. Manter os testes `.cjs` apontando para o pacote.

Validação: `pnpm test`, `pnpm type-check`, `pnpm lint`, app mobile inalterado em comportamento.
Esforço: ~3–5 sessões.

### Fase 2 — Painel GM em tela grande (web responsivo)
*A entrega de maior valor para a dor descrita.*

1. Refatorar `CampaignWorkspace` (996) em layout de duas colunas no web: lista/na esquerda,
   detalhe à direita; tabelas em vez de cards empilhados para sessões, encontros, NPCs e diário.
2. Partir os monstros de modal (`AddNpcModal` 1.813, `AreaAttackModal` 1.368) em formulários
   que funcionem como painel/rotas dedicadas no web (respeitando a regra de 500 linhas).
3. `dashboard.tsx` GM: substituir o atual (só rolador de dados) por visão real da campanha —
   próxima sessão, encontros `planned`, fichas pendentes, últimos diários.
4. Gate de rota por papel no expo-router (o papel hoje é escolha de navegação em `app/index.tsx`,
   não fronteira de autorização).
5. Substituir `tableRoster.ts` hardcode por roster vindo de `GET /campaigns/{id}`.
6. Build web dedicado (`expo export --platform web`) com perfil próprio no fluxo de deploy.

Validação: `pnpm type-check`, `pnpm test`, checagem manual em 1280/1920 px e em tablet
landscape; regressões de mobile confirmadas pelos testes existentes.
Esforço: ~6–10 sessões (maior bloco do plano).

### Fase 3 — Sync incremental no backend
*Só necessário se offline for requisito.*

1. Coluna `deleted_at` (tombstone) em `campaign_sessions`, `campaign_quests`,
   `journal_entries`, `campaign_encounters`, `campaign_npcs` + soft delete.
2. Parâmetro `?since=<updated_at>` (e `?limit`/`?after` para o diário, hoje `LIMIT 100`) em
   todas as listagens, devolvendo tombstones.
3. `POST /campaigns/{id}/sync` espelhando `sync_npc_templates` (last-write-wins por
   `updatedAt`), **com relatório de conflito** no response.
4. Normalizar `updated_at` para UTC canônico com `Z` e comparar como timestamp, não string.
5. Dividir `campaign_store.py` por agregado (auth/tokens, campaign/members, planning,
   encounters/npcs, library/sync) antes de escrever o item 3 — exige a regra de 500 linhas do
   AGENTS.md e reduz o risco.
6. TTL do `state:{room}` no Redis: remover/aumentar e limpar em `end_combat`.

Validação: TDD obrigatório (regra do repo) — teste novo por endpoint (`?since` retorna
tombstone, conflito reportado, `updated_at` fora de ordem tratado). `uv run pytest`.
Esforço: ~5–8 sessões.

### Fase 4 — Offline-first no cliente GM
1. Cache local: expo-sqlite (funciona em web via wa-sqlite/IndexedDB) ou KV+IndexedDB fino,
   com fila de mutações offline e `clientId` idempotente.
2. Reconciliar com `/campaigns/{id}/sync` + `/npc-library/sync`; UI de conflito explícita
   (servidor autoritativo, aviso quando outro editor ganhou).
3. Token para cofre seguro no mobile (`expo-secure-store`) e storage adequado no desktop.

Validação: testes de reconciliação com fetcher fake (padrão já usado em `tests/`); teste de
regressão de "muda offline, volta, aplica sem perder nada".
Esforço: ~6–10 sessões.

### Fase 5 — Shell desktop (opcional, só depois da Fase 2)
1. Electron: `electron/` com `main.ts` carregando `dist/` do `expo export --platform web`;
   `electron-builder` para Windows (NSIS), `contextIsolation: true`, `nodeIntegration: false`,
   IPC mínimo; SQLite/queue no main process se a Fase 4 rodou.
2. Janela secundária de "projeção para a mesa" (iniciativa/incontro), que é um ganho real e só
   existe em desktop.
3. Auto-update (electron-updater) — ou decidir conscientemente por não ter, já que web atualiza
   sozinho.

Validação: smoke manual + build reproduzível; `pnpm type-check`.
Esforço: ~3–6 sessões.

### Sequência recomendada

```
Fase 0 (2-4)  ──► Fase 1 (3-5) ──► Fase 2 (6-10) ──► [avaliar: o PWA bastou?]
                                            │
                              sim ──────────┤
                              não ──► Fase 3 (5-8) ──► Fase 4 (6-10) ──► Fase 5 (3-6, Electron)
```

Total até o GM ter ferramenta desktop usável: **~11–19 sessões** (Fases 0–2), contra
**~25–43 sessões** do caminho completo com offline + Electron.

---

## 6. Riscos e pontos de atenção

| Risco | Mitigação |
|---|---|
| `react-native-reanimated` / `gesture-handler` no web são o ponto frágil do build web já publicado | Inventariar animações nas telas GM e usar fallback CSS/`Platform.OS === "web"` antes da Fase 2 |
| `gmClientId` em slot único: GM abre desktop e mobile ao mesmo tempo e um é rejeitado | Permitir múltiplos sockets GM por campanha (lista, não slot) na Fase 0/3 |
| Distribuir client fora do círculo próximo expõe PIN==nome e "só Victor cria campanha" | Refatorar auth de mesa (PIN real, papéis por convite) **antes** de qualquer distribuição pública |
| Token em AsyncStorage/plaintext | `expo-secure-store` no mobile, DPAPI/keytar no Electron |
| CORS `*` + sem rate limit HTTP | Restringir origin e adicionar rate limit ao expor um client instalável |
| Split de `campaign_store.py` sem testes é arriscado | Suíte de 2.8k LOC já cobre o ground truth — rodar antes/depois de cada corte |
| `feat/combat-area-attack` está 2 commits à frente de `main` (não mergesado) | Rebasear/mergear antes de mexer em `engine.py`/`player_service.py` |

---

## 7. O que decidir agora

*(Resolvido em 2026-10-30 — ver §4.1. Mantido aqui como trilha da decisão.)*

1. **Offline é requisito ou é conveniência?** → Conveniência. Fases 3–4 fora do escopo.
2. **Multi-janela / projeção para a mesa importa?** → Não. Jogadores usam o próprio celular.
3. **Vai sair da sua mesa?** → Não. Grupo fixo de 5 pessoas.

### Escopo resultante (revisado)

| Bloco | Conteúdo | Esforço | Status |
|---|---|---|---|
| **0 — Confiabilidade** | Proxy `/ws` no nginx/túnel; snapshot do combate ao conectar; fechar sala WS legada sem auth; **persistir estado de combate no SQLite** (hoje só Redis com `ex=3600`); `pnpm test` e `ruff` nos configs | 2–4 | **fazer** |
| **1 — Higiene do contrato** | *Reduzida*: mover tipos de campanha de `campaignApi.ts` para `types/campaign.ts`, tipar os 3 shapes de frame WS, partir `campaign_store.py` por agregado, derrubar `tableRoster.ts`. **Sem** criar `packages/pharos-core` | 1–2 | **fazer** |
| **2 — Painel GM em tela grande** | Layout responsivo de duas colunas; partir `AddNpcModal`/`AreaAttackModal`; dashboard GM real; gate de rota por papel | 6–10 | **fazer** |
| 3 — Sync incremental | tombstones, `?since=`, `/campaigns/{id}/sync` | ~~5–8~~ | **descartado** |
| 4 — Offline-first client | fila de mutações + reconciliação | ~~6–10~~ | **descartado** (vira cache read-only trivial no bloco 0) |
| 5 — Shell Electron | empacotar o bundle web | ~~3–6~~ | **descartado** |

**Total: ~9–16 sessões**, contra ~25–43 do caminho completo. Entrega: PWA instalável pelo
navegador (`chrome --app=<url>` / "Instalar aplicativo"), sem instalador nem canal de release.

### Segurança: o que muda com grupo fixo de 5

Com um grupo conhecido e servidor de uso interno, o pragmatismo é defensável — e o código já
assume isso de propósito (o comentário do `table_login` diz que o PIN "evita apenas erros
casuais"). Mantém-se apenas o que protege **funcionalidade** ou **superfície pública já exposta**:

| Item | Ação | Motivo |
|---|---|---|
| Sala WS legada sem prefixo `campaign-` aceita sem auth | **Fechar** (bloco 0) | Servidor é público (`pharos-server.yagomaia.com.br`); fechamento é 1 condição + 1 teste |
| Proxy `/ws` no nginx | **Fazer** (bloco 0) | É o que quebra o tempo real atrás do túnel — não é paranoia, é funcionalidade |
| `TABLE_NAMES`, PIN == nome, regra "só Victor" | **Aceito como está** | Grupo fixo; migrar para dados/config fica como melhoria opcional |
| Token em AsyncStorage (plaintext) | **Baixa prioridade** | Risco local limitado; `expo-secure-store` quando sobrar tempo |
| CORS `*` / rate limit HTTP | **Opcional** | Endurecer se o túnel ficar permanentemente público |

### Sequência dentro da Fase 2 (recomendação nova)

Separar **preparação** de **execução**:

1. **Primeiro** as telas de preparação — sessões, encontros, bestiário, diário. É onde a dor é
   aguda (texto longo, teclado do celular) e onde o Mestre trabalha fora da mesa, sem pressão
   de tempo. São também as telas que **não dependem de WebSocket**.
2. **Depois** as telas de execução — `combat` e `gm-combat-screen`. Estas já funcionam no
   celular e o ganho de redesign é menor.

Isso reduz o risco: o bloco de maior valor não toca na camada de tempo real, que é justamente a
mais frágil.

---

## 8. Errata e escopo revisado — validação independente (GPT-6.1 Sol, effort high)

A análise foi submetida a revisão adversarial. Várias afirmações que sustentavam o plano
**caíram**. Reavaliadas contra o código, as correções são estas:

| # | A análise dizia | O código mostra | Impacto |
|---|---|---|---|
| 1 | "O cliente conecta `ws://{host}:8000` direto no backend; é preciso proxy `/ws` no nginx" | **ERRADO.** `utils/campaignSocket.ts:35-45` deriva o WS do host da própria URL da API e converte `https → wss`, sem acrescentar porta. A porta 8000 só aparece no caminho legado de IP local (`context/WebSocketContext.tsx`) | **Retirar o proxy do escopo.** Fica como opção arquitetural, não como correção |
| 2 | "Deploy/restart do backend apaga o encontro" | **ERRADO.** Backend e Redis são serviços separados (`pharos_rpg_server/docker-compose.yml:2-26`); o backend relê o estado do Redis após reiniciar. O risco real e confirmado é o **TTL de 1h** (`connection.py:102`, renovado só a cada gravação — heartbeat não renova) | Urgência reduzida; o item de persistência continua válido, sem o alarme |
| 3 | "`gmClientId` em slot único: desktop + celular do mesmo GM se pisam" | **ERRADO.** Em socket autenticado `client_id = f"user:{user_id}"` (`routers/websocket.py:37-39`), então dois dispositivos do mesmo usuário comparam igual. A rejeição vale para identidades **diferentes** (`engine.py:53-59`) | **Remover do plano.** Trocar o campo por lista de sockets seria correção desnecessária |
| 4 | "Sem snapshot ao conectar; cliente recebe nada até o próximo evento" | **ERRADO como fluxo normal.** O cliente envia `GM_CONNECT`/`JOIN_SESSION` imediatamente (`WebSocketContext.tsx:484-525`) e isso produz snapshot completo | Redimensionar; snapshot no handshake pode duplicar tráfego e exigir controle de ordem |
| 5 | "Não existe layout desktop no painel; partir do zero em Fase 2" | **ERRADO.** `components/campaign/CampaignWorkspace.tsx:110-114` já tem `useWindowDimensions`, breakpoint `width >= 920` e comentário "Painel responsivo para preparar a campanha em desktop ou no celular" | **Fase 2 encolhe bastante.** Já há painel responsivo de preparação |
| 6 | "Reanimated/gesture-handler são o ponto frágil comprovado das telas GM no web" | **SEM SUPORTE.** Não há imports problemáticos dessas libs nas telas examinadas. Os problemas concretos são ergonomia: `AddNpcModal` ocupa toda a área, `AreaAttackModal` limita altura sem definir largura | Risco reclassificado de "incompatibilidade técnica" para "ergonomia a testar" |
| 7 | "`create_campaign` bloqueia tudo para não-Victor" | **IMPRECISO.** A checagem só dispara se existir registro em `table_users` (`campaign_store.py:294-298`). Conta criada por e-mail/senha não passa por ela — mas nenhum client usa esse fluxo | Correção de precisão |
| 8 | "`pnpm test`, `pnpm type-check`, `pnpm build`" como validação | **ERRADO.** `package.json:5-15` só define `start`, `reset-project`, `android`, `ios`, `web`, `lint`, `prebuild`, `build:debug`, `build:release`. **Não existem `test`, `type-check` nem `build`** | Criar os scripts é pré-requisito, não comando disponível |
| 9 | "Derrubar `tableRoster.ts` puxando de `GET /campaigns/{id}`" | **CIRCULAR.** O roster alimenta o formulário **antes** da autenticação; `GET /campaigns/{id}` exige token. São duas responsabilidades distintas | Refazer o item; lista de login ≠ membros de campanha |
| 10 | "Entrega: PWA instalável" | **EXAGERADO.** `app.json` declara `web.output: "static"` e favicon; não há manifesto nem service worker implementado | Chamar de "web responsivo no navegador"; instalação é conveniência posterior |

### Agravamento encontrado na verificação (mais grave que o relatado)

A análise chamou a sala legada de "sem autenticação". Na verificação do código ela é **capturável
como GM**, por duas falhas que se somam:

1. `routers/websocket.py:46` decide o ramo com `session_id.startswith("campaign-")` — **case-sensitive**.
   Uma sala `CAMPAIGN-<uuid>` cai no ramo legado (`:52-54`), sem handshake. Mas
   `managers/connection.py:19` e `engine.py:205` fazem `session_id.lower()`, então o socket
   **desemboca na mesma sala Redis** da campanha autenticada.
2. No ramo legado, `engine.py:175-178` usa o `clientId` **enviado no próprio payload** quando
   `identity["client_id"]` é `None`. Em `_authorize_gm` (`engine.py:53-60`), se a vaga
   `gmClientId` estiver livre, o valor autodeclarado **reivindica o slot de GM**.

O caminho autenticado está correto e exige `role == "gm"` do banco (`engine.py:139-147`). A
exposição efetiva em produção não foi comprovada — um handshake no domínio público retornou
**HTTP 530**, o que impede confirmar tanto o funcionamento do WS quanto a configuração do
ingresso remoto.

**Correção prioritária:** rejeitar nomes de sala não canônicos antes da inscrição, e eliminar o
`clientId` autodeclarado no ramo legado. Migrar a UI antes (`gm-combat-screen.tsx:49-59` ainda
oferece conexão por IP/sala sem token).

### Riscos novos, não levantados na análise original

| Risco | Evidência | Mitigação |
|---|---|---|
| Lançamento de encontro corre em paralelo com comandos de combate e pode duplicar monstros | `routers/campaigns.py:380-477` mutação HTTP fora do `_locks[session_id]` do engine (`engine.py:212`) | Caminho de mutação serializado; identidade de lançamento e política de repetição |
| Células dos jogadores não recebem atualização do planejamento automaticamente | `app/(player)/my-campaigns.tsx:112-164` | Refresh ao ganhar foco / polling simples antes de pensar em sync incremental |
| Formulário descarta a edição antes do servidor confirmar | `components/campaign/CampaignEncounters.tsx:106-124`, callbacks `void` | Callback assíncrono; limpar só após sucesso; manter draft e erro |
| Bestiário e montagem de encontro não estão integrados | `CampaignEncounters.tsx:49-54,83-94` vs. template completo em `AddNpcModal.tsx:311-334` | Importar template para o encontro com regra de cópia/versionamento |
| Excluir NPC pode "ressuscitar" em outro dispositivo | delete físico em `campaign_store.py:1090-1095` + sync reinserindo ausentes (`:1127-1131`) | Política de exclusão revisada — existe mesmo sem offline-first |
| `pytest` verde não prova que pub/sub Redis foi exercitado | `tests/test_campaign_live_redis.py:29-33` pula silenciosamente sem `redis-server` | Redis disponível na integração; conferir contagem de pulados |
| "Health OK" não prova dependências saudáveis | `main.py:33-35` | Separar liveness de readiness (SQLite/Redis) |

### Escopo corrigido

| Bloco | Conteúdo revisado | Esforço |
|---|---|---|
| **0 — Descoberta operacional** | Resolver o HTTP 530 / ingresso do túnel; confirmar o commit implantado; smoke autenticado web + 2 celulares; baseline de comandos e de testes pulados | **1–2** *(novo, vem antes de qualquer mudança)* |
| **1 — Validação reprodutível** | Criar `test`/`type-check`/`build` no `package.json`; adicionar `ruff` ao `pyproject.toml` | **1** |
| **2 — Segurança do WS** | Rejeitar sala não canônica; eliminar `clientId` autodeclarado no legado; migrar a UI legada antes de desativar | **1–2** |
| **3 — Integridade do combate** | Serializar lançamento com comandos de combate; TTL renovável; snapshot recuperável (definir armazenamento autoritativo, ordem commit→publicação, recuperação de Redis vazio) | **3–5** |
| **4 — Preparação confiável** | Rascunhos não descartados em falha; refresh do planejamento nas células; bestiário → encontro | **2–4** |
| **5 — Ergonomia** | Só o que incomodar de verdade, partindo do painel responsivo que já existe | **2–4** |
| ~~Electron, pacote compartilhado, service worker, sync incremental, offline-first~~ | — | descartado |

**Total: ~12–22 sessões** de escopo amplo. A primeira entrega útil é bem menor que isso — os
blocos 0–2 são ~3–5 sessões e não constroem interface alguma.

A primeira decisão não é "qual app desktop construir", e sim **"o que ainda impede de usar com
segurança o web que já está implementado"**.
