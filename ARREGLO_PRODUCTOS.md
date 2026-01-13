# 🔧 ARREGLO DEFINITIVO - Productos No Aparecen

## El Problema

El error "Invalid API key" que ves en consola **EN REALIDAD SIGNIFICA**: Las políticas RLS de Supabase están BLOQUEANDO la lectura.

## La Solución (2 pasos)

### PASO 1: Verifica que los datos existen en Supabase

1. Abre https://supabase.com/dashboard
2. Tu proyecto → **SQL Editor**
3. **Nueva Query**
4. Copia y ejecuta ESTO:

```sql
SELECT COUNT(*) as total_productos FROM productos;
SELECT COUNT(*) as total_categorias FROM categorias;
```

**¿Qué ves?**
- Si dice `total_productos: 20` y `total_categorias: 5` → Los datos SÍ existen ✅
- Si dice `total_productos: 0` → El SQL nunca se ejecutó ❌

---

### PASO 2: Deshabilita RLS (si los datos existen)

Si en PASO 1 viste 20 productos y 5 categorías, entonces ejecuta ESTO:

```sql
ALTER TABLE productos DISABLE ROW LEVEL SECURITY;
ALTER TABLE categorias DISABLE ROW LEVEL SECURITY;
```

Eso es TODO. Ya está.

---

## PASO 3: Recarga tu tienda

1. Abre http://localhost:4323
2. Presiona **Ctrl + Shift + Del** (borrar caché completo)
3. Recarga con **Ctrl + F5**

**¡AHORA DEBERÍAS VER LOS 20 PRODUCTOS!**

---

## ¿Qué pasó?

- Las políticas RLS estaban bloqueando lectura pública
- Al deshabilitarlas, cualquiera puede leer (pero no escribir/editar)
- Los productos ahora son visibles

---

## Si Aún No Aparecen

Dime:
1. ¿Cuántos productos viste en el PASO 1? (20 o 0)
2. ¿Ejecutaste el PASO 2?
3. ¿Ves algún error en consola? (F12 → Console)
