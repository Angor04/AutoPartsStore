// src/pages/api/auth/resetear-contrasena.ts
// Endpoint para confirmar el reseteo de contraseña

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export const POST: APIRoute = async ({ request, redirect }) => {
  try {
    const formData = await request.formData();
    const token = formData.get('token')?.toString();
    const password = formData.get('password')?.toString();
    const confirm = formData.get('confirm')?.toString();

    // Validaciones
    if (!token || !password || !confirm) {
      return redirect('/auth/login?error=Datos incompletos');
    }

    if (password !== confirm) {
      return redirect(`/auth/resetear-contrasena?token=${encodeURIComponent(token)}&type=recovery&error=Las contraseñas no coinciden`);
    }

    if (password.length < 8) {
      return redirect(`/auth/resetear-contrasena?token=${encodeURIComponent(token)}&type=recovery&error=La contraseña debe tener al menos 8 caracteres`);
    }

    // Validar requisitos de contraseña
    if (!/[A-Z]/.test(password)) {
      return redirect(`/auth/resetear-contrasena?token=${encodeURIComponent(token)}&type=recovery&error=La contraseña debe contener al menos una mayúscula`);
    }

    if (!/[a-z]/.test(password)) {
      return redirect(`/auth/resetear-contrasena?token=${encodeURIComponent(token)}&type=recovery&error=La contraseña debe contener al menos una minúscula`);
    }

    if (!/[0-9]/.test(password)) {
      return redirect(`/auth/resetear-contrasena?token=${encodeURIComponent(token)}&type=recovery&error=La contraseña debe contener al menos un número`);
    }

    // Actualizar la contraseña con Supabase
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      console.error('Password update error:', error);
      
      // Detectar si el token es inválido
      if (error.message.includes('invalid') || error.message.includes('expired')) {
        return redirect('/auth/login?error=El enlace de recuperación ha expirado. Por favor solicita uno nuevo.');
      }

      return redirect('/auth/login?error=Error al actualizar la contraseña. Intenta de nuevo.');
    }

    // Éxito - redirigir a login
    return redirect('/auth/login?message=Contraseña actualizada exitosamente. Por favor inicia sesión con tu nueva contraseña.');
  } catch (error) {
    console.error('Password reset error:', error);
    return redirect('/auth/login?error=Error al procesar el cambio de contraseña');
  }
};
