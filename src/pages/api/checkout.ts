// src/pages/api/checkout.ts
// Endpoint para procesar checkout y pagos (Hito 3)

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  // TODO: Verificar carrito
  // TODO: Verificar stock de productos
  // TODO: Crear orden en BD
  // TODO: Decrementar stock (transacción atómica)
  // TODO: Crear PaymentIntent en Stripe
  // TODO: Retornar cliente_secret

  return new Response(JSON.stringify({ error: 'Not implemented yet' }), {
    status: 501,
  });
};
