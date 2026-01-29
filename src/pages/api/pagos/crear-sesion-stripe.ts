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

    console.log('💳 Creando sesión de Stripe. UsuarioID:', usuarioId || 'Invitado');

    const { items, email, nombre, apellidos, telefono, subtotal, descuento, total, codigoPostal, direccion, ciudad, provincia, cupon_id, codigo_cupon } = body;

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
    // CREAR LÍNEAS PARA STRIPE
    // ==========================================
    // Calcular subtotal primero
    let subtotalEnCentavos = 0;

    const line_items = items.map((item: any) => {
      // Asegurar que precio es un número válido
      // Requisito: Usar precio directo (real)
      let precio = parseFloat(item.precio);

      // Convertir a centavos (número entero) solo para Stripe
      const unit_amount = Math.round(precio * 100);
      const qty = parseInt(item.quantity) || 1;

      subtotalEnCentavos += unit_amount * qty;

      console.log(`📦 Producto: ${item.nombre}, Precio: ${precio}€, Cantidad: ${qty}, Stripe unit_amount: ${unit_amount}`);

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
        quantity: qty,
        metadata: {
          producto_id: item.product_id ? String(item.product_id) : String(item.id)
        }
      };
    });

    console.log('💳 Line items creados:', line_items.length);
    console.log(`💰 Subtotal en centavos: ${subtotalEnCentavos} (${(subtotalEnCentavos / 100).toFixed(2)}€)`);

    // ==========================================
    // CALCULAR MONTO FINAL CON DESCUENTO Y ENVÍO
    // ==========================================
    let amountTotal = subtotalEnCentavos;
    // Sumar costo de envío
    const costoEnvioCentavos = Math.round(costoEnvio * 100);
    amountTotal += costoEnvioCentavos;
    // Aplicar descuento si existe (pero nunca si ENVIOGRATIS)
    if (descuentoFinal && descuentoFinal > 0) {
      const descuentoEnCentavos = Math.round(parseFloat(descuentoFinal) * 100);
      console.log(`🎉 Descuento aplicado: ${descuentoFinal}€ (${descuentoEnCentavos} centavos)`);
      amountTotal = Math.max(1, amountTotal - descuentoEnCentavos); // Mínimo 1 centavo
    }
    console.log(`💰 Monto TOTAL a pagar: ${amountTotal} centavos (${(amountTotal / 100).toFixed(2)}€)`);

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
        // Guardar los items optimizados para evitar límites de tamaño de Stripe (500 caracteres)
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
      success_url: `${import.meta.env.SITE}/pedido-confirmado?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${import.meta.env.SITE}/checkout`,
      expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
    });

    console.log('✅ Sesión de Stripe creada:', session.id);

    // ==========================================
    // ACTUALIZAR STOCK EN BASE DE DATOS
    // ==========================================
    // Este es un paso CRÍTICO: reducir el stock después de crear la sesión
    // Se hace aquí porque Stripe garantiza que la sesión se completará
    // Nota: En producción, deberías hacer esto en un webhook cuando se confirme el pago
    // Para este MVP, lo hacemos aquí cuando se crea la sesión

    console.log('📦 Iniciando actualización de stock para', items.length, 'productos');

    for (const item of items) {
      try {
        const { success, newStock, error: stockError } =
          await updateStockAfterPurchase(String(item.product_id), item.quantity);

        if (success) {
          console.log(
            `✅ Stock actualizado para ${item.nombre}: ${newStock} unidades restantes`
          );
        } else {
          console.error(
            `❌ Error actualizando stock para ${item.nombre}:`,
            stockError
          );
          // Registrar el error pero continuar (el pago ya se ha iniciado)
        }
      } catch (err) {
        console.error(`❌ Error procesando stock para ${item.nombre}:`, err);
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
