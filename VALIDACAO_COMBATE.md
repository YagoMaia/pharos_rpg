# Validação de especializações e fases

## Regressões automatizadas

No diretório do mobile:

```powershell
node --test tests/combat-regressions.cjs tests/feat-regressions.cjs tests/high-priority-regressions.cjs
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

## Façanhas

- Cada escolha guarda seu slot (níveis 3, 7, 10 e 13). Remover uma escolha não desloca as demais.
- Nível insuficiente, slot ocupado, ID duplicado e escolhas inválidas de atributos são rejeitados pelo contexto, mesmo com chamadas consecutivas.
- Reduzir o nível mantém a escolha visível e removível, mas suspende seus bônus automáticos. Subir novamente reativa os bônus.
- **Vigoroso:** +1 CON, até 18, e +1 PV máximo por nível. Alterar o máximo não cura PV atuais.
- **Habilidoso:** seleção de dois atributos distintos, +1 em cada, até 18.
- **Ator / Poliglota:** +1 CAR / INT, até 18. Os demais efeitos continuam manuais.
- **Iniciativa Aprimorada:** SAB é incluída na rolagem automática e na iniciativa do personagem importado ao bestiário. Não some novamente SAB ao valor final digitado manualmente.
- A ficha persiste os bônus efetivamente aplicados para permitir reversão e recálculo sem acumular bônus a cada carregamento. Editar um atributo continua usando o total mostrado na ficha.
- Façanhas comuns ativas, faccionais e especiais são incluídas no combatente, persistidas pelo servidor e exibidas no painel de combate. Os atributos e PV enviados já incluem os bônus; o servidor não os aplica novamente.

### Compatibilidade com fichas antigas

As escolhas antigas recebem slots pela ordem anterior. Escolhas excedentes ou inválidas ficam visíveis como inativas, permitindo remoção. Slots explícitos e escolhas excedentes permanecem estáveis após recarregar.

Como a versão antiga exigia ajustes manuais de atributos/PV, não é possível inferir se os valores salvos já incluem os bônus. Por isso, façanhas numéricas antigas mantêm seus ajustes manuais, com indicação na interface. Para usar a automação nelas, desfaça os ajustes manuais e remova/selecione novamente a façanha. A soma de SAB na rolagem automática passa a funcionar também para Iniciativa Aprimorada legada.

### Teste local das façanhas

1. No nível 7, selecione Vigoroso no slot 7 antes de preencher o slot 3. Confira CON e PV máximos.
2. Adicione Ator ao slot 3, remova-o e confirme que Vigoroso continua no slot 7.
3. Reduza o nível para 3: Vigoroso deve aparecer inativo, seus bônus automáticos devem ser suspensos e a remoção deve continuar disponível.
4. Volte ao nível 7 e confira a reativação. Salve/reabra a ficha e confira que os bônus não se repetem.
5. Selecione Habilidoso: é necessário escolher exatamente dois atributos distintos.
6. Com DES +2, SAB +3 e Iniciativa Aprimorada ativa, confira que a rolagem automática soma +5.
7. Feche o seletor pelo botão voltar do sistema; feche e reabra o modal principal.
8. Conecte ao servidor e confira a descrição das façanhas no combate, inclusive após reconectar.

## Regressões de alta prioridade

1. **Sincronização da ficha:** entre com 20 PV máximos, sofra dano, altere a ficha para 27 PV máximos e reconecte. O máximo deve atualizar; os PV atuais não aumentam. Ao reduzir o máximo, os PV atuais ficam limitados ao novo máximo. Foco segue a mesma regra. A reconexão automática também usa a ficha atual.
2. **CA:** reconecte após alterar equipamento ou atributos enquanto usa uma postura. A CA deve combinar a nova CA-base, o bônus atualizado da postura e os ajustes temporários de combate. Sair da postura deve remover apenas seu bônus. Se a postura deixou de existir na ficha, o combatente volta à postura neutra.
3. **Dano:** com espada `1d8`, FOR +3 e Espada e Escudo, confira `1d8+4` tanto no ataque básico quanto em habilidades que usam a arma. O bônus passivo é transmitido separadamente como `damageBonus`. `damageIncludesAttribute` permite indicar se a fórmula da arma já contém o atributo; fórmulas legadas com parcela fixa mantêm a interpretação anterior.
4. **Economia de ações:** gaste a ação padrão e use um ataque ou cura de ação bônus/reação. Somente a ação correspondente deve ser consumida, online e offline. Repita com ação ou foco insuficientes: a confirmação não deve aplicar dano/cura nem consumir recursos.
5. **Confirmação online:** ataques e curas aguardam o evento do servidor para atualizar PV, foco e ações. O cliente não aplica resultados antecipados de comandos que podem ser rejeitados.
