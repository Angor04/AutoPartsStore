// src/pages/api/admin/categorias/crear.ts
import { getSupabaseAdmin } from '@/lib/supabase';
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const formData = await context.request.formData();
    const nombre = formData.get('nombre') as string;
    const slug = formData.get('slug') as string;

    if (!nombre || !slug) {
      return new Response(
        JSON.stringify({ error: 'Nombre y slug son requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await (supabaseAdmin as any).from('categorias').insert({
      nombre,
      slug,
    });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating categoria:', error);
    return new Response(
      JSON.stringify({ error: 'Error al crear categoría' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
