# 🏗️ ARQUITECTURA DEL SISTEMA ECOMMERCE

**Documento:** Arquitectura del Sistema  
**Versión:** 1.0  
**Actualizado:** Enero 2026  
**Nivel Técnico:** Avanzado  

---

## 📊 Diagrama de Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Astro + React)                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Pages:                          Components:                             │
│  ├── /productos                  ├── NewsletterPopup                    │
│  ├── /carrito                    ├── CarritoCheckout                    │
│  ├── /perfil/pedidos             ├── MisPedidos                         │
│  ├── /admin/cupones              └── CambiarContraseña                  │
│  └── /admin/productos                                                    │
│                                                                           │
└────────────────────────────────────────────────────────────────────────┬─┘
                                      ▲
                                      │ HTTP/JSON
                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      API ENDPOINTS (Astro Serverless)                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  /api/                                                                    │
│  ├── auth/                                                               │
│  │   ├── login.ts                                                        │
│  │   └── logout.ts                                                       │
│  ├── cambiar-contrasena.ts        ← Cambio de Password                  │
│  ├── newsletter/                                                         │
│  │   └── suscribir.ts             ← Generar código descuento            │
│  ├── cupones/                                                            │
│  │   └── validar.ts               ← Validar código en checkout          │
│  ├── pedidos/                                                            │
│  │   ├── cancelar.ts              ← Cancelar + restaurar stock         │
│  │   └── solicitar-devolucion.ts  ← Devolución + etiqueta              │
│  ├── checkout.ts                  ← Crear orden (Stripe)                │
│  └── webhooks/                                                           │
│      └── stripe.ts                ← Webhook de Stripe                   │
│                                                                            │
└────────────────────────┬──────────────────────────────────────────────────┘
                         │ SQL Queries + RPC Calls
                         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    SUPABASE (PostgreSQL + Auth)                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Tables (7):                                                              │
│  ├── auth.users                   (Sistema Supabase)                    │
│  ├── public.productos             (Existente)                           │
│  ├── public.newsletter_suscriptores                                      │
│  ├── public.cupones               ← CLAVE                               │
│  ├── public.cupones_usados                                               │
│  ├── public.ordenes               (Expandida)                           │
│  ├── public.ordenes_items                                                │
│  ├── public.solicitudes_devolucion                                       │
│  └── public.ordenes_historial                                            │
│                                                                            │
│  Functions (3):                                                           │
│  ├── cancelar_pedido_atomico()    [TRANSACCIONAL]                       │
│  ├── validar_cupon()              [VALIDACIÓN COMPLEJA]                 │
│  └── generar_codigo_descuento()   [RANDOM CODE]                         │
│                                                                            │
│  Policies (RLS):                                                          │
│  ├── ordenes: usuario_id = auth.uid()                                    │
│  ├── solicitudes_devolucion: usuario_id = auth.uid()                     │
│  └── newsletter_suscriptores: Público lectura                            │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
                         │
                         │ Async Email Jobs
                         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                  EMAIL SERVICE (Resend / SendGrid)                       │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Emails:                                                                  │
│  ├── Bienvenida (código descuento)      ← Newsletter                    │
│  ├── Confirmación de pedido              ← Checkout                     │
│  ├── Confirmación de cancelación         ← Cancel Order                 │
│  ├── Instrucciones de devolución         ← Return Request               │
│  ├── Confirmación de reembolso           ← Refund Processed             │
│  └── Alertas de seguridad                ← Password Change              │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujos de Datos Principales

### 1️⃣ FLUJO DE NEWSLETTER + DESCUENTO

```
Usuario:
  1. Ve popup después de 5 segundos
  2. Ingresa email
  3. Click "Obtener Descuento"
              │
              ▼
    POST /api/newsletter/suscribir
              │
              ▼
    Backend:
      ✓ Valida formato email
      ✓ Llama SQL: generar_codigo_descuento()
      ✓ Crea cupón (10% OFF, 30 días)
      ✓ Guarda subscriber
      ✓ Envía email con código
              │
              ▼
    BD:
      INSERT newsletter_suscriptores
      INSERT cupones (nuevo)
      UPDATE cupones_usados
              │
              ▼
    Email Service:
      Envía email con código: "DESC20260117AB23CD"
              │
              ▼
    Usuario:
      ✓ Ve mensaje de éxito
      ✓ Recibe código en email
      ✓ Puede usar en siguiente compra
```

