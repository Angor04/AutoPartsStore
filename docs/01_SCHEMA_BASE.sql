-- ============================================================================
-- AutoPartsStore - SCHEMA BASE DE DATOS
-- ============================================================================
-- Base de datos completa con tablas, índices y políticas de seguridad RLS
-- Adaptado para tienda de recambios de coches
-- Fecha: 9 de enero de 2026
-- ============================================================================

-- ============================================================================
-- TABLA: CATEGORÍAS
-- ============================================================================
CREATE TABLE IF NOT EXISTS categorias (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  icono TEXT,
  orden INT DEFAULT 0,
  activa BOOLEAN DEFAULT true,
  creada_en TIMESTAMP DEFAULT NOW(),
  actualizada_en TIMESTAMP DEFAULT NOW()
);

-- Índices para categorías
CREATE INDEX IF NOT EXISTS idx_categorias_slug ON categorias(slug);
CREATE INDEX IF NOT EXISTS idx_categorias_activa ON categorias(activa);

-- ============================================================================
-- TABLA: PRODUCTOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS productos (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10, 2) NOT NULL,
  precio_original DECIMAL(10, 2),
  categoria_id BIGINT NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
  urls_imagenes TEXT[],
  stock INT DEFAULT 0,
  sku TEXT UNIQUE,
  destacado BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  marca TEXT,
  modelo_compatible TEXT,
  especificaciones JSONB DEFAULT '{}'::jsonb,
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

-- Índices para productos
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_sku ON productos(sku);
CREATE INDEX IF NOT EXISTS idx_productos_destacado ON productos(destacado) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos USING GIN(to_tsvector('spanish', nombre));
CREATE INDEX IF NOT EXISTS idx_productos_descripcion ON productos USING GIN(to_tsvector('spanish', descripcion));

-- ============================================================================
-- TABLA: CARRITO (sesiones de usuario)
-- ============================================================================
CREATE TABLE IF NOT EXISTS carritos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT UNIQUE,
  items JSONB DEFAULT '[]'::jsonb,
  cantidad_total INT DEFAULT 0,
  subtotal DECIMAL(10, 2) DEFAULT 0,
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW(),
  expira_en TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days')
);

-- Índices para carritos
CREATE INDEX IF NOT EXISTS idx_carritos_usuario ON carritos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_carritos_session ON carritos(session_id);
CREATE INDEX IF NOT EXISTS idx_carritos_expira ON carritos(expira_en);

-- ============================================================================
-- TABLA: ÓRDENES
-- ============================================================================
CREATE TABLE IF NOT EXISTS ordenes (
  id BIGSERIAL PRIMARY KEY,
  numero_orden TEXT UNIQUE NOT NULL DEFAULT concat('ORD-', to_char(NOW(), 'YYYYMMDD'), '-', nextval('ordenes_id_seq')::text),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email_cliente TEXT NOT NULL,
  telefono_cliente TEXT,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'procesando', 'enviado', 'entregado', 'cancelado')),
  
  -- Datos de envío
  direccion_envio JSONB NOT NULL DEFAULT '{}'::jsonb,
  costo_envio DECIMAL(10, 2) DEFAULT 0,
  
  -- Datos del pedido
  productos JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  
  -- Datos de pago
  metodo_pago TEXT DEFAULT 'pendiente',
  referencia_pago TEXT,
  id_transaccion_stripe TEXT,
  
  -- Notas
  notas_cliente TEXT,
  notas_internas TEXT,
  
  creada_en TIMESTAMP DEFAULT NOW(),
  actualizada_en TIMESTAMP DEFAULT NOW(),
  entregada_en TIMESTAMP
);

-- Índices para órdenes
CREATE INDEX IF NOT EXISTS idx_ordenes_usuario ON ordenes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON ordenes(estado);
CREATE INDEX IF NOT EXISTS idx_ordenes_email ON ordenes(email_cliente);
CREATE INDEX IF NOT EXISTS idx_ordenes_numero ON ordenes(numero_orden);
CREATE INDEX IF NOT EXISTS idx_ordenes_creada ON ordenes(creada_en DESC);

-- ============================================================================
-- TABLA: RESEÑAS DE PRODUCTOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS resenas (
  id BIGSERIAL PRIMARY KEY,
  producto_id BIGINT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nombre_autor TEXT NOT NULL,
  email_autor TEXT,
  calificacion INT NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
  titulo TEXT NOT NULL,
  contenido TEXT,
  util_count INT DEFAULT 0,
  no_util_count INT DEFAULT 0,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
  creada_en TIMESTAMP DEFAULT NOW(),
  actualizada_en TIMESTAMP DEFAULT NOW()
);

