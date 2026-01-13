-- ============================================================================
-- MIGRACIÓN: AGREGAR COLUMNA IMAGEN A CATEGORÍAS
-- ============================================================================
-- Ejecutar en Supabase SQL Editor
-- Fecha: 12 de enero de 2026
-- ============================================================================

-- Agregar columna imagen a la tabla categorias (si no existe)
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS imagen TEXT;

-- ============================================================================
-- ACTUALIZAR IMÁGENES DE CATEGORÍAS CON CLOUDINARY
-- ============================================================================
UPDATE categorias SET imagen = 'https://res.cloudinary.com/ddi0g76bk/image/upload/v1768210430/Neumaticos_llantas_sktjri.webp' WHERE slug='neumaticos-llantas';

UPDATE categorias SET imagen = 'https://res.cloudinary.com/ddi0g76bk/image/upload/v1768210429/frenos_qrke4a.webp' WHERE slug='frenos';

UPDATE categorias SET imagen = 'https://res.cloudinary.com/ddi0g76bk/image/upload/v1768210429/motor_smgtha.webp' WHERE slug='motor';

UPDATE categorias SET imagen = 'https://res.cloudinary.com/ddi0g76bk/image/upload/v1768210429/filtros_fixdmp.webp' WHERE slug='filtros';

UPDATE categorias SET imagen = 'https://res.cloudinary.com/ddi0g76bk/image/upload/v1768210430/amortiguacion_ir7tkx.webp' WHERE slug='amortiguacion';

UPDATE categorias SET imagen = 'https://res.cloudinary.com/ddi0g76bk/image/upload/v1768210430/embrague_gavg3a.webp' WHERE slug='embrague';

UPDATE categorias SET imagen = 'https://res.cloudinary.com/ddi0g76bk/image/upload/v1768210429/aceites_bsoori.webp' WHERE slug='aceites-liquidos';

UPDATE categorias SET imagen = 'https://res.cloudinary.com/ddi0g76bk/image/upload/v1768210429/correas_qvwo8v.webp' WHERE slug='correas-cadenas';

UPDATE categorias SET imagen = 'https://res.cloudinary.com/ddi0g76bk/image/upload/v1768210430/carroceria_qmxk5s.webp' WHERE slug='carroceria';

UPDATE categorias SET imagen = 'https://res.cloudinary.com/ddi0g76bk/image/upload/v1768210430/electrico_vnzt8w.webp' WHERE slug='sistema-electrico';

UPDATE categorias SET imagen = 'https://res.cloudinary.com/ddi0g76bk/image/upload/v1768210430/suspension_wjifsz.webp' WHERE slug='suspension';

UPDATE categorias SET imagen = 'https://res.cloudinary.com/ddi0g76bk/image/upload/v1768210430/otras_i1sjq8.webp' WHERE slug='otras-categorias';

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Ejecuta esta query para verificar:
-- SELECT id, nombre, slug, imagen FROM categorias ORDER BY orden;
