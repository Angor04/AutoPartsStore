// src/pages/api/perfil/actualizar.ts
// Endpoint para actualizar datos del perfil de usuario

import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '@/lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Obtener token de autenticación
    const token = cookies.get('sb-access-token')?.value ||
      (request.headers.get('Authorization')?.startsWith('Bearer ')
        ? request.headers.get('Authorization')?.slice(7)
        : null);

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'No autenticado. Por favor inicia sesión.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 2. Verificar usuario real con Supabase Auth
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Sesión inválida o expirada' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    const body = await request.json();
    const { nombre, apellidos, telefono } = body;

    if (!nombre) {
      return new Response(
        JSON.stringify({ error: 'El nombre es obligatorio' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Update usuario table
    // Primero verificamos si el usuario existe en la tabla 'usuarios'
    const { data: existingUser } = await (supabaseAdmin as any)
      .from('usuarios')
      .select('id')
      .eq('id', userId)
      .single();

    let operationError = null;

    if (existingUser) {
      // Usuario existe -> Update
      const { error } = await supabaseAdmin
        .from('usuarios')
        .update({
          nombre,
          apellidos: apellidos || null,
          telefono: telefono || null,
          actualizado_en: new Date().toISOString()
        })
        .eq('id', userId);
      operationError = error;
    } else {
      // Usuario no existe en tabla -> Insert (recuperando email de Auth)
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
      const email = userData?.user?.email;

      const { error } = await supabaseAdmin
        .from('usuarios')
        .insert({
          id: userId,
          nombre,
          apellidos: apellidos || null,
          email: email,
          telefono: telefono || null,
          activo: true,
          creado_en: new Date().toISOString(),
          actualizado_en: new Date().toISOString()
        });
      operationError = error;
    }

    if (operationError) {
      console.error('Error actualizando perfil (DB):', operationError);
      return new Response(
        JSON.stringify({ error: `Error al actualizar perfil: ${operationError.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, mensaje: 'Perfil actualizado' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en actualizar perfil:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
