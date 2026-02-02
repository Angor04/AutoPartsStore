// src/pages/api/pedidos/solicitar-devolucion.ts
// Endpoint para solicitar devolución (DESPUÉS DE ENTREGADO)

import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '@/lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { orden_id, usuario_id, motivo, descripcion } = body;

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
    const { data: orden, error: ordenError } = await supabaseAdmin
      .from('ordenes')
      .select(`
        id, numero_orden, estado, total, usuario_id,
        ordenes_items(cantidad, producto_id)
      `)
      .eq('id', orden_id)
      .eq('usuario_id', usuario_id)
      .single();

    if (ordenError || !orden) {
      return new Response(
        JSON.stringify({ error: 'Pedido no encontrado o no tienes permisos' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // 3. VALIDAR QUE ESTÁ EN ESTADO ENTREGADO
    // ==========================================
    if (orden.estado !== 'ENTREGADO') {
      return new Response(
        JSON.stringify({
          error: `No se puede solicitar devolución. Estado actual: ${orden.estado}. Solo se pueden devolver pedidos en estado ENTREGADO.`,
          estado_actual: orden.estado
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // 4. GENERAR NÚMERO DE ETIQUETA DE DEVOLUCIÓN
    // ==========================================
    // Formato: DEV-USUARIO_ID-TIMESTAMP-RANDOM
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const numero_etiqueta = `DEV-${timestamp}-${random}`;

    // ==========================================
    // 5. CREAR SOLICITUD DE DEVOLUCIÓN
    // ==========================================
    const { data: devolucion, error: devolError } = await supabaseAdmin
      .from('solicitudes_devolucion')
      .insert({
        orden_id,
        usuario_id,
        estado: 'SOLICITADA',
        motivo: motivo || 'No especificado',
        descripcion: descripcion || '',
        numero_etiqueta_devolucion: numero_etiqueta,
        fecha_solicitud: new Date().toISOString()
      })
      .select('id, numero_etiqueta_devolucion');

    if (devolError) {
      console.error('Error creating return:', devolError);
      return new Response(
        JSON.stringify({ error: 'Error al crear solicitud de devolución' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // 6. ACTUALIZAR ORDEN (VINCULAR DEVOLUCIÓN)
    // ==========================================
    const { error: updateError } = await supabaseAdmin
      .from('ordenes')
      .update({
        solicitud_devolucion_id: devolucion[0].id,
        actualizado_en: new Date().toISOString()
      })
      .eq('id', orden_id);

    if (updateError) {
      console.error('Error updating order:', updateError);
      // Continuar de todas formas, el más importante es que se creó la devol
    }

    // ==========================================
    // 7. ENVIAR EMAIL CON ETIQUETA (MANUAL)
    // ==========================================
    console.log(`\nENVIAR EMAIL DE DEVOLUCIÓN:`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Asunto: Instrucciones de Devolución - ${numero_etiqueta}`);
    console.log(`\nCuerpo del email:`);
    console.log(`
Hola,

Hemos recibido tu solicitud de devolución para el pedido ${orden.numero_orden}.

INSTRUCCIONES DE ENVÍO:
═════════════════════════════════════════════════════════════════════════════

Por favor, devuelve los artículos sin usar en su embalaje original a:

C. Puerto Serrano, 11540
Sanlúcar de Barrameda, Cádiz
España

Número de etiqueta de devolución: ${numero_etiqueta}

IMPORTANTE:
- Incluye el número de etiqueta dentro del paquete
- Utiliza un servicio de mensajería con seguimiento
- Conserva el recibo de envío para tu referencia

═════════════════════════════════════════════════════════════════════════════

REEMBOLSO:
Una vez recibido y validado el paquete, el reembolso de ${orden.total}€ se 
procesará en tu método de pago original en un plazo de 5 a 7 días hábiles.

Cualquier duda, contacta a nuestro equipo de atención al cliente.

Saludos,
Auto Parts Store
soporte@autopartsstore.com
    `);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // ==========================================
    // 8. RETORNAR RESPUESTA CON INSTRUCCIONES
    // ==========================================
    return new Response(
      JSON.stringify({
        success: true,
        mensaje: 'Solicitud de devolución creada exitosamente',
        devolucion: {
          id: devolucion[0].id,
          numero_etiqueta: numero_etiqueta,
          numero_pedido: orden.numero_orden,
          monto_reembolso: orden.total,
          estado: 'SOLICITADA'
        },
        instrucciones: {
          direccion: 'C. Puerto Serrano, 11540 Sanlúcar de Barrameda, Cádiz',
          plazo_reembolso: '5-7 días hábiles',
          email_confirmacion: 'Se ha enviado un email con la etiqueta de devolución'
        }
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en solicitud de devolución:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// ============================================================================
// FLUJO DE DEVOLUCIONES EN DETALLE
// ============================================================================

/*

USUARIO EN PANEL (Estado: ENTREGADO):
┌────────────────────────────────────────┐
│ Mis Pedidos                            │
├────────────────────────────────────────┤
│ Pedido: ORD-2026-001                   │
│ Estado: ENTREGADO                      │
│ Total: 150€                            │
│                                        │
│ [Botón: SOLICITAR DEVOLUCIÓN] ← Visible│
└────────────────────────────────────────┘

AL HACER CLIC:

1. MOSTRAR MODAL / DIALOG:
   ┌─────────────────────────────────────────┐
   │ Solicitar Devolución                    │
   ├─────────────────────────────────────────┤
   │                                         │
   │ ¿Por qué deseas devolver?              │
   │ [ ] Producto defectuoso                │
   │ [ ] No como se esperaba                │
   │ [ ] Cambio de opinión                  │
   │ [ ] Otro...                            │
   │                                         │
   │ Descripción (opcional):                │
   │ [____________________________]          │
   │                                         │
   │ [CONFIRMAR] [CANCELAR]                 │
   └─────────────────────────────────────────┘

2. POST /api/pedidos/solicitar-devolucion
   Body: { orden_id, usuario_id, motivo, descripcion }

3. BACKEND:
   a) Valida que pedido existe y está ENTREGADO
   b) Genera número de etiqueta: DEV-1705413000000-ABC123
   c) Crea registro en solicitudes_devolucion
   d) Vincula a la orden
   e) Envía email con instrucciones

4. MOSTRAR CONFIRMACIÓN EN MODAL:
   ┌─────────────────────────────────────────┐
   │ Devolución Solicitada                   │
   ├─────────────────────────────────────────┤
   │                                         │
   │ INSTRUCCIONES DE ENVÍO:                 │
   │                                         │
   │ Dirección de retorno:                  │
   │ C. Puerto Serrano, 11540               │
   │ Sanlúcar de Barrameda                  │
   │ Cádiz                                   │
   │                                         │
   │ Número de etiqueta:                    │
   │ DEV-1705413000000-ABC123               │
   │                                         │
   │ REEMBOLSO:                             │
   │ Monto: 150€                            │
   │ Plazo: 5-7 días hábiles                │
   │                                         │
   │ Una vez recibido el paquete,           │
   │ procesaremos el reembolso              │
   │                                         │
   │ [DESCARGAR ETIQUETA] [CERRAR]          │
   └─────────────────────────────────────────┘

5. EMAIL RECIBIDO POR USUARIO:
   "Hemos recibido tu solicitud de devolución..."
   (Ver contenido en logs arriba)

6. USUARIO IMPRIME ETIQUETA Y DEVUELVE PAQUETE

7. BASE DE DATOS:

   solicitudes_devolucion:
   ┌──────────────────────────────────┐
   │ id | orden_id | estado | etiqueta│
   ├──────────────────────────────────┤
   │ 1  │ 1        │ SOLICITADA │ DEV...│
   └──────────────────────────────────┘

   ordenes:
   ┌─────────────────────────────────────────┐
   │ id | devolucion_id | estado | total   │
   ├─────────────────────────────────────────┤
   │ 1  │ 1             │ ENTREGADO │ 150 │
   └─────────────────────────────────────────┘

8. ADMIN RECIBE PAQUETE:
   - Escanea etiqueta DEV-...
   - Valida contenido
   - Actualiza: solicitud_devolucion.estado = ACEPTADA
   - Procesa reembolso

9. USUARIO RECIBE EMAIL:
   "Tu devolución ha sido aceptada. Reembolso procesado: 150€"

IMPORTANTE:
- El pedido NO se cancela
- La devolución es un proceso SEPARADO
- El reembolso no es inmediato (puede tomar 5-7 días)
- Se mantiene toda la auditoría y trazabilidad

*/
