// src/pages/api/auth/login.ts
// Endpoint de login para usuarios

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export const POST: APIRoute = async ({ request, redirect, cookies }) => {
  try {
    const formData = await request.formData();
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();

    if (!email || !password) {
      return redirect('/auth/login?error=Email y contraseña son requeridos');
    }

    // Autenticar con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      let errorMessage = error.message;

      // Traducir mensajes de error comunes
      if (error.message === 'Invalid login credentials') {
        errorMessage = 'Correo o contraseña inválidos';
      } else if (error.message === 'Email not confirmed') {
        errorMessage = 'Por favor confirma tu email';
      } else if (error.message === 'User not found') {
        errorMessage = 'Usuario no encontrado';
      }

      return redirect(`/auth/login?error=${encodeURIComponent(errorMessage)}`);
    }

    if (data.session) {
      const isProduction = import.meta.env.PROD;

      // Guardar sesión en cookie
      cookies.set('sb-access-token', data.session.access_token, {
        secure: isProduction,
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: data.session.expires_in,
      });

      cookies.set('sb-refresh-token', data.session.refresh_token, {
        secure: isProduction,
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 días
      });

      // Cookie legible por JavaScript para el carrito (NO httpOnly)
      cookies.set('user-id', data.session.user.id, {
        secure: isProduction,
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 días
      });

      // Cookie de email del usuario
      cookies.set('user-email', data.session.user.email || '', {
        secure: isProduction,
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });

      return redirect('/');
    }

    return redirect('/auth/login?error=Error al iniciar sesión');
  } catch (error) {
    console.error('Login error:', error);
    return redirect('/auth/login?error=Error al procesar la solicitud');
  }
};
