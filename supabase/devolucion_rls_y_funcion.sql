-- ============================================================================
-- SISTEMA DE DEVOLUCIONES - RLS + FUNCIÓN BACKEND
-- Ejecutar este script completo en el SQL Editor de Supabase
-- ============================================================================

-- ============================================================================
-- 1. HABILITAR RLS EN solicitudes_devolucion (si no está habilitado)
-- ============================================================================
ALTER TABLE public.solicitudes_devolucion ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. LIMPIAR POLÍTICAS ANTERIORES (por si ya existen)
-- ============================================================================
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias solicitudes" ON public.solicitudes_devolucion;
DROP POLICY IF EXISTS "Solo backend puede insertar solicitudes" ON public.solicitudes_devolucion;
DROP POLICY IF EXISTS "Solo backend puede actualizar solicitudes" ON public.solicitudes_devolucion;
DROP POLICY IF EXISTS "Nadie puede eliminar solicitudes" ON public.solicitudes_devolucion;

-- ============================================================================
-- 3. POLÍTICAS RLS
-- ============================================================================

-- SELECT: El usuario solo puede ver sus propias solicitudes
CREATE POLICY "Usuarios pueden ver sus propias solicitudes"
  ON public.solicitudes_devolucion
  FOR SELECT
  USING (auth.uid()::text = usuario_id::text);

-- INSERT: Denegado a clientes directamente (se hace via función SECURITY DEFINER)
-- No creamos política INSERT para authenticated, así queda bloqueado por defecto

-- UPDATE: Denegado a clientes
-- No creamos política UPDATE para authenticated

-- DELETE: Denegado a todos
-- No creamos política DELETE

-- ============================================================================
-- 4. FUNCIÓN BACKEND: crear_solicitud_devolucion
-- ============================================================================
DROP FUNCTION IF EXISTS public.crear_solicitud_devolucion(uuid, uuid, text, text);

CREATE OR REPLACE FUNCTION public.crear_solicitud_devolucion(
  p_orden_id uuid,
  p_usuario_id uuid,
  p_motivo text,
  p_descripcion text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER  -- Ejecuta con permisos del owner (bypasses RLS)
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
  -- 1. VERIFICAR QUE LA ORDEN EXISTE Y PERTENECE AL USUARIO
  -- ========================================
  SELECT id, numero_orden, estado, total, usuario_id, 
         fecha_entrega, actualizado_en, email
  INTO v_orden
  FROM ordenes
  WHERE id = p_orden_id 
    AND usuario_id::text = p_usuario_id::text;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Pedido no encontrado o no tienes permisos'
    );
  END IF;

  -- ========================================
  -- 2. VALIDAR QUE ESTÁ EN ESTADO ENTREGADO
  -- ========================================
  IF UPPER(v_orden.estado) != 'ENTREGADO' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('No se puede solicitar devolución. Estado actual: %s. Solo se pueden devolver pedidos en estado ENTREGADO.', v_orden.estado)
    );
  END IF;

  -- ========================================
  -- 3. VALIDAR VENTANA DE 14 DÍAS DESDE ENTREGA
  -- ========================================
  -- Usar fecha_entrega si existe, sino actualizado_en como fallback
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
    usuario_id,
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

-- Permitir que usuarios autenticados llamen a esta función
GRANT EXECUTE ON FUNCTION public.crear_solicitud_devolucion(uuid, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.crear_solicitud_devolucion(uuid, uuid, text, text) TO service_role;

-- ============================================================================
-- VERIFICACIÓN: Ejecuta esta query para confirmar que todo se creó bien
-- ============================================================================
-- SELECT proname FROM pg_proc WHERE proname = 'crear_solicitud_devolucion';
-- SELECT * FROM pg_policies WHERE tablename = 'solicitudes_devolucion';
