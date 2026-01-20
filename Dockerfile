# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Instalar dependencias
RUN npm ci || npm install

# Copiar código fuente
COPY . .

# Build de la aplicación
RUN npm run build

# Stage 2: Runtime
FROM node:18-alpine

WORKDIR /app

# Instalar dumb-init para manejo correcto de señales
RUN apk add --no-cache dumb-init

# Copiar node_modules y build desde builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Variables de entorno por defecto (serán sobrescritas)
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Usar dumb-init para ejecutar Node
ENTRYPOINT ["/sbin/dumb-init", "--"]

# Iniciar aplicación
CMD ["node", "./dist/server/entry.mjs"]
