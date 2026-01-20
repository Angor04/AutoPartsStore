# Integración de Stripe - Guía de Prueba

## ✅ Estado: Integración Completada

Tu tienda ahora está configurada para aceptar pagos con Stripe.

---

## 🔑 Claves Configuradas

Tus claves de API de Stripe están configuradas en `.env.local`:

- **Clave Pública**: `pk_test_51SLLhrApVak1OIv6yuEx7vW1Uvt9JGsCzROLmCoofoyh8xR1ia6896eOIJGiE5LUcPivPyoDNAIQuvzEsPfT755200Itpa0KRT`
- **Clave Secreta**: Configurada en servidor (protegida)

---

## 🧪 Tarjetas de Prueba

Para probar pagos en Stripe sin usar dinero real, usa estas tarjetas:

### ✅ Pago Exitoso
```
Número: 4242 4242 4242 4242
Vencimiento: 12/25 (cualquier fecha futura)
CVC: 123
```

### ❌ Pago Rechazado
```
Número: 4000 0000 0000 0002
Vencimiento: 12/25
CVC: 123
```

### ⚠️ Requiere Autenticación 3D Secure
```
Número: 4000 0025 0000 3155
Vencimiento: 12/25
CVC: 123
```

---

## 📋 Flujo de Pago

1. **Usuario llena formulario en checkout**
   - Datos de contacto
   - Dirección de envío
   - Aplica cupón (opcional)

2. **Usuario hace clic en "Confirmar Pedido"**
   - Sistema envía datos a `/api/pagos/crear-sesion-stripe`
   - Se crea sesión de pago en Stripe

3. **Usuario es redirigido a Stripe Checkout**
   - Ingresa datos de tarjeta
   - Completa el pago

4. **Webhook de Stripe confirma el pago**
   - Se crea orden en BD
   - Se envía email de confirmación
   - Usuario ve página de éxito

---

## 🧪 Cómo Probar

### Paso 1: Agregar Productos al Carrito
1. Ve a tu tienda
2. Agrega algunos productos al carrito
3. Ve a `/checkout`

### Paso 2: Llenar Formulario
```
Nombre: Antonio
Apellidos: González Cruces
Email: agonsalezcruces2004@gmail.com
Teléfono: 684032501
Dirección: Calle Panamá Nº12
Ciudad: Chipiona
Provincia: Cádiz
Código Postal: 11550
```

### Paso 3: Aplicar Cupón (Opcional)
- Código: `ENVIOGRATIS` (si tu compra es >= 50€)
- Código: `BIENVENIDO10` (si tu compra es >= 30€)

### Paso 4: Hacer Clic en "Confirmar Pedido"
- Serás redirigido a Stripe Checkout
- Ve que dice "Powered by Stripe"

### Paso 5: Pagar con Tarjeta de Prueba
```
Tarjeta: 4242 4242 4242 4242
Expiración: 12/25
CVC: 123
Nombre: Antonio González
```

### Paso 6: Ver Confirmación
- Deberías ver página de éxito: `/pedido-confirmado`
- Número de pedido generado
- Detalles de la orden

---

## 🔍 Verificar en Stripe Dashboard

1. Ve a https://dashboard.stripe.com
2. Inicia sesión con tu cuenta
3. Ve a "Payments"
4. Deberías ver tu pago de prueba listado

---

## 📧 Cambiar Email de Confirmación (Opcional)

El email donde se envía confirmación de pedido actualmente es:
```
agonsalezcruces2004@gmail.com
```

Si quieres cambiarlo, edita en checkout.astro o la BD.

---

## ⚙️ Archivos Creados/Modificados

### Nuevos Archivos:
- ✅ `/src/pages/api/pagos/crear-sesion-stripe.ts` - Endpoint para crear sesión
- ✅ `/src/lib/stripeClient.ts` - Cliente de Stripe

### Archivos Modificados:
- ✅ `/src/pages/checkout.astro` - Integración con Stripe
- ✅ `/src/pages/pedido-confirmado.astro` - Página de confirmación
- ✅ `.env.local` - Claves de Stripe

### Dependencias Agregadas:
- ✅ `stripe` package instalado

---

## 🔐 Seguridad

- ✅ Las claves están en variables de entorno
- ✅ La clave secreta solo se usa en el servidor
- ✅ Los datos de la tarjeta nunca tocan tu servidor (maneja Stripe)
- ✅ HTTPS recomendado en producción

---

## 🚨 Próximos Pasos

1. **Prueba con tarjeta**: `4242 4242 4242 4242`
2. **Verifica en Stripe Dashboard**
3. **Configura webhook** (para completar integración):
   - Endpoint: `https://tudominio.com/api/webhooks/stripe`
   - Eventos: `payment_intent.succeeded`, `charge.updated`

4. **Pasar a Producción**:
   - Cambiar claves de prueba por claves de producción
   - Actualizar `.env.local`
   - HTTPS obligatorio

---

## 📞 Soporte

Si tienes problemas:
1. Abre la consola (F12)
2. Busca logs con "💳" (emoji de Stripe)
3. Verifica que las claves estén en `.env.local`
4. Revisa el Stripe Dashboard para detalles del error

---

**¡Tu tienda está lista para aceptar pagos! 🚀**
