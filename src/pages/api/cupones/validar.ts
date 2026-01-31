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

    console.log('Validando cupón:', { codigoCupon, subtotal, usuarioId });

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
    // La función retorna: (cupon_id, valido, descuento_calculado, descripcion, mensaje)

    const { data: resultado, error: funcError } = await supabaseAdmin
      .rpc('validar_cupon', {
        p_codigo: codigoCupon.toUpperCase(),
        p_usuario_id: usuarioId || null,
        p_subtotal: subtotal
      });

    console.log('Resultado de validar_cupon:', { resultado, funcError });

    if (funcError) {
      console.error('Error en validar_cupon:', funcError);
      return new Response(
        JSON.stringify({
          error: 'Error al validar cupón: ' + funcError.message,
          valido: false,
          mensaje: 'Error al validar cupón'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // 3. ANALIZAR RESULTADO
    // ==========================================
    // El resultado es un array con un objeto
    let data = Array.isArray(resultado) && resultado.length > 0 ? resultado[0] : resultado;

    console.log('Datos parseados:', JSON.stringify(data, null, 2));
    console.log('Tipo de resultado:', typeof data, 'Es array:', Array.isArray(resultado));

    if (!data) {
      console.error('No hay datos en la respuesta');
      return new Response(
        JSON.stringify({
          valido: false,
          mensaje: 'Cupón no encontrado',
          descuento_calculado: 0
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Normalizar los nombres de campos (pueden venir con snake_case o diferentes)
    const cuponId = data.cupon_id;
    const esValido = data.valido === true;
    const descuentoCalculado = parseFloat(data.descuento_calculado || data.descuento_cal || 0);
    const descripcion = data.descripcion;
    const mensaje = data.mensaje;

    console.log('Campos normalizados:', { cuponId, esValido, descuentoCalculado, descripcion, mensaje });

    // Si la función retorna valido = false
    if (!esValido) {
      console.log('Cupón inválido:', mensaje);
      return new Response(
        JSON.stringify({
          valido: false,
          mensaje: mensaje || 'Cupón no válido',
          descuento_calculado: 0
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // 4. RETORNAR DETALLES DEL DESCUENTO
    // ==========================================
    console.log('Cupón válido, descuento:', descuentoCalculado);
    return new Response(
      JSON.stringify({
        success: true,
        valido: true,
        cupon_id: cuponId,
        codigo: codigoCupon.toUpperCase(),
        descripcion: descripcion || 'Descuento aplicado',
        descuento: descuentoCalculado,
        descuento_calculado: descuentoCalculado,
        mensaje: mensaje || 'Cupón válido',
        total_con_descuento: subtotal - descuentoCalculado
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en validación:', error);
    return new Response(
      JSON.stringify({
        error: 'Error interno del servidor',
        valido: false,
        mensaje: 'Error interno al validar cupón'
      }),
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

1. POST /api/cupones/validar
   Body: {
     codigo_cupon: "DESC20260117",
     usuario_id: "uuid-user",
     subtotal: 150
   }

2. BACKEND LLAMA A SQL:
   SELECT validar_cupon('DESC20260117', 'user-uuid', 150)
   
   La función SQL:
   - Busca el cupón
   - Valida que esté activo
   - Valida que no esté expirado
   - Valida que no lo haya usado antes (si uso_unico)
   - Valida límite de usos totales
   - Calcula el descuento
   
   Retorna: {
     cupon_id: 'uuid',
     es_valido: true,
     valor_descuento: 15,  // 10% de 150€
     mensaje: 'Cupón válido...'
   }

3. FRONTEND RECIBE:
   {
     valido: true,
     descuento: 15,
     total_con_descuento: 171.50
   }

4. FRONTEND ACTUALIZA UI:
   Subtotal: 150€
   Impuestos: 31.50€
   Envío: 5€
   ─────────────────────────────────
   Descuento: -15€ (APLICADO)
   ─────────────────────────────────
   Total: 171.50€

5. AL HACER CLIC EN "COMPRAR":
   POST /api/pedidos/crear
   Body: {
     ...,
     cupon_id: 'uuid-cupon',
     descuento_aplicado: 15
   }

CASOS DE ERROR:

- Cupón inválido:
   POST /api/cupones/validar
   Response: 400
   {
     valido: false,
     error: "Código de cupón inválido"
   }

- Cupón expirado:
   {
     valido: false,
     error: "Este cupón ha expirado"
   }

- Ya lo usaste:
   {
     valido: false,
     error: "Ya has usado este cupón anteriormente"
   }

- Compra mínima no cumplida:
   {
     valido: false,
     error: "Compra mínima requerida: 50€"
   }

*/
