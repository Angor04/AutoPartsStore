// src/pages/api/test-email.ts
// Test endpoint para verificar que el email funciona

import type { APIRoute } from 'astro';
import { sendEmail } from '@/lib/email';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    console.log('🧪 Testing email service...');
    
    const success = await sendEmail({
      to: 'agonzalezcruces2004@gmail.com',
      subject: '🧪 Test Email from Auto Parts Store',
      html: `
        <h2>Test Email</h2>
        <p>Si ves este email, Nodemailer está funcionando correctamente.</p>
        <p>Fecha: ${new Date().toISOString()}</p>
      `
    });

    return new Response(
      JSON.stringify({
        success,
        message: success ? '✅ Email sent successfully' : '❌ Email failed to send',
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
