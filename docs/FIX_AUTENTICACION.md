# 🔧 FIX: Autenticación Simple

## Paso 1: Ejecuta este SQL en Supabase (reemplaza lo anterior)

```sql
-- Eliminar tabla si existe
DROP TABLE IF EXISTS admin_users CASCADE;

-- Crear tabla SIMPLE sin RLS complicadas
CREATE TABLE admin_users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  rol TEXT DEFAULT 'admin',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- RLS simple
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Política: El servidor (service role) puede hacer todo
-- Los usuarios normales NO pueden acceder
CREATE POLICY "Anon can not access" ON admin_users
  FOR ALL USING (false);
```

---

## Paso 2: Obtén el UUID de tu usuario admin

En Supabase → Authentication → Users → Copia el UUID del usuario admin

---

## Paso 3: Inserta el admin (reemplaza UUID)

```sql
INSERT INTO admin_users (id, email, nombre, rol, activo)
VALUES (
  'AQUI_EL_UUID_DEL_USUARIO_ADMIN',
  'admin@autopartsstore.com',
  'Administrador',
  'admin',
  true
);
```

---

## Paso 4: Verifica que está en la BD

```sql
SELECT * FROM admin_users;
```

Deberías ver tu admin registrado.

---

## Listo 🎉

Ahora intenta login en `/admin/login` con:
- Email: admin@autopartsstore.com
- Password: Tu contraseña real
