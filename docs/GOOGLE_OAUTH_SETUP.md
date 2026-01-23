# Configuración de Autenticación con Google

## 📋 Estado: ✅ Configurado

### Credenciales Google (Configuradas en Supabase)
- **Client ID:** `408363735550-9qdreu29j0p89ccten7g6edm9m0t17rh.apps.googleusercontent.com`
- **Redirect URIs:**
  - `https://aebzgxrpvbwmcktnvkea.supabase.co/auth/v1/callback`
  - `http://localhost:3000/auth/v1/callback`
  - `http://localhost:3000/auth/callback`

---

## 🔧 Componentes Implementados

### 1. **GoogleAuthButton.astro**
- Ubicación: `src/components/auth/GoogleAuthButton.astro`
- Botón reutilizable para iniciar sesión con Google
- Propiedades:
  - `redirectTo` - URL a redirigir después de autenticarse (default: "/")
  - `text` - Texto del botón (default: "Continuar con Google")

**Uso:**
```astro
<GoogleAuthButton redirectTo="/dashboard" text="Continuar con Google" />
```

### 2. **API Endpoint: /api/auth/google.ts**
- Ubicación: `src/pages/api/auth/google.ts`
- Inicia el flujo OAuth con Supabase
- Responde con la URL de autenticación de Google

### 3. **Página de Callback**
- Ubicación: `src/pages/auth/callback.astro`
- Maneja la respuesta de Google
- Redirige al usuario a la URL especificada

---

## 📝 Páginas Actualizadas

### ✅ Login (`src/pages/auth/login.astro`)
- Botón "Continuar con Google" agregado
- Posicionado entre el formulario y la opción de invitado
- Redirige a "/" después de autenticarse

### ✅ Registro (`src/pages/auth/register.astro`)
- Botón "Continuar con Google" agregado
- Permite crear cuenta o vincular cuenta existente con Google
- Redirige a "/" después de autenticarse

---

## 🧪 Prueba en Desarrollo

```bash
npm run dev
```

1. Ve a `http://localhost:3000/auth/login`
2. Haz clic en "Continuar con Google"
3. Serás redirigido a Google para autorizar
4. Después de autorizar, serás redirigido a la aplicación

---

## 🚀 Comportamiento Esperado

### Primer Login con Google
1. Usuario hace clic en "Continuar con Google"
2. Se crea automáticamente un usuario en Supabase
3. Se genera una sesión
4. Se redirige a la URL especificada

### Usuarios Existentes
- Si el correo ya existe en Supabase, se vincula automáticamente
- Se crea una nueva sesión

---

## 🔐 Flujo de Seguridad

1. **Cliente** → Hace clic en botón "Continuar con Google"
2. **Cliente** → Llamada a `/api/auth/google` (POST)
3. **Server** → Supabase genera URL de autenticación
4. **Cliente** → Redirigido a Google OAuth
5. **Google** → Usuario autoriza acceso
6. **Google** → Redirige a Supabase callback
7. **Supabase** → Redirige a `/auth/callback`
8. **Cliente** → Redirige a URL final especificada

---

## 📌 Variables de Entorno

Ninguna variable especial requerida (usa las existentes de Supabase):
- `PUBLIC_SUPABASE_URL` ✅
- `PUBLIC_SUPABASE_ANON_KEY` ✅

---

## 🐛 Troubleshooting

### Error: "Usuario no autorizado"
- Verifica que Google OAuth está habilitado en Supabase
- Revisa que el Client ID y Secret están correctos

### Error: "Invalid redirect URI"
- Asegúrate que las Redirect URIs en Google Cloud Console coinciden con lo que usa Supabase
- Supabase usa: `https://aebzgxrpvbwmcktnvkea.supabase.co/auth/v1/callback`

### El botón no funciona
- Abre la consola del navegador (F12)
- Busca errores en la sección de Network
- Verifica que `/api/auth/google` responde correctamente

---

## 📚 Referencias

- [Supabase OAuth Documentation](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth Setup](https://console.cloud.google.com/)

---

**Última actualización:** 23 de enero de 2026
