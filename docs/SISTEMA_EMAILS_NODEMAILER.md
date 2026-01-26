# 📧 Sistema de Gestión de Correos Electrónicos

## Descripción

Sistema completo de emails implementado con **Nodemailer** para Gmail. Incluye:

✅ Email de bienvenida al registrarse  
✅ Recuperación de contraseña con tokens  
✅ Alertas de stock bajo para admin  
✅ Notificaciones de contacto  
✅ Confirmación de pedidos  

---

## Configuración Inicial

### 1. Variables de Entorno (.env)

```env
# Email Configuration (Gmail with Nodemailer)
EMAIL_USER=agonzalezcruces2004@gmail.com
EMAIL_PASSWORD=qvef vxna szgy hyaf
EMAIL_FROM=Auto Parts Store <agonzalezcruces2004@gmail.com>
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
```

### 2. Crear Tabla en Supabase

Ejecuta el SQL en la Supabase SQL Editor:

```sql
-- docs/CREAR_TABLA_PASSWORD_RESET.sql

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_password_reset_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_token_hash ON public.password_reset_tokens(token_hash);
CREATE INDEX idx_password_reset_expires_at ON public.password_reset_tokens(expires_at);

ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anyone to insert reset tokens" ON public.password_reset_tokens
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update own reset tokens" ON public.password_reset_tokens
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admin only read reset tokens" ON public.password_reset_tokens
  FOR SELECT USING (false);
```

---

## Funcionalidades Implementadas

### 1. **Email de Bienvenida** (Registro)

**Archivo:** `src/pages/api/auth/register.ts`

```typescript
import { sendWelcomeEmail } from '../../../lib/email';

// Se envía automáticamente al registrarse
const emailSent = await sendWelcomeEmail(fullname, email);
```

**Incluye:**
- Mensaje de bienvenida personalizado
- Link a la tienda
- Información sobre la cuenta

---

### 2. **Recuperación de Contraseña**

#### Página 1: Solicitar Reset
**Ruta:** `/auth/forgot-password`  
**Archivo:** `src/pages/auth/forgot-password.astro`

Usuario ingresa su correo y recibe email con enlace de reset.

#### Página 2: Restablecer Contraseña
**Ruta:** `/auth/reset-password?token=XXX&email=YYY`  
**Archivo:** `src/pages/auth/reset-password.astro`

Usuario ingresa nueva contraseña.

#### Rutas API:

1. **POST `/api/auth/forgot-password`**
   - Genera token único
   - Guarda en tabla `password_reset_tokens`
   - Envía email con enlace (válido 1 hora)

2. **POST `/api/auth/reset-password`**
   - Valida token
   - Actualiza contraseña en Supabase Auth
   - Marca token como usado

---

### 3. **Funciones Disponibles** (`src/lib/email.ts`)

#### `sendEmail(options)`
Función base para enviar cualquier email.

```typescript
await sendEmail({
  to: 'usuario@ejemplo.com',
  subject: 'Asunto',
  html: '<p>Contenido HTML</p>'
});
```

#### `sendWelcomeEmail(name, email)`
Email de bienvenida.

```typescript
await sendWelcomeEmail('Juan', 'juan@ejemplo.com');
```

#### `sendOrderConfirmationEmail(email, orderNumber, total)`
Confirmación de pedido.

```typescript
await sendOrderConfirmationEmail('juan@ejemplo.com', '#12345', 150.50);
```

#### `sendPasswordResetEmail(email, resetToken, resetUrl)`
Email de restablecimiento con enlace.

```typescript
const url = 'https://auto_parts_store.victoriafp.online/auth/reset-password?token=xxx&email=yyy';
await sendPasswordResetEmail('juan@ejemplo.com', 'token', url);
```

#### `sendLowStockAlertEmail(adminEmail, products)`
Alerta de stock bajo para admin.

```typescript
await sendLowStockAlertEmail('admin@auto-parts.com', [
  { name: 'Producto A', stock: 5, productId: 1 },
  { name: 'Producto B', stock: 8, productId: 2 }
]);
```

#### `sendContactFormEmail(name, email, phone, message, adminEmail)`
Notificación de contacto.

```typescript
await sendContactFormEmail(
  'Juan',
  'juan@ejemplo.com',
  '555-1234',
  'Tengo una pregunta sobre...',
  'admin@auto-parts.com'
);
```

---

## Flujo de Recuperación de Contraseña

