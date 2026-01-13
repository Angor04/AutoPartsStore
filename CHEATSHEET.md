# FashionStore - Cheatsheet de Desarrollo

## 🚀 Quick Start

```bash
# 1. Instalar dependencias
npm install

# 2. Crear archivo .env
cp .env.example .env
# (completar con credenciales de Supabase)

# 3. Ejecutar en desarrollo
npm run dev
# → http://localhost:3000
```

---

## 📁 Dónde ir según la tarea

| Necesito... | Ir a... |
|------------|---------|
| Crear nuevo componente | `/src/components/` |
| Crear nueva página pública | `/src/pages/` |
| Crear página admin | `/src/pages/admin/` |
| Modificar estilos | `/tailwind.config.mjs` |
| Agregar función utilitaria | `/src/lib/utils.ts` |
| Modificar tipos | `/src/types/index.ts` |
| Cambiar layout | `/src/layouts/` |
| Gestionar carrito | `/src/stores/cart.ts` |

---

## 🎨 Usar Componentes

### Button
```astro
---
import Button from "@/components/ui/Button.astro";
---

<Button variant="primary" size="md">Enviar</Button>
<!-- Variantes: primary, secondary, outline, ghost -->
<!-- Tamaños: sm, md, lg -->
```

### ProductCard
```astro
---
import ProductCard from "@/components/product/ProductCard.astro";
import { getProducts } from "@/lib/supabase";

const products = await getProducts();
---

{products.map((product) => (
  <ProductCard product={product} />
))}
```

### AddToCartButton (Island)
```astro
---
import AddToCartButton from "@/components/islands/AddToCartButton";
---

<AddToCartButton
  client:load
  productId={product.id}
  productName={product.name}
  price={product.price}
  imageUrl={product.image_urls[0]}
  stock={product.stock}
/>
```

---

## 📦 Supabase Functions

### Leer Datos
```typescript
import { 
  getProducts, 
  getCategories, 
  getProductBySlug,
  getFeaturedProducts 
} from "@/lib/supabase";

const products = await getProducts();
const categories = await getCategories();
const product = await getProductBySlug("camisa-premium");
const featured = await getFeaturedProducts(6);
```

### Admin Operations
```typescript
import { getSupabaseAdmin } from "@/lib/supabase";

const admin = getSupabaseAdmin();

// Crear
const { data, error } = await admin
  .from("products")
  .insert({ name: "...", price: 2999, ... });

// Actualizar
await admin
  .from("products")
  .update({ stock: 5 })
  .eq("id", productId);

// Eliminar
await admin
  .from("products")
  .delete()
  .eq("id", productId);
```

---

## 🛒 Carrito (Nano Store)

```typescript
import { 
  cartStore, 
  addToCart, 
  removeFromCart,
  updateCartItem,
  clearCart,
  getCartTotal,
  getCartCount
} from "@/stores/cart";
import { useStore } from "nanostores";

// En componente React
const items = useStore(cartStore);

// Agregar item
addToCart({
  product_id: "123",
  quantity: 2,
  price: 2999,
  name: "Camisa",
  image_url: "https://..."
});

// Calcular
const total = getCartTotal(items); // 5998 (céntimos)
const count = getCartCount(items); // 2 (items)

// Limpiar
clearCart();
```

---

## 💰 Precios (Céntimos)

El sistema guarda precios en **céntimos**:

```
29,99 € = 2999
59,90 € = 5990
199,00 € = 19900
```

**Para mostrar**:
```typescript
import { formatPrice } from "@/lib/utils";

formatPrice(2999); // "29,99 €"
```

---

## 📄 Crear Nueva Página

### Página Pública (SSG)
```astro
---
// src/pages/nueva-pagina.astro
import PublicLayout from "@/layouts/PublicLayout.astro";

const title = "Mi Página";
const description = "Descripción para SEO";
---

<PublicLayout title={title} description={description}>
  <!-- Tu contenido -->
</PublicLayout>
```

