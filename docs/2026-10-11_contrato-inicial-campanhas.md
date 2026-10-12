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

O cliente tipado em `services/campaignApi.ts` possui chamadas para campanhas. A tela atual usa `/auth/table-login`: Victor entra como mestre; Gabriel, Leandro, Yago, Luiz, Amom, Wayne e Visitante entram como jogadores. O PIN de cada pessoa é o próprio nome em minúsculas, conforme convenção desta mesa. A aba **Campanhas** do mestre cria campanhas, visualiza membros e gera convites. O jogador acessa **Minhas campanhas** pela ficha (`/my-campaigns`), entra usando um convite e vincula explicitamente a ficha local. O token fica **somente em memória**, e o usuário precisa entrar novamente após fechar o app; não há armazenamento persistente de credenciais.

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
| POST | `/auth/table-login` | `{ name, pin }` | `{ accessToken }`; cria a identidade da mesa no primeiro acesso |
| POST | `/auth/logout` | — (Bearer atual) | 204; revoga apenas o token desta sessão |
| GET | `/campaigns/{id}/entries` | — | até 100 notas visíveis ao membro, mais recentes primeiro |
| POST | `/campaigns/{id}/entries` | `{ title, body, visibility: "gm" \| "party" }` | nota criada (somente mestre) |
| PUT | `/campaigns/{id}/entries/{entryId}` | `{ title, body, visibility: "gm" \| "party" }` | nota editada (somente mestre) |

As chamadas de campanha enviam `Authorization: Bearer <token>` obtido em `/auth/table-login`. O cliente não armazena tokens, não envia fichas completas e não expõe resposta/credenciais em mensagens de erro. O endereço da API é injetado; não é derivado automaticamente do IP da sala WebSocket. O backend armazena hash do token; ele expira em 7 dias, e o convite é de uso único, expira em 24 horas. As identidades fixas são separadas das antigas contas de e-mail, sem apagar nem migrar campanhas anteriores. Os endpoints antigos `/auth/register` e `/auth/login` permanecem disponíveis para compatibilidade, mas não são usados pela interface da mesa. **Nome e PIN conhecidos não oferecem autenticação real:** qualquer pessoa com acesso à API pode assumir inclusive a identidade do mestre. Não expor a API publicamente sem substituir essa convenção por credenciais privadas e limitar tentativas. As campanhas são persistidas em SQLite no caminho configurável `CAMPAIGN_DB_PATH` (padrão `pharos.sqlite3`, ignorado pelo Git).

## Decisões pendentes antes de ligar o cliente

1. Para login persistente, usar armazenamento seguro apropriado por plataforma; não guardar senha nem token em AsyncStorage ou logs. O botão "Sair" limpa a sessão local e revoga o token corrente no servidor; se a rede falhar, a interface informa que a revogação não foi confirmada. Acrescentar recuperação de senha e proteção contra abuso em `/auth/login`/`/auth/register` antes de disponibilização pública. HTTP é permitido para `localhost`, redes locais/privadas (192.168.x.x, 10.x.x.x, 172.16–31.x.x) e Tailscale (100.64.0.0/10); acesso remoto público requer HTTPS.
2. SQLite é adequado para protótipo de instância única; definir migrações, backup, localização de dados e banco apropriado para múltiplas instâncias antes de deploy. Redis atual guarda combate por uma hora e não é a fonte dos dados de campanha.
3. Implementar revogação de convites e política operacional para tokens e CORS antes de deploy.
4. O app atribui `sheetId` estável às fichas, inclusive às fichas legadas após carregamento, e usa esse valor no vínculo; ele é independente do ID do combatente, que continua derivado do nome. O servidor impede duplicidade dentro da campanha, mas ainda não prova posse da ficha nem salva o conteúdo da ficha. Cópias/importações da mesma ficha podem carregar o mesmo `sheetId`; troca de ficha já vinculada não está disponível na UI.
5. O combate da campanha agora usa `/ws/campaign-{id}`: o app envia `AUTH_CAMPAIGN` com o token no primeiro frame (nunca na URL); o servidor valida membro, papel e `sheetId` antes de inscrever o cliente no Redis. Depois de `AUTH_OK`, mestre envia `GM_CONNECT` ou jogador envia `JOIN_SESSION`. Comandos ignoram o `clientId` fornecido no payload e usam a identidade autenticada; token e vínculo são revalidados a cada mensagem, com fechamento por política (1008) em caso de revogação. As salas antigas em `/ws/{codigo}` continuam legadas e **não** herdam essa proteção; não usá-las como salas de campanha. A revogação só desconecta uma sessão ociosa quando chegar a próxima mensagem/heartbeat; distribuição em múltiplas instâncias ainda precisa de revisão operacional.
6. Validar operações completas das duas telas no navegador e em dispositivo. O export web contém as rotas do mestre e do jogador, mas ainda faltam validação visual/manual e teste ponta a ponta com o servidor em execução.
7. Diário: paginação, autoria, exclusão/arquivamento e gestão de migrações do esquema SQLite ficam para uma etapa posterior; a primeira versão retorna até 100 notas por campanha.

## Validação

- App: `node --test tests/*.cjs`, `pnpm lint`, `pnpm exec tsc --noEmit` e `pnpm exec expo export --platform web --output-dir <diretorio-temporario>`.
- Backend: `uv run --no-sync python -m unittest discover -s tests -q` e `uv run --no-sync ruff check .`; testes de integração cobrem 401/403/404/409/410, convite expirado, membro duplicado e persistência após reiniciar o store.
