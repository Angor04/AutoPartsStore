// src/pages/api/auth/logout.ts
// Endpoint de logout (próxima fase)

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ redirect }) => {
  // TODO: Invalidar sesión
  // TODO: Limpiar cookies

  return redirect('/');
};
