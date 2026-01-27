-- Script para verificar y corregir TODOS los precios inconsistentes
-- Lógica: precios >= 1000 están en céntimos, precios < 1000 están en euros

-- Primero, ver todos los precios para validar
SELECT id, nombre, precio,
  CASE 
    WHEN precio >= 1000 THEN (precio / 100.0)::TEXT || ' € (céntimos)'
    WHEN precio < 1000 THEN precio::TEXT || ' € (euros - INCORRECTO)'
  END as precio_actual
FROM productos
ORDER BY precio DESC;

-- Luego ejecutar estas correcciones:
-- Multiplicar por 100 a todos los precios < 1000 (que están en euros y deberían estar en céntimos)
UPDATE productos
SET precio = ROUND(precio * 100)
WHERE precio < 1000 AND precio > 0;

-- Verificar después
SELECT id, nombre, precio, precio / 100.0 as precio_euros
FROM productos
ORDER BY nombre;
