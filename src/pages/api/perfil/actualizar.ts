// src/pages/api/perfil/actualizar.ts
// Endpoint para actualizar datos del perfil de usuario

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
    const { nombre, apellidos, telefono } = body;

    if (!nombre) {
      return new Response(
        JSON.stringify({ error: 'El nombre es obligatorio' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Upsert perfil (crear si no existe, actualizar si existe)
    const { error } = await supabaseAdmin
      .from('perfiles_usuario')
      .upsert({
        usuario_id: userId,
        nombre,
        apellidos: apellidos || '',
        telefono: telefono || null,
        actualizado_en: new Date().toISOString()
      } as any, { onConflict: 'usuario_id' });

    if (error) {
      console.error('Error actualizando perfil:', error);
      return new Response(
        JSON.stringify({ error: 'Error al actualizar perfil' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, mensaje: 'Perfil actualizado' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en actualizar perfil:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
