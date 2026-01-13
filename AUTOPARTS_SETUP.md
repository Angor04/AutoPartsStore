🔧 AutoPartsStore - Transformación de FashionStore

CAMBIOS REALIZADOS:
═══════════════════════════════════════════════════════════════

✅ 1. NOMBRES Y BRANDING
   • FashionStore → AutoPartsStore en todos los layouts
   • Actualizado el título y descripciones en todas las páginas
   • Logo con emoji 🔧 para representar autopartes

✅ 2. COLORES Y TEMA
   • Navy (azul) → Red-600 (rojo) para color primario
   • Gold → Amber para acentos
   • Tema industrial/mecánico en lugar de moda premium

✅ 3. TEXTOS Y DESCRIPCIONES
   • "Moda Masculina Premium" → "Recambios y Piezas para Coches"
   • Actualizado hero section con nuevo contenido
   • Botones ahora dicen "Explorar Catálogo" en lugar de "Ver Colección"

✅ 4. COMPONENTES ADAPTADOS
   • ProductCard: Colores actualizados a rojo
   • Button: Variantes actualizadas con colores autopartes
   • Página de categorías: Header rojo
   • Footer: Descripción actualizada

✅ 5. CARRITO
   • localStorage cambiado de 'fashionstore-cart' a 'autopartsstore-cart'
   • El carrito mantiene toda su funcionalidad

═══════════════════════════════════════════════════════════════

PRÓXIMOS PASOS:
═══════════════════════════════════════════════════════════════

1. CREAR CATEGORÍAS EN SUPABASE:
   ────────────────────────────────
   a) Ve a tu proyecto Supabase: https://app.supabase.com
   b) Abre el "SQL Editor"
   c) Copia y ejecuta el contenido de: docs/AUTOPARTS_CATEGORIES.sql
   
   Esto creará categorías como:
   • Aceites y Fluidos
   • Bujías y Encendido
   • Neumáticos
   • Filtros
   • Frenos
   • Y más...

2. AGREGAR PRODUCTOS:
   ─────────────────────
   Opción A - Vía Admin Dashboard:
   a) Ve a http://localhost:4322/admin/productos/
   b) Crea productos nuevos con estas categorías
   
   Opción B - Vía SQL (Supabase):
   Ejecuta queries como:
   
   INSERT INTO products (name, slug, description, price, stock, category_id, is_featured)
   VALUES (
     'Aceite Motor 5W30',
     'aceite-motor-5w30',
     'Aceite sintético para motor 5W30, 1L',
     1599,  -- 15,99€ en céntimos
     50,
     (SELECT id FROM categories WHERE slug = 'aceite'),
     true
   );

3. AGREGAR IMÁGENES:
   ─────────────────────
   • Usa URLs de imágenes online (Unsplash, Pexels, etc.)
   • O sube a Supabase Storage y obtén las URLs

4. SUBIR A PRODUCCIÓN:
   ────────────────────
   Una vez todo listo:
   • npm run build
   • npm run preview
   • Deploya a Vercel, Netlify, etc.

═══════════════════════════════════════════════════════════════

ESTRUCTURA DE DATOS IMPORTANTE:
═══════════════════════════════════════════════════════════════

La estructura de la base de datos es igual, solo cambió el contenido:

CATEGORIES:
  id (UUID)
  name (VARCHAR) - Ej: "Aceites y Fluidos"
  slug (VARCHAR) - Ej: "aceite"
  description (TEXT)
  image_url (TEXT)

PRODUCTS:
  id (UUID)
  name (VARCHAR) - Ej: "Aceite Motor 5W30"
  slug (VARCHAR)
  description (TEXT)
  price (INTEGER) - En céntimos
  stock (INTEGER)
  category_id (UUID) - Referencia a categories
  image_urls (TEXT[]) - Array de URLs
  is_featured (BOOLEAN)

═══════════════════════════════════════════════════════════════

ARCHIVOS MODIFICADOS:
═══════════════════════════════════════════════════════════════

🎨 Layouts:
  • src/layouts/BaseLayout.astro - Título y descripción por defecto
  • src/layouts/PublicLayout.astro - Logo y footer
  • src/layouts/AdminLayout.astro - Panel admin

🎭 Componentes:
  • src/components/ui/Button.astro - Colores rojo/amber
  • src/components/product/ProductCard.astro - Colores actualizados

📄 Páginas:
  • src/pages/index.astro - Hero section y featured products
  • src/pages/productos/index.astro - Catálogo completo
  • src/pages/categoria/[slug].astro - Página por categoría

💾 Estado:
  • src/stores/cart.ts - Clave localStorage actualizada

═══════════════════════════════════════════════════════════════

COLORES AHORA USADOS:
═══════════════════════════════════════════════════════════════

Primario:       red-600 (#dc2626) - Rojo vibrante
Hover:          red-700 (#b91c1c)
Acentos:        amber-500 (#f59e0b) - Naranja/dorado
Texto oscuro:   charcoal-900 (#1a1a1a)
Fondo:          ivory-50 (#faf8f6)

═══════════════════════════════════════════════════════════════

¡LA TIENDA ESTÁ LISTA PARA AUTOPARTES! 🚗🔧
═══════════════════════════════════════════════════════════════
