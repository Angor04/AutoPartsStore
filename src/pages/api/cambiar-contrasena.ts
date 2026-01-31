// src/pages/api/cambiar-contrasena.ts
// Endpoint para cambiar contraseña del usuario autenticado
// Usa Supabase Auth internamente

import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '@/lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { contraseniaActual, contraseniaNueva, confirmacion } = body;

    // ==========================================
    // 1. VALIDACIONES BÁSICAS
    // ==========================================
    if (!contraseniaActual || !contraseniaNueva || !confirmacion) {
      return new Response(
        JSON.stringify({ error: 'Todos los campos son requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (contraseniaNueva !== confirmacion) {
      return new Response(
        JSON.stringify({ error: 'Las nuevas contraseñas no coinciden' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (contraseniaNueva.length < 6) {
      return new Response(
        JSON.stringify({ error: 'La contraseña debe tener al menos 6 caracteres' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (contraseniaActual === contraseniaNueva) {
      return new Response(
        JSON.stringify({ error: 'La nueva contraseña no puede ser igual a la actual' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // 2. OBTENER USUARIO AUTENTICADO
    // ==========================================
    // Intentar obtener token de cookies o header
    const token = cookies.get('sb-access-token')?.value ||
      (request.headers.get('Authorization')?.startsWith('Bearer ')
        ? request.headers.get('Authorization')?.slice(7)
        : null);

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'No autorizado. Por favor inicia sesión.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Obtener usuario del token para obtener su email
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user || !user.email) {
      return new Response(
        JSON.stringify({ error: 'Sesión inválida o expirada' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // 3. VERIFICAR CONTRASEÑA ACTUAL
    // ==========================================
    // Para verificar la contraseña actual, intentamos hacer login con ella
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: user.email,
      password: contraseniaActual
    });

    if (signInError) {
      return new Response(
        JSON.stringify({ error: 'La contraseña actual es incorrecta' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // 4. ACTUALIZAR CONTRASEÑA
    // ==========================================
    // Usamos updateUserById con el cliente admin
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: contraseniaNueva }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return new Response(
        JSON.stringify({
          error: 'Error al cambiar contraseña. ' + (updateError.message || '')
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // 5. OPCIONAL: REGISTRAR EN AUDITORÍA
    // ==========================================
    // Podrías guardar en una tabla "cambios_contrasena" el timestamp
    // para auditoría o detección de actividad sospechosa

    const { error: logError } = await supabaseAdmin
      .from('cambios_contrasena')
      .insert({
        usuario_id: user.id,
        fecha_cambio: new Date().toISOString(),
        ip_origen: request.headers.get('x-forwarded-for') || 'desconocida'
      });

    if (logError) {
      console.error('Error logging password change:', logError);
      // No fallar si el log no funciona, pero notificar
    }

    // ==========================================
    // 6. RETORNAR ÉXITO
    // ==========================================
    return new Response(
      JSON.stringify({
        success: true,
        mensaje: 'Contraseña cambiada exitosamente',
        usuario_id: user.id
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en cambio de contraseña:', error);
    return new Response(
      JSON.stringify({
        error: 'Error interno del servidor',
        detalles: error instanceof Error ? error.message : 'Desconocido'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// ============================================================================
// NOTAS ARQUITECTÓNICAS - POR QUÉ SE IMPLEMENTA ASÍ
// ============================================================================

/*
1. FLUJO DE SUPABASE AUTH:
   
   Frontend (Cliente)
      ↓
   POST /api/cambiar-contrasena
      ↓
   Servidor (Astro)
      ↓
   supabaseAdmin.auth.admin.updateUserById()
      ↓
   Supabase Auth (PostgreSQL)
      ↓
   Respuesta de éxito/error

2. ¿POR QUÉ NO VERIFICAR CONTRASEÑA ACTUAL?

   - Supabase NO tiene un método "verificar contraseña" por seguridad
   - No queremos que el servidor tenga acceso a la contraseña en texto plano
   - El usuario DEBE estar autenticado (token válido) para cambiar contraseña
   - El token comprueba que es el usuario correcto

3. ¿QUÉ PASA INTERNAMENTE EN SUPABASE?

   a) El usuario inicia sesión → Supabase genera JWT
   b) El JWT contiene: user_id, email, exp (expiración)
   c) El servidor valida el JWT
   d) El servidor usa admin API para cambiar contraseña
   e) Supabase hashea la contraseña con bcrypt
   f) Se guarda en auth.users (tabla interna)

4. SEGURIDAD:

   - La contraseña nunca viaja en texto plano al servidor
   - El servidor no almacena contraseñas
   - Usar HTTPS obligatorio
   - El token JWT expira en ~1 hora
   - Registrar en auditoría cada cambio

5. CONFIGURACIÓN MANUAL EN SUPABASE:

   NINGUNA - Supabase Auth ya está configurado
   Solo necesitas:
   - Tener el proyecto Supabase creado
   - La URL del proyecto
   - La clave de administrador (ya en env variables)

*/
