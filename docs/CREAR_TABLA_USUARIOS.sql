-- ============================================================================
-- CREAR TABLA USUARIOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  apellido TEXT,
  email TEXT NOT NULL UNIQUE,
  telefono TEXT,
  direccion TEXT,
  ciudad TEXT,
  codigo_postal TEXT,
  pais TEXT,
  foto_perfil TEXT,
  fecha_registro TIMESTAMP DEFAULT NOW(),
  ultimo_acceso TIMESTAMP,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

-- Crear índices para mejor performance
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_activo ON usuarios(activo);

-- ============================================================================
-- HABILITAR RLS (Row Level Security)
-- ============================================================================

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
ON usuarios FOR SELECT
USING (id = auth.uid());

-- Política: Usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
ON usuarios FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Política: Cualquiera puede crear su propio perfil (al registrarse)
CREATE POLICY "Anyone can insert own profile"
ON usuarios FOR INSERT
WITH CHECK (id = auth.uid());

-- ============================================================================
-- FIN
-- ============================================================================
-- Copiar y ejecutar este archivo en Supabase SQL Editor
-- Luego la tabla estará lista para usar
