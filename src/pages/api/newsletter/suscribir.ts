import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendNewsletterWelcomeEmail } from '@/lib/email';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email } = body;

    // ==========================================
    // 1. VALIDAR EMAIL
    // ==========================================
    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Email inválido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // ==========================================
    // 2. VERIFICAR SI YA TIENE UN CUPÓN ACTIVO
    // ==========================================
    // Usamos cast a any porque la tabla es nueva y puede no estar en los tipos generados
    const { data: existente } = await (supabaseAdmin.from('cupones_newsletter') as any)
      .select('id, usado')
      .eq('email', email.toLowerCase())
      .eq('usado', false)
      .single();

    if (existente) {
      return new Response(
        JSON.stringify({
          mensaje: 'Ya estás suscrito y tienes un cupón pendiente de uso.',
          ya_suscrito: true
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // 3. GENERAR CÓDIGO DE DESCUENTO
    // ==========================================
    const { data: codigo_descuento, error: codigoError } = await (supabaseAdmin.rpc as any)('generar_codigo_descuento');

    if (codigoError || !codigo_descuento) {
      console.error('Error generating code:', codigoError);
      return new Response(
        JSON.stringify({ error: 'Error al generar código de descuento' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // 4. GUARDAR EN cupones_newsletter
    // ==========================================
    const fechaExpiracion = new Date();
    fechaExpiracion.setDate(fechaExpiracion.getDate() + 30); // 30 días de validez

    const { error: insertError } = await (supabaseAdmin.from('cupones_newsletter') as any)
      .insert({
        codigo: codigo_descuento,
        email: email.toLowerCase(),
        porcentaje_descuento: 10,
        usado: false,
        fecha_expiracion: fechaExpiracion.toISOString()
      });

    if (insertError) {
      console.error('Error inserting newsletter coupon:', insertError);
      return new Response(
        JSON.stringify({ error: 'Error al registrar la suscripción' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // 5. ENVIAR EMAIL DE BIENVENIDA
    // ==========================================
    try {
      await sendNewsletterWelcomeEmail(email.toLowerCase(), codigo_descuento, 10);
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // No bloqueamos la respuesta al usuario si el email falla
    }

    // ==========================================
    // 6. RETORNAR ÉXITO
    // ==========================================
    return new Response(
      JSON.stringify({
        success: true,
        mensaje: '¡Gracias por suscribirte! Revisa tu email para recibir tu cupón de descuento.',
        codigo_descuento,
        porcentaje: 10
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en suscripción:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// ============================================================================
// FLUJO COMPLETE DE NEWSLETTER + DESCUENTO
// ============================================================================

/*

1. USUARIO RELLENA FORMULARIO:
   - Email: usuario@example.com

2. FRONTEND LLAMA:
   POST /api/newsletter/suscribir
   Body: { email }

3. BACKEND EJECUTA:
   a) Valida email
   b) Genera código aleatorio: "NEW-XXXX"
   c) Crea registro en cupones_newsletter:
      - Porcentaje: 10%
      - Vencimiento: 30 días
   d) ENVÍA EMAIL DE BIENVENIDA

4. BASE DE DATOS DESPUÉS:
   
   cupones_newsletter:
   ┌───────────────────────────────────────────┐
   │ id | codigo   | email          | usado    │
   ├───────────────────────────────────────────┤
   │ 1  │ NEW-ABCD │ user@exam.com  │ false    │
   └───────────────────────────────────────────┘

5. USUARIO RECIBE EMAIL CON SU CUPÓN

6. EN CHECKOUT:
   Usuario ingresa código → validar_cupon() → Si válido, aplicar y marcar como usado al pagar

*/
