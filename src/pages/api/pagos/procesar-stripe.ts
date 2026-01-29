// src/pages/api/pagos/procesar-stripe.ts
// Endpoint que procesa el pago de Stripe y crea la orden

import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendOrderConfirmationEmail } from '@/lib/email';

export const prerender = false;

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16' as any,
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const sessionId = body.session_id;
    const usuarioId = cookies.get('user-id')?.value;

    console.log('💳 Procesando sesión de Stripe:', sessionId);

    if (!sessionId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Session ID requerido'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // OBTENER DETALLES DE LA SESIÓN DE STRIPE
    // ==========================================
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'payment_intent']
    });

    console.log('✅ Sesión recuperada:', {
      payment_status: session.payment_status,
      customer_email: session.customer_email,
      amount_total: session.amount_total
    });

    if (session.payment_status !== 'paid') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'El pago no fue completado',
          payment_status: session.payment_status
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // OBTENER INFORMACIÓN DE LA ORDEN
    // ==========================================
    const supabaseAdmin = getSupabaseAdmin();

    // Extraer datos de metadata
    const metadata = session.metadata || {};
    const descuentoMonto = parseFloat(metadata.descuento_monto || '0');
    const codigoCupon = metadata.descuento_codigo || null;

    // Obtener dirección de envío
    const shippingDetails = (session as any).shipping_details;
    const billingDetails = (session.payment_intent as any)?.charges?.data?.[0]?.billing_details;

    console.log('📦 Información de envío:', {
      nombre: shippingDetails?.name,
      email: session.customer_email,
      address: shippingDetails?.address
    });

    // ==========================================
    // CREAR NÚMERO DE ORDEN CORRELATIVO GLOBAL
    // ==========================================
    let numeroOrden = '';
    try {
      // Buscar la última orden creada (mayor número correlativo)
      const { data: ultimaOrden, error: ultimaOrdenError } = await supabaseAdmin
        .from('ordenes')
        .select('numero_orden')
        .order('id', { ascending: false })
        .limit(1)
        .single();
      if (ultimaOrden && ultimaOrden.numero_orden) {
        // Extraer el número correlativo (ORD-000123)
        const match = ultimaOrden.numero_orden.match(/ORD-(\d+)/);
        const ultimoNum = match ? parseInt(match[1], 10) : 0;
        const siguienteNum = ultimoNum + 1;
        numeroOrden = 'ORD-' + String(siguienteNum).padStart(6, '0');
      } else {
        numeroOrden = 'ORD-000000';
      }
    } catch (e) {
      console.error('Error generando número de orden correlativo:', e);
      numeroOrden = 'ORD-000000';
    }
    // Requisito: Convertir céntimos de Stripe a decimal real una sola vez
    const total = Math.round((session.amount_total || 0)) / 100;
    // Leer costo_envio de metadata si existe
    let costoEnvio = 5.99;
    if (metadata.costo_envio !== undefined) {
      costoEnvio = parseFloat(metadata.costo_envio);
    } else if (metadata.descuento_codigo && metadata.descuento_codigo.toUpperCase() === 'ENVIOGRATIS') {
      costoEnvio = 0;
    }
    const subtotal = Math.round((total + descuentoMonto - costoEnvio) * 100) / 100;

    console.log('📝 Creando orden con importes reales:', {
      numeroOrden,
      usuarioId,
      email: session.customer_email,
      total,
      subtotal,
      descuentoMonto
    });

    // Preparar datos para insertar
    const ordenData: any = {
      numero_orden: numeroOrden,
      usuario_id: usuarioId || null,
      email: session.customer_email || metadata.email_cliente || 'invitado@tienda.com',
      nombre: metadata.nombre_cliente || shippingDetails?.name || 'Cliente Invitado',
      telefono: metadata.telefono_cliente || (session as any).customer_details?.phone || null,
      session_stripe_id: sessionId,
      estado: 'PAGADO',
      estado_pago: 'COMPLETADO',
      subtotal: subtotal,
      total: total,
      gastos_envio: costoEnvio,
      cupon_id: metadata.cupon_id || null,
      direccion_envio: {
        nombre: metadata.nombre_cliente || shippingDetails?.name,
        calle: metadata.direccion_cliente || shippingDetails?.address?.line1,
        ciudad: metadata.ciudad_cliente || shippingDetails?.address?.city,
        provincia: metadata.provincia_cliente || shippingDetails?.address?.state,
        codigo_postal: metadata.codigo_postal_cliente || shippingDetails?.address?.postal_code,
        pais: shippingDetails?.address?.country || 'ES'
      },
      fecha_pago: new Date().toISOString()
    };


    const { data: orden, error: ordenError } = await supabaseAdmin
      .from('ordenes')
      .insert(ordenData)
      .select()
      .single();

    if (ordenError) {
      console.error('❌ Error creando orden:', ordenError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Error al crear la orden: ' + ordenError.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Orden creada:', {
      id: orden.id,
      numero_orden: orden.numero_orden,
      total: orden.total
    });

    // ==========================================
    // CREAR ITEMS DE LA ORDEN Y ENVIAR EMAIL
    // ==========================================
    const itemsJson = metadata.items_json;
    let itemsParaEmail: any[] = [];

    if (itemsJson && orden?.id) {
      try {
        const cartItemsRaw = JSON.parse(itemsJson);
        console.log('📦 Reconstruyendo items desde metadata:', cartItemsRaw.length);

        const items = cartItemsRaw.map((item: any) => {
          const precio_unitario = parseFloat(item.p || item.precio) || 0;
          const cantidad = parseInt(item.q || item.quantity) || 1;

          return {
            orden_id: orden.id,
            producto_id: item.id || item.product_id || 0,
            cantidad: cantidad,
            precio_unitario: Math.round(precio_unitario * 100) / 100,
            subtotal: Math.round(precio_unitario * cantidad * 100) / 100,
            creado_en: new Date().toISOString()
          };
        });

        // Para el email necesitamos nombres, los sacaremos de line_items de Stripe
        itemsParaEmail = (session.line_items?.data || []).map(li => ({
          nombre_producto: li.description,
          cantidad: li.quantity,
          precio_unitario: (li.price?.unit_amount || 0) / 100, // Conversión solo para el objeto de email
          subtotal: (li.amount_total || 0) / 100
        }));

        if (items.length > 0) {
          console.log('📝 Insertando', items.length, 'items en ordenes_items');
          const { error: itemsError } = await supabaseAdmin
            .from('ordenes_items')
            .insert(items);

          if (itemsError) {
            console.error('⚠️ Error guardando items:', itemsError);
          } else {
            console.log(`✅ ${items.length} items guardados en ordenes_items`);
          }
        }
      } catch (parseError) {
        console.error('❌ Error parseando items_json:', parseError);
      }
    } else {
      console.warn('⚠️ No se encontraron items en metadata o la orden no tiene ID');
    }

    // ==========================================
    // ENVIAR EMAIL DE CONFIRMACIÓN (AHORA CON ITEMS)
    // ==========================================
    let emailSent = false;
    const emailDestino = session.customer_email || metadata.email_cliente || (session as any).customer_details?.email;

    console.log('📧 Preparando envío de email:', {
      emailDestino,
      session_email: session.customer_email,
      metadata_email: metadata.email_cliente,
      customer_details_email: (session as any).customer_details?.email,
      itemsCount: itemsParaEmail.length
    });

    if (emailDestino) {
      try {
        console.log('📧 Intentando enviar email de confirmación completo a:', emailDestino);
        emailSent = await sendOrderConfirmationEmail(
          emailDestino,
          orden.numero_orden,
          total,
          metadata.nombre_cliente || (session as any).customer_details?.name || 'Cliente',
          itemsParaEmail,
          {
            subtotal: subtotal,
            envio: ordenData.gastos_envio || 0,
            descuento: descuentoMonto || 0
          }
        );

        if (emailSent) {
          console.log('✉️ Email de confirmación enviado exitosamente a:', emailDestino);
        }
      } catch (emailError) {
        console.error('❌ Error al enviar email:', emailError);
      }
    }

    // ==========================================
    // LIMPIAR CARRITO
    // ==========================================
    // El frontend debería hacer esto, pero también lo hacemos aquí
    if (usuarioId) {
      // Eliminar carrito temporal de BD
      await supabaseAdmin
        .from('carrito_temporal')
        .delete()
        .eq('usuario_id', usuarioId);
      console.log('🗑️ Carrito temporal eliminado');
    }

    // ==========================================
    // RETORNAR DATOS DE LA ORDEN
    // ==========================================
    return new Response(
      JSON.stringify({
        success: true,
        orden_id: orden.id,
        numero_orden: orden.numero_orden,
        email: session.customer_email,
        total: total,
        descuento: descuentoMonto,
        items: session.line_items?.data?.length || 0,
        message: 'Orden creada exitosamente'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error procesando Stripe:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
