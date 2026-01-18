-- Crear tabla para carritos temporales de usuarios autenticados
CREATE TABLE IF NOT EXISTS carrito_temporal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]',
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW(),
  UNIQUE(usuario_id)
);

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_carrito_usuario_id ON carrito_temporal(usuario_id);

-- Habilitar RLS
ALTER TABLE carrito_temporal ENABLE ROW LEVEL SECURITY;

-- Política para que usuarios solo vean su propio carrito
CREATE POLICY "Usuarios pueden ver su propio carrito"
  ON carrito_temporal FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden actualizar su propio carrito"
  ON carrito_temporal FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden insertar su propio carrito"
  ON carrito_temporal FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden eliminar su propio carrito"
  ON carrito_temporal FOR DELETE
  USING (auth.uid() = usuario_id);
