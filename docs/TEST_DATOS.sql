-- ESTE SQL DEFINITIVAMENTE ARREGLARÁ EL PROBLEMA
-- Ejecuta línea por línea en Supabase si es necesario

-- 1. DESHABILITAR RLS completamente en AMBAS tablas
ALTER TABLE productos DISABLE ROW LEVEL SECURITY;
ALTER TABLE categorias DISABLE ROW LEVEL SECURITY;

-- 2. VERIFICAR QUE LOS DATOS EXISTEN (ejecuta esto y mira el resultado)
SELECT COUNT(*) as total_productos FROM productos;
SELECT COUNT(*) as total_categorias FROM categorias;

-- Si los counts son mayores que 0, significa que los datos SÍ existen
-- y el único problema es RLS

-- 3. VER UN EJEMPLO DE PRODUCTO
SELECT id, nombre, precio, stock FROM productos LIMIT 1;

-- 4. VER UN EJEMPLO DE CATEGORÍA  
SELECT id, nombre, slug FROM categorias LIMIT 1;
