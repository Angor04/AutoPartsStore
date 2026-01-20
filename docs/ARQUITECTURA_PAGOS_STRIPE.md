# 🏗️ Arquitectura Técnica - Sistema de Pagos Stripe

## 📐 Diagrama General del Flujo

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Astro + React)                    │
├─────────────────────────────────────────────────────────────────┤
│
│  1. /products  → AddToCartButton.tsx (agrega al carrito)
│  2. /carrito   → CartDisplay.tsx (muestra carrito)
│  3. /checkout  → Formulario + Cupones
│
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    Form submit a API
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    API /api/pagos/crear-sesion-stripe            │
├─────────────────────────────────────────────────────────────────┤
│
│  1. Recibe: { items, cupones, datos_envio }
│  2. Convierte a formato Stripe line_items
│  3. Calcula subtotal, descuento, total
│  4. Crea sesión con stripe.checkout.sessions.create()
│  5. Retorna: { session_id, url }
│
└─────────────────────────────────────────────────────────────────┘
                              ↓
                         JavaScript
                   window.location = stripe_url
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      STRIPE CHECKOUT (Hosted)                    │
├─────────────────────────────────────────────────────────────────┤
│
│  - Formulario de pago seguro
│  - Múltiples métodos de pago
│  - 3D Secure si es necesario
│  - Validación de tarjeta
│
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    Usuario completa pago
                              ↓
                    Stripe redirige a
                success_url con session_id
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│          /pedido-confirmado?session_id=cs_test_XXXX              │
├─────────────────────────────────────────────────────────────────┤
│
│  Astro (server-side):
│  1. Extrae session_id de la URL
│  2. Fetch POST a /api/pagos/procesar-stripe
│  3. Procesar stripe crea la orden en BD
│  4. Retorna datos de la orden
│  5. Carga detalles completos de Supabase
│
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    Muestra confirmación
                  con detalles de la orden
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BASE DE DATOS (Supabase)                      │
├─────────────────────────────────────────────────────────────────┤
│
│  ordenes:
│    - id, numero_orden, usuario_id
│    - estado, estado_pago
│    - subtotal, descuento_aplicado, costo_envio, total
│    - email_cliente, direccion_envio
│
│  ordenes_items:
│    - orden_id (FK)
│    - producto_id, cantidad, precio_unitario, subtotal
│
│  carrito_temporal:
│    - (se limpia después del pago)
│
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Componentes Técnicos

### 1. **Frontend - Componentes**

#### `checkout.astro`
```
Responsabilidad: Recopilar datos del usuario
├─ Formulario HTML5
│  ├─ Datos personales (nombre, email, teléfono)
│  ├─ Dirección de envío
│  └─ Datos de facturación (opcional)
├─ Carrito actual (muestra resumen)
├─ Cupón (campo para aplicar descuento)
└─ Botón "Confirmar Pedido" → POST /api/pagos/crear-sesion-stripe

Validación:
- HTML5 required (cliente)
- Cupón valida con /api/cupones/validar
- Cantidades se validan contra stock
```

#### `CartDisplay.tsx`
```
Responsabilidad: Mostrar carrito con precios actualizados
├─ Lee desde nanostores (cart store)
├─ Calcula totales en tiempo real
├─ Muestra descuentos aplicados
└─ Sincroniza con sessionStorage (guests)
```

### 2. **Backend - Endpoints de API**

#### `/api/pagos/crear-sesion-stripe.ts`