### Página Admin (SSR)
```astro
---
// src/pages/admin/nueva-admin.astro
import AdminLayout from "@/layouts/AdminLayout.astro";

const title = "Administración";
---

<AdminLayout title={title}>
  <!-- Tu contenido protegido -->
</AdminLayout>
```

---

## 🎯 Estilos Tailwind

### Colores Brand
```html
<!-- Navy (primario) -->
<div class="bg-navy-500 text-navy-900">Navy</div>

<!-- Gold (acentos) -->
<div class="bg-gold-500 text-gold-900">Gold</div>

<!-- Charcoal (texto) -->
<div class="text-charcoal-900">Charcoal</div>

<!-- Ivory (fondo) -->
<div class="bg-ivory-50">Ivory</div>
```

### Utilidades Comunes
```html
<!-- Espaciado -->
<div class="p-4 m-8 gap-6">

<!-- Flexbox -->
<div class="flex items-center justify-between gap-4">

<!-- Grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

<!-- Responsive -->
<div class="text-sm md:text-base lg:text-lg">

<!-- Estados -->
<button class="hover:bg-navy-600 active:bg-navy-700 transition-colors">
```

---

## 🔍 Debug

### Ver Carrito en localStorage
```javascript
// En DevTools Console
JSON.parse(localStorage.getItem('fashionstore-cart'));
```

### Ver Variables de Entorno
```javascript
import.meta.env.SUPABASE_URL
import.meta.env.SUPABASE_ANON_KEY
```

### Logs Supabase
```typescript
import { supabaseClient } from "@/lib/supabase";

// Ver datos
const { data, error } = await supabaseClient
  .from("products")
  .select("*");

if (error) console.error("Error:", error);
console.log("Datos:", data);
```

---

## 📋 Checklist Tareas Comunes

### Agregar nuevo producto a BD
- [ ] Llenar formulario `/admin/productos/nuevo`
- [ ] Subir imágenes
- [ ] Click crear
- [ ] Verificar en `/productos`

### Cambiar color primario
- [ ] Editar `/tailwind.config.mjs` → colores navy
- [ ] Recargar página
- [ ] Verificar cambios

### Agregar nueva categoría
- [ ] Ejecutar SQL: `INSERT INTO categories (...)`
- [ ] Verificar en `/productos`
- [ ] Verificar en home

### Cambiar stock de producto
- [ ] En admin, editar producto
- [ ] Cambiar número de stock
- [ ] Guardar

---

## 🚨 Errores Comunes

### "Missing Supabase environment variables"
```
✗ Solución: Verifica que .env existe y está completo
  npm run dev (reinicia servidor)
```

### "product is undefined"
```
✗ Solución: Verifica que getStaticPaths() devuelve slugs
  Recarga la página
```

### "Carrito vacío después de recargar"
```
✗ Solución: localStorage puede estar bloqueado
  Abre DevTools → Application → Storage → LocalStorage
```

### RLS errors en admin
```
✗ Solución: Usuario no está autenticado en Supabase
  Implementa Supabase Auth en login.astro
```

---

## 📚 Archivos Importantes

| Archivo | Propósito |
|---------|-----------|
| `astro.config.mjs` | Configuración Astro |
| `tailwind.config.mjs` | Tema y colores |
| `tsconfig.json` | TypeScript config |
| `package.json` | Dependencias |
| `.env` | Variables secretas |
| `docs/SUPABASE_SCHEMA.sql` | Schema BD |

---

## 🔗 Links Útiles

- [Astro Docs](https://docs.astro.build)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Nano Stores](https://github.com/nanostores/nanostores)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

---

## 💡 Tips Pro

1. **Hot Reload**: Astro recarga automáticamente en `npm run dev`
2. **TypeScript**: Siempre verifica tipos (red squiggles = errores)
3. **Tailwind**: Usa clases existentes, no escribas CSS personalizado
4. **Componentes**: Siempre reutiliza componentes (DRY)
5. **Variables de entorno**: Nunca commitees `.env` (ignorado en .gitignore)

---

**Última actualización**: Enero 2025
**Versión**: 0.1.0
