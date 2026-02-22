// src/pages/api/pedidos/solicitar-devolucion.ts
// Endpoint para solicitar devolución (DESPUÉS DE ENTREGADO)
// Usa función backend de Supabase con validaciones completas

import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendReturnRequestEmail, sendAdminReturnNotificationEmail } from '@/lib/email';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { orden_id, usuario_id, email, motivo, descripcion } = body;

    // ==========================================
    // 1. VALIDACIONES BÁSICAS
    // ==========================================
    if (!orden_id) {
      return new Response(
        JSON.stringify({ error: 'Orden ID es requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!usuario_id && !email) {
      return new Response(
        JSON.stringify({ error: 'Usuario ID o Email es requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!motivo) {
      return new Response(
        JSON.stringify({ error: 'El motivo de la devolución es requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // ==========================================
    // 2. LLAMAR A LA FUNCIÓN BACKEND DE SUPABASE
    // La función valida: estado ENTREGADO, 14 días, duplicados
    // ==========================================
    const { data, error: rpcError } = await supabaseAdmin.rpc(
      'crear_solicitud_devolucion' as any,
      {
        p_orden_id: orden_id,
        p_usuario_id: usuario_id || null, // Puede ser null para invitados
        p_motivo: motivo,
        p_descripcion: descripcion || '',
        p_email: email || null // Nuevo parámetro para validar invitados
      } as any
    );

    if (rpcError) {
      console.error('Error RPC crear_solicitud_devolucion:', rpcError);
      return new Response(
        JSON.stringify({ error: `Error DB: ${rpcError.message || JSON.stringify(rpcError)}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // La función devuelve un objeto JSON con success, error, etc.
    const resultado = data as any;

    if (!resultado.success) {
      return new Response(
        JSON.stringify({ error: resultado.error }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // 3. OBTENER EMAIL DEL USUARIO PARA ENVIAR NOTIFICACIÓN
    // ==========================================
    let emailUsuario = resultado.email_usuario;

    // Si no viene el email de la orden, intentar obtenerlo de auth
    if (!emailUsuario) {
      try {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(usuario_id);
        emailUsuario = userData?.user?.email;
      } catch (e) {
        console.error('Error obteniendo email del usuario:', e);
      }
    }

    // ==========================================
    // 4. ENVIAR EMAILS DE CONFIRMACIÓN Y NOTIFICACIÓN ADMIN
    // ==========================================
    if (emailUsuario) {
      try {
        // Al cliente
        await sendReturnRequestEmail(
          emailUsuario,
          resultado.numero_pedido,
          resultado.numero_etiqueta,
          resultado.monto_reembolso
        );

        // Al admin
        const adminEmail = import.meta.env.EMAIL_USER;
        if (adminEmail) {
          await sendAdminReturnNotificationEmail(
            adminEmail,
            resultado.numero_pedido,
            resultado.numero_etiqueta,
            motivo,
            emailUsuario
          );
        }
      } catch (emailError) {
        // No fallar la solicitud si el email falla
        console.error('⚠️ Error enviando emails de devolución:', emailError);
      }
    } else {
    }

    // ==========================================
    // 5. RETORNAR RESPUESTA EXITOSA
    // ==========================================
    return new Response(
      JSON.stringify({
        success: true,
        mensaje: 'Solicitud de devolución creada exitosamente',
        devolucion: {
          id: resultado.devolucion_id,
          numero_etiqueta: resultado.numero_etiqueta,
          numero_pedido: resultado.numero_pedido,
          monto_reembolso: resultado.monto_reembolso,
          estado: resultado.estado
        },
        instrucciones: {
          direccion: 'C. Puerto Serrano, 11540 Sanlúcar de Barrameda, Cádiz',
          plazo_reembolso: '5-7 días hábiles',
          email_confirmacion: emailUsuario
            ? 'Se ha enviado un email con la etiqueta de devolución'
            : 'No se pudo enviar email de confirmación'
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
