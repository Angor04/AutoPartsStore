# 🚀 Desplegar con Nixpacks en Coolify

## ✅ Configuración Completada

Tu proyecto está ahora optimizado para **Nixpacks**, que es más rápido que el Dockerfile tradicional.

### Archivos Creados:
- ✅ `nixpacks.toml` - Configuración de Nixpacks
- ✅ Node.js 22 configurado
- ✅ Build command: `npm run build`
- ✅ Start command: `node ./dist/server/entry.mjs`

---

## 📝 ¿Qué es Nixpacks?

Nixpacks es un build system **automático** que:
- Detecta tu proyecto (Node.js en este caso)
- Instala dependencias
- Compila el código
- Inicia la aplicación

Es **más rápido** que Docker porque:
- Usa caché agresivo
- No necesita capas múltiples
- Optimización automática

---

## 🎯 Pasos para Desplegar

### 1️⃣ Cancela el Build Actual (si está en progreso)

En Coolify Dashboard → Cancel

### 2️⃣ Configura en Coolify

#### En **Settings → Build Settings:**

```
Build Method: Auto-detect (o Nixpacks)
Base Directory: /
Dockerfile Location: (dejar en blanco)
Docker Compose: (dejar en blanco)
```

#### En **Settings → Deploy:**

```
Start Command: (Dejar en blanco - usa nixpacks.toml)
Entrypoint: (Dejar en blanco - usa nixpacks.toml)
Port: 3000
```

### 3️⃣ Variables de Entorno en Coolify

En **Environment → Variables**, agregar:

```
# Supabase
SUPABASE_URL=https://aebzgxrpvbwmcktnvkea.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=ddi0g76bk
CLOUDINARY_API_KEY=294117343759382
CLOUDINARY_API_SECRET=b1lPvUrorKgbCutIaRoNdgwf5mg

# Resend
RESEND_API_KEY=re_SkLV6SsE_...

# App Config
NODE_ENV=production
PORT=3000
```

### 4️⃣ Deploy

Haz clic en **Deploy** y espera:
- **Fase 1**: Setup de Nixpacks (~1-2 min)
- **Fase 2**: Install de dependencias (~2-5 min)
- **Fase 3**: Build de Astro (~2-3 min)
- **Total**: ~5-10 minutos

---

## 📊 Estructura del Build con Nixpacks

```
Nixpacks Build Process:
├── Setup (Node.js 22)
├── npm ci (install limpio)
├── npm run build
│   ├── Astro compilation
│   └── Generate dist/server/entry.mjs
└── Start: node ./dist/server/entry.mjs
    └── Escucha puerto 3000
```

---

## 🔍 Qué Hace el nixpacks.toml

```toml
[build]
nixpacks.node.version = "22"      # Node.js v22
install.commands = ["npm ci"]     # Install limpio
build.commands = ["npm run build"] # Compila Astro

[start]
cmd = "node ./dist/server/entry.mjs"  # Comando para iniciar

[variables]
NODE_ENV = "production"  # Modo producción
# ... resto de variables
```

---

## ✨ Ventajas de Nixpacks

✅ **Automático**: No necesita configuración manual
✅ **Rápido**: Caché inteligente
✅ **Limpio**: No necesita Dockerfile
✅ **Oficial**: Coolify lo recomienda

---

## 🧪 Verificar el Build Localmente (Opcional)

Si quieres probar antes de desplegar:

```bash
# Instalar nixpacks localmente (opcional)
# https://nixpacks.com/

# O simplemente verifica que el build funciona
npm ci
npm run build

# Verifica que existe el archivo de entrada
ls -la dist/server/entry.mjs

# Prueba de inicio (debes tener variables de entorno)
node ./dist/server/entry.mjs
```

---

## 🐛 Si hay Errores

### Error: "Cannot find entry.mjs"
**Solución**: Verifica que `astro.config.mjs` tiene:
```javascript
import node from '@astrojs/node';
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'middleware' }),
  // ...
});
```

### Error: "npm ci fails"
**Solución**: Nixpacks usa `npm ci` para instalar. Asegúrate que `package-lock.json` existe en Git.

### Error: "Port 3000 not accessible"
**Solución**: En Coolify, verifica:
- PORT = 3000 en variables
- Host accessibility está habilitado
- Firewall permite 3000

---

## 📈 Monitor el Deploy

En Coolify Dashboard:
1. **Logs**: Ver en tiempo real qué está pasando
2. **Build Logs**: Ver detalles del build
3. **Health Check**: Verifica que el app está healthy
4. **Uptime**: Monitor el servicio

---

## 🎉 ¡Listo!

Tu proyecto ahora está optimizado para:
- ✅ Nixpacks build system
- ✅ Node.js 22
- ✅ Astro con servidor Node.js
- ✅ Variables de entorno automáticas
- ✅ Puerto 3000 configurado

**Próximo paso: Hacer Deploy en Coolify!**