```
Usuario → Click "¿Olvidaste tu contraseña?" 
         ↓
    /auth/forgot-password (página)
         ↓
    POST /api/auth/forgot-password (genera token)
         ↓
    Email enviado ✉️ con enlace
         ↓
Usuario hace click en email
         ↓
    /auth/reset-password?token=xxx&email=yyy
         ↓
    POST /api/auth/reset-password (valida token + cambia contraseña)
         ↓
    Redirige a /auth/login ✅
```

---

## Seguridad

✅ **Tokens únicos y hasheados**
- Token generado con `crypto.randomBytes(32)`
- Hash SHA-256 antes de guardar

✅ **Expiración de tokens**
- Válidos por 1 hora
- Se valida al cambiar contraseña

✅ **Tokens de un solo uso**
- Flag `used` previene reutilización

✅ **Validaciones**
- Email debe existir en tabla `usuarios`
- Contraseña mínimo 6 caracteres
- Contraseñas deben coincidir

---

## Pruebas

### Registrarse y recibir email de bienvenida:
1. Ir a `/auth/register`
2. Llenar formulario
3. Revisar email (agonzalezcruces2004@gmail.com)

### Recuperar contraseña:
1. Ir a `/auth/login`
2. Click "¿Olvidaste tu contraseña?"
3. Ingresar correo
4. Revisar email con enlace
5. Click en enlace
6. Ingresar nueva contraseña
7. Ingresar con nueva contraseña en login

---

## Integración en Otras Rutas

### Confirmación de pedido (después de pago)
En `src/pages/api/pagos/crear-sesion-stripe.ts`:

```typescript
import { sendOrderConfirmationEmail } from '../../../lib/email';

// Después de procesar pago
await sendOrderConfirmationEmail(
  userEmail,
  orderId,
  totalAmount
);
```

### Alertas de stock bajo
En `src/pages/admin/index.astro` o ruta de admin:

```typescript
import { sendLowStockAlertEmail } from '../../../lib/email';

// Llamar regularmente (ej: cada 24h)
await sendLowStockAlertEmail(
  adminEmail,
  lowStockProducts
);
```

### Formulario de contacto
En `src/pages/api/contact.ts`:

```typescript
import { sendContactFormEmail } from '../../../lib/email';

await sendContactFormEmail(
  name,
  email,
  phone,
  message,
  adminEmail
);
```

---

## Resolución de Problemas

### "Email service error"

**Problema:** No puedo conectar a Gmail

**Soluciones:**

1. **Verificar credenciales**
   - EMAIL_USER: `agonzalezcruces2004@gmail.com`
   - EMAIL_PASSWORD: Asegúrate que sea contraseña de aplicación (no la contraseña normal)

2. **Habilitar aplicaciones menos seguras** (si no usas contraseña de app)
   - Google → Configuración de cuenta → Seguridad
   - Habilitar "Acceso de aplicaciones menos seguras"

3. **Usar contraseña de aplicación**
   - Google → Contraseñas de aplicación
   - Generar contraseña específica para esta app

4. **Verificar puerto**
   - Puerto 587 (TLS) - Correcto para Nodemailer

---

## Archivos Creados

```
src/
├── lib/
│   └── email.ts (Funciones para enviar emails)
├── pages/
│   ├── auth/
│   │   ├── forgot-password.astro (Página solicitud reset)
│   │   └── reset-password.astro (Página nuevo password)
│   └── api/auth/
│       ├── forgot-password.ts (Genera token + envía email)
│       └── reset-password.ts (Valida token + cambia password)
└── docs/
    └── CREAR_TABLA_PASSWORD_RESET.sql (SQL para tabla)
```

---

## Dependencias

```bash
npm install nodemailer @types/nodemailer
```

**Ya instaladas en el proyecto.**

---

## Variables de Entorno Requieridas

```env
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=contraseña_de_aplicacion
EMAIL_FROM=Nombre <tu_email@gmail.com>
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
```

---

## Estado: ✅ COMPLETADO

- ✅ Instalación de Nodemailer
- ✅ Configuración de variables
- ✅ Servicio de email (`email.ts`)
- ✅ Email de bienvenida en registro
- ✅ Flujo completo de recuperación de contraseña
- ✅ Páginas de interfaz (forgot-password, reset-password)
- ✅ Tabla `password_reset_tokens` (SQL)
- ✅ Funciones para otros tipos de emails

**Próximo:** Integrar en pedidos, contacto y alertas de stock.
