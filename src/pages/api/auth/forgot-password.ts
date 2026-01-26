// src/pages/api/auth/forgot-password.ts
// Solicitud de restablecimiento de contraseña

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { sendPasswordResetEmail } from '../../../lib/email';
import crypto from 'crypto';

export const prerender = false;

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const email = formData.get('email')?.toString();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'El correo es requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Configuración de Supabase incompleta' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Verificar que el usuario existe
    const { data: users, error: userError } = await supabase
      .from('usuarios')
      .select('id, nombre, email')
      .eq('email', email)
      .single();

    if (userError || !users) {
      // Por seguridad, decimos que enviamos email aunque no exista
      console.warn('User not found:', email);
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Si existe una cuenta con este correo, recibirás instrucciones para restablecer tu contraseña'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Generar token único de restablecimiento
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const tokenExpiry = new Date(Date.now() + 3600000); // 1 hora

    // 3. Guardar el token en la tabla reset_tokens
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: users.id,
        token_hash: resetTokenHash,
        expires_at: tokenExpiry.toISOString(),
        used: false,
      });

    if (tokenError) {
      console.error('Error saving reset token:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Error al procesar la solicitud' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Construir URL de restablecimiento
    const resetUrl = `${import.meta.env.SITE}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // 5. Enviar email con el enlace
    const emailSent = await sendPasswordResetEmail(email, resetToken, resetUrl);

    if (!emailSent) {
      console.error('Failed to send password reset email');
      return new Response(
        JSON.stringify({ error: 'Error al enviar el correo' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Se envió un correo con instrucciones para restablecer tu contraseña'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
