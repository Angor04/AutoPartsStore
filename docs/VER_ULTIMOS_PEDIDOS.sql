-- Ver el último pedido creado
SELECT 
  id, 
  numero_orden, 
  usuario_id, 
  email_cliente, 
  total, 
  estado, 
  created_at,
  session_stripe_id
FROM ordenes
ORDER BY created_at DESC
LIMIT 5;
