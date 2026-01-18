# ⚙️ PRÓXIMO PASO: Ejecutar SQL en Supabase

## 🎯 Objetivo
Crear la tabla `carrito_temporal` en Supabase que almacenará los carritos de usuarios autenticados.

## 📋 Pasos a Seguir (4 minutos)

### Paso 1: Acceder a Supabase
1. Abre https://supabase.com
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto (ej: "Fashion Store")

### Paso 2: Abrir SQL Editor
En el menú izquierdo:
```
Proyecto > SQL Editor > New Query
```

O busca **SQL Editor** en la navegación lateral.

### Paso 3: Copiar SQL
Copia TODO el contenido del archivo:
```
docs/08_CREAR_CARRITO_TEMPORAL.sql
```

**El SQL se ve así:**
```sql
-- Crear tabla para carritos temporales de usuarios autenticados
CREATE TABLE IF NOT EXISTS carrito_temporal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]',
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW(),
  UNIQUE(usuario_id)
);

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_carrito_usuario_id ON carrito_temporal(usuario_id);

-- Habilitar RLS
ALTER TABLE carrito_temporal ENABLE ROW LEVEL SECURITY;

-- Política para que usuarios solo vean su propio carrito
CREATE POLICY "Usuarios pueden ver su propio carrito"
  ON carrito_temporal FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden actualizar su propio carrito"
  ON carrito_temporal FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden insertar su propio carrito"
  ON carrito_temporal FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden eliminar su propio carrito"
  ON carrito_temporal FOR DELETE
  USING (auth.uid() = usuario_id);
```

### Paso 4: Pegar en Supabase
1. En la ventana de **SQL Editor**, pega el SQL
2. Verifica que esté completo

### Paso 5: Ejecutar
Haz clic en el botón **RUN** (esquina superior derecha)

**Resultado esperado:**
```
✓ Success. No rows returned.
```

### Paso 6: Verificar
En el menú izquierdo, ve a:
```
Proyecto > Table Editor
```

Deberías ver la tabla `carrito_temporal` en la lista con las siguientes columnas:
- ✅ `id` (UUID)
- ✅ `usuario_id` (UUID)
- ✅ `items` (JSONB)
- ✅ `creado_en` (Timestamp)
- ✅ `actualizado_en` (Timestamp)

### Paso 7: Verificar Políticas RLS
En **Table Editor**, selecciona `carrito_temporal`:
1. Abre la pestaña **RLS Policies**
2. Deberías ver 4 políticas:
   - ✅ "Usuarios pueden ver su propio carrito" (SELECT)
   - ✅ "Usuarios pueden actualizar su propio carrito" (UPDATE)
   - ✅ "Usuarios pueden insertar su propio carrito" (INSERT)
   - ✅ "Usuarios pueden eliminar su propio carrito" (DELETE)

## ✅ Confirmación Final

Una vez completado, tu Supabase tendrá:

```
📊 Table: carrito_temporal
├─ Campos: id, usuario_id, items, creado_en, actualizado_en
├─ Primary Key: id
├─ Foreign Key: usuario_id → auth.users(id)
├─ Unique: usuario_id (un carrito por usuario)
├─ RLS: ✅ HABILITADO
└─ Políticas: ✅ 4 políticas activas
```

## 🚀 Después de Esto

Una vez ejecutado el SQL:

1. **El carrito funcionará completamente**
   - Los invitados guardarán en localStorage
   - Los usuarios autenticados guardarán en Supabase
   - Los datos persistirán correctamente

2. **Puedes probar:**
   - Agregar productos como invitado
   - Cerrar y reabrir navegador (carrito desaparece)
   - Iniciar sesión
   - Agregar productos como usuario
   - Cerrar y reabrir navegador (carrito persiste)

3. **Los archivos ya están listos:**
   - ✅ `src/lib/cartStorage.ts` (lógica de BD)
   - ✅ `src/stores/cart.ts` (lógica de store)
   - ✅ `src/components/islands/CartDisplay.tsx` (cargador de carrito)
   - ✅ Política de logout actualizada

## ⚠️ Si Algo Sale Mal

### Error: "table "carrito_temporal" already exists"
La tabla ya existe. Eso es ok, significa que el SQL ya se ejecutó.

### Error: "relation "carrito_temporal" does not exist"
- Verifica que el SQL se ejecutó correctamente
- Busca la tabla en **Table Editor**
- Si no aparece, ejecuta el SQL nuevamente

### El carrito no persiste después de cerrar sesión
- Verifica que iniciaste sesión correctamente
- Revisa la consola del navegador (F12) para errores
- Confirma que la tabla tiene datos en **Table Editor**

### Error de permisos (403 Unauthorized)
- Verifica que las RLS Policies están correctas
- Confirma que `auth.uid() = usuario_id` coincide en todas las políticas
- Re-ejecuta el SQL

## 📞 Soporte

Si tienes problemas:
1. Revisa la consola del navegador (F12)
2. Verifica que la tabla existe en Supabase
3. Confirma que las políticas RLS están habilitadas
4. Revisa los logs de Supabase (SQL Editor > Logs)

---

**⏱️ Tiempo estimado: 5 minutos**

**🎉 Cuando termines, el sistema de carrito persistente estará completamente funcional!**
