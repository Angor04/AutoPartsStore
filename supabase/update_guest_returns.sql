-- ============================================================================
-- ACTUALIZACIÓN: SOPORTE PARA DEVOLUCIONES DE INVITADOS
-- Ejecutar este script en el SQL Editor de Supabase
-- ============================================================================

-- Eliminar la función anterior (la firma cambia al añadir p_email)
DROP FUNCTION IF EXISTS public.crear_solicitud_devolucion(uuid, uuid, text, text);

CREATE OR REPLACE FUNCTION public.crear_solicitud_devolucion(
  p_orden_id uuid,
  p_usuario_id uuid, -- Puede ser NULL para invitados
  p_motivo text,
  p_descripcion text DEFAULT '',
  p_email text DEFAULT NULL -- Nuevo parámetro obligatorio para validar invitados
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_orden RECORD;
  v_fecha_entrega timestamptz;
  v_dias_desde_entrega integer;
  v_devolucion_existente integer;
  v_numero_etiqueta text;
  v_devolucion_id uuid;
  v_resultado jsonb;
BEGIN
  -- ========================================
  -- 1. VERIFICAR QUE LA ORDEN EXISTE Y PERTENECE AL USUARIO O EMAIL
  -- ========================================
  SELECT id, numero_orden, estado, total, usuario_id, 
         fecha_entrega, actualizado_en, email
  INTO v_orden
  FROM ordenes
  WHERE id = p_orden_id;

  -- Si no existe la orden
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Pedido no encontrado'
    );
  END IF;

  -- VALIDACIÓN DE PROPIEDAD:
  -- Caso A: Usuario Autenticado (p_usuario_id no es null) -> debe coincidir con v_orden.usuario_id
  -- Caso B: Invitado (p_usuario_id es null) -> p_email debe coincidir con v_orden.email
  
  IF p_usuario_id IS NOT NULL THEN
    IF v_orden.usuario_id IS DISTINCT FROM p_usuario_id THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'No tienes permisos para gestionar este pedido (ID mismatch)'
      );
    END IF;
  ELSE
    -- Es invitado, validar email
    IF p_email IS NULL OR LOWER(TRIM(p_email)) != LOWER(TRIM(v_orden.email)) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'El email proporcionado no coincide con el del pedido'
      );
    END IF;
  END IF;

  -- ========================================
  -- 2. VALIDAR QUE ESTÁ EN ESTADO ENTREGADO
  -- ========================================
  IF UPPER(v_orden.estado) != 'ENTREGADO' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('No se puede solicitar devolución. Estado actual: %s. Solo se pueden devolver pedidos entregados.', v_orden.estado)
    );
  END IF;

  -- ========================================
  -- 3. VALIDAR VENTANA DE 14 DÍAS DESDE ENTREGA
  -- ========================================
  v_fecha_entrega := COALESCE(v_orden.fecha_entrega, v_orden.actualizado_en);
  v_dias_desde_entrega := EXTRACT(DAY FROM (NOW() - v_fecha_entrega));

  IF v_dias_desde_entrega > 14 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('El plazo de devolución ha expirado. Han pasado %s días desde la entrega (máximo 14 días).', v_dias_desde_entrega)
    );
  END IF;

  -- ========================================
  -- 4. VALIDAR QUE NO EXISTE OTRA DEVOLUCIÓN PARA ESTA ORDEN
  -- ========================================
  SELECT COUNT(*) INTO v_devolucion_existente
  FROM solicitudes_devolucion
  WHERE orden_id = p_orden_id;

  IF v_devolucion_existente > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Ya existe una solicitud de devolución para este pedido.'
    );
  END IF;

  -- ========================================
  -- 5. GENERAR NÚMERO DE ETIQUETA DE DEVOLUCIÓN
  -- ========================================
  v_numero_etiqueta := 'DEV-' || EXTRACT(EPOCH FROM NOW())::bigint::text || '-' || UPPER(SUBSTRING(md5(random()::text) FROM 1 FOR 6));

  -- ========================================
  -- 6. INSERTAR SOLICITUD DE DEVOLUCIÓN
  -- ========================================
  INSERT INTO solicitudes_devolucion (
    orden_id,
    usuario_id, -- Será NULL si es invitado
    estado,
    motivo,
    descripcion,
    numero_etiqueta_devolucion,
    fecha_solicitud,
    creado_en
  ) VALUES (
    p_orden_id,
    p_usuario_id,
    'SOLICITADA',
    COALESCE(p_motivo, 'No especificado'),
    COALESCE(p_descripcion, ''),
    v_numero_etiqueta,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_devolucion_id;

  -- ========================================
  -- 7. VINCULAR DEVOLUCIÓN A LA ORDEN
  -- ========================================
  UPDATE ordenes
  SET solicitud_devolucion_id = v_devolucion_id,
      actualizado_en = NOW()
  WHERE id = p_orden_id;

  -- ========================================
  -- 8. RETORNAR RESULTADO
  -- ========================================
  v_resultado := jsonb_build_object(
    'success', true,
    'devolucion_id', v_devolucion_id,
    'numero_etiqueta', v_numero_etiqueta,
    'numero_pedido', v_orden.numero_orden,
    'monto_reembolso', v_orden.total,
    'estado', 'SOLICITADA',
    'email_usuario', v_orden.email
  );

  RETURN v_resultado;
END;
$$;

-- Permisos
GRANT EXECUTE ON FUNCTION public.crear_solicitud_devolucion(uuid, uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.crear_solicitud_devolucion(uuid, uuid, text, text, text) TO service_role;
