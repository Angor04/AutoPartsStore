-- ============================================================================
-- RESTAURAR PRECIOS CON OFERTAS ACTIVAS
-- Ejecutar en Supabase SQL Editor
-- ============================================================================
-- precio_original = precio alto (antes)
-- precio = precio rebajado (actual)
-- ============================================================================

UPDATE productos SET precio = 89.99, precio_original = 119.99 WHERE nombre = 'Neumático Michelin Pilot Sport 205/55R16';
UPDATE productos SET precio = 65.50, precio_original = 89.99 WHERE nombre = 'Neumático Continental EcoContact 215/60R16';
UPDATE productos SET precio = 150.00, precio_original = 200.00 WHERE nombre = 'Llanta de Aluminio OZ Racing 18 pulgadas';
UPDATE productos SET precio = 72.99, precio_original = 99.99 WHERE nombre = 'Neumático Pirelli Winter Sottozero 195/65R15';
UPDATE productos SET precio = 45.50, precio_original = 65.00 WHERE nombre = 'Pastillas de Freno Brembo Cerámicas 370mm';
UPDATE productos SET precio = 89.99, precio_original = 125.00 WHERE nombre = 'Discos de Freno Zimmermann 330mm';
UPDATE productos SET precio = 12.99, precio_original = 19.99 WHERE nombre = 'Líquido de Frenos DOT 4 Motul';
UPDATE productos SET precio = 120.00, precio_original = 180.00 WHERE nombre = 'Cilindro Maestro de Freno TRW';
UPDATE productos SET precio = 18.50, precio_original = 28.00 WHERE nombre = 'Filtro de Aire Premium Bosch';
UPDATE productos SET precio = 8.99, precio_original = 14.99 WHERE nombre = 'Bujías NGK Iridium';
UPDATE productos SET precio = 22.50, precio_original = 35.00 WHERE nombre = 'Cable de Batería Profesional 4AWG';
UPDATE productos SET precio = 65.00, precio_original = 95.00 WHERE nombre = 'Correa de Distribución Gates';
UPDATE productos SET precio = 24.99, precio_original = 39.99 WHERE nombre = 'Filtro de Habitáculo Bosch Carbón Activado';
UPDATE productos SET precio = 9.99, precio_original = 16.99 WHERE nombre = 'Filtro de Aceite Mann Filter';
UPDATE productos SET precio = 15.50, precio_original = 24.99 WHERE nombre = 'Filtro de Combustible Mahle';
UPDATE productos SET precio = 45.00, precio_original = 65.00 WHERE nombre = 'Juego de Filtros Completo (Aire, Aceite, Habitáculo)';
UPDATE productos SET precio = 78.99, precio_original = 110.00 WHERE nombre = 'Amortiguador Delantero KYB Gas-Adjust';
UPDATE productos SET precio = 72.50, precio_original = 100.00 WHERE nombre = 'Amortiguador Trasero Bilstein B4';
UPDATE productos SET precio = 150.00, precio_original = 220.00 WHERE nombre = 'Kit Muelles de Suspensión Lowering';
UPDATE productos SET precio = 45.00, precio_original = 70.00 WHERE nombre = 'Barra Estabilizadora Delantera';
UPDATE productos SET precio = 89.50, precio_original = 130.00 WHERE nombre = 'Disco de Embrague Valeo Original';
UPDATE productos SET precio = 95.00, precio_original = 140.00 WHERE nombre = 'Plato de Presión Luk Premium';
UPDATE productos SET precio = 55.00, precio_original = 85.00 WHERE nombre = 'Cilindro Esclavo de Embrague Sachs';
UPDATE productos SET precio = 28.50, precio_original = 45.00 WHERE nombre = 'Cable de Embrague Profesional';
UPDATE productos SET precio = 32.99, precio_original = 49.99 WHERE nombre = 'Aceite de Motor Castrol Edge 5W-40';
UPDATE productos SET precio = 15.99, precio_original = 24.99 WHERE nombre = 'Líquido Refrigerante BASF Pentosin';
UPDATE productos SET precio = 18.50, precio_original = 28.00 WHERE nombre = 'Aceite de Dirección Asistida Mobil';
UPDATE productos SET precio = 22.50, precio_original = 35.00 WHERE nombre = 'Fluido de Transmisión Automática Castrol';
UPDATE productos SET precio = 68.00, precio_original = 98.00 WHERE nombre = 'Correa de Distribución Gates de Calidad Premium';
UPDATE productos SET precio = 35.50, precio_original = 55.00 WHERE nombre = 'Rodillo Tensor de Correa SKF';
UPDATE productos SET precio = 120.00, precio_original = 180.00 WHERE nombre = 'Cadena de Distribución Dayco';
UPDATE productos SET precio = 28.00, precio_original = 45.00 WHERE nombre = 'Correa de Accesorios Serpentina';
UPDATE productos SET precio = 55.00, precio_original = 85.00 WHERE nombre = 'Espejo Retrovisor Izquierdo Elemental';
UPDATE productos SET precio = 42.50, precio_original = 70.00 WHERE nombre = 'Panel de Faro Frontal Compatible';
UPDATE productos SET precio = 14.99, precio_original = 24.99 WHERE nombre = 'Sellador de Carrocería 500ml';
UPDATE productos SET precio = 19.50, precio_original = 32.00 WHERE nombre = 'Protector de Parachoques Goma';
UPDATE productos SET precio = 145.00, precio_original = 199.99 WHERE nombre = 'Batería de Coche 12V 80Ah Bosch S5';
UPDATE productos SET precio = 189.99, precio_original = 280.00 WHERE nombre = 'Alternador 120A Bosch';
UPDATE productos SET precio = 125.00, precio_original = 185.00 WHERE nombre = 'Motor de Arranque Profesional';
UPDATE productos SET precio = 16.50, precio_original = 27.00 WHERE nombre = 'Conector de Batería Cobre Puro';
UPDATE productos SET precio = 38.50, precio_original = 62.00 WHERE nombre = 'Rótula de Dirección Lemförder';
UPDATE productos SET precio = 22.99, precio_original = 38.00 WHERE nombre = 'Bieleta Estabilizadora Delantera';
UPDATE productos SET precio = 34.99, precio_original = 55.00 WHERE nombre = 'Rodamiento de Rueda SKF';
UPDATE productos SET precio = 89.50, precio_original = 135.00 WHERE nombre = 'Brazos de Control de Suspensión (par)';
UPDATE productos SET precio = 35.99, precio_original = 55.00 WHERE nombre = 'Mantenedor de Batería Inteligente 2A';
UPDATE productos SET precio = 45.00, precio_original = 69.99 WHERE nombre = 'Compresor de Aire Portátil 12V';
UPDATE productos SET precio = 58.50, precio_original = 89.99 WHERE nombre = 'Kit de Herramientas Básicas 39 piezas';
UPDATE productos SET precio = 12.50, precio_original = 19.99 WHERE nombre = 'Limpiador de Inyectores Gasolina';

-- Verificar resultado
SELECT nombre, precio, precio_original FROM productos ORDER BY id LIMIT 10;
