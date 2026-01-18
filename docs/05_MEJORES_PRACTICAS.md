# 💡 MEJORES PRÁCTICAS Y TIPS AVANZADOS

**Documento:** Guía de Mejores Prácticas  
**Nivel:** Avanzado  
**Audiencia:** Desarrolladores y Administradores  

---

## 🎯 Tabla de Contenidos

1. [Seguridad](#seguridad)
2. [Performance](#performance)
3. [Escalabilidad](#escalabilidad)
4. [Mantenimiento](#mantenimiento)
5. [Monetización](#monetización)
6. [Analytics](#analytics)
7. [Troubleshooting](#troubleshooting)

---

## 🔐 Seguridad

### 1.1 Validación en Múltiples Capas

**NUNCA confíes solo en validación frontend:**

```typescript
// ❌ MALO - Solo frontend
function aplicarCupon(codigo) {
  // Frontend solo verifica formato
  if (codigo.length < 3) return;
  // ... resto de lógica
}

// ✅ BUENO - Frontend + Backend + BD
// 1. Frontend: valida formato/longitud (UX)
// 2. Backend: valida usuario y suscripción (lógica)
// 3. BD (SQL): valida TODO (seguridad)
```

### 1.2 RLS como Última Línea de Defensa

```sql
-- SIEMPRE agrega RLS a tablas sensibles:
CREATE POLICY "users_read_own_orders" ON ordenes
  USING (usuario_id = auth.uid());

-- Esto es IMPOSIBLE de saltarse:
-- - Hacker intenta: SELECT * FROM ordenes;
-- - BD automáticamente filtra: WHERE usuario_id = auth.uid()
-- - Resultado: Solo ve sus propias órdenes
```

### 1.3 Encriptación de Datos Sensibles

Para datos muy sensibles (números de tarjeta, SSN, etc.):

```typescript
// Usar pgcrypto en Supabase:
CREATE EXTENSION pgcrypto;

-- Crear tabla con encriptación:
CREATE TABLE tarjetas_guardadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  numero_encriptado bytea,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insertar encriptado:
INSERT INTO tarjetas_guardadas (usuario_id, numero_encriptado)
VALUES (
  auth.uid(),
  pgp_sym_encrypt('4111111111111111', 'your-secret-key')
);

-- Leer desencriptado:
SELECT pgp_sym_decrypt(numero_encriptado::bytea, 'your-secret-key')
FROM tarjetas_guardadas;
```

### 1.4 Auditoría Completa

```typescript
// En cada operación sensible, log:

// Cambio de contraseña
INSERT INTO cambios_contrasena (usuario_id, timestamp, ip_origen)
VALUES (auth.uid(), NOW(), request.ip);

// Cancelación de orden
INSERT INTO ordenes_historial (orden_id, estado_anterior, estado_nuevo, usuario_id)
VALUES (orden_id, 'PAGADO', 'CANCELADO', auth.uid());

// Importante: Esto es automático con nuestros SQL functions
```

---

## ⚡ Performance

### 2.1 Optimización de Queries

```sql
-- ❌ LENTO - Sin índices
SELECT * FROM ordenes WHERE usuario_id = 'xxx';
-- Búsqueda lineal: O(n)

-- ✅ RÁPIDO - Con índice
CREATE INDEX idx_ordenes_usuario ON ordenes(usuario_id);
SELECT * FROM ordenes WHERE usuario_id = 'xxx';
-- Búsqueda indexada: O(log n)
```

**Nuestro schema YA tiene índices** en campos frecuentemente buscados:

```sql
-- Ya creados:
CREATE INDEX idx_cupones_codigo ON cupones(codigo);
CREATE INDEX idx_cupones_activo ON cupones(activo);
CREATE INDEX idx_devoluciones_usuario ON solicitudes_devolucion(usuario_id);
```

### 2.2 Caché en Frontend

```typescript
// Cachear códigos generados en localStorage
const generarCodigonewsletter = async (email) => {
  // Primero, chequear si ya está en caché
  const cached = localStorage.getItem(`codigo_${email}`);
  if (cached) return cached; // Retornar inmediatamente
  
  // Si no, hacer API call
  const response = await fetch('/api/newsletter/suscribir', {...});
  const { codigo } = await response.json();
  
  // Guardar en caché por 30 días
  localStorage.setItem(`codigo_${email}`, codigo);
  localStorage.setItem(`codigo_exp_${email}`, Date.now() + 30*24*60*60*1000);
  
  return codigo;
};
```

### 2.3 Lazy Loading de Componentes

```astro
---
// src/pages/carrito.astro

// BUENO: Carga sincrónica (necesario)
import CarritoCheckout from '@/components/checkout/CarritoCheckout.astro';

// MEJOR: Lazy loading (opcional)
const NewsletterPopup = (await import('@/components/NewsletterPopup.astro')).default;
---

<main>
  <CarritoCheckout {...props} />
  
  {/* Newsletter solo carga si usuario scrollea hasta abajo */}
  <NewsletterPopup delayMs={5000} client:idle />
</main>
```

### 2.4 Compression y Minificación

**Astro lo hace automáticamente**, pero verifica:

```bash
# Verificar tamaño de bundle
npm run build

# Debe mostrar algo como:
# > dist/index.html        0.8 kb
# > dist/about.html        0.9 kb
# Total build: 45.2 kb (gzip: 12.1 kb)
```

---

## 📈 Escalabilidad

### 3.1 Prepararse para Crecimiento

```
Usuarios       Acciones/mes    Strategy
────────────────────────────────────────
0-1,000        0-10,000        Actual (Free tier)
1,000-10,000   10k-100k        Upgrade Supabase Pro
10,000-100k    100k-1m         Team Plan + Vercel Pro
100k+          1m+             Enterprise + Load balancing
```

### 3.2 Connection Pooling

Para muchos usuarios simultáneos:

```javascript
// En servidor Vercel/Netlify, usar PgBouncer:

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    // PgBouncer endpoint (menos conexiones, más eficiencia)
    auth: {
      persistSession: false, // No guardar sesión en servidor
    }
  }
);
```

### 3.3 Batch Operations

```typescript
// ❌ INEFICIENTE - 1000 queries
for (const cupon of cupones) {
  await db.from('cupones').update({...});
}

// ✅ EFICIENTE - 1 query
await db.from('cupones').upsert(cupones);
```

---

## 🛠️ Mantenimiento

### 4.1 Backup y Recovery

```bash
# Supabase hace backups automáticos
# Pero TÚ también debes hacer backups:

# Exportar datos regularmente
pg_dump -h db.supabase.co \
        -U postgres \
        -d postgres \
        > backup-$(date +%Y%m%d).sql

# Guardar en: Google Drive / Dropbox / AWS S3
```

### 4.2 Monitoreo de Errores

```typescript
// Integrar Sentry para errores en producción

import * as Sentry from "@sentry/astro";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

// Cualquier error se reporta automáticamente:
try {
  await validarCupon(...);
} catch (error) {
  Sentry.captureException(error); // Reportar a Sentry
  throw error;
}
```

### 4.3 Logs Centralizados

```typescript
// Usar LogRocket o similar para sesiones de usuario:

import LogRocket from 'logrocket';

LogRocket.init('app-id');

// Ahora puedes reproducir sessions de usuarios con problemas
// Muy útil para debugging
```

### 4.4 Rotación de Secrets

Cada 90 días:

```bash
# 1. Generar nuevas API keys en Supabase
# 2. Actualizar .env variables
# 3. Re-deploy en Vercel
# 4. Verificar que todo funciona
# 5. (Opcional) Revocar antigua key
```

---

## 💰 Monetización

### 5.1 Estrategia de Descuentos

```
Tipo de Descuento       Cuando Usar           Impact
─────────────────────────────────────────────────────
Bienvenida (10%)        Newsletter signup     +40% conversión
Bulk (5% cada 5 items)  Compra grande        +15% AOV
Seasonal (20-50%)       Black Friday/Nav      +100% ventas
VIP exclusivos (20%)    Programa lealtad      +25% lifetime value
Referido (€5 fixed)     Share con amigos      +30% customer acq
```

### 5.2 Programa de Lealtad

```typescript
// Tabla de puntos (agregar a schema):
CREATE TABLE loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  puntos INT DEFAULT 0,
  nivel VARCHAR(20) DEFAULT 'BRONCE', -- BRONCE, PLATA, ORO, PLATINO
  created_at TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

// Reglas:
// - €1 gastado = 1 punto
// - 100 puntos = €5 cupón (5% de valor)
// - Cada nivel tiene beneficios:
//   PLATA (500 pts): +5% OFF
//   ORO (1000 pts): +10% OFF + envío gratis
//   PLATINO (2000 pts): +15% OFF + VIP support
```

### 5.3 Upsell y Cross-sell

```astro
<!-- Ver en carrito -->
<div class="recomendaciones">
  <h3>Complementos Populares</h3>
  <!-- Mostrar productos relacionados -->
  
  <!-- Si compra zapatos, sugerir medias -->
  <!-- Si compra camiseta, sugerir chaqueta -->
</div>
```

---

## 📊 Analytics

### 6.1 Google Analytics 4

```astro
---
// Layout principal
import { GOOGLE_ANALYTICS_ID } from '@/lib/constants';
---

<html>
  <head>
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id={GOOGLE_ANALYTICS_ID}"></script>
    <script define:vars={{ GOOGLE_ANALYTICS_ID }}>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', GOOGLE_ANALYTICS_ID);
    </script>
  </head>
  <body>
    <slot />
  </body>
</html>
```

```typescript
// Tracking de eventos importante

// Newsletter signup
gtag('event', 'newsletter_signup', {
  email: email.split('@')[0] // No guardar email completo
});

// Aplicar cupón
gtag('event', 'coupon_applied', {
  coupon_code: codigo,
  discount_amount: descuento,
  cart_value: subtotal
});

// Cancelar orden
gtag('event', 'order_cancelled', {
  order_id: orden_id,
  cancellation_reason: 'customer_requested'
});
```

### 6.2 Dashboard Custom

```typescript
// Crear views custom en Supabase:

CREATE VIEW kpis_diarios AS
SELECT
  DATE(creado_en) as fecha,
  COUNT(DISTINCT usuario_id) as usuarios_unicos,
  COUNT(*) as ordenes_creadas,
  SUM(total) as ingresos,
  AVG(total) as ticket_promedio,
  COUNT(DISTINCT caso when estado = 'CANCELADO' THEN id END) as canceladas
FROM ordenes
GROUP BY DATE(creado_en)
ORDER BY fecha DESC;
```

---

## 🔧 Troubleshooting

### 7.1 Error: "RLS policy violation"

```
Causa: Código intentando acceder a datos sin RLS permit
Solución:
1. Verificar que token JWT es válido
2. Verificar que auth.uid() retorna el usuario correcto
3. Revisar RLS policy en tabla
4. Probar query en SQL editor con 'Set claim' set to usuario_id
```

### 7.2 Error: "Could not find column X"

```
Causa: Schema cambió pero código no se actualizó
Solución:
1. Ejecutar: SELECT * FROM [tabla] LIMIT 0; (ver estructura)
2. Verificar que tipos en TypeScript coinciden
3. Si schema es nuevo, ejecutar migration
4. Verificar spelling (sensible a mayúsculas)
```

### 7.3 Email No Se Envía

```
Solución:
1. Verificar API key en .env (resend_xxx o SG.xxx)
2. Ejecutar test: 
   const resend = new Resend(key);
   await resend.emails.send({...});
3. Revisar logs en Resend/SendGrid dashboard
4. Verificar dominio verificado en email service
```

### 7.4 Cupón Válido Pero No Funciona

```
Causa típica: Usuario ya lo usó (if uso_unico = true)
Solución:
1. Verificar en: SELECT * FROM cupones_usados WHERE usuario_id = X
2. Si está usado y no debería: DELETE FROM cupones_usados WHERE ...
3. Regenerar cupón si es necesario
```

---

## 📚 Recursos Adicionales

**Documentación Oficial:**
- [Supabase SQL Functions](https://supabase.com/docs/guides/database/functions)
- [Astro Performance](https://docs.astro.build/en/guides/performance/)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Performance_Optimization)

**Herramientas Recomendadas:**
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **Datadog** - Infrastructure monitoring
- **pg_stat_statements** - Query profiling

**Comunidades:**
- Supabase Discord: supabase.com/discord
- Astro Discord: astro.build/chat
- PostgreSQL: postgresql.org

---

## ✅ Checklist de Mantenimiento

```
DIARIO:
[ ] Revisar errores en Sentry
[ ] Checar métrica de uptime

SEMANAL:
[ ] Revisar analytics (GA4)
[ ] Checar cupones caducos
[ ] Actualizar estadísticas en caché

MENSUAL:
[ ] Analizar tendencias de conversión
[ ] Revisar performance de queries
[ ] Hacer backup manual
[ ] Actualizar documentación

TRIMESTRAL:
[ ] Rotación de API keys
[ ] Upgrade de dependencias
[ ] Audit de seguridad
[ ] Planning de nuevas features
```

---

**Última actualización:** 17 de Enero de 2026  
**Responsable:** Equipo Senior  
**Status:** Producción ✅
