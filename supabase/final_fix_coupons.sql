-- ============================================================================
-- FINAL FIX: LIMPIEZA DE DUPLICADOS Y SINCRONIZACIÓN TOTAL DE CUPONES
-- ============================================================================

-- 1. Permitir que usuario_id sea nulo en cupones_uso (para compras de invitados)
ALTER TABLE public.cupones_uso ALTER COLUMN usuario_id DROP NOT NULL;

-- 2. Eliminar cupones BIENVENIDO10 duplicados (Dejar solo el más reciente)
DELETE FROM public.cupones 
WHERE UPPER(codigo) = 'BIENVENIDO10' 
AND id NOT IN (
    SELECT id FROM public.cupones 
    WHERE UPPER(codigo) = 'BIENVENIDO10' 
    ORDER BY creado_en DESC 
    LIMIT 1
);

-- 2. Borrar funciones antiguas para evitar conflictos de firmas
DROP FUNCTION IF EXISTS public.validar_cupon(text, uuid, numeric);
DROP FUNCTION IF EXISTS public.aplicar_cupon(uuid, uuid, uuid, numeric);

-- 3. Crear función de validación definitiva con prefijos CLAROS o_
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
  -- Buscar el cupón (usamos LIMIT 1 por seguridad pero ya limpiamos duplicados)
  SELECT * INTO v_cupon
  FROM public.cupones
  WHERE UPPER(codigo) = UPPER(p_codigo)
  LIMIT 1;
  
  -- 1. Validar existencia
  IF v_cupon IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, false, 0::DECIMAL, ''::TEXT, 'Cupón no encontrado'::TEXT;
    RETURN;
  END IF;
  
  -- 2. Validar que esté activo
  IF NOT v_cupon.activo THEN
    RETURN QUERY SELECT v_cupon.id, false, 0::DECIMAL, v_cupon.descripcion, 'Este cupón no está activo'::TEXT;
    RETURN;
  END IF;
  
  -- 3. Validar fechas
  IF NOW() < v_cupon.fecha_inicio THEN
    RETURN QUERY SELECT v_cupon.id, false, 0::DECIMAL, v_cupon.descripcion, 'Este cupón aún no está vigente'::TEXT;
    RETURN;
  END IF;
  
  IF NOW() > v_cupon.fecha_expiracion THEN
    RETURN QUERY SELECT v_cupon.id, false, 0::DECIMAL, v_cupon.descripcion, 'Este cupón ha expirado'::TEXT;
    RETURN;
  END IF;
  
  -- 4. Validar límite global
  IF v_cupon.limite_usos IS NOT NULL AND v_cupon.usos_totales >= v_cupon.limite_usos THEN
    RETURN QUERY SELECT v_cupon.id, false, 0::DECIMAL, v_cupon.descripcion, 'Se ha alcanzado el límite global de este cupón'::TEXT;
    RETURN;
  END IF;
  
  -- 5. Validar uso único por usuario
  IF p_usuario_id IS NOT NULL AND v_cupon.uso_unico_por_usuario THEN
    SELECT COUNT(*) INTO v_uso_previo
    FROM public.cupones_uso
    WHERE cupon_id = v_cupon.id AND usuario_id = p_usuario_id;
    
    IF v_uso_previo > 0 THEN
      RETURN QUERY SELECT v_cupon.id, false, 0::DECIMAL, v_cupon.descripcion, 'Ya has usado este cupón anteriormente'::TEXT;
      RETURN;
    END IF;
  END IF;
  
  -- 6. Validar mínimo de compra
  IF v_cupon.cantidad_minima_compra IS NOT NULL AND p_subtotal < v_cupon.cantidad_minima_compra THEN
    RETURN QUERY SELECT v_cupon.id, false, 0::DECIMAL, v_cupon.descripcion,
      ('Compra mínima requerida: ' || v_cupon.cantidad_minima_compra || '€')::TEXT;
    RETURN;
  END IF;
  
  -- 7. Calcular descuento
  IF v_cupon.tipo_descuento = 'porcentaje' THEN
    v_descuento := ROUND((p_subtotal * v_cupon.valor_descuento / 100), 2);
  ELSE
    v_descuento := LEAST(v_cupon.valor_descuento, p_subtotal);
  END IF;
  
  RETURN QUERY SELECT v_cupon.id, true, v_descuento, v_cupon.descripcion,
    ('Descuento de ' || v_descuento || '€ aplicado')::TEXT;
END;
$$ LANGUAGE plpgsql;

-- 4. Crear función para aplicar definitiva
CREATE OR REPLACE FUNCTION public.aplicar_cupon(
  p_cupon_id UUID,
  p_usuario_id UUID,
  p_orden_id UUID,
  p_descuento DECIMAL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Insertar registro de uso
  INSERT INTO public.cupones_uso (cupon_id, usuario_id, orden_id, descuento_aplicado)
  VALUES (p_cupon_id, p_usuario_id, p_orden_id, p_descuento);
  
  -- Incrementar contador global
  UPDATE public.cupones
  SET usos_totales = COALESCE(usos_totales, 0) + 1,
      actualizado_en = NOW()
  WHERE id = p_cupon_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;
