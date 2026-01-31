// src/pages/api/admin/ordenes/actualizar-estado.ts
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendOrderStatusUpdateEmail } from '@/lib/email';
import type { APIRoute } from 'astro';

export const prerender = false;

export const PUT: APIRoute = async (context) => {
  try {
    const formData = await context.request.formData();
    const id = formData.get('id') as string;
    const estado = formData.get('estado') as string;

    if (!id || !estado) {
      return new Response(
        JSON.stringify({ error: 'ID y estado son requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Actualizar estado
    const { data: ordenData, error } = await (supabaseAdmin as any)
      .from('ordenes')
      .update({ estado })
      .eq('id', id)
      .select('*, usuario_id, email, numero_orden, nombre')
      .single();

    if (error || !ordenData) {
      return new Response(
        JSON.stringify({ error: error?.message || 'Error actualizando orden' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Lógica de envío de email con verificación de preferencias
    try {
      const { email, usuario_id, numero_orden, nombre } = ordenData;

      let shouldSendEmail = true;

      // Si es usuario registrado, verificar sus preferencias
      if (usuario_id) {
        const { data: usuario } = await supabaseAdmin
          .from('usuarios')
          .select('notificaciones_pedidos')
          .eq('id', usuario_id)
          .single();

        // Si tiene perfil y explícitamente desactivó notificaciones, no enviar
        if (usuario && usuario.notificaciones_pedidos === false) {
          shouldSendEmail = false;
          console.log(`Usuario ${usuario_id} tiene desactivadas las notificaciones de pedido. Email omitido.`);
        }
      }
      // Si es invitado (usuario_id null), shouldSendEmail se mantiene true (transaccional)

      if (shouldSendEmail && email) {
        console.log(`Enviando actualización de estado (${estado}) a ${email}`);
        await sendOrderStatusUpdateEmail(
          email,
          nombre || 'Cliente',
          numero_orden || id.slice(0, 8),
          estado
        );
      }

    } catch (emailError) {
      // No fallar la request si el email falla, solo logguear
      console.error('Error enviando email de actualización:', emailError);
    }

    return new Response(
      JSON.stringify({ success: true, data: ordenData }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating orden:', error);
    return new Response(
      JSON.stringify({ error: 'Error al actualizar orden' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
