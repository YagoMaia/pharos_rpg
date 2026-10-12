# Instruções para Agents — modelo_reset

> Projeto pessoal. Regras gerais de desenvolvimento ficam na skill `dev-standards`; este arquivo registra apenas contexto, runtime e regras específicas deste repositório.

---

## Contexto do projeto

- Projeto: `pharos_rpg`
- Tipo: projeto pessoal React Native
- Branch base padrão: `main`

---

<!-- BEGIN RUNTIME-AUDIT -->
## Ambiente e runtime

- Linguagem principal: TypeScript
- Runtime: node 24
- Gerenciador de pacotes: pnpmp
- Sistema operacional local esperado: Windows/PowerShell

### Comandos de validação

```powershell
# Instalação
pnpm install

# Testes
pnpm test

# Lint/type-check
pnpm lint
pnpm type-check

# Build
pnpm build
```

### Observações para agents

- Não assumir runtime global.
- Se `.nvmrc` existir, executar `nvm use` antes de instalar dependências ou rodar testes.
- Não trocar npm/pnpm/yarn/bun sem confirmação.
- Não alterar/remover lockfiles sem confirmação humana.
- Não acessar `.env*`, secrets ou diretórios de dependências (`node_modules`, `.venv`, `dist`, `build`, `.next`).
<!-- END RUNTIME-AUDIT -->

---

## Padrões de desenvolvimento

Aplicar a skill `dev-standards` para:

- Conventional Commits em inglês;
- TDD obrigatório para lógica de negócio;
- Clean Code e estrutura de código;
- testes/validações antes de considerar a tarefa concluída;
- segurança básica e proteção contra secrets;
- Definition of Done.

Não duplicar essas regras aqui; se houver dúvida, use `dev-standards` como fonte.

---

### Pendências / atenção

- Versão de Node não identificada; verificar README/CI ou criar `.nvmrc`.

## Skills úteis

| Skill | Quando usar |
|-------|-------------|
| `dev-standards` | Conventional Commits, TDD, Clean Code e Definition of Done |
| `dev-workflow` | Implementar/finalizar tarefa com validação e fechamento |
| `agents-runtime-audit` | Atualizar runtime/comandos deste arquivo |
| `pr-description-github` | Gerar PR GitHub pessoal |
| `pr-validation` | Validar criticamente PR/MR |
| `docs-organization` | Criar documentação técnica em `docs/` |

---

## O que NÃO fazer

- Não hardcodar API keys, tokens ou senhas.
- Não ler nem expor `.env*`, chaves privadas ou arquivos de credenciais.
- Não commitar `.venv`, builds, caches ou dados locais.
- Não fazer force push em `main`.
- Não commitar lógica de negócio sem teste novo ou atualizado cobrindo a mudança, salvo justificativa explícita.
