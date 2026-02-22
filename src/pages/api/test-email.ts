// src/pages/api/test-email.ts
// Test endpoint para verificar que el email funciona

import type { APIRoute } from 'astro';
import { sendEmail, getAdminEmail, getEnv } from '@/lib/email';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const adminEmail = getAdminEmail();

    // 1. Probar email simple
    const successSimple = await sendEmail({
      to: adminEmail,
      subject: 'Test Email Simple - Auto Parts Store',
      html: `<h2>Test Simple</h2><p>Enviado el: ${new Date().toLocaleString()}</p>`
    });

    // 2. Probar Notificación Admin extendida
    const successAdmin = await import('@/lib/email').then(m =>
      m.sendAdminOrderNotificationEmail(
        adminEmail,
        'TEST-0001',
        99.99,
        'Usuario de Prueba',
        [
          { nombre_producto: 'Bujía Premium', cantidad: 4 },
          { nombre_producto: 'Aceite Motor 5W30', cantidad: 1 }
        ]
      )
    );

    const success = successSimple && successAdmin;

    // Obtener info de diagnóstico (mascarada)
    const debugConfig = {
      smtp_host: getEnv('EMAIL_SMTP_HOST'),
      smtp_port: getEnv('EMAIL_SMTP_PORT'),
      email_user: getEnv('EMAIL_USER') ? `${getEnv('EMAIL_USER')?.slice(0, 4)}***` : 'MISSING',
      admin_detected: adminEmail,
      email_from: getEnv('EMAIL_FROM')
    };

    return new Response(
      JSON.stringify({
        success,
        simple: successSimple,
        admin_notification: successAdmin,
        config: debugConfig,
        message: success ? 'Emails sent successfully' : 'One or more emails failed',
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in test-email:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
