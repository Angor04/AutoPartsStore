// src/pages/api/contact.ts
// Formulario de contacto con email de notificación

import type { APIRoute } from 'astro';
import { sendContactFormEmail } from '../../lib/email';

export const prerender = false;

const ADMIN_EMAIL = 'agonzalezcruces2004@gmail.com'; // Cambiar al email del admin

export const POST: APIRoute = async ({ request, redirect }) => {
  try {
    const formData = await request.formData();
    const name = formData.get('name')?.toString();
    const email = formData.get('email')?.toString();
    const phone = formData.get('phone')?.toString();
    const message = formData.get('message')?.toString();

    // Validaciones
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: 'Por favor completa los campos obligatorios' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Enviar email al admin
    const emailSent = await sendContactFormEmail(
      name,
      email,
      phone || '',
      message,
      ADMIN_EMAIL
    );

    if (!emailSent) {
      return new Response(
        JSON.stringify({ error: 'Error al enviar el mensaje' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Tu mensaje ha sido enviado correctamente. Nos pondremos en contacto pronto.'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
