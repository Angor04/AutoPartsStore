# 🔧 CONFIGURAR SUPABASE SERVICE ROLE KEY

## ¿Qué es Service Role Key?

Es una clave administrativa que permite crear usuarios sin restricciones de RLS. **Solo debe usarse en el backend (servidor)**, nunca en el frontend.

---

## 📍 Dónde obtenerla

### Paso 1: Abre tu proyecto en Supabase
```
https://app.supabase.com
```

### Paso 2: Ve a Settings → API
```
Sidebar → Settings → API
```

### Paso 3: Busca "Project API keys"
Encontrarás dos claves:
- `public.anon` (la que ya tienes)
- `secret` (la que necesitas copiar)

### Paso 4: Copia la clave `secret`
```
Haz click en el icono 📋 para copiar
```

---

## 📝 Agregar a tu proyecto

### Abre `.env.local` en la raíz de tu proyecto

Debe verse así:
```
PUBLIC_SUPABASE_URL=https://tuproyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# AGREGAR ESTA LÍNEA:
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### El archivo completo debería verse así:
```env
# URLs
PUBLIC_SUPABASE_URL=https://tuproyecto.supabase.co

# Anon key (pública)
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (SECRETA - Solo backend)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ⚠️ IMPORTANTE

**NUNCA**:
- ❌ Subas `SUPABASE_SERVICE_ROLE_KEY` a GitHub
- ❌ Expongas esta clave en el frontend
- ❌ Compartas esta clave con nadie

**SÍ**:
- ✅ Mantén esta clave en `.env.local`
- ✅ Úsala solo en API routes del backend
- ✅ Regenera la clave si la comprometes

---

## 🧪 Probar que funciona

1. Guarda los cambios en `.env.local`
2. Reinicia el servidor: `Ctrl+C` y `npm run dev`
3. Intenta registrarte
4. Deberías ver el formulario permitirte crear cuenta

---

## ✅ Verificar que está funcionando

En la consola del navegador (F12), deberías ver:
```
POST /api/auth/register 201 Created
```

Y en Supabase, en la tabla `usuarios`, deberías ver el nuevo usuario insertado.

---

**¿Listo? Intenta registrarte de nuevo 🚀**