```typescript
POST /api/pagos/crear-sesion-stripe

REQUEST:
{
  "items": [
    { 
      "producto_id": 1,
      "nombre": "Producto A",
      "cantidad": 2,
      "precio": "49.99"
    },
    { 
      "producto_id": 2,
      "nombre": "Producto B",
      "cantidad": 1,
      "precio": "99.99"
    }
  ],
  "cupones": {
    "codigo": "ENVIOGRATIS",
    "tipo": "cantidad_fija",
    "valor": 5.99
  },
  "usuario_id": "user-uuid" // opcional si no está logueado
}

PROCESAMIENTO:
1. Validar items (cantidad > 0, precio válido)
2. Convertir precios a centavos (€72.99 → 7299 centavos)
3. Calcular subtotal: sum(cantidad × precio para cada item)
4. Aplicar descuento del cupón
5. Total = subtotal - descuento (envío siempre 0)
6. Crear sesión Stripe con:
   - line_items: array de productos y descuentos
   - metadata: información adicional (cupón, descuento, usuario)
   - success_url: /pedido-confirmado?session_id={CHECKOUT_SESSION_ID}
   - cancel_url: /checkout (para reintentar)
7. Retornar session_id y URL

RESPONSE:
{
  "success": true,
  "session_id": "cs_test_1234567890",
  "url": "https://checkout.stripe.com/c/pay/cs_test_1234567890"
}

ERROR RESPONSE:
{
  "success": false,
  "error": "Descripción del error"
}
```

**Conversión de Precios Importante:**
```javascript
// BD y checkout usan €72,99 (dos decimales)
// Stripe requiere centavos como entero: 7299

function convertirACentavos(precioString) {
  const centavos = Math.round(parseFloat(precioString) * 100);
  if (centavos <= 0) throw new Error('Precio debe ser > 0');
  return centavos;
}

// Ejemplo:
convertirACentavos("72.99") → 7299
convertirACentavos("72,99") → 7299
convertirACentavos("0.99") → 99
```

---

#### `/api/pagos/procesar-stripe.ts`

```typescript
POST /api/pagos/procesar-stripe

REQUEST:
{
  "session_id": "cs_test_1234567890"
}

PROCESAMIENTO:
1. Obtener sesión de Stripe
   stripe.checkout.sessions.retrieve(session_id, {
     expand: ['line_items', 'payment_intent']
   })

2. Validar payment_status === 'paid'
   - Si no, retornar error

3. Crear orden en BD:
   INSERT INTO ordenes {
     numero_orden: 'ORD-' + timestamp,
     estado: 'PAGADO',
     estado_pago: 'COMPLETADO',
     email_cliente: session.customer_email,
     subtotal: amount_total / 100 + descuento,
     descuento_aplicado: descuento,
     costo_envio: 0,
     total: amount_total / 100,
     direccion_envio: { shipping_details },
     fecha_pago: NOW()
   }

4. Crear items de la orden:
   Para cada line_item en session.line_items:
     INSERT INTO ordenes_items {
       orden_id: orden.id,
       producto_id: item.metadata.producto_id,
       cantidad: item.quantity,
       precio_unitario: item.price_data.unit_amount / 100,
       subtotal: item.amount_total / 100
     }

5. Limpiar carrito temporal:
   DELETE FROM carrito_temporal WHERE usuario_id = user_id

6. Retornar datos de la orden

RESPONSE:
{
  "success": true,
  "orden_id": "uuid-de-orden",
  "numero_orden": "ORD-1704067200000",
  "email": "usuario@email.com",
  "total": 144.51,
  "items": 3
}
```

**Validaciones Importantes:**
```
✓ payment_status === 'paid' (obligatorio)
✓ session_id válido
✓ Detalles de envío completos
✓ Items con producto_id válido
✗ Si algo falla, NO crear orden
```

---

### 3. **Frontend - Página de Confirmación**

#### `/pedido-confirmado.astro`

```
Responsabilidades:
1. Detectar si viene de Stripe (session_id) o checkout tradicional (orden)

SI ES STRIPE:
  1. Fetch POST a /api/pagos/procesar-stripe con session_id
  2. Esperar confirmación de orden creada
  3. Cargar detalles completos de Supabase
  4. Mostrar confirmación

SI ES CHECKOUT TRADICIONAL:
  1. Cargar directamente de Supabase con orden param
  2. Mostrar confirmación

MUESTRA:
- ✅ Número de orden (ORD-TIMESTAMP)
- ✅ Fecha
- ✅ Estado: PAGADO
- ✅ Listado de productos con imágenes
- ✅ Desglose de precios:
   - Subtotal
   - Descuento (si aplica)
   - Envío (Gratis)
   - Total
- ✅ Instrucciones siguientes
- ✅ Botones de acción
```

---

## 🗄️ Schema de Base de Datos

