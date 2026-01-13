# FashionStore - Arquitectura Técnica Detallada

## 🏗️ Decisiones Arquitectónicas

### 1. ¿Por qué Astro 5.0 Híbrido?

**Astro híbrido (SSG + SSR)** proporciona el mejor balance:

```
Catálogo (SSG) ✅ SEO perfecto, velocidad máxima
  └─ /productos → Pre-renderizado en build
  └─ /categoria/[slug] → Pre-renderizado en build
  └─ /productos/[slug] → Pre-renderizado en build

Interactividad (SSR) ✅ Dinámico en tiempo real
  └─ /carrito → Renderizado en servidor
  └─ /admin/* → Protegido y dinámico

Islas (React) ✅ Interactividad específica
  └─ AddToCartButton → Solo código JavaScript necesario
  └─ CartIcon → Actualiza en tiempo real
```

**Alternativas consideradas:**
- Next.js: ❌ Overhead de API routes no necesarias
- Vue: ❌ Menos comunidad e integraciones
- React puro: ❌ Pierde beneficios de SSG

### 2. ¿Por qué Supabase?

**Ventajas clave:**

| Feature | Supabase | Firebase | Directa DB |
|---------|----------|----------|-----------|
| PostgreSQL | ✅ Nativa | ❌ NoSQL | ✅ Nativa |
| Auth integrada | ✅ | ✅ | ❌ |
| Storage buckets | ✅ | ✅ | ❌ |
| RLS automática | ✅ | ❌ | ❌ |
| SQL queries | ✅ | ❌ | ✅ |
| Transacciones | ✅ | ❌ | ✅ |
| Precio | $ | $$ | $ |

**Decisión**: Supabase porque ofrece SQL nativo + RLS + Auth en un único servicio.

### 3. ¿Por qué Nano Stores para el carrito?

```
Estado del Carrito (Necesidades):
  ├─ Persistencia entre navegaciones ✅
  ├─ Reactividad en tiempo real ✅
  ├─ Bajo tamaño (2kb minificado) ✅
  ├─ No requiere servidor ✅
  └─ Compatible con Astro ✅
```

**Alternativas rechazadas:**
- Redux: ❌ Overkill para carrito simple
- Zustand: ✅ Alternativa válida pero más pesada
- Context API: ❌ No es SSG-friendly
- LocalStorage solo: ❌ No reactivo

### 4. Flujo de Actualización de Stock (Atomicidad)

```javascript
// ❌ INCORRECTO - Race condition
const stock = getStock(productId); // 5
if (stock > 0) {
  updateStock(productId, stock - 1); // Problema si dos personas compran simultáneamente
}

// ✅ CORRECTO - Transacción atómica
const { error } = await admin
  .from('products')
  .update({ stock: stock - 1 })
  .eq('id', productId)
  .eq('stock', stock); // Garantiza que no cambió entre lectura y escritura
```

**Implementación**: Verificamos que `stock` no cambió entre lectura y actualización.

## 🔐 Seguridad Implementada

### 1. RLS (Row Level Security)

```sql
-- Ejemplo: Productos públicos pero solo admin puede editar
CREATE POLICY "products_read_public" ON products
  FOR SELECT USING (true); -- Todos ven

CREATE POLICY "products_write_admin" ON products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated'); -- Solo autenticados
```

### 2. Environment Variables

```javascript
// ❌ NUNCA expongas el SERVICE_KEY en el cliente
const SUPABASE_SERVICE_KEY = import.meta.env.SUPABASE_SERVICE_KEY;

// ✅ Solo en servidor (Astro SSR)
export async function getSupabaseAdmin() {
  return createClient(URL, SERVICE_KEY); // Ejecuta en servidor
}
```

### 3. Middleware de Autenticación

```javascript
// src/middleware.ts protege /admin
if (isProtectedRoute && !authHeader) {
  return context.redirect('/admin/login');
}
```

## 📈 Escalabilidad

### Catálogo SSG

```
Build (npm run build):
  productos.astro + 1000 productos = 1000 HTML files
  └─ Cada página es completamente estática
  └─ CDN puede cachear al máximo (1 año)
  
Resultado: 0ms latencia en lectura
```