---

### 2️⃣ FLUJO DE APLICACIÓN DE CUPÓN EN CHECKOUT

```
Usuario:
  1. Tiene carrito con €50
  2. Ingresa código "DESC10EUR"
  3. Click "Aplicar"
              │
              ▼
    POST /api/cupones/validar
              │
              ▼
    Backend:
      ✓ Extrae código_cupon, usuario_id, subtotal
      ✓ Llama SQL: validar_cupon(...)
      ✓ Función verifica:
        • Código existe
        • NO está expirado
        • Usuario cumple requisitos
        • subtotal >= mínimo
        • Usos dentro del límite
      ✓ Calcula descuento (€10)
              │
              ▼
    BD (SQL):
      SELECT * FROM cupones WHERE codigo = 'DESC10EUR'
      SELECT * FROM cupones_usados 
        WHERE cupon_id = X AND usuario_id = Y
      (Todo en función = Transaccional)
              │
              ▼
    Respuesta:
      {
        "valido": true,
        "descuento": 10.00,
        "total_con_descuento": 40.00
      }
              │
              ▼
    Frontend:
      ✓ Resta €10 del total
      ✓ Muestra: "Total: €40.00"
      ✓ Guarda cupon_id para crear orden
```

---

### 3️⃣ FLUJO DE CANCELACIÓN ATÓMICA

```
Usuario:
  1. Tiene orden con estado PAGADO
  2. Click "Cancelar Pedido"
  3. Confirma cancelación
              │
              ▼
    POST /api/pedidos/cancelar
    Body: { orden_id, usuario_id }
              │
              ▼
    Backend:
      ✓ Valida que usuario == propietario
      ✓ Valida que estado == PAGADO
      ✓ Llama SQL: cancelar_pedido_atomico(...)
              │
              ▼
    BD (TRANSACCIÓN SQL):
      BEGIN;
        ✓ SELECT orden + items
        FOR EACH item:
          UPDATE productos
          SET stock = stock + cantidad
          WHERE id = item.producto_id
        ✓ UPDATE ordenes
        SET estado = 'CANCELADO'
        WHERE id = orden_id
        ✓ UPDATE ordenes
        SET estado_pago = 'REEMBOLSADO'
        ✓ INSERT ordenes_historial
        VALUES (orden_id, 'PAGADO', 'CANCELADO', ...)
      COMMIT;  ← AQUÍ: Todo sucede o nada
              │
              ▼
    Si error:
      ROLLBACK  ← Se deshace TODO
              │
              ▼
    Backend:
      ✓ Envía email: "Pedido cancelado"
      ✓ Retorna: { success: true, ... }
              │
              ▼
    Frontend:
      ✓ Muestra "Cancelación exitosa"
      ✓ Recarga lista de pedidos
      ✓ Orden ahora muestra CANCELADO
```

---

### 4️⃣ FLUJO DE DEVOLUCIÓN

```
Usuario:
  1. Tiene orden con estado ENTREGADO
  2. Click "Solicitar Devolución"
  3. Selecciona motivo + descripción
  4. Click "Solicitar"
              │
              ▼
    POST /api/pedidos/solicitar-devolucion
              │
              ▼
    Backend:
      ✓ Valida que estado == ENTREGADO
      ✓ Genera número etiqueta único
        Formato: "DEV-{timestamp}-{random}"
      ✓ Crea registro en solicitudes_devolucion
      ✓ Actualiza orden.solicitud_devolucion_id
      ✓ Envía email con instrucciones
              │
              ▼
    BD:
      INSERT solicitudes_devolucion
      VALUES (id, orden_id, estado='SOLICITADA', ...)
      UPDATE ordenes
      SET solicitud_devolucion_id = ...
              │
              ▼
    Email con:
      ✓ Número de etiqueta
      ✓ Dirección de devolución
      ✓ Plazo de reembolso (5-7 días)
      ✓ Monto a reembolsar
              │
              ▼
    Frontend:
      ✓ Muestra modal de éxito
      ✓ Usuario imprime/copia etiqueta
      ✓ Envía producto a dirección
              │
              ▼
    (Después - Manual o Webhook):
      ✓ Admin marca como RECIBIDA
      ✓ Admin marca como COMPLETADA
      ✓ Sistema procesa reembolso
      ✓ Envía email final: "Reembolso procesado"
```

