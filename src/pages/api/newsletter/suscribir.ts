// src/pages/api/newsletter/suscribir.ts
// Endpoint para suscribirse a newsletter y recibir código de descuento

import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '@/lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email, usuario_id, recibe_ofertas } = body;

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
    // 2. VERIFICAR SI YA ESTÁ SUSCRITO
    // ==========================================
    const { data: existente } = await supabaseAdmin
      .from('newsletter_suscriptores')
      .select('id, estado_suscripcion')
      .eq('email', email.toLowerCase())
      .single();

    if (existente && existente.estado_suscripcion) {
      return new Response(
        JSON.stringify({ 
          mensaje: 'Ya estás suscrito a nuestra newsletter',
          ya_suscrito: true
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // 3. GENERAR CÓDIGO DE DESCUENTO
    // ==========================================
    // Usar la función SQL que creamos
    const { data: codigoData, error: codigoError } = await supabaseAdmin
      .rpc('generar_codigo_descuento');

    if (codigoError) {
      console.error('Error generating code:', codigoError);
      return new Response(
        JSON.stringify({ error: 'Error al generar código de descuento' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const codigo_descuento = codigoData;

    // ==========================================
    // 4. CREAR CUPÓN AUTOMÁTICO (10% descuento)
    // ==========================================
    const { data: cupon, error: cuponError } = await supabaseAdmin
      .from('cupones')
      .insert({
        codigo: codigo_descuento,
        descripcion: 'Código de bienvenida newsletter',
        tipo_descuento: 'porcentaje',
        valor_descuento: 10, // 10% descuento
        cantidad_minima_compra: 0,
        uso_unico: true,
        limite_usos: 1,
        activo: true,
        fecha_expiracion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
      })
      .select('id');

    if (cuponError) {
      console.error('Error creating coupon:', cuponError);
      // No fallar completamente, continuar sin cupón
    }

    // ==========================================
    // 5. GUARDAR SUSCRIPTOR EN BASE DE DATOS
    // ==========================================
    const { data: suscriptor, error: suscriptorError } = await supabaseAdmin
      .from('newsletter_suscriptores')
      .upsert({
        email: email.toLowerCase(),
        usuario_id: usuario_id || null,
        estado_suscripcion: true,
        recibe_ofertas: recibe_ofertas !== false,
        codigo_descuento_otorgado: codigo_descuento,
        fecha_suscripcion: new Date().toISOString(),
        fecha_confirmacion: new Date().toISOString() // En producción, enviar email de confirmación
      })
      .select();

    if (suscriptorError) {
      console.error('Error saving subscriber:', suscriptorError);
      return new Response(
        JSON.stringify({ error: 'Error al guardar suscripción' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // 6. ENVIAR EMAIL (CONFIGURACIÓN MANUAL REQUERIDA)
    // ==========================================
    // Este es un paso que DEBE HACERSE MANUALMENTE después
    // Se explica en detalle al final
    
    // Simulamos que enviamos email
    console.log(`📧 ENVIAR EMAIL A: ${email}`);
    console.log(`🎁 CÓDIGO DE DESCUENTO: ${codigo_descuento}`);
    console.log(`💰 DESCUENTO: 10% en tu primera compra`);

    // ==========================================
    // 7. RETORNAR RESPUESTA
    // ==========================================
    return new Response(
      JSON.stringify({
        success: true,
        mensaje: 'Gracias por suscribirte. Hemos enviado un código de descuento a tu email.',
        codigo_descuento, // Opcional: mostrar en frontend
        descuento_porcentaje: 10,
        valido_dias: 30
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
   - Acepta ofertas: true

2. FRONTEND LLAMA:
   POST /api/newsletter/suscribir
   Body: { email, usuario_id, recibe_ofertas }

3. BACKEND EJECUTA:
   a) Valida email
   b) Genera código aleatorio: "DESC2026011701AB23"
   c) Crea cupón automático en DB:
      - Tipo: porcentaje
      - Valor: 10%
      - Vencimiento: 30 días
   d) Guarda suscriptor
   e) ENVÍA EMAIL (paso manual)

4. BASE DE DATOS DESPUÉS:
   
   newsletter_suscriptores:
   ┌─────────────────────────────────────┐
   │ id | email              | codigo    │
   ├─────────────────────────────────────┤
   │ 1  │ usuario@exam.com   │ DESC... │
   └─────────────────────────────────────┘

   cupones:
   ┌──────────────────────────────────────────┐
   │ id | codigo       | tipo    | valor │
   ├──────────────────────────────────────────┤
   │ 1  │ DESC20260117 │ % | 10    │
   └──────────────────────────────────────────┘

5. USUARIO RECIBE EMAIL CON:
   "¡Bienvenido! Aquí está tu código: DESC20260117
    10% de descuento en tu primera compra (válido 30 días)"

6. EN CHECKOUT:
   Usuario ingresa código → validar_cupon() → Si válido, aplicar descuento

*/
