// src/pages/api/admin/ordenes/actualizar-estado.ts
import { getSupabaseAdmin } from '@/lib/supabase';
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

    const { data, error } = await (supabaseAdmin as any)
      .from('ordenes')
      .update({ estado })
      .eq('id', id)
      .select();

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
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
