// src/pages/api/auth/logout.ts
// Endpoint para cerrar sesión

import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ redirect, cookies }) => {
  // Eliminar cookies de sesión
  cookies.delete('sb-access-token', { path: '/' });
  cookies.delete('sb-refresh-token', { path: '/' });

  // Redirigir a página principal
  return redirect('/');
};
