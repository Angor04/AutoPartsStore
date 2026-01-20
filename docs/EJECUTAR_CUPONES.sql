-- ============================================================================
-- SCRIPT PARA ARREGLAR CUPONES - Ejecutar en Supabase SQL Editor
-- ============================================================================
-- Este script verifica y arregla los cupones en tu base de datos

-- 1️⃣ VERIFICAR QUE LA TABLA CUPONES EXISTE
-- ============================================================================
SELECT 
  table_name,
  EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'cupones'
  ) as existe
FROM information_schema.tables
WHERE table_name = 'cupones';

-- 2️⃣ VER TODOS LOS CUPONES ACTUALES
-- ============================================================================
SELECT 
  id,
  codigo,
  descripcion,
  tipo_descuento,
  valor_descuento,
  cantidad_minima_compra,
  limite_usos,
  usos_totales,
  fecha_inicio,
  fecha_expiracion,
  activo,
  creado_en
FROM cupones
ORDER BY creado_en DESC;

-- 3️⃣ INSERTAR CUPONES DE PRUEBA (SI NO EXISTEN)
-- ============================================================================
INSERT INTO cupones (
  codigo, 
  descripcion, 
  tipo_descuento, 
  valor_descuento, 
  limite_usos, 
  cantidad_minima_compra, 
  fecha_inicio, 
  fecha_expiracion, 
  activo
)
VALUES 
  (
    'BIENVENIDO10',
    'Descuento de bienvenida 10%',
    'porcentaje',
    10,
    100,
    30,
    NOW(),
    NOW() + INTERVAL '1 year',
    true
  ),
  (
    'ENVIOGRATIS',
    'Envío gratis en compras +50€',
    'cantidad_fija',
    5.99,
    NULL,
    50,
    NOW(),
    NOW() + INTERVAL '6 months',
    true
  ),
  (
    'VERANO20',
    'Descuento de verano 20%',
    'porcentaje',
    20,
    50,
    100,
    NOW(),
    NOW() + INTERVAL '3 months',
    true
  )
ON CONFLICT (codigo) DO NOTHING;

-- 4️⃣ VERIFICAR QUE SE INSERTARON
-- ============================================================================
SELECT 
  COUNT(*) as total_cupones
FROM cupones;

-- 5️⃣ PRUEBAS DE LA FUNCIÓN validar_cupon
-- ============================================================================

-- Prueba 1: Cupón válido con compra de 100€
-- BIENVENIDO10 = 10% de 100€ = 10€ descuento
SELECT 
  'Prueba 1: BIENVENIDO10 con 100€' as prueba,
  * 
FROM validar_cupon('BIENVENIDO10', NULL, 100);

-- Prueba 2: Cupón válido con compra de 60€ (ENVIOGRATIS)
-- ENVIOGRATIS = 5.99€ descuento (mínimo 50€)
SELECT 
  'Prueba 2: ENVIOGRATIS con 60€' as prueba,
  * 
FROM validar_cupon('ENVIOGRATIS', NULL, 60);

-- Prueba 3: Compra menor al mínimo
-- Debe fallar - BIENVENIDO10 requiere 30€ mínimo
SELECT 
  'Prueba 3: BIENVENIDO10 con 20€ (debe fallar)' as prueba,
  * 
FROM validar_cupon('BIENVENIDO10', NULL, 20);

-- Prueba 4: Código inválido
-- Debe fallar - código no existe
SELECT 
  'Prueba 4: CODIGOFALSO (debe fallar)' as prueba,
  * 
FROM validar_cupon('CODIGOFALSO', NULL, 100);

-- Prueba 5: VERANO20 con 150€
-- VERANO20 = 20% de 150€ = 30€ descuento (mínimo 100€)
SELECT 
  'Prueba 5: VERANO20 con 150€' as prueba,
  * 
FROM validar_cupon('VERANO20', NULL, 150);

-- 6️⃣ VERIFICAR TABLAS RELACIONADAS
-- ============================================================================

-- Tabla cupones_uso (para tracking de quién usó qué cupón)
SELECT 
  'cupones_uso' as tabla,
  COUNT(*) as cantidad_registros
FROM cupones_uso;

-- Tabla cupones_newsletter (para códigos de newsletter)
SELECT 
  'cupones_newsletter' as tabla,
  COUNT(*) as cantidad_registros
FROM cupones_newsletter;

-- 7️⃣ REAJUSTAR CONTADORES SI ES NECESARIO
-- ============================================================================
-- Si viste cupones sin contador de usos, ajustar:
UPDATE cupones
SET usos_totales = 0
WHERE usos_totales IS NULL;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================

-- Después de ejecutar todo esto, los cupones deberían funcionar.
-- Intenta en el checkout con: BIENVENIDO10, ENVIOGRATIS o VERANO20
