// src/pages/api/cupones/validar.ts
// Endpoint para validar cupón en checkout

import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '@/lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    // Aceptar tanto "codigo_cupon" como "codigo"
    const codigoCupon = body.codigo_cupon || body.codigo;
    const subtotal = body.subtotal || 0;
    
    // Usuario puede venir del body o de cookies
    const usuarioId = body.usuario_id || cookies.get('user-id')?.value;

    // ==========================================
    // 1. VALIDACIONES
    // ==========================================
    if (!codigoCupon) {
      return new Response(
        JSON.stringify({ 
          valido: false,
          error: 'Código de cupón es requerido' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // ==========================================
    // 2. LLAMAR FUNCIÓN SQL DE VALIDACIÓN
    // ==========================================
    // Esta función realiza TODAS las validaciones
    // (expiración, uso, límites, etc.)

    const { data: resultado, error: funcError } = await supabaseAdmin
      .rpc('validar_cupon', {
        p_codigo: codigoCupon.toUpperCase(),
        p_usuario_id: usuarioId || null,
        p_subtotal: subtotal
      });

    if (funcError) {
      console.error('Error validating coupon:', funcError);
      return new Response(
        JSON.stringify({ 
          error: 'Error al validar cupón',
          valido: false
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // 3. ANALIZAR RESULTADO
    // ==========================================
    // El resultado puede ser un objeto o un array
    const data = Array.isArray(resultado) ? resultado[0] : resultado;
    
    if (!data || !data.valido) {
      return new Response(
        JSON.stringify({
          valido: false,
          error: data?.mensaje || 'Cupón inválido',
          mensaje: data?.mensaje || 'Cupón inválido',
          descuento: 0
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // 4. RETORNAR DETALLES DEL DESCUENTO
    // ==========================================
    return new Response(
      JSON.stringify({
        success: true,
        valido: true,
        cupon_id: data.cupon_id,
        codigo: codigoCupon.toUpperCase(),
        descripcion: data.descripcion || 'Descuento aplicado',
        descuento: data.descuento_calculado || 0,
        descuento_calculado: data.descuento_calculado || 0,
        mensaje: data.mensaje,
        total_con_descuento: subtotal - (data.descuento_calculado || 0)
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en validación:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// ============================================================================
// FLUJO DE VALIDACIÓN DE CUPÓN EN CHECKOUT
// ============================================================================

/*

USUARIO EN CHECKOUT:
┌──────────────────────────────────────┐
│ Resumen de Compra                   │
├──────────────────────────────────────┤
│ Subtotal: 150€                       │
│ Impuestos: 31.50€                    │
│ Envío: 5€                            │
│ ─────────────────────────────────   │
│ Total: 186.50€                       │
│                                      │
│ ¿Tienes un código de descuento?     │
│ [_______________] [APLICAR]          │
└──────────────────────────────────────┘

USUARIO INGRESA: "DESC20260117"

CLIC EN "APLICAR":

1️⃣ POST /api/cupones/validar
   Body: {
     codigo_cupon: "DESC20260117",
     usuario_id: "uuid-user",
     subtotal: 150
   }

2️⃣ BACKEND LLAMA A SQL:
   SELECT validar_cupon('DESC20260117', 'user-uuid', 150)
   
   La función SQL:
   ✓ Busca el cupón
   ✓ Valida que esté activo
   ✓ Valida que no esté expirado
   ✓ Valida que no lo haya usado antes (si uso_unico)
   ✓ Valida límite de usos totales
   ✓ Calcula el descuento
   
   Retorna: {
     cupon_id: 'uuid',
     es_valido: true,
     valor_descuento: 15,  // 10% de 150€
     mensaje: 'Cupón válido...'
   }

3️⃣ FRONTEND RECIBE:
   {
     valido: true,
     descuento: 15,
     total_con_descuento: 171.50
   }

4️⃣ FRONTEND ACTUALIZA UI:
   Subtotal: 150€
   Impuestos: 31.50€
   Envío: 5€
   ─────────────────────────────────
   Descuento: -15€ ⭐ (APLICADO)
   ─────────────────────────────────
   Total: 171.50€

5️⃣ AL HACER CLIC EN "COMPRAR":
   POST /api/pedidos/crear
   Body: {
     ...,
     cupon_id: 'uuid-cupon',
     descuento_aplicado: 15
   }

CASOS DE ERROR:

❌ Cupón inválido:
   POST /api/cupones/validar
   Response: 400
   {
     valido: false,
     error: "Código de cupón inválido"
   }

❌ Cupón expirado:
   {
     valido: false,
     error: "Este cupón ha expirado"
   }

❌ Ya lo usaste:
   {
     valido: false,
     error: "Ya has usado este cupón anteriormente"
   }

❌ Compra mínima no cumplida:
   {
     valido: false,
     error: "Compra mínima requerida: 50€"
   }

*/
