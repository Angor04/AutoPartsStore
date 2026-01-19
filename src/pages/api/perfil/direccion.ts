// src/pages/api/perfil/direccion.ts
// Endpoint para guardar/actualizar dirección de envío

import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '@/lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const userId = cookies.get('user-id')?.value;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'No autenticado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { 
      direccion,
      ciudad, 
      provincia, 
      codigo_postal, 
      pais
    } = body;

    // Validaciones básicas
    if (!direccion || !ciudad || !codigo_postal) {
      return new Response(
        JSON.stringify({ error: 'Dirección, ciudad y código postal son obligatorios' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Buscar si ya existe una dirección principal del usuario
    const { data: existenteData } = await supabaseAdmin
      .from('direcciones_envio')
      .select('id')
      .eq('usuario_id', userId)
      .eq('es_principal', true)
      .single();

    const existente = existenteData as { id: string } | null;

    const direccionData = {
      usuario_id: userId,
      direccion,
      ciudad,
      provincia: provincia || '',
      codigo_postal,
      pais: pais || 'España',
      es_principal: true,
      actualizado_en: new Date().toISOString()
    };

    let error: any;

    if (existente?.id) {
      // Actualizar existente
      const result = await (supabaseAdmin as any)
        .from('direcciones_envio')
        .update(direccionData)
        .eq('id', existente.id);
      error = result.error;
    } else {
      // Crear nueva
      const result = await (supabaseAdmin as any)
        .from('direcciones_envio')
        .insert(direccionData);
      error = result.error;
    }

    if (error) {
      console.error('Error guardando dirección:', error);
      return new Response(
        JSON.stringify({ error: 'Error al guardar dirección' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, mensaje: 'Dirección guardada' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en guardar dirección:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
