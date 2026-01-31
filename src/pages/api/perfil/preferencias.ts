// src/pages/api/perfil/preferencias.ts
// Endpoint para actualizar preferencias de comunicación

import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '@/lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Obtener token
    const token = cookies.get('sb-access-token')?.value ||
      (request.headers.get('Authorization')?.startsWith('Bearer ')
        ? request.headers.get('Authorization')?.slice(7)
        : null);

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'No autenticado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 2. Verificar usuario real
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Sesión inválida' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    const body = await request.json();
    const { recibir_ofertas, notificaciones_pedidos } = body;

    // 3. Update usuarios table
    const { error } = await supabaseAdmin
      .from('usuarios')
      .update({
        recibir_ofertas: recibir_ofertas !== false,
        notificaciones_pedidos: notificaciones_pedidos !== false,
        actualizado_en: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error actualizando preferencias (DB):', error);
      return new Response(
        JSON.stringify({ error: `Error al actualizar preferencias: ${error.message}` }),
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
