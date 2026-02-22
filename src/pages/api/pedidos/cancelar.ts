// src/pages/api/pedidos/cancelar.ts
// Endpoint para CANCELAR PEDIDO CON RESTAURACIÓN ATÓMICA DE STOCK
// Ejecuta función SQL transaccional

import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '@/lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { orden_id, usuario_id } = body;

    // ==========================================
    // 1. VALIDACIONES
    // ==========================================
    if (!orden_id || !usuario_id) {
      return new Response(
        JSON.stringify({ error: 'Orden ID y Usuario ID son requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // ==========================================
    // 2. VERIFICAR QUE EL PEDIDO EXISTE Y PERTENECE AL USUARIO
    // ==========================================
    // Intentamos seleccionar tanto 'email' como 'email_cliente' por si acaso hay discrepancias de esquema
    const { data: ordenData, error: ordenError } = await supabaseAdmin
      .from('ordenes')
      .select('id, numero_orden, estado, estado_pago, usuario_id, email, email_cliente, nombre, total, actualizado_en')
      .eq('id', orden_id)
      .eq('usuario_id', usuario_id)
      .single();

    if (ordenError) {
      console.error('Error al recuperar la orden:', {
        codigo: ordenError.code,
        mensaje: ordenError.message,
        detalles: ordenError.details,
        hint: ordenError.hint
      });
      return new Response(
        JSON.stringify({
          error: 'Error al buscar el pedido',
          detalles: ordenError.message,
          code: ordenError.code
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const orden = ordenData as any;

    // Fallback para el email
    const emailFinal = orden.email || orden.email_cliente || '';

    if (!orden) {
      return new Response(
        JSON.stringify({ error: 'Pedido no encontrado o no tienes permisos' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // 3. VALIDAR QUE ESTÁ EN ESTADO PAGADO
    // ==========================================
    if (orden.estado !== 'PAGADO') {
      return new Response(
        JSON.stringify({
          error: `No se puede cancelar. Estado actual: ${orden.estado}. Solo se pueden cancelar pedidos en estado PAGADO.`,
          estado_actual: orden.estado
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // 3b. VALIDAR VENTANA DE 2 HORAS
    // ==========================================
    if (orden.actualizado_en) {
      const fechaPago = new Date(orden.actualizado_en);
      const ahora = new Date();
      const dosHorasMs = 2 * 60 * 60 * 1000;
      if (ahora.getTime() - fechaPago.getTime() >= dosHorasMs) {
        return new Response(
          JSON.stringify({
            error: 'El plazo de cancelación de 2 horas ha expirado. Puedes solicitar una devolución una vez recibas el pedido.',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // ==========================================
    // 4. EJECUTAR FUNCIÓN SQL TRANSACCIONAL
    // ==========================================
    // Esta es la operación ATÓMICA que:
    // 1. Restaura stock de todos los productos
    // 2. Cambia estado a CANCELADO
    // 3. Registra en historial
    // TODO en UNA TRANSACCIÓN (todo o nada)

    const { data: resultado, error: funcError } = await (supabaseAdmin as any)
      .rpc('cancelar_pedido_atomico', {
        p_orden_id: orden_id,
        p_usuario_id: usuario_id
      });

    if (funcError) {
      console.error('Error canceling order:', funcError);
      return new Response(
        JSON.stringify({
          error: 'Error al cancelar el pedido',
          detalles: funcError.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // 5. VALIDAR RESULTADO DE LA FUNCIÓN
    // ==========================================
    // Supabase RPC puede devolver un array o un objeto directo dependiendo del tipo de retorno
    const dataObj = Array.isArray(resultado) ? resultado[0] : resultado;
    const { exito, mensaje, stock_restaurado } = dataObj || {};

    if (!exito) {
      return new Response(
        JSON.stringify({
          error: mensaje || 'No se pudo cancelar el pedido',
          exito: false
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // 6. REGISTRAR AUDITORÍA
    // ==========================================
    await (supabaseAdmin as any)
      .from('ordenes_historial')
      .insert({
        orden_id,
        estado_anterior: orden.estado,
        estado_nuevo: 'CANCELADO',
        razon: 'Cancelación solicitada por usuario',
        usuario_id
      });

    // ==========================================
    // 7. ENVIAR EMAIL DE CONFIRMACIÓN
    // ==========================================
    try {
      const { sendOrderStatusUpdateEmail } = await import('@/lib/email');
      await sendOrderStatusUpdateEmail(
        emailFinal,
        orden.nombre || 'Cliente',
        orden.numero_orden,
        'cancelado',
        false // No es invitado si tenemos usuario_id
      );
    } catch (emailError) {
      console.error('Error enviando email de cancelación:', emailError);
    }

    // ==========================================
    // 8. RETORNAR ÉXITO
    // ==========================================
    return new Response(
      JSON.stringify({
        success: true,
        mensaje,
        orden_cancelada: {
          id: orden_id,
          numero_orden: orden.numero_orden,
          estado_nuevo: 'CANCELADO',
          stock_restaurado,
          reembolso: orden.total,
          plazo_reembolso: '5-7 días hábiles'
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en cancelación:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// ============================================================================
// ¿POR QUÉ USAR TRANSACCIONES ATÓMICAS?
// ============================================================================

/*

PROBLEMA SI NO USAMOS TRANSACCIONES:

Escenario: Cancelar pedido con 3 productos

1. Restaurar stock producto A
2. Restaurar stock producto B
3. Restaurar stock producto C (error de conexión)
4. Cambiar estado a CANCELADO

RESULTADO:
- Stock desincronizado
- Usuario ve pedido cancelado pero no se restauró 1 producto
- Venta perdida, stock incorrecto

SOLUCIÓN: TRANSACCIÓN ATÓMICA

```sql
BEGIN TRANSACTION;
  1. Restaurar stock A
  2. Restaurar stock B
  3. Restaurar stock C ERROR
  → ROLLBACK (REVERTIR TODO)
COMMIT;
```

Si cualquier paso falla → SE REVIERTE TODO
O todos los pasos tienen éxito → SE CONFIRMAN TODOS

En PostgreSQL, las funciones PL/pgSQL tienen transacciones implícitas.

*/

// ============================================================================
// FLUJO COMPLETO DE CANCELACIÓN
// ============================================================================

/*

USUARIO EN PANEL:
┌────────────────────────────────────────┐
│ Mis Pedidos                            │
├────────────────────────────────────────┤
│ Pedido: ORD-2026-001                   │
│ Estado: PAGADO                         │
│ Total: 150€                            │
│                                        │
│ [Botón: CANCELAR PEDIDO] ← Visible    │
└────────────────────────────────────────┘

AL HACER CLIC:
1. Modal de confirmación: "¿Cancelar este pedido?"
2. Usuario confirma
3. POST /api/pedidos/cancelar
4. Backend ejecuta función SQL
5. Transacción atómica completa
6. Stock restaurado
7. Estado cambiado a CANCELADO
8. Email enviado al usuario
9. Mostrar mensaje de éxito

BASE DE DATOS DESPUÉS:

ordenes:
┌──────────────────────────────────────┐
│ id | numero | estado      │ total   │
├──────────────────────────────────────┤
│ 1  │ ORD... │ CANCELADO   │ 150   │
└──────────────────────────────────────┘

ordenes_items:
┌────────────────────────────┐
│ orden_id | producto | cant │
├────────────────────────────┤
│ 1        │ 5        │ 2    │
│ 1        │ 8        │ 1    │
└────────────────────────────┘

productos (DESPUÉS DE RESTAURACIÓN):
┌──────────────────────────┐
│ id | nombre   │ stock    │
├──────────────────────────┤
│ 5  │ Aceite   │ 25 → 27  │ (+2)
│ 8  │ Filtro   │ 10 → 11  │ (+1)
└──────────────────────────┘

ordenes_historial (AUDITORÍA):
┌─────────────────────────────────────┐
│ orden | anterior → nuevo | motivo   │
├─────────────────────────────────────┤
│ 1     │ PAGADO → CANCELADO │ Usuario│
└─────────────────────────────────────┘

*/
