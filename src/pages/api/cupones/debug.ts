// src/pages/api/cupones/debug.ts
// Endpoint para debuggear cupones

import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '@/lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const usuarioId = cookies.get('user-id')?.value;

    // 1. Verificar tabla cupones existe y tiene datos
    const { data: cupones, error: cupError } = await supabaseAdmin
      .from('cupones')
      .select('*');

    // 2. Verificar si hay datos en cupones_usados
    const { data: usados, error: usadosError } = await supabaseAdmin
      .from('cupones_usados')
      .select('*');

    // 3. Intentar validar un cupón de prueba
    const { data: validacion, error: validError } = await supabaseAdmin
      .rpc('validar_cupon', {
        p_codigo: 'BIENVENIDO10',
        p_usuario_id: usuarioId || null,
        p_subtotal: 100
      });

    return new Response(
      JSON.stringify({
        usuario_id: usuarioId,
        cupones: {
          datos: cupones,
          error: cupError,
          cantidad: cupones?.length || 0
        },
        cupones_usados: {
          datos: usados,
          error: usadosError,
          cantidad: usados?.length || 0
        },
        prueba_validacion: {
          codigo: 'BIENVENIDO10',
          resultado: validacion,
          error: validError
        }
      }, null, 2),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
