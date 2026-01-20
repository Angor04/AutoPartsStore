# 🧪 CÓMO PROBAR LOS ARREGLOS

## ✅ Lo que se arregló

1. ✅ Los productos ahora aparecen en la página de confirmación
2. ✅ El carrito se limpia automáticamente después de comprar

## 🚀 Pasos para Probar

### Paso 1: Inicia el servidor
```bash
npm run dev
```
Espera a que muestre `http://localhost:4322`

### Paso 2: Añade productos al carrito
1. Ve a http://localhost:4322
2. Navega a cualquier categoría
3. Haz clic en "Añadir al carrito" 2-3 veces con diferentes productos
4. Verifica que el contador del carrito muestre la cantidad

### Paso 3: Ve al checkout
1. Haz clic en el ícono del carrito
2. Haz clic en "Proceder al Pago"
3. Deberías ver la página `/checkout` con:
   - Tus productos listados
   - Precios calculados correctamente
   - Opción de aplicar cupón

### Paso 4: Completa el formulario
Rellena:
- Nombre: `Juan Pérez`
- Email: `juan@example.com`
- Teléfono: `+34 912 345 678`
- Dirección: `Calle Principal 123`
- Ciudad: `Madrid`
- Provincia: `Madrid`
- Código Postal: `28001`
- País: `ES`

### Paso 5: (Opcional) Aplica cupón
1. Escribe: `ENVIOGRATIS` (descuento €5.99)
2. O: `BIENVENIDO10` (10% descuento)
3. Haz clic en "Validar Cupón"
4. Verifica que el total se actualice

### Paso 6: Haz clic en "Confirmar Pedido"
- Se abrirá la página de Stripe Checkout
- Deberías ver tus productos listados

### Paso 7: Completa el pago
En Stripe Checkout:
1. **Tarjeta**: `4242 4242 4242 4242`
2. **Mes/Año**: `12/26` (o cualquier fecha futura)
3. **CVC**: `123`
4. **Email**: Usa el mismo email que en checkout

Haz clic en "Pagar"

### Paso 8: Verifica la confirmación
Deberías ver `/pedido-confirmado?session_id=cs_test_...` con:

✅ **Confirmación visible**
- Checkmark verde "✅ ¡Gracias por tu compra!"
- Número de orden (ORD-TIMESTAMP)
- Fecha del pedido
- Estado del pedido
- Total a pagar

✅ **Productos listados**
- Nombre de cada producto
- Cantidad comprada
- Subtotal por producto
- (SIN imágenes, solo datos)

✅ **Desglose de precios**
```
Subtotal:    €99.98
Descuento:   -€5.99 (si aplicaste cupón)
Envío:       Gratis
─────────────────────
Total:       €93.99
```

✅ **Botones de acción**
- "Ver Mis Pedidos"
- "Seguir Comprando"

### Paso 9: Verifica que el carrito está limpio
1. Haz clic en "Seguir Comprando"
2. Vuelve a `/carrito`
3. **Debe estar vacío** ✓
4. El contador debe mostrar `0`

### Paso 10: Verifica en la base de datos
Abre Supabase y ejecuta:

```sql
-- Ver la orden que acamos de crear
SELECT * FROM ordenes 
ORDER BY creada_en DESC 
LIMIT 1;
```

Deberías ver:
- `numero_orden`: `ORD-TIMESTAMP`
- `email_cliente`: Tu email
- `total`: El total pagado
- `productos`: JSON con tus productos
- `estado`: 'pendiente' (o 'procesando')

Haz clic en la fila para expandir y ver el JSON `productos`:
```json
[
  {
    "nombre": "Nombre del Producto",
    "cantidad": 2,
    "precio": 49.99,
    "subtotal": 99.98,
    "producto_id": 1
  }
]
```

---

## 🔍 Verificación en el Navegador

### Abre DevTools (F12)

**Console tab**:
Deberías ver mensajes como:
```
📦 Procesando sesión de Stripe: cs_test_...
✅ Orden creada desde Stripe: ORD-1704067200000
🗑️ Carrito limpiado del navegador
🗑️ Carrito limpiado de nanostores
```

**Network tab**:
Deberías ver:
- POST `/api/pagos/procesar-stripe` → 200 OK
- GET `/pedido-confirmado` → 200 OK

---

## 📊 Checklist de Validación

Marca cada uno cuando lo veas:

### Checkout
- [ ] Página carga correctamente
- [ ] Productos se muestran
- [ ] Precios son correctos
- [ ] Formulario se completa sin errores
- [ ] Cupón se aplica (si lo usas)
- [ ] Botón "Confirmar Pedido" redirige a Stripe

