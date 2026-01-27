-- Limpiar el carrito temporal del usuario actual
-- El usuario_id es: 2ce32a26-b4e6-4a93-89d6-4e1562882f47

DELETE FROM carrito_temporal
WHERE usuario_id = '2ce32a26-b4e6-4a93-89d6-4e1562882f47';

-- Verificar que se eliminó
SELECT COUNT(*) as items_en_carrito
FROM carrito_temporal
WHERE usuario_id = '2ce32a26-b4e6-4a93-89d6-4e1562882f47';
