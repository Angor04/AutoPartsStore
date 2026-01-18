# Instrucciones para Habilitar Carrito Persistente

## Descripción

Este documento detalla cómo activar el sistema de carrito persistente que:
- **Usuarios autenticados**: Su carrito se guarda en la base de datos (persiste entre sesiones)
- **Usuarios invitados**: Su carrito se guarda en localStorage (se pierde al cerrar el navegador)

## Pasos para Implementar

### 1. Ejecutar la Migración SQL en Supabase (CRÍTICO)

**⚠️ IMPORTANTE: Este paso debe completarse PRIMERO**

1. Ve a **Supabase Dashboard** → Tu proyecto
2. Abre **SQL Editor** (en la parte izquierda)
3. Crea una **New Query**
4. Copia el contenido completo del archivo: `docs/08_CREAR_CARRITO_TEMPORAL.sql`
5. Pega en el SQL Editor
6. Haz clic en **RUN** (esquina superior derecha)
7. Deberías ver el mensaje: "Success. No rows returned."

**Lo que hace este SQL:**
- Crea la tabla `carrito_temporal` para almacenar carritos de usuarios autenticados
- Añade políticas de Row Level Security (RLS) para que cada usuario solo vea su carrito
- Crea índices para optimizar búsquedas

### 2. Verificar que la Tabla se Creó Correctamente

En Supabase:
1. Ve a **Table Editor**
2. Busca la tabla `carrito_temporal` en la lista
3. Deberías ver sus columnas:
   - `id` (UUID, Primary Key)
   - `usuario_id` (UUID, references auth.users)
   - `items` (JSONB, array de productos)
   - `creado_en` (Timestamp)
   - `actualizado_en` (Timestamp)

### 3. Archivos de Código ya Implementados

Los siguientes archivos ya contienen el código necesario:

#### `src/lib/cartStorage.ts` (NUEVO)
Módulo centralizado para operaciones de carrito:
- `isUserAuthenticated()` - Verifica si hay sesión activa
- `getCurrentUserId()` - Obtiene el ID del usuario autenticado
- `saveCartToDB(items)` - Guarda carrito en Supabase
- `loadCartFromDB()` - Carga carrito de Supabase
- `clearCartFromDB()` - Elimina carrito de Supabase

#### `src/stores/cart.ts` (MODIFICADO)
Store del carrito con lógica dual:
- `saveCart(items)` - Función async que elige entre BD o localStorage según autenticación
- `loadCart()` - Carga carrito de BD (si autenticado) o localStorage (si invitado)
- `clearCartOnLogout()` - Limpia carrito de BD y localStorage al cerrar sesión
- Todas las funciones existentes (addToCart, removeFromCart, etc.)

#### `src/components/islands/CartDisplay.tsx` (MODIFICADO)
- Ahora llama a `loadCart()` cuando el componente se monta
- Carga automáticamente el carrito guardado

#### `src/pages/mi-cuenta/perfil.astro` (MODIFICADO)
- Botón de logout ahora llama a `clearCartOnLogout()`
- Limpia el carrito de BD al cerrar sesión

## Cómo Funciona

### Flujo para Usuarios Invitados
1. Agregan productos al carrito
2. El carrito se guarda en `localStorage`
3. Si cierran el navegador → el carrito se pierde
4. Si se van a otra página y regresan → el carrito sigue ahí

### Flujo para Usuarios Autenticados
1. Se autentican en Supabase
2. Agregan productos al carrito
3. El carrito se guarda en la tabla `carrito_temporal` de Supabase
4. Si cierran el navegador y vuelven a entrar → el carrito sigue ahí
5. Si cierran sesión → se limpia el carrito de BD y localStorage

## Pruebas Recomendadas

### Test 1: Carrito de Invitado (sin persistencia)
```
1. No iniciar sesión
2. Agregar producto al carrito → debe aparecer el contador
3. Cerrar la pestaña/navegador
4. Volver a abrir → carrito vacío ✓
```

### Test 2: Carrito de Usuario Autenticado (con persistencia)
```
1. Iniciar sesión
2. Agregar producto al carrito → debe aparecer el contador
3. Cerrar la pestaña/navegador
4. Volver a abrir y iniciar sesión → carrito sigue ahí ✓
```

### Test 3: Logout
```
1. Iniciar sesión
2. Agregar producto al carrito
3. Hacer clic en "Cerrar Sesión" en /mi-cuenta/perfil
4. Volvers a iniciar sesión → carrito vacío ✓
```

## Estructura de Datos

### Tabla: `carrito_temporal`
```sql
{
  id: UUID,           -- Identificador único
  usuario_id: UUID,   -- FK a auth.users
  items: JSONB,       -- Array de CartItem
  creado_en: TIMESTAMP,
  actualizado_en: TIMESTAMP
}
```

### Estructura de items (JSONB)
```json
[
  {
    "id": "uuid-del-producto",
    "name": "Producto 1",
    "slug": "producto-1",
    "price": 29.99,
    "quantity": 1,
    "image": "https://...",
    "stock": 10
  }
]
```

## Troubleshooting

### El carrito no persiste para usuarios autenticados
1. Verifica que la tabla `carrito_temporal` existe en Supabase
2. Confirma que las políticas RLS están habilitadas
3. Revisa la consola del navegador para errores

### El carrito de invitado se pierde inmediatamente
- Esto es comportamiento esperado, el carrito solo persiste mientras la sesión del navegador está abierta

### Error "Unauthorized" al guardar carrito autenticado
1. Verifica que el usuario está correctamente autenticado en Supabase
2. Confirma que las políticas RLS son correctas (auth.uid() = usuario_id)

## Archivos Modificados

- ✅ `src/lib/cartStorage.ts` (NUEVO)
- ✅ `src/stores/cart.ts` (MODIFICADO)
- ✅ `src/components/islands/CartDisplay.tsx` (MODIFICADO)
- ✅ `src/pages/mi-cuenta/perfil.astro` (MODIFICADO)
- 📋 `docs/08_CREAR_CARRITO_TEMPORAL.sql` (SQL a ejecutar en Supabase)

## Estado de Implementación

- ✅ Código backend implementado
- ✅ Componentes integrados
- ⏳ **PENDIENTE: Ejecutar SQL en Supabase** ← PRÓXIMO PASO

## Próximos Pasos

1. **AHORA**: Ejecuta el SQL en Supabase SQL Editor
2. Prueba el carrito como invitado (debe perderse al cerrar navegador)
3. Prueba el carrito como usuario autenticado (debe persistir)
4. Verifica el botón de logout (debe limpiar el carrito)

---

**Nota**: Si encuentras problemas, revisa la consola del navegador (F12) para mensajes de error específicos.
