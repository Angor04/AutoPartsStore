#!/usr/bin/env bash
# quick-setup.sh - Script rápido para configurar la tienda

echo "🚗 AutoPartsStore - Configuración Rápida"
echo "========================================"
echo ""

# 1. Instalar dependencias
echo "1️⃣  Instalando dependencias..."
npm install
echo "✅ Dependencias instaladas"
echo ""

# 2. Verificar archivo .env.local
echo "2️⃣  Verificando variables de entorno..."
if [ -f ".env.local" ]; then
    echo "✅ .env.local encontrado"
else
    echo "❌ .env.local no encontrado"
    echo "   Crea uno con tus credenciales de Supabase:"
    echo ""
    echo "   PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co"
    echo "   PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx"
    echo "   SITE_URL=http://localhost:4322"
    echo ""
fi
echo ""

# 3. Iniciar servidor
echo "3️⃣  Iniciando servidor de desarrollo..."
echo "   → Abriendo http://localhost:4322"
echo ""
npm run dev
