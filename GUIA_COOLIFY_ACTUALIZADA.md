# 🚀 Guía Completa: Desplegar en Coolify

## ✅ Estado Actual del Proyecto

Tu proyecto **está listo para Coolify**. He realizado las siguientes actualizaciones:

### Cambios Realizados:

1. ✅ **Adaptador actualizado**: `@astrojs/vercel` → `@astrojs/node@9.0.0`
2. ✅ **astro.config.mjs**: Configurado para Node.js con `mode: 'middleware'`
3. ✅ **package.json**: Dependencias actualizadas
4. ✅ **Build verificado**: Compilación exitosa sin errores
5. ✅ **Dockerfile**: Multi-stage build optimizado
6. ✅ **docker-compose.yml**: Configuración lista para testing
7. ✅ **Variables de entorno**: Todas documentadas en `.env.example`

---

## 🎯 Pasos para Desplegar en Coolify

### Paso 1: Preparar el Repositorio Git

```bash
# Desde la raíz del proyecto
git add .
git commit -m "Adaptador actualizado a Node.js para Coolify"
git push origin main
```

**Archivos importantes que se suben:**
- `Dockerfile` - Configuración de build
- `docker-compose.yml` - Para testing local
- `.dockerignore` - Optimización
- `.env.example` - Template de variables
- `astro.config.mjs` - Configuración actualizada
- `package.json` - Dependencias con @astrojs/node

---

### Paso 2: Configurar Coolify (Opción Recomendada: GitHub)

