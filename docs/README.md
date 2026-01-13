# FashionStore - Documentación Completa

## 📋 Descripción del Proyecto

**FashionStore** es un e-commerce de moda masculina premium desarrollado con:
- **Frontend**: Astro 5.0 (SSG + SSR híbrido)
- **Estilos**: Tailwind CSS con paleta personalizada
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Estado**: Nano Stores para persistencia del carrito

## 🎯 Arquitectura Técnica

### Stack Tecnológico

```
┌─────────────────────────────────────────────┐
│         Frontend (Astro 5.0)                │
│  ├─ SSG: Catálogo, Productos, Categorías  │
│  ├─ SSR: Carrito, Admin, Checkout         │
│  └─ Islands: Componentes interactivos     │
└──────────────────┬──────────────────────────┘
                   │
         ┌─────────▼─────────┐
         │   Nano Stores    │
         │  (Cart State)    │
         └─────────┬─────────┘
                   │
┌──────────────────▼──────────────────┐
│      Supabase (Backend)             │
├─────────────────────────────────────┤
│ • PostgreSQL (Datos)                │
│ • Auth (Administradores)            │
│ • Storage (Imágenes de productos)   │
└─────────────────────────────────────┘
```

## 📁 Estructura de Carpetas

```
fashionstore/
├── public/
│   └── fonts/                    # Tipografías custom
├── src/
│   ├── components/
│   │   ├── ui/                   # Componentes base (Button, etc)
│   │   │   ├── Button.astro
│   │   │   └── CartSlideOver.astro
│   │   ├── product/              # Componentes de producto
│   │   │   ├── ProductCard.astro
│   │   │   └── ProductGallery.astro
│   │   └── islands/              # Componentes interactivos
│   │       ├── AddToCartButton.tsx
│   │       └── CartIcon.tsx
│   ├── layouts/
│   │   ├── BaseLayout.astro      # Estructura HTML base
│   │   ├── PublicLayout.astro    # Layout tienda pública
│   │   └── AdminLayout.astro     # Layout panel admin
│   ├── lib/
│   │   ├── supabase.ts           # Cliente Supabase
│   │   └── utils.ts              # Funciones utilitarias
│   ├── pages/
│   │   ├── index.astro           # Home
│   │   ├── productos/
│   │   │   ├── index.astro       # Catálogo
│   │   │   └── [slug].astro      # Detalle de producto
│   │   ├── categoria/
│   │   │   └── [slug].astro      # Categoría
│   │   ├── carrito.astro         # Carrito
│   │   └── admin/
│   │       ├── login.astro       # Login
│   │       ├── index.astro       # Dashboard
│   │       └── productos/        # Gestión de productos
│   ├── stores/
│   │   └── cart.ts               # Nano Store del carrito
│   ├── types/
│   │   └── index.ts              # Tipos TypeScript
│   ├── middleware.ts             # Autenticación
│   └── env.d.ts
├── docs/
│   ├── SUPABASE_SCHEMA.sql       # Esquema DB
│   └── SETUP.md                  # Guía de configuración
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
├── package.json
└── .env.example
```

## 🗄️ Esquema de Base de Datos

### Tablas Principales

#### categories
```sql
id (UUID) - PK
name (VARCHAR) - Nombre único
slug (VARCHAR) - URL-friendly
description (TEXT) - Descripción
image_url (TEXT) - URL de imagen
created_at, updated_at (TIMESTAMP)
```

#### products
```sql
id (UUID) - PK
name (VARCHAR)
slug (VARCHAR) - Único
description (TEXT)
price (INTEGER) - En céntimos
stock (INTEGER)
category_id (UUID) - FK a categories
image_urls (TEXT[]) - Array de URLs
is_featured (BOOLEAN)
created_at, updated_at (TIMESTAMP)
```

#### users (Admin)
```sql
id (UUID) - PK
email (VARCHAR) - Único
full_name (VARCHAR)
role (VARCHAR) - 'admin', 'editor'
is_active (BOOLEAN)
created_at, updated_at (TIMESTAMP)
```

#### orders
```sql
id (UUID) - PK
user_id (UUID) - FK opcional
status (VARCHAR) - pending, processing, shipped, delivered, cancelled
total_amount (INTEGER) - En céntimos
customer_email (VARCHAR)
customer_name (VARCHAR)
shipping_address (TEXT)
payment_status (VARCHAR) - pending, completed, failed
stripe_payment_id (VARCHAR)
created_at, updated_at (TIMESTAMP)
```

