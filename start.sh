#!/bin/bash

# Configurar variables por defecto
export HOST="${HOST:-0.0.0.0}"
export PORT="${PORT:-3000}"
export NODE_ENV="${NODE_ENV:-production}"

echo "🚀 Auto Parts Store Starting..."
echo "   Host: $HOST"
echo "   Port: $PORT"
echo "   Env: $NODE_ENV"

# Verificar que dist/server/entry.mjs existe
if [ ! -f "./dist/server/entry.mjs" ]; then
  echo "❌ ERROR: dist/server/entry.mjs no encontrado!"
  ls -la ./dist/ || echo "dist/ no existe"
  exit 1
fi

echo "✅ Iniciando servidor Node.js..."
echo ""

# Iniciar Astro sin capturar output para ver los errores
node ./dist/server/entry.mjs
