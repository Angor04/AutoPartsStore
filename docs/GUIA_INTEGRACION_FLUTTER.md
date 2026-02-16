# Guía de Integración Flutter: Productos, Stock y Carrito

Esta guía documenta la lógica actual implementación en la web (Astro/React) para que pueda ser replicada idénticamente en la aplicación Flutter.

## 1. Modelos de Datos

### Producto (`Product`)
La fuente de verdad es la tabla `productos` en Supabase.
```typescript
interface Product {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string;
  precio: number;          // Precio actual de venta
  precio_original?: number; // Precio "tachado" (MSRP)
  stock: number;           // Stock disponible global
  categoria_id: number;
  urls_imagenes: string[]; // Array de URLs de imágenes
  destacado: boolean;
  activo: boolean;
  especificaciones?: Record<string, string>; // JSONB con detalles
}
```

### Elemento del Carrito (`CartItem`)
Estructura usada para manejar los items dentro del carrito.
```typescript
interface CartItem {
  product_id: string;      // ID del producto
  quantity: number;        // Cantidad seleccionada
  precio: number;          // Precio unitario al momento de añadir
  nombre: string;
  subtotal: number;        // quantity * precio
  imagen?: string;         // URL de la primera imagen
  stock: number;           // Stock máximo disponible (para validaciones UI)
}
```
> **Nota:** El `subtotal` y `total` se calculan en el cliente para visualización, pero el backend debe validar precios finales.

## 2. Gestión de Productos

### Obtención de Datos
- **Fuente**: Cliente de Supabase (`supabaseClient`).
- **Tabla**: `productos`.
- **Filtrado**: `eq('activo', true)` para mostrar solo productos disponibles.
- **Imágenes**: Se usa `urls_imagenes[0]` como imagen principal.

## 3. Lógica del Carrito de Compras

El estado del carrito debe gestionarse de forma reactiva (en Web usamos `nanostores`, en Flutter se recomienda `Provider`, `Riverpod` o `Bloc`).

### A. Estructura del Estado
El estado debe contener una lista de `CartItem[]`.

### B. Añadir Producto (`addToCart`)
1.  **Entrada**: `Product` y `quantity`.
2.  **Lógica**:
    *   Buscar si el producto ya existe en el carrito (`find` por `product_id`).
    *   **Si existe**:
        *   Incrementar la cantidad (`oldQuantity + newQuantity`).
        *   Actualizar stock y precio (por si cambiaron en el backend).
        *   Recalcular `subtotal`.
    *   **Si NO existe**:
        *   Crear nuevo `CartItem` con los datos del producto.
    *   **Validación de Stock Local**: Asegurar que `cantidad_total <= stock_producto`.
3.  **Persistencia**: Llamar a la función de guardado (ver sección 5).

### C. Eliminar Producto (`removeFromCart`)
1.  Filtrar la lista para excluir el item con el `product_id` dado.
2.  Actualizar el estado.
3.  Llamar a la función de guardado.

### D. Actualizar Cantidad (`updateCartItem`)
1.  Buscar el item.
2.  Si `quantity <= 0`, eliminar el item.
3.  Si `quantity > stock`, limitar a `stock`.
4.  Recalcular `subtotal`.
5.  Actualizar el estado y guardar.

## 4. Gestión de Stock (Reserva Local)

Para prevenir errores de UX donde el usuario intenta añadir más productos de los que existen *durante una sesión*:

1.  **Stock Reservado**: Mantener un mapa local `Record<productId, reservedQuantity>`.
2.  **Cálculo**:
    *   `Stock Disponible Visual = Stock Real (DB) - Cantidad en Carrito`.
3.  **UI**: Deshabilitar el botón de "Añadir" o "Incrementar" si `Stock Disponible Visual <= 0`.

## 5. Persistencia y Sincronización

El carrito debe persistir entre recargas y sesiones.

### A. Usuarios No Autenticados (Invitados)
- **Almacenamiento**: Local (SharedPreferences / SecureStorage en Flutter).
- **Clave**: `cart-{sessionId}` (generar un UUID de sesión si no existe).
- **Flujo**: Guardar el JSON del array de items localmente cada vez que cambia el carrito.

