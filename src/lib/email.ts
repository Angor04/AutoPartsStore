import nodemailer from 'nodemailer';

// Log de variables de entorno al iniciar
console.log('Email config (Astro env):', {
  host: import.meta.env.EMAIL_SMTP_HOST,
  port: import.meta.env.EMAIL_SMTP_PORT,
  user: import.meta.env.EMAIL_USER ? import.meta.env.EMAIL_USER.slice(0, 5) + '***' : 'NO CONFIGURADO',
  from: import.meta.env.EMAIL_FROM
});

// Crear transportador de correo con Gmail
const transporter = nodemailer.createTransport({
  host: import.meta.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(import.meta.env.EMAIL_SMTP_PORT || '587'),
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: import.meta.env.EMAIL_USER,
    pass: import.meta.env.EMAIL_PASSWORD,
  },
});

// Verificar conexión al iniciar
(async () => {
  try {
    const verified = await transporter.verify();
    if (verified) {
      console.log('Email service is ready');
    } else {
      console.warn('Email service verification failed');
    }
  } catch (error) {
    console.error('Email service verification error:', error instanceof Error ? error.message : error);
  }
})();

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
    console.log('Sending email to:', to, 'Subject:', subject);

    const result = await transporter.sendMail({
      from: import.meta.env.EMAIL_FROM || import.meta.env.EMAIL_USER,
      to,
      subject,
      html,
    });

    console.log('Email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error instanceof Error ? error.message : error);
    console.error('Error details:', error);
    return false;
  }
}

/**
 * Envía correo de bienvenida al registrarse
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">¡Bienvenido a Auto Parts Store!</h2>
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
 * Envía correo de confirmación de pedido con detalles completos
 */