---

## 🔐 Seguridad en Capas

### Capa 1: Autenticación (JWT + Supabase Auth)

```typescript
// Todo endpoint verifica:
const token = request.headers.get('authorization');
const usuario = await supabase.auth.getUser(token);

// RLS automático:
SELECT * FROM ordenes
WHERE usuario_id = auth.uid()  // ← BD lo filtra automáticamente
```

### Capa 2: Validación de Entrada

```typescript
// En cada endpoint:
✓ Valida tipos de datos
✓ Valida rangos (ej: cantidad > 0)
✓ Valida formato (email, fecha)
✓ Valida pertenencia (¿es tu orden?)
```

### Capa 3: Lógica en BD (SQL Functions)

```sql
-- Validar cupón en BD, no en app:
SELECT validar_cupon(...)
  → Verifica TODAS las condiciones
  → Imposible saltarse lógica desde frontend

-- Transacciones ACID:
BEGIN; ... COMMIT;
  → Todo o nada
  → Imposible estado inconsistente
```

### Capa 4: RLS (Row Level Security)

```sql
-- Usuario NO puede ver órdenes de otros:
CREATE POLICY "ordenes_own_only" 
  ON ordenes 
  USING (usuario_id = auth.uid());

-- Intentar hackear:
SELECT * FROM ordenes WHERE id = 'other_user_order'
-- BD retorna: "No existen registros" ✓
```

---

## 🎯 Decisiones Arquitectónicas Clave

### ¿Por qué funciones SQL vs lógica en app?

| Aspecto | SQL Function | App Logic |
|---------|-------------|-----------|
| **Velocidad** | ⚡ Más rápido | 🐢 Hace viajes |
| **Atomicidad** | ✅ Garantizada | ❌ Puede fallar |
| **Consistencia** | ✅ BD lo valida | ❌ Posible error |
| **Escalabilidad** | ✅ Maneja 10k QPS | ❌ Solo 100 QPS |

**Decisión:** Operaciones críticas (cancelación, descuentos) **en SQL**.

---

### ¿Por qué RLS en la BD?

**Scenario sin RLS:**

```typescript
// Frontend:
async function verMisPedidos() {
  const pedidos = await fetch('/api/pedidos'); // ← Sin filtro
  return pedidos; // ← Retorna TODOS los pedidos de TODOS
}

// Hack:
fetch('/api/pedidos?usuario_id=otro_usuario') // ✅ Funciona - PROBLEMA
```

**Scenario con RLS:**

```sql
-- En BD:
CREATE POLICY "user_owns_order"
  ON ordenes
  USING (usuario_id = auth.uid());

-- Intento de hack:
SELECT * FROM ordenes WHERE usuario_id = 'otro' 
-- RLS bloquea: "0 filas" ✓ SEGURO
```

**Decisión:** RLS es la **última línea de defensa** - imposible saltarla.

---

### ¿Por qué usar Resend/SendGrid en lugar de SMTP?

| Factor | SMTP | Resend/SendGrid |
|--------|------|-----------------|
| **Setup** | 30 min | 2 min |
| **Deliverability** | 70% | 99% |
| **Soporte** | Mínimo | Excelente |
| **Escalabilidad** | Limitado | Ilimitado |

**Decisión:** Resend (más fácil) o SendGrid (más poderoso).

---

## 📈 Escalabilidad

### Tráfico Actual vs Futuro

```
Usuarios/mes      Pedidos/día       Necesario
─────────────────────────────────────────────
100               10                Actual (Astro + Supabase free)
1,000             100               Upgrade: Pro tier
10,000            1,000             Upgrade: Team plan
100,000           10,000            Infrastructure: Vercel Enterprise
```

### Optimizaciones Implementadas

