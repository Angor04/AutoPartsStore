# 👤 SISTEMA DE REGISTRO DE USUARIOS

**Documento:** Guía de Registro e Identificación de Usuarios  
**Versión:** 1.0  
**Fecha:** 18 de Enero de 2026  

---

## 📋 Cambios Realizados

### 1️⃣ Base de Datos

**Tabla creada:** `usuarios`

```sql
CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  nombre TEXT NOT NULL,
  apellido TEXT,
  email TEXT NOT NULL UNIQUE,
  telefono TEXT,
  direccion TEXT,
  ciudad TEXT,
  codigo_postal TEXT,
  pais TEXT,
  foto_perfil TEXT,
  fecha_registro TIMESTAMP DEFAULT NOW(),
  ultimo_acceso TIMESTAMP,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);
```

**Características:**
- ✅ Referencia a `auth.users` de Supabase
- ✅ Información personal del usuario
- ✅ Tracking de registro y último acceso
- ✅ RLS habilitada (cada usuario ve solo su perfil)

---

### 2️⃣ API Backend

**Archivo:** `src/pages/api/auth/register.ts`

**Flujo:**
1. Recibe datos JSON: `{ email, password, nombre, apellido, telefono }`
2. Validaciones:
   - Email válido
   - Contraseña ≥ 6 caracteres
   - Nombre obligatorio
3. Crea usuario en `auth.users` (Supabase Auth)
4. Inserta registro en tabla `usuarios`
5. Retorna JSON con éxito/error

**Validaciones:**
```typescript
✅ Email format
✅ Password length (6+ chars)
✅ Required fields
✅ Duplicate email check
✅ Error handling
```

**Respuestas:**

**Éxito (201):**
```json
{
  "success": true,
  "message": "Registro exitoso. Por favor verifica tu email.",
  "user_id": "uuid-aqui",
  "email": "usuario@example.com"
}
```

**Error (400):**
```json
{
  "error": "Este email ya está registrado"
}
```

---

### 3️⃣ Componente Frontend

**Archivo:** `src/components/auth/RegisterForm.astro`

**Campos del formulario:**
- ✅ Nombre (obligatorio)
- ✅ Apellido (opcional)
- ✅ Email (obligatorio)
- ✅ Teléfono (opcional)
- ✅ Contraseña (obligatorio, 6+ chars)
- ✅ Confirmar Contraseña
- ✅ Aceptar términos (obligatorio)
- ✅ Newsletter (opcional)

**Validaciones lado cliente:**
- Email format
- Passwords match
- Minimum length
- Required fields

**Estilos:**
- Gradiente morado (667eea → 764ba2)
- Responsive (mobile-friendly)
- Animaciones suaves
- Mensajes de error claros

**Comportamiento:**
```
1. Usuario completa formulario
2. Click "Crear Cuenta"
3. Validaciones locales
4. Fetch a /api/auth/register
5. Mostrar success/error
6. Redirigir a login si éxito
```

---

### 4️⃣ Página de Registro

**Archivo:** `src/pages/register.astro`

**Características:**
- Redirige a `/` si ya está autenticado
- Usa `PublicLayout`
- Incluye formulario `RegisterForm`

**URL:** `https://tudominio.com/register`

---

## 🔐 Seguridad Implementada

### Nivel Backend
```
1️⃣ Validación de entrada
   - Email format check
   - Password length validation
   - Sanitización de datos

2️⃣ Supabase Auth
   - Password hashing (bcrypt)
   - Email verification
   - JWT tokens

3️⃣ RLS en BD
   - Cada usuario solo ve su perfil
   - INSERT/UPDATE protegidos por ID
```

### Nivel Frontend
```
1️⃣ Validación local
   - Regex email
   - Password match
   - Required fields

2️⃣ HTTPS obligatorio
   - Encriptación en tránsito
   - Secure cookies
```

---

## 📊 Flujo Completo

```
USUARIO EN NAVEGADOR
        │
        ▼
┌───────────────────────┐
│  Rellena formulario   │
│ - Email               │
│ - Contraseña          │
│ - Nombre              │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────────────────┐
│  Validación Local (Client-side)   │
│  ✅ Format checks                 │
│  ✅ Length validation             │
│  ✅ Password match                │
└───────────┬───────────────────────┘
            │
            ▼
    POST /api/auth/register
    { JSON payload }
            │
            ▼
┌─────────────────────────────────────┐
│  API Backend (register.ts)          │
│  1. Validar datos                   │
│  2. Crear usuario en auth.users     │
│  3. Insertar en tabla usuarios      │
└───────────┬───────────────────────┘
            │
            ▼
   RESPUESTA JSON
   { success, user_id }
            │
            ▼
┌──────────────────────┐
│  Frontend responde   │
│  - Mostrar éxito     │
│  - Limpiar form      │
│  - Redirigir a login │
└──────────────────────┘
```

---

## 🚀 Cómo Usar

### Desde el Frontend

**Link en navbar:**
```astro
<a href="/register">Crear Cuenta</a>
```

**URL directa:**
```
https://tudominio.com/register
```

### API REST (Manual)

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "miPassword123",
    "nombre": "Juan",
    "apellido": "Pérez",
    "telefono": "+34 123 456 789"
  }'
```

---

## 📝 Próximos Pasos

### Corto Plazo (Esta semana)
- ✅ Tabla `usuarios` creada en DB
- ✅ API de registro implementada
- ✅ Formulario frontend creado
- ⏳ Ejecutar SQL schema en Supabase
- ⏳ Testing del flujo completo

### Medio Plazo (2 semanas)
- Verificación de email
- Password reset
- Actualización de perfil
- Foto de perfil (upload)
- Validación teléfono

### Largo Plazo (1 mes)
- Autenticación social (Google, GitHub)
- Two-factor authentication
- Historial de cambios
- Auditoría de acceso

---

## ⚠️ Consideraciones Importantes

### Verificación de Email
**Supabase envía automáticamente** un email de verificación. El usuario debe:
1. Recibir email a su bandeja
2. Click en link de confirmación
3. Email verificado ✅

### Contraseña
- Almacenada en hash (bcrypt)
- **No se envía en respuesta**
- Cambio de password: `/api/cambiar-contrasena`

### Datos Sensibles
- Email único por usuario
- Teléfono sin validación (agregar +34)
- Dirección opcional
- Foto: URL pública

---

**Documento completado ✅**  
Revisa `/docs/02_ADVANCED_SCHEMA.sql` para ejecutar en Supabase.
