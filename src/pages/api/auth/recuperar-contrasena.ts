// src/pages/api/auth/recuperar-contrasena.ts
// Endpoint para solicitar recuperación de contraseña

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export const POST: APIRoute = async ({ request, redirect }) => {
  try {
    const formData = await request.formData();
    const email = formData.get('email')?.toString()?.trim();

    if (!email) {
      return redirect('/auth/recuperar-contrasena?error=El correo es requerido');
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return redirect('/auth/recuperar-contrasena?error=Por favor ingresa un correo válido');
    }

    // Solicitar reset de contraseña en Supabase
    const siteUrl = process.env.SITE_URL || 'http://localhost:4322';
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/resetear-contrasena`,
    });

    if (error) {
      console.error('Password reset error:', error);
      // No revelar si el email existe o no por seguridad
      return redirect('/auth/recuperar-contrasena?success=true&message=Si el correo existe en nuestro sistema, recibirás un enlace de recuperación');
    }

    // Éxito - no revelar si el email existe
    return redirect('/auth/recuperar-contrasena?success=true&message=Si el correo existe en nuestro sistema, recibirás un enlace de recuperación');
  } catch (error) {
    console.error('Password recovery error:', error);
    return redirect('/auth/recuperar-contrasena?error=Error al procesar la solicitud. Intenta de nuevo.');
  }
};
