// src/pages/api/admin/productos/actualizar.ts
import { getSupabaseAdmin } from '@/lib/supabase';
import type { APIRoute } from 'astro';

export const prerender = false;

export const PUT: APIRoute = async (context) => {
  try {
    const body = await context.request.json();
    const { id, nombre, descripcion, precio_original, precio, stock, categoria_id, urls_imagenes } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'ID de producto es requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const updateData: any = {};
    if (nombre) updateData.nombre = nombre;
    if (descripcion !== undefined) updateData.descripcion = descripcion || null;
    if (precio) updateData.precio = parseFloat(precio);
    if (precio_original !== undefined) updateData.precio_original = precio_original ? parseFloat(precio_original) : null;
    if (stock !== undefined) updateData.stock = stock ? parseInt(stock) : undefined;
    if (categoria_id !== undefined) updateData.categoria_id = categoria_id ? parseInt(categoria_id) : null;
    if (urls_imagenes) updateData.urls_imagenes = urls_imagenes;

    const { data, error } = await (supabaseAdmin as any)
      .from('productos')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating producto:', error);
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
    console.error('Error updating producto:', error);
    return new Response(
      JSON.stringify({ error: 'Error al actualizar producto' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
