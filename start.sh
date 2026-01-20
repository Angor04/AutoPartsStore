#!/bin/bash
set -e

# Configurar variables por defecto
export HOST="${HOST:-0.0.0.0}"
export PORT="${PORT:-3000}"
export NODE_ENV="${NODE_ENV:-production}"

echo "🚀 Starting Auto Parts Store..."
echo "   Host: $HOST"
echo "   Port: $PORT"
echo "   Environment: $NODE_ENV"

# Verificar que dist existe
if [ ! -d "dist" ]; then
  echo "❌ Error: dist directory not found!"
  exit 1
fi

# Verificar que entry.mjs existe
if [ ! -f "dist/server/entry.mjs" ]; then
  echo "❌ Error: dist/server/entry.mjs not found!"
  ls -la dist/
  exit 1
fi

echo "✅ Ready to start!"
echo ""

# Iniciar la aplicación
exec node --enable-source-maps ./dist/server/entry.mjs
