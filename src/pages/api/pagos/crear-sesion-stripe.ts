// src/pages/api/pagos/crear-sesion-stripe.ts
// Endpoint para crear sesión de pago en Stripe

import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabase';
import { updateStockAfterPurchase } from '@/lib/stockManagement';

export const prerender = false;

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16' as any,
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const usuarioId = cookies.get('user-id')?.value;


    const { items, email, nombre, apellidos, telefono, subtotal, descuento, total, codigoPostal, direccion, ciudad, provincia, cupon_id, codigo_cupon } = body;


    // Validar que haya items
    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Carrito vacío'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // CALCULAR COSTO DE ENVÍO
    // ==========================================
    let costoEnvio = 5.99;
    let descuentoFinal = descuento;
    if (codigo_cupon && codigo_cupon.toUpperCase() === 'ENVIOGRATIS') {
      costoEnvio = 0;
      // No aplicar descuento adicional, solo el envío gratis
      descuentoFinal = 0;
    }

    // ==========================================
    // 5. OBTENER PRECIOS ACTUALIZADOS DE LA BD (SEGURIDAD)
    // ==========================================
    const supabaseAdmin = getSupabaseAdmin();
    const productIds = items.map((i: any) => i.product_id || i.id);
    const { data: dbProducts, error: dbError } = await supabaseAdmin
      .from('productos')
      .select('id, precio, nombre, urls_imagenes, categoria_id')
      .in('id', productIds);

    if (dbError || !dbProducts) {
      console.error('Error obteniendo productos de la BD:', dbError);
      return new Response(
        JSON.stringify({ success: false, error: 'Error al verificar precios' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const dictProductos = new Map(dbProducts.map((p: any) => [String(p.id), p]));

    // ==========================================
    // 6. CREAR LÍNEAS PARA STRIPE
    // ==========================================
    let subtotalEnCentavos = 0;

    const line_items = items.map((item: any) => {
      const productId = String(item.product_id || item.id);
      const productDB = dictProductos.get(productId) as any;

      // Si el producto no existe en la BD (caso raro), usar precio enviado por el cliente como fallback o error
      // Pero lo ideal es usar el de la BD por seguridad
      const precioReal = productDB ? parseFloat(productDB.precio) : parseFloat(item.precio);
      const unit_amount = Math.round(precioReal * 100);
      const qty = parseInt(item.quantity) || 1;

      subtotalEnCentavos += unit_amount * qty;


      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: productDB ? productDB.nombre : item.nombre,
            images: productDB && Array.isArray(productDB.urls_imagenes) && productDB.urls_imagenes.length > 0
              ? [productDB.urls_imagenes[0]]
              : (Array.isArray(item.urls_imagenes) && item.urls_imagenes.length > 0 ? [item.urls_imagenes[0]] : undefined),
          },
          unit_amount: unit_amount
        },
        quantity: qty,
        metadata: {
          producto_id: productId
        }
      };
    });


    // ==========================================
    // 7. CALCULAR MONTO FINAL Y PREPARAR LÍNEAS FINALES
    // ==========================================
    const lineasFinales: any[] = [...line_items];

    // Añadir Gastos de Envío si aplica
    if (costoEnvio > 0) {
      lineasFinales.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Gastos de Envío',
            description: (subtotalEnCentavos / 100) < 50 ? 'Envío estándar' : 'Envío gratuito (no aplicado)',
          },
          unit_amount: Math.round(costoEnvio * 100),
        },
        quantity: 1,
      });
    }

    // Nota sobre descuentos: Stripe Checkout no permite unit_amount negativo.
    // Para simplificar, si hay un descuento, crearemos un CUPÓN TEMPORAL en Stripe.
    let discounts: any[] | undefined = undefined;

    if (descuentoFinal && descuentoFinal > 0) {
      try {
        const coupon = await stripe.coupons.create({
          amount_off: Math.round(parseFloat(descuentoFinal) * 100),
          currency: 'eur',
          duration: 'once',
          name: codigo_cupon || 'Descuento Aplicado',
        });
        discounts = [{ coupon: coupon.id }];
      } catch (couponError) {
        console.error('Error creando cupón en Stripe:', couponError);
        // Si falla el cupón, al menos seguimos con el envío
      }
    }

    // Recalcular monto total para validaciones (después de añadir envío y descuentos)
    let amountTotal = subtotalEnCentavos + Math.round(costoEnvio * 100);
    if (descuentoFinal && descuentoFinal > 0) {
      amountTotal = Math.max(1, amountTotal - Math.round(parseFloat(descuentoFinal) * 100));
    }


    // Validar que el monto sea positivo
    if (amountTotal <= 0) {
      console.error('Monto total inválido:', amountTotal);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'El monto total debe ser mayor a 0€'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // 8. CONFIGURAR URLS DE REDIRECCIÓN (WEB VS APP)
    // ==========================================
    let successUrl = '';
    let cancelUrl = '';

    // Detectar el origen de forma más robusta (para entornos con proxy como Coolify)
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const origin = host ? `${proto}://${host}` : new URL(request.url).origin;

    if (body.source === 'mobile_app') {
      // Deep Links para Flutter (con path /app/)
      successUrl = `autopartsstore://app/payment-success?session_id={CHECKOUT_SESSION_ID}`;
      cancelUrl = `autopartsstore://app/payment-cancel`;
    } else {
      // Redirección Web (Dinámica: localhost o producción)
      successUrl = `${origin}/pedido-confirmado?session_id={CHECKOUT_SESSION_ID}`;
      cancelUrl = `${origin}/checkout`;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineasFinales,
      discounts: discounts,
      mode: 'payment',
      customer_email: email,
      metadata: {
        email: email, // Guardar email explícitamente para el Webhook
        usuario_id: usuarioId || 'guest',
        carrito_id: body.carrito_id || 'guest',
        descuento_codigo: body.codigo_cupon || '',
        descuento_monto: descuentoFinal || 0,
        cupon_id: cupon_id || '',
        costo_envio: costoEnvio,
        nombre_cliente: `${nombre || ''} ${apellidos || ''}`.trim(),
        telefono_cliente: telefono || '',
        direccion_cliente: direccion || '',
        ciudad_cliente: ciudad || '',
        provincia_cliente: provincia || '',
        codigo_postal_cliente: codigoPostal || '',
        items_json: JSON.stringify(items.map((i: any) => ({
          id: i.product_id || i.id,
          q: i.quantity,
          p: i.precio
        })))
      },
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['ES', 'PT', 'FR', 'IT', 'DE', 'AT', 'BE', 'NL', 'LU']
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      expires_at: Math.floor(Date.now() / 1000) + (23 * 60 * 60)
    });


    // ==========================================
    // ACTUALIZAR STOCK EN BASE DE DATOS
    // ==========================================
    // Este es un paso CRÍTICO: reducir el stock después de crear la sesión
    // Se hace aquí porque Stripe garantiza que la sesión se completará
    // Nota: En producción, deberías hacer esto en un webhook cuando se confirme el pago
    // Para este MVP, lo hacemos aquí cuando se crea la sesión


    for (const item of items) {
      try {
        const { success, newStock, error: stockError } =
          await updateStockAfterPurchase(String(item.product_id), item.quantity);

        if (success) {
          console.log(
            `Stock actualizado para ${item.nombre}: ${newStock} unidades restantes`
          );
        } else {
          console.error(
            `Error actualizando stock para ${item.nombre}:`,
            stockError
          );
          // Registrar el error pero continuar (el pago ya se ha iniciado)
        }
      } catch (err) {
        console.error(`Error procesando stock para ${item.nombre}:`, err);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        session_id: session.id,
        url: session.url
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error creando sesión de Stripe:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Error al procesar el pago'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
