# syntax=docker/dockerfile:1

# --- Estágio 1: Build da aplicação Expo Web ---
FROM node:22-alpine AS builder

WORKDIR /app

# Ativa o pnpm na versão fixa. `pnpm@latest` faria o build mudar de
# comportamento sozinho: foi assim que um pnpm 12 recém-lançado quebrou este
# build (ERR_PNPM_IGNORED_BUILDS). A versão é repetida aqui de propósito:
# `corepack prepare` sem argumento exige um package.json no diretório, e esta
# camada roda ANTES do COPY para aproveitar o cache de dependências.
# Manter em sincronia com package.json > packageManager.
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

# Instalação com cache de dependências.
# pnpm-workspace.yaml e .npmrc precisam estar presentes ANTES do install:
# o primeiro carrega `allowBuilds` (sem ele o pnpm >=11 aborta com
# ERR_PNPM_IGNORED_BUILDS) e o segundo define node-linker=hoisted, de que o
# Metro/Expo depende para resolver pacotes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Código-fonte
COPY . .

# Variáveis públicas embutidas na compilação do bundle JS pelo Expo
ARG EXPO_PUBLIC_API_URL=https://pharos-server.yagomaia.com.br
ENV EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL}

# Exporta os arquivos estáticos para web
RUN npx expo export --platform web

# --- Estágio 2: Servidor Web Nginx de Produção ---
FROM nginx:alpine AS runner

# Copia build estático gerado
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuração SPA do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
