// src/pages/api/auth/login.ts
// Endpoint de login para administradores (próxima fase)

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, redirect }) => {
  // Implementación de Supabase Auth
  // Esto será completado en Hito 2

  const formData = await request.formData();
  const email = formData.get('email');
  const password = formData.get('password');

  // TODO: Verificar credenciales contra Supabase Auth
  // TODO: Crear sesión
  // TODO: Guardar token en cookie segura

  return redirect('/admin');
};
