// src/pages/api/pagos/crear-sesion-stripe.ts
// Endpoint para crear sesión de pago en Stripe

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
    const usuarioId = cookies.get('user-id')?.value;

    console.log('💳 Creando sesión de Stripe para usuario:', usuarioId);

    // Validar que el usuario esté autenticado
    if (!usuarioId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Usuario no autenticado'
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { items, email, nombre, apellidos, subtotal, descuento, total, codigoPostal } = body;

    console.log('📦 Items del carrito:', items.length);
    console.log('💰 Total:', total, 'Descuento:', descuento);

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
    // CREAR LÍNEAS PARA STRIPE
    // ==========================================
    // Calcular subtotal primero
    let subtotalEnCentavos = 0;

    const line_items = items.map((item: any) => {
      // Asegurar que precio es un número válido
      let precio = parseFloat(item.precio);
      
      // Si el precio es 0 o inválido, usar 0.01 como mínimo
      if (!precio || precio <= 0) {
        console.warn(`Precio inválido para ${item.nombre}:`, item.precio);
        precio = 0.01;
      }
      
      // Convertir a centavos (número entero)
      const unit_amount = Math.round(precio * 100);
      const qty = parseInt(item.quantity) || 1;
      
      subtotalEnCentavos += unit_amount * qty;

      console.log(`📦 Producto: ${item.nombre}, Precio: ${precio}€, Cantidad: ${qty}, Centavos: ${unit_amount}`);
      
      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.nombre,
            images: Array.isArray(item.urls_imagenes) && item.urls_imagenes.length > 0 
              ? [item.urls_imagenes[0]]
              : undefined,
            description: item.categoria || 'Producto'
          },
          unit_amount: unit_amount
        },
        quantity: qty
      };
    });

    console.log('💳 Line items creados:', line_items.length);
    console.log(`💰 Subtotal en centavos: ${subtotalEnCentavos} = ${subtotalEnCentavos / 100}€`);

    // ==========================================
    // CALCULAR MONTO FINAL CON DESCUENTO
    // ==========================================
    let amountTotal = subtotalEnCentavos;

    // Aplicar descuento si existe
    if (descuento && descuento > 0) {
      const descuentoEnCentavos = Math.round(parseFloat(descuento) * 100);
      console.log(`🎉 Descuento aplicado: ${descuento}€ (${descuentoEnCentavos} centavos)`);
      amountTotal = Math.max(1, amountTotal - descuentoEnCentavos); // Mínimo 1 centavo
    }

    console.log(`💰 Monto TOTAL a pagar: ${amountTotal} centavos = ${(amountTotal / 100).toFixed(2)}€`);

    // ==========================================
    // CREAR SESIÓN DE STRIPE
    // ==========================================
    // Nota: Stripe requiere que line_items sumen exactamente el total
    // No podemos usar unit_amount negativo para descuentos
    // Así que usaremos solo los productos sin descuento como items,
    // e incluiremos el descuento en metadata para procesar después

    const lineasFinales: any[] = line_items;

    console.log(`📋 Líneas finales para Stripe: ${lineasFinales.length} items`);
    console.log(`💳 Total en centavos: ${amountTotal}`);

    // Validar que el monto sea positivo
    if (amountTotal <= 0) {
      console.error('❌ Monto total inválido:', amountTotal);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'El monto total debe ser mayor a 0€'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineasFinales,
      mode: 'payment',
      customer_email: email,
      metadata: {
        usuario_id: usuarioId,
        carrito_id: body.carrito_id || 'guest',
        descuento_codigo: body.codigo_cupon || '',
        descuento_monto: descuento || 0
      },
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['ES', 'PT', 'FR', 'IT', 'DE', 'AT', 'BE', 'NL', 'LU']
      },
      success_url: `${import.meta.env.SITE}/pedido-confirmado?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${import.meta.env.SITE}/checkout`,
      expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
    });

    console.log('✅ Sesión de Stripe creada:', session.id);

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
    console.error('❌ Error creando sesión de Stripe:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Error al procesar el pago'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
