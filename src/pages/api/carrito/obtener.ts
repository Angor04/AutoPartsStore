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
      console.log('No hay carrito para el usuario:', userId);
      return new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const items = cartData.items || [];

    // Requisito: Los precios ya vienen como decimales de la BD (precio_original)
    // No aplicar ninguna normalización ni división.

    console.log('Carrito cargado para usuario', userId, ':', items.length, 'items');

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
