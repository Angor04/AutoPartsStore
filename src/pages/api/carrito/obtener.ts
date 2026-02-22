// src/pages/api/carrito/obtener.ts
// Obtener carrito del usuario logueado

import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '@/lib/supabase';

export const GET: APIRoute = async ({ request, cookies }) => {
  const userId = cookies.get('user-id')?.value;

  if (!userId) {
    return new Response(JSON.stringify({ error: 'No autenticado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Obtener el carrito del usuario
    const { data: cartData, error } = await (supabaseAdmin as any)
      .from('carrito_temporal')
      .select('items')
      .eq('usuario_id', userId)
      .single();

    if (error || !cartData) {
      return new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const items = cartData.items || [];

    // ENRIQUECER ITEMS CON PRECIOS ACTUALES DE LA BD
    // Esto asegura que si un producto entra en oferta, el carrito muestre el precio actual
    if (items.length > 0) {
      const productIds = items.map((i: any) => i.product_id);
      const { data: currentProducts } = await supabaseAdmin
        .from('productos')
        .select('id, precio, precio_original, stock, nombre')
        .in('id', productIds);

      if (currentProducts) {
        const productMap = new Map(currentProducts.map((p: any) => [String(p.id), p]));

        for (const item of items) {
          const actual: any = productMap.get(String((item as any).product_id));
          if (actual) {
            const specs = (actual.especificaciones as Record<string, string>) || {};
            const isOfferActive = specs.en_oferta === 'true';

            // Si la oferta está activa, usamos 'precio' (el rebajado)
            // Si NO está activa, usamos 'precio_original' (el base)
            const effectivePrice = isOfferActive
              ? actual.precio
              : (actual.precio_original || actual.precio);

            (item as any).precio = effectivePrice;
            (item as any).nombre = actual.nombre;
            (item as any).stock = actual.stock;
          }
        }
      }
    }


    return new Response(JSON.stringify({ items }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('Error en GET /api/carrito/obtener:', e);
    return new Response(JSON.stringify({ items: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
