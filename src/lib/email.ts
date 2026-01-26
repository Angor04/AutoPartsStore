import nodemailer from 'nodemailer';

// Crear transportador de correo con Gmail
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST,
  port: parseInt(process.env.EMAIL_SMTP_PORT || '587'),
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verificar conexión al iniciar
transporter.verify((error, success) => {
  if (error) {
    console.error('Email service error:', error);
  } else if (success) {
    console.log('✅ Email service is ready');
  }
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Envía un correo electrónico
 */
export async function sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
  try {
    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    console.log('✅ Email sent:', result.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
}

/**
 * Envía correo de bienvenida al registrarse
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">¡Bienvenido a Auto Parts Store! 🚗</h2>
      <p>Hola <strong>${name}</strong>,</p>
      <p>Gracias por registrarte en nuestra tienda online. Tu cuenta ha sido creada exitosamente.</p>
      <p>Ahora puedes:</p>
      <ul>
        <li>Explorar nuestro catálogo de piezas de auto</li>
        <li>Agregar productos a tu carrito</li>
        <li>Realizar compras seguras con Stripe</li>
        <li>Ver el historial de tus pedidos</li>
      </ul>
      <p>Si tienes cualquier pregunta, no dudes en contactarnos.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">
        © 2026 Auto Parts Store. Todos los derechos reservados.
      </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: '¡Bienvenido a Auto Parts Store!',
    html,
  });
}

/**
 * Envía correo de confirmación de pedido
 */
export async function sendOrderConfirmationEmail(
  email: string,
  orderNumber: string,
  total: number
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #dc2626; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0;">✅ ¡Pedido Confirmado!</h2>
      </div>
      <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
        <p style="color: #666; margin-top: 0;">Tu compra ha sido procesada correctamente. A continuación encontrarás los detalles de tu pedido.</p>
        
        <!-- Información del Pedido -->
        <div style="background-color: white; padding: 20px; border: 1px solid #ddd; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">Detalles del Pedido</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: #666;"><strong>Número de Pedido:</strong></td>
              <td style="padding: 10px 0; text-align: right; color: #333;"><strong>${orderNumber}</strong></td>
            </tr>
            <tr style="border-top: 1px solid #eee;">
              <td style="padding: 10px 0; color: #666;"><strong>Total:</strong></td>
              <td style="padding: 10px 0; text-align: right; color: #dc2626; font-size: 18px;"><strong>€${total.toFixed(2)}</strong></td>
            </tr>
            <tr style="border-top: 1px solid #eee;">
              <td style="padding: 10px 0; color: #666;"><strong>Estado:</strong></td>
              <td style="padding: 10px 0; text-align: right;">
                <span style="background-color: #10b981; color: white; padding: 4px 10px; border-radius: 20px; font-size: 12px;">CONFIRMADO</span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Información Importante -->
        <div style="background-color: #f0f9ff; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #333;"><strong>📍 Próximos Pasos:</strong></p>
          <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #666;">
            <li>Recibirás un email de confirmación del envío</li>
            <li>Tu pedido será preparado y despachado en 1-2 días hábiles</li>
            <li>Podrás rastrear tu pedido desde tu cuenta</li>
          </ul>
        </div>

        <!-- Call to Action -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://auto_parts_store.victoriafp.online/mi-cuenta" style="
            background-color: #dc2626;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            display: inline-block;
            font-weight: bold;
          ">Ver mi Pedido</a>
        </div>

        <!-- Contacto -->
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; color: #666; font-size: 12px;">
            ¿Tienes preguntas? <a href="https://auto_parts_store.victoriafp.online" style="color: #dc2626; text-decoration: none;">Contáctanos</a>
          </p>
        </div>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
          © 2026 Auto Parts Store. Todos los derechos reservados.<br>
          Este es un email automatizado, por favor no responder.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `✅ Pedido Confirmado - ${orderNumber}`,
    html,
  });
}

/**
 * Envía correo para restablecer contraseña
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  resetUrl: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">🔐 Restablecer Contraseña</h2>
      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
      <p>Haz clic en el botón de abajo para crear una nueva contraseña:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="
          background-color: #007bff;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 4px;
          display: inline-block;
        ">Restablecer Contraseña</a>
      </div>
      <p style="color: #666;">O copia este enlace en tu navegador:</p>
      <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">
        ${resetUrl}
      </p>
      <p style="color: #d9534f;"><strong>⚠️ Este enlace expira en 1 hora.</strong></p>
      <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">
        © 2026 Auto Parts Store. Todos los derechos reservados.
      </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Restablecer tu contraseña - Auto Parts Store',
    html,
  });
}

/**
 * Envía correo de notificación de stock bajo al admin
 */
export async function sendLowStockAlertEmail(
  adminEmail: string,
  products: Array<{ name: string; stock: number; productId: number }>
): Promise<boolean> {
  const productsList = products
    .map(
      (p) =>
        `<tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${p.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; color: #d9534f;"><strong>${p.stock}</strong></td>
        </tr>`
    )
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d9534f;">⚠️ Alerta de Stock Bajo</h2>
      <p>Los siguientes productos tienen stock bajo (menos de 10 unidades):</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Producto</th>
            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Stock</th>
          </tr>
        </thead>
        <tbody>
          ${productsList}
        </tbody>
      </table>
      <p>Por favor, considera reponer el inventario.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">
        © 2026 Auto Parts Store. Todos los derechos reservados.
      </p>
    </div>
  `;

  return sendEmail({
    to: adminEmail,
    subject: '⚠️ Alerta de Stock Bajo - Auto Parts Store',
    html,
  });
}

/**
 * Envía correo de notificación de contacto
 */
export async function sendContactFormEmail(
  name: string,
  email: string,
  phone: string,
  message: string,
  adminEmail: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">📧 Nuevo Mensaje de Contacto</h2>
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Nombre:</strong> ${name}</p>
        <p><strong>Correo:</strong> ${email}</p>
        <p><strong>Teléfono:</strong> ${phone}</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p><strong>Mensaje:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      </div>
      <p style="color: #666; font-size: 12px;">
        © 2026 Auto Parts Store. Todos los derechos reservados.
      </p>
    </div>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `Nuevo Mensaje de Contacto de ${name}`,
    html,
  });
}
