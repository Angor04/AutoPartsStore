// src/pages/api/carrito/cargar.ts
// Carga el carrito del usuario desde Supabase

import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '@/lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const userId = cookies.get('user-id')?.value;
    
    if (!userId) {
      return new Response(JSON.stringify({ items: [], authenticated: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('API carrito/cargar - Usuario:', userId);

    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
      .from('carrito_temporal')
      .select('items')
      .eq('usuario_id', userId)
      .single() as { data: { items: any[] } | null, error: any };

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error cargando carrito:', error);
      return new Response(JSON.stringify({ items: [], authenticated: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const items = data?.items || [];
    console.log('API carrito/cargar - Items encontrados:', items.length);

    return new Response(JSON.stringify({ items, authenticated: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error en API carrito/cargar:', error);
    return new Response(JSON.stringify({ items: [], authenticated: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
