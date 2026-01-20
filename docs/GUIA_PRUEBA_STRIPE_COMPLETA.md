# 🔐 Guía Completa de Pruebas - Integración Stripe

## 📋 Resumen del Flujo

```
Usuario añade productos al carrito
         ↓
Navega a /checkout
         ↓
Completa datos (nombre, email, dirección)
         ↓
Aplica cupón (opcional, ej: ENVIOGRATIS)
         ↓
Hace clic en "Confirmar Pedido"
         ↓
Se redirige a Stripe Checkout (hosted page)
         ↓
Completa pago con tarjeta de prueba
         ↓
Stripe redirige a /pedido-confirmado?session_id={ID}
         ↓
procesar-stripe.ts crea orden en BD
         ↓
Muestra resumen de la orden con todos los detalles
```

---

## 🧪 Pasos de Prueba (Paso a Paso)

### 1. **Acceder a la tienda**
```
http://localhost:4322/
```

### 2. **Añadir productos al carrito**
- Navega a cualquier categoría de productos
- Haz clic en "Añadir al carrito"
- Repite para 2-3 productos
- Verifica que el ícono del carrito muestre la cantidad correcta

### 3. **Abrir el carrito**
- Haz clic en el ícono del carrito en la esquina superior derecha
- Verifica que se muestren:
  - ✅ Nombres de los productos
  - ✅ Precios en formato español (72,99€)
  - ✅ Cantidades
  - ✅ Subtotal correcto
  - ✅ Botón "Proceder al Pago"

### 4. **Ir al checkout**
- Haz clic en "Proceder al Pago"
- Deberías ver la página `/checkout` con:
  - Formulario de datos personales
  - Campo para cupones
  - Resumen de precio con:
    - Subtotal
    - Descuento (si aplica)
    - Envío (Gratis)
    - Total

### 5. **Probar con cupón (Opcional)**
```
Cupones disponibles para pruebas:
- ENVIOGRATIS: Descuento de 5.99€
- BIENVENIDO10: Descuento 10% del subtotal
```

- Escribe el cupón en el campo
- Haz clic en "Validar Cupón"
- Verifica que el descuento se aplique en el total

### 6. **Completar datos del checkout**
Rellena los campos:
```
Nombre:          Juan Pérez
Email:           juan@email.com
Teléfono:        +34 912 345 678
Dirección:       Calle Principal 123
Ciudad:          Madrid
Provincia:       Madrid
Código Postal:   28001
País:            ES
```

### 7. **Procesar pago con Stripe**
- Haz clic en "Confirmar Pedido"
- Se abrirá la página de Stripe Checkout

### 8. **Completar pago en Stripe**
En la página de Stripe Checkout, completa:

```
TARJETA DE PRUEBA (Pago Exitoso):
Número:          4242 4242 4242 4242
Mes/Año:         12/26 (cualquier fecha futura)
CVC:             123
Nombre:          Test Card

EMAIL DE CONFIRMACIÓN:
(Será el que ingresaste en el checkout)
```

### 9. **Verificar redirección y creación de orden**
Después de hacer clic en "Pagar":

1. **Redirección automática a /pedido-confirmado**
   - URL debería ser: `/pedido-confirmado?session_id=cs_test_XXXX...`

2. **Página debe mostrar**
   - ✅ Checkmark verde indicando pedido confirmado
   - ✅ "¡Gracias por tu compra!"
   - ✅ Número de pedido (ORD-1234567890)
   - ✅ Fecha del pedido
   - ✅ Estado: PAGADO
   - ✅ Listado de productos comprados con cantidades y precios
   - ✅ Desglose: Subtotal, Descuento (si aplica), Envío (Gratis), Total
   - ✅ Botones para "Ver Mis Pedidos" y "Seguir Comprando"

### 10. **Verificar en Base de Datos**
```sql
-- Ver la orden creada
SELECT * FROM ordenes 
ORDER BY created_at DESC 
LIMIT 1;

-- Ver los items de la orden
SELECT * FROM ordenes_items 
WHERE orden_id = 'ID_DE_LA_ORDEN_ANTERIOR'
ORDER BY created_at;
```

Esperado en `ordenes`:
- `numero_orden`: ORD-TIMESTAMP
- `estado`: 'PAGADO'
- `estado_pago`: 'COMPLETADO'
- `email_cliente`: Email ingresado
- `total`: Coincide con lo pagado
- `descuento_aplicado`: Descuento aplicado (0 si no hay)
- `costo_envio`: 0
- `direccion_envio`: JSON con datos completos

Esperado en `ordenes_items`:
- `producto_id`: ID del producto
- `cantidad`: Cantidad comprada
- `precio_unitario`: Precio individual
- `subtotal`: cantidad × precio_unitario

---

## 🧪 Tarjetas de Prueba (Test Cards)

### ✅ Pagos Exitosos
```
4242 4242 4242 4242  →  Pago completado correctamente
5555 5555 5555 4444  →  Mastercard exitoso
```

