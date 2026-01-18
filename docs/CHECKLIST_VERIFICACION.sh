#!/bin/bash
# 📋 CHECKLIST DE VERIFICACIÓN PRE-PRODUCCIÓN
# Ejecutable: bash /docs/CHECKLIST_VERIFICACION.sh

echo "════════════════════════════════════════════════════════════"
echo "  🎯 CHECKLIST DE VERIFICACIÓN - FASHION STORE ECOMMERCE"
echo "════════════════════════════════════════════════════════════"
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de checks
TOTAL=0
PASSED=0
FAILED=0

# Función para verificar
check() {
  TOTAL=$((TOTAL+1))
  local check_name=$1
  local command=$2
  
  echo -n "[$TOTAL] Verificando: $check_name ... "
  
  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
    PASSED=$((PASSED+1))
  else
    echo -e "${RED}✗${NC}"
    FAILED=$((FAILED+1))
  fi
}

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  1️⃣  VERIFICACIÓN DE ARCHIVOS"
echo "═══════════════════════════════════════════════════════════"
echo ""

check "Schema SQL existe" "test -f /docs/02_ADVANCED_SCHEMA.sql"
check "Guía de integración existe" "test -f /docs/03_GUIA_INTEGRACION_COMPLETA.md"
check "Arquitectura existe" "test -f /docs/04_ARQUITECTURA_SISTEMA.md"
check "MisPedidos.astro existe" "test -f src/components/MisPedidos.astro"
check "CarritoCheckout.astro existe" "test -f src/components/checkout/CarritoCheckout.astro"
check "NewsletterPopup.astro existe" "test -f src/components/NewsletterPopup.astro"
check "CambiarContraseña.astro existe" "test -f src/components/forms/CambiarContraseña.astro"
check "Página cupones existe" "test -f src/pages/admin/cupones.astro"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  2️⃣  VERIFICACIÓN DE ENDPOINTS API"
echo "═══════════════════════════════════════════════════════════"
echo ""

check "API cambiar-contrasena existe" "test -f src/pages/api/cambiar-contrasena.ts"
check "API newsletter/suscribir existe" "test -f src/pages/api/newsletter/suscribir.ts"
check "API cupones/validar existe" "test -f src/pages/api/cupones/validar.ts"
check "API pedidos/cancelar existe" "test -f src/pages/api/pedidos/cancelar.ts"
check "API pedidos/solicitar-devolucion existe" "test -f src/pages/api/pedidos/solicitar-devolucion.ts"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  3️⃣  VERIFICACIÓN DE DEPENDENCIAS"
echo "═══════════════════════════════════════════════════════════"
echo ""

check "package.json existe" "test -f package.json"
check "Astro instalado" "test -d node_modules/astro"
check "Supabase client instalado" "test -d node_modules/@supabase"
check "TypeScript instalado" "test -d node_modules/typescript"
check "Tailwind instalado" "test -d node_modules/tailwindcss"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  4️⃣  VERIFICACIÓN DE CONFIGURACIÓN"
echo "═══════════════════════════════════════════════════════════"
echo ""

check ".env.local existe" "test -f .env.local"
check "tsconfig.json existe" "test -f tsconfig.json"
check "astro.config.mjs existe" "test -f astro.config.mjs"
check "tailwind.config.mjs existe" "test -f tailwind.config.mjs"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  5️⃣  VERIFICACIÓN DE CONTENIDO .env.local"
echo "═══════════════════════════════════════════════════════════"
echo ""

if [ -f .env.local ]; then
  check "SUPABASE_URL en .env" "grep -q PUBLIC_SUPABASE_URL .env.local"
  check "SUPABASE_ANON_KEY en .env" "grep -q PUBLIC_SUPABASE_ANON_KEY .env.local"
  check "SUPABASE_SERVICE_ROLE_KEY en .env" "grep -q SUPABASE_SERVICE_ROLE_KEY .env.local"
  check "EMAIL_FROM configurado" "grep -q EMAIL_FROM .env.local"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  6️⃣  VERIFICACIÓN DE TIPOS"
echo "═══════════════════════════════════════════════════════════"
echo ""

