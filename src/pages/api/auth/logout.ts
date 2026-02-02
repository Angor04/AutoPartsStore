// src/pages/api/auth/logout.ts
// Endpoint para cerrar sesión

import type { APIRoute } from 'astro';
import { clearCartFromDB } from '@/lib/cartStorage';

export const prerender = false;

export const GET: APIRoute = async ({ redirect, cookies }) => {
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

  // Redirigir a página principal
  return redirect('/');
};