### ❌ Pagos Declinados
```
4000 0000 0000 0002  →  Tarjeta declinada
4000 0000 0000 9995  →  Fondos insuficientes
```

### ⚠️ Autenticación 3D Secure
```
4000 0025 0000 3155  →  Requiere OTP (use "123456")
```

### 📱 APM (Alternative Payment Methods)
```
4000 0600 0000 0007  →  iDEAL payment
```

---

## 🔍 Depuración

### Verificar logs en navegador
Abre DevTools (F12) → Console:
```
Deberías ver:
- 💳 Procesando sesión de Stripe: cs_test_...
- ✅ Sesión recuperada
- 📦 Información de envío
- ✅ Orden creada desde Stripe
```

### Verificar logs en servidor
En la terminal donde corre `npm run dev`:
```
Deberías ver:
- 💳 Procesando sesión de Stripe
- ✅ Sesión recuperada
- 📦 Información de envío
- ✅ Orden creada
- ✅ X items creados para la orden
- 🗑️ Carrito temporal eliminado
```

### Errores comunes

#### "El pago no fue completado"
- El pago fue declinado o cancelado en Stripe
- Usuario cerró la ventana de Stripe sin completar el pago
- **Solución**: Vuelve a intentar en `/checkout`

#### "Session ID requerido"
- No se pasó correctamente el session_id en la URL
- **Verificar**: La URL debe ser `/pedido-confirmado?session_id=cs_test_...`

#### "No se encontró el pedido"
- La orden no se creó en la BD
- **Verificar**: 
  1. Revisa los logs del servidor
  2. Verifica que Supabase está conectado
  3. Comprueba permisos de RLS en tabla `ordenes`

#### Precios incorrectos en Stripe
- Problema de conversión de centavos
- **Verificar**: En `crear-sesion-stripe.ts` línea que calcula centavos:
  ```typescript
  const centavos = Math.round(parseFloat(precio) * 100);
  ```

---

## 📊 Verificación de Datos

### En la BD después de pagar:
```
ordenes (1 nuevo registro):
- id: UUID
- numero_orden: ORD-1704067200000
- usuario_id: NULL (si no estaba logueado)
- estado: PAGADO
- estado_pago: COMPLETADO
- email_cliente: juan@email.com
- subtotal: 150.50
- descuento_aplicado: 5.99 (si usó ENVIOGRATIS)
- costo_envio: 0
- total: 144.51
- direccion_envio: {"calle": "Calle Principal 123", ...}
- fecha_pago: 2024-01-02T...

ordenes_items (múltiples registros):
- orden_id: (FK de arriba)
- producto_id: 1, 2, 3...
- cantidad: 1, 2, 1...
- precio_unitario: 49.99, 50.50, 50.01...
- subtotal: 49.99, 101.00, 50.01...
- nombre_producto: "Producto X"

carrito_temporal:
- (DEBE ESTAR LIMPIO - debe haber sido eliminado)
```

---

## ✅ Checklist de Validación Final

- [ ] Servidor dev corriendo en http://localhost:4322/
- [ ] Pueden añadir productos al carrito
- [ ] Carrito muestra precios correctos en formato español
- [ ] Página checkout carga correctamente
- [ ] Cupones validan y aplican descuento
- [ ] Botón "Confirmar Pedido" abre Stripe Checkout
- [ ] Página de Stripe Checkout carga
- [ ] Tarjeta de prueba se acepta
- [ ] Redirección a /pedido-confirmado?session_id=...
- [ ] Página muestra "¡Gracias por tu compra!"
- [ ] Muestra número de orden, fecha, estado PAGADO
- [ ] Muestra todos los productos comprados
- [ ] Desglose de precios es correcto
- [ ] Orden aparece en tabla `ordenes` en Supabase
- [ ] Items aparecen en tabla `ordenes_items`
- [ ] Carrito se limpió (carrito_temporal vacío)
- [ ] Botones funcionan (Mis Pedidos, Seguir Comprando)

---

## 🚀 Próximos Pasos

Una vez verificado todo:

1. **Webhooks de Stripe** (recomendado)
   - Configurar en Stripe Dashboard
   - Escuchar eventos: `payment_intent.succeeded`, `checkout.session.completed`
   - Endpoint: `/api/webhooks/stripe`

2. **Email de confirmación** (para producción)
   - Enviar email con detalles de la orden
   - Usar servicio como Sendgrid, Mailgun, AWS SES

3. **Integración con Mi Cuenta**
   - Mostrar orden en "Mis Pedidos"
   - Rastreo de estado del pedido
   - Opción de descargar factura

4. **API Keys Producción**
   - Cambiar test keys por live keys
   - Implementar webhook validation con secret

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs en el navegador (DevTools → Console)
2. Revisa los logs del servidor (terminal)
3. Verifica en Supabase que la orden se creó
4. Comprueba que los .env variables estén correctos
5. Confirma que Stripe está respondiendo (Dashboard)

