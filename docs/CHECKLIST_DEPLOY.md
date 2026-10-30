# Checklist de deploy e smoke test — Pharos

> Bloco 0 do plano (`pharos_rp/docs/ANALISE_APP_DESKTOP_GM.md`, §7 e §8).
> Serve tanto para o primeiro deploy quanto para qualquer release seguinte.

---

## 1. Antes de subir — o que está no ar

```bash
cd ~/pharos_rpg
for r in pharos_rp pharos_rpg_server; do
  echo "$r: $(git -C $r rev-parse --abbrev-ref HEAD) @ $(git -C $r rev-parse --short HEAD)"
done
```

Anote a saída. Sem isso, depois de um bug você não sabe qual código estava rodando.

## 2. Build

```bash
cd ~/pharos_rpg/pharos_rp
docker compose -f docker-compose.full.yml build --pull
docker compose -f docker-compose.full.yml up -d
docker compose -f docker-compose.full.yml ps
```

Esperado: 4 serviços (`frontend`, `backend`, `redis`, `cloudflared`) com `Up (healthy)`.

Falhas comuns:

| Sintoma | Causa provável |
|---|---|
| `ERR_PNPM_IGNORED_BUILDS` no build do frontend | config do pnpm fora da imagem (corrigido no PR #22) |
| `HTTP 530` no domínio | ingresso do túnel sem a rota, ou `cloudflared` não rodando |
| `521` / `523` | `cloudflared` parado, ou hostname apontando para serviço inexistente |

## 3. Ingresso do túnel (Cloudflare Zero Trust → Networks → Tunnels → Public Hostnames)

| Public Hostname | Service |
|---|---|
| `pharos.yagomaia.com.br` | `http://frontend:80` |
| `pharos-server.yagomaia.com.br` | `http://backend:8000` |

## 4. Sondas rápidas

```bash
curl -s https://pharos-server.yagomaia.com.br/health     # {"status":"ok"}
curl -s -o /dev/null -w "%{http_code}\n" https://pharos.yagomaia.com.br/   # 200
```

Teste de WebSocket (confirma que o upgrade passa pela borda):

```bash
curl -s -o /dev/null -w "ws upgrade: %{http_code}\n" \
  -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  https://pharos-server.yagomaia.com.br/ws/health-probe
```

Esperado: `101`. Se vier `200`/`530`, o upgrade não está chegando ao FastAPI.

## 5. Logs úteis

```bash
docker compose -f docker-compose.full.yml logs --tail=50 backend
docker compose -f docker-compose.full.yml logs --tail=30 cloudflared
docker exec pharos-redis redis-cli keys 'state:*'     # estado vivo de combate
```

## 6. Backups (antes de mexer)

**Não copie o arquivo direto.** O backend roda com `journal_mode = WAL`; dados já
cometidos podem estar em `pharos.sqlite3-wal`. Copiar só o `pharos.sqlite3` gera
backup incompleto — com uma transação de escrita aberta, a cópia simples ficou
**sem nenhuma tabela**.

Snapshot consistente (seguro mesmo com escrita acontecendo):

```bash
docker exec pharos-backend python -c "import sqlite3; s=sqlite3.connect('/data/pharos.sqlite3'); d=sqlite3.connect('/data/backup.sqlite3'); s.backup(d); d.close(); s.close()"
docker cp pharos-backend:/data/backup.sqlite3 ./backup_$(date +%F).sqlite3
docker exec pharos-backend rm /data/backup.sqlite3
```

Confira antes de considerar o backup válido:

```bash
python3 -c "import sqlite3; c=sqlite3.connect('backup_$(date +%F).sqlite3'); print(c.execute('PRAGMA integrity_check').fetchone()[0], c.execute('SELECT COUNT(*) FROM campaigns').fetchone()[0])"
```

Espera `ok` seguido do número de campanhas. Se `campaigns` não existir, o backup
foi tirado de um banco vazio ou de uma cópia parcial.

Restaurar: copie o backup para dentro do volume e reinicie o backend. Gere um
backup do banco atual com o mesmo procedimento **antes** de sobrescrever.

O banco mora no volume nomeado `pharos_sqlite_data` → `/data/pharos.sqlite3`.
Substituir por outro compose ou remover o volume cria um banco **vazio**.

---

## 7. Smoke test — navegador desktop + celular

É o que responde à pergunta que ainda está aberta na análise: **as telas do GM operam de
verdade no navegador?** Marque o que passar e anote o que quebrar.

| # | Ação | Resultado |
|---|---|---|
| 1 | Abrir `https://pharos.yagomaia.com.br` no **desktop**, logar como GM | ☐ |
| 2 | Criar campanha | ☐ |
| 3 | Criar sessão (com data/hora agendada) | ☐ |
| 4 | Criar quest (visibilidade `party` e `gm`) | ☐ |
| 5 | Criar entrada de diário | ☐ |
| 6 | Criar NPC no bestiário e confirmar sync (`/npc-library/sync`) | ☐ |
| 7 | Criar encontro com monstros (`AddNpcModal` em janela larga) | ☐ |
| 8 | Gerar convite e entrar pelo **celular** em "Minhas campanhas" | ☐ |
| 9 | Vincular ficha do personagem no celular | ☐ |
| 10 | **Lançar o encontro** no desktop | ☐ |
| 11 | Monstros aparecem na iniciativa **no celular** (prova Redis → WS) | ☐ |
| 12 | `gm-combat-screen` no navegador: editar HP, aplicar condição, `END_TURN` | ☐ |
| 13 | Salvar em área pedir saving throw ao jogador e receber a resposta | ☐ |
| 14 | Dois celulares conectados ao mesmo tempo | ☐ |
| 15 | Derrubar o backend (`docker compose restart backend`) no meio do combate e reconectar | ☐ |

O item **15** é o teste do TTL/persistência: hoje o estado de combate vive só no Redis com
`ex=3600` (`app/managers/connection.py:102`). Se o combate sobreviver ao restart mas
desaparecer depois de 1h de inatividade, a causa está confirmada na prática.

## 8. Registro do que quebrou no navegador

Anote, para cada falha: tela, o que fez, o que esperava, o que aconteceu, e se o mesmo
fluxo funciona no app nativo. Isso é a evidência que falta para dimensionar a fase de
ergonomia — hoje a maior estimativa do plano (2–4 sessões).

O export web **compila** e gera todas as rotas GM (`(gm)/dashboard`, `(gm)/campaigns`,
`(gm)/npcs`, `(gm)/combat`, `(gm)/gm-combat-screen`). O que este checklist testa é
**interação**, não build.
