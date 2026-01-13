# 🚀 BASE DE DATOS - Instrucciones de Instalación

## ✅ Estado Actual

Tienes **2 archivos SQL** listos para ejecutar en Supabase:

| Archivo | Contenido | Orden |
|---------|----------|-------|
| `01_SCHEMA_BASE.sql` | Schema completo con tablas, índices y políticas RLS | **PRIMERO** |
| `02_DATOS_PRUEBA.sql` | 20 productos de prueba + 5 categorías | **SEGUNDO** |

---

## 🔧 ¿Cómo Instalar en Supabase?

### PASO 1: Abre Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Inicia sesión en tu proyecto **AutoPartsStore**
3. Ve a **SQL Editor** (en el menú izquierdo)

### PASO 2: Ejecuta el Schema
1. Haz clic en **New Query** o **+ New SQL Query**
2. Copia TODO el contenido de `01_SCHEMA_BASE.sql`
3. Pégalo en el editor
4. Haz clic en **Run** (botón azul ▶️)
5. Espera a ver **Success** (sin errores rojos)

**Esto crea:**
- ✓ 8 tablas en español (categorías, productos, órdenes, etc.)
- ✓ Índices optimizados para búsqueda y filtrado
- ✓ Triggers automáticos para timestamps
- ✓ Políticas de seguridad (RLS) configuradas

### PASO 3: Inserta Datos de Prueba
1. **Nueva Query** (New Query)
2. Copia TODO el contenido de `02_DATOS_PRUEBA.sql`
3. Pégalo en el editor
4. Haz clic en **Run** ▶️
5. Verás: **5 rows affected** en categorías + **20 rows affected** en productos

**Esto agrega:**
- ✓ 5 categorías de recambios (Aceites, Filtros, Neumáticos, Frenos, Motor)
- ✓ 20 productos con precios, stock e imágenes placeholder
- ✓ Todo listo para probar la tienda

---

## 📊 Estructura de Tablas Creadas

### 1. **CATEGORÍAS**
Almacena las 6 categorías principales de tu tienda

```
categorias
├── id (BIGINT)
├── nombre (TEXT)
├── slug (TEXT)
├── descripcion (TEXT)
├── icono (TEXT)
├── orden (INT)
├── activa (BOOLEAN)
├── creada_en (TIMESTAMP)
└── actualizada_en (TIMESTAMP)
```

### 2. **PRODUCTOS**
Almacena todos los productos con detalles completos

```
productos
├── id (BIGINT)
├── nombre (TEXT)
├── descripcion (TEXT)
├── precio (DECIMAL)
├── precio_original (DECIMAL) [para descuentos]
├── categoria_id (BIGINT) [referencia a categorías]
├── urls_imagenes (TEXT[])
├── stock (INT)
├── sku (TEXT)
├── destacado (BOOLEAN)
├── activo (BOOLEAN)
├── marca (TEXT)
├── modelo_compatible (TEXT)
├── especificaciones (JSONB) [datos flexibles]
├── creado_en (TIMESTAMP)
└── actualizada_en (TIMESTAMP)
```

### 3. **CARRITOS**
Almacena carritos de usuarios anónimos y registrados

```
carritos
├── id (UUID)
├── usuario_id (UUID) [opcional]
├── session_id (TEXT) [para anónimos]
├── items (JSONB) [items del carrito]
├── cantidad_total (INT)
├── subtotal (DECIMAL)
├── creado_en (TIMESTAMP)
├── actualizado_en (TIMESTAMP)
└── expira_en (TIMESTAMP) [30 días]
```

### 4. **ÓRDENES**
Almacena todas las órdenes de compra

```
ordenes
├── id (BIGINT)
├── numero_orden (TEXT) [ej: ORD-20260109-1]
├── usuario_id (UUID)
├── email_cliente (TEXT)
├── telefono_cliente (TEXT)
├── estado (TEXT) [pendiente|procesando|enviado|entregado|cancelado]
├── direccion_envio (JSONB)
├── costo_envio (DECIMAL)
├── productos (JSONB) [array de items]
├── subtotal (DECIMAL)
├── total (DECIMAL)
├── metodo_pago (TEXT)
├── referencia_pago (TEXT)
├── id_transaccion_stripe (TEXT)
├── notas_cliente (TEXT)
├── notas_internas (TEXT)
├── creada_en (TIMESTAMP)
├── actualizada_en (TIMESTAMP)
└── entregada_en (TIMESTAMP)
```

### 5. **RESEÑAS**
Sistema de comentarios y valoraciones de productos

```
resenas
├── id (BIGINT)
├── producto_id (BIGINT) [referencia a productos]
├── usuario_id (UUID) [opcional]
├── nombre_autor (TEXT)
├── email_autor (TEXT)
├── calificacion (INT) [1-5 estrellas]
├── titulo (TEXT)
├── contenido (TEXT)
├── util_count (INT) [votos positivos]
├── no_util_count (INT) [votos negativos]
├── estado (TEXT) [pendiente|aprobada|rechazada]
├── creada_en (TIMESTAMP)
└── actualizada_en (TIMESTAMP)
```

