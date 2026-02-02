-- ============================================================================
-- MIGRACIÓN: HABILITAR CONFIGURACIÓN DE USO ÚNICO POR USUARIO
-- ============================================================================

-- 1. Agregar columna a la tabla cupones
ALTER TABLE cupones 
ADD COLUMN IF NOT EXISTS uso_unico_por_usuario BOOLEAN DEFAULT TRUE;

-- 2. Actualizar la función validar_cupon para respetar esta configuración
CREATE OR REPLACE FUNCTION validar_cupon(
  p_codigo TEXT,
  p_usuario_id UUID,
  p_subtotal DECIMAL
)
RETURNS TABLE(
  cupon_id UUID,
  valido BOOLEAN,
  descuento_calculado DECIMAL,
  descripcion TEXT,
  mensaje TEXT
) AS $$
DECLARE
  v_cupon RECORD;
  v_uso_previo INT;
  v_descuento DECIMAL;
BEGIN
  -- Buscar cupón incluyendo la nueva columna
  SELECT c.id, c.codigo, c.descripcion, c.tipo_descuento, c.valor_descuento, 
         c.cantidad_minima_compra, c.limite_usos, c.usos_totales, 
         c.fecha_inicio, c.fecha_expiracion, c.activo, c.uso_unico_por_usuario
  INTO v_cupon
  FROM cupones c
  WHERE UPPER(c.codigo) = UPPER(p_codigo);
  
  -- Validar existencia
  IF v_cupon IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, false, 0::DECIMAL, ''::TEXT, 'Cupón no encontrado'::TEXT;
    RETURN;
  END IF;
  
  -- Validar que esté activo
  IF NOT v_cupon.activo THEN
    RETURN QUERY SELECT v_cupon.id, false, 0::DECIMAL, v_cupon.descripcion, 'Este cupón no está activo'::TEXT;
    RETURN;
  END IF;
  
  -- Validar fechas
  IF NOW() < v_cupon.fecha_inicio THEN
    RETURN QUERY SELECT v_cupon.id, false, 0::DECIMAL, v_cupon.descripcion, 'Este cupón aún no está vigente'::TEXT;
    RETURN;
  END IF;
  
  IF NOW() > v_cupon.fecha_expiracion THEN
    RETURN QUERY SELECT v_cupon.id, false, 0::DECIMAL, v_cupon.descripcion, 'Este cupón ha expirado'::TEXT;
    RETURN;
  END IF;
  
  -- Validar cantidad máxima de usos globales
  IF v_cupon.limite_usos IS NOT NULL AND v_cupon.usos_totales >= v_cupon.limite_usos THEN
    RETURN QUERY SELECT v_cupon.id, false, 0::DECIMAL, v_cupon.descripcion, 'Este cupón ha alcanzado el límite de usos'::TEXT;
    RETURN;
  END IF;
  
  -- Validar uso previo por usuario (SOLO SI ESTÁ ACTIVADO)
  IF p_usuario_id IS NOT NULL AND v_cupon.uso_unico_por_usuario THEN
    SELECT COUNT(*) INTO v_uso_previo
    FROM cupones_uso cu
    WHERE cu.cupon_id = v_cupon.id AND cu.usuario_id = p_usuario_id;
    
    IF v_uso_previo > 0 THEN
      RETURN QUERY SELECT v_cupon.id, false, 0::DECIMAL, v_cupon.descripcion, 'Ya has usado este cupón anteriormente'::TEXT;
      RETURN;
    END IF;
  END IF;
  
  -- Validar mínimo de compra
  IF v_cupon.cantidad_minima_compra IS NOT NULL AND p_subtotal < v_cupon.cantidad_minima_compra THEN
    RETURN QUERY SELECT v_cupon.id, false, 0::DECIMAL, v_cupon.descripcion,
      ('Compra mínima requerida: ' || v_cupon.cantidad_minima_compra || '€')::TEXT;
    RETURN;
  END IF;
  
  -- Calcular descuento
  IF v_cupon.tipo_descuento = 'porcentaje' THEN
    v_descuento := ROUND((p_subtotal * v_cupon.valor_descuento / 100), 2);
  ELSE -- cantidad_fija
    v_descuento := LEAST(v_cupon.valor_descuento, p_subtotal);
  END IF;
  
  RETURN QUERY SELECT v_cupon.id, true, v_descuento, v_cupon.descripcion,
    ('Descuento de ' || v_descuento || '€ aplicado')::TEXT;
END;
$$ LANGUAGE plpgsql;
