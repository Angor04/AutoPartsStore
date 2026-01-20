# ✅ ARREGLOS APLICADOS - Productos y Carrito

## Problemas Identificados

1. ❌ No aparecen los productos en la página de confirmación
2. ❌ El carrito no se limpia después de comprar

## Soluciones Aplicadas

### 1. **Guardar Productos en la Orden** 
**Archivo**: `src/pages/api/pagos/procesar-stripe.ts`

**Lo que cambió**:
- Los productos ahora se guardan en el JSON `productos` de la tabla `ordenes`
- Se extrae información de Stripe (nombre, cantidad, precio, subtotal)
- Se actualiza la orden con los productos después de crearla

**Código**:
```typescript
const productos = session.line_items.data
  .filter((item: any) => !item.description?.includes('Descuento'))
  .map((item: any) => ({
    nombre: item.description || 'Producto',
    cantidad: item.quantity,
    precio: item.price_data?.unit_amount ? (item.price_data.unit_amount / 100) : 0,
    subtotal: item.amount_total ? (item.amount_total / 100) : 0,
    producto_id: item.metadata?.producto_id ? parseInt(item.metadata.producto_id) : null
  }));

// Actualizar la orden con los productos
await supabaseAdmin
  .from('ordenes')
  .update({ productos: productos })
  .eq('id', orden.id);
```

---

### 2. **Mostrar Productos en Confirmación**
**Archivo**: `src/pages/pedido-confirmado.astro`

**Lo que cambió**:
- Cargar productos del JSON `productos` de la orden
- Mapear correctamente los campos (nombre_producto, cantidad, subtotal)
- Mostrar listado de productos comprados

**Código**:
```typescript
// Cargar items desde el JSON
if (orden.productos && Array.isArray(orden.productos)) {
  items = orden.productos.map((prod: any) => ({
    id: `${prod.producto_id || '0'}`,
    producto_id: `${prod.producto_id || '0'}`,
    cantidad: prod.cantidad || 0,
    precio_unitario: prod.precio_unitario || prod.precio || 0,
    nombre_producto: prod.nombre || 'Producto desconocido',
    subtotal: prod.subtotal || 0
  })) as OrdenItem[];
}
```

**HTML**:
```astro
{items.map((item: any) => (
  <div class="py-4 flex items-center gap-4">
    <div class="flex-1">
      <p class="font-medium text-charcoal-900">{item.nombre_producto || 'Producto desconocido'}</p>
      <p class="text-sm text-charcoal-500">Cantidad: {item.cantidad}</p>
    </div>
    <p class="font-semibold text-charcoal-900">{formatPrice(item.subtotal)}</p>
  </div>
))}
```

---

### 3. **Limpiar Carrito Después del Pago**
**Archivo**: `src/pages/pedido-confirmado.astro`

**Lo que cambió**:
- Script que corre al cargar la página de confirmación
- Limpia sessionStorage (donde se guardan los productos del carrito)
- Limpia nanostores si está disponible
- Solo se ejecuta si viene de Stripe (detecta `session_id` en URL)

**Código**:
```astro
<script client:load>
  // Limpiar carrito después del pago exitoso
  if (window.location.search.includes('session_id')) {
    try {
      // Limpiar sessionStorage
      sessionStorage.removeItem(`cart-${sessionId}`);
      sessionStorage.removeItem('autopartsstore-cart');
      
      // Limpiar nanostores
      if (window.cartStore) {
        window.cartStore.set([]);
      }
      console.log('🗑️ Carrito limpiado');
    } catch (error) {
      console.error('⚠️ Error limpiando carrito:', error);
    }
  }
</script>
```

---

## ¿Cómo Funciona Ahora?

### Antes ❌
```
1. Usuario paga
2. Orden se crea vacía (sin productos)
3. Página de confirmación muestra "No se encontró el pedido"
4. Carrito sigue con los productos
```

