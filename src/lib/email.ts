import nodemailer from 'nodemailer';
import { generateInvoicePDF } from './invoice-pdf';
import { generateRefundPDF } from './refund-pdf';

// Helper robosteo para variables de entorno
export const getEnv = (key: string): string | undefined => {
  let val = undefined;

  // 1. Astro standard (import.meta.env)
  if (import.meta.env && import.meta.env[key] !== undefined) {
    val = import.meta.env[key];
  }
  // 2. Node standard (process.env)
  else if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
    val = process.env[key];
  }

  if (val !== undefined) {
    const finalVal = String(val).trim();
    // No log de secretos
    const isSecret = key.includes('PASSWORD') || key.includes('SECRET') || key.includes('KEY');
    if (!isSecret) {
      console.log(`[getEnv] ${key}: ${finalVal}`);
    }
    return finalVal;
  }

  return undefined;
};

/**
 * Retorna el email del administrador configurado o el de respaldo
 */
export const getAdminEmail = (): string => {
  return getEnv('EMAIL_USER') || 'agonzalezcruces2004@gmail.com';
};

// Singleton para el transportador
let transporterInstance: any = null;

// Función para crear el transportador bajo demanda (asegura leer env variables actualizadas)
const getTransporter = () => {
  if (transporterInstance) return transporterInstance;
  const host = getEnv('EMAIL_SMTP_HOST') || 'smtp.gmail.com';
  const port = parseInt(getEnv('EMAIL_SMTP_PORT') || '587');
  const user = getEnv('EMAIL_USER');
  const pass = getEnv('EMAIL_PASSWORD');

  if (!user || !pass) {
    console.error('[EmailService] ❌ Error: EMAIL_USER o EMAIL_PASSWORD no configurados');
  }

  transporterInstance = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporterInstance;
};

/**
 * Verifica la conexión SMTP (para depuración)
 */
export async function verifyConnection(): Promise<boolean> {
  try {
    const transporter = getTransporter();
    const verified = await transporter.verify();
    console.log('✅ Email service connection verified');
    return verified;
  } catch (error) {
    console.error('❌ Email service verification error:', error);
    return false;
  }
}

interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

/**
 * Envía un correo electrónico
 */
