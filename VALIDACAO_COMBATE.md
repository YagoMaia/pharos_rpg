# Validação de especializações e fases

## Regressões automatizadas

No diretório do mobile:

```powershell
node --test tests/combat-regressions.cjs
```

No diretório do server:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
.\.venv\Scripts\python.exe -m compileall -q app
```

Os testes do server usam armazenamento e WebSockets simulados; a execução local com Redis e dois clientes valida a integração real.

## Roteiro para o teste local

1. **Ficha antiga:** carregar ou importar uma ficha com `corsario_espada` ou `corsario_bacamarte`. Conferir as posturas e adicionar ao combate/importar ao bestiário. Especializações retiradas do catálogo permanecem na ficha com seus dados, sem substituição automática por outra escolha.
2. **CA:** Encouraçado com armadura de defesa 18 e sem escudo deve ter CA 19. Espada e Escudo com espada de uma mão, armadura 18 e escudo +2 deve ter CA 21 e +1 no dano corpo a corpo. Queima-Roupa soma CON; Corpo Impossível reduz CA em 2. Sair da postura deve restaurar a CA anterior.
3. **Cadastro:** criar um NPC, adicionar fases subsequentes em **Geral**, alterar nome, imagem, PV, CA, armas e habilidades; escolher uma classe no editor da fase para carregar suas posturas. Salvar, reabrir e conferir os dados. É possível editar ou remover cada fase.
4. **Boss online:** conectar mestre e jogador à mesma sala, adicionar o boss e reduzir seus PV a zero. Passar o turno: o boss deve continuar disponível. Avançar a fase e conferir ambos os clientes, inclusive após reconexão. No turno de NPC, o botão de lista no cabeçalho permite gerenciar os demais combatentes.
5. **Boss offline:** repetir a inclusão e a troca de fase no modo local. As armas e fases devem ser preservadas.
6. **Turnos offline:** gastar ações, dar uma volta na iniciativa e conferir a restauração. Aplicar/remover condições, conferir o decremento da duração e o bloqueio por incapacitação. NPCs derrotados sem fases são retirados; bosses pendentes aguardam a próxima fase; jogadores inconscientes usam teste de morte.
7. **Encerramento offline:** finalizar o combate; NPCs são retirados, ações dos jogadores são restauradas e o turno ativo é limpo.

## Regra da troca de fase

- As fases cadastradas são as fases **posteriores** à ficha inicial.
- PV são restaurados ao máximo da nova fase, e a postura fica neutra.
- Nome, imagem, CA, posturas, habilidades e armas usam os valores definidos na fase; campos ausentes herdam os anteriores.
- Foco, condições, iniciativa e ações restantes são preservados. A transformação não concede um turno extra.
- Online, o servidor valida o índice esperado da fase para evitar avanço duplo por comandos repetidos.

## Escopo da automação

As correções automatizam os modificadores descritos acima, a migração das fichas e o ciclo de fases/turnos. Manobras, recuperações de foco e passivas condicionais descritas apenas em texto continuam dependendo de resolução manual durante a partida.
