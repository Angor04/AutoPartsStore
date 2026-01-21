# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Instalar dependencias con timeouts y reintentos
RUN npm install --legacy-peer-deps --prefer-offline --no-audit \
    --fetch-timeout=300000 --fetch-retry-mintimeout=20000 || \
    npm install --legacy-peer-deps --fetch-timeout=300000

# Copiar código fuente
COPY . .

# Build de la aplicación
RUN npm run build

# Stage 2: Runtime
FROM node:22-alpine

WORKDIR /app

# Instalar curl para healthcheck
RUN apk add --no-cache curl

# Copiar node_modules y build desde builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Variables de entorno
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

# Exponer puerto
EXPOSE 4321

# Health check - usando curl
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:4321/ || exit 1

# Iniciar aplicación directamente con el entry de Astro
CMD ["node", "dist/server/entry.mjs"]
