-- ============================================================================
-- VERSIÓN DEPURACIÓN: EXPOSICIÓN DE ERRORES EN APLICAR_CUPÓN
-- ============================================================================

CREATE OR REPLACE FUNCTION public.aplicar_cupon(
  p_cupon_id UUID,
  p_usuario_id UUID,
  p_orden_id UUID,
  p_descuento DECIMAL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- 1. Intentar registrar uso
  -- Nota: Hemos quitado el bloque EXCEPTION para que el error real suba al cliente
  INSERT INTO public.cupones_uso (cupon_id, usuario_id, orden_id, descuento_aplicado)
  VALUES (p_cupon_id, p_usuario_id, p_orden_id, p_descuento);
  
  -- 2. Incrementar contador de usos globale
  UPDATE public.cupones
  SET usos_totales = COALESCE(usos_totales, 0) + 1,
      actualizado_en = NOW()
  WHERE id = p_cupon_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;