### Tabla: `ordenes`

```sql
CREATE TABLE ordenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_orden VARCHAR(50) UNIQUE NOT NULL,
  usuario_id UUID REFERENCES users(id),
  estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    -- PENDIENTE, PAGADO, ENVIADO, ENTREGADO, CANCELADO
  estado_pago VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    -- PENDIENTE, COMPLETADO, FALLIDO, REEMBOLSADO
  email_cliente VARCHAR(255) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  descuento_aplicado DECIMAL(10,2) DEFAULT 0,
  costo_envio DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  
  direccion_envio JSONB,
    -- { calle, ciudad, provincia, codigo_postal, pais, nombre }
  telefono_envio VARCHAR(20),
  
  cupon_id UUID REFERENCES cupones(id),
  stripe_session_id VARCHAR(255) UNIQUE,
  stripe_payment_intent_id VARCHAR(255),
  
  notas TEXT,
  fecha_pago TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabla: `ordenes_items`

```sql
CREATE TABLE ordenes_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  nombre_producto VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 💾 Flujo de Datos - Ejemplo Completo

```
PASO 1: Usuario en /checkout
────────────────────────────
Estado: Carrito en memory (nanostores)
Items en sessionStorage:
{
  "cart-uuid123": {
    "items": [
      { "producto_id": 1, "nombre": "Pastillas", "cantidad": 2, "precio": "49.99" },
      { "producto_id": 2, "nombre": "Aceite", "cantidad": 1, "precio": "89.99" }
    ]
  }
}

Cupón: ENVIOGRATIS
Subtotal: 189.97€
Descuento: 5.99€
Envío: Gratis
Total: 183.98€

────────────────────────────
PASO 2: Submit form → crear-sesion-stripe.ts
────────────────────────────
ENVÍA:
{
  "items": [
    { "producto_id": 1, "cantidad": 2, "precio": "49.99" },
    { "producto_id": 2, "cantidad": 1, "precio": "89.99" }
  ],
  "cupones": { "codigo": "ENVIOGRATIS", "valor": 5.99 },
  "usuario_id": null
}

PROCESA:
line_items = [
  {
    price_data: {
      currency: 'eur',
      unit_amount: 4999,  // 49.99€ × 100
      product_data: { name: 'Pastillas' }
    },
    quantity: 2
  },
  {
    price_data: {
      currency: 'eur',
      unit_amount: 8999,  // 89.99€ × 100
      product_data: { name: 'Aceite' }
    },
    quantity: 1
  },
  {
    price_data: {
      currency: 'eur',
      unit_amount: -599,  // -5.99€ × 100 (descuento negativo)
      product_data: { name: 'Descuento ENVIOGRATIS' }
    },
    quantity: 1
  }
]

amount_total = 4999×2 + 8999 + (-599) = 18398 centavos = 183.98€

RETORNA:
{
  "success": true,
  "session_id": "cs_test_4eC39HqLyjWDarRTy",
  "url": "https://checkout.stripe.com/c/pay/cs_test_4eC39HqLyjWDarRTy"
}

────────────────────────────
PASO 3: Usuario en Stripe Checkout
────────────────────────────
- Ingresa tarjeta: 4242 4242 4242 4242
- Completa datos
- Hace clic "Pagar"
- Stripe procesa el pago ✅

────────────────────────────
PASO 4: Stripe redirige a success_url
────────────────────────────
Redirige a:
/pedido-confirmado?session_id=cs_test_4eC39HqLyjWDarRTy

────────────────────────────
PASO 5: /pedido-confirmado.astro
────────────────────────────
detecta session_id en URL
Llama a procesar-stripe.ts con:
{
  "session_id": "cs_test_4eC39HqLyjWDarRTy"
}

────────────────────────────
PASO 6: procesar-stripe.ts
────────────────────────────
1. Recupera sesión de Stripe
   payment_status: 'paid' ✓

2. Crea orden en BD:
INSERT INTO ordenes VALUES (
  id: '550e8400-e29b-41d4-a716-446655440000',
  numero_orden: 'ORD-1704067200000',
  usuario_id: NULL,
  estado: 'PAGADO',
  estado_pago: 'COMPLETADO',
  email_cliente: 'juan@email.com',
  subtotal: 189.97,
  descuento_aplicado: 5.99,
  costo_envio: 0,
  total: 183.98,
  direccion_envio: {
    "nombre": "Juan Pérez",
    "calle": "Calle Principal 123",
    "ciudad": "Madrid",
    "provincia": "Madrid",
    "codigo_postal": "28001",
    "pais": "ES"
  },
  stripe_session_id: 'cs_test_4eC39HqLyjWDarRTy',
  fecha_pago: NOW()
);

3. Crea items:
INSERT INTO ordenes_items VALUES
  (UUID, orden_id, 1, 2, 49.99, 99.98, 'Pastillas'),
  (UUID, orden_id, 2, 1, 89.99, 89.99, 'Aceite');

4. Limpia carrito:
DELETE FROM carrito_temporal WHERE usuario_id IS NULL;

5. Retorna:
{
  "success": true,
  "orden_id": "550e8400-e29b-41d4-a716-446655440000",
  "numero_orden": "ORD-1704067200000",
  "email": "juan@email.com",
  "total": 183.98,
  "items": 2
}

────────────────────────────
PASO 7: Página muestra confirmación
────────────────────────────
✅ Gracias por tu compra!

Número de pedido: ORD-1704067200000
Fecha: 2 de enero de 2024
Estado: PAGADO
Total: 183,98€

Productos Comprados:
- Pastillas × 2 = 99,98€
- Aceite × 1 = 89,99€

Desglose:
Subtotal:        189,97€
Descuento:       -5,99€
Envío:           Gratis
Total:           183,98€

────────────────────────────
ESTADO FINAL EN BD
────────────────────────────
ordenes (1 row):
  ORD-1704067200000, PAGADO, 183.98€

ordenes_items (2 rows):
  Pastillas ×2, Aceite ×1

carrito_temporal: VACÍO ✓
```

