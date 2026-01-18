# 🔐 AUTENTICACIÓN ADMIN EN SUPABASE

## 1. Configuración de Supabase

### Paso 1: Crear tabla de administradores

Ejecuta esto en el **SQL Editor** de Supabase:

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

-- Agregar políticas de seguridad (RLS)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver la tabla
CREATE POLICY "Solo admins pueden leer" ON admin_users
  FOR SELECT USING (auth.uid() IN (SELECT id FROM admin_users WHERE activo = true));

-- Solo el admin puede actualizar sus datos
CREATE POLICY "Admin puede actualizar su datos" ON admin_users
  FOR UPDATE USING (auth.uid() = id);
```

---

## 2. Crear un usuario Administrador

### Opción A: Desde la consola de Supabase (Recomendado)

1. Ve a **Supabase Dashboard** → **Authentication** → **Users**
2. Haz click en **Create new user**
3. Ingresa:
   - Email: `admin@autopartsstore.com`
   - Password: `TuContraseñaSegura123!`
4. Marca "Auto-send sign-up confirmation" (opcional)

### Opción B: Desde SQL

```sql
-- Crear usuario admin (requiere service_role)
INSERT INTO auth.users (email, raw_app_meta_data, raw_user_meta_data, is_super_admin)
VALUES (
  'admin@autopartsstore.com',
  '{"provider":"email","providers":["email"]}',
  '{"name":"Admin AutoParts"}',
  false
);

-- Obtener el UUID del usuario creado (cópialo)
SELECT id, email FROM auth.users WHERE email = 'admin@autopartsstore.com';

-- Insertar en tabla admin_users (reemplaza el UUID)
INSERT INTO admin_users (id, email, nombre, rol, activo)
VALUES (
  'AQUI_VA_EL_UUID_DEL_USUARIO',
  'admin@autopartsstore.com',
  'Administrador',
  'admin',
  true
);
```

---

## 3. Middleware de Protección

Actualiza `src/middleware.ts`:

```typescript
// src/middleware.ts

import { defineMiddleware } from 'astro:middleware';
import { getSupabaseAdmin } from './lib/supabase';

export const onRequest = defineMiddleware(
  async (context, next) => {
    const protectedRoutes = ['/admin'];

    const isProtectedRoute = protectedRoutes.some((route) =>
      context.request.url.pathname.startsWith(route)
    );

    if (isProtectedRoute) {
      // Obtener el cookie de sesión de Supabase
      const authToken = context.cookies.get('sb-auth-token')?.value;

      if (!authToken) {
        // No hay sesión, redirigir a login
        return context.redirect('/admin/login');
      }

      try {
        // Verificar que el usuario sea admin
        const supabaseAdmin = getSupabaseAdmin();
        
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(authToken);

        if (error || !user) {
          return context.redirect('/admin/login');
        }

        // Verificar que sea admin
        const { data: adminUser } = await supabaseAdmin
          .from('admin_users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!adminUser || !adminUser.activo) {
          return context.redirect('/');  // Acceso denegado
        }

        // Pasar información del admin al contexto
        context.locals.admin = adminUser;
        context.locals.user = user;
      } catch (error) {
        console.error('Error verificando admin:', error);
        return context.redirect('/admin/login');
      }
    }

    return next();
  }
);
```

---

## 4. Página de Login del Admin

Crea `src/pages/admin/login.astro`:

```astro
---
// src/pages/admin/login.astro

const message = Astro.url.searchParams.get('message');
const error = Astro.url.searchParams.get('error');
---

