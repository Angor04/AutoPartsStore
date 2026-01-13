-- ============================================================================
-- AutoPartsStore - DATOS DE PRUEBA
-- ============================================================================
-- Productos de ejemplo para la tienda de recambios de coches
-- Fecha: 11 de enero de 2026
-- ============================================================================

-- ============================================================================
-- LIMPIAR DATOS ANTERIORES Y RESETEAR SECUENCIAS
-- ============================================================================
DELETE FROM productos; -- Eliminar productos primero (por FK)
DELETE FROM categorias; -- Luego eliminar categorías
ALTER SEQUENCE categorias_id_seq RESTART WITH 1;
ALTER SEQUENCE productos_id_seq RESTART WITH 1;

-- ============================================================================
-- CATEGORÍAS (Inserta primero las categorías)
-- ============================================================================
INSERT INTO categorias (nombre, slug, descripcion, orden, activa) VALUES
('Neumáticos y llantas', 'neumaticos-llantas', 'Neumáticos de todas las marcas y llantas de aluminio', 1, true),
('Frenos', 'frenos', 'Pastillas, discos y componentes de freno', 2, true),
('Motor', 'motor', 'Filtros, bujías y componentes del motor', 3, true),
('Filtros', 'filtros', 'Filtros de aire, aceite y combustible', 4, true),
('Amortiguación', 'amortiguacion', 'Amortiguadores, muelles y barras estabilizadoras', 5, true),
('Embrague', 'embrague', 'Discos, platos y componentes del embrague', 6, true),
('Aceites y líquidos', 'aceites-liquidos', 'Aceites de motor, refrigerante y otros líquidos', 7, true),
('Correas, cadenas, rodillos', 'correas-cadenas', 'Correas de distribución, cadenas y rodillos', 8, true),
('Carrocería', 'carroceria', 'Espejos, faros, piezas de carrocería', 9, true),
('Sistema eléctrico', 'sistema-electrico', 'Batería, alternador, motor de arranque', 10, true),
('Suspensión', 'suspension', 'Rótulas, bieletas, rodamientos, brazos de control', 11, true),
('Otras categorías', 'otras-categorias', 'Herramientas, accesorios y otros productos', 12, true);

-- ============================================================================
-- PRODUCTOS: NEUMÁTICOS Y LLANTAS
-- ============================================================================
INSERT INTO productos (nombre, descripcion, precio, precio_original, categoria_id, stock, sku, marca, modelo_compatible, destacado, activo) VALUES
('Neumático Michelin Pilot Sport 205/55R16', 'Neumático de alto rendimiento para conducción deportiva. Excelente agarre en seco y mojado.', 8999, 11999, (SELECT id FROM categorias WHERE slug='neumaticos-llantas' LIMIT 1), 25, 'NEU-MIC-001', 'Michelin', 'Universal', true, true),
('Neumático Continental EcoContact 215/60R16', 'Neumático económico con buen drenaje de agua. Ideal para lluvia.', 6550, 8999, (SELECT id FROM categorias WHERE slug='neumaticos-llantas' LIMIT 1), 30, 'NEU-CON-001', 'Continental', 'Universal', true, true),
('Llanta de Aluminio OZ Racing 18 pulgadas', 'Llanta ligera de aluminio con diseño moderno. Mejora la estética del vehículo.', 15000, 20000, (SELECT id FROM categorias WHERE slug='neumaticos-llantas' LIMIT 1), 12, 'LLA-OZ-001', 'OZ Racing', 'Universal', false, true),
('Neumático Pirelli Winter Sottozero 195/65R15', 'Neumático de invierno con excelente tracción en nieve.', 7299, 9999, (SELECT id FROM categorias WHERE slug='neumaticos-llantas' LIMIT 1), 20, 'NEU-PIR-001', 'Pirelli', 'Universal', false, true),

