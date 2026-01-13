-- ============================================================================
-- SCRIPT DEFINITIVO: DESHABILITAR RLS Y PERMITIR LECTURA PÚBLICA
-- ============================================================================
-- Ejecuta ESTO en Supabase SQL Editor para que funcionen los productos

-- PASO 1: Deshabilitar RLS completamente
ALTER TABLE IF EXISTS productos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categorias DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS carritos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ordenes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS resenas DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cupones DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contactos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS configuracion DISABLE ROW LEVEL SECURITY;

-- PASO 2: Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "productos_lectura_publica" ON productos;
DROP POLICY IF EXISTS "productos_escritura_admin" ON productos;
DROP POLICY IF EXISTS "productos_leer_todos" ON productos;
DROP POLICY IF EXISTS "categorias_lectura_publica" ON categorias;
DROP POLICY IF EXISTS "categorias_escritura_admin" ON categorias;
DROP POLICY IF EXISTS "categorias_leer_todos" ON categorias;

-- PASO 3: Verificar que hay datos
-- Esto mostrará cuántas filas hay en cada tabla
SELECT COUNT(*) as total_categorias FROM categorias;
SELECT COUNT(*) as total_productos FROM productos;

-- PASO 4: Reabilitar RLS con políticas SIMPLES que permitan lectura a TODOS
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

-- Política simple: TODOS pueden leer
CREATE POLICY "productos_select_all" ON productos FOR SELECT USING (true);
CREATE POLICY "categorias_select_all" ON categorias FOR SELECT USING (true);

-- Bloquear inserciones desde cliente anónimo (solo para seguridad)
CREATE POLICY "productos_insert_blocked" ON productos FOR INSERT WITH CHECK (false);
CREATE POLICY "productos_update_blocked" ON productos FOR UPDATE WITH CHECK (false);
CREATE POLICY "productos_delete_blocked" ON productos FOR DELETE USING (false);

CREATE POLICY "categorias_insert_blocked" ON categorias FOR INSERT WITH CHECK (false);
CREATE POLICY "categorias_update_blocked" ON categorias FOR UPDATE WITH CHECK (false);
CREATE POLICY "categorias_delete_blocked" ON categorias FOR DELETE USING (false);
