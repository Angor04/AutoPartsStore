# 📧 Configurar Template de Email en Supabase

## Cómo usar el template de recuperación de contraseña

### Paso 1: Acceder a Supabase

1. Ve a [supabase.com](https://supabase.com) y accede a tu proyecto
2. En el menú lateral, busca **Authentication** → **Email Templates**

### Paso 2: Seleccionar el Template

3. Haz clic en **Reset Password** (Recuperación de Contraseña)
4. Verás un formulario con el template actual

### Paso 3: Reemplazar el contenido

5. Reemplaza todo el HTML actual con el contenido del archivo `TEMPLATE_EMAIL_RECUPERAR_CONTRASENA.html`
6. Asegúrate de que:
   - El enlace `{{ .ConfirmationURL }}` está presente (Supabase lo reemplazará automáticamente)
   - El logo URL apunte a tu Cloudinary o servidor

### Variables disponibles en Supabase

```
{{ .ConfirmationURL }}  - El enlace para resetear la contraseña
{{ .Email }}            - El email del usuario
{{ .SiteURL }}          - La URL de tu sitio
```

### Paso 4: Guardar

7. Haz clic en **Save** para guardar el template
8. ¡Listo! Cuando un usuario solicite recuperar contraseña, recibirá tu email personalizado

---

## ✨ Características del Template

✅ **Diseño responsivo** - Se ve bien en móvil y desktop
✅ **Branding personalizado** - Logo y colores de AutoPartsStore  
✅ **Botón CTA** - Destacado en rojo para máxima visibilidad
✅ **Link alternativo** - Por si el botón no funciona
✅ **Información de seguridad** - Aviso sobre el enlace de 24 horas
✅ **Footer profesional** - Con enlaces y redes sociales
✅ **Sin spam** - Advertencia clara de que es automático

---

## 🔧 Personalización

### Cambiar colores

En el CSS, busca `#dc2626` (rojo) y reemplaza con tu color:

```css
background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
```

### Cambiar el logo

Reemplaza la URL:

```html
<img src="https://tu-dominio.com/logo.png" alt="AutoPartsStore" class="logo">
```

### Cambiar email de soporte

```html
<a href="mailto:tu-email@autopartsstore.com">tu-email@autopartsstore.com</a>
```

### Actualizar enlaces de redes sociales

En el footer, actualiza las URLs de tus redes sociales

---

## 📱 Testing

Para probar el template sin enviar emails reales:

1. En Authentication → Email Templates
2. Hay un botón "Test" para previsualizar
3. O registra un usuario y solicita recuperación de contraseña

---

## ⚙️ Configuración avanzada (Opcional)

Si usas un servicio de email externo como SendGrid o Resend:

1. Ve a Authentication → Email Templates
2. Desactiva "Use Supabase email service"
3. Configura tu proveedor externo con este template HTML

---

## 🚀 Próximos pasos

- [ ] Configurar el template en Supabase
- [ ] Probar con un email de prueba
- [ ] Actualizar el logo y colores según sea necesario
- [ ] Agregar información de tu empresa en el footer
- [ ] Probar en diferentes clientes de email (Gmail, Outlook, etc.)

