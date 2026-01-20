# 🚀 Guía de Migración a Producción - Stripe

## ⚠️ ANTES DE IR A PRODUCCIÓN

### Checklist Pre-Producción

- [ ] Todos los tests pasaron
- [ ] Probaste con tarjetas reales (optional)
- [ ] Email de confirmación implementado
- [ ] Webhooks de Stripe configurados
- [ ] HTTPS configurado
- [ ] RLS policies de Supabase verificadas
- [ ] Variables de ambiente en producción

---

## 📋 Pasos para Migrar a Producción

### 1️⃣ Obtener Live API Keys

**En Stripe Dashboard**:
```
1. Login en https://dashboard.stripe.com
2. Ir a: Settings → API Keys
3. Cambiar a "Production" (switch arriba a la derecha)
4. Copiar:
   - Publishable key (comienza con pk_live_)
   - Secret key (comienza con sk_live_)
```

### 2️⃣ Actualizar .env.local

```bash
# ANTES (Test)
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SLLhrApVak1OIv...
STRIPE_SECRET_KEY=sk_test_51SLLhrApVak1OIv...

# DESPUÉS (Production)
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51SLLhrApVak1OIv...
STRIPE_SECRET_KEY=sk_live_51SLLhrApVak1OIv...
```

**⚠️ IMPORTANTE**: 
- ✅ NUNCA commit estas keys a GitHub
- ✅ Usar GitHub Secrets si uses CI/CD
- ✅ Rotar keys si fueron expuestas

### 3️⃣ Verificar Variables de Ambiente en Hosting

Si usas Vercel, Netlify, etc.:

```
Dashboard → Settings → Environment Variables

Agregar:
- PUBLIC_STRIPE_PUBLISHABLE_KEY (valor live)
- STRIPE_SECRET_KEY (valor live)
```

### 4️⃣ Actualizar URLs en Stripe Dashboard

**En Stripe Dashboard** → Settings → Business settings:

```
a) API Keys: Verificar que sean live ✓

b) Webhooks (opcional pero recomendado):
   Endpoint URL: https://tu-dominio.com/api/webhooks/stripe
   Events to send:
     - payment_intent.succeeded
     - payment_intent.payment_failed
     - checkout.session.completed
     - checkout.session.expired
```

### 5️⃣ Actualizar Domain en Código

En `src/pages/api/pagos/crear-sesion-stripe.ts`:

```typescript
// ANTES (desarrollo)
success_url: `${import.meta.env.SITE}/pedido-confirmado?session_id={CHECKOUT_SESSION_ID}`,
cancel_url: `${import.meta.env.SITE}/checkout`,

// DESPUÉS (asegurate que SITE sea tu dominio de producción)
// import.meta.env.SITE debería ser: https://tudominio.com
```

En `astro.config.mjs`:

```javascript
export default defineConfig({
  site: 'https://tudominio.com',  // ← Cambiar a tu dominio
  // ... resto de config
});
```

### 6️⃣ Probar Antes de Lanzar (Recomendado)

```bash
# 1. Build local
npm run build

# 2. Previsualizar build
npm run preview

# 3. Probar flujo completo en localhost
#    (con keys de test primero)

# 4. Deploy a staging environment
#    (con keys de live)

# 5. Test final en staging

# 6. Deploy a producción
```

---

## 🔐 Seguridad en Producción

### Variables Sensibles

**NUNCA HACER**:
```javascript
❌ console.log(import.meta.env.STRIPE_SECRET_KEY)
❌ Enviar keys al frontend
❌ Commitar .env.local a Git
❌ Hardcodear valores en código
```

**SIEMPRE HACER**:
```javascript
✅ Usar variables de ambiente
✅ Keys secretas solo en backend (.ts en /api/)
✅ PUBLIC_ prefix solo para keys públicas
✅ Validar en servidor lado
✅ Mantener .env.local en .gitignore
```

