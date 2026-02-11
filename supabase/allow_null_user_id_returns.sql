-- ============================================================================
-- PERMITIR USUARIO_ID NULO EN SOLICITUDES DE DEVOLUCIÓN
-- Ejecutar en SQL Editor de Supabase
-- ============================================================================

-- La tabla solicitudes_devolucion tiene usuario_id como NOT NULL por defecto.
-- Para permitir devoluciones de invitados (que no tienen usuario_id), debemos quitar esta restricción.

ALTER TABLE public.solicitudes_devolucion 
ALTER COLUMN usuario_id DROP NOT NULL;
