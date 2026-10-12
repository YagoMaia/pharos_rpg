# syntax=docker/dockerfile:1

# --- Estágio 1: Build da aplicação Expo Web ---
FROM node:22-alpine AS builder

WORKDIR /app

# Ativa pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Instalação com cache de dependências
COPY package.json pnpm-lock.yaml ./
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
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