### Admin SSR

```
Cada request a /admin:
  └─ Renderizado dinámico en servidor
  └─ Con datos actuales de BD
  
Resultado: Cambios instantáneos
```

## 💳 Integración de Pagos (Fase 2)

### Flujo con Stripe

```
Cliente en /carrito
  ↓
POST /api/checkout (SSR endpoint)
  ↓
Backend verifica stock con transacción
  ↓
Crea Stripe PaymentIntent
  ↓
Retorna cliente secret al frontend
  ↓
Stripe.js maneja pagos securo
  ↓
Webhook /api/webhooks/stripe
  ↓
Marca order como "completed"
  ↓
Email de confirmación al cliente
```

**Archivos necesarios (no incluidos aún):**
- `/api/checkout` - Crear PaymentIntent
- `/api/webhooks/stripe` - Procesar confirmación
- `/pages/checkout.astro` - UI de pago

## 🚀 Despliegue en Coolify

### Dockerfile

```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
EXPOSE 3000
CMD ["npm", "preview"]
```

### Variables en Coolify

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_KEY=xxxxx
SUPABASE_STORAGE_BUCKET=products-images
SITE_URL=https://tudominio.com
NODE_ENV=production
```

## 📊 Monitoreo y Logs

### En Desarrollo

```bash
npm run dev
# Abre http://localhost:3000
# Los errores aparecen en terminal
```

### En Producción

```bash
# Ver logs en Coolify dashboard
# O:
docker logs [container_id]
```

## 🎨 Guía de Estilos

### Componentes Base

```astro
<!-- Botón Primario -->
<Button variant="primary" size="md">Enviar</Button>

<!-- Botón Secundario -->
<Button variant="secondary">Cancelar</Button>

<!-- Botón Outline -->
<Button variant="outline">Más info</Button>
```

### Colores

```css
/* Navy (primario) */
.bg-navy-500 /* #1f4e78 */

/* Gold (acentos) */
.bg-gold-500 /* #d4af37 */

/* Charcoal (texto) */
.text-charcoal-900 /* #0a1820 */

/* Ivory (fondo claro) */
.bg-ivory-50 /* #fffbf7 */
```

### Tipografía

```css
/* Títulos */
h1, h2, h3 { font-family: "Cormorant Garamond"; }

/* Textos */
p, span { font-family: "Inter"; }
```

## 🔄 Flujos de Trabajo

### Agregar un Nuevo Producto

1. **Ir a** `/admin/productos/nuevo`
2. **Llenar** formulario (nombre, descripción, precio, stock)
3. **Subir** máximo 5 imágenes (drag & drop)
4. **Click** en "Crear Producto"
5. **Resultado**: Automáticamente aparece en `/productos` y `/`

### Editar Stock Tras Venta

```javascript
// Automático en /api/checkout
await checkAndUpdateStock(productId, quantity);
// El stock en BD se actualiza atomáticamente
```

## 🧪 Testing (Fase 3)

### Casos de Prueba Críticos

```javascript
// 1. Stock se descuenta correctamente
test("Comprar reduce stock", () => {
  // Pre: stock = 5
  // Action: Comprar 2
  // Post: stock = 3
});

// 2. Carrito persiste en recarga
test("Carrito persiste en localStorage", () => {
  // Agregar item
  // Recargar página
  // Item debe seguir ahí
});

// 3. RLS impide acceso no autorizado
test("No puedo editar producto sin auth", () => {
  // POST /api/producto/update sin token
  // Debe fallar con 401
});
```

## 📚 Referencias Importantes

### Documentación Oficial
- [Astro Docs - Hybrid Rendering](https://docs.astro.build/en/guides/server-side-rendering/)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Nano Stores API](https://github.com/nanostores/nanostores#api)

### Artículos Relevantes
- E-commerce SSG vs SSR tradeoffs
- Atomicidad en transacciones PostgreSQL
- Seguridad en aplicaciones con RLS

---

**Versión**: 0.1.0
**Actualizado**: Enero 2025
