# ✅ GUÍA RÁPIDA: AUTENTICACIÓN DEL PANEL ADMIN

## Paso 1: Configurar Supabase

### En el SQL Editor de Supabase, ejecuta:

```sql
-- Crear tabla de administradores
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  rol TEXT DEFAULT 'admin',
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT now(),
  actualizado_en TIMESTAMP DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Política de seguridad
CREATE POLICY "solo_admins_leen" ON admin_users
  FOR SELECT USING (auth.uid() IN (SELECT id FROM admin_users WHERE activo = true));
```

---

## Paso 2: Crear Usuario Admin

### En Supabase → Authentication → Users → Create new user

1. Email: `admin@autopartsstore.com`
2. Password: `TuContraseñaSegura123!`
3. Presiona "Create user"

### Copiar el UUID del usuario y ejecutar:

```sql
-- Reemplaza AQUI_UUID_DEL_USUARIO con el UUID real
INSERT INTO admin_users (id, email, nombre, rol, activo)
VALUES (
  'AQUI_UUID_DEL_USUARIO',
  'admin@autopartsstore.com',
  'Administrador',
  'admin',
  true
);
```

---

## Paso 3: Variables de Entorno

Asegúrate que `.env.local` tenga:

```
PUBLIC_SUPABASE_URL=https://tuproject.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc... (⚠️ SECRETO)
```

---

## Paso 4: Archivos Creados

✅ **Automáticamente creados:**

- `src/pages/admin/login.astro` - Página de login
- `src/pages/api/auth/admin-login.ts` - API de login
- `src/pages/api/auth/admin-logout.ts` - API de logout
- `src/middleware.ts` - Protección de rutas (ACTUALIZADO)

---

## Paso 5: Usar el Panel Admin

### Login:
```
http://localhost:3000/admin/login
```

### Email:
```
admin@autopartsstore.com
```

### Contraseña:
```
TuContraseñaSegura123!
```

### Dashboard:
```
http://localhost:3000/admin
```

---

## Flujo de Autenticación

```
1. Usuario accede a /admin
   ↓
2. Middleware verifica cookie sb-auth-token
   ↓
3. Si no existe → Redirige a /admin/login
   ↓
4. Usuario ingresa credenciales
   ↓
5. POST /api/auth/admin-login
   ↓
6. Supabase valida email/password
   ↓
7. Si OK → Guarda token en cookie
   ↓
8. Redirige a /admin ✅
   ↓
9. Middleware verifica token ✅
   ↓
10. Acceso concedido
```

---

## Logout

El botón "Salir" en el sidebar hace POST a:
```
/api/auth/admin-logout
```

Esto limpia las cookies y redirige a home.

---

## Seguridad

✅ **Tokens en cookies httpOnly** - No accesibles desde JS
✅ **Redireccionamiento automático** - Sin sesión → Login
✅ **RLS en Supabase** - Nivel de BD protegido
✅ **Middleware validador** - Protección en servidor

---

## Cambiar Contraseña Admin

En Supabase → Authentication → Users → Selecciona usuario → Reset password

---

## Agregar Más Admins

```sql
-- 1. Crear usuario en Supabase (desde UI)
-- 2. Copiar UUID
-- 3. Ejecutar:

INSERT INTO admin_users (id, email, nombre, rol, activo)
VALUES (
  'NUEVO_UUID',
  'neoadmin@autopartsstore.com',
  'Nuevo Admin',
  'admin',
  true
);
```

---

## Desactivar Admin

```sql
UPDATE admin_users 
SET activo = false 
WHERE email = 'admin@autopartsstore.com';
```

---

## Verificación

Para verificar que está funcionando:

1. Cierra todas las pestañas del navegador
2. Abre `http://localhost:3000/admin`
3. Deberías ser redirigido a `/admin/login` ✅
4. Ingresa las credenciales
5. Deberías ver el dashboard ✅
6. Haz click en "Salir"
7. Deberías ir a home ✅

---

**¡Tu panel admin está 100% seguro con Supabase!** 🔐🚀
