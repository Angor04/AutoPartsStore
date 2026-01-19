// src/pages/api/carrito/guardar.ts
// Guarda el carrito del usuario en Supabase

import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '@/lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const userId = cookies.get('user-id')?.value;
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { items } = await request.json();
    
    console.log('API carrito/guardar - Usuario:', userId, 'Items:', items?.length);

    const supabase = getSupabaseAdmin();
    
    const { error } = await supabase
      .from('carrito_temporal')
      .upsert(
        {
          usuario_id: userId,
          items: items || [],
          actualizado_en: new Date().toISOString(),
        } as any,
        { onConflict: 'usuario_id' }
      );

    if (error) {
      console.error('Error guardando carrito:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error en API carrito/guardar:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