---

## 🔐 Seguridad

### Validaciones

```typescript
✓ Session ID debe existir en Stripe
✓ Payment status debe ser 'paid'
✓ Email debe ser válido
✓ Amount debe coincidir (server-side verification)
✓ Usuario logueado no puede acceder a órdenes de otros
✓ RLS en Supabase protege datos
```

### Variables de Entorno

```
PUBLIC_STRIPE_PUBLISHABLE_KEY   // Para frontend (público)
STRIPE_SECRET_KEY                // Para backend (secreto, .env.local)
```

**⚠️ NUNCA compartir STRIPE_SECRET_KEY**

---

## 🐛 Manejo de Errores

```
Error: "El pago no fue completado"
├─ Causa: payment_status !== 'paid'
└─ Solución: Usuario reintenta en /checkout

Error: "Error al crear la orden"
├─ Causa: Problema con Supabase RLS o conexión
└─ Solución: Revisar logs, verificar RLS policies

Error: "Session ID requerido"
├─ Causa: URL sin parameter session_id
└─ Solución: Stripe redirige correctamente a success_url

Error: "No se encontró el pedido"
├─ Causa: Orden no creada en BD
└─ Solución: Revisar logs de procesar-stripe.ts
```

---

## 📊 Monitoreo en Producción

### En Stripe Dashboard
```
✓ Revisar pagos exitosos
✓ Revisar pagos fallidos
✓ Monitorear disputas
✓ Verificar webhooks
✓ Revisar API calls
```

### En Supabase
```
✓ Revisar tabla ordenes
✓ Monitorear storage
✓ Revisar errores de RLS
✓ Ver logs de funciones
```

### En Logs de Servidor
```
✓ Búsqueda de errores 💳, ✅, ❌
✓ Tiempos de respuesta
✓ Errores de Stripe
✓ Fallos de BD
```

---

## 🔄 Versiones de Stripe API

```
Versión actual: 2023-10-16
Reason: Compatible con todas las features necesarias

Cambiar versión en:
- /api/pagos/crear-sesion-stripe.ts línea 8
- /api/pagos/procesar-stripe.ts línea 8

Verificar compatibilidad en:
https://stripe.com/docs/upgrades/api-versions
```

