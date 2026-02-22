// src/pages/api/pagos/procesar-stripe.ts
// Endpoint que procesa el pago de Stripe y crea la orden

import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendOrderConfirmationEmail, sendAdminOrderNotificationEmail } from '@/lib/email';

export const prerender = false;

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16' as any,
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const sessionId = body.session_id;
    const usuarioId = cookies.get('user-id')?.value;

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

    // IDEMPOTENCIA: Verificar si ya existe una orden para esta sesión
    const { data: ordenExistenteData } = await supabaseAdmin
      .from('ordenes')
      .select('id, numero_orden')
      .eq('session_stripe_id', sessionId)
      .maybeSingle();

    const ordenExistente = ordenExistenteData as any;

    if (ordenExistente) {
      return new Response(
        JSON.stringify({
          success: true,
          orden_id: ordenExistente.id,
          numero_orden: ordenExistente.numero_orden,
          message: 'Orden ya procesada anteriormente'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Extraer datos de metadata
    const metadata = session.metadata || {};
    let usuarioIdDesdeMetadata = metadata.usuario_id && metadata.usuario_id !== 'guest' ? metadata.usuario_id : null;
    let finalUsuarioId = usuarioIdDesdeMetadata || usuarioId;

    // Fallback: Si no hay usuarioId pero el email coincide con un usuario registrado, vincularlo
    if (!finalUsuarioId && session.customer_email) {
      const { data: usuarioPorEmailData } = await supabaseAdmin
        .from('usuarios')
        .select('id')
        .eq('email', session.customer_email)
        .maybeSingle();

      const usuarioPorEmail = usuarioPorEmailData as any;

      if (usuarioPorEmail) {
        finalUsuarioId = usuarioPorEmail.id;
      } else {
        // Opción B: Buscar en auth.users via admin
        try {
          const { data: { users }, error: searchError } = await supabaseAdmin.auth.admin.listUsers();
          const targetUser = users.find((u: any) => u.email === session.customer_email);
          if (targetUser) {
            finalUsuarioId = targetUser.id;
          }
        } catch (e) {
          console.error('Error buscando usuario en auth:', e);
        }
      }
    }

    const descuentoMonto = parseFloat(metadata.descuento_monto || '0');

    // Obtener dirección de envío
    const shippingDetails = (session as any).shipping_details;

    // ==========================================
    // CREAR NÚMERO DE ORDEN CORRELATIVO GLOBAL
    // ==========================================
    let numeroOrden = 'ORD-000000';
    try {
      const { data: ultimaOrdenData } = await supabaseAdmin
        .from('ordenes')
        .select('numero_orden')
        .ilike('numero_orden', 'ORD-______')
        .order('numero_orden', { ascending: false })
        .limit(1)
        .maybeSingle();

      const ultimaOrden = ultimaOrdenData as any;

      if (ultimaOrden && ultimaOrden.numero_orden) {
        const match = ultimaOrden.numero_orden.match(/ORD-(\d+)/);
        if (match) {
          const ultimoNum = parseInt(match[1], 10);
          const siguienteNum = ultimoNum + 1;
          numeroOrden = 'ORD-' + String(siguienteNum).padStart(6, '0');
        }
      }
    } catch (e) {
      console.error('Error generando número de orden:', e);
    }

    // Totales ( Stripe cents -> Euro decimal )
    const total = Math.round((session.amount_total || 0)) / 100;

    let costoEnvio = 5.99;
    if (metadata.costo_envio !== undefined) {
      costoEnvio = parseFloat(metadata.costo_envio);
    } else if (metadata.descuento_codigo?.toUpperCase() === 'ENVIOGRATIS') {
      costoEnvio = 0;
    }

    const subtotal = Math.round((total + descuentoMonto - costoEnvio) * 100) / 100;

    // Detectar si es un cupón de newsletter (sintetizado con sufijo específico)
    const esCuponNewsletter = metadata.cupon_id?.endsWith('-0000-0000-0000-000000000000');

    // Preparar datos para insertar
    const ordenData: any = {
      numero_orden: numeroOrden,
      usuario_id: finalUsuarioId || null,
      email: session.customer_email || metadata.email || 'invitado@tienda.com',
      nombre: metadata.nombre_cliente || shippingDetails?.name || 'Cliente Invitado',
      telefono: metadata.telefono_cliente || (session as any).customer_details?.phone || null,
      session_stripe_id: sessionId,
      estado: 'PAGADO',
      estado_pago: 'COMPLETADO',
      subtotal: subtotal,
      total: total,
      gastos_envio: costoEnvio,
      // Solo insertar en ordenes.cupon_id si es un cupón estándar (evita error de clave foránea)
      cupon_id: (metadata.cupon_id && !esCuponNewsletter) ? metadata.cupon_id : null,
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

    const { data: ordenDataDB, error: ordenError } = await supabaseAdmin
      .from('ordenes')
      .insert(ordenData)
      .select()
      .single();

    if (ordenError) {
      console.error('Error creando orden:', ordenError);
      return new Response(
        JSON.stringify({ success: false, error: 'Error al crear la orden: ' + ordenError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const orden = ordenDataDB as any;

    // ==========================================
    // CREAR ITEMS DE LA ORDEN
    // ==========================================
    const itemsJson = metadata.items_json;
    let itemsParaEmail: any[] = [];

    if (itemsJson && orden?.id) {
      try {
        const cartItemsRaw = JSON.parse(itemsJson);
        const items = cartItemsRaw.map((item: any) => ({
          orden_id: orden.id,
          producto_id: item.id || 0,
          cantidad: parseInt(item.q) || 1,
          precio_unitario: parseFloat(item.p) || 0,
          subtotal: Math.round((parseFloat(item.p) * parseInt(item.q)) * 100) / 100,
          creado_en: new Date().toISOString()
        }));

        if (session.line_items) {
          itemsParaEmail = session.line_items.data.map(li => ({
            nombre_producto: li.description,
            cantidad: li.quantity,
            precio_unitario: (li.price?.unit_amount || 0) / 100,
            subtotal: (li.amount_total || 0) / 100
          }));
        }

        if (items.length > 0) {
          await supabaseAdmin.from('ordenes_items').insert(items);
        }
      } catch (parseError) {
        console.error('Error parseando items:', parseError);
      }
    }

    // ==========================================
    // REGISTRAR USO DE CUPÓN (ATÓMICO POR RPC)
    // ==========================================
    if (metadata.cupon_id && finalUsuarioId && orden?.id) {
      try {
        // Casting a any para evitar errores de tipado si la función no está en Database Types
        await (supabaseAdmin as any).rpc('aplicar_cupon', {
          p_cupon_id: metadata.cupon_id,
          p_usuario_id: finalUsuarioId,
          p_orden_id: orden.id,
          p_descuento: descuentoMonto
        });
      } catch (e) {
        console.error('Error aplicando cupón:', e);
      }
    }

    // ==========================================
    // ENVIAR EMAILS (CLIENTE Y ADMIN)
    // ==========================================
    const emailDestino = session.customer_email || metadata.email_cliente || (session as any).customer_details?.email;

    // 1. Notificar al Cliente (si hay email)
    if (emailDestino) {
      try {
        await sendOrderConfirmationEmail(
          emailDestino,
          orden.numero_orden,
          total,
          metadata.nombre_cliente || 'Cliente',
          itemsParaEmail,
          {
            subtotal: subtotal,
            envio: costoEnvio,
            descuento: descuentoMonto
          }
        );
      } catch (emailError) {
        console.error('Error enviando email al cliente:', emailError);
      }
    }

    // 2. Notificar al Administrador (Independiente)
    try {
      // Intentar obtener el email del admin de varias fuentes para máxima robustez
      const adminEmail = import.meta.env.EMAIL_USER || process.env.EMAIL_USER || 'agonzalezcruces2004@gmail.com';

      console.log(`Intentando notificar al admin (${adminEmail}) sobre pedido ${orden.numero_orden}`);

      await sendAdminOrderNotificationEmail(
        adminEmail,
        orden.numero_orden,
        total,
        metadata.nombre_cliente || 'Cliente',
        itemsParaEmail
      );

      console.log('✅ Notificación admin enviada correctamente');
    } catch (adminEmailError) {
      console.error('❌ Error enviando email al administrador:', adminEmailError);
    }

    // ==========================================
    // LIMPIAR CARRITO
    // ==========================================
    if (usuarioId) {
      await supabaseAdmin.from('carrito_temporal').delete().eq('usuario_id', usuarioId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        orden_id: orden.id,
        numero_orden: orden.numero_orden,
        message: 'Orden creada exitosamente'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en procesar-stripe:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