### Stripe Checkout
- [ ] Página carga
- [ ] Productos visibles
- [ ] Total correcto
- [ ] Tarjeta 4242... se acepta
- [ ] Pago se procesa sin errores

### Confirmación
- [ ] Se ve "¡Gracias por tu compra!"
- [ ] Número de orden visible
- [ ] Estado muestra estado correcto
- [ ] **PRODUCTOS LISTADOS** ✓ ← IMPORTANTE
- [ ] Desglose de precios correcto
- [ ] Botones de acción funcionan

### Carrito
- [ ] Carrito vacío después de pagar ✓ ← IMPORTANTE
- [ ] Contador muestra 0
- [ ] Puedo añadir productos nuevamente

### Base de Datos
- [ ] Orden aparece en tabla `ordenes`
- [ ] `productos` JSON tiene datos
- [ ] `email_cliente` es correcto
- [ ] `total` es correcto

---

## ⚠️ Si Algo Sale Mal

### No aparecen productos en confirmación

**Solución 1**: Recarga la página
```
F5 o Ctrl+R
```

**Solución 2**: Verifica los logs
```
Abre DevTools (F12) → Console
Busca errores rojos
```

**Solución 3**: Verifica en BD
```
Supabase → ordenes → Ver la última orden
¿Tiene datos en 'productos'?
```

**Solución 4**: Revisa el servidor
```
npm run dev
Busca errores en la terminal
¿Dice "❌ Error"?
```

### Carrito no se limpia

**Solución 1**: Recarga la página
```
F5 o Ctrl+R
```

**Solución 2**: Limpia manualmente
```
DevTools (F12) → Application → Storage → Local Storage
Elimina todas las claves que empiezan con "cart-"
```

**Solución 3**: Verifica el script
```
DevTools → Console
¿Ves el mensaje "🗑️ Carrito limpiado"?
Si no, el script no se ejecutó
```

---

## 🧪 Test Cases

### Test 1: Compra Simple
- 1 producto
- Sin cupón
- Pago exitoso
- **Esperar**: Producto en confirmación, carrito limpio

### Test 2: Compra Múltiple
- 3+ productos diferentes
- Cantidades diferentes (ej: 2, 1, 3)
- Sin cupón
- **Esperar**: Todos los productos con cantidades correctas

### Test 3: Con Cupón
- 2 productos
- Aplicar `ENVIOGRATIS`
- Pago exitoso
- **Esperar**: Descuento mostrado en desglose

### Test 4: Con Cupón 10%
- 1 producto €100
- Aplicar `BIENVENIDO10`
- Pago exitoso
- **Esperar**: Descuento €10.00 mostrado

### Test 5: Navegación Post-Compra
- Completa compra
- Haz clic "Seguir Comprando"
- Añade productos nuevamente
- **Esperar**: Puedas comprar sin problemas

---

## 📞 Datos de Prueba

### Email para pruebas
```
test@example.com
agonzalezcruces2004@gmail.com
tu-email@example.com
```

### Nombre para pruebas
```
Test User
Juan Pérez
Maria García
```

### Dirección para pruebas
```
Calle Prueba 123, Madrid 28001, ES
Calle Principal 456, Barcelona 08002, ES
```

### Tarjetas para pruebas
```
✅ Éxito:      4242 4242 4242 4242
❌ Rechazo:    4000 0000 0000 0002
⚠️ 3D Secure: 4000 0025 0000 3155 (OTP: 123456)
```

---

## 📝 Notas Importantes

### Sobre los Productos
- Los productos se guardan en JSON `productos` de la orden
- **NO** se usan imágenes en la confirmación (ahora es simple)
- Se guardan: nombre, cantidad, precio, subtotal, producto_id

### Sobre el Carrito
- Se limpia `sessionStorage`
- Se limpia `nanostores` (si existe)
- Se ejecuta automáticamente al llegar a confirmación
- Solo si viene de Stripe (detecta `session_id` en URL)

### Sobre la Confirmación
- La página se carga del servidor (Astro)
- Luego se ejecuta el script de limpiar carrito
- No hay problema si tardaloading un poco

---

## ✅ Éxito

Si ves:
1. ✅ Productos en confirmación
2. ✅ Carrito vacío después
3. ✅ Orden en base de datos

**¡TODO FUNCIONA! 🎉**

---

## 📊 Comparación Antes vs Después

| Aspecto | Antes ❌ | Después ✅ |
|---------|---------|-----------|
| Productos visibles | No | Sí |
| Carrito se limpia | No | Sí |
| Orden en BD | Sí | Sí |
| Confirmación cargaba | Parcialmente | Completamente |
| Script limpiar carrito | No | Sí |

---

**Última actualización**: 19 de enero 2026
**Estado**: ✅ LISTO PARA PROBAR