check "Types de Order en index.ts" "grep -q 'interface Order' src/types/index.ts"
check "Types de Cupon en index.ts" "grep -q 'interface Cupon' src/types/index.ts"
check "Types de SolicitudDevolucion" "grep -q 'interface SolicitudDevolucion' src/types/index.ts"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  7️⃣  CHECKLIST MANUAL - SUPABASE"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "⚠️  DEBES VERIFICAR ESTOS ITEMS MANUALMENTE EN SUPABASE:"
echo ""
echo "[ ] 1. Tabla 'newsletter_suscriptores' existe"
echo "      → Ve a: Supabase Dashboard > SQL Editor"
echo "      → Ejecuta: SELECT * FROM newsletter_suscriptores LIMIT 1;"
echo ""
echo "[ ] 2. Tabla 'cupones' existe"
echo "      → Ejecuta: SELECT * FROM cupones LIMIT 1;"
echo ""
echo "[ ] 3. Tabla 'solicitudes_devolucion' existe"
echo "      → Ejecuta: SELECT * FROM solicitudes_devolucion LIMIT 1;"
echo ""
echo "[ ] 4. Función 'cancelar_pedido_atomico' existe"
echo "      → Ejecuta: SELECT * FROM pg_proc WHERE proname = 'cancelar_pedido_atomico';"
echo ""
echo "[ ] 5. Función 'validar_cupon' existe"
echo "      → Ejecuta: SELECT * FROM pg_proc WHERE proname = 'validar_cupon';"
echo ""
echo "[ ] 6. Función 'generar_codigo_descuento' existe"
echo "      → Ejecuta: SELECT * FROM pg_proc WHERE proname = 'generar_codigo_descuento';"
echo ""
echo "[ ] 7. RLS Policies configuradas para 'ordenes'"
echo "      → Ve a: Authentication > Policies"
echo "      → Verifica que hay al menos 1 policy en ordenes"
echo ""

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  8️⃣  CHECKLIST MANUAL - TESTING LOCAL"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "[ ] 1. Ejecutar: npm run dev"
echo ""
echo "[ ] 2. Ir a: http://localhost:4321"
echo ""
echo "[ ] 3. Verificar que el newsletter popup aparece"
echo "      → Debe mostrar después de 5 segundos o al mover mouse arriba"
echo ""
echo "[ ] 4. Probar Newsletter"
echo "      → Ingresa un email
echo "      → Debe retornar: {success: true, codigo_descuento: 'DESC...'}"
echo "      → En consola: ver POST /api/newsletter/suscribir (200 OK)"
echo ""
echo "[ ] 5. Probar Validación de Cupón"
echo "      → En consola del navegador, ejecuta:"
echo ""
echo "         fetch('/api/cupones/validar', {"
echo "           method: 'POST',"
echo "           headers: {'Content-Type': 'application/json'},"
echo "           body: JSON.stringify({"
echo "             codigo_cupon: 'DESC10EUR',"
echo "             usuario_id: 'test-user',"
echo "             subtotal: 50"
echo "           })"
echo "         }).then(r => r.json()).then(d => console.log(d))"
echo ""
echo "      → Debe retornar: {valido: false} (si no existe el cupón)"
echo ""
echo "[ ] 6. Revisar Console del Navegador"
echo "      → No debe haber errores rojos"
echo "      → Warnings de TypeScript/Eslint son OK"
echo ""

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  9️⃣  CHECKLIST MANUAL - PRODUCCIÓN"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "[ ] 1. Configurar email service"
echo "      → Opción A: Crear cuenta en resend.com"
echo "      → Opción B: Crear cuenta en sendgrid.com"
echo "      → Obtener API key y agregar a .env"
echo ""
echo "[ ] 2. Crear .env.production (en hosting)"
echo "      → Resend/SendGrid keys para producción"
echo "      → DB credentials"
echo ""
echo "[ ] 3. Configurar variables en Vercel (si usas)"
echo "      → Project Settings > Environment Variables"
echo "      → Agregar todas las keys"
echo ""
echo "[ ] 4. Deploy en Vercel/Netlify"
echo "      → git push origin main"
echo "      → Vercel detecta y despliega automáticamente"
echo ""
echo "[ ] 5. Verificar en producción"
echo "      → Abre https://tu-dominio.vercel.app"
echo "      → Prueba newsletter"
echo "      → Prueba cupones"
echo ""

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  🔟 ESTADO GENERAL"
echo "═══════════════════════════════════════════════════════════"
echo ""
printf "✓ Archivos verificados:     ${GREEN}${PASSED}${NC}/${TOTAL}\n"
printf "✗ Archivos faltantes:       ${RED}${FAILED}${NC}\n"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}  🎉 TODOS LOS ARCHIVOS Y DIRECTORIOS ESTÁN CORRECTOS  🎉${NC}"
  echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
  echo ""
  echo "Próximos pasos:"
  echo ""
  echo "1. Ejecutar Schema SQL en Supabase (ver punto 7️⃣)"
  echo "2. Configurar variables de email"
  echo "3. Ejecutar: npm run dev"
  echo "4. Probar localmente (ver punto 8️⃣)"
  echo "5. Deploy en producción (ver punto 9️⃣)"
  echo ""
  exit 0
else
  echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
  echo -e "${RED}  ⚠️  FALTAN ${FAILED} ARCHIVOS - REVISA LOS ERRORES ARRIBA  ⚠️${NC}"
  echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
  echo ""
  exit 1
fi
