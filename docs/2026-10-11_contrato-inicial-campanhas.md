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

O cliente tipado em `services/campaignApi.ts` possui chamadas para campanhas e registro/login. Os endpoints abaixo estão implementados em `pharos_rpg_server` na branch `feat/campaign-planning`, com testes de integração usando FastAPI `TestClient` e SQLite local. A aba **Campanhas** do mestre já usa a API para cadastro/login, criação de campanhas, visualização de membros e convites. O token fica **somente em memória**, e o usuário precisa entrar novamente após fechar o app; não há armazenamento persistente de credenciais. A tela do jogador e o vínculo da ficha ainda não foram integrados.

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

As chamadas de campanha enviam `Authorization: Bearer <token>` obtido em registro/login. O cliente não armazena tokens, não envia fichas completas e não expõe resposta/credenciais em mensagens de erro. O endereço da API é injetado; não é derivado automaticamente do IP da sala WebSocket. O backend armazena hash do token e da senha, token expira em 7 dias e convite é de uso único, expira em 24 horas. As campanhas são persistidas em SQLite no caminho configurável `CAMPAIGN_DB_PATH` (padrão `pharos.sqlite3`, ignorado pelo Git).

## Decisões pendentes antes de ligar o cliente

1. Para login persistente, usar armazenamento seguro apropriado por plataforma; não guardar senha nem token em AsyncStorage ou logs. O botão "Sair" atual descarta o token em memória, mas ainda falta revogá-lo no servidor. Acrescentar recuperação de senha e proteção contra abuso em `/auth/login`/`/auth/register` antes de disponibilização pública. HTTP só é permitido pelo cliente para `localhost`/loopback; dispositivo remoto requer HTTPS.
2. SQLite é adequado para protótipo de instância única; definir migrações, backup, localização de dados e banco apropriado para múltiplas instâncias antes de deploy. Redis atual guarda combate por uma hora e não é a fonte dos dados de campanha.
3. Implementar revogação de convites e política operacional para tokens e CORS antes de deploy.
4. Definir ID estável para personagem: o ID usado no combate atualmente deriva do nome. O servidor aceita um `characterId` informado pelo jogador e impede duplicidade dentro da campanha, mas ainda não prova posse da ficha nem salva o conteúdo da ficha.
5. Vincular identidade de usuário/campanha ao WebSocket; `clientId` do WebSocket atual ainda não autentica uma pessoa. Até lá, dados de combate não herdam a segurança da API de campanhas.
6. Construir telas do jogador e validar operações completas no navegador e em dispositivo. O painel responsivo do mestre passa no `expo export --platform web`, mas ainda precisa de validação visual/manual e teste integrado com o servidor em execução.

## Validação

- App: `node --test tests/*.cjs`, `pnpm lint`, `pnpm exec tsc --noEmit` e `pnpm exec expo export --platform web --output-dir <diretorio-temporario>`.
- Backend: `uv run --no-sync python -m unittest discover -s tests -q` e `uv run --no-sync ruff check .`; testes de integração cobrem 401/403/404/409/410, convite expirado, membro duplicado e persistência após reiniciar o store.
