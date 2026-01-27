-- Corregir precios inconsistentes en la tabla productos
-- Algunos precios están en euros (ej: 120) cuando deberían estar en céntimos (12000)
-- La lógica es: si precio <= 1000, está en euros y debe multiplicarse por 100

-- Actualizar Cilindro Maestro de Freno TRW: 120 € → 12000 céntimos
UPDATE productos
SET precio = 12000
WHERE nombre = 'Cilindro Maestro de Freno TRW' AND precio = 120;

-- Actualizar Filtro de Aceite Mann Filter: 9,99 € → 999 céntimos
UPDATE productos
SET precio = 999
WHERE nombre = 'Filtro de Aceite Mann Filter' AND precio = 9.99;

-- Verificar precios después de la actualización
SELECT id, nombre, precio, precio / 100.0 as precio_euros
FROM productos
WHERE nombre IN ('Cilindro Maestro de Freno TRW', 'Filtro de Aceite Mann Filter')
ORDER BY nombre;