#### 2A. Crear Cuenta Coolify
1. Accede a [https://coolify.io](https://coolify.io)
2. Crea una cuenta (gratuita)
3. Crea una nueva aplicación

#### 2B. Conectar GitHub
1. En Coolify, selecciona "GitHub" como fuente
2. Autoriza el acceso a tu repositorio
3. Selecciona rama: `main`
4. Elige el Dockerfile automáticamente detectado

---

### Paso 3: Configurar Variables de Entorno

En el dashboard de Coolify, añade estas variables en **Environments**:

```env
# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu-cloud
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-secret

# Resend (Emails)
RESEND_API_KEY=tu-resend-key

# App Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
SITE_URL=https://tu-dominio.com
```

**⚠️ Importante:** Usa tus valores REALES de `.env.local`, no valores de prueba.

---

### Paso 4: Configurar Build

En Coolify:
1. **Build Command**: Dejar en blanco (usa Dockerfile)
2. **Start Command**: Dejar en blanco (usa Dockerfile)
3. **Base Directory**: `/` (raíz del proyecto)
4. **Port**: `3000` (ya configurado en Dockerfile)

---

### Paso 5: Health Check

Coolify detectará automáticamente:
- **Health Check Path**: `/`
- **Port**: `3000`
- **Protocol**: `HTTP`

El Dockerfile incluye un health check que verifica cada 30 segundos.

---

## 🧪 Pruebas Antes de Desplegar

### Test Local con Docker (Recomendado)

```bash
# 1. Navega al proyecto
cd /ruta/del/proyecto

# 2. Crea el archivo .env.local con tus variables reales
cat > .env.local << EOF
SUPABASE_URL=tu-url
SUPABASE_ANON_KEY=tu-key
# ... resto de variables
EOF

# 3. Construye la imagen
docker build -t auto-parts-store:latest .

# 4. Ejecuta el contenedor
docker run -p 3000:3000 \
  --env-file .env.local \
  auto-parts-store:latest

# 5. Prueba en http://localhost:3000
# Verifica productos, carrito, y Stripe payment
```

### Test con Docker Compose

```bash
# 1. Navega al proyecto
cd /ruta/del/proyecto

# 2. Copia .env.local a variables en docker-compose.yml

# 3. Inicia los servicios
docker-compose up

# 4. Abre http://localhost:3000
```

---

## 🎨 Estructura de Despliegue

```
Coolify (Docker)
├── Node.js 18 Alpine
├── Build
│   ├── npm install
│   ├── npm run build
│   └── Genera: /dist
└── Runtime
    ├── node ./dist/server/entry.mjs
    ├── Health checks
    └── Escucha puerto 3000
```

---

## 🔧 Configuraciones Importantes

### Environment Variables
Todas las variables están en `.env.example`:

```bash
# Ver el template
cat .env.example

# Copiar y editar
cp .env.example .env.local
nano .env.local  # Edita con tus valores reales
```

### Database (Supabase)
- **URL**: URL de tu proyecto Supabase
- **ANON_KEY**: Clave pública para cliente
- **SERVICE_ROLE_KEY**: Clave privada para servidor

### Pagos (Stripe)
- **PUBLISHABLE_KEY**: pk_test_... (para cliente)
- **SECRET_KEY**: sk_test_... (para servidor)

### Almacenamiento (Cloudinary)
- **CLOUD_NAME**: ID de tu cuenta
- **API_KEY**: Clave API pública
- **API_SECRET**: Clave API privada

---

## 📊 Monitoreo en Coolify

Una vez desplegado, puedes monitorear:

1. **Logs en Tiempo Real**
   - Ver errores de build
   - Ver errores de runtime
   - Ver requests HTTP

2. **Health Status**
   - Estado del contenedor
   - Uso de CPU/Memory
   - Uptime

3. **Deployment History**
   - Historial de builds
   - Rollback a versiones anteriores
   - Logs de cada deployment

---

## 🐛 Troubleshooting

### Error: "Cannot find module @supabase/supabase-js"
**Solución:** En docker-compose o dockerfile, ejecutar `npm ci` en lugar de `npm install`

### Error: "Port 3000 already in use"
**Solución:** Cambiar puerto en Coolify → PORT variable a otro puerto

### Error: "Health check failing"
**Solución:** 
1. Verificar que PORT sea correcto
2. Verificar variables de entorno
3. Ver logs en Coolify dashboard

### Error: "Build failing"
**Solución:**
1. Revisar logs del build en Coolify
2. Probar build local: `npm run build`
3. Verificar Node.js 18+ en Coolify

---

## 🌐 Configurar Dominio Personalizado

En Coolify, después de desplegar:

1. Ir a **Networking** → **Domains**
2. Añadir tu dominio: `www.mititienda.com`
3. Configurar DNS según instrucciones de Coolify
4. Actualizar `SITE_URL` en variables de entorno

---

## 🔒 Seguridad - Checklist

- [ ] Usar `sk_test_` keys en desarrollo, `sk_live_` en producción
- [ ] No subir `.env.local` a Git (está en `.gitignore`)
- [ ] Usar HTTPS en producción (Coolify lo proporciona)
- [ ] Verificar que `NODE_ENV=production`
- [ ] Activar health checks
- [ ] Configurar límites de recursos

---

## 📈 Escalabilidad en Coolify

Si tienes muchos usuarios:

1. **Aumentar Replicas**: Coolify permite múltiples instancias
2. **Load Balancer**: Coolify distribuye traffic automáticamente
3. **Caché**: Usar Cloudflare o Redis
4. **Database**: Supabase escala automáticamente
5. **CDN**: Cloudinary maneja imágenes

---

## ✨ Verificación Final

Después de desplegar, prueba:

```
✓ Home page carga correctamente
✓ Productos se muestran
✓ Carrito funciona
✓ Checkout de Stripe aparece
✓ Pago de prueba (4242 4242 4242 4242)
✓ Orden se crea en BD
✓ Productos aparecen en confirmación
✓ Carrito se limpia después de pagar
✓ Emails se envían (Resend)
✓ Imágenes cargan (Cloudinary)
```

---

## 📞 Soporte

**Si tienes problemas:**

1. Revisa logs en Coolify dashboard
2. Verifica variables de entorno
3. Prueba localmente con Docker
4. Revisa documentación de Coolify: https://coolify.io/docs

---

## 🎉 ¡Felicidades!

Tu tienda está lista para producción. El sistema completo incluye:

✅ Auto Parts Store completa
✅ Carrito con persistencia
✅ Stripe integration
✅ Base de datos Supabase
✅ Autenticación de usuarios
✅ Panel admin
✅ Sistema de cupones
✅ Almacenamiento Cloudinary
✅ Emails con Resend
✅ Docker containerizado
✅ Listo para Coolify

**Ahora a subir a producción! 🚀**