### B. Usuarios Autenticados
- **Almacenamiento**: Base de datos Supabase (Tabla `carrito_temporal`).
- **Tabla DB**: `carrito_temporal` (columnas: `usuario_id`, `items` (JSONB), `actualizado_en`).
- **Al Iniciar Sesión**:
    1.  Cargar carrito de la BD.
    2.  Si hay carrito local (de invitado), preguntar si fusionar o reemplazar (o fusionar silenciosamente).
- **Al Guardar**:
    *   Enviar el array completo de `items` a la tabla `carrito_temporal` haciendo un `upsert` basado en `usuario_id`.

## 6. Integración Técnica Recomendada para Flutter

1.  **Paquete Supabase**: Usar `supabase_flutter`.
2.  **State Management**: `Riverpod` con `StateNotifier` para el `CartController`.
3.  **Repositorio**: Crear un `CartRepository` que abstraiga la lógica de "Guardar en Local" vs "Guardar en Supabase" dependiendo de `supabase.auth.currentUser`.

### Ejemplo de Flujo de Guardado (Pseudocódigo Flutter)
```dart
Future<void> saveCart(List<CartItem> items) async {
  final user = Supabase.instance.client.auth.currentUser;

  if (user != null) {
    // Usuario Autenticado: Guardar en Supabase
    await Supabase.instance.client
        .from('carrito_temporal')
        .upsert({
          'usuario_id': user.id,
          'items': items.map((e) => e.toJson()).toList(),
          'actualizado_en': DateTime.now().toIso8601String(),
        });
  } else {
    // Invitado: Guardar en SharedPreferences
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('guest_cart', jsonEncode(items));
  }
}
```

## 7. Clarificaciones Técnicas Críticas

Respuestas a preguntas frecuentes sobre la implementación exacta:

### 1. Persistencia de Precios (Snapshot vs Dinámico)
*   **Modelo de Snapshot**: El precio en `CartItem.precio` es un **snapshot** del precio en el momento exacto en que se agregó el producto.
*   **Comportamiento**:
    *   Si el usuario añade un producto que *ya existía* en el carrito, el sistema actualiza el precio de *toda* la línea al precio actual.
    *   Si el usuario *no* interactúa con el item, se mantiene el precio antiguo (esto es intencional para respetar el precio que vio el usuario al añadirlo, aunque en el checkout final se podría re-validar).
    *   **En Flutter**: Al añadir, usa `product.precio` actual. Al sincronizar/cargar, respeta el precio que viene guardado en el JSON a menos que se refresque explícitamente.

### 2. Stock Reservado
*   **Validación Local (UX)**: El mapa de `stock reservado` es puramente **visual y del lado del cliente**.
*   **Propósito**: Evitar que el usuario pueda hacer clic en "+" más veces de las que el stock permite durante una sesión, evitando errores tardíos en el checkout.
*   **Backend**: No hay bloqueo/reserva real en la BD hasta que se confirma la orden.

### 3. Identificación de Invitados (Guest ID)
*   **Web vs App**: En la web usamos `sessionStorage` (se pierde al cerrar pestaña). Para la App Flutter, el comportamiento esperado es **persistencia**.
*   **Estrategia**: Generar un UUID v4 al instalar/abrir la app por primera vez y guardarlo en `SecureStorage` o `SharedPreferences`. Usar ese ID consistentemente para identificar el carrito "huérfano" antes del login.

### 4. Estructura Exacta en BD (`carrito_temporal`)
*   La columna `items` (JSONB) almacena el objeto `CartItem` **completo y desnormalizado**.
*   **Esquema JSON Esperado**:
    ```json
    [
      {
        "product_id": "uuid-o-numero",
        "quantity": 2,
        "precio": 19.99,
        "nombre": "Aceite Motor",
        "subtotal": 39.98,
        "imagen": "https://...",
        "stock": 50
      }
    ]
    ```
*   **Importante**: No guardar solo `{id, quantity}`. Guardar todo el objeto para poder renderizar el carrito rápido sin tener que hacer JOINs o fetches adicionales a la tabla de productos inmediatamente.

### 5. Deep Linking para Stripe (App Móvil)
*   **Campo `source`**: Al crear la sesión de Stripe desde Flutter, envía `source: 'mobile_app'` en el cuerpo del JSON.
*   **Efecto**: El backend responderá con `success_url` y `cancel_url` apuntando a `autopartsstore://` en lugar de `https://...`.
*   **Configuración Flutter**: Asegúrate de tener configurado el esquema URL `autopartsstore` en `AndroidManifest.xml` y `Info.plist`.