-- ============================================================================
-- PRODUCTOS: FRENOS
-- ============================================================================
('Pastillas de Freno Brembo Cerámicas 370mm', 'Pastillas de freno cerámicas de alto rendimiento. Menor desgaste del disco.', 4550, 6500, (SELECT id FROM categorias WHERE slug='frenos' LIMIT 1), 40, 'FRE-BRE-001', 'Brembo', 'Universal', true, true),
('Discos de Freno Zimmermann 330mm', 'Discos de freno ventilados para mejor disipación de calor.', 8999, 12500, (SELECT id FROM categorias WHERE slug='frenos' LIMIT 1), 18, 'FRE-ZIM-001', 'Zimmermann', 'Universal', true, true),
('Líquido de Frenos DOT 4 Motul', 'Líquido de frenos sintético con punto de ebullición alto.', 1299, 1999, (SELECT id FROM categorias WHERE slug='frenos' LIMIT 1), 50, 'FRE-MOT-001', 'Motul', 'Universal', false, true),
('Cilindro Maestro de Freno TRW', 'Cilindro maestro de freno hidráulico. Componente crítico del sistema de frenado.', 12000, 18000, (SELECT id FROM categorias WHERE slug='frenos' LIMIT 1), 8, 'FRE-TRW-001', 'TRW', 'Universal', false, true),

-- ============================================================================
-- PRODUCTOS: MOTOR
-- ============================================================================
('Filtro de Aire Premium Bosch', 'Filtro de aire de alta eficiencia. Mejora el rendimiento del motor.', 1850, 2800, (SELECT id FROM categorias WHERE slug='motor' LIMIT 1), 60, 'MOT-BOS-001', 'Bosch', 'Universal', true, true),
('Bujías NGK Iridium', 'Bujías de iridio de larga duración. Mejor encendido y consumo de combustible.', 899, 1499, (SELECT id FROM categorias WHERE slug='motor' LIMIT 1), 100, 'MOT-NGK-001', 'NGK', 'Universal', true, true),
('Cable de Batería Profesional 4AWG', 'Cable de batería de cobre puro con conectores dorados.', 2250, 3500, (SELECT id FROM categorias WHERE slug='motor' LIMIT 1), 25, 'MOT-CAB-001', 'Profesional', 'Universal', false, true),
('Correa de Distribución Gates', 'Correa de distribución de larga duración. Componente crítico del motor.', 6500, 9500, (SELECT id FROM categorias WHERE slug='motor' LIMIT 1), 10, 'MOT-GAT-001', 'Gates', 'Universal', false, true),

-- ============================================================================
-- PRODUCTOS: FILTROS
-- ============================================================================
('Filtro de Habitáculo Bosch Carbón Activado', 'Filtro de cabina con carbón activado. Elimina olores y partículas.', 2499, 3999, (SELECT id FROM categorias WHERE slug='filtros' LIMIT 1), 35, 'FIL-BOS-001', 'Bosch', 'Universal', true, true),
('Filtro de Aceite Mann Filter', 'Filtro de aceite de alta calidad. Protege el motor.', 999, 1699, (SELECT id FROM categorias WHERE slug='filtros' LIMIT 1), 80, 'FIL-MAN-001', 'Mann Filter', 'Universal', true, true),
('Filtro de Combustible Mahle', 'Filtro de combustible para máxima protección del motor.', 1550, 2499, (SELECT id FROM categorias WHERE slug='filtros' LIMIT 1), 45, 'FIL-MAH-001', 'Mahle', 'Universal', false, true),
('Juego de Filtros Completo (Aire, Aceite, Habitáculo)', 'Paquete de 3 filtros esenciales. Mantenimiento completo del coche.', 4500, 6500, (SELECT id FROM categorias WHERE slug='filtros' LIMIT 1), 20, 'FIL-JUE-001', 'Varios', 'Universal', false, true),

