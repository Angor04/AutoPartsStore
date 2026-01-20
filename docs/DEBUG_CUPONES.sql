-- Script para arreglar los cupones
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar que la tabla cupones exista
SELECT table_name FROM information_schema.tables WHERE table_name = 'cupones';

-- 2. Ver qué hay en la tabla cupones
SELECT id, codigo, descripcion, tipo_descuento, valor_descuento, 
       cantidad_minima_compra, limite_usos, usos_totales, 
       fecha_inicio, fecha_expiracion, activo
FROM cupones
ORDER BY creado_en DESC;

-- 3. Ver qué hay en cupones_usados (si existe)
SELECT * FROM cupones_usados LIMIT 10;

-- 4. Verificar si cupones_uso existe
SELECT * FROM cupones_uso LIMIT 10;

-- 5. Validar la función validar_cupon
-- Esto ejecutará la función con valores de prueba
SELECT * FROM validar_cupon('BIENVENIDO10', NULL, 100);
SELECT * FROM validar_cupon('ENVIOGRATIS', NULL, 50);
SELECT * FROM validar_cupon('VERANO20', NULL, 150);

-- 6. Si los cupones no existen, insertarlos:
-- (descomenta si es necesario)
/*
INSERT INTO cupones (codigo, descripcion, tipo_descuento, valor_descuento, limite_usos, cantidad_minima_compra, fecha_inicio, fecha_expiracion, activo)
VALUES 
  ('BIENVENIDO10', 'Descuento de bienvenida 10%', 'porcentaje', 10, 100, 30, NOW(), NOW() + INTERVAL '1 year', true),
  ('ENVIOGRATIS', 'Envío gratis en compras +50€', 'cantidad_fija', 5.99, NULL, 50, NOW(), NOW() + INTERVAL '6 months', true),
  ('VERANO20', 'Descuento de verano 20%', 'porcentaje', 20, 50, 100, NOW(), NOW() + INTERVAL '3 months', true)
ON CONFLICT (codigo) DO NOTHING;
*/
