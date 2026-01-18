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

    // Redirigir a home
    return context.redirect('/');
  } catch (error) {
    console.error('Logout error:', error);
    return context.redirect('/');
  }
};