-- ============================================================================
-- PRODUCTOS: AMORTIGUACIÓN
-- ============================================================================
('Amortiguador Delantero KYB Gas-Adjust', 'Amortiguador con tecnología de gas. Mejora la estabilidad y confort.', 7899, 11000, (SELECT id FROM categorias WHERE slug='amortiguacion' LIMIT 1), 16, 'AMO-KYB-001', 'KYB', 'Universal', true, true),
('Amortiguador Trasero Bilstein B4', 'Amortiguador trasero de calidad superior. Mejor manejo.', 7250, 10000, (SELECT id FROM categorias WHERE slug='amortiguacion' LIMIT 1), 14, 'AMO-BIL-001', 'Bilstein', 'Universal', true, true),
('Kit Muelles de Suspensión Lowering', 'Kit de muelles para bajar el coche 40mm. Mejora la estética.', 15000, 22000, (SELECT id FROM categorias WHERE slug='amortiguacion' LIMIT 1), 6, 'AMO-KIT-001', 'Profesional', 'Universal', false, true),
('Barra Estabilizadora Delantera', 'Barra estabilizadora para reducir la inclinación en curvas.', 4500, 7000, (SELECT id FROM categorias WHERE slug='amortiguacion' LIMIT 1), 12, 'AMO-BAR-001', 'Profesional', 'Universal', false, true),

-- ============================================================================
-- PRODUCTOS: EMBRAGUE
-- ============================================================================
('Disco de Embrague Valeo Original', 'Disco de embrague original con garantía. Excelente durabilidad.', 8950, 13000, (SELECT id FROM categorias WHERE slug='embrague' LIMIT 1), 8, 'EMB-VAL-001', 'Valeo', 'Universal', true, true),
('Plato de Presión Luk Premium', 'Plato de presión de alta calidad. Importante para el cambio suave.', 9500, 14000, (SELECT id FROM categorias WHERE slug='embrague' LIMIT 1), 7, 'EMB-LUK-001', 'Luk', 'Universal', true, true),
('Cilindro Esclavo de Embrague Sachs', 'Cilindro esclavo hidráulico. Componente de transmisión.', 5500, 8500, (SELECT id FROM categorias WHERE slug='embrague' LIMIT 1), 10, 'EMB-SAC-001', 'Sachs', 'Universal', false, true),
('Cable de Embrague Profesional', 'Cable de embrague resistente y flexible. Fácil instalación.', 2850, 4500, (SELECT id FROM categorias WHERE slug='embrague' LIMIT 1), 18, 'EMB-CAB-001', 'Profesional', 'Universal', false, true),

-- ============================================================================
-- PRODUCTOS: ACEITES Y LÍQUIDOS
-- ============================================================================
('Aceite de Motor Castrol Edge 5W-40', 'Aceite sintético premium de bajo consumo. Excelente protección del motor.', 3299, 4999, (SELECT id FROM categorias WHERE slug='aceites-liquidos' LIMIT 1), 30, 'ACE-CAS-001', 'Castrol', 'Universal', true, true),
('Líquido Refrigerante BASF Pentosin', 'Refrigerante de larga duración. Protege contra congelación y corrosión.', 1599, 2499, (SELECT id FROM categorias WHERE slug='aceites-liquidos' LIMIT 1), 40, 'ACE-BAS-001', 'BASF', 'Universal', true, true),
('Aceite de Dirección Asistida Mobil', 'Aceite de dirección hidráulica de calidad premium.', 1850, 2800, (SELECT id FROM categorias WHERE slug='aceites-liquidos' LIMIT 1), 25, 'ACE-MOB-001', 'Mobil', 'Universal', false, true),
('Fluido de Transmisión Automática Castrol', 'Fluido ATF para transmisiones automáticas. Mejor cambio de marchas.', 2250, 3500, (SELECT id FROM categorias WHERE slug='aceites-liquidos' LIMIT 1), 20, 'ACE-ATF-001', 'Castrol', 'Universal', false, true),