export async function sendEmail({ to, subject, html, attachments }: EmailOptions): Promise<boolean> {
  try {
    const from = getEnv('EMAIL_FROM') || getEnv('EMAIL_USER');
    const transporter = getTransporter();

    console.log(`[EmailService] 📧 Intentando enviar email a: ${to} | Asunto: ${subject} | From: ${from}`);

    const result = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      attachments: attachments?.map(a => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType || 'application/pdf',
      })),
    });

    console.log(`[EmailService] ✅ Email enviado correctamente. ID: ${result.messageId}`);
    return true;
  } catch (error) {
    console.error('[EmailService] ❌ ERROR enviando email:', error);
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
 * Envía correo de bienvenida para suscriptores de newsletter con cupón
 */
export async function sendNewsletterWelcomeEmail(
  email: string,
  couponCode: string,
  discount: number = 10
): Promise<boolean> {
  const siteUrl = process.env.SITE_URL || 'https://boss.victoriafp.online';

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #1a1a1a; padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-style: italic;">AutoPartsStore</h1>
      </div>
      
      <div style="padding: 40px 30px; text-align: center; background-image: linear-gradient(to bottom, #fef2f2, #ffffff);">
        <h2 style="color: #111827; margin-bottom: 10px; font-size: 26px;">¡Bienvenido a nuestra Newsletter!</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Gracias por suscribirte. Estamos emocionados de compartir contigo nuestras mejores ofertas, consejos de mantenimiento y novedades del mundo del motor.</p>
        
        <div style="margin: 40px 0; padding: 30px; background-color: #ffffff; border: 2px dashed #dc2626; border-radius: 12px;">
          <p style="color: #ef4444; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-top: 0;">Tu Regalo de Bienvenida</p>
          <p style="font-size: 32px; font-weight: 800; color: #111827; margin: 10px 0;">${discount}% DTO.</p>
          <p style="color: #4b5563; font-size: 14px; margin-bottom: 20px;">Utiliza este código en tu próxima compra:</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 28px; font-weight: bold; color: #111827; letter-spacing: 3px; display: inline-block;">
            ${couponCode}
          </div>
          
          <p style="color: #9ca3af; font-size: 11px; margin-top: 20px;">* Válido por 30 días en toda la tienda.</p>
        </div>
        
        <a href="${siteUrl}/productos" style="background-color: #dc2626; color: #ffffff; padding: 16px 32px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.2);">¡Empezar a comprar ya!</a>
      </div>
      
      <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 13px; margin: 0;">Recibes este correo porque te has suscrito a la newsletter de AutoPartsStore.</p>
        <div style="margin-top: 15px; font-size: 13px;">
          <a href="${siteUrl}/privacidad" style="color: #dc2626; text-decoration: none;">Privacidad</a>
          <span style="color: #d1d5db; margin: 0 10px;">|</span>
          <a href="${siteUrl}/contacto" style="color: #dc2626; text-decoration: none;">Contacto</a>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `🎁 ¡Tu cupón del ${discount}% de descuento ya está aquí!`,
    html
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

  // Generar factura PDF
  let attachments: EmailAttachment[] = [];
  try {
    const pdfBuffer = await generateInvoicePDF({
      orderNumber,
      customerName,
      customerEmail: email,
      items,
      summary,
      total,
    });
    attachments = [{
      filename: `Factura_${orderNumber}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    }];
  } catch (pdfError) {
    console.error('Error generating invoice PDF:', pdfError);
    // Continuamos sin adjunto si falla la generación
  }

  return sendEmail({
    to: email,
    subject: `Confirmación de tu pedido #${orderNumber}`,
    html,
    attachments,
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
  newStatus: string,
  isGuest: boolean = false
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
        <a href="${import.meta.env.SITE || 'https://boss.victoriafp.online'}${isGuest ? `/estado-pedido?orden=${orderNumber}&email=${email}` : '/mi-cuenta/pedidos'}" style="
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

/**
 * Envía correo de confirmación de solicitud de devolución
 */
export async function sendReturnRequestEmail(
  email: string,
  orderNumber: string,
  returnLabel: string,
  totalAmount: number
): Promise<boolean> {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background-color: #1e293b; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Solicitud de Devolución</h1>
        <p style="color: #94a3b8; margin: 10px 0 0 0; font-size: 14px;">Pedido #${orderNumber}</p>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #1e293b; margin-top: 0;">Hemos recibido tu solicitud</h2>
        <p style="line-height: 1.6;">Tu solicitud de devolución para el pedido <strong>#${orderNumber}</strong> ha sido registrada correctamente.</p>
        
        <!-- Estado -->
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px;">Estado de la solicitud</p>
          <span style="
            display: inline-block;
            padding: 8px 20px;
            background-color: #fef3c720;
            color: #d97706;
            border: 1px solid #d97706;
            border-radius: 20px;
            font-weight: bold;
            font-size: 16px;
          ">
            Solicitada
          </span>
        </div>

        <!-- Etiqueta de devolución -->
        <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #c2410c; font-size: 16px;">Etiqueta de Devolución</h3>
          <p style="margin: 0; font-family: monospace; font-size: 18px; font-weight: bold; color: #1e293b; background: #fff; padding: 10px; border-radius: 4px; text-align: center;">
            ${returnLabel}
          </p>
          <p style="margin: 10px 0 0 0; font-size: 13px; color: #9a3412;">Incluye este número dentro del paquete de devolución.</p>
        </div>

        <!-- Instrucciones de envío -->
        <div style="background-color: #f1f5f9; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #1e293b;">Dirección de Envío</h4>
          <p style="margin: 0; line-height: 1.8; font-size: 14px;">
            <strong>AutoParts Store - Devoluciones</strong><br>
            C. Puerto Serrano, 11540<br>
            Sanlúcar de Barrameda, Cádiz<br>
            España
          </p>
        </div>

        <!-- Instrucciones -->
        <div style="margin: 20px 0;">
          <h4 style="color: #1e293b; margin-bottom: 10px;">Instrucciones importantes:</h4>
          <ul style="padding-left: 20px; line-height: 1.8; font-size: 14px; color: #475569;">
            <li>Devuelve los artículos <strong>sin usar</strong> en su <strong>embalaje original</strong></li>
            <li>Incluye el número de etiqueta dentro del paquete</li>
            <li>Utiliza un servicio de mensajería con seguimiento</li>
            <li>Conserva el recibo de envío para tu referencia</li>
          </ul>
        </div>

        <!-- Reembolso -->
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #166534;">Información de Reembolso</h4>
          <p style="margin: 0; font-size: 14px; color: #166534; line-height: 1.6;">
            Una vez recibido y validado el paquete, el reembolso de <strong>€${totalAmount.toFixed(2)}</strong> se procesará en tu método de pago original en un plazo de <strong>5 a 7 días hábiles</strong>.
          </p>
        </div>



        <div style="text-align: center; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
          <p style="font-size: 14px; color: #64748b;">¿Tienes alguna pregunta?</p>
          <p style="font-size: 14px; color: #64748b;">Responde a este email o contáctanos a través de nuestra web.</p>
          <p style="margin-top: 20px; font-weight: bold; color: #1e293b;">Auto Parts Store</p>
        </div>
      </div>
      
      <p style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 20px;">
        © 2026 Auto Parts Store. C. Puerto Serrano, 11540 Sanlúcar de Barrameda, Cádiz. <br>
        Has recibido este correo porque solicitaste una devolución en nuestra tienda.
      </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Solicitud de Devolución - Pedido #${orderNumber}`,
    html,
  });
}

/**
 * Envía email de actualización de estado de devolución (admin → cliente)
 */
export async function sendReturnStatusUpdateEmail(
  email: string,
  orderNumber: string,
  newStatus: string,
  returnLabel: string,
  refundAmount?: number,
  motivoRechazo?: string,
  items?: Array<{ nombre_producto?: string; nombre?: string; cantidad: number; precio_unitario?: number; subtotal?: number }>,
  customerName?: string,
  summary?: { subtotal: number; envio: number; descuento: number }
): Promise<boolean> {
  const statusUpper = newStatus.toUpperCase();

  // Configuración por estado
  const statusConfig: Record<string, { color: string; bg: string; border: string; label: string; icon: string; message: string }> = {
    'APROBADA': {
      color: '#166534', bg: '#f0fdf4', border: '#bbf7d0', label: 'Aprobada', icon: '',
      message: `Tu solicitud de devolución ha sido <strong>aprobada</strong>. Por favor, envía el producto a la dirección indicada más abajo.`
    },
    'RECHAZADA': {
      color: '#991b1b', bg: '#fef2f2', border: '#fecaca', label: 'Rechazada', icon: '',
      message: `Lamentamos informarte que tu solicitud de devolución ha sido <strong>rechazada</strong>. Si tienes alguna duda, no dudes en contactarnos.`
    },
    'PRODUCTO_RECIBIDO': {
      color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe', label: 'Producto Recibido', icon: '',
      message: `Hemos <strong>recibido tu producto</strong>. Estamos procediendo a revisarlo. Te notificaremos cuando el reembolso se procese.`
    },
    'REEMBOLSADA': {
      color: '#166534', bg: '#f0fdf4', border: '#bbf7d0', label: 'Reembolsada', icon: '',
      message: refundAmount
        ? `Tu reembolso de <strong>€${refundAmount.toFixed(2)}</strong> ha sido procesado. Lo recibirás en tu método de pago original en un plazo de <strong>5 a 7 días hábiles</strong>.`
        : `Tu reembolso ha sido procesado. Lo recibirás en tu método de pago original en un plazo de <strong>5 a 7 días hábiles</strong>.`
    },
  };

  const config = statusConfig[statusUpper] || {
    color: '#374151', bg: '#f9fafb', border: '#e5e7eb', label: newStatus, icon: '',
    message: `El estado de tu devolución ha sido actualizado a: <strong>${newStatus}</strong>.`
  };

  const showShippingAddress = statusUpper === 'APROBADA';

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background-color: #1e293b; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Actualización de Devolución</h1>
        <p style="color: #94a3b8; margin: 10px 0 0 0; font-size: 14px;">Pedido #${orderNumber}</p>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
        
        <!-- Estado -->
        <div style="background-color: ${config.bg}; border: 1px solid ${config.border}; border-radius: 8px; padding: 20px; margin-bottom: 20px; text-align: center;">
          <h2 style="color: ${config.color}; margin: 10px 0 5px 0; font-size: 20px;">${config.label}</h2>
          <p style="color: ${config.color}; margin: 0; font-size: 14px;">Etiqueta: <strong>${returnLabel}</strong></p>
        </div>

        <!-- Mensaje -->
        <p style="line-height: 1.6; font-size: 15px; margin-bottom: 20px;">${config.message}</p>

        ${statusUpper === 'RECHAZADA' && motivoRechazo ? `
        <!-- Motivo del rechazo -->
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px 20px; border-radius: 0 8px 8px 0; margin: 0 0 20px 0;">
          <p style="margin: 0 0 5px 0; font-weight: 600; color: #991b1b; font-size: 14px;">Motivo del rechazo:</p>
          <p style="margin: 0; color: #7f1d1d; font-size: 14px; line-height: 1.5;">${motivoRechazo}</p>
        </div>
        ` : ''}

        ${showShippingAddress ? `
        <!-- Dirección de envío (solo para APROBADA) -->
        <div style="background-color: #f1f5f9; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #1e293b;">Envía el producto a:</h4>
          <p style="margin: 0; line-height: 1.8; font-size: 14px;">
            <strong>AutoParts Store - Devoluciones</strong><br>
            C. Puerto Serrano, 11540<br>
            Sanlúcar de Barrameda, Cádiz<br>
            España
          </p>
        </div>
        <div style="margin: 20px 0;">
          <h4 style="color: #1e293b; margin-bottom: 10px;">Instrucciones:</h4>
          <ul style="padding-left: 20px; line-height: 1.8; font-size: 14px; color: #475569;">
            <li>Incluye la etiqueta <strong>${returnLabel}</strong> dentro del paquete</li>
            <li>Devuelve los artículos <strong>sin usar</strong> en su <strong>embalaje original</strong></li>
            <li>Utiliza un servicio de mensajería con seguimiento</li>
          </ul>
        </div>
        ` : ''}



        <div style="text-align: center; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
          <p style="font-size: 14px; color: #64748b;">¿Tienes alguna pregunta? Responde a este email.</p>
          <p style="margin-top: 15px; font-weight: bold; color: #1e293b;">Auto Parts Store</p>
        </div>
      </div>
      
      <p style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 20px;">
        © 2026 Auto Parts Store. C. Puerto Serrano, 11540 Sanlúcar de Barrameda, Cádiz.
      </p>
    </div>
  `;

  const subjectMap: Record<string, string> = {
    'APROBADA': `Devolución Aprobada - Pedido #${orderNumber}`,
    'RECHAZADA': `Devolución Rechazada - Pedido #${orderNumber}`,
    'PRODUCTO_RECIBIDO': `Producto Recibido - Devolución #${orderNumber}`,
    'REEMBOLSADA': `Reembolso Procesado - Pedido #${orderNumber}`,
  };

  // Generar PDF de reembolso si es REEMBOLSADA
  let attachments: EmailAttachment[] = [];
  if (statusUpper === 'REEMBOLSADA' && refundAmount) {
    try {
      const pdfBuffer = await generateRefundPDF({
        orderNumber,
        returnLabel,
        customerEmail: email,
        refundAmount,
        items: items || [],
        customerName: customerName || 'Cliente',
        summary: summary,
      });
      attachments = [{
        filename: `Reembolso_${orderNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      }];
    } catch (pdfError) {
      console.error('Error generating refund PDF:', pdfError);
    }
  }

  return sendEmail({
    to: email,
    subject: subjectMap[statusUpper] || `Actualización Devolución - Pedido #${orderNumber}`,
    html,
    attachments,
  });
}
/**
 * Envía notificación al admin cuando hay un nuevo pedido
 */
export async function sendAdminOrderNotificationEmail(
  adminEmail: string,
  orderNumber: string,
  total: number,
  customerName: string,
  items: any[]
): Promise<boolean> {
  const itemsList = (items || []).map(item => `
    <li>${item.nombre_producto || item.nombre || 'Producto'} x${item.cantidad || 1}</li>
  `).join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee;">
      <h2 style="color: #1e293b;">🚀 Nuevo Pedido Recibido</h2>
      <p>Se ha registrado un nuevo pedido en la tienda:</p>
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Número de Orden:</strong> #${orderNumber}</p>
        <p><strong>Cliente:</strong> ${customerName}</p>
        <p><strong>Total:</strong> €${total.toFixed(2)}</p>
      </div>
      <h4 style="margin-bottom: 10px;">Productos:</h4>
      <ul style="color: #64748b;">
        ${itemsList}
      </ul>
      <p style="margin-top: 30px;">
        <a href="${getEnv('SITE_URL') || 'https://boss.victoriafp.online'}/admin/pedidos" 
           style="background: #1e293b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
           Ver en el Panel Admin
        </a>
      </p>
    </div>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `🔔 NUEVO PEDIDO #${orderNumber} - €${total.toFixed(2)}`,
    html
  });
}

/**
 * Envía notificación al admin cuando hay una nueva solicitud de devolución
 */
export async function sendAdminReturnNotificationEmail(
  adminEmail: string,
  orderNumber: string,
  returnLabel: string,
  reason: string,
  customerEmail: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee;">
      <h2 style="color: #b91c1c;">📦 Nueva Solicitud de Devolución</h2>
      <p>Se ha solicitado una devolución para el pedido <strong>#${orderNumber}</strong>:</p>
      <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #b91c1c;">
        <p><strong>Etiqueta de Devolución:</strong> ${returnLabel}</p>
        <p><strong>Cliente:</strong> ${customerEmail}</p>
        <p><strong>Motivo:</strong> ${reason}</p>
      </div>
      <p style="margin-top: 30px;">
        <a href="${getEnv('SITE_URL') || 'https://boss.victoriafp.online'}/admin/pedidos" 
           style="background: #1e293b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
           Gestionar Devoluciones
        </a>
      </p>
    </div>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `⚠️ SOLICITUD DE DEVOLUCIÓN - Pedido #${orderNumber}`,
    html
  });
}
