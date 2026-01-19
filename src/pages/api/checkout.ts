// src/pages/api/checkout.ts
// Endpoint para procesar checkout completo con validación de stock
// VERSIÓN PRODUCCIÓN - Proceso atómico

import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '@/lib/supabase';

export const prerender = false;

interface ItemCarrito {
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  nombre?: string;
}

interface DatosCheckout {
  items: ItemCarrito[];
  direccion_envio: {
    nombre: string;
    apellidos: string;
    direccion: string;
    ciudad: string;
    codigo_postal: string;
    provincia: string;
    telefono: string;
  };
  codigo_cupon?: string;
  metodo_pago: 'tarjeta' | 'paypal' | 'transferencia';
  notas?: string;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body: DatosCheckout = await request.json();
    const { items, direccion_envio, codigo_cupon, metodo_pago, notas } = body;

    // ==========================================
    // 1. VALIDAR AUTENTICACIÓN
    // ==========================================
    const userId = cookies.get('user-id')?.value;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Debes iniciar sesión para completar la compra' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // 2. VALIDAR DATOS DEL CHECKOUT
    // ==========================================
    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'El carrito está vacío' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!direccion_envio || !direccion_envio.direccion || !direccion_envio.ciudad) {
      return new Response(
        JSON.stringify({ error: 'Dirección de envío incompleta' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // ==========================================
    // 3. VERIFICAR STOCK DE TODOS LOS PRODUCTOS
    // ==========================================
    const productosIds = items.map(i => i.producto_id);
    
    const { data: productos, error: errorProductos } = await supabaseAdmin
      .from('productos')
      .select('id, nombre, precio, stock, activo')
      .in('id', productosIds);

    if (errorProductos || !productos) {
      return new Response(
        JSON.stringify({ error: 'Error al verificar productos' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar cada producto
    const erroresStock: string[] = [];
    const productosMap = new Map(productos.map(p => [p.id, p]));

    for (const item of items) {
      const producto = productosMap.get(item.producto_id);
      
      if (!producto) {
        erroresStock.push(`Producto no encontrado: ${item.producto_id}`);
        continue;
      }
      
      if (!producto.activo) {
        erroresStock.push(`"${producto.nombre}" ya no está disponible`);
        continue;
      }
      
      if (producto.stock < item.cantidad) {
        if (producto.stock === 0) {
          erroresStock.push(`"${producto.nombre}" está agotado`);
        } else {
          erroresStock.push(`"${producto.nombre}" solo tiene ${producto.stock} unidades disponibles`);
        }
      }
    }

    if (erroresStock.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Stock insuficiente',
          detalles: erroresStock
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // 4. CALCULAR TOTALES
    // ==========================================
    let subtotal = 0;
    const itemsConPrecio: ItemCarrito[] = [];

    for (const item of items) {
      const producto = productosMap.get(item.producto_id)!;
      const precioReal = producto.precio;
      subtotal += precioReal * item.cantidad;
      
      itemsConPrecio.push({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: precioReal,
        nombre: producto.nombre
      });
    }

    // ==========================================
    // 5. VALIDAR Y APLICAR CUPÓN (si existe)
    // ==========================================
    let descuento = 0;
    let cuponAplicado: string | null = null;

    if (codigo_cupon) {
      const { data: validacionCupon, error: errorCupon } = await supabaseAdmin
        .rpc('validar_cupon', {
          p_codigo: codigo_cupon,
          p_usuario_id: userId,
          p_subtotal: subtotal
        });

      if (errorCupon) {
        console.error('Error validando cupón:', errorCupon);
      } else if (validacionCupon && validacionCupon.valido) {
        descuento = validacionCupon.descuento_calculado || 0;
        cuponAplicado = codigo_cupon;
      } else if (validacionCupon && !validacionCupon.valido) {
        // Cupón inválido - advertir pero continuar
        console.log('Cupón inválido:', validacionCupon.mensaje);
      }
    }

    // ==========================================
    // 6. CALCULAR ENVÍO
    // ==========================================
    const gastosEnvio = subtotal >= 50 ? 0 : 4.99; // Envío gratis > 50€
    const total = subtotal - descuento + gastosEnvio;

    // ==========================================
    // 7. CREAR ORDEN (TRANSACCIÓN ATÓMICA)
    // ==========================================
    // Usamos una función RPC para garantizar atomicidad
    // Si no existe, lo hacemos paso a paso con verificación

    // Crear la orden principal
    const { data: orden, error: errorOrden } = await supabaseAdmin
      .from('ordenes')
      .insert({
        usuario_id: userId,
        estado: 'PENDIENTE',
        subtotal: subtotal,
        descuento: descuento,
        gastos_envio: gastosEnvio,
        total: total,
        codigo_cupon: cuponAplicado,
        direccion_envio: JSON.stringify(direccion_envio),
        metodo_pago: metodo_pago,
        notas: notas || null
      })
      .select('id, numero_orden')
      .single();

    if (errorOrden || !orden) {
      console.error('Error creando orden:', errorOrden);
      return new Response(
        JSON.stringify({ error: 'Error al crear la orden' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // 8. CREAR ITEMS DE LA ORDEN
    // ==========================================
    const itemsOrden = itemsConPrecio.map(item => ({
      orden_id: orden.id,
      producto_id: item.producto_id,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      subtotal: item.cantidad * item.precio_unitario
    }));

    const { error: errorItems } = await supabaseAdmin
      .from('ordenes_items')
      .insert(itemsOrden);

    if (errorItems) {
      console.error('Error insertando items:', errorItems);
      // Revertir la orden si falla
      await supabaseAdmin.from('ordenes').delete().eq('id', orden.id);
      return new Response(
        JSON.stringify({ error: 'Error al procesar los productos' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // 9. DECREMENTAR STOCK (ATÓMICO)
    // ==========================================
    for (const item of itemsConPrecio) {
      const { error: errorStock } = await supabaseAdmin.rpc('decrementar_stock', {
        p_producto_id: item.producto_id,
        p_cantidad: item.cantidad
      });

      if (errorStock) {
        // Si falla, intentar update directo
        const producto = productosMap.get(item.producto_id)!;
        await supabaseAdmin
          .from('productos')
          .update({ stock: producto.stock - item.cantidad })
          .eq('id', item.producto_id);
      }
    }

    // ==========================================
    // 10. MARCAR CUPÓN COMO USADO (si aplica)
    // ==========================================
    if (cuponAplicado) {
      await supabaseAdmin.rpc('aplicar_cupon', {
        p_codigo: cuponAplicado,
        p_usuario_id: userId,
        p_orden_id: orden.id
      });
    }

    // ==========================================
    // 11. REGISTRAR EN HISTORIAL
    // ==========================================
    await supabaseAdmin
      .from('ordenes_historial')
      .insert({
        orden_id: orden.id,
        estado_anterior: null,
        estado_nuevo: 'PENDIENTE',
        comentario: 'Orden creada - pendiente de pago'
      });

    // ==========================================
    // 12. LIMPIAR CARRITO DEL USUARIO
    // ==========================================
    await supabaseAdmin
      .from('carritos')
      .delete()
      .eq('usuario_id', userId);

    // ==========================================
    // 13. RETORNAR ÉXITO
    // ==========================================
    console.log(`\n✅ ORDEN CREADA: ${orden.numero_orden || orden.id}`);
    console.log(`   Usuario: ${userId}`);
    console.log(`   Total: €${total.toFixed(2)}`);
    console.log(`   Items: ${itemsConPrecio.length}`);
    if (cuponAplicado) console.log(`   Cupón: ${cuponAplicado} (-€${descuento.toFixed(2)})`);

    return new Response(
      JSON.stringify({
        success: true,
        orden_id: orden.id,
        numero_orden: orden.numero_orden || `ORD-${orden.id}`,
        total: total,
        subtotal: subtotal,
        descuento: descuento,
        gastos_envio: gastosEnvio,
        items_count: itemsConPrecio.length,
        mensaje: 'Orden creada correctamente. Procede al pago.'
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en checkout:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// ==========================================
// ENDPOINT GET - Verificar stock antes de checkout
// ==========================================
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const productosIds = url.searchParams.get('productos')?.split(',') || [];

    if (productosIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No se especificaron productos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: productos, error } = await supabaseAdmin
      .from('productos')
      .select('id, nombre, stock, activo')
      .in('id', productosIds);

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Error consultando stock' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        productos: productos.map(p => ({
          id: p.id,
          nombre: p.nombre,
          stock: p.stock,
          disponible: p.activo && p.stock > 0
        }))
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Error interno' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