-- ============================================================================
-- PRODUCTOS: CORREAS, CADENAS Y RODILLOS
-- ============================================================================
('Correa de Distribución Gates de Calidad Premium', 'Correa de distribución con mayor durabilidad. Componente crítico.', 6800, 9800, (SELECT id FROM categorias WHERE slug='correas-cadenas' LIMIT 1), 9, 'COR-GAT-001', 'Gates', 'Universal', true, true),
('Rodillo Tensor de Correa SKF', 'Rodillo tensor para optimizar la tensión de la correa.', 3550, 5500, (SELECT id FROM categorias WHERE slug='correas-cadenas' LIMIT 1), 15, 'COR-SKF-001', 'SKF', 'Universal', true, true),
('Cadena de Distribución Dayco', 'Cadena de distribución resistente. Para motores con cadena.', 12000, 18000, (SELECT id FROM categorias WHERE slug='correas-cadenas' LIMIT 1), 5, 'COR-DAY-001', 'Dayco', 'Universal', false, true),
('Correa de Accesorios Serpentina', 'Correa serpentina que acciona alternador y aire acondicionado.', 2800, 4500, (SELECT id FROM categorias WHERE slug='correas-cadenas' LIMIT 1), 20, 'COR-SER-001', 'Profesional', 'Universal', false, true),

-- ============================================================================
-- PRODUCTOS: CARROCERÍA
-- ============================================================================
('Espejo Retrovisor Izquierdo Elemental', 'Espejo retrovisor con vidrio térmico. Fácil reemplazo.', 5500, 8500, (SELECT id FROM categorias WHERE slug='carroceria' LIMIT 1), 12, 'CAR-MIR-001', 'Profesional', 'Universal', true, true),
('Panel de Faro Frontal Compatible', 'Panel de faro con lentes de policarbonato. Buena transparencia.', 4250, 7000, (SELECT id FROM categorias WHERE slug='carroceria' LIMIT 1), 8, 'CAR-FAR-001', 'Compatible', 'Universal', true, true),
('Sellador de Carrocería 500ml', 'Sellador de carrocería para proteger contra la oxidación.', 1499, 2499, (SELECT id FROM categorias WHERE slug='carroceria' LIMIT 1), 35, 'CAR-SEL-001', 'Profesional', 'Universal', false, true),
('Protector de Parachoques Goma', 'Protector de parachoques que absorbe impactos menores.', 1950, 3200, (SELECT id FROM categorias WHERE slug='carroceria' LIMIT 1), 16, 'CAR-PAR-001', 'Profesional', 'Universal', false, true),

-- ============================================================================
-- PRODUCTOS: SISTEMA ELÉCTRICO
-- ============================================================================
('Batería de Coche 12V 80Ah Bosch S5', 'Batería de coche con tecnología AGM. Larga duración y confiabilidad.', 14500, 19999, (SELECT id FROM categorias WHERE slug='sistema-electrico' LIMIT 1), 10, 'ELE-BOS-001', 'Bosch', 'Universal', true, true),
('Alternador 120A Bosch', 'Alternador de calidad para cargar la batería mientras conduces.', 18999, 28000, (SELECT id FROM categorias WHERE slug='sistema-electrico' LIMIT 1), 5, 'ELE-ALT-001', 'Bosch', 'Universal', true, true),
('Motor de Arranque Profesional', 'Motor de arranque de alta potencia. Encendido seguro.', 12500, 18500, (SELECT id FROM categorias WHERE slug='sistema-electrico' LIMIT 1), 7, 'ELE-ARR-001', 'Profesional', 'Universal', false, true),
('Conector de Batería Cobre Puro', 'Conectores de batería de cobre puro con revestimiento. Mejor conducción.', 1650, 2700, (SELECT id FROM categorias WHERE slug='sistema-electrico' LIMIT 1), 30, 'ELE-CON-001', 'Profesional', 'Universal', false, true),