<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Admin Login - AutoPartsStore</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
      }
      
      .login-container {
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        width: 100%;
        max-width: 400px;
        padding: 40px;
      }
      
      .logo {
        text-align: center;
        margin-bottom: 32px;
      }
      
      .logo h1 {
        font-size: 28px;
        color: #1a1a1a;
        margin-bottom: 8px;
      }
      
      .logo p {
        color: #666;
        font-size: 14px;
      }
      
      .form-group {
        margin-bottom: 20px;
      }
      
      label {
        display: block;
        color: #1a1a1a;
        font-weight: 600;
        margin-bottom: 8px;
        font-size: 14px;
      }
      
      input {
        width: 100%;
        padding: 12px 16px;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        font-size: 16px;
        transition: border-color 0.3s;
      }
      
      input:focus {
        outline: none;
        border-color: #667eea;
      }
      
      button {
        width: 100%;
        padding: 12px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 16px;
        cursor: pointer;
        transition: transform 0.2s;
      }
      
      button:hover {
        transform: scale(1.02);
      }
      
      button:active {
        transform: scale(0.98);
      }
      
      .error {
        background: #fee2e2;
        color: #991b1b;
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 20px;
        font-size: 14px;
      }
      
      .success {
        background: #dcfce7;
        color: #166534;
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 20px;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <div class="login-container">
      <div class="logo">
        <h1>🔐 AutoPartsStore</h1>
        <p>Panel de Administración</p>
      </div>
      
      {error && <div class="error">❌ {error}</div>}
      {message && <div class="success">✅ {message}</div>}
      
      <form method="POST" action="/api/auth/admin-login">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="admin@autopartsstore.com"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="password">Contraseña</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="••••••••"
            required
          />
        </div>
        
        <button type="submit">Iniciar Sesión</button>
      </form>
    </div>
  </body>
</html>
```

---

## 5. API de Login del Admin

Crea `src/pages/api/auth/admin-login.ts`:

```typescript
// src/pages/api/auth/admin-login.ts

import { supabaseClient } from '@/lib/supabase';

export const post = async (context) => {
  try {
    const formData = await context.request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Autenticar con Supabase
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return context.redirect(`/admin/login?error=${encodeURIComponent(error.message)}`);
    }

    if (!data.session) {
      return context.redirect('/admin/login?error=No session');
    }

    // Guardar token en cookie
    context.cookies.set('sb-auth-token', data.session.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });

    // Redirigir al dashboard
    return context.redirect('/admin');
  } catch (error) {
    console.error('Login error:', error);
    return context.redirect('/admin/login?error=Error interno');
  }
};
```

---

## 6. API de Logout del Admin

Crea `src/pages/api/auth/admin-logout.ts`:

```typescript
// src/pages/api/auth/admin-logout.ts

import { supabaseClient } from '@/lib/supabase';

export const post = async (context) => {
  try {
    // Limpiar cookie
    context.cookies.delete('sb-auth-token');

    // Logout en Supabase
    await supabaseClient.auth.signOut();

    // Redirigir a home
    return context.redirect('/');
  } catch (error) {
    console.error('Logout error:', error);
    return context.redirect('/');
  }
};
```

---

## 7. Verificar Admin en Páginas

En cualquier página del admin, puedes acceder a los datos del admin:

```astro
---
// src/pages/admin/index.astro

import AdminLayout from "@/layouts/AdminLayout.astro";

// Los datos del admin están en Astro.locals
const admin = Astro.locals.admin;
const user = Astro.locals.user;
---

<AdminLayout>
  <p>Bienvenido, {admin.nombre}</p>
  <p>Email: {user.email}</p>
</AdminLayout>
```

---

## 8. Variables de Entorno Necesarias

Asegúrate de tener en `.env.local`:

```
PUBLIC_SUPABASE_URL=https://tuproject.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc... # ⚠️ SECRETO - NO COMPARTIR
```

---

## Flujo de Autenticación

```
1. Usuario accede a /admin
   ↓
2. Middleware verifica cookie
   ↓
3. Si no hay cookie → Redirige a /admin/login
   ↓
4. Usuario ingresa email y contraseña
   ↓
5. API /admin-login valida con Supabase
   ↓
6. Si es válido → Guarda token en cookie
   ↓
7. Redirige a /admin con acceso concedido
   ↓
8. Middleware verifica admin_users table
   ↓
9. Si es admin → Permite acceso
   ↓
10. Si no es admin → Redirige a home
```

---

## Prueba Rápida

```bash
# 1. Navega a
http://localhost:3000/admin/login

# 2. Ingresa:
Email: admin@autopartsstore.com
Password: TuContraseñaSegura123!

# 3. Deberías ver el dashboard
```

---

## Seguridad

✅ **Tokens seguros**: Se guardan en cookies httpOnly
✅ **Protección CSRF**: Astro maneja automáticamente
✅ **Verificación server-side**: El middleware verifica en el servidor
✅ **RLS en Supabase**: Solo admins ven la tabla
✅ **Logout limpio**: Borra cookies y sesión

---

**¡Listo! Tu panel admin está completamente asegurado con Supabase** 🔒
