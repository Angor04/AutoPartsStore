# 🚀 GUÍA DE DESPLIEGUE A COOLIFY

## ¿Qué es Coolify?

Coolify es una plataforma **self-hosted** similar a Vercel/Netlify pero que puedes instalar en tu propio servidor. Permite desplegar aplicaciones Docker fácilmente.

---

## 📋 PRE-REQUISITOS

Antes de desplegar, verifica:

- [ ] Git repository configurado
- [ ] Archivo `.env.local` con todas las variables
- [ ] Dockerfile en la raíz del proyecto
- [ ] `docker-compose.yml` para testing local
- [ ] Base de datos Supabase lista
- [ ] Stripe API keys (test o live)
- [ ] Node.js 18+ localmente

---

## ✅ CHECKLIST ANTES DE DESPLEGAR

### 1. **Verificar Configuración**

```bash
# Asegúrate que el build funciona localmente
npm run build

# Test del Dockerfile
docker build -t autoparts-store .

# Test de docker-compose
docker-compose up
```

### 2. **Variables de Entorno**

Copia `.env.local` (tu versión con valores reales):
```bash
cp .env.local .env.production
```

En Coolify, necesitarás estas variables:
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RESEND_API_KEY=
```

### 3. **Git Setup**

```bash
# Inicializar git si no está ya hecho
git init

# Agregar remoto
git remote add origin <tu-repo-url>

# Hacer push
git add .
git commit -m "Preparado para Coolify"
git push origin main
```

### 4. **Verificar astro.config.mjs**

```javascript
// Debe tener:
export default defineConfig({
  output: 'server',  // ← IMPORTANTE para Node.js
  adapter: node({ mode: 'middleware' }),
  // ... resto de config
});
```

---

## 🚀 PASOS PARA DESPLEGAR EN COOLIFY

### OPCIÓN 1: Vía Git Repository (Recomendado)

1. **Sube tu código a GitHub**
   ```bash
   git push origin main
   ```

2. **En Coolify Dashboard:**
   - Ir a: `Projects` → `New Project`
   - Seleccionar: `New Service`
   - Tipo: `Docker`
   - Build Pack: `Dockerfile`

3. **Conectar Repository:**
   - GitHub Account
   - Seleccionar repositorio
   - Branch: `main`

4. **Configurar Despliegue:**
   - Build command: `npm run build`
   - Start command: (dejar vacío si está en Dockerfile)
   - Port: `3000`
   - Environment variables: (pegar las variables de `.env.local`)

5. **Deploy:**
   - Click en "Deploy"
   - Esperar a que construya y despliegue

---

### OPCIÓN 2: Docker Compose Local (Para Testing)

```bash
# Crear archivo .env para docker-compose
cat > .env.docker << EOF
SUPABASE_URL=tu_url
SUPABASE_ANON_KEY=tu_key
# ... resto de variables
EOF

# Ejecutar
docker-compose --env-file .env.docker up -d

# Ver logs
docker-compose logs -f app

# Acceder a
http://localhost:3000
```

---

### OPCIÓN 3: Deploy Manual

1. **En servidor con Coolify:**
   ```bash
   coolify create-service \
     --name autoparts-store \
     --type docker \
     --dockerfile ./Dockerfile \
     --port 3000
   ```

2. **Agregar variables de entorno:**
   ```bash
   coolify service update autoparts-store \
     --env SUPABASE_URL=... \
     --env STRIPE_SECRET_KEY=...
   ```

3. **Deploy:**
   ```bash
   coolify deploy autoparts-store
   ```

---

## 🔧 ESTRUCTURA NECESARIA PARA COOLIFY

```
tu-proyecto/
├── Dockerfile              ✅ (Creado)
├── docker-compose.yml      ✅ (Creado)
├── .dockerignore          ✅ (Creado)
├── .env.example           ✅ (Actualizado)
├── .env.local             ✓ (Tu archivo local)
├── astro.config.mjs       ✓ (Debe estar correcto)
├── package.json           ✓
├── package-lock.json      ✓
├── src/                   ✓
├── public/                ✓
└── README.md              ✓
```

---

## ⚙️ VARIABLES DE ENTORNO EN COOLIFY

En el panel de Coolify, configura:

```
SUPABASE_URL=https://aebzgxrpvbwmcktnvkea.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
PUBLIC_SUPABASE_URL=https://aebzgxrpvbwmcktnvkea.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
CLOUDINARY_CLOUD_NAME=ddi0g76bk
CLOUDINARY_API_KEY=294117343759382
CLOUDINARY_API_SECRET=b1lPvUrorKgbCutIaRoNdgwf5mg
RESEND_API_KEY=re_SkLV6SsE_...
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
```

---

## 🔄 FLUJO DE DESPLIEGUE AUTOMÁTICO

Si configuras git en Coolify:

```
Haces push a GitHub
    ↓
