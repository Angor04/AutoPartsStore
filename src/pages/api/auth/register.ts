// src/pages/api/auth/register.ts
// Endpoint de registro de usuarios

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const prerender = false;

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = import.meta.env.RESEND_API_KEY;

export const POST: APIRoute = async ({ request, redirect }) => {
  try {
    const formData = await request.formData();
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();
    const confirmPassword = formData.get('confirm-password')?.toString();
    const fullname = formData.get('fullname')?.toString();
    const telefono = formData.get('telefono')?.toString();

    console.log('Form data received:', { email, fullname, telefono });
    console.log('Supabase config:', { url: !!supabaseUrl, key: !!supabaseServiceKey });

    // Validaciones
    if (!email || !password || !fullname) {
      return redirect('/auth/register?error=Completa todos los campos requeridos');
    }

    if (password !== confirmPassword) {
      return redirect('/auth/register?error=Las contraseñas no coinciden');
    }

    if (password.length < 6) {
      return redirect('/auth/register?error=La contraseña debe tener al menos 6 caracteres');
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return redirect('/auth/register?error=Configuración de Supabase incompleta');
    }

    // Crear cliente con service role (permisos de admin)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    console.log('Auth response:', { authError, userId: authData?.user?.id });

    if (authError || !authData.user) {
      return redirect(`/auth/register?error=${encodeURIComponent(authError?.message || 'Error al crear usuario')}`);
    }

    // 2. Insertar en tabla usuarios
    const insertData = {
      id: authData.user.id,
      nombre: fullname,
      email,
      telefono: telefono || null,
      activo: true,
      creado_en: new Date().toISOString(),
      actualizado_en: new Date().toISOString(),
    };
    
    console.log('Inserting user data:', insertData);

    const { data: insertResult, error: insertError } = await supabase
      .from('usuarios')
      .insert(insertData)
      .select();

    console.log('Insert response:', { insertError, result: insertResult });

    if (insertError) {
      // Si falla, eliminar el usuario creado
      console.error('Insert error details:', insertError);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return redirect(`/auth/register?error=${encodeURIComponent(insertError.message || 'Error al crear el perfil')}`);
    }

    // 3. Enviar email de bienvenida
    try {
      console.log('Resend API Key present:', !!resendApiKey);
      
      if (resendApiKey) {
        const resend = new Resend(resendApiKey);
        
        console.log('Attempting to send welcome email to:', email);
        const emailResult = await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: email,
          subject: '¡Bienvenido a Auto Parts Store!',
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { background-color: #fff; padding: 20px; border: 1px solid #dee2e6; border-top: none; }
                  .footer { background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
                  .button { display: inline-block; background-color: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>¡Bienvenido a Auto Parts Store!</h1>
                  </div>
                  <div class="content">
                    <p>Hola <strong>${fullname}</strong>,</p>
                    <p>¡Gracias por registrarte en Auto Parts Store! Tu cuenta ha sido creada exitosamente.</p>
                    <p>Ya puedes acceder a tu cuenta y empezar a explorar nuestros productos.</p>
                    <a href="http://localhost:4321/auth/login" class="button">Ir a Mi Cuenta</a>
                    <p style="margin-top: 30px; border-top: 1px solid #dee2e6; padding-top: 20px;">
                      Si tienes alguna pregunta, no dudes en contactarnos.
                    </p>
                  </div>
                  <div class="footer">
                    <p>&copy; 2026 Auto Parts Store. Todos los derechos reservados.</p>
                  </div>
                </div>
              </body>
            </html>
          `,
        });

        console.log('Email response:', emailResult);
        
        if (emailResult.error) {
          console.error('Email sending error:', emailResult.error);
        } else {
          console.log('✅ Email sent successfully:', emailResult.data?.id);
        }
      } else {
        console.warn('⚠️ RESEND_API_KEY not configured');
      }
    } catch (emailError) {
      console.error('❌ Error sending email:', emailError);
      // No redirigir a error, solo avisar en logs
    }

    // Redirigir a login con mensaje
    return redirect(`/auth/login?message=${encodeURIComponent('Cuenta creada exitosamente. Por favor inicia sesión')}`);
  } catch (error) {
    console.error('Registration error:', error);
    return redirect(`/auth/register?error=${encodeURIComponent(String(error))}`);
  }
};

