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
      <h2 style="color: #333;">✅ Pedido Confirmado</h2>
      <p>Tu pedido ha sido procesado correctamente.</p>
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Número de Pedido:</strong> ${orderNumber}</p>
        <p><strong>Total:</strong> $${total.toFixed(2)}</p>
      </div>
      <p>Recibirás actualizaciones sobre el estado de tu pedido en tu correo electrónico.</p>
      <p>Gracias por tu compra.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">
        © 2026 Auto Parts Store. Todos los derechos reservados.
      </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Pedido Confirmado - ${orderNumber}`,
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