Webhook dispara en Coolify
    ↓
Coolify clona el repositorio
    ↓
Construye el Dockerfile
    ↓
Ejecuta npm run build
    ↓
Inicia el contenedor
    ↓
Aplicación disponible en tu dominio
```

---

## 🔍 VERIFICAR QUE FUNCIONA

Después de desplegar:

1. **Accede a tu URL:**
   ```
   https://tu-dominio.coolify.io
   (o tu dominio personalizado)
   ```

2. **Verifica funcionalidad:**
   - ✅ Carga la página de inicio
   - ✅ Puedes ver productos
   - ✅ Puedes agregar al carrito
   - ✅ Puedes hacer checkout
   - ✅ Stripe funciona

3. **Revisa logs:**
   ```
   Coolify Dashboard → Service → Logs
   Busca errores o warnings
   ```

---

## 🚨 PROBLEMAS COMUNES

### Error: "Build failed"

**Solución:**
```bash
# Verifica que build local funciona
npm run build

# Verifica que Dockerfile es correcto
docker build -t test .

# Revisa logs en Coolify
```

### Error: "Port already in use"

**Solución:**
- Cambiar PORT en variables de entorno
- O cambiar puerto del contenedor en Coolify

### Error: "Environment variables not found"

**Solución:**
- Verifica que todas las variables están en Coolify
- Reinicia el servicio después de agregar variables

### Aplicación carga pero da errores

**Solución:**
- Verifica Supabase está accesible
- Verifica Stripe keys son correctas
- Revisa logs en Coolify

---

## 📊 MONITOREO POST-DESPLIEGUE

### Verificar Health Check

```bash
curl https://tu-dominio.coolify.io/health
# Debería retornar 200
```

### Revisar Logs

```
Coolify Dashboard → Service → Logs → Live
```

### Monitorear Recursos

```
Coolify Dashboard → Service → Stats
- CPU
- Memory
- Requests
```

---

## 🔐 SEGURIDAD EN PRODUCCIÓN

### Cambiar Stripe Keys

```
De: pk_test_, sk_test_
A: pk_live_, sk_live_

En Coolify → Environment Variables
```

### HTTPS

Coolify automáticamente:
- Genera certificado SSL
- Redirige HTTP → HTTPS
- Valida dominio

### Backups

```
Supabase (automático)
- Backups diarios
- Point-in-time recovery
```

---

## 📈 ESCALADO FUTURO

Si necesitas más recursos:

```
Coolify Dashboard → Service → Resources
- Aumentar RAM
- Aumentar CPU
- Escalar replicas
```

---

## 🎯 RESUMEN DE ARCHIVOS CREADOS

| Archivo | Propósito |
|---------|-----------|
| `Dockerfile` | Contenerizar la aplicación |
| `docker-compose.yml` | Testing local con Docker |
| `.dockerignore` | Excluir archivos del build |
| `.env.example` | Template de variables |

---

## ✅ CHECKLIST FINAL

- [ ] Dockerfile creado
- [ ] docker-compose.yml creado
- [ ] .dockerignore creado
- [ ] .env.example actualizado
- [ ] Código en GitHub
- [ ] Variables de entorno listas
- [ ] Build local funciona
- [ ] astro.config.mjs está correcto
- [ ] Cuenta Coolify creada
- [ ] Dominio configurado (o usando coolify.io)
- [ ] Deploy en progreso
- [ ] Aplicación accesible
- [ ] Funcionalidades verificadas

---

## 🚀 PRÓXIMO PASO

```bash
# 1. Haz push del código a GitHub
git add .
git commit -m "Preparado para Coolify"
git push origin main

# 2. Ve a Coolify Dashboard y crea nuevo servicio
# 3. Conecta tu repositorio
# 4. Configura variables de entorno
# 5. Deploy automático

# 6. Monitorea los logs
# 7. Verifica que todo funciona
```

---

**Estado**: ✅ LISTO PARA COOLIFY

Para preguntas sobre Coolify:
- Docs: https://coolify.io/docs
- Community: https://community.coolify.io

