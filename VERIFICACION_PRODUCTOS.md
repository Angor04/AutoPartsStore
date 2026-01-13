# 🔍 Checklist de Verificación

He hecho algunos cambios. Ahora sigue estos pasos:

## 1️⃣ Verifica en Supabase Dashboard

### Abre Supabase y ve a Table Editor:
1. https://supabase.com/dashboard
2. Selecciona proyecto **AutoPartsStore**
3. En el menú izquierdo, abre **Table Editor**

### Verifica Categorías:
- Haz clic en tabla **categorias**
- ¿Ves 5 filas? (Aceites, Filtros, Neumáticos, Frenos, Motor)
- Si NO VES NADA → El SQL no se ejecutó correctamente

### Verifica Productos:
- Haz clic en tabla **productos**
- ¿Ves 20 filas?
- Si NO VES NADA → El SQL no se ejecutó correctamente

---

## 2️⃣ Si VES los datos en Supabase, pero NO en tu tienda:

Haz esto:

### Opción A: Recarga dura del navegador
1. Abre http://localhost:4323
2. Presiona **Ctrl + Shift + Del** (Borrar caché)
3. Selecciona "Todas las cookies y datos de sitios"
4. Recarga con **Ctrl + F5**

### Opción B: Detén y reinicia el servidor
1. En terminal donde corre `npm run dev`, presiona **Ctrl + C** para detener
2. Ejecuta: `npm run dev` nuevamente
3. Abre http://localhost:4323

---

## 3️⃣ Si NO VES los datos en Supabase:

Significa que el SQL no se ejecutó. Ejecuta nuevamente:

### PASO 1: Copia el archivo completo `01_SCHEMA_BASE.sql`
1. Abre archivo: `docs/01_SCHEMA_BASE.sql`
2. Selecciona TODO (Ctrl + A)
3. Copia (Ctrl + C)

### PASO 2: Pega en Supabase SQL Editor
1. Ve a Supabase → SQL Editor
2. Nueva Query (+)
3. Pega TODO (Ctrl + V)
4. Haz clic en **RUN** ▶️
5. Espera a "Query executed successfully"

### PASO 3: Copia `02_DATOS_PRUEBA.sql`
1. Abre archivo: `docs/02_DATOS_PRUEBA.sql`
2. Selecciona TODO
3. Copia

### PASO 4: Pega en Supabase SQL Editor
1. Nueva Query (+)
2. Pega
3. **RUN** ▶️
4. Espera a "20 rows affected in productos"

---

## 📋 Checklist

- [ ] Vi las 5 categorías en Supabase Table Editor
- [ ] Vi los 20 productos en Supabase Table Editor
- [ ] Recargué el navegador con Ctrl + F5
- [ ] Reinicié el servidor (Ctrl + C y npm run dev)
- [ ] Abro http://localhost:4323
- [ ] ¡VEO LOS 20 PRODUCTOS!

---

## 🆘 Si Aún No Funciona

Abre DevTools (F12) en el navegador → Consola y dime:
- ¿Ves algún mensaje de error?
- ¿Qué dice exactamente?

Cópialo y comparte conmigo.
