-- Migración para agregar campos de autenticación con Google a la tabla usuarios
-- Ejecutar en Supabase SQL Editor

-- Agregar columnas faltantes si no existen
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS proveedor_autenticacion TEXT DEFAULT 'email',
ADD COLUMN IF NOT EXISTS google_id TEXT,
ADD COLUMN IF NOT EXISTS foto_perfil TEXT,
ADD COLUMN IF NOT EXISTS ultimo_acceso TIMESTAMP;

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_google_id ON usuarios(google_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_proveedor ON usuarios(proveedor_autenticacion);

-- Crear política de seguridad (RLS) si no están creadas
DO $$
BEGIN
  -- Habilitar RLS
  ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
  
  -- Crear políticas solo si no existen
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'usuarios' AND policyname = 'Usuarios pueden ver su propio perfil') THEN
    CREATE POLICY "Usuarios pueden ver su propio perfil"
      ON usuarios FOR SELECT
      USING (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'usuarios' AND policyname = 'Usuarios pueden actualizar su propio perfil') THEN
    CREATE POLICY "Usuarios pueden actualizar su propio perfil"
      ON usuarios FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'usuarios' AND policyname = 'Usuarios pueden crear su perfil') THEN
    CREATE POLICY "Usuarios pueden crear su perfil"
      ON usuarios FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
  
END $$;
