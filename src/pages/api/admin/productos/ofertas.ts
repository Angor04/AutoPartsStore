// src/pages/api/admin/productos/ofertas.ts
// Actualizar ofertas y precios de productos

import { getSupabaseAdmin } from '@/lib/supabase';
import type { APIRoute } from 'astro';

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { productIds, precioOriginal, precio, enOferta, action } = body;

    // Validar que tengamos producto IDs
    if (!productIds || productIds.length === 0) {
      return new Response(JSON.stringify({ error: 'No products selected' }), { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Actualizar los productos seleccionados
    for (const productId of productIds) {
      // 1. Obtener especificaciones actuales para no borrarlas
      const { data: currentProduct } = await (supabaseAdmin as any)
        .from('productos')
        .select('especificaciones, precio_original, precio')
        .eq('id', productId)
        .single();

      const updateData: any = {};
      const specs = currentProduct?.especificaciones || {};

      if (action === 'restore') {
        updateData.precio_original = null;
        updateData.precio = currentProduct?.precio_original || currentProduct?.precio;
        specs.en_oferta = 'false';
      } else {
        if (precioOriginal !== undefined) updateData.precio_original = precioOriginal;
        if (precio !== undefined) updateData.precio = precio;
        if (enOferta !== undefined) {
          specs.en_oferta = enOferta ? 'true' : 'false';
        }
      }

      updateData.especificaciones = specs;

      // Actualizar el producto
      const { error } = await (supabaseAdmin as any)
        .from('productos')
        .update(updateData)
        .eq('id', productId);

      if (error) {
        console.error('Error updating product:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }
    }

    return new Response(JSON.stringify({ success: true, message: 'Ofertas actualizadas' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
