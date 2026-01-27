// src/pages/api/pagos/procesar-stripe.ts
// Endpoint que procesa el pago de Stripe y crea la orden

import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendOrderConfirmationEmail } from '@/lib/email';

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
    const subtotal = Math.round(((session.amount_total || 0) / 100 + descuentoMonto) * 100) / 100;
    const total = Math.round(((session.amount_total || 0) / 100) * 100) / 100;

    console.log('📝 Creando orden:', {
      numeroOrden,
      usuarioId,
      email: session.customer_email,
      total
    });

    // Preparar datos para insertar
    const ordenData: any = {
      numero_orden: numeroOrden,
      estado: 'PAGADO',
      estado_pago: 'COMPLETADO',
      subtotal: subtotal,
      total: total,
      costo_envio: 0,
      descuento_aplicado: descuentoMonto,
      direccion_envio: {
        nombre: shippingDetails?.name,
        calle: shippingDetails?.address?.line1,
        ciudad: shippingDetails?.address?.city,
        provincia: shippingDetails?.address?.state,
        codigo_postal: shippingDetails?.address?.postal_code,
        pais: shippingDetails?.address?.country
      },
      telefono_envio: shippingDetails?.phone || null,
      fecha_pago: new Date().toISOString(),
      creado_en: new Date().toISOString(),
      actualizado_en: new Date().toISOString()
    };

    // Solo agregar usuario_id si existe un usuario autenticado
    if (usuarioId) {
      ordenData.usuario_id = usuarioId;
    }

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
    // ENVIAR EMAIL DE CONFIRMACIÓN
    // ==========================================
    let emailSent = false;
    try {
      if (session.customer_email) {
        console.log('📧 Intentando enviar email de confirmación...');
        emailSent = await sendOrderConfirmationEmail(
          session.customer_email,
          orden.numero_orden,
          total
        );
        
        if (emailSent) {
          console.log('✉️ Email de confirmación enviado exitosamente a:', session.customer_email);
        } else {
          console.warn('⚠️ Falló el envío del email de confirmación (pero el pedido se guardó)');
        }
      } else {
        console.warn('⚠️ No hay email de cliente, saltando envío de confirmación');
      }
    } catch (emailError) {
      console.error('❌ Excepción al enviar email:', emailError);
      // No interrumpir el flujo si falla el email
    }

    // ==========================================
    // CREAR ITEMS DE LA ORDEN
    // ==========================================
    if (session.line_items?.data && orden?.id) {
      const items = session.line_items.data
        .filter((item: any) => !item.description?.includes('Descuento'))
        .map((item: any) => {
          const precio_unitario = item.price_data?.unit_amount ? (item.price_data.unit_amount / 100) : 0;
          const cantidad = item.quantity || 1;
          const subtotal = item.amount_total ? (item.amount_total / 100) : (precio_unitario * cantidad);
          
          return {
            orden_id: orden.id,
            producto_id: parseInt(item.metadata?.producto_id) || 0,
            cantidad: cantidad,
            precio_unitario: Math.round(precio_unitario * 100) / 100,
            subtotal: Math.round(subtotal * 100) / 100,
            creado_en: new Date().toISOString()
          };
        });

      if (items.length > 0) {
        console.log('📝 Insertando', items.length, 'items en ordenes_items');
        const { error: itemsError } = await supabaseAdmin
          .from('ordenes_items')
          .insert(items);

        if (itemsError) {
          console.error('⚠️ Error guardando items:', itemsError);
          // No interrumpir el flujo si falla guardar items
        } else {
          console.log(`✅ ${items.length} items guardados en ordenes_items`);
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
