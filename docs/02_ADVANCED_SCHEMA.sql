-- ============================================================================
-- SCHEMA AVANZADO - eCommerce
-- Cambio de contraseña, Newsletter, Cupones, Pedidos, Devoluciones
-- ============================================================================

-- ============================================================================
-- 1. TABLA: USUARIOS (Perfil extendido)
-- ============================================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  apellido TEXT,
  email TEXT NOT NULL UNIQUE,
  telefono TEXT,
  direccion TEXT,
  ciudad TEXT,
  codigo_postal TEXT,
  pais TEXT,
  foto_perfil TEXT,
  fecha_registro TIMESTAMP DEFAULT NOW(),
  ultimo_acceso TIMESTAMP,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_activo ON usuarios(activo);

-- ============================================================================
-- 1b. TABLA: NEWSLETTER (Suscriptores)
-- ============================================================================
CREATE TABLE IF NOT EXISTS newsletter_suscriptores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  estado_suscripcion BOOLEAN DEFAULT true,
  recibe_ofertas BOOLEAN DEFAULT true,
  codigo_descuento_otorgado TEXT,
  fecha_suscripcion TIMESTAMP DEFAULT NOW(),
  fecha_confirmacion TIMESTAMP,
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_newsletter_email ON newsletter_suscriptores(email);
CREATE INDEX idx_newsletter_usuario ON newsletter_suscriptores(usuario_id);
CREATE INDEX idx_newsletter_activo ON newsletter_suscriptores(estado_suscripcion);

-- ============================================================================
-- 2. TABLA: CUPONES / CÓDIGOS DE DESCUENTO
-- ============================================================================
CREATE TABLE IF NOT EXISTS cupones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  tipo_descuento TEXT NOT NULL, -- 'porcentaje' o 'cantidad_fija'
  valor_descuento DECIMAL(10, 2) NOT NULL, -- Ej: 15 (para 15%) o 5 (para 5€)
  descuento_maximo DECIMAL(10, 2), -- Límite máximo de descuento (si es porcentaje)
  cantidad_minima_compra DECIMAL(10, 2) DEFAULT 0, -- Compra mínima para aplicar
  uso_unico BOOLEAN DEFAULT true, -- true: una vez por usuario, false: múltiple
  usos_totales INT DEFAULT 0, -- Contador de usos totales
  limite_usos INT, -- NULL = ilimitado
  activo BOOLEAN DEFAULT true,
  fecha_inicio TIMESTAMP DEFAULT NOW(),
  fecha_expiracion TIMESTAMP NOT NULL,
  categorias_aplica UUID[], -- NULL = todas, o array de categoria_id
  creado_por UUID REFERENCES auth.users(id),
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cupones_codigo ON cupones(codigo);
CREATE INDEX idx_cupones_activo ON cupones(activo);
CREATE INDEX idx_cupones_expiracion ON cupones(fecha_expiracion);

-- ============================================================================
-- 3. TABLA: ORDENES (Pedidos) - AMPLIADA
-- ============================================================================
CREATE TABLE IF NOT EXISTS ordenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero_orden TEXT UNIQUE NOT NULL, -- Ej: "ORD-2026-001"
  estado TEXT NOT NULL DEFAULT 'PENDIENTE', -- PENDIENTE, PAGADO, ENVIADO, ENTREGADO, CANCELADO
  estado_pago TEXT DEFAULT 'PENDIENTE', -- PENDIENTE, COMPLETADO, FALLIDO, REEMBOLSADO
  
  -- Dinero
  subtotal DECIMAL(10, 2) NOT NULL,
  impuestos DECIMAL(10, 2) DEFAULT 0,
  costo_envio DECIMAL(10, 2) DEFAULT 0,
  descuento_aplicado DECIMAL(10, 2) DEFAULT 0,
  cupon_id UUID REFERENCES cupones(id) ON DELETE SET NULL,
  total DECIMAL(10, 2) NOT NULL,
  
  -- Envío
  direccion_envio JSONB, -- {calle, ciudad, codigo_postal, pais}
  telefono_envio TEXT,
  
  -- Seguimiento
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_pago TIMESTAMP,
  fecha_envio TIMESTAMP,
  fecha_entrega TIMESTAMP,
  fecha_cancelacion TIMESTAMP,
  numero_seguimiento TEXT,
  
  -- Devolución
  solicitud_devolucion_id UUID, -- Referencias a solicitud_devolucion
  
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ordenes_usuario ON ordenes(usuario_id);
CREATE INDEX idx_ordenes_estado ON ordenes(estado);
CREATE INDEX idx_ordenes_estado_pago ON ordenes(estado_pago);
CREATE INDEX idx_ordenes_numero ON ordenes(numero_orden);
CREATE INDEX idx_ordenes_fecha ON ordenes(fecha_creacion);

