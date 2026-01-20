#!/bin/bash

# Configurar variables por defecto
export HOST="${HOST:-0.0.0.0}"
export PORT="${PORT:-3000}"
export NODE_ENV="${NODE_ENV:-production}"

echo "🚀 Auto Parts Store Starting..."
echo "   Host: $HOST"
echo "   Port: $PORT"
echo "   Env: $NODE_ENV"

# Iniciar Astro Node server
exec node ./dist/server/entry.mjs