-- ============================================================================
-- PRODUCTOS: SUSPENSIÓN
-- ============================================================================
('Rótula de Dirección Lemförder', 'Rótula de dirección de precisión. Importante para la seguridad.', 3850, 6200, (SELECT id FROM categorias WHERE slug='suspension' LIMIT 1), 14, 'SUS-LEM-001', 'Lemförder', 'Universal', true, true),
('Bieleta Estabilizadora Delantera', 'Bieleta de la barra estabilizadora. Reduce la inclinación.', 2299, 3800, (SELECT id FROM categorias WHERE slug='suspension' LIMIT 1), 20, 'SUS-BIE-001', 'Profesional', 'Universal', true, true),
('Rodamiento de Rueda SKF', 'Rodamiento de rueda de precisión. Baja fricción y ruido.', 3499, 5500, (SELECT id FROM categorias WHERE slug='suspension' LIMIT 1), 18, 'SUS-ROD-001', 'SKF', 'Universal', false, true),
('Brazos de Control de Suspensión (par)', 'Brazos de control delanteros. Mantienen la alineación de la rueda.', 8950, 13500, (SELECT id FROM categorias WHERE slug='suspension' LIMIT 1), 8, 'SUS-BRA-001', 'Profesional', 'Universal', false, true),

-- ============================================================================
-- PRODUCTOS: OTRAS CATEGORÍAS
-- ============================================================================
('Mantenedor de Batería Inteligente 2A', 'Cargador inteligente de batería. Mantiene la batería en perfecto estado.', 3599, 5500, (SELECT id FROM categorias WHERE slug='otras-categorias' LIMIT 1), 15, 'OTR-MAN-001', 'Profesional', 'Universal', true, true),
('Compresor de Aire Portátil 12V', 'Compresor para inflar neumáticos. Práctico y compacto.', 4500, 6999, (SELECT id FROM categorias WHERE slug='otras-categorias' LIMIT 1), 12, 'OTR-COM-001', 'Profesional', 'Universal', true, true),
('Kit de Herramientas Básicas 39 piezas', 'Set de herramientas para mantenimiento básico del coche.', 5850, 8999, (SELECT id FROM categorias WHERE slug='otras-categorias' LIMIT 1), 6, 'OTR-HER-001', 'Profesional', 'Universal', false, true),
('Limpiador de Inyectores Gasolina', 'Limpiador para inyectores de combustible. Mejora el rendimiento.', 1250, 1999, (SELECT id FROM categorias WHERE slug='otras-categorias' LIMIT 1), 25, 'OTR-LIM-001', 'Profesional', 'Universal', false, true);

-- ============================================================================
-- RESUMEN DE DATOS INSERTADOS
-- ============================================================================
/*
Total de productos insertados: 48

Distribución por categoría:
- Neumáticos y llantas: 4 productos
- Frenos: 4 productos
- Motor: 4 productos
- Filtros: 4 productos
- Amortiguación: 4 productos
- Embrague: 4 productos
- Aceites y líquidos: 4 productos
- Correas, cadenas, rodillos: 4 productos
- Carrocería: 4 productos
- Sistema eléctrico: 4 productos
- Suspensión: 4 productos
- Otras categorías: 4 productos

Características destacadas:
✓ Productos variados con precios realistas
✓ Marcas conocidas de autopartes
✓ Descripción útil para cada producto
✓ Precios originales para simular descuentos
✓ Stock variado (5-100 unidades)
✓ SKU único para cada producto
✓ Algunos productos marcados como destacados (8 en total)
✓ Todos los productos activos por defecto

INSTRUCCIONES:
1. Ve a Supabase Dashboard
2. En SQL Editor, ejecuta este script completo
3. Verifica que se insertan los 48 productos
4. Actualiza la página para ver los cambios
*/

-- ============================================================================
-- FIN DE DATOS DE PRUEBA
-- ============================================================================
