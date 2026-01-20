#!/bin/bash
set -e

export HOST="0.0.0.0"
export PORT="4321"
export NODE_ENV="production"

echo "🚀 Iniciando Auto Parts Store..."
exec node ./dist/server/entry.mjs
