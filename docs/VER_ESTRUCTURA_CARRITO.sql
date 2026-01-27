-- Ver la estructura de la tabla carrito_temporal
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'carrito_temporal'
ORDER BY ordinal_position;

-- También ver algunos registros para entender la estructura
SELECT * FROM carrito_temporal LIMIT 5;
