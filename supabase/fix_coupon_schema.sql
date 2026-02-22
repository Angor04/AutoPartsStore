-- ============================================================================
-- FIX: SINCRONIZACIÓN DE ESQUEMA PARA USO DE CUPONES (V4 - Con DROP FUNCTION)
-- ============================================================================

-- IMPORTANTE: Borrar las funciones existentes para permitir el cambio de nombres de columnas de salida
DROP FUNCTION IF EXISTS public.validar_cupon(text, uuid, numeric);
DROP FUNCTION IF EXISTS public.aplicar_cupon(uuid, uuid, uuid, numeric);

-- 1. Actualizar función validar_cupon con prefijos 'o_'
CREATE OR REPLACE FUNCTION public.validar_cupon(
  p_codigo TEXT,
  p_usuario_id UUID,
  p_subtotal DECIMAL
)
RETURNS TABLE(
  o_cupon_id UUID,
  o_valido BOOLEAN,
  o_descuento_calculado DECIMAL,
  o_descripcion TEXT,
  o_mensaje TEXT
) AS $$
DECLARE
  v_cupon RECORD;
  v_uso_previo INT;
  v_descuento DECIMAL;
BEGIN
  -- Buscar el cupón en la tabla principal
  SELECT c.id, c.codigo, c.descripcion, c.tipo_descuento, c.valor_descuento, 
         c.cantidad_minima_compra, c.limite_usos, c.usos_totales, 
         c.fecha_inicio, c.fecha_expiracion, c.activo, c.uso_unico_por_usuario
  INTO v_cupon
  FROM public.cupones c
  WHERE UPPER(c.codigo) = UPPER(p_codigo);
  
  -- Validaciones básicas
  IF v_cupon IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, false, 0::DECIMAL, ''::TEXT, 'Cupón no encontrado'::TEXT;
    RETURN;
  END IF;
  
  IF NOT v_cupon.activo THEN
    RETURN QUERY SELECT v_cupon.id, false, 0::DECIMAL, v_cupon.descripcion, 'Este cupón no está activo'::TEXT;
    RETURN;
  END IF;
  
  IF NOW() < v_cupon.fecha_inicio THEN
    RETURN QUERY SELECT v_cupon.id, false, 0::DECIMAL, v_cupon.descripcion, 'Este cupón aún no está vigente'::TEXT;
    RETURN;
  END IF;
  
  IF NOW() > v_cupon.fecha_expiracion THEN
    RETURN QUERY SELECT v_cupon.id, false, 0::DECIMAL, v_cupon.descripcion, 'Este cupón ha expirado'::TEXT;
    RETURN;
  END IF;
  
  IF v_cupon.limite_usos IS NOT NULL AND v_cupon.usos_totales >= v_cupon.limite_usos THEN
    RETURN QUERY SELECT v_cupon.id, false, 0::DECIMAL, v_cupon.descripcion, 'Este cupón ha alcanzado el límite de usos'::TEXT;
    RETURN;
  END IF;
  
  -- VALIDACIÓN DE USO ÚNICO: Sin ambigüedad al usar p_usuario_id y v_cupon.id
  IF p_usuario_id IS NOT NULL AND v_cupon.uso_unico_por_usuario THEN
    SELECT COUNT(*) INTO v_uso_previo
    FROM public.cupones_usados
    WHERE cupon_id = v_cupon.id AND usuario_id = p_usuario_id;
    
    IF v_uso_previo > 0 THEN
      RETURN QUERY SELECT v_cupon.id, false, 0::DECIMAL, v_cupon.descripcion, 'Ya has usado este cupón anteriormente'::TEXT;
      RETURN;
    END IF;
  END IF;
  
  -- Validar compra mínima
  IF v_cupon.cantidad_minima_compra IS NOT NULL AND p_subtotal < v_cupon.cantidad_minima_compra THEN
    RETURN QUERY SELECT v_cupon.id, false, 0::DECIMAL, v_cupon.descripcion,
      ('Compra mínima requerida: ' || v_cupon.cantidad_minima_compra || '€')::TEXT;
    RETURN;
  END IF;
  
  -- Calcular descuento
  IF v_cupon.tipo_descuento = 'porcentaje' THEN
    v_descuento := ROUND((p_subtotal * v_cupon.valor_descuento / 100), 2);
  ELSE
    v_descuento := LEAST(v_cupon.valor_descuento, p_subtotal);
  END IF;
  
  -- Retornar éxito
  RETURN QUERY SELECT v_cupon.id, true, v_descuento, v_cupon.descripcion,
    ('Descuento de ' || v_descuento || '€ aplicado')::TEXT;
END;
$$ LANGUAGE plpgsql;

-- 2. Asegurar que cupones_usados tiene default para el ID si es UUID
-- (Esto evita errores si se inserta sin ID)
ALTER TABLE IF EXISTS public.cupones_usados 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Actualizar función aplicar_cupon
CREATE OR REPLACE FUNCTION public.aplicar_cupon(
  p_cupon_id UUID,
  p_usuario_id UUID,
  p_orden_id UUID,
  p_descuento DECIMAL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Insertar en 'cupones_usados'
  INSERT INTO public.cupones_usados (cupon_id, usuario_id, pedido_id, valor_aplicado)
  VALUES (p_cupon_id, p_usuario_id, p_orden_id, p_descuento);
  
  -- Incrementar contador de usos globales
  UPDATE public.cupones
  SET usos_totales = COALESCE(usos_totales, 0) + 1,
      actualizado_en = NOW()
  WHERE id = p_cupon_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;
