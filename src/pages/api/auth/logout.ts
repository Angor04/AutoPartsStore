// src/pages/api/auth/logout.ts
// Endpoint para cerrar sesión

import type { APIRoute } from 'astro';
import { clearCartFromDB } from '@/lib/cartStorage';

export const prerender = false;

export const GET: APIRoute = async ({ request, redirect, cookies }) => {
  try {
    // Limpiar carrito de Supabase
    await clearCartFromDB();
  } catch (error) {
    console.error('Error limpiando carrito:', error);
    // Continuar con logout aunque haya error
  }

  // Eliminar cookies de sesión
  cookies.delete('sb-access-token', { path: '/' });
  cookies.delete('sb-refresh-token', { path: '/' });
  cookies.delete('user-id', { path: '/' });
  cookies.delete('user-email', { path: '/' });

  // Detectar el origen de forma robusta
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || 'http';
  const origin = host ? `${proto}://${host}` : (process.env.SITE_URL || 'https://boss.victoriafp.online');

  // Redirigir a página principal
  return redirect(origin);
};
