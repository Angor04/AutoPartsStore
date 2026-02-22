// src/pages/api/admin/devoluciones/actualizar-estado-devolucion.ts
// Endpoint para que el admin cambie el estado de una devolución
// Incluye Stripe refund real al pasar a REEMBOLSADA

import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendReturnStatusUpdateEmail } from '@/lib/email';

export const prerender = false;

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16' as any,
});

export const PUT: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { devolucion_id, nuevo_estado, monto_reembolso, numero_seguimiento, motivo_rechazo } = body;

        // ==========================================
        // 1. VALIDACIONES BÁSICAS
        // ==========================================
        if (!devolucion_id || !nuevo_estado) {
            return new Response(
                JSON.stringify({ error: 'devolucion_id y nuevo_estado son requeridos' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const estadosPermitidos = ['APROBADA', 'RECHAZADA', 'PRODUCTO_RECIBIDO', 'REEMBOLSADA'];
        if (!estadosPermitidos.includes(nuevo_estado.toUpperCase())) {
            return new Response(
                JSON.stringify({ error: `Estado inválido. Permitidos: ${estadosPermitidos.join(', ')}` }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const supabaseAdmin = getSupabaseAdmin();

        // ==========================================
        // 2. SI ES REEMBOLSADA → EJECUTAR STRIPE REFUND PRIMERO
        // ==========================================
        let stripeRefundId: string | null = null;

        if (nuevo_estado.toUpperCase() === 'REEMBOLSADA') {
            // Obtener session_stripe_id de la orden vinculada
            const { data: devolucionData } = await (supabaseAdmin as any)
                .from('solicitudes_devolucion')
                .select('orden_id')
                .eq('id', devolucion_id)
                .single();

            if (!devolucionData) {
                return new Response(
                    JSON.stringify({ error: 'Solicitud de devolución no encontrada' }),
                    { status: 404, headers: { 'Content-Type': 'application/json' } }
                );
            }

            const { data: ordenData } = await (supabaseAdmin as any)
                .from('ordenes')
                .select('session_stripe_id, total')
                .eq('id', devolucionData.orden_id)
                .single();

            if (!ordenData?.session_stripe_id) {
                return new Response(
                    JSON.stringify({ error: 'No se encontró la sesión de Stripe para esta orden. No se puede procesar el reembolso.' }),
                    { status: 400, headers: { 'Content-Type': 'application/json' } }
                );
            }

            try {
                // Recuperar payment_intent de la sesión de Stripe
                const session = await stripe.checkout.sessions.retrieve(ordenData.session_stripe_id, {
                    expand: ['payment_intent']
                });

                const paymentIntentId = typeof session.payment_intent === 'string'
                    ? session.payment_intent
                    : session.payment_intent?.id;

                if (!paymentIntentId) {
                    return new Response(
                        JSON.stringify({ error: 'No se encontró el payment_intent de Stripe.' }),
                        { status: 400, headers: { 'Content-Type': 'application/json' } }
                    );
                }

                // Ejecutar reembolso (total o parcial)
                const refundParams: Stripe.RefundCreateParams = {
                    payment_intent: paymentIntentId,
                };

                // Si se especifica un monto, hacer reembolso parcial (en céntimos)
                const montoFinal = monto_reembolso || ordenData.total;
                if (monto_reembolso && monto_reembolso < ordenData.total) {
                    refundParams.amount = Math.round(monto_reembolso * 100); // Stripe usa céntimos
                }


                const refund = await stripe.refunds.create(refundParams);
                stripeRefundId = refund.id;

            } catch (stripeError: any) {
                console.error('❌ Error en reembolso Stripe:', stripeError);
                return new Response(
                    JSON.stringify({
                        error: `Error al procesar reembolso en Stripe: ${stripeError.message || 'Error desconocido'}`,
                        stripe_error: true
                    }),
                    { status: 500, headers: { 'Content-Type': 'application/json' } }
                );
            }
        }

        // ==========================================
        // 3. CAMBIAR ESTADO EN SUPABASE (función SQL)
        // ==========================================
        const { data: resultado, error: rpcError } = await supabaseAdmin.rpc(
            'admin_cambiar_estado_devolucion' as any,
            {
                p_devolucion_id: devolucion_id,
                p_nuevo_estado: nuevo_estado.toUpperCase(),
                p_numero_seguimiento: numero_seguimiento || null,
                p_monto_reembolso: monto_reembolso || null
            } as any
        );

        if (rpcError) {
            console.error('Error RPC admin_cambiar_estado_devolucion:', rpcError);
            return new Response(
                JSON.stringify({ error: 'Error al cambiar estado de la devolución' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const data = resultado as any;

        if (!data.success) {
            return new Response(
                JSON.stringify({ error: data.error }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // ==========================================
        // 4. ENVIAR EMAIL AL CLIENTE
        // ==========================================
        if (data.email_usuario) {
            try {
                // Si es reembolsada, obtener items del pedido para el PDF
                let orderItems: any[] = [];
                if (nuevo_estado.toUpperCase() === 'REEMBOLSADA') {
                    const { data: devData } = await (supabaseAdmin as any)
                        .from('solicitudes_devolucion')
                        .select('orden_id')
                        .eq('id', devolucion_id)
                        .single();

                    if (devData?.orden_id) {
                        // Obtener datos extras de la orden para calcular descuento prorrateado
                        const { data: ordenExtData } = await (supabaseAdmin as any)
                            .from('ordenes')
                            .select('subtotal, descuento_aplicado, gastos_envio, nombre')
                            .eq('id', devData.orden_id)
                            .single();

                        const subtotalOrden = ordenExtData?.subtotal || 0;
                        const descuentoTotal = ordenExtData?.descuento_aplicado || 0;
                        const gastosEnvio = ordenExtData?.gastos_envio || 0;
                        const nombreCliente = ordenExtData?.nombre || 'Cliente';

                        const { data: items } = await (supabaseAdmin as any)
                            .from('ordenes_items')
                            .select(`
                                cantidad,
                                precio_unitario,
                                subtotal,
                                productos:producto_id (nombre)
                            `)
                            .eq('orden_id', devData.orden_id);

                        let runningSubtotal = 0;
                        orderItems = (items || []).map((item: any) => {
                            const pUnit = item.precio_unitario || 0;
                            const itemSubtotal = pUnit * item.cantidad;
                            runningSubtotal += itemSubtotal;

                            return {
                                nombre_producto: item.productos?.nombre || 'Producto',
                                cantidad: item.cantidad,
                                precio_unitario: pUnit,
                                subtotal: itemSubtotal,
                            };
                        });

                        // El monto real reembolsado es data.monto_reembolso
                        const refundAmount = data.monto_reembolso || 0;

                        // Calculamos el descuento real basado en la diferencia (Subtotal + Envío - Reembolso)
                        const calculatedDiscount = Math.max(0, Math.round((runningSubtotal + gastosEnvio - refundAmount) * 100) / 100);

                        const refundSummary = {
                            subtotal: runningSubtotal,
                            envio: gastosEnvio,
                            descuento: calculatedDiscount
                        };

                        // Adjuntar datos para el email/PDF
                        (data as any).nombre_cliente = nombreCliente;
                        (data as any).refund_summary = refundSummary;
                    }
                }

                await sendReturnStatusUpdateEmail(
                    data.email_usuario,
                    data.numero_pedido,
                    data.nuevo_estado,
                    data.numero_etiqueta,
                    nuevo_estado.toUpperCase() === 'REEMBOLSADA' ? data.monto_reembolso : undefined,
                    nuevo_estado.toUpperCase() === 'RECHAZADA' ? motivo_rechazo : undefined,
                    orderItems.length > 0 ? orderItems : undefined,
                    (data as any).nombre_cliente,
                    (data as any).refund_summary
                );
            } catch (emailError) {
                console.error('⚠️ Error enviando email de estado:', emailError);
            }
        }

        // ==========================================
        // 5. RESPUESTA
        // ==========================================
        return new Response(
            JSON.stringify({
                success: true,
                estado_anterior: data.estado_anterior,
                nuevo_estado: data.nuevo_estado,
                numero_pedido: data.numero_pedido,
                stripe_refund_id: stripeRefundId,
                monto_reembolso: data.monto_reembolso
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error en actualizar-estado-devolucion:', error);
        return new Response(
            JSON.stringify({ error: 'Error interno del servidor' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
