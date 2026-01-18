# 📚 GUÍA COMPLETA DE INTEGRACIÓN - SISTEMA ECOMMERCE AVANZADO

**Autor:** GitHub Copilot  
**Fecha:** Enero 2026  
**Versión:** 1.0 - Producción  
**Nivel de Dificultad:** Intermedio-Avanzado  

---

## 📋 TABLA DE CONTENIDOS

1. [Requisitos Previos](#requisitos-previos)
2. [Paso 1: Configurar Base de Datos](#paso-1-configurar-base-de-datos)
3. [Paso 2: Instalar Dependencias](#paso-2-instalar-dependencias)
4. [Paso 3: Configurar Variables de Entorno](#paso-3-configurar-variables-de-entorno)
5. [Paso 4: Validar APIs](#paso-4-validar-apis)
6. [Paso 5: Integrar Componentes](#paso-5-integrar-componentes)
7. [Paso 6: Configurar Email](#paso-6-configurar-email)
8. [Paso 7: Pruebas Completas](#paso-7-pruebas-completas)
9. [Paso 8: Despliegue](#paso-8-despliegue)

---

## ✅ Requisitos Previos

Antes de comenzar, asegúrate de tener:

- **Proyecto Astro 5.16.7+** con Supabase configurado ✓
- **Acceso a Supabase Dashboard** (Project Settings > API Keys)
- **Node.js 18+** instalado
- **Terminal/Git Bash** para ejecutar comandos
- **Editor Visual Studio Code** (recomendado)
- **Cuenta en Resend o SendGrid** (para emails - solo si quieres enviar)

**Tu proyecto ya tiene:** TypeScript strict, Tailwind CSS, componentes Astro

---

## Paso 1: Configurar Base de Datos

### 1.1 Ejecutar Schema SQL en Supabase

**⏱️ TIEMPO:** 5-10 minutos

Este paso crea todas las tablas, funciones y políticas de seguridad.

**Instrucciones:**

1. Abre [https://app.supabase.com](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **SQL Editor** (panel izquierdo)
4. Haz clic en **"New Query"**
5. Copia todo el contenido de `/docs/02_ADVANCED_SCHEMA.sql`
6. Pégalo en el editor
7. Haz clic en **"RUN"** (botón verde arriba)
8. **Espera a que termine** (sin errores)

**¿Cómo saber si funcionó?**

- ✅ Sin mensajes de error rojo
- ✅ En el panel izquierdo ves las nuevas tablas bajo "Tables"
- ✅ Puedes ejecutar: `SELECT * FROM cupones;` (debería retornar tabla vacía)

**Qué se creó:**

```
📊 TABLAS (7):
├── newsletter_suscriptores        (Email + códigos)
├── cupones                         (Descuentos)
├── cupones_usados                 (Auditoría)
├── ordenes                         (Órdenes expandidas)
├── ordenes_items                  (Líneas de orden)
├── solicitudes_devolucion         (Devoluciones)
└── ordenes_historial              (Auditoría)

⚙️ FUNCIONES SQL (3):
├── cancelar_pedido_atomico()       (Transaccional)
├── validar_cupon()                (Validación)
└── generar_codigo_descuento()      (Código único)

🔐 POLÍTICAS RLS:
├── ordenes: Solo propietario
├── devoluciones: Solo propietario
└── newsletter: Público + usuario
```

### 1.2 Verificar Creación

Ejecuta esta consulta en SQL Editor para confirmar:

```sql
-- Debería retornar nombres de todas las tablas nuevas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('newsletter_suscriptores', 'cupones', 'ordenes', 'solicitudes_devolucion');

-- Debería retornar 3 funciones
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
AND routine_name LIKE 'cancelar%' OR routine_name LIKE 'validar%' OR routine_name LIKE 'generar%';
```

**Salida esperada:**

```
table_name
──────────────────────────
newsletter_suscriptores
cupones
ordenes_items
solicitudes_devolucion
ordenes_historial

routine_name
──────────────────────────
cancelar_pedido_atomico
validar_cupon
generar_codigo_descuento
```

---

## Paso 2: Instalar Dependencias

### 2.1 Verificar Instalaciones Existentes

Abre la terminal en tu proyecto y ejecuta:

```bash
cd c:\Users\agonz\Desktop\2DAM\Sistemas de gestion empresarial\fashionstore

# Ver versiones actuales
npm list --depth=0
```

**Deberías ver:**

```
fashionstore@1.0.0
├── astro@5.16.7
├── typescript@5.x.x
├── tailwindcss@3.x.x
└── @supabase/supabase-js@2.x.x
```

### 2.2 Instalar Nuevas Dependencias (Si Necesario)

Para email, instala **una de estas opciones:**

**Opción A: Resend (Recomendado para desarrollo)**

```bash
npm install resend
```

**Opción B: SendGrid**

```bash
npm install @sendgrid/mail
```

**Opción C: Nodemailer (Para SMTP manual)**

```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

---

## Paso 3: Configurar Variables de Entorno

### 3.1 Crear .env.local

En la raíz del proyecto, crea/edita el archivo `.env.local`:

```bash
# SUPABASE (Ya deberías tener estos)
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJxx...

SUPABASE_SERVICE_ROLE_KEY=eyJxx...

# EMAIL - Elige UNO:

# Resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx

# SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxx

# SMTP manual (opcional)
SMTP_HOST=smtp.tu-email.com
SMTP_PORT=587
SMTP_USER=tu-email@domain.com
SMTP_PASS=tu-contraseña-aplicacion

# Configuración de negocio
EMAIL_FROM=noreply@fashionstore.com
ADMIN_EMAIL=admin@fashionstore.com
EMPRESA_NOMBRE=Fashion Store
EMPRESA_DOMICILIO="Calle de la Moda 123, Madrid"
```

### 3.2 Obtener Keys de Supabase

Si aún no los tienes:

1. Ve a **Supabase Dashboard** > tu proyecto
2. Haz clic en **⚙️ Settings** (abajo a la izquierda)
3. Ve a **API** (panel izquierdo)
4. Copia:
   - `Project URL` → `PUBLIC_SUPABASE_URL`
   - `anon public` → `PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`

### 3.3 Configurar Email (Elegir una opción)

#### **Opción A: Resend (Más fácil)**

1. Ve a [https://resend.com](https://resend.com)
2. Crea cuenta gratuita
3. Ve a **API Keys** (panel izquierdo)
4. Copia la key y pégala en `.env.local` como `RESEND_API_KEY`

**Código en tu API (ejemplo):**

```typescript
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

await resend.emails.send({
  from: import.meta.env.EMAIL_FROM,
  to: email,
  subject: '¡Bienvenido a Fashion Store!',
  html: `<p>Tu código: <strong>${codigo}</strong></p>`
});
```

#### **Opción B: SendGrid**

1. Ve a [https://sendgrid.com](https://sendgrid.com)
2. Crea cuenta (free tier: 100 emails/día)
3. Ve a **Settings** > **API Keys**
4. Crea una key y cópiala en `.env.local`

**Código en tu API:**

```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(import.meta.env.SENDGRID_API_KEY);

await sgMail.send({
  to: email,
  from: import.meta.env.EMAIL_FROM,
  subject: '¡Bienvenido a Fashion Store!',
  html: `<p>Tu código: <strong>${codigo}</strong></p>`
});
```

---

## Paso 4: Validar APIs

### 4.1 Iniciar servidor de desarrollo

```bash
npm run dev
```

La aplicación está disponible en: **http://localhost:4321**

### 4.2 Validar cada endpoint

#### **A. Password Change (cambiar-contrasena)**

**URL:** `POST http://localhost:4321/api/cambiar-contrasena`

**Cuerpo (JSON):**

```json
{
  "contraseniaActual": "mi-password-actual",
  "contraseniaNueva": "mi-password-nuevo",
  "confirmacion": "mi-password-nuevo"
}
```

**Header:**

```
Authorization: Bearer {TU_JWT_TOKEN}
Content-Type: application/json
```

**Respuesta esperada:**

```json
{
  "success": true,
  "mensaje": "Contraseña actualizada correctamente",
  "usuario_id": "uuid..."
}
```

#### **B. Newsletter (newsletter/suscribir)**

**URL:** `POST http://localhost:4321/api/newsletter/suscribir`

**Cuerpo:**

```json
{
  "email": "usuario@example.com",
  "usuario_id": "uuid-del-usuario",
  "recibe_ofertas": true
}
```

**Respuesta esperada:**

```json
{
  "success": true,
  "mensaje": "¡Suscripción exitosa!",
  "codigo_descuento": "DESC20260117AB23CD",
  "descuento_porcentaje": 10,
  "valido_dias": 30
}
```

#### **C. Validar Cupón (cupones/validar)**

**URL:** `POST http://localhost:4321/api/cupones/validar`

**Cuerpo:**

```json
{
  "codigo_cupon": "DESC10EUR",
  "usuario_id": "uuid-del-usuario",
  "subtotal": 50
}
```

**Respuesta esperada:**

```json
{
  "valido": true,
  "descuento": 10.00,
  "total_con_descuento": 40.00,
  "cupon_id": "uuid..."
}
```

**Si no es válido:**

```json
{
  "valido": false,
  "error": "El código ha expirado",
  "descuento": 0
}
```

#### **D. Cancelar Orden (pedidos/cancelar)**

**URL:** `POST http://localhost:4321/api/pedidos/cancelar`

**Cuerpo:**

```json
{
  "orden_id": "uuid-de-orden",
  "usuario_id": "uuid-del-usuario"
}
```

**Respuesta esperada:**

```json
{
  "success": true,
  "mensaje": "Pedido cancelado y reembolso procesado",
  "orden_cancelada": {
    "id": "uuid",
    "estado": "CANCELADO",
    "fecha_cancelacion": "2026-01-17T10:30:00Z"
  }
}
```

#### **E. Solicitar Devolución (pedidos/solicitar-devolucion)**

**URL:** `POST http://localhost:4321/api/pedidos/solicitar-devolucion`

**Cuerpo:**

```json
{
  "orden_id": "uuid-de-orden",
  "usuario_id": "uuid-del-usuario",
  "motivo": "defectuoso",
  "descripcion": "El producto llegó con defecto en la costura"
}
```

**Respuesta esperada:**

```json
{
  "success": true,
  "devolucion": {
    "numero_etiqueta": "DEV-1705494600000-ABCD1234",
    "estado": "SOLICITADA",
    "monto_reembolso": 89.99
  },
  "instrucciones": {
    "direccion": "Calle de la Moda 123, Madrid",
    "plazo_reembolso": "5-7 días hábiles"
  }
}
```

---

## Paso 5: Integrar Componentes

### 5.1 Componentes Disponibles

Ya están creados:

```
✓ MisPedidos.astro          → Lista de pedidos + cancelación + devolución
✓ CarritoCheckout.astro     → Carrito con cupones
✓ NewsletterPopup.astro     → Popup de descuento
✓ CambiarContraseña.astro   → Formulario de cambio de password
```

### 5.2 Integrar en tus páginas

#### **En página de perfil/cuenta (`src/pages/perfil/index.astro`):**

```astro
---
import MisPedidos from '@/components/MisPedidos.astro';
import CambiarContraseña from '@/components/forms/CambiarContraseña.astro';
---

<div class="perfil-container">
  <h1>Mi Perfil</h1>
  
  <!-- Cambiar contraseña -->
  <section class="seccion-cambiar-password">
    <h2>Seguridad</h2>
    <CambiarContraseña />
  </section>

  <!-- Mis pedidos -->
  <section class="seccion-pedidos">
    <h2>Mis Pedidos</h2>
    <MisPedidos pedidos={misPedidos} usuarioId={usuarioId} />
  </section>
</div>
```

#### **En página de carrito (`src/pages/carrito.astro`):**

```astro
---
import CarritoCheckout from '@/components/checkout/CarritoCheckout.astro';
---

<div class="carrito-page">
  <h1>Mi Carrito</h1>
  <CarritoCheckout
    items={cartItems}
    usuarioId={user.id}
    subtotal={calcularSubtotal()}
    impuestos={calcularImpuestos()}
    costoEnvio={5.99}
  />
</div>
```

#### **En layout principal (`src/layouts/PublicLayout.astro`):**

```astro
---
import NewsletterPopup from '@/components/NewsletterPopup.astro';
---

<html>
  <head>
    <!-- ... -->
  </head>
  <body>
    <slot />
    
    {/* Newsletter popup - aparecerá en todas las páginas */}
    <NewsletterPopup delayMs={5000} mostrarAlSalir={true} />
  </body>
</html>
```

---

## Paso 6: Actualizar APIs para enviar Emails

### 6.1 Newsletter - Enviar email bienvenida

Edita `/src/pages/api/newsletter/suscribir.ts`:

**Reemplaza esta sección:**

```typescript
// Placeholder para envío de email
console.log(`
  📧 ENVIAR EMAIL A: ${email}
  Asunto: ¡Bienvenido a Fashion Store!
  Cuerpo: Tu código de descuento es ${codigo_descuento}
`);
```

**Con esto (Resend):**

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

try {
  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'noreply@fashionstore.com',
    to: email,
    subject: '¡Bienvenido a Fashion Store! 🎉',
    html: `
      <h1>¡Bienvenido!</h1>
      <p>Hemos creado un código especial para ti.</p>
      <p><strong>Tu código de descuento (10% OFF):</strong></p>
      <p style="font-size: 24px; font-weight: bold; color: #667eea;">
        ${codigo_descuento}
      </p>
      <p>Este código es válido por ${validoUntilDays} días.</p>
      <p><a href="https://fashionstore.com/productos">Ir a tienda</a></p>
    `
  });
} catch (error) {
  console.error('Error enviando email:', error);
  // No fallar si el email no se envía
}
```

### 6.2 Devolución - Enviar instrucciones de envío

Edita `/src/pages/api/pedidos/solicitar-devolucion.ts`:

**Reemplaza:**

```typescript
console.log(`
  📧 ENVIAR EMAIL CON INSTRUCCIONES DE DEVOLUCIÓN
  Etiqueta: ${numero_etiqueta}...
`);
```

**Con:**

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

try {
  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: usuario.email,
    subject: 'Tu Devolución ha sido Aceptada 📦',
    html: `
      <h2>Devolución Aceptada</h2>
      <p>Número de Etiqueta: <strong>${numero_etiqueta}</strong></p>
      
      <h3>Instrucciones de Envío:</h3>
      <p>
        <strong>Dirección de Devolución:</strong><br>
        ${process.env.EMPRESA_DOMICILIO}
      </p>
      <p>
        1. Coloca la etiqueta en el paquete<br>
        2. Lleva a correo/mensajería<br>
        3. Recibirás reembolso en 5-7 días hábiles
      </p>
      
      <p><strong>Monto a Reembolsar:</strong> €${monto_reembolso.toFixed(2)}</p>
    `
  });
} catch (error) {
  console.error('Error enviando email:', error);
}
```

### 6.3 Cancelación - Confirmar reembolso

Edita `/src/pages/api/pedidos/cancelar.ts`:

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

try {
  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: usuario.email,
    subject: 'Tu Pedido ha sido Cancelado ✓',
    html: `
      <h2>Cancelación Confirmada</h2>
      <p>Número de Orden: <strong>${orden.numero_orden}</strong></p>
      <p>Monto de Reembolso: <strong>€${orden.total.toFixed(2)}</strong></p>
      <p>El reembolso se procesará en 5-7 días hábiles.</p>
    `
  });
} catch (error) {
  console.error('Error enviando email:', error);
}
```

---

## Paso 7: Pruebas Completas

### 7.1 Flujo de Compra Completo

```
1. Usuario se registra en Supabase Auth
2. Aparece popup de newsletter después de 5 segundos
3. Usuario ingresa email y recibe código de descuento
4. Usuario navega a productos y agrega al carrito
5. Usuario va a carrito
6. Aplica el código de descuento (debería restar 10%)
7. Completa la compra
8. Va a "Mis Pedidos"
9. Ve su pedido con estado PAGADO
```

### 7.2 Flujo de Cancelación

```
1. En "Mis Pedidos", orden con estado PAGADO
2. Hace clic en "Cancelar Pedido"
3. Confirma la cancelación
4. Orden cambia a CANCELADO
5. Stock se restaura automáticamente
6. Recibe email de confirmación
7. Reembolso se procesa en 5-7 días
```

### 7.3 Flujo de Devolución

```
1. En "Mis Pedidos", orden con estado ENTREGADO
2. Hace clic en "Solicitar Devolución"
3. Completa formulario (motivo + descripción)
4. Recibe número de etiqueta
5. Envía el producto
6. Después de recibir, obtengo reembolso
7. Email con fecha de reembolso
```

### 7.4 Testing Script (Copia en consola del navegador)

```javascript
// Test 1: Validar cupón
fetch('/api/cupones/validar', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    codigo_cupon: 'DESC10EUR',
    usuario_id: 'test-user-id',
    subtotal: 50
  })
}).then(r => r.json()).then(d => console.log('Test 1 (Cupón):', d));

// Test 2: Newsletter
fetch('/api/newsletter/suscribir', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    usuario_id: 'test-user-id',
    recibe_ofertas: true
  })
}).then(r => r.json()).then(d => console.log('Test 2 (Newsletter):', d));
```

---

## Paso 8: Despliegue

### 8.1 Pre-despliegue Checklist

- [ ] `.env.local` tiene todas las variables
- [ ] `SUPABASE_SERVICE_ROLE_KEY` está configurado
- [ ] Email (Resend/SendGrid) está configurado
- [ ] Todos los endpoints pasan pruebas
- [ ] BD tiene datos de prueba
- [ ] RLS policies están activas en Supabase

### 8.2 Variables en Producción

En tu plataforma de hosting (Vercel, Netlify, etc.):

1. Ve a **Settings** > **Environment Variables**
2. Añade cada variable de `.env.local`:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY` (o `SENDGRID_API_KEY`)
   - `EMAIL_FROM`
   - Resto de variables

