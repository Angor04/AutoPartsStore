-- Permitir usuario_id NULL para pedidos de clientes anónimos/invitados
ALTER TABLE ordenes
ALTER COLUMN usuario_id DROP NOT NULL;

-- Verificar cambio
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'ordenes' AND column_name = 'usuario_id';
