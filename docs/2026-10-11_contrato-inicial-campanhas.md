---
data: 2026-10-11
projeto: pharos_rpg
tipo: proposta
tags:
  - campanha
  - api
  - backend
autor: agente
---

# Contrato inicial de campanhas (primeira entrega no servidor)

## Primeira entrega

O cliente tipado em `services/campaignApi.ts` possui chamadas para campanhas e registro/login. Os endpoints abaixo estão implementados em `pharos_rpg_server` na branch `feat/campaign-planning`, com testes de integração usando FastAPI `TestClient` e SQLite local. A aba **Campanhas** do mestre usa a API para cadastro/login, criação de campanhas, visualização de membros e convites. O jogador acessa **Minhas campanhas** pela ficha (`/my-campaigns`), entra usando um convite e vincula explicitamente a ficha local. O token fica **somente em memória**, e o usuário precisa entrar novamente após fechar o app; não há armazenamento persistente de credenciais.

O diário permite ao mestre criar e editar notas privadas (`gm`) ou compartilhadas (`party`). O servidor filtra notas privadas antes de responder aos jogadores, inclusive após uma alteração de visibilidade. O mestre edita no painel web; o jogador consulta as notas compartilhadas em `/my-campaigns`.

| Método | Caminho | Corpo | Resposta esperada |
| --- | --- | --- | --- |
| POST | `/campaigns` | `{ name }` | `{ id, name, role: "gm" }` |
| GET | `/campaigns` | — | lista de campanhas acessíveis ao usuário |
| GET | `/campaigns/{id}` | — | campanha e lista de membros |
| POST | `/campaigns/{id}/invites` | — | `{ code, expiresAt }` |
| POST | `/campaigns/join` | `{ inviteCode }` | resumo da campanha para o jogador |
| PUT | `/campaigns/{id}/character` | `{ characterId }` | resumo da campanha com vínculo |
| POST | `/auth/register` | `{ email, displayName, password }` | `{ accessToken }` |
| POST | `/auth/login` | `{ email, password }` | `{ accessToken }` |
| POST | `/auth/logout` | — (Bearer atual) | 204; revoga apenas o token desta sessão |
| GET | `/campaigns/{id}/entries` | — | até 100 notas visíveis ao membro, mais recentes primeiro |
| POST | `/campaigns/{id}/entries` | `{ title, body, visibility: "gm" \| "party" }` | nota criada (somente mestre) |
| PUT | `/campaigns/{id}/entries/{entryId}` | `{ title, body, visibility: "gm" \| "party" }` | nota editada (somente mestre) |

As chamadas de campanha enviam `Authorization: Bearer <token>` obtido em registro/login. O cliente não armazena tokens, não envia fichas completas e não expõe resposta/credenciais em mensagens de erro. O endereço da API é injetado; não é derivado automaticamente do IP da sala WebSocket. O backend armazena hash do token e da senha, token expira em 7 dias e convite é de uso único, expira em 24 horas. As campanhas são persistidas em SQLite no caminho configurável `CAMPAIGN_DB_PATH` (padrão `pharos.sqlite3`, ignorado pelo Git).

## Decisões pendentes antes de ligar o cliente

1. Para login persistente, usar armazenamento seguro apropriado por plataforma; não guardar senha nem token em AsyncStorage ou logs. O botão "Sair" limpa a sessão local e revoga o token corrente no servidor; se a rede falhar, a interface informa que a revogação não foi confirmada. Acrescentar recuperação de senha e proteção contra abuso em `/auth/login`/`/auth/register` antes de disponibilização pública. HTTP só é permitido pelo cliente para `localhost`/loopback; dispositivo remoto requer HTTPS.
2. SQLite é adequado para protótipo de instância única; definir migrações, backup, localização de dados e banco apropriado para múltiplas instâncias antes de deploy. Redis atual guarda combate por uma hora e não é a fonte dos dados de campanha.
3. Implementar revogação de convites e política operacional para tokens e CORS antes de deploy.
4. O app atribui `sheetId` estável às fichas, inclusive às fichas legadas após carregamento, e usa esse valor no vínculo; ele é independente do ID do combatente, que continua derivado do nome. O servidor impede duplicidade dentro da campanha, mas ainda não prova posse da ficha nem salva o conteúdo da ficha. Cópias/importações da mesma ficha podem carregar o mesmo `sheetId`; troca de ficha já vinculada não está disponível na UI.
5. Vincular identidade de usuário/campanha ao WebSocket; `clientId` do WebSocket atual ainda não autentica uma pessoa. Até lá, dados de combate não herdam a segurança da API de campanhas.
6. Validar operações completas das duas telas no navegador e em dispositivo. O export web contém as rotas do mestre e do jogador, mas ainda faltam validação visual/manual e teste ponta a ponta com o servidor em execução.
7. Diário: paginação, autoria, exclusão/arquivamento e gestão de migrações do esquema SQLite ficam para uma etapa posterior; a primeira versão retorna até 100 notas por campanha.

## Validação

- App: `node --test tests/*.cjs`, `pnpm lint`, `pnpm exec tsc --noEmit` e `pnpm exec expo export --platform web --output-dir <diretorio-temporario>`.
- Backend: `uv run --no-sync python -m unittest discover -s tests -q` e `uv run --no-sync ruff check .`; testes de integração cobrem 401/403/404/409/410, convite expirado, membro duplicado e persistência após reiniciar o store.
