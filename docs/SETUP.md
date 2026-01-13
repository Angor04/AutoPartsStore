# FashionStore - Guía de Configuración Inicial

## 🚀 Configuración Paso a Paso

### Paso 1: Crear Proyecto Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Haz clic en "New Project"
3. Rellena los datos:
   - **Project Name**: fashionstore
   - **Database Password**: (guárdalo en un lugar seguro)
   - **Region**: Elige el más cercano (ej: Europe - Frankfurt)
4. Espera a que se cree (5-10 minutos)

### Paso 2: Obtener las Credenciales

1. En tu proyecto Supabase, ve a **Settings > API**
2. Copia:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_ANON_KEY`
   - `service_role` secret → `SUPABASE_SERVICE_KEY`

### Paso 3: Crear Estructura de Base de Datos

1. Ve a **SQL Editor** en Supabase
2. Crea una nueva query
3. Copia todo el contenido de `docs/SUPABASE_SCHEMA.sql`
4. Ejecuta (**Run** o Ctrl+Enter)

### Paso 4: Crear Bucket de Storage

1. Ve a **Storage** en Supabase
2. Clic en **New Bucket**
3. Nombre: `products-images`
4. Haz público (checkbox)
5. Crear

### Paso 5: Configurar Archivo .env

```bash
# En la raíz del proyecto
cp .env.example .env
```

Edita `.env` y completa:
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=xxxxxx.eyJxxxxx
SUPABASE_SERVICE_KEY=xxxxxx.eyJxxxxx
SUPABASE_STORAGE_BUCKET=products-images
SUPABASE_STORAGE_URL=https://xxxxx.supabase.co/storage/v1
SITE_URL=http://localhost:3000
NODE_ENV=development
```

### Paso 6: Instalar Dependencias

```bash
npm install
```

### Paso 7: Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará en: **http://localhost:3000**

## 🎯 Primeros Pasos

### 1. Crear Categorías (Opcional)

En SQL Editor de Supabase, ejecuta:
```sql
INSERT INTO categories (name, slug, description) VALUES
  ('Premium Shirts', 'premium-shirts', 'Exclusive premium shirts collection'),
  ('Casual Wear', 'casual-wear', 'Comfortable casual clothing');
```

### 2. Crear Producto de Prueba

Usando la página `/admin/productos/nuevo`:
1. Ve a http://localhost:3000/admin/productos/nuevo
2. Rellena el formulario
3. Sube una imagen
4. Clic en "Crear Producto"

### 3. Ver en la Tienda

Ve a http://localhost:3000 para ver el producto publicado

## 🔧 Troubleshooting

### Error: "Missing Supabase environment variables"
- **Solución**: Verifica que `.env` existe y tiene las variables correctas
- Reinicia el servidor (`npm run dev`)

### Las imágenes no se ven
- **Solución**: Verifica que el bucket `products-images` está público en Supabase Storage
- Comprueba que la URL en la base de datos es correcta

### El carrito no persiste
- **Solución**: Verifica que localStorage está habilitado en el navegador
- Abre DevTools (F12) y revisa localStorage en Application

### Errores de RLS
- **Solución**: En desarrollo, puedes deshabilitarlas temporalmente en SQL Editor:
  ```sql
  ALTER TABLE products DISABLE ROW LEVEL SECURITY;
  ```

## 📦 Variables de Entorno Explicadas

| Variable | Descripción |
|----------|-------------|
| `SUPABASE_URL` | URL de tu proyecto Supabase |
| `SUPABASE_ANON_KEY` | Clave pública para operaciones públicas |
| `SUPABASE_SERVICE_KEY` | Clave privada para operaciones admin |
| `SUPABASE_STORAGE_BUCKET` | Nombre del bucket de imágenes |
| `SITE_URL` | URL de la aplicación (localhost en dev) |
| `NODE_ENV` | Entorno: 'development' o 'production' |

## 🚢 Deploying a Producción

### Opción 1: Coolify (VPS Personal)

1. **Instala Coolify** en tu VPS:
   ```bash
   curl -fsSL https://get.cooli.fi | bash
   ```

2. **Crea Dockerfile**:
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY . .
   RUN npm install
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "preview"]
   ```

3. **Sube el proyecto** a Coolify
4. **Configura variables** de entorno en Coolify
5. **Deploy!**

### Opción 2: Vercel (Recomendado para Astro)

1. Push tu código a GitHub
2. Ve a [vercel.com](https://vercel.com)
3. Importa tu repositorio
4. Configura las variables de entorno
5. Click en Deploy

### Opción 3: Netlify

Pasos similares a Vercel, pero con mejor soporte para Astro hybrid.

## 📚 Documentación Útil

- [Astro Docs](https://docs.astro.build)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Nano Stores](https://github.com/nanostores/nanostores)

## 🆘 Contacto

Si tienes problemas, revisa:
1. Los logs en la consola (`npm run dev`)
2. DevTools del navegador (F12)
3. Supabase Dashboard para errores de base de datos

---

**Última actualización**: Enero 2025
