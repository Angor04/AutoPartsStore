# Documentación Técnica: AutoPartsStore

## 1. Introducción
AutoPartsStore es un e-commerce premium especializado en la venta de recambios y piezas de automoción. La plataforma está diseñada para ofrecer una experiencia de usuario fluida, gestión de inventario en tiempo real y un panel de administración avanzado.

---

## 2. Arquitectura de Software
La aplicación utiliza una arquitectura moderna basada en el **Jamstack**, priorizando el rendimiento y la escalabilidad.

- **Frontend**: [Astro 5.0](https://astro.build/) (Framework principal).
- **Componentes Interactivos**: [React 18](https://reactjs.org/) (Islands Architecture).
- **Estado**: [Nano Stores](https://github.com/nanostores/nanostores).
- **Base de Datos y Autenticación**: [Supabase](https://supabase.com/).
- **Pagos**: [Stripe](https://stripe.com/).
- **Imágenes**: [Cloudinary](https://cloudinary.com/).
- **Emails**: [Nodemailer](https://nodemailer.com/).

---

## 3. Estructura del Proyecto
- `src/pages/`: Rutas de la aplicación (Públicas y Admin).
- `src/components/`: Componentes reutilizables.
  - `islands/`: Componentes React hidratados en el cliente.
  - `admin/`: Componentes específicos del panel de gestión.
- `src/lib/`: Utilidades y clientes (Supabase, Stripe, Cloudinary, Generación de PDFs).
- `src/stores/`: Gestión de estado global (Carrito, Stock).
- `src/api/`: Endpoints del backend (Serverless Functions).

---

## 4. Guía de Desarrollo Local

### Requisitos Previos
- Node.js 18+
- NPM

### Instalación
```bash
npm install
```

### Ejecución en Desarrollo
```bash
npm run dev
```

### Construcción para Producción
```bash
npm run build
```

---

## 5. Variables de Entorno (.env)
Para el correcto funcionamiento, es necesario configurar las siguientes variables:

| Variable | Descripción |
| :--- | :--- |
| `PUBLIC_SUPABASE_URL` | URL del proyecto Supabase (Pública) |
| `PUBLIC_SUPABASE_ANON_KEY` | Clave anónima de Supabase (Pública) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de administrador (Privada - Solo Servidor) |
| `PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clave pública de Stripe |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secreto para validar webhooks de Stripe |
| `CLOUDINARY_CLOUD_NAME` | Nombre del cloud de Cloudinary |
| `CLOUDINARY_API_KEY` | API Key de Cloudinary |
| `CLOUDINARY_API_SECRET` | API Secret de Cloudinary |
| `EMAIL_USER` | Usuario/Email para envío de correos |
| `EMAIL_PASSWORD` | Contraseña/App Password de email |

---

## 6. Funcionalidades Clave

### 🛒 Gestión de Carrito
- **Sincronización en Tiempo Real**: El carrito se sincroniza con el stock de la base de datos cada vez que se abre.
- **Validación de Ofertas**: Los precios se actualizan automáticamente si el administrador activa/desactiva una oferta.

### 🏷️ Sistema de Ofertas
- **Precios Dinámicos**: Los administradores pueden activar ofertas individuales o masivas desde el panel.
- **Visualización**: Etiquetas de oferta y precios tachados automáticos.

### 📦 Gestión de Stock
- **Stock Reservado**: El sistema reserva temporalmente el stock cuando se añade al carrito.
- **Restauración Automática**: El stock se devuelve si el item se elimina o la sesión expira.

### 📧 Comunicaciones
- **Confirmación de Compra**: Email automático con detalles del pedido.
- **Facturación**: Generación de facturas PDF profesionales.
- **Newsletter**: Popup por sesión con cupón de descuento del 10%.

---

## 7. Esquema de Base de Datos (Tablas Clave)
- **`productos`**: Catálogo, stock, precios y especificaciones (JSONB).
- **`categorias`**: Estructura organizativa de la tienda.
- **`usuarios`**: Perfiles de clientes y administradores.
- **`ordenes`**: Cabecera de pedidos, estado de pago y envío.
- **`ordenes_items`**: Detalle de productos comprados en cada pedido.
- **`configuracion`**: Ajustes globales de la tienda.

---

## 8. Panel de Administración
Acceso protegido para la gestión integral:
- **Gestión de Stock**: Actualizaciones rápidas de inventario.
- **Control de Pedidos**: Cambio de estados (Pendiente, Pagado, Enviado).
- **Devoluciones**: Aprobación/Rechazo de tickets con generación de PDFs de reembolso.
- **Marketing**: Configuración de cupones y ofertas.

---

## 9. Seguridad y Despliegue
- **RLS (Supabase)**: Seguridad a nivel de fila para proteger datos privados.
- **Middleware de Astro**: Protección de rutas administrativas.
- **Webhook de Stripe**: Procesamiento asíncrono y seguro de pagos mediante validación de firma.
- **Infraestructura**: Despliegue en Docker vía Coolify (Nixpacks).
