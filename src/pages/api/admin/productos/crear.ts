// src/pages/api/admin/productos/crear.ts
// Endpoint para crear nuevo producto (próxima fase)

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  // TODO: Verificar autenticación
  // TODO: Obtener datos del formulario
  // TODO: Validar datos
  // TODO: Subir imágenes a Supabase Storage
  // TODO: Insertar producto en BD
  // TODO: Redirigir a /admin/productos

  return new Response(JSON.stringify({ error: 'Not implemented yet' }), {
    status: 501,
  });
};
