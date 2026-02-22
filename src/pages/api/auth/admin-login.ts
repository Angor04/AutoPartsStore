// src/pages/api/auth/admin-login.ts

import { supabaseClient } from '@/lib/supabase';
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const formData = await context.request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const adminSecretKey = formData.get('admin_secret_key') as string;

    const correctSecretKey = import.meta.env.ADMIN_SECRET_KEY || process.env.ADMIN_SECRET_KEY;
    const secretUrl = '/acceso-interno-privado';

    if (!email || !password || !adminSecretKey) {
      return context.redirect(`${secretUrl}?error=${encodeURIComponent('Todos los campos son obligatorios')}`);
    }

    // 1. VALIDAR LLAVE MAESTRA PRIMERO (2FA Capa 1)
    if (adminSecretKey !== correctSecretKey) {
      console.error('[AdminLogin] Master Key mismatch');
      return context.redirect(`${secretUrl}?error=${encodeURIComponent('Llave de Acceso incorrecta')}`);
    }

    // 2. Autenticar con Supabase (Capa 2)
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[AdminLogin] Supabase Auth Error:', error);
    }

    if (error || !data.session) {
      return context.redirect(`${secretUrl}?error=${encodeURIComponent('Credenciales inválidas')}`);
    }

    // Guardar token en cookie (sin maxAge = se cierra al cerrar la pestaña)
    context.cookies.set('sb-auth-token', data.session.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      // Sin maxAge: la cookie se elimina al cerrar la pestaña
    });

    // Guardar timestamp de última actividad (para controlar inactividad de 1 hora)
    const now = new Date().getTime().toString();
    context.cookies.set('sb-last-activity', now, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });

    // Refresh token (si existe, para mantenerlo más tiempo)
    if (data.session.refresh_token) {
      context.cookies.set('sb-refresh-token', data.session.refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 días
        path: '/',
      });
    }

    // Redirigir al dashboard
    return context.redirect('/admin');
  } catch (error) {
    console.error('Login error:', error);
    return context.redirect(
      `/admin/login?error=${encodeURIComponent('Error al procesar la solicitud')}`
    );
  }
};
