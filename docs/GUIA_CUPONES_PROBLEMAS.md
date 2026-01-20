# Guía para Arreglar Cupones

## Paso 1: Verificar que los Cupones Existan en la BD

1. Abre **Supabase Dashboard** → Tu proyecto
2. Ve a **SQL Editor** (parte izquierda)
3. Crea una nueva query y copia esto:

```sql
-- Ver todos los cupones
SELECT 
  id,
  codigo,
  descripcion,
  tipo_descuento,
  valor_descuento,
  cantidad_minima_compra,
  limite_usos,
  usos_totales,
  fecha_inicio,
  fecha_expiracion,
  activo
FROM cupones
ORDER BY creado_en DESC;
```

4. **Ejecuta la query** (botón Play)
5. Deberías ver estos 3 cupones:
   - `BIENVENIDO10` - 10% descuento, mínimo 30€
   - `ENVIOGRATIS` - 5.99€ descuento, mínimo 50€
   - `VERANO20` - 20% descuento, mínimo 100€

## Paso 2: Si NO Ves Cupones, Insértalos

Si la tabla está vacía, ejecuta esto:

```sql
INSERT INTO cupones (codigo, descripcion, tipo_descuento, valor_descuento, limite_usos, cantidad_minima_compra, fecha_inicio, fecha_expiracion, activo)
VALUES 
  ('BIENVENIDO10', 'Descuento de bienvenida 10%', 'porcentaje', 10, 100, 30, NOW(), NOW() + INTERVAL '1 year', true),
  ('ENVIOGRATIS', 'Envío gratis en compras +50€', 'cantidad_fija', 5.99, NULL, 50, NOW(), NOW() + INTERVAL '6 months', true),
  ('VERANO20', 'Descuento de verano 20%', 'porcentaje', 20, 50, 100, NOW(), NOW() + INTERVAL '3 months', true)
ON CONFLICT (codigo) DO NOTHING;
```

## Paso 3: Verificar la Función SQL

La función `validar_cupon` debe estar creada. Testa esto en SQL Editor:

```sql
-- Prueba con BIENVENIDO10 (10% si compra >= 30€)
SELECT * FROM validar_cupon('BIENVENIDO10', NULL, 100);
-- Deberías ver: (id, true, 10, 'Descuento de bienvenida 10%', 'Descuento de 10€ aplicado')

-- Prueba con ENVIOGRATIS (5.99€ si compra >= 50€)
SELECT * FROM validar_cupon('ENVIOGRATIS', NULL, 60);
-- Deberías ver: (id, true, 5.99, 'Envío gratis...', '...')

-- Prueba con compra menor (debe fallar)
SELECT * FROM validar_cupon('BIENVENIDO10', NULL, 20);
-- Deberías ver: valido = false, con mensaje de compra mínima
```

## Paso 4: Probar en el Checkout

1. Abre tu tienda en el navegador
2. Agrega productos al carrito
3. Ve a `/checkout`
4. En la sección "Código de Descuento", escribe: `BIENVENIDO10`
5. Haz clic en "Aplicar"

### Qué Debería Pasar:
✅ Mensaje en azul: "Validando cupón..."
✅ Si es válido: desaparece el input, se ve el cupón aplicado
✅ Si es inválido: mensaje en rojo con la razón

### Si No Funciona:
1. **Abre la Consola del Navegador** (F12 → Console)
2. Mira los logs:
   - `🎟️ Validando cupón: BIENVENIDO10 Subtotal: 150`
   - `📊 Resultado de validar_cupon: {...}`
3. Comparte el error que veas

## Paso 5: Debug API

Si quieres ver qué está pasando exactamente en la API:

1. Abre: `http://localhost:3000/api/cupones/debug`
2. Verás un JSON con:
   - Todos los cupones de la BD
   - Resultado de prueba con `BIENVENIDO10`
   - Cualquier error

## Tablero de Campos Requeridos

| Campo | Tipo | Requerido | Ejemplo |
|-------|------|-----------|---------|
| `codigo` | TEXT | ✅ | BIENVENIDO10 |
| `descripcion` | TEXT | ✅ | Descuento de bienvenida 10% |
| `tipo_descuento` | TEXT | ✅ | porcentaje ó cantidad_fija |
| `valor_descuento` | DECIMAL | ✅ | 10 (para 10%) ó 5.99 (para €) |
| `cantidad_minima_compra` | DECIMAL | ❌ | 30 (mínimo 30€) |
| `limite_usos` | INT | ❌ | 100 (máx 100 usos) |
| `fecha_expiracion` | TIMESTAMP | ✅ | NOW() + INTERVAL '1 year' |
| `activo` | BOOLEAN | ✅ | true |

## Validaciones que Hace la Función SQL

Cuando llamas `/api/cupones/validar` con código `BIENVENIDO10` y subtotal `150`:

1. ✅ ¿El cupón existe?
2. ✅ ¿Está activo? (`activo = true`)
3. ✅ ¿Aún no está expirado? (`fecha_expiracion > NOW()`)
4. ✅ ¿La compra cumple el mínimo? (`subtotal >= cantidad_minima_compra`)
5. ✅ ¿Sigue disponible? (`usos_totales < limite_usos` si tiene límite)
6. ✅ ¿El usuario no lo usó antes? (si `uso_unico = true`)
7. ✅ Calcula el descuento según el tipo

## Problemas Comunes

### "Cupón no válido"
- Verifica que escribas el código exacto (mayúsculas)
- Copia de la tabla `cupones`: BIENVENIDO10, ENVIOGRATIS, VERANO20

### "Compra mínima requerida: 30€"
- El cupón `BIENVENIDO10` requiere compra mínima de 30€
- Agrega más productos al carrito

### "Este cupón ha expirado"
- El cupón tiene fecha de expiración
- En el SQL INSERT, verifica: `NOW() + INTERVAL '1 year'`

### "Ya has usado este cupón anteriormente"
- Solo aplica si tu usuario está logueado
- Cada usuario solo puede usar una vez cada cupón

---

**¿Necesitas ayuda?** Ejecuta los pasos 1-3 y comparte el resultado en consola.