-- ============================================================================
-- 4. TABLA: CUPONES USADOS (Auditoría + Validación de uso único)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cupones_usados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cupon_id UUID NOT NULL REFERENCES cupones(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pedido_id UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
  valor_aplicado DECIMAL(10, 2) NOT NULL,
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cupones_usados_cupon ON cupones_usados(cupon_id);
CREATE INDEX idx_cupones_usados_usuario ON cupones_usados(usuario_id);
CREATE INDEX idx_cupones_usados_pedido ON cupones_usados(pedido_id);
CREATE UNIQUE INDEX idx_cupones_usados_unico ON cupones_usados(cupon_id, usuario_id) 
WHERE cupon_id IS NOT NULL; -- Solo si uso_unico = true

-- ============================================================================
-- 5. TABLA: ITEMS DE ORDEN (Detalle de productos en cada pedido)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ordenes_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
  producto_id BIGINT NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10, 2) NOT NULL, -- Precio en el momento de la compra
  subtotal DECIMAL(10, 2) NOT NULL,
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ordenes_items_orden ON ordenes_items(orden_id);
CREATE INDEX idx_ordenes_items_producto ON ordenes_items(producto_id);

-- ============================================================================
-- 6. TABLA: SOLICITUDES DE DEVOLUCIÓN
-- ============================================================================
CREATE TABLE IF NOT EXISTS solicitudes_devolucion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  estado TEXT DEFAULT 'SOLICITADA', -- SOLICITADA, ACEPTADA, RECHAZADA, COMPLETADA
  motivo TEXT,
  descripcion TEXT,
  numero_etiqueta_devolucion TEXT UNIQUE, -- Código de envío inverso
  fecha_solicitud TIMESTAMP DEFAULT NOW(),
  fecha_aceptacion TIMESTAMP,
  fecha_recepcion TIMESTAMP,
  fecha_reembolso TIMESTAMP,
  monto_reembolso DECIMAL(10, 2),
  numero_seguimiento_devolucion TEXT,
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_devoluciones_orden ON solicitudes_devolucion(orden_id);
CREATE INDEX idx_devoluciones_usuario ON solicitudes_devolucion(usuario_id);
CREATE INDEX idx_devoluciones_estado ON solicitudes_devolucion(estado);

-- ============================================================================
-- 7. TABLA: HISTORIAL DE CAMBIOS DE ESTADO (Auditoría)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ordenes_historial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
  estado_anterior TEXT,
  estado_nuevo TEXT NOT NULL,
  razon TEXT, -- "Cancelado por usuario", "Entregado", etc
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ordenes_historial_orden ON ordenes_historial(orden_id);
CREATE INDEX idx_ordenes_historial_fecha ON ordenes_historial(creado_en);

-- ============================================================================
-- FUNCIONES CRÍTICAS (SQL) - TRANSACCIONES ATÓMICAS
-- ============================================================================

-- ============================================================================
-- 🔴 FUNCIÓN 1: CANCELAR PEDIDO (con restauración atómica de stock)
-- ============================================================================
CREATE OR REPLACE FUNCTION cancelar_pedido_atomico(
  p_orden_id UUID,
  p_usuario_id UUID
)
RETURNS TABLE (
  exito BOOLEAN,
  mensaje TEXT,
  stock_restaurado INT
) AS $$
DECLARE
  v_estado_actual TEXT;
  v_stock_restaurado INT := 0;
  v_item RECORD;