### Validaciones en Servidor

```typescript
// Siempre validar montos en servidor
// No confiar en input del cliente

function validarMontoProduccion(monto: number) {
  if (monto <= 0) throw new Error('Monto inválido');
  if (monto > 9999999) throw new Error('Monto muy alto');
  return Math.round(monto * 100); // centavos
}
```

### RLS Policies en Supabase

Verificar que solo usuarios autenticados puedan:
```sql
-- Ver sus propias órdenes
SELECT * FROM ordenes WHERE usuario_id = auth.uid();

-- Crear órdenes
INSERT INTO ordenes (usuario_id, ...) 
WHERE usuario_id = auth.uid();

-- NO puedan ver órdenes de otros
-- (RLS debería prevenir esto)
```

---

## 📧 Email de Confirmación (Recomendado)

### Integrar SendGrid (Opción 1)

```typescript
// .env.local
SENDGRID_API_KEY=SG.xxxxx

// En procesar-stripe.ts
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(import.meta.env.SENDGRID_API_KEY);

await sgMail.send({
  to: session.customer_email,
  from: 'pedidos@tudominio.com',
  subject: 'Pedido confirmado - ' + numero_orden,
  html: generarHTMLConfirmacion(orden, items)
});
```

### Integrar Mailgun (Opción 2)

```typescript
// .env.local
MAILGUN_API_KEY=xxxxx
MAILGUN_DOMAIN=sandbox-xxxxx.mailgun.org

// Usar @mailgun/mailgun.js
```

### Email Template Básico

```html
<h1>¡Pedido confirmado!</h1>
<p>Número: {{numero_orden}}</p>
<p>Total: {{total}}€</p>

<h3>Productos:</h3>
<ul>
  {{#each items}}
  <li>{{nombre}} x {{cantidad}} = {{subtotal}}€</li>
  {{/each}}
</ul>

<p>Gracias por tu compra!</p>
```

---

## 🔔 Webhooks de Stripe (Recomendado)

### Crear Endpoint

```typescript
// src/pages/api/webhooks/stripe.ts

import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabase';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);
const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

export const POST = async ({ request }) => {
  try {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    // Verificar webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      webhookSecret
    );

    // Manejar eventos
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Marcar orden como pagada
        break;

      case 'payment_intent.payment_failed':
        // Notificar error de pago
        break;

      case 'checkout.session.completed':
        // Crear orden si aún no existe
        break;
    }

    return new Response(JSON.stringify({ received: true }));
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400 }
    );
  }
};
```

### Configurar en Stripe Dashboard

```
1. Settings → Webhooks
2. Crear nuevo endpoint
3. URL: https://tudominio.com/api/webhooks/stripe
4. Eventos a escuchar:
   - payment_intent.succeeded
   - payment_intent.payment_failed
   - checkout.session.completed
5. Copiar secret (Signing secret)
6. Guardar en .env.local como STRIPE_WEBHOOK_SECRET
```

---

## 📊 Monitoreo en Producción

### En Stripe Dashboard

```
1. Ir a: Payments → Payments
2. Ver todos los pagos
3. Revisar fallos
4. Monitorear ingresos

Dashboard → Developers → Webhooks
- Ver logs de webhook
- Verificar entregas
- Buscar problemas
```

### En Supabase

```sql
-- Ver últimas órdenes
SELECT * FROM ordenes 
ORDER BY created_at DESC 
LIMIT 10;

-- Ver órdenes sin procesar
SELECT * FROM ordenes 
WHERE estado = 'PENDIENTE';

-- Estadísticas
SELECT COUNT(*), SUM(total), AVG(total)
FROM ordenes
WHERE created_at > NOW() - INTERVAL '30 days';
```

### En Logs de Servidor

```
Buscar:
- 💳 Sesión creada
- ✅ Orden creada
- ❌ Errores

Si hay errores:
1. Ver stack trace
2. Revisar en BD
3. Revisar en Stripe Dashboard
4. Check logs de Supabase
```

