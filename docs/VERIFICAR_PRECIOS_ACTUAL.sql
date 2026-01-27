-- Ver los precios actuales para los productos específicos
SELECT id, nombre, precio, precio / 100.0 as precio_euros
FROM productos
WHERE nombre IN ('Cilindro Maestro de Freno TRW', 'Filtro de Aceite Mann Filter')
ORDER BY nombre;

-- Ver TODOS los precios para identificar inconsistencias
SELECT id, nombre, precio, 
  CASE 
    WHEN precio >= 1000 THEN 'Céntimos: ' || precio
    WHEN precio < 1000 THEN 'Euros (INCORRECTO): ' || precio
  END as tipo_precio
FROM productos
ORDER BY precio DESC;