### 6. **CUPONES**
Sistema de descuentos

```
cupones
├── id (BIGINT)
├── codigo (TEXT)
├── descripcion (TEXT)
├── tipo (TEXT) [porcentaje|fijo]
├── valor (DECIMAL)
├── cantidad_maxima (INT)
├── cantidad_usada (INT)
├── minimo_compra (DECIMAL)
├── fecha_inicio (TIMESTAMP)
├── fecha_fin (TIMESTAMP)
├── activo (BOOLEAN)
├── creado_en (TIMESTAMP)
└── actualizado_en (TIMESTAMP)
```

### 7. **CONTACTOS**
Formulario de contacto

```
contactos
├── id (BIGINT)
├── nombre (TEXT)
├── email (TEXT)
├── telefono (TEXT)
├── asunto (TEXT)
├── mensaje (TEXT)
├── leida (BOOLEAN)
├── respondida (BOOLEAN)
├── respuesta (TEXT)
├── creada_en (TIMESTAMP)
└── respondida_en (TIMESTAMP)
```

### 8. **CONFIGURACIÓN**
Parámetros del sitio

```
configuracion
├── id (BIGINT)
├── clave (TEXT) [nombre del parámetro]
├── valor (JSONB) [valor flexible]
├── descripcion (TEXT)
└── actualizada_en (TIMESTAMP)
```

---

## 🔐 Políticas de Seguridad (RLS)

Todas las tablas tienen **Row Level Security** habilitado:

| Tabla | Lectura | Escritura |
|-------|---------|-----------|
| **categorias** | Pública (activas) | Solo admin |
| **productos** | Pública (activos) | Solo admin |
| **carritos** | Usuario propio o sesión | Usuario propio o sesión |
| **órdenes** | Usuario propio o admin | Usuario propio (crear) / Admin (editar) |
| **reseñas** | Aprobadas públicas | Usuarios (crear) / Admin (moderar) |
| **cupones** | Solo admin | Solo admin |
| **contactos** | Público crear | Admin ver/responder |
| **configuración** | Solo admin | Solo admin |

---

## ✨ Características Especiales

### 🔍 Búsqueda Full-Text en Español
Se puede buscar en nombres y descripciones de productos:

```sql
SELECT * FROM productos 
WHERE to_tsvector('spanish', nombre || ' ' || descripcion) @@ 
      plainto_tsquery('spanish', 'filtro motor')
```

### ⏰ Timestamps Automáticos
Todas las tablas tienen triggers que actualizan automáticamente:
- `creada_en`: Cuando se crea el registro
- `actualizada_en`: Cada vez que se modifica

### 📦 Datos Flexibles con JSONB
- `especificaciones`: Datos dinámicos por producto
- `items` en carritos/órdenes: Flexibilidad máxima
- `direccion_envio`: Direcciones complejas
- `productos` en órdenes: Historial de precios comprados

---

## 🧪 Pruebas Rápidas

### Ver Productos Creados
```sql
SELECT nombre, precio, stock FROM productos LIMIT 10;
```

### Ver Categorías
```sql
SELECT nombre, slug, icono FROM categorias;
```

### Buscar Productos Destacados
```sql
SELECT nombre, precio FROM productos WHERE destacado = true;
```

### Ver Productos por Categoría
```sql
SELECT p.nombre, p.precio, c.nombre as categoria
FROM productos p
JOIN categorias c ON p.categoria_id = c.id
WHERE c.slug = 'frenos'
LIMIT 5;
```

---

## 🛠️ Próximos Pasos

1. ✅ **Ejecutar SQL** en Supabase (hecho arriba)
2. ✅ **Verificar datos** - Abre **Table Editor** en Supabase y ve las tablas creadas
3. 🚀 **Abre tu tienda** - http://localhost:4323
4. 🎨 **Ajusta valores** - Precios, stock, imágenes en Supabase
5. 📱 **Prueba funcionalidad** - Carrito, filtros, búsqueda
6. 🔐 **Configura Stripe** (opcional) - Para pagos reales

---

## ❓ Troubleshooting

### "Invalid API Key" en la tienda
**Solución:** Espera a ejecutar el SQL. Este error es NORMAL hasta que haya datos.

### No veo los productos en la tienda
1. ¿Ejecutaste **ambos** archivos SQL?
2. ¿Sin errores rojos en Supabase?
3. Abre DevTools (F12) → Network → Verifica llamadas a `/api/products`
4. Recarga la página (Ctrl + F5)

### Errores de RLS
Si ves errores de permisos:
- Verifica que `.env.local` tenga las claves correctas
- Asegúrate de usar la **API KEY ANON** (no la SERVICE KEY)

### Quiero agregar más productos
Simplemente copia una inserción de `02_DATOS_PRUEBA.sql` y modifica los valores.

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en terminal (`npm run dev`)
2. Abre Supabase Dashboard → Logs
3. Verifica la pestaña Network en DevTools
4. Comprueba que los datos existan en Supabase (Table Editor)

---

**¡Tu tienda está lista! 🎉**

Ejecuta ambos archivos SQL en Supabase y abre http://localhost:4323 para ver 20 productos en línea.
