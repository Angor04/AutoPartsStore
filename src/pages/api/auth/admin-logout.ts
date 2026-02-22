// src/pages/api/auth/admin-logout.ts

import { supabaseClient } from '@/lib/supabase';
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    // Limpiar cookies
    context.cookies.delete('sb-auth-token');
    context.cookies.delete('sb-refresh-token');

    // Logout en Supabase
    await supabaseClient.auth.signOut();

    // Detectar el origen de forma más robusta
    const host = context.request.headers.get('x-forwarded-host') || context.request.headers.get('host');
    const proto = context.request.headers.get('x-forwarded-proto') || 'http';
    const origin = host ? `${proto}://${host}` : (process.env.SITE_URL || 'https://boss.victoriafp.online');

    // Redirigir a home
    return context.redirect(origin);
  } catch (error) {
    console.error('Logout error:', error);
    return context.redirect('/');
  }
};
