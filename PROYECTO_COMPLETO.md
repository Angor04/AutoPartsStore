# AutoPartsStore - Documentación

**Fecha:** 13 de enero de 2026  
**Estado:** En desarrollo  
**Versión:** 1.0.0 (Beta)

## Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Funcionalidades Completadas](#funcionalidades-completadas)
3. [Tareas Pendientes](#tareas-pendientes)
4. [Arquitectura Técnica](#arquitectura-técnica)

## Descripción General

AutoPartsStore es una tienda online de recambios y piezas para automóviles.

**Stack técnico:**
- Frontend: Astro + React + TypeScript
- Backend: Supabase (PostgreSQL)
- Diseño: Tailwind CSS
- Imágenes: Cloudinary
- Carrito: Nanostores
- Pago: Stripe (en desarrollo)

## Funcionalidades Completadas

CATÁLOGO
- 48 productos cargados en Supabase
- 12 categorías de productos
- Imágenes de Cloudinary asignadas (48/48)
- Imágenes de categorías (12/12)

PÁGINAS PÚBLICAS
- Página de inicio (/)
- Página de productos (/productos)
- Páginas de categorías (/categoria/[slug])
- Página de detalles (/productos/[id])

CARRITO
- Carrito en navegador (LocalStorage + Nanostores)
- Icono con contador de artículos
- Panel lateral del carrito
- Agregar/eliminar/aumentar productos
- Cálculo automático del total

DISEÑO
- Layout responsivo (mobile, tablet, desktop)
- Header y footer consistentes
- Navegación por categorías
- Tarjetas de productos compactas

BASE DE DATOS
- Tabla categorias (12 registros)
- Tabla productos (48 registros)
- Tabla usuarios (estructura base)

## Tareas Pendientes

PRIORIDAD 1: Pasarela de Pago
- Integración de Stripe
- Página de checkout (/checkout)
- Endpoint API para procesar pagos
- Webhook de Stripe
- Guardar transacciones en BD

Archivos a crear:
- src/pages/checkout.astro
- src/pages/api/checkout.ts
- src/components/Checkout.tsx

PRIORIDAD 2: Sistema de Pedidos
- Tabla pedidos y pedidos_items en BD
- Funciones para guardar pedidos
- Página de confirmación de pedido
- Página de mis pedidos (/mis-pedidos)
- Ver detalles y estado de pedidos

Archivos a crear:
- src/pages/confirmacion.astro
- src/pages/mis-pedidos.astro
- src/pages/pedidos/[id].astro
- src/pages/api/pedidos/crear.ts

PRIORIDAD 3: Sistema de Correos
- Configurar servicio email (SendGrid/Mailgun)
- Email de confirmación de pedido
- Email de cambio de estado
- Email de recuperación de contraseña

Archivos a crear:
- src/lib/email.ts
- src/pages/api/emails/confirmacion.ts

PRIORIDAD 4: Panel de Administrador
- Login de admin (/admin/login)
- Dashboard con estadísticas
- Gestión de productos (CRUD)
- Gestión de pedidos
- Gestión de categorías
- Gestión de usuarios
- Reportes y analítica

Archivos a crear:
- src/pages/admin/ (completo)
- src/lib/admin.ts
- src/middleware.ts (protección de rutas)

OTRAS TAREAS
- Row Level Security (RLS) en Supabase
- Validación de datos (frontend y backend)
- Rate limiting en APIs
- Integración con courier de envíos
- Wishlist/Favoritos
- Reseñas de productos
- Cupones de descuento
- Chat de soporte
- FAQ y términos de servicio

## Arquitectura Técnica

Base de Datos (PostgreSQL)

Tablas existentes:
- categorias (id, nombre, slug, descripcion, imagen)
- productos (id, nombre, descripcion, precio, categoria_id, stock, urls_imagenes)
- usuarios (base)

Tablas por crear:
- pedidos (id, usuario_id, numero_pedido, estado, total, fecha_creacion)
- pedidos_items (id, pedido_id, producto_id, cantidad, precio_unitario)
- Extender usuarios con: telefono, ciudad, codigo_postal, pais

## Próximos Pasos

Fase 1 (Esta semana)
- Integración básica de Stripe

Fase 2 (Semana 2)
- Sistema de pedidos
- Confirmación por email

Fase 3 (Semana 3)
- Panel de admin básico
- Gestión de productos

Fase 4 (Semana 4+)
- Seguimiento de envíos
- Reportes y analítica

Repositorio: https://github.com/Angor04/AutoPartsStore  
Última actualización: 13 de enero de 2026