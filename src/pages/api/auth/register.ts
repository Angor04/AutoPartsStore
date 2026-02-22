// src/pages/api/auth/register.ts
// Endpoint de registro de usuarios

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { sendWelcomeEmail } from '../../../lib/email';

export const prerender = false;

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

export const POST: APIRoute = async ({ request, redirect }) => {
  try {
    const formData = await request.formData();
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();
    const confirmPassword = formData.get('confirm-password')?.toString();
    const fullname = formData.get('fullname')?.toString();
    const telefono = formData.get('telefono')?.toString();


    // Validaciones
    if (!email || !password || !fullname) {
      return redirect('/auth/register?error=Completa todos los campos requeridos');
    }

    if (password !== confirmPassword) {
      return redirect('/auth/register?error=Las contraseñas no coinciden');
    }

    if (password.length < 6) {
      return redirect('/auth/register?error=La contraseña debe tener al menos 6 caracteres');
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return redirect('/auth/register?error=Configuración de Supabase incompleta');
    }

    // Crear cliente con service role (permisos de admin)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nombre: fullname,
        telefono: telefono || '',
      },
    });


    if (authError || !authData.user) {
      return redirect(`/auth/register?error=${encodeURIComponent(authError?.message || 'Error al crear usuario')}`);
    }

    // 2. Insertar en tabla usuarios
    const insertData = {
      id: authData.user.id,
      nombre: fullname,
      email,
      telefono: telefono || null,
      activo: true,
      creado_en: new Date().toISOString(),
      actualizado_en: new Date().toISOString(),
    };


    const { data: insertResult, error: insertError } = await supabase
      .from('usuarios')
      .insert(insertData)
      .select();


    if (insertError) {
      // Si falla, eliminar el usuario creado
      console.error('Insert error details:', insertError);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return redirect(`/auth/register?error=${encodeURIComponent(insertError.message || 'Error al crear el perfil')}`);
    }

    // 2b. Vincular pedidos de invitado anteriores
    try {

      // Intentar vincular por columna 'email'
      const { error: updateError1 } = await supabase
        .from('ordenes')
        .update({ usuario_id: authData.user.id })
        .eq('email', email)
        .is('usuario_id', null);

      // Intentar vincular por columna 'email_cliente' (según schema base)
      const { error: updateError2 } = await supabase
        .from('ordenes')
        .update({ usuario_id: authData.user.id })
        .eq('email_cliente', email)
        .is('usuario_id', null);

      if (updateError1 && updateError2) {
      } else {
      }
    } catch (linkError) {
      console.error('Error vinculando pedidos:', linkError);
    }

    // 3. Enviar email de bienvenida con Nodemailer
    try {

      const emailSent = await sendWelcomeEmail(fullname, email);

      if (emailSent) {
      } else {
      }
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // No redirigir a error, solo avisar en logs
    }

    // Redirigir a login con mensaje
    return redirect(`/auth/login?message=${encodeURIComponent('Cuenta creada exitosamente. Por favor inicia sesión')}`);
  } catch (error) {
    console.error('Registration error:', error);
    return redirect(`/auth/register?error=${encodeURIComponent(String(error))}`);
  }
};