BEGIN
  
  -- 1. VALIDAR QUE EL PEDIDO EXISTE Y PERTENECE AL USUARIO
  SELECT estado INTO v_estado_actual
  FROM ordenes
  WHERE id = p_orden_id AND usuario_id = p_usuario_id;
  
  IF v_estado_actual IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Pedido no encontrado', 0;
    RETURN;
  END IF;
  
  -- 2. VALIDAR QUE SOLO SE PUEDE CANCELAR SI ESTÁ EN ESTADO "PAGADO"
  IF v_estado_actual != 'PAGADO' THEN
    RETURN QUERY SELECT FALSE, 
      'Solo se pueden cancelar pedidos en estado PAGADO. Estado actual: ' || v_estado_actual, 0;
    RETURN;
  END IF;
  
  -- 3. INICIO DE TRANSACCIÓN (implícito en PostgreSQL)
  
  -- 4. RESTAURAR STOCK DE TODOS LOS PRODUCTOS
  FOR v_item IN
    SELECT producto_id, cantidad
    FROM ordenes_items
    WHERE orden_id = p_orden_id
  LOOP
    UPDATE productos
    SET stock = stock + v_item.cantidad
    WHERE id = v_item.producto_id;
    
    v_stock_restaurado := v_stock_restaurado + v_item.cantidad;
  END LOOP;
  
  -- 5. CAMBIAR ESTADO A CANCELADO
  UPDATE ordenes
  SET 
    estado = 'CANCELADO',
    estado_pago = 'REEMBOLSADO',
    fecha_cancelacion = NOW(),
    actualizado_en = NOW()
  WHERE id = p_orden_id;
  
  -- 6. REGISTRAR EN HISTORIAL
  INSERT INTO ordenes_historial (orden_id, estado_anterior, estado_nuevo, razon, usuario_id)
  VALUES (p_orden_id, v_estado_actual, 'CANCELADO', 'Cancelado por usuario', p_usuario_id);
  
  -- 7. RETORNAR ÉXITO
  RETURN QUERY SELECT TRUE, 'Pedido cancelado exitosamente. Stock restaurado.', v_stock_restaurado;
  
EXCEPTION WHEN OTHERS THEN
  -- Si algo falla, TODO SE REVIERTE AUTOMÁTICAMENTE (transacción)
  RETURN QUERY SELECT FALSE, 'Error al cancelar: ' || SQLERRM, 0;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 🟡 FUNCIÓN 2: VALIDAR Y APLICAR CUPÓN
-- ============================================================================
CREATE OR REPLACE FUNCTION validar_cupon(
  p_codigo_cupon TEXT,
  p_usuario_id UUID,
  p_subtotal DECIMAL
)
RETURNS TABLE (
  cupon_id UUID,
  es_valido BOOLEAN,
  valor_descuento DECIMAL,
  mensaje TEXT
) AS $$
DECLARE
  v_cupon RECORD;
  v_ya_usado BOOLEAN;
  v_descuento DECIMAL;