3. Re-deploy la aplicación

### 8.3 Deployment en Vercel (Ejemplo)

```bash
# Push a GitHub
git add .
git commit -m "feat: ecommerce system with coupons and returns"
git push

# Vercel detecta el push automáticamente
# Va a: https://app.vercel.com > tu proyecto
# Click "Deployments" > esperar a que termine
```

---

## 🎯 Checklist Final

- [ ] Schema SQL ejecutado sin errores
- [ ] Todas las 7 tablas visibles en Supabase
- [ ] 3 funciones SQL creadas
- [ ] `.env.local` configurado
- [ ] Email configurado (Resend/SendGrid)
- [ ] APIs responden correctamente
- [ ] Componentes integrados en páginas
- [ ] Pruebas de flujo completas pasadas
- [ ] Variables de producción configuradas
- [ ] Despliegue exitoso

---

## 🆘 Solución de Problemas

### "Error: Could not find the 'cupones' table"

**Causa:** Schema SQL no se ejecutó correctamente

**Solución:**
1. Ve a Supabase SQL Editor
2. Ejecuta: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
3. Si no ves `cupones`, ejecuta nuevamente `/docs/02_ADVANCED_SCHEMA.sql`

### "Error validating coupon: RLS policy violation"

**Causa:** RLS policies no están configuradas

**Solución:**
1. En Supabase, ve a **Authentication** > **Policies**
2. Verifica que haya policies para `cupones`, `ordenes`, etc.
3. Si no hay, ejecuta el schema SQL completo nuevamente

### "Endpoint returns 500 error"

**Causa:** Falta configuración en `.env.local`

**Solución:**
1. Verifica que `SUPABASE_SERVICE_ROLE_KEY` está en `.env.local`
2. Reinicia servidor: `npm run dev`
3. Revisa logs en consola

### "Email no se envía"

**Causa:** API key de Resend/SendGrid incorrecta

**Solución:**
1. Verifica que `RESEND_API_KEY` está correctamente en `.env.local`
2. Para Resend, debe empezar con `re_`
3. Para SendGrid, debe empezar con `SG.`
4. Reinicia servidor

---

## 📞 Soporte Adicional

**Documentación:**
- [Supabase Docs](https://supabase.com/docs)
- [Astro Docs](https://docs.astro.build)
- [Resend Docs](https://resend.com/docs)

**Comunidad:**
- Discord de Supabase: supabase.com/discord
- Discord de Astro: astro.build/chat

---

**¡Listo! Tu sistema eCommerce está listo para producción.**