-- Índices para reseñas
CREATE INDEX IF NOT EXISTS idx_resenas_producto ON resenas(producto_id);
CREATE INDEX IF NOT EXISTS idx_resenas_usuario ON resenas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_resenas_calificacion ON resenas(calificacion);
CREATE INDEX IF NOT EXISTS idx_resenas_estado ON resenas(estado);
CREATE INDEX IF NOT EXISTS idx_resenas_creada ON resenas(creada_en DESC);

-- ============================================================================
-- TABLA: CUPONES DE DESCUENTO
-- ============================================================================
CREATE TABLE IF NOT EXISTS cupones (
  id BIGSERIAL PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  tipo TEXT NOT NULL DEFAULT 'porcentaje' CHECK (tipo IN ('porcentaje', 'fijo')),
  valor DECIMAL(10, 2) NOT NULL,
  cantidad_maxima INT,
  cantidad_usada INT DEFAULT 0,
  minimo_compra DECIMAL(10, 2),
  
  fecha_inicio TIMESTAMP NOT NULL,
  fecha_fin TIMESTAMP NOT NULL,
  activo BOOLEAN DEFAULT true,
  
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

-- Índices para cupones
CREATE INDEX IF NOT EXISTS idx_cupones_codigo ON cupones(codigo);
CREATE INDEX IF NOT EXISTS idx_cupones_activo ON cupones(activo);
CREATE INDEX IF NOT EXISTS idx_cupones_fecha ON cupones(fecha_inicio, fecha_fin);

-- ============================================================================
-- TABLA: CONTACTOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS contactos (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT,
  asunto TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN DEFAULT false,
  respondida BOOLEAN DEFAULT false,
  respuesta TEXT,
  
  creada_en TIMESTAMP DEFAULT NOW(),
  respondida_en TIMESTAMP
);

-- Índices para contactos
CREATE INDEX IF NOT EXISTS idx_contactos_email ON contactos(email);
CREATE INDEX IF NOT EXISTS idx_contactos_leida ON contactos(leida);
CREATE INDEX IF NOT EXISTS idx_contactos_creada ON contactos(creada_en DESC);

-- ============================================================================
-- TABLA: CONFIGURACIÓN DEL SITIO
-- ============================================================================
CREATE TABLE IF NOT EXISTS configuracion (
  id BIGSERIAL PRIMARY KEY,
  clave TEXT NOT NULL UNIQUE,
  valor JSONB NOT NULL DEFAULT '{}'::jsonb,
  descripcion TEXT,
  actualizada_en TIMESTAMP DEFAULT NOW()
);

-- Inserciones iniciales de configuración
INSERT INTO configuracion (clave, descripcion) VALUES
  ('tienda_nombre', 'Nombre de la tienda'),
  ('tienda_email', 'Email principal de la tienda'),
  ('tienda_telefono', 'Teléfono de contacto'),
  ('tienda_direccion', 'Dirección física'),
  ('costo_envio_base', 'Costo base de envío'),
  ('tiempo_entrega', 'Tiempo estimado de entrega'),
  ('politica_devolucion', 'Política de devoluciones'),
  ('stripe_public_key', 'Clave pública de Stripe'),
  ('stripe_secret_key', 'Clave secreta de Stripe')
ON CONFLICT (clave) DO NOTHING;

-- ============================================================================
-- FUNCIONES
-- ============================================================================

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para actualizar timestamp
CREATE TRIGGER trigger_actualizar_categorias BEFORE UPDATE ON categorias
FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_actualizar_productos BEFORE UPDATE ON productos
FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_actualizar_carritos BEFORE UPDATE ON carritos
FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_actualizar_ordenes BEFORE UPDATE ON ordenes
FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_actualizar_resenas BEFORE UPDATE ON resenas
FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_actualizar_cupones BEFORE UPDATE ON cupones
FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

-- ============================================================================
-- POLÍTICAS DE SEGURIDAD (RLS - Row Level Security)
-- ============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE carritos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resenas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cupones ENABLE ROW LEVEL SECURITY;
ALTER TABLE contactos ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS: CATEGORÍAS (público lectura, admin escritura)
-- ============================================================================
CREATE POLICY "categorias_lectura_publica" ON categorias
  FOR SELECT USING (activa = true);

CREATE POLICY "categorias_escritura_admin" ON categorias
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'rol' = 'admin')
  );

