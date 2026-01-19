-- ============================================================================
-- AutoPartsStore - SCHEMA COMPLETO PRODUCCIÓN
-- ============================================================================
-- SQL para ejecutar en Supabase SQL Editor
-- Incluye: tablas faltantes, funciones atómicas, triggers
-- Fecha: 19 de enero de 2026
-- ============================================================================

-- ============================================================================
-- TABLA: ITEMS DE ÓRDENES (normalización)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ordenes_items (
  id BIGSERIAL PRIMARY KEY,
  orden_id UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
  producto_id BIGINT NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad INT NOT NULL CHECK (cantidad > 0),
  precio_unitario DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  nombre_producto TEXT NOT NULL, -- Snapshot del nombre al momento de compra
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ordenes_items_orden ON ordenes_items(orden_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_items_producto ON ordenes_items(producto_id);

-- ============================================================================
-- TABLA: HISTORIAL DE ESTADOS DE ÓRDENES
-- ============================================================================
CREATE TABLE IF NOT EXISTS ordenes_historial (
  id BIGSERIAL PRIMARY KEY,
  orden_id UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
  estado_anterior TEXT,
  estado_nuevo TEXT NOT NULL,
  razon TEXT,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ordenes_historial_orden ON ordenes_historial(orden_id);

-- ============================================================================
-- TABLA: SOLICITUDES DE DEVOLUCIÓN
-- ============================================================================
CREATE TABLE IF NOT EXISTS solicitudes_devolucion (
  id BIGSERIAL PRIMARY KEY,
  orden_id UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  estado TEXT DEFAULT 'SOLICITADA' CHECK (estado IN ('SOLICITADA', 'RECIBIDA', 'APROBADA', 'RECHAZADA', 'REEMBOLSADA')),
  motivo TEXT,
  descripcion TEXT,
  numero_etiqueta_devolucion TEXT UNIQUE,
  fecha_solicitud TIMESTAMP DEFAULT NOW(),
  fecha_recepcion TIMESTAMP,
  fecha_resolucion TIMESTAMP,
  monto_reembolso DECIMAL(10, 2),
  notas_internas TEXT,
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devoluciones_orden ON solicitudes_devolucion(orden_id);
CREATE INDEX IF NOT EXISTS idx_devoluciones_usuario ON solicitudes_devolucion(usuario_id);
CREATE INDEX IF NOT EXISTS idx_devoluciones_estado ON solicitudes_devolucion(estado);

-- ============================================================================
-- TABLA: SUSCRIPTORES NEWSLETTER
-- ============================================================================
CREATE TABLE IF NOT EXISTS suscriptores_newsletter (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  activo BOOLEAN DEFAULT true,
  codigo_descuento TEXT UNIQUE,
  codigo_usado BOOLEAN DEFAULT false,
  fecha_uso_codigo TIMESTAMP,
  fuente TEXT DEFAULT 'popup', -- popup, footer, registro
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON suscriptores_newsletter(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_codigo ON suscriptores_newsletter(codigo_descuento);

-- ============================================================================
-- TABLA: CUPONES GENERADOS (códigos únicos de newsletter)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cupones_newsletter (
  id BIGSERIAL PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  porcentaje_descuento INT DEFAULT 10,
  usado BOOLEAN DEFAULT false,
  orden_id UUID REFERENCES ordenes(id) ON DELETE SET NULL,
  fecha_expiracion TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  creado_en TIMESTAMP DEFAULT NOW(),
  usado_en TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cupones_newsletter_codigo ON cupones_newsletter(codigo);
CREATE INDEX IF NOT EXISTS idx_cupones_newsletter_email ON cupones_newsletter(email);

-- ============================================================================
-- TABLA: PERFILES DE USUARIO (datos adicionales)
-- ============================================================================
CREATE TABLE IF NOT EXISTS perfiles_usuario (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT,
  apellidos TEXT,
  telefono TEXT,
  fecha_nacimiento DATE,
  -- Dirección principal
  direccion_calle TEXT,
  direccion_numero TEXT,
  direccion_piso TEXT,
  direccion_ciudad TEXT,
  direccion_provincia TEXT,
  direccion_codigo_postal TEXT,
  direccion_pais TEXT DEFAULT 'España',
  -- Preferencias
  acepta_newsletter BOOLEAN DEFAULT false,
  acepta_marketing BOOLEAN DEFAULT false,
  -- Timestamps
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- TABLA: DIRECCIONES DE ENVÍO (múltiples por usuario)
-- ============================================================================
CREATE TABLE IF NOT EXISTS direcciones_envio (
  id BIGSERIAL PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo TEXT NOT NULL,
  telefono TEXT,
  calle TEXT NOT NULL,
  numero TEXT,
  piso TEXT,
  ciudad TEXT NOT NULL,
  provincia TEXT NOT NULL,
  codigo_postal TEXT NOT NULL,
  pais TEXT DEFAULT 'España',
  es_principal BOOLEAN DEFAULT false,
  instrucciones TEXT,
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_direcciones_usuario ON direcciones_envio(usuario_id);

-- ============================================================================
-- TABLA: USO DE CUPONES (tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cupones_uso (
  id BIGSERIAL PRIMARY KEY,
  cupon_id UUID NOT NULL REFERENCES cupones(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  orden_id UUID REFERENCES ordenes(id) ON DELETE SET NULL,
  descuento_aplicado DECIMAL(10, 2) NOT NULL,
  usado_en TIMESTAMP DEFAULT NOW(),
  UNIQUE(cupon_id, usuario_id, orden_id)
);

CREATE INDEX IF NOT EXISTS idx_cupones_uso_cupon ON cupones_uso(cupon_id);
CREATE INDEX IF NOT EXISTS idx_cupones_uso_usuario ON cupones_uso(usuario_id);

-- ============================================================================
-- AGREGAR COLUMNAS A ORDENES SI FALTAN
-- ============================================================================
DO $$
BEGIN
  -- Añadir columna de estado de pago si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ordenes' AND column_name = 'estado_pago') THEN
    ALTER TABLE ordenes ADD COLUMN estado_pago TEXT DEFAULT 'PENDIENTE' CHECK (estado_pago IN ('PENDIENTE', 'COMPLETADO', 'FALLIDO', 'REEMBOLSADO'));
  END IF;
  
  -- Añadir columna de fecha cancelación
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ordenes' AND column_name = 'fecha_cancelacion') THEN
    ALTER TABLE ordenes ADD COLUMN fecha_cancelacion TIMESTAMP;
  END IF;
  
  -- Añadir columna de solicitud devolución
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ordenes' AND column_name = 'solicitud_devolucion_id') THEN
    ALTER TABLE ordenes ADD COLUMN solicitud_devolucion_id BIGINT;
  END IF;
  
  -- Añadir columna de cupón usado
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ordenes' AND column_name = 'cupon_id') THEN
    ALTER TABLE ordenes ADD COLUMN cupon_id UUID REFERENCES cupones(id);
  END IF;
  
  -- Añadir columna de descuento aplicado
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ordenes' AND column_name = 'descuento_aplicado') THEN
    ALTER TABLE ordenes ADD COLUMN descuento_aplicado DECIMAL(10, 2) DEFAULT 0;
  END IF;
  
  -- Añadir número de seguimiento
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ordenes' AND column_name = 'numero_seguimiento') THEN
    ALTER TABLE ordenes ADD COLUMN numero_seguimiento TEXT;
  END IF;
END $$;

-- ============================================================================
-- FUNCIÓN: CANCELAR PEDIDO ATÓMICO
-- Restaura stock y cambia estado en UNA transacción
-- ============================================================================
DROP FUNCTION IF EXISTS cancelar_pedido_atomico(UUID, UUID);
DROP FUNCTION IF EXISTS cancelar_pedido_atomico(BIGINT, UUID);
CREATE OR REPLACE FUNCTION cancelar_pedido_atomico(
  p_orden_id UUID,
  p_usuario_id UUID
)
RETURNS TABLE(
  exito BOOLEAN,
  mensaje TEXT,
  stock_restaurado INT
) AS $$
DECLARE
  v_orden RECORD;
  v_item RECORD;
  v_total_restaurado INT := 0;
BEGIN
  -- Bloquear la orden para evitar race conditions
  SELECT id, estado, usuario_id
  INTO v_orden
  FROM ordenes
  WHERE id = p_orden_id
  FOR UPDATE;
  
  -- Validaciones
  IF v_orden IS NULL THEN
    RETURN QUERY SELECT false, 'Pedido no encontrado'::TEXT, 0;
    RETURN;
  END IF;
  
  IF v_orden.usuario_id != p_usuario_id THEN
    RETURN QUERY SELECT false, 'No tienes permisos para cancelar este pedido'::TEXT, 0;
    RETURN;
  END IF;
  
  IF v_orden.estado != 'PAGADO' THEN
    RETURN QUERY SELECT false, ('Solo se pueden cancelar pedidos en estado PAGADO. Estado actual: ' || v_orden.estado)::TEXT, 0;
    RETURN;
  END IF;
  
  -- Restaurar stock de cada producto (ATÓMICO)
  FOR v_item IN 
    SELECT producto_id, cantidad
    FROM ordenes_items
    WHERE orden_id = p_orden_id
  LOOP
    UPDATE productos
    SET stock = stock + v_item.cantidad,
        actualizado_en = NOW()
    WHERE id = v_item.producto_id;
    
    v_total_restaurado := v_total_restaurado + 1;
  END LOOP;
  
  -- Cambiar estado de la orden
  UPDATE ordenes
  SET estado = 'CANCELADO',
      estado_pago = 'REEMBOLSADO',
      fecha_cancelacion = NOW(),
      actualizado_en = NOW()
  WHERE id = p_orden_id;
  
  -- Registrar en historial
  INSERT INTO ordenes_historial (orden_id, estado_anterior, estado_nuevo, razon, usuario_id)
  VALUES (p_orden_id, 'PAGADO', 'CANCELADO', 'Cancelación solicitada por usuario', p_usuario_id);
  
  RETURN QUERY SELECT true, 'Pedido cancelado exitosamente. Stock restaurado.'::TEXT, v_total_restaurado;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCIÓN: VALIDAR CUPÓN
-- Valida cupón considerando: expiración, uso, límites, mínimo de compra
-- ============================================================================
DROP FUNCTION IF EXISTS validar_cupon(TEXT, UUID, DECIMAL);
DROP FUNCTION IF EXISTS validar_cupon(TEXT, UUID, NUMERIC);
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
  -- Buscar cupón (usando columnas de 02_ADVANCED_SCHEMA)
  SELECT c.id, c.codigo, c.descripcion, c.tipo_descuento, c.valor_descuento, 
         c.cantidad_minima_compra, c.limite_usos, c.usos_totales, 
         c.fecha_inicio, c.fecha_expiracion, c.activo
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
  
  -- Validar uso previo por usuario
  IF p_usuario_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_uso_previo
    FROM cupones_uso
    WHERE cupon_id = v_cupon.id AND usuario_id = p_usuario_id;
    
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

-- ============================================================================
-- FUNCIÓN: APLICAR CUPÓN (marcar como usado)
-- ============================================================================
DROP FUNCTION IF EXISTS aplicar_cupon(UUID, UUID, UUID, DECIMAL);
DROP FUNCTION IF EXISTS aplicar_cupon(BIGINT, UUID, UUID, DECIMAL);
DROP FUNCTION IF EXISTS aplicar_cupon(BIGINT, UUID, BIGINT, DECIMAL);
CREATE OR REPLACE FUNCTION aplicar_cupon(
  p_cupon_id UUID,
  p_usuario_id UUID,
  p_orden_id UUID,
  p_descuento DECIMAL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Registrar uso
  INSERT INTO cupones_uso (cupon_id, usuario_id, orden_id, descuento_aplicado)
  VALUES (p_cupon_id, p_usuario_id, p_orden_id, p_descuento);
  
  -- Incrementar contador de usos
  UPDATE cupones
  SET usos_totales = COALESCE(usos_totales, 0) + 1,
      actualizado_en = NOW()
  WHERE id = p_cupon_id;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCIÓN: GENERAR CÓDIGO DESCUENTO ÚNICO (newsletter)
-- ============================================================================
DROP FUNCTION IF EXISTS generar_codigo_newsletter(TEXT);
CREATE OR REPLACE FUNCTION generar_codigo_newsletter(
  p_email TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_codigo TEXT;
  v_existe BOOLEAN;
BEGIN
  LOOP
    -- Generar código: WELCOME-XXXXX
    v_codigo := 'WELCOME-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    
    -- Verificar que no existe
    SELECT EXISTS(SELECT 1 FROM cupones_newsletter WHERE codigo = v_codigo) INTO v_existe;
    
    EXIT WHEN NOT v_existe;
  END LOOP;
  
  -- Insertar cupón
  INSERT INTO cupones_newsletter (codigo, email, porcentaje_descuento, fecha_expiracion)
  VALUES (v_codigo, p_email, 10, NOW() + INTERVAL '30 days');
  
  RETURN v_codigo;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCIÓN: VALIDAR CUPÓN NEWSLETTER
-- ============================================================================
DROP FUNCTION IF EXISTS validar_cupon_newsletter(TEXT, DECIMAL);
DROP FUNCTION IF EXISTS validar_cupon_newsletter(TEXT, NUMERIC);
CREATE OR REPLACE FUNCTION validar_cupon_newsletter(
  p_codigo TEXT,
  p_subtotal DECIMAL
)
RETURNS TABLE(
  es_valido BOOLEAN,
  valor_descuento DECIMAL,
  mensaje TEXT
) AS $$
DECLARE
  v_cupon RECORD;
  v_descuento DECIMAL;
BEGIN
  SELECT id, codigo, porcentaje_descuento, usado, fecha_expiracion
  INTO v_cupon
  FROM cupones_newsletter
  WHERE UPPER(codigo) = UPPER(p_codigo);
  
  IF v_cupon IS NULL THEN
    RETURN QUERY SELECT false, 0::DECIMAL, 'Código no válido'::TEXT;
    RETURN;
  END IF;
  
  IF v_cupon.usado THEN
    RETURN QUERY SELECT false, 0::DECIMAL, 'Este código ya ha sido utilizado'::TEXT;
    RETURN;
  END IF;
  
  IF NOW() > v_cupon.fecha_expiracion THEN
    RETURN QUERY SELECT false, 0::DECIMAL, 'Este código ha expirado'::TEXT;
    RETURN;
  END IF;
  
  v_descuento := ROUND((p_subtotal * v_cupon.porcentaje_descuento / 100), 2);
  
  RETURN QUERY SELECT true, v_descuento, 
    ('Descuento de ' || v_cupon.porcentaje_descuento || '% aplicado')::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCIÓN: PROCESAR CHECKOUT ATÓMICO
-- Valida stock, crea orden, descuenta stock en UNA transacción
-- ============================================================================
DROP FUNCTION IF EXISTS procesar_checkout_atomico(UUID, TEXT, TEXT, JSONB, JSONB, TEXT);
CREATE OR REPLACE FUNCTION procesar_checkout_atomico(
  p_usuario_id UUID,
  p_email TEXT,
  p_telefono TEXT,
  p_items JSONB,
  p_direccion_envio JSONB,
  p_cupon_codigo TEXT DEFAULT NULL
)
RETURNS TABLE(
  exito BOOLEAN,
  orden_id UUID,
  numero_orden TEXT,
  mensaje TEXT
) AS $$
DECLARE
  v_item RECORD;
  v_producto RECORD;
  v_subtotal DECIMAL := 0;
  v_total DECIMAL := 0;
  v_orden_id UUID;
  v_numero_orden TEXT;
  v_cupon_id UUID;
  v_descuento DECIMAL := 0;
  v_costo_envio DECIMAL := 5.99;
BEGIN
  -- Validar stock de todos los productos PRIMERO
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id BIGINT, quantity INT, price DECIMAL)
  LOOP
    SELECT id, nombre, stock, precio
    INTO v_producto
    FROM productos
    WHERE id = v_item.product_id
    FOR UPDATE; -- Bloquear para evitar race conditions
    
    IF v_producto IS NULL THEN
      RETURN QUERY SELECT false, NULL::BIGINT, NULL::TEXT, 
        ('Producto no encontrado: ' || v_item.product_id)::TEXT;
      RETURN;
    END IF;
    
    IF v_producto.stock < v_item.quantity THEN
      RETURN QUERY SELECT false, NULL::BIGINT, NULL::TEXT, 
        ('Stock insuficiente para: ' || v_producto.nombre || '. Disponible: ' || v_producto.stock)::TEXT;
      RETURN;
    END IF;
    
    v_subtotal := v_subtotal + (v_producto.precio * v_item.quantity);
  END LOOP;
  
  -- Validar cupón si se proporcionó
  IF p_cupon_codigo IS NOT NULL AND p_cupon_codigo != '' THEN
    SELECT c.cupon_id, c.valor_descuento
    INTO v_cupon_id, v_descuento
    FROM validar_cupon(p_cupon_codigo, p_usuario_id, v_subtotal) c
    WHERE c.es_valido = true;
  END IF;
  
  -- Calcular total
  v_total := v_subtotal - COALESCE(v_descuento, 0) + v_costo_envio;
  
  -- Generar número de orden
  v_numero_orden := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  
  -- Crear orden
  INSERT INTO ordenes (
    numero_orden, usuario_id, email_cliente, telefono_cliente,
    estado, estado_pago, direccion_envio, costo_envio,
    subtotal, descuento_aplicado, cupon_id, total, creada_en
  ) VALUES (
    v_numero_orden, p_usuario_id, p_email, p_telefono,
    'PENDIENTE', 'PENDIENTE', p_direccion_envio, v_costo_envio,
    v_subtotal, COALESCE(v_descuento, 0), v_cupon_id, v_total, NOW()
  )
  RETURNING id INTO v_orden_id;
  
  -- Crear items y descontar stock ATÓMICAMENTE
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id BIGINT, quantity INT, price DECIMAL, name TEXT)
  LOOP
    -- Insertar item
    INSERT INTO ordenes_items (orden_id, producto_id, cantidad, precio_unitario, subtotal, nombre_producto)
    VALUES (v_orden_id, v_item.product_id, v_item.quantity, v_item.price, v_item.price * v_item.quantity, v_item.name);
    
    -- Descontar stock
    UPDATE productos
    SET stock = stock - v_item.quantity,
        actualizado_en = NOW()
    WHERE id = v_item.product_id;
  END LOOP;
  
  -- Marcar cupón como usado si aplica
  IF v_cupon_id IS NOT NULL THEN
    PERFORM aplicar_cupon(v_cupon_id, p_usuario_id, v_orden_id, v_descuento);
  END IF;
  
  RETURN QUERY SELECT true, v_orden_id, v_numero_orden, 'Orden creada exitosamente'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Crear perfil automáticamente al registrar usuario
-- ============================================================================
CREATE OR REPLACE FUNCTION crear_perfil_usuario()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO perfiles_usuario (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Solo crear el trigger si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_crear_perfil'
  ) THEN
    CREATE TRIGGER trigger_crear_perfil
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION crear_perfil_usuario();
  END IF;
END $$;

-- ============================================================================
-- POLÍTICAS RLS PARA NUEVAS TABLAS
-- ============================================================================

-- Habilitar RLS
ALTER TABLE perfiles_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE direcciones_envio ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes_devolucion ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_historial ENABLE ROW LEVEL SECURITY;

-- Perfiles: usuarios solo ven/editan su propio perfil
CREATE POLICY "Usuarios ven su perfil" ON perfiles_usuario
  FOR SELECT USING (auth.uid() = id);
  
CREATE POLICY "Usuarios editan su perfil" ON perfiles_usuario
  FOR UPDATE USING (auth.uid() = id);

-- Direcciones: usuarios solo ven/editan sus direcciones
CREATE POLICY "Usuarios ven sus direcciones" ON direcciones_envio
  FOR SELECT USING (auth.uid() = usuario_id);
  
CREATE POLICY "Usuarios gestionan sus direcciones" ON direcciones_envio
  FOR ALL USING (auth.uid() = usuario_id);

-- Devoluciones: usuarios solo ven sus devoluciones
CREATE POLICY "Usuarios ven sus devoluciones" ON solicitudes_devolucion
  FOR SELECT USING (auth.uid() = usuario_id);

-- Items de órdenes: usuarios ven items de sus órdenes
CREATE POLICY "Usuarios ven items de sus ordenes" ON ordenes_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM ordenes WHERE ordenes.id = ordenes_items.orden_id AND ordenes.usuario_id = auth.uid())
  );

-- ============================================================================
-- DATOS DE PRUEBA: Cupones
-- ============================================================================
INSERT INTO cupones (codigo, descripcion, tipo_descuento, valor_descuento, limite_usos, cantidad_minima_compra, fecha_inicio, fecha_expiracion, activo)
VALUES 
  ('BIENVENIDO10', 'Descuento de bienvenida 10%', 'porcentaje', 10, 100, 30, NOW(), NOW() + INTERVAL '1 year', true),
  ('ENVIOGRATIS', 'Envío gratis en compras +50€', 'cantidad_fija', 5.99, NULL, 50, NOW(), NOW() + INTERVAL '6 months', true),
  ('VERANO20', 'Descuento de verano 20%', 'porcentaje', 20, 50, 100, NOW(), NOW() + INTERVAL '3 months', true)
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================================
-- FIN DEL SCHEMA
-- ============================================================================
