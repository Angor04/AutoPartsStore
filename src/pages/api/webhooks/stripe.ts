// src/pages/api/webhooks/stripe.ts
// Webhook de Stripe para procesar pagos (Hito 3)

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  // TODO: Verificar firma del webhook
  // TODO: Procesar evento de Stripe
  // TODO: Actualizar estado de orden en BD
  // TODO: Enviar email de confirmación
  // TODO: Retornar 200 OK

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
  });
};
