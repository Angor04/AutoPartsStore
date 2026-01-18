// src/pages/api/admin/productos/eliminar.ts
import { getSupabaseAdmin } from '@/lib/supabase';
import type { APIRoute } from 'astro';

export const prerender = false;

export const DELETE: APIRoute = async (context) => {
  try {
    const id = context.url.searchParams.get('id');

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'ID de producto es requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { error } = await supabaseAdmin.from('productos').delete().eq('id', id);

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting producto:', error);
    return new Response(
      JSON.stringify({ error: 'Error al eliminar producto' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
