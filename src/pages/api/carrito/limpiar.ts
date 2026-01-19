// src/pages/api/carrito/limpiar.ts
// Limpia el carrito del usuario en Supabase

import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '@/lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
  try {
    const userId = cookies.get('user-id')?.value;
    
    if (!userId) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('API carrito/limpiar - Usuario:', userId);

    const supabase = getSupabaseAdmin();
    
    const { error } = await supabase
      .from('carrito_temporal')
      .delete()
      .eq('usuario_id', userId);

    if (error) {
      console.error('Error limpiando carrito:', error);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error en API carrito/limpiar:', error);
    return new Response(JSON.stringify({ success: false }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