#### order_items
```sql
id (UUID) - PK
order_id (UUID) - FK a orders
product_id (UUID) - FK a products
quantity (INTEGER)
price_at_time (INTEGER) - Precio en el momento
created_at (TIMESTAMP)
```

#### settings
```sql
id (UUID) - PK
key (VARCHAR) - Único
value (TEXT)
description (TEXT)
updated_at (TIMESTAMP)
```

## 🔐 Row Level Security (RLS)

- **Categorías**: Lectura pública, escritura admin
- **Productos**: Lectura pública, escritura admin
- **Órdenes**: Lectura del propietario o admin
- **Settings**: Solo admin

## 📦 Supabase Storage

### Bucket: `products-images`
- **Tipo**: Private (lectura pública via policies)
- **Uso**: Almacenar imágenes de productos
- **Path**: `/products/{product_id}/{filename}`
- **URL Base**: `https://[project].supabase.co/storage/v1/object/public/products-images/`

## 🎨 Paleta de Colores

| Color | Hex | Uso |
|-------|-----|-----|
| Navy | #1f4e78 | Primario, CTA |
| Charcoal | #424242 | Texto principal |
| Ivory | #faf3ed | Fondo, texto claro |
| Gold | #d4af37 | Acentos, secundario |

## 🚀 Configuración Inicial

### 1. Variables de Entorno
```bash
cp .env.example .env
```

Completar en `.env`:
```
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_KEY=xxxxx
SUPABASE_STORAGE_BUCKET=products-images
SITE_URL=http://localhost:3000
```

### 2. Supabase Setup
1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ejecutar SQL schema desde `docs/SUPABASE_SCHEMA.sql`
3. Crear bucket `products-images` en Storage
4. Configurar autenticación (Email/Password)

### 3. Instalar Dependencias
```bash
npm install
```

### 4. Desarrollo Local
```bash
npm run dev
# Abre http://localhost:3000
```

## 📄 Funcionalidades Clave

### Tienda Pública
- ✅ Catálogo de productos (SSG)
- ✅ Filtrado por categorías
- ✅ Página de detalle de producto
- ✅ Carrito persistente (localStorage + Nano Store)
- ✅ Galería de imágenes
- ✅ Búsqueda básica (fase 2)

### Panel Admin
- ✅ Login de administradores
- ✅ Dashboard con estadísticas
- ✅ CRUD de productos
- ✅ Subida de múltiples imágenes
- ✅ Control de stock
- ✅ Gestión de categorías (fase 2)

## 🔄 Flujo de Compra

```
1. Usuario navega por productos (SSG)
   ↓
2. Añade productos al carrito (Isla React)
   ↓
3. Carrito persiste en localStorage
   ↓
4. Abre checkout (SSR)
   ↓
5. Introduce datos y paga (Stripe API - fase 2)
   ↓
6. Stock se descuenta automáticamente (transacción atómica)
   ↓
7. Orden se registra en Supabase
```

## 🎯 Próximas Fases

### Hito 2 (60% - Prototipo Funcional)
- [ ] Integración completa con Supabase Auth
- [ ] Página de checkout funcional
- [ ] Integración de Stripe en modo test
- [ ] Página de "Mis Pedidos" para clientes

### Hito 3 (100% - Tienda Viva)
- [ ] Despliegue en VPS (Coolify + Docker)
- [ ] Configuración de SSL
- [ ] Stripe en producción
- [ ] Email confirmations
- [ ] Sistema de notificaciones

## 📱 Responsive Design

Todas las páginas son mobile-first:
- 📱 Mobile (< 640px)
- 📱 Tablet (640px - 1024px)
- 🖥️ Desktop (> 1024px)

## ⚡ Performance

- SSG para productos = carga instantánea
- Imágenes optimizadas con lazy loading
- Minificación CSS/JS automática
- Code splitting en islas React

## 🔒 Seguridad

- RLS en todas las tablas
- Variables de entorno protegidas
- Transacciones atómicas para stock
- Validación de input en cliente y servidor

## 📞 Soporte

Para preguntas o problemas, consultar:
- `/docs/SUPABASE_SCHEMA.sql` - Esquema de DB
- `/astro.config.mjs` - Configuración Astro
- `/tailwind.config.mjs` - Temas CSS

---

**Versión**: 0.1.0
**Fecha**: Enero 2025
**Autor**: Equipo de Desarrollo
