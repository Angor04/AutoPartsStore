// src/pages/api/auth/reset-password.ts
// Confirmar nuevo token y cambiar contraseña

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const prerender = false;

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

export const POST: APIRoute = async ({ request, redirect }) => {
  try {
    const formData = await request.formData();
    const token = formData.get('token')?.toString();
    const email = formData.get('email')?.toString();
    const newPassword = formData.get('new-password')?.toString();
    const confirmPassword = formData.get('confirm-password')?.toString();

    // Validaciones
    if (!token || !email || !newPassword || !confirmPassword) {
      return redirect('/auth/login?error=Datos incompletos');
    }

    if (newPassword !== confirmPassword) {
      return redirect(`/auth/reset-password?error=${encodeURIComponent('Las contraseñas no coinciden')}&token=${token}&email=${encodeURIComponent(email)}`);
    }

    if (newPassword.length < 6) {
      return redirect(`/auth/reset-password?error=${encodeURIComponent('La contraseña debe tener al menos 6 caracteres')}&token=${token}&email=${encodeURIComponent(email)}`);
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return redirect('/auth/login?error=Configuración incompleta');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Validar el token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const { data: resetData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('user_id, expires_at, used')
      .eq('token_hash', tokenHash)
      .single();

    if (tokenError || !resetData) {
      return redirect('/auth/login?error=Token inválido');
    }

    if (resetData.used) {
      return redirect('/auth/login?error=Este enlace ya fue utilizado');
    }

    const expiryDate = new Date(resetData.expires_at);
    if (expiryDate < new Date()) {
      return redirect('/auth/login?error=Este enlace expiró');
    }

    // 2. Obtener usuario
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('id, email')
      .eq('id', resetData.user_id)
      .single();

    if (userError || !userData) {
      return redirect('/auth/login?error=Usuario no encontrado');
    }

    // 3. Cambiar contraseña con Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      resetData.user_id,
      { password: newPassword }
    );

    if (updateError) {
      return redirect('/auth/login?error=Error al actualizar contraseña');
    }

    // 4. Marcar token como utilizado
    const { error: markError } = await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('token_hash', tokenHash);

    if (markError) {
      console.error('Error marking token as used:', markError);
    }

    // 5. Redirigir a login con éxito
    return redirect('/auth/login?success=Contraseña restablecida correctamente. Por favor inicia sesión');
  } catch (error) {
    console.error('Reset password error:', error);
    return redirect('/auth/login?error=Error al restablecer contraseña');
  }
};
