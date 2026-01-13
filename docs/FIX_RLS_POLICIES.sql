-- ============================================================================
-- FIX: Permitir lectura pública sin restricciones
-- ============================================================================
-- Ejecuta esto en Supabase SQL Editor si los productos no aparecen

-- Eliminar políticas restrictivas
DROP POLICY IF EXISTS "productos_lectura_publica" ON productos;
DROP POLICY IF EXISTS "categorias_lectura_publica" ON categorias;

-- Crear nuevas políticas simples (permitir lectura a todos)
CREATE POLICY "productos_lectura_sin_restriccion" ON productos
  FOR SELECT USING (true);

CREATE POLICY "categorias_lectura_sin_restriccion" ON categorias
  FOR SELECT USING (true);

-- Mantener escritura solo para admin
CREATE POLICY "productos_escribir_admin" ON productos
  FOR INSERT WITH CHECK (false);  -- Bloquear inserciones anónimas

CREATE POLICY "categorias_escribir_admin" ON categorias
  FOR INSERT WITH CHECK (false);  -- Bloquear inserciones anónimas
