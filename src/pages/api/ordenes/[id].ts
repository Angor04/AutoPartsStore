// src/pages/api/ordenes/[id].ts
// Endpoint para recuperar una orden completa con sus items y productos

import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '@/lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ params, cookies }) => {
  try {
    const ordenId = params.id;
    const usuarioId = cookies.get('user-id')?.value;

    if (!ordenId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'ID de orden requerido'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Recuperar orden
    const { data: orden, error: ordenError } = await supabaseAdmin
      .from('ordenes')
      .select('*')
      .or(`id.eq.${ordenId},numero_orden.eq.${ordenId}`)
      .single();

    if (ordenError || !orden) {
      console.error('Orden no encontrada:', ordenError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Orden no encontrada'
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // AUTO-LINKING: Si la orden no tiene usuario_id pero el usuario está logueado y el email coincide
    if (!orden.usuario_id && usuarioId) {
      // Obtener email del usuario actual para comparar
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(usuarioId);
      const userEmail = userData?.user?.email;
      const orderEmail = orden.email || orden.email_cliente;

      if (userEmail && orderEmail && userEmail.toLowerCase() === orderEmail.toLowerCase()) {
        await supabaseAdmin
          .from('ordenes')
          .update({ usuario_id: usuarioId })
          .eq('id', orden.id);

        orden.usuario_id = usuarioId; // Actualizar objeto local
      }
    }

    // Verificar que el usuario solo puede ver sus propias órdenes
    // Si hay usuario autenticado y la orden tiene usuario_id diferente, denegar
    if (usuarioId && orden.usuario_id && orden.usuario_id !== usuarioId && orden.usuario_id !== '00000000-0000-0000-0000-000000000000') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No autorizado para ver esta orden'
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Recuperar items de la orden con información del producto
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('ordenes_items')
      .select(`
        id,
        producto_id,
        cantidad,
        precio_unitario,
        subtotal,
        creado_en,
        productos:producto_id (
          nombre,
          urls_imagenes
        )
      `)
      .eq('orden_id', orden.id)
      .order('creado_en', { ascending: true });

    if (itemsError) {
      console.error('Error recuperando items:', itemsError);
    }

    // Mapear items para incluir nombre_producto desde la tabla productos
    const itemsConNombre = items?.map((item: any) => ({
      ...item, // Keep existing item properties
      nombre_producto: item.productos?.nombre || 'Producto desconocido',
      urls_imagenes: item.productos?.urls_imagenes || [] // Ensure urls_imagenes is mapped
    })) || [];

    // Calcular totales
    const itemCount = itemsConNombre?.length || 0;
    const subtotal = itemsConNombre?.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0) || 0;

    return new Response(
      JSON.stringify({
        success: true,
        orden: {
          id: orden.id,
          numero_orden: orden.numero_orden,
          estado: orden.estado,
          estado_pago: orden.estado_pago,
          subtotal: orden.subtotal,
          cupon_id: orden.cupon_id || null,
          costo_envio: orden.gastos_envio || orden.costo_envio || 0,
          total: orden.total,
          direccion_envio: orden.direccion_envio,
          email: orden.email,
          nombre: orden.nombre || orden.customer_name || orden.direccion_envio?.nombre || null,
          telefono: orden.telefono || orden.telefono_cliente || null,
          fecha_creacion: orden.fecha_creacion || orden.creada_en || orden.created_at,
          fecha_pago: orden.fecha_pago,
          fecha_envio: orden.fecha_envio,
          numero_seguimiento: orden.numero_seguimiento,
          items: itemsConNombre,
          item_count: itemCount,
          impuestos: orden.impuestos || 0,
          usuario_id: orden.usuario_id || null
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en GET /api/ordenes/[id]:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