---

## 🧪 Testing en Producción

### Con Tarjetas Reales (Stripe Test Mode)

```
Stripe tiene modo de test en producción:

1. En Dashboard: Settings → Developer Mode
2. Activar "Test Mode"
3. Usar test cards:
   4242 4242 4242 4242 (éxito)
4. Desactivar Test Mode cuando listo
```

### Sin Usar Dinero Real

```
✅ Stripe nunca carga dinero en test mode
✅ Las transacciones son ficticias
✅ Los datos se sincronizan como si fuera real
✅ Seguro para testing final
```

---

## ⚠️ Errores Comunes en Producción

### Error: "Invalid API Key"
```
Causa: Keys de test en ambiente de producción
Solución: Cambiar a live keys en .env variables
```

### Error: "Domain not registered"
```
Causa: success_url con dominio incorrecto
Solución: Verificar dominio en astro.config.mjs
```

### Error: "Permission denied"
```
Causa: RLS policies en Supabase
Solución: Revisar policies, asegurar que permitan inserts
```

### Error: "Webhook signature invalid"
```
Causa: Wrong webhook secret
Solución: Copiar correctamente del Stripe Dashboard
```

---

## 📋 Checklist Final Antes de Lanzar

### Código
- [ ] Todos los console.log de debug removidos
- [ ] Variables de environment correctas
- [ ] No hay secrets hardcodeados
- [ ] Tests pasan
- [ ] Build genera sin errores

### Stripe
- [ ] Live API keys configuradas
- [ ] Webhook configurado y funcionando
- [ ] Email de confirmación enviándose
- [ ] Monitoreo activo en dashboard

### Base de Datos
- [ ] RLS policies en lugar
- [ ] Backups configurados
- [ ] Índices en tablas importantes
- [ ] Versiones de datos correctas

### Aplicación
- [ ] HTTPS activo
- [ ] Dominio correcto
- [ ] Variables de ambiente en servidor
- [ ] Logs habilitados para debugging

### Documentación
- [ ] Team conoce el sistema
- [ ] Documentación actualizada
- [ ] Runbooks para problemas comunes
- [ ] Contactos de soporte

---

## 🚨 Plan de Contingencia

### Si algo sale mal en producción

```
1. Immediately:
   - Cambiar a test keys si es crítico
   - Notificar a equipo
   - Empezar a investigar

2. Investigar:
   - Ver logs de servidor
   - Ver logs de Stripe
   - Ver logs de Supabase
   - Ejecutar queries de diagnóstico

3. Comunicar:
   - Informar a clientes afectados
   - Dar ETA de fix
   - Actualizaciones cada 30 min

4. Resolver:
   - Hotfix si es necesario
   - Rollback si es necesario
   - Verificar todos los datos

5. Post-mortem:
   - ¿Qué salió mal?
   - ¿Cómo prevenirlo?
   - Mejorar testing/monitoring
```

---

## 📞 Contactos Importantes

### Stripe Support
- Web: https://support.stripe.com/
- Dashboard: https://dashboard.stripe.com/ → Help

### Supabase Support
- Web: https://supabase.com/support
- Docs: https://supabase.com/docs

### Tu Team
- [Añadir contactos locales]

---

## ✅ Señales de Éxito

Después de lanzar, verificar:

- [ ] Órdenes se crean en BD
- [ ] Precios son correctos
- [ ] Emails se envían
- [ ] Stripe dashboard muestra pagos
- [ ] Confirmaciones llegan a usuarios
- [ ] Sin errores en logs después de 1 hora
- [ ] Sin errores en logs después de 24 horas
- [ ] Usuarios reportan todo OK

---

**Último Checklist**: ✅ LISTO PARA PRODUCCIÓN

**Cuando estés seguro**: Deploy! 🚀

