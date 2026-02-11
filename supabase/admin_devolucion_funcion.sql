-- ============================================================================
-- ADMIN: GESTIÓN DE DEVOLUCIONES - FUNCIÓN BACKEND
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================================

-- ============================================================================
-- FUNCIÓN: admin_cambiar_estado_devolucion
-- Solo el backend (service_role) puede ejecutar esta función
-- ============================================================================
DROP FUNCTION IF EXISTS public.admin_cambiar_estado_devolucion(uuid, text, text, numeric);

CREATE OR REPLACE FUNCTION public.admin_cambiar_estado_devolucion(
  p_devolucion_id uuid,
  p_nuevo_estado text,
  p_numero_seguimiento text DEFAULT NULL,
  p_monto_reembolso numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_devolucion RECORD;
  v_orden RECORD;
  v_estado_actual text;
  v_estados_validos text[];
  v_resultado jsonb;
BEGIN
  -- ========================================
  -- 1. OBTENER SOLICITUD DE DEVOLUCIÓN ACTUAL
  -- ========================================
  SELECT sd.*, o.numero_orden, o.total AS orden_total, o.email AS orden_email,
         o.session_stripe_id, o.nombre AS orden_nombre, o.id AS fk_orden_id
  INTO v_devolucion
  FROM solicitudes_devolucion sd
  JOIN ordenes o ON o.id = sd.orden_id
  WHERE sd.id = p_devolucion_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Solicitud de devolución no encontrada'
    );
  END IF;

  v_estado_actual := UPPER(COALESCE(v_devolucion.estado, 'SOLICITADA'));

  -- ========================================
  -- 2. VALIDAR FLUJO DE ESTADOS
  -- ========================================
  CASE v_estado_actual
    WHEN 'SOLICITADA' THEN
      v_estados_validos := ARRAY['APROBADA', 'RECHAZADA'];
    WHEN 'APROBADA' THEN
      v_estados_validos := ARRAY['PRODUCTO_RECIBIDO'];
    WHEN 'PRODUCTO_RECIBIDO' THEN
      v_estados_validos := ARRAY['REEMBOLSADA'];
    ELSE
      -- Estado final (RECHAZADA, REEMBOLSADA) - no se puede cambiar
      RETURN jsonb_build_object(
        'success', false,
        'error', format('El estado "%s" es un estado final y no se puede modificar.', v_estado_actual)
      );
  END CASE;

  IF NOT (UPPER(p_nuevo_estado) = ANY(v_estados_validos)) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Transición inválida: %s → %s. Transiciones permitidas: %s', 
                       v_estado_actual, UPPER(p_nuevo_estado), array_to_string(v_estados_validos, ', '))
    );
  END IF;

  -- ========================================
  -- 3. ACTUALIZAR ESTADO Y FECHAS AUTOMÁTICAS
  -- ========================================
  UPDATE solicitudes_devolucion
  SET 
    estado = UPPER(p_nuevo_estado),
    -- Fechas automáticas según el nuevo estado
    fecha_aprobacion = CASE 
      WHEN UPPER(p_nuevo_estado) IN ('APROBADA', 'RECHAZADA') THEN NOW() 
      ELSE fecha_aprobacion 
    END,
    fecha_recepcion = CASE 
      WHEN UPPER(p_nuevo_estado) = 'PRODUCTO_RECIBIDO' THEN NOW() 
      ELSE fecha_recepcion 
    END,
    fecha_reembolso = CASE 
      WHEN UPPER(p_nuevo_estado) = 'REEMBOLSADA' THEN NOW() 
      ELSE fecha_reembolso 
    END,
    -- Datos opcionales
    numero_seguimiento = COALESCE(p_numero_seguimiento, numero_seguimiento),
    monto_reembolso = CASE
      WHEN UPPER(p_nuevo_estado) = 'REEMBOLSADA' AND p_monto_reembolso IS NOT NULL THEN p_monto_reembolso
      WHEN UPPER(p_nuevo_estado) = 'REEMBOLSADA' AND p_monto_reembolso IS NULL THEN v_devolucion.orden_total
      ELSE monto_reembolso
    END,
    actualizado_en = NOW()
  WHERE id = p_devolucion_id;

  -- ========================================
  -- 4. SI ES RECHAZADA, LIMPIAR REFERENCIA EN ORDENES
  -- ========================================
  IF UPPER(p_nuevo_estado) = 'RECHAZADA' THEN
    UPDATE ordenes
    SET solicitud_devolucion_id = NULL, actualizado_en = NOW()
    WHERE id = v_devolucion.orden_id;
  END IF;

  -- ========================================
  -- 5. RETORNAR RESULTADO
  -- ========================================
  v_resultado := jsonb_build_object(
    'success', true,
    'devolucion_id', p_devolucion_id,
    'estado_anterior', v_estado_actual,
    'nuevo_estado', UPPER(p_nuevo_estado),
    'numero_pedido', v_devolucion.numero_orden,
    'email_usuario', v_devolucion.orden_email,
    'nombre_usuario', v_devolucion.orden_nombre,
    'session_stripe_id', v_devolucion.session_stripe_id,
    'monto_reembolso', COALESCE(p_monto_reembolso, v_devolucion.orden_total),
    'numero_etiqueta', v_devolucion.numero_etiqueta_devolucion
  );

  RETURN v_resultado;
END;
$$;

-- Solo service_role puede ejecutar esta función (admin)
GRANT EXECUTE ON FUNCTION public.admin_cambiar_estado_devolucion(uuid, text, text, numeric) TO service_role;

-- ============================================================================
-- AGREGAR COLUMNAS FALTANTES (si no existen)
-- ============================================================================
DO $$
BEGIN
  -- Fechas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitudes_devolucion' AND column_name = 'fecha_aprobacion') THEN
    ALTER TABLE solicitudes_devolucion ADD COLUMN fecha_aprobacion timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitudes_devolucion' AND column_name = 'fecha_recepcion') THEN
    ALTER TABLE solicitudes_devolucion ADD COLUMN fecha_recepcion timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitudes_devolucion' AND column_name = 'fecha_reembolso') THEN
    ALTER TABLE solicitudes_devolucion ADD COLUMN fecha_reembolso timestamptz;
  END IF;
  -- Monto reembolso
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitudes_devolucion' AND column_name = 'monto_reembolso') THEN
    ALTER TABLE solicitudes_devolucion ADD COLUMN monto_reembolso numeric(10,2);
  END IF;
  -- Número de seguimiento
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitudes_devolucion' AND column_name = 'numero_seguimiento') THEN
    ALTER TABLE solicitudes_devolucion ADD COLUMN numero_seguimiento text;
  END IF;
  -- Actualizado_en
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solicitudes_devolucion' AND column_name = 'actualizado_en') THEN
    ALTER TABLE solicitudes_devolucion ADD COLUMN actualizado_en timestamptz DEFAULT NOW();
  END IF;
END $$;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- SELECT proname FROM pg_proc WHERE proname = 'admin_cambiar_estado_devolucion';
