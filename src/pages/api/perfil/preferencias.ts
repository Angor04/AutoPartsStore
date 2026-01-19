// src/pages/api/perfil/preferencias.ts
// Endpoint para actualizar preferencias de comunicación

import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '@/lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const userId = cookies.get('user-id')?.value;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'No autenticado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { recibir_ofertas, notificaciones_pedidos } = body;

    const supabaseAdmin = getSupabaseAdmin();

    const { error } = await supabaseAdmin
      .from('perfiles_usuario')
      .upsert({
        usuario_id: userId,
        recibir_ofertas: recibir_ofertas !== false,
        notificaciones_pedidos: notificaciones_pedidos !== false,
        actualizado_en: new Date().toISOString()
      } as any, { onConflict: 'usuario_id' });

    if (error) {
      console.error('Error actualizando preferencias:', error);
      return new Response(
        JSON.stringify({ error: 'Error al actualizar preferencias' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en preferencias:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