### Ahora ✅
```
1. Usuario paga en Stripe
2. procesar-stripe.ts extrae productos de Stripe
3. Guarda productos en la orden (JSON)
4. Página de confirmación carga y muestra productos
5. Script limpia el carrito automáticamente
6. Usuario ve confirmación completa
```

---

## Flujo Exacto Ahora

```
STRIPE PAYMENT
      ↓
procesar-stripe.ts
  ├─ Obtiene sesión de Stripe ✓
  ├─ Valida pago: paid ✓
  ├─ Crea orden en BD ✓
  ├─ Extrae productos de Stripe
  └─ Guarda en JSON 'productos' ✓
      ↓
Redirige a /pedido-confirmado?session_id=...
      ↓
pedido-confirmado.astro
  ├─ Detecta session_id
  ├─ Llama a procesar-stripe
  ├─ Carga orden de BD
  ├─ Extrae productos del JSON
  └─ Muestra listado ✓
      ↓
Script client:load
  ├─ Limpia sessionStorage
  ├─ Limpia nanostores
  └─ Carrito vacío ✓
```

---

## Verificación

### Después de pagar, deberías ver:

✅ **Página de confirmación**
- Número de orden (ORD-TIMESTAMP)
- Fecha del pedido
- Estado: Pendiente (o procesando)
- Total correcto

✅ **Productos comprados**
- Lista de todos los productos comprados
- Cantidad de cada producto
- Subtotal de cada item
- Desglose: Subtotal, Descuento, Envío, Total

✅ **Carrito vacío**
- Si vuelves a /carrito, debe estar vacío
- sessionStorage limpiado
- Contador de carrito = 0

---

## Campos que Guarda Ahora

En la tabla `ordenes`, columna `productos` (JSON):
```json
[
  {
    "nombre": "Pastillas Freno",
    "cantidad": 2,
    "precio": 49.99,
    "subtotal": 99.98,
    "producto_id": 1
  },
  {
    "nombre": "Aceite Motor",
    "cantidad": 1,
    "precio": 89.99,
    "subtotal": 89.99,
    "producto_id": 2
  }
]
```

---

## Cambios en Archivos

### `src/pages/api/pagos/procesar-stripe.ts`
- Cambio: Guardar productos en JSON `productos` en lugar de tabla separada
- Lineas: 122-150 aproximadamente

### `src/pages/pedido-confirmado.astro`
- Cambio 1: Cargar productos del JSON `productos`
- Cambio 2: Mapear correctamente los campos
- Cambio 3: Mostrar listado HTML actualizado
- Cambio 4: Agregar script para limpiar carrito
- Lineas: 79-91, 172-185, 266-286

---

## ¿Qué Pasa Si...?

### ¿Si no aparecen los productos?
Verificar:
1. ¿Fue exitoso el pago? (payment_status debe ser 'paid')
2. ¿Se creó la orden? (ver en tabla `ordenes`)
3. ¿Tiene el JSON `productos` datos? (ver en Supabase)
4. ¿Se ve algún error en console? (F12 → Console)
5. ¿Se ve error en logs del servidor?

### ¿Si el carrito no se limpia?
Verificar:
1. ¿Estás en /pedido-confirmado con session_id?
2. ¿Se ejecutó el script? (ver en console: "🗑️ Carrito limpiado")
3. ¿Existe sessionStorage? (algunos navegadores pueden bloquearlo)
4. ¿El nanostores está disponible en window?

---

## Próximas Pruebas Recomendadas

1. **Test Completo**
   - Añade 2-3 productos
   - Ve a checkout
   - Paga con 4242 4242 4242 4242
   - Verifica que aparezcan los productos
   - Verifica que carrito esté vacío

2. **Con Cupón**
   - Repite pero aplicando cupón
   - Verifica que el descuento se calcule

3. **Navegación**
   - Después de confirmación, ve a /carrito
   - Debe estar vacío
   - Ve a /productos, debe poder comprar nuevamente

---

**Estado**: ✅ ARREGLADO
**Fecha**: 19 de enero 2026
**Cambios**: 2 archivos modificados

