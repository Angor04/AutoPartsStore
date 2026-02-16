// src/pages/api/webhooks/stripe.ts
// Webhook de Stripe para procesar pagos de forma robusta

import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendOrderConfirmationEmail } from '@/lib/email';

export const prerender = false;

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16' as any,
});

const endpointSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

export const POST: APIRoute = async ({ request }) => {
  const signature = request.headers.get('stripe-signature');

  if (!signature || !endpointSecret) {
    return new Response('Webhook Error: Missing signature or secret', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log('🔔 Webhook: Pago completado para sesión:', session.id);
    await handleCheckoutSessionCompleted(session);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
  });
};

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const supabaseAdmin = getSupabaseAdmin();

  // 1. IDEMPOTENCIA: Verificar si ya existe la orden
  const { data: ordenExistente } = await supabaseAdmin
    .from('ordenes')
    .select('id')
    .eq('session_stripe_id', session.id)
    .single();

  if (ordenExistente) {
    console.log('⚠️ Webhook: Orden ya existe para esta sesión. Saltando.');
    return;
  }

  // 2. RECUPERAR DATOS EXPANDIDOS (Items)
  // El evento a veces no trae line_items, mejor recuperarlos
  const sessionExpanded = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ['line_items']
  });

  const metadata = session.metadata || {};

  // 3. RESOLVER USUARIO
  let usuarioId = metadata.usuario_id && metadata.usuario_id !== 'guest' ? metadata.usuario_id : null;
  if (!usuarioId && session.customer_details?.email) {
    // Intentar vincular por email si es invitado
    const { data: userByEmail } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('email', session.customer_details.email)
      .maybeSingle();
    if (userByEmail) usuarioId = userByEmail.id;
  }

  // 4. GENERAR NÚMERO DE ORDEN SECUENCIAL
  let numeroOrden = 'ORD-000000';
  try {
    // Buscar el número de orden más alto existente (solo formato 6 dígitos ORD-XXXXXX)
    const { data: ultimaOrden } = await supabaseAdmin
      .from('ordenes')
      .select('numero_orden')
      .ilike('numero_orden', 'ORD-______')
      .order('numero_orden', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (ultimaOrden && ultimaOrden.numero_orden) {
      // Extraer el número correlativo (ej: ORD-000123 -> 123)
      const match = ultimaOrden.numero_orden.match(/ORD-(\d+)/);
      if (match) {
        const ultimoNum = parseInt(match[1], 10);
        const siguienteNum = ultimoNum + 1;
        numeroOrden = 'ORD-' + String(siguienteNum).padStart(6, '0');
      }
    } else {
      // Fallback inicial si no hay ordenes o primera orden
      numeroOrden = 'ORD-000001';
    }
  } catch (e) {
    console.error('Error generando número de orden:', e);
    numeroOrden = `ORD-${Date.now().toString().slice(-6)}`; // Fallback de emergencia
  }

  // 5. PREPARAR DATOS
  const total = (session.amount_total || 0) / 100;
  const costoEnvio = parseFloat(metadata.costo_envio || '0') || (session.total_details?.amount_shipping || 0) / 100;
  const descuentoMonto = parseFloat(metadata.descuento_monto || '0') || (session.total_details?.amount_discount || 0) / 100;
  const subtotal = Math.round((total + descuentoMonto - costoEnvio) * 100) / 100;

  const ordenData = {
    numero_orden: numeroOrden,
    usuario_id: usuarioId || null,
    email: session.customer_details?.email || metadata.email || '',
    nombre: session.customer_details?.name || metadata.nombre_cliente || 'Cliente',
    telefono: session.customer_details?.phone || metadata.telefono_cliente || null,
    session_stripe_id: session.id,
    estado: 'PAGADO',
    estado_pago: 'COMPLETADO',
    subtotal: subtotal,
    total: total,
    gastos_envio: costoEnvio,
    cupon_id: metadata.cupon_id || null,
    direccion_envio: {
      nombre: session.shipping_details?.name || session.customer_details?.name,
      calle: session.shipping_details?.address?.line1,
      ciudad: session.shipping_details?.address?.city,
      provincia: session.shipping_details?.address?.state,
      codigo_postal: session.shipping_details?.address?.postal_code,
      pais: session.shipping_details?.address?.country || 'ES'
    },
    fecha_pago: new Date().toISOString()
  };

  // 6. CREAR ORDEN
  const { data, error: ordenError } = await supabaseAdmin
    .from('ordenes')
    .insert(ordenData)
    .select()
    .single();

  if (ordenError) {
    console.error('❌ Webhook: Error creando orden:', ordenError);
    return; // Reintentar? Stripe reintentará si devolvemos != 200, pero aquí loggeamos y salimos para no buclear
  }

  const orden = data as any;
  console.log('✅ Webhook: Orden creada:', orden.numero_orden);

  // 7. CREAR ITEMS
  // Intentar usar el JSON comprimido de metadata primero (más fiable para IDs nuestros)
  const itemsJson = metadata.items_json;
  let itemsParaEmail: any[] = [];
  let itemsDB: any[] = [];

  if (itemsJson) {
    try {
      const rawItems = JSON.parse(itemsJson);
      itemsDB = rawItems.map((item: any) => ({
        orden_id: orden.id,
        producto_id: item.id || item.product_id, // ID nuestro
        cantidad: item.q || item.quantity,
        precio_unitario: item.p || item.precio, // Precio snapshot
        subtotal: (item.p || item.precio) * (item.q || item.quantity),
        creado_en: new Date().toISOString()
      }));
    } catch (e) {
      console.error('Error parseando items_json:', e);
    }
  }

  // Si falló items_json o no existe, usar line_items de Stripe (no tenemos IDs internos fiables aquí, ojo)
  if (itemsDB.length === 0 && sessionExpanded.line_items) {
    // Falback complejo: intentar mapear por nombre? Mejor no arriesgar integridad de datos.
    // Asumimos que items_json SIEMPRE viene porque lo enviamos nosotros.
    console.warn('⚠️ Webhook: Usando items de Stripe (sin ID de producto interno vinculado)');
    // Implementar si es estrictamente necesario
  }

  if (itemsDB.length > 0) {
    const { error: itemsError } = await supabaseAdmin.from('ordenes_items').insert(itemsDB);
    if (itemsError) console.error('Error insertando items:', itemsError);
  }

  // Preparar items para email (visual)
  if (sessionExpanded.line_items) {
    itemsParaEmail = sessionExpanded.line_items.data.map(li => ({
      nombre_producto: li.description,
      cantidad: li.quantity,
      precio_unitario: (li.price?.unit_amount || 0) / 100,
      subtotal: (li.amount_total || 0) / 100
    }));
  }

  // 8. ENVIAR EMAIL
  if (orden.email) {
    await sendOrderConfirmationEmail(
      orden.email,
      orden.numero_orden,
      total,
      orden.nombre,
      itemsParaEmail,
      {
        subtotal,
        envio: costoEnvio,
        descuento: descuentoMonto
      }
    );
  }

  // 9. LIMPIAR CARRITO TEMPORAL (Si aplica)
  if (usuarioId) {
    await supabaseAdmin.from('carrito_temporal').delete().eq('usuario_id', usuarioId);
  }
}