BEGIN
  
  -- 1. BUSCAR CUPÓN
  SELECT * INTO v_cupon
  FROM cupones
  WHERE UPPER(codigo) = UPPER(p_codigo_cupon);
  
  IF v_cupon IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, FALSE, 0, 'Código de cupón inválido';
    RETURN;
  END IF;
  
  -- 2. VALIDAR ACTIVO
  IF v_cupon.activo = FALSE THEN
    RETURN QUERY SELECT v_cupon.id, FALSE, 0, 'Este cupón está desactivado';
    RETURN;
  END IF;
  
  -- 3. VALIDAR EXPIRACIÓN
  IF v_cupon.fecha_expiracion < NOW() THEN
    RETURN QUERY SELECT v_cupon.id, FALSE, 0, 'Este cupón ha expirado';
    RETURN;
  END IF;
  
  -- 4. VALIDAR COMPRA MÍNIMA
  IF p_subtotal < v_cupon.cantidad_minima_compra THEN
    RETURN QUERY SELECT v_cupon.id, FALSE, 0, 
      'Compra mínima requerida: ' || v_cupon.cantidad_minima_compra::TEXT;
    RETURN;
  END IF;
  
  -- 5. VALIDAR LÍMITE DE USOS
  IF v_cupon.limite_usos IS NOT NULL AND 
     v_cupon.usos_totales >= v_cupon.limite_usos THEN
    RETURN QUERY SELECT v_cupon.id, FALSE, 0, 'Este cupón alcanzó su límite de usos';
    RETURN;
  END IF;
  
  -- 6. VALIDAR USO ÚNICO
  IF v_cupon.uso_unico = TRUE THEN
    SELECT EXISTS(
      SELECT 1 FROM cupones_usados
      WHERE cupon_id = v_cupon.id AND usuario_id = p_usuario_id
    ) INTO v_ya_usado;
    
    IF v_ya_usado THEN
      RETURN QUERY SELECT v_cupon.id, FALSE, 0, 
        'Ya has usado este cupón anteriormente';
      RETURN;
    END IF;
  END IF;
  
  -- 7. CALCULAR DESCUENTO
  IF v_cupon.tipo_descuento = 'porcentaje' THEN
    v_descuento := (p_subtotal * v_cupon.valor_descuento) / 100;
    -- Aplicar límite máximo si existe
    IF v_cupon.descuento_maximo IS NOT NULL AND 
       v_descuento > v_cupon.descuento_maximo THEN
      v_descuento := v_cupon.descuento_maximo;
    END IF;
  ELSE
    v_descuento := v_cupon.valor_descuento; -- Cantidad fija
  END IF;
  
  -- 8. RETORNAR ÉXITO
  RETURN QUERY SELECT v_cupon.id, TRUE, v_descuento,
    'Cupón válido. Descuento aplicado: ' || v_descuento::TEXT || '€';
  
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT NULL::UUID, FALSE, 0, 'Error al validar cupón: ' || SQLERRM;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 🟢 FUNCIÓN 3: GENERAR CÓDIGO ALEATORIO (Para cupones de newsletter)
-- ============================================================================
CREATE OR REPLACE FUNCTION generar_codigo_descuento()
RETURNS TEXT AS $$
BEGIN
  RETURN 'DESC' || 
         TO_CHAR(NOW(), 'YYYYMMDD') ||
         SUBSTRING(MD5(RANDOM()::TEXT), 1, 6);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS (ROW LEVEL SECURITY) - PROTEGER DATOS
-- ============================================================================

-- Verificar que las tablas existan antes de habilitar RLS
-- SELECT to_regclass('public.usuarios');

-- Permitir que usuarios vean solo su propio perfil
ALTER TABLE IF EXISTS usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
ON usuarios FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
ON usuarios FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Anyone can insert own profile"
ON usuarios FOR INSERT
WITH CHECK (id = auth.uid());

-- Permitir que usuarios vean solo sus propios pedidos
ALTER TABLE IF EXISTS ordenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
ON ordenes FOR SELECT
USING (usuario_id = auth.uid());

CREATE POLICY "Users can insert own orders"
ON ordenes FOR INSERT
WITH CHECK (usuario_id = auth.uid());

-- Permitir que usuarios vean solo sus propias devoluciones
ALTER TABLE solicitudes_devolucion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own returns"
ON solicitudes_devolucion FOR SELECT
USING (usuario_id = auth.uid());

-- Newsletter (pública lectura, pero INSERT con control)
ALTER TABLE IF EXISTS newsletter_suscriptores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe"
ON newsletter_suscriptores FOR INSERT
WITH CHECK (TRUE);

CREATE POLICY "Users can view own newsletter subscription"
ON newsletter_suscriptores FOR SELECT
USING (usuario_id = auth.uid() OR usuario_id IS NULL);