export async function sendOrderConfirmationEmail(
  email: string,
  orderNumber: string,
  total: number,
  customerName: string = 'Cliente',
  items: any[] = [],
  summary?: { subtotal: number, envio: number, descuento: number }
): Promise<boolean> {
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        ${item.nombre_producto || item.nombre || 'Producto'} <br>
        <span style="color: #666; font-size: 12px;">Cantidad: ${item.cantidad} x €${(item.precio_unitario || item.precio || 0).toFixed(2)}</span>
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        €${(item.subtotal || ((item.precio_unitario || item.precio || 0) * item.cantidad)).toFixed(2)}
      </td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background-color: #1e293b; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Confirmación de pedido #${orderNumber}</h2>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #1e293b; margin-top: 0;">¡Hola ${customerName}!</h2>
        <p style="line-height: 1.6;">Gracias por confiar en <strong>Auto Parts Store</strong>. Tu pedido ha sido confirmado y ya estamos trabajando en él.</p>
        
        <div style="margin: 30px 0;">
          <h3 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; color: #1e293b;">Resumen del Pedido</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f8fafc;">
                <th style="padding: 10px; text-align: left; font-size: 14px;">Producto</th>
                <th style="padding: 10px; text-align: right; font-size: 14px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <table style="width: 100%; font-size: 14px;">
            ${summary ? `
              <tr>
                <td style="padding: 5px 0; color: #64748b;">Subtotal:</td>
                <td style="padding: 5px 0; text-align: right;">€${summary.subtotal.toFixed(2)}</td>
              </tr>
              ${summary.descuento > 0 ? `
              <tr>
                <td style="padding: 5px 0; color: #10b981;">Descuento:</td>
                <td style="padding: 5px 0; text-align: right; color: #10b981;">-€${summary.descuento.toFixed(2)}</td>
              </tr>` : ''}
              <tr>
                <td style="padding: 5px 0; color: #64748b;">Envío:</td>
                <td style="padding: 5px 0; text-align: right;">${summary.envio === 0 ? 'Gratis' : `€${summary.envio.toFixed(2)}`}</td>
              </tr>
            ` : ''}
            <tr style="font-weight: bold; font-size: 18px; color: #1e293b;">
              <td style="padding: 10px 0; border-top: 1px solid #e2e8f0;">TOTAL:</td>
              <td style="padding: 10px 0; text-align: right; border-top: 1px solid #e2e8f0;">€${total.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
          <h4 style="margin: 0 0 10px 0; color: #1e293b;">¿Qué sigue ahora?</h4>
          <p style="margin: 0; font-size: 14px; line-height: 1.5;">
            Te enviaremos otro correo electrónico en cuanto tu pedido salga de nuestro almacén con el número de seguimiento para que puedas rastrearlo en todo momento.
          </p>
        </div>

        <div style="text-align: center; margin-top: 40px; border-top: 1px solid #e2e8f0; pt: 20px;">
          <p style="font-size: 14px; color: #64748b;">¿Tienes alguna pregunta?</p>
          <p style="font-size: 14px; color: #64748b;">Estamos aquí para ayudarte. Responde a este email o contáctanos a través de nuestra web.</p>
          <p style="margin-top: 20px; font-weight: bold; color: #1e293b;">Auto Parts Store</p>
        </div>
      </div>
      
      <p style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 20px;">
        © 2026 Auto Parts Store. C. Puerto Serrano, 11540 Sanlúcar de Barrameda, Cádiz. <br>
        Has recibido este correo porque realizaste una compra en nuestra tienda.
      </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Confirmación de tu pedido #${orderNumber}`,
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
      <h2 style="color: #333;">Restablecer Contraseña</h2>
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
      <p style="color: #d9534f;"><strong>Este enlace expira en 1 hora.</strong></p>
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
      <h2 style="color: #d9534f;">Alerta de Stock Bajo</h2>
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
    subject: 'Alerta de Stock Bajo - Auto Parts Store',
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
      <h2 style="color: #333;">Nuevo Mensaje de Contacto</h2>
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

/**
 * Envía correo de actualización de estado de pedido
 */
export async function sendOrderStatusUpdateEmail(
  email: string,
  userName: string,
  orderNumber: string,
  newStatus: string
): Promise<boolean> {
  const statusLabels: Record<string, string> = {
    'pendiente': 'Pendiente de pago',
    'pagado': 'Pagado',
    'procesando': 'En proceso',
    'entregado': 'Entregado',
    'cancelado': 'Cancelado',
    'cancelada': 'Cancelado' // Compatibility
  };

  const statusColors: Record<string, string> = {
    'pendiente': '#fbbf24',
    'pagado': '#3b82f6',
    'procesando': '#f59e0b', // Changed to orange/amber for 'En proceso'
    'enviado': '#8b5cf6',
    'entregado': '#10b981',
    'cancelado': '#ef4444',
    'cancelada': '#ef4444'
  };

  const readableStatus = statusLabels[newStatus] || newStatus;
  const statusColor = statusColors[newStatus] || '#6b7280';

  let message = '';
  switch (newStatus) {
    case 'enviado':
      message = 'Tu pedido ha salido de nuestro almacén y está en camino.';
      break;
    case 'entregado':
      message = 'Tu pedido ha sido entregado. ¡Esperamos que lo disfrutes!';
      break;
    case 'procesando':
      message = 'Estamos preparando tu pedido con cuidado.';
      break;
    case 'cancelado':
      message = 'Tu pedido ha sido cancelado. Si ya habías pagado, recibirás el reembolso pronto.';
      break;
    default:
      message = `El estado de tu pedido ha cambiado a: ${readableStatus}`;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Actualización de Estado</h2>
      <p>Hola <strong>${userName}</strong>,</p>
      <p>El estado de tu pedido <strong>#${orderNumber}</strong> ha cambiado.</p>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px;">Nuevo Estado</p>
        <span style="
          display: inline-block;
          padding: 8px 16px;
          background-color: ${statusColor}20;
          color: ${statusColor};
          border: 1px solid ${statusColor};
          border-radius: 20px;
          font-weight: bold;
          font-size: 16px;
        ">
          ${readableStatus}
        </span>
      </div>

      <p>${message}</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${import.meta.env.SITE || 'http://localhost:4321'}/mi-cuenta/pedidos" style="
          background-color: #ef4444;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 4px;
          display: inline-block;
          font-weight: bold;
        ">Ver Detalles del Pedido</a>
      </div>

      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">
        © 2026 Auto Parts Store. Todos los derechos reservados.
      </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Actualización de pedido #${orderNumber} - ${readableStatus}`,
    html,
  });
}
