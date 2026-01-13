-- ============================================================================
-- ACTUALIZAR IMÁGENES DE CATEGORÍAS CON CLOUDINARY
-- ============================================================================
-- Ejecutar en Supabase SQL Editor
-- Fecha: 13 de enero de 2026
-- ============================================================================

-- Neumáticos y llantas
UPDATE categorias 
SET imagen = 'https://res.cloudinary.com/ddi0g76bk/image/upload/v1768210430/Neumaticos_llantas_sktjri.webp' 
WHERE slug = 'neumaticos-llantas';

-- Frenos
UPDATE categorias 
SET imagen = 'https://res.cloudinary.com/ddi0g76bk/image/upload/v1768210429/frenos_qrke4a.webp' 
WHERE slug = 'frenos';

-- Motor
UPDATE categorias 
SET imagen = 'https://res.cloudinary.com/ddi0g76bk/image/upload/v1768210429/motor_smgtha.webp' 
WHERE slug = 'motor';

-- Filtros
UPDATE categorias 
SET imagen = 'https://res.cloudinary.com/ddi0g76bk/image/upload/v1768210429/filtros_fixdmp.webp' 
WHERE slug = 'filtros';

-- Amortiguación
UPDATE categorias 
SET imagen = 'https://res.cloudinary.com/ddi0g76bk/image/upload/v1768210430/amortiguacion_ir7tkx.webp' 
WHERE slug = 'amortiguacion';

-- Embrague
UPDATE categorias 
SET imagen = 'https://res.cloudinary.com/ddi0g76bk/image/upload/v1768210430/embrague_gavg3a.webp' 
WHERE slug = 'embrague';

-- Aceites y líquidos
UPDATE categorias 
SET imagen = 'https://res.cloudinary.com/ddi0g76bk/image/upload/v1768210429/aceites_bsoori.webp' 
WHERE slug = 'aceites-liquidos';

-- Correas, cadenas, rodillos
UPDATE categorias 
SET imagen = 'https://res.cloudinary.com/ddi0g76bk/image/upload/v1768210429/correas_qvwo8v.webp' 
WHERE slug = 'correas-cadenas';

-- Carrocería
UPDATE categorias 
SET imagen = 'https://res.cloudinary.com/ddi0g76bk/image/upload/v1768210430/carroceria_qmxk5s.webp' 
WHERE slug = 'carroceria';

-- Sistema eléctrico
UPDATE categorias 
SET imagen = 'https://res.cloudinary.com/ddi0g76bk/image/upload/v1768210430/electrico_vnzt8w.webp' 
WHERE slug = 'sistema-electrico';

-- Suspensión
UPDATE categorias 
SET imagen = 'https://res.cloudinary.com/ddi0g76bk/image/upload/v1768210430/suspension_wjifsz.webp' 
WHERE slug = 'suspension';

-- Otras categorías
UPDATE categorias 
SET imagen = 'https://res.cloudinary.com/ddi0g76bk/image/upload/v1768210430/otras_i1sjq8.webp' 
WHERE slug = 'otras-categorias';

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- SELECT id, nombre, imagen FROM categorias ORDER BY orden;