-- ============================================================================
-- POLÍTICAS: PRODUCTOS (público lectura, admin escritura)
-- ============================================================================
CREATE POLICY "productos_lectura_publica" ON productos
  FOR SELECT USING (activo = true);

CREATE POLICY "productos_escritura_admin" ON productos
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'rol' = 'admin')
  );

-- ============================================================================
-- POLÍTICAS: CARRITOS (usuario propio, anónimo por session)
-- ============================================================================
CREATE POLICY "carritos_lectura_propia" ON carritos
  FOR SELECT USING (
    usuario_id = auth.uid() OR 
    session_id = current_setting('app.session_id', true)
  );

CREATE POLICY "carritos_escritura_propia" ON carritos
  FOR ALL USING (
    usuario_id = auth.uid() OR 
    session_id = current_setting('app.session_id', true)
  );

-- ============================================================================
-- POLÍTICAS: ÓRDENES (usuario propio, admin todas)
-- ============================================================================
CREATE POLICY "ordenes_lectura_propia" ON ordenes
  FOR SELECT USING (
    usuario_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'rol' = 'admin')
  );

CREATE POLICY "ordenes_crear_propias" ON ordenes
  FOR INSERT WITH CHECK (
    usuario_id = auth.uid() OR usuario_id IS NULL
  );

CREATE POLICY "ordenes_actualizar_propias" ON ordenes
  FOR UPDATE USING (
    usuario_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'rol' = 'admin')
  );

-- ============================================================================
-- POLÍTICAS: RESEÑAS (lectura publica aprobadas, usuario puede crear)
-- ============================================================================
CREATE POLICY "resenas_lectura_publica" ON resenas
  FOR SELECT USING (estado = 'aprobada');

CREATE POLICY "resenas_lectura_propias" ON resenas
  FOR SELECT USING (
    usuario_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'rol' = 'admin')
  );

CREATE POLICY "resenas_crear_usuarios" ON resenas
  FOR INSERT WITH CHECK (usuario_id = auth.uid() OR usuario_id IS NULL);

-- ============================================================================
-- POLÍTICAS: CUPONES (lectura admin, creación admin)
-- ============================================================================
CREATE POLICY "cupones_lectura_admin" ON cupones
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'rol' = 'admin')
  );

CREATE POLICY "cupones_gestionar_admin" ON cupones
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'rol' = 'admin')
  );

-- ============================================================================
-- POLÍTICAS: CONTACTOS (usuario crea propio, admin ve todos)
-- ============================================================================
CREATE POLICY "contactos_crear_publico" ON contactos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "contactos_lectura_admin" ON contactos
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'rol' = 'admin')
  );

-- ============================================================================
-- POLÍTICAS: CONFIGURACIÓN (lectura admin, escritura admin)
-- ============================================================================
CREATE POLICY "configuracion_lectura_admin" ON configuracion
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'rol' = 'admin')
  );

CREATE POLICY "configuracion_gestionar_admin" ON configuracion
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'rol' = 'admin')
  );

-- ============================================================================
-- COMENTARIOS Y DESCRIPCIÓN
-- ============================================================================
/*
INSTRUCCIONES DE INSTALACIÓN:

1. Abre Supabase Dashboard
2. Ve a SQL Editor
3. Copia TODO el contenido de este archivo
4. Pégalo en el SQL Editor
5. Haz clic en "Run" (▶️)
6. Espera a que termine sin errores

DESPUÉS:
- Ejecuta el archivo "02_DATOS_PRUEBA.sql" para agregar productos de ejemplo
- Configura las variables de entorno en .env.local
- ¡Tu tienda está lista!

NOTAS DE SEGURIDAD:
- Todas las tablas tienen RLS habilitado
- Los usuarios pueden solo ver/editar sus propios datos
- Los admins tienen acceso total
- Las políticas protegen contra acceso no autorizado

CARACTERÍSTICAS:
✓ Tablas en español
✓ Columnas con tipos seguros
✓ Índices optimizados
✓ Triggers para timestamps
✓ Políticas RLS configuradas
✓ Constraints de integridad
✓ JSONB para datos flexibles
✓ Búsqueda full-text en español
*/

-- ============================================================================
-- FIN DEL SCHEMA
-- ============================================================================