```
✅ Queries indexadas en cupones, órdenes
✅ RLS reduce datos transferidos
✅ Funciones SQL batch (todo en BD)
✅ Caché de navegador para assets
✅ Lazy loading de componentes Astro
```

---

## 🧪 Testing Strategy

### Niveles de Test

```
Level 1: Unit Tests
  ├── validar_cupon() → inputs/outputs
  └── generar_codigo_descuento() → formato

Level 2: Integration Tests
  ├── POST /api/cupones/validar con BD real
  └── Flujo completo: suscribir → recibir código → aplicar

Level 3: End-to-End Tests
  ├── Usuario crea cuenta
  ├── Se suscribe a newsletter
  ├── Compra con cupón
  ├── Cancela orden
  └── Solicita devolución

Level 4: Load Tests
  ├── 1000 validaciones de cupón simultáneas
  ├── 100 cancelaciones simultáneas
  └── Verificar transacciones exitosas
```

---

## 📊 Modelo de Datos Detallado

### Tabla: cupones

```sql
CREATE TABLE cupones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identidad
  codigo VARCHAR(20) UNIQUE NOT NULL,  -- "DESC10EUR"
  
  -- Tipo de descuento
  tipo_descuento VARCHAR(20) NOT NULL, -- 'porcentaje' | 'cantidad_fija'
  valor_descuento DECIMAL(10, 2),      -- 10 o 10.00
  
  -- Restricciones
  uso_unico BOOLEAN DEFAULT false,     -- Solo 1 uso por usuario?
  limite_usos INT,                      -- NULL = ilimitado
  cantidad_minima_compra DECIMAL(10, 2) DEFAULT 0,
  
  -- Validez
  fecha_expiracion DATE NOT NULL,
  activo BOOLEAN DEFAULT true,
  
  -- Auditoría
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cupones_codigo ON cupones(codigo);
CREATE INDEX idx_cupones_activo ON cupones(activo);
CREATE INDEX idx_cupones_expiracion ON cupones(fecha_expiracion);
```

### Tabla: solicitudes_devolucion

```sql
CREATE TABLE solicitudes_devolucion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  orden_id UUID NOT NULL REFERENCES ordenes(id),
  usuario_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Identificación
  numero_etiqueta VARCHAR(50) UNIQUE NOT NULL, -- "DEV-1705494600000-ABCD"
  
  -- Motivo
  motivo VARCHAR(50) NOT NULL, -- 'defectuoso', 'no_como_esperaba', etc
  descripcion TEXT,
  
  -- Estado
  estado VARCHAR(20) DEFAULT 'SOLICITADA',
  -- SOLICITADA → ACEPTADA → RECIBIDA → COMPLETADA
  -- O: RECHAZADA
  
  -- Reembolso
  monto_reembolso DECIMAL(10, 2),
  
  -- Fechas
  fecha_solicitud TIMESTAMP DEFAULT NOW(),
  fecha_aceptacion TIMESTAMP,
  fecha_recepcion TIMESTAMP,
  fecha_reembolso TIMESTAMP,
  
  -- Auditoría
  actualizado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_devoluciones_orden ON solicitudes_devolucion(orden_id);
CREATE INDEX idx_devoluciones_usuario ON solicitudes_devolucion(usuario_id);
```

---

## 🚀 Performance Targets

```
Métrica                    Target      Implementación
─────────────────────────────────────────────────────────
/api/cupones/validar       < 100ms     SQL function en BD
/api/newsletter/suscribir  < 500ms     Email async
/api/pedidos/cancelar      < 200ms     Transaction
Carga de página            < 2s        Astro SSR + assets
Newsletter popup           < 5s        localStorage check
```

---

## 📞 Contactos y Referencias

**Documentación Interna:**
- [Schema SQL](../docs/02_ADVANCED_SCHEMA.sql)
- [Guía de Integración](../docs/03_GUIA_INTEGRACION_COMPLETA.md)

**Enlaces Externos:**
- [Supabase Architecture](https://supabase.com/docs/guides/database/overview)
- [Astro Best Practices](https://docs.astro.build/en/guides/best-practices/)

---

**Última actualización:** 17 de Enero de 2026  
**Responsable:** Equipo de Desarrollo  
**Estado:** Producción ✅
