// src/pages/api/pagos/procesar-stripe.ts
// Endpoint que procesa el pago de Stripe y crea la orden

import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabase';

export const prerender = false;

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
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
    const shippingDetails = session.shipping_details;
    const billingDetails = (session.payment_intent as any)?.charges?.data?.[0]?.billing_details;

    console.log('📦 Información de envío:', {
      nombre: shippingDetails?.name,
      email: session.customer_email,
      address: shippingDetails?.address
    });

    // ==========================================
    // CREAR ORDEN EN BD
    // ==========================================
    const numeroOrden = 'ORD-' + Date.now();
    const subtotal = (session.amount_total || 0) / 100 + descuentoMonto; // Revertir descuento
    const total = (session.amount_total || 0) / 100;

    const { data: orden, error: ordenError } = await supabaseAdmin
      .from('ordenes')
      .insert({
        numero_orden: numeroOrden,
        usuario_id: usuarioId || null,
        email_cliente: session.customer_email,
        subtotal: subtotal,
        total: total,
        costo_envio: 0,
        metodo_pago: 'stripe',
        id_transaccion_stripe: sessionId,
        direccion_envio: {
          nombre: shippingDetails?.name,
          calle: shippingDetails?.address?.line1,
          ciudad: shippingDetails?.address?.city,
          provincia: shippingDetails?.address?.state,
          codigo_postal: shippingDetails?.address?.postal_code,
          pais: shippingDetails?.address?.country
        },
        telefono_cliente: shippingDetails?.phone || null,
        // Guardar referencia de descuento
        notas_internas: codigoCupon ? `Cupón aplicado: ${codigoCupon}, Descuento: €${descuentoMonto}` : null
      })
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
    // CREAR ITEMS DE LA ORDEN (EN JSON)
    // ==========================================
    if (session.line_items?.data) {
      const items = session.line_items.data
        .filter((item: any) => !item.description?.includes('Descuento'))
        .map((item: any) => ({
          producto_id: parseInt(item.metadata?.producto_id) || 0,
          nombre: item.description || 'Producto',
          cantidad: item.quantity,
          precio_unitario: item.price_data?.unit_amount ? (item.price_data.unit_amount / 100) : 0,
          subtotal: item.amount_total ? (item.amount_total / 100) : 0
        }));

      if (items.length > 0) {
        // Actualizar la orden con los items en el JSON
        const { error: updateError } = await supabaseAdmin
          .from('ordenes')
          .update({ productos: items })
          .eq('id', orden.id);

        if (updateError) {
          console.error('⚠️ Error guardando items:', updateError);
        } else {
          console.log(`✅ ${items.length} items guardados en la orden`);
        }
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
