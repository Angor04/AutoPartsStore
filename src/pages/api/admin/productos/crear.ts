// src/pages/api/admin/productos/crear.ts
// Endpoint para crear nuevo producto

import { getSupabaseAdmin } from '@/lib/supabase';
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { nombre, descripcion, precio_original, precio, stock, categoria_id, urls_imagenes } = body;

    // Validaciones
    if (!nombre || precio === undefined || stock === undefined) {
      return new Response(
        JSON.stringify({ error: 'Nombre, precio y stock son requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Generar slug a partir del nombre
    const slug = nombre
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')
      .substring(0, 100);

    const { data, error } = await (supabaseAdmin as any)
      .from('productos')
      .insert({
        nombre,
        descripcion: descripcion || null,
        precio: parseFloat(precio),
        precio_original: precio_original ? parseFloat(precio_original) : null,
        stock: parseInt(stock),
        categoria_id: categoria_id ? parseInt(categoria_id) : null,
        slug,
        urls_imagenes: urls_imagenes && urls_imagenes.length > 0 ? urls_imagenes : null,
      })
      .select();

    if (error) {
      console.error('Error inserting producto:', error);
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
    console.error('Error creating producto:', error);
    return new Response(
      JSON.stringify({ error: 'Error al crear producto' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
