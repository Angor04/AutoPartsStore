import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

interface RefundItem {
    nombre_producto?: string;
    nombre?: string;
    cantidad: number;
    precio_unitario?: number;
    subtotal?: number;
}

interface RefundData {
    orderNumber: string;
    returnLabel: string;
    customerEmail: string;
    customerName?: string;
    refundAmount: number;
    refundDate?: string;
    items?: RefundItem[];
    summary?: {
        subtotal: number;
        envio: number;
        descuento: number;
    };
}

/**
 * Genera un PDF de comprobante de reembolso con estilo de factura
 * Incluye signo negativo en el total para indicar la devolución de dinero.
 */
export async function generateRefundPDF(data: RefundData): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();

    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const margin = 50;
    const contentWidth = width - margin * 2;

    // Colores (Alinhados con invoice-pdf.ts)
    const darkBlue = rgb(30 / 255, 41 / 255, 59 / 255);
    const grayText = rgb(100 / 255, 116 / 255, 139 / 255);
    const lightGray = rgb(226 / 255, 232 / 255, 240 / 255);
    const veryLightGray = rgb(248 / 255, 250 / 255, 252 / 255);
    const white = rgb(1, 1, 1);
    const green = rgb(16 / 255, 185 / 255, 129 / 255);
    const red = rgb(220 / 255, 38 / 255, 38 / 255);

    // ========== HEADER ==========
    page.drawRectangle({
        x: 0, y: height - 100, width, height: 100,
        color: darkBlue,
    });

    page.drawText('AUTO PARTS STORE', {
        x: margin, y: height - 40,
        size: 22, font: helveticaBold, color: white,
    });

    page.drawText('FACTURA DE DEVOLUCIÓN', {
        x: margin, y: height - 62,
        size: 12, font: helvetica, color: white,
    });

    // Nro y fecha a la derecha
    const orderText = `No ${data.orderNumber}`;
    const orderTextWidth = helveticaBold.widthOfTextAtSize(orderText, 11);
    page.drawText(orderText, {
        x: width - margin - orderTextWidth, y: height - 40,
        size: 11, font: helveticaBold, color: white,
    });

    const fecha = data.refundDate || new Date().toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric',
    });
    const fechaText = `Fecha: ${fecha}`;
    const fechaWidth = helvetica.widthOfTextAtSize(fechaText, 10);
    page.drawText(fechaText, {
        x: width - margin - fechaWidth, y: height - 56,
        size: 10, font: helvetica, color: white,
    });

    // ========== DATOS EMPRESA Y CLIENTE ==========
    let y = height - 130;

    // Empresa (EMISOR)
    page.drawText('EMISOR', { x: margin, y, size: 9, font: helveticaBold, color: darkBlue });
    y -= 14;
    page.drawText('Auto Parts Store', { x: margin, y, size: 8, font: helvetica, color: grayText });
    y -= 12;
    page.drawText('C. Puerto Serrano, 11540', { x: margin, y, size: 8, font: helvetica, color: grayText });
    y -= 12;
    page.drawText('Sanlucar de Barrameda, Cadiz', { x: margin, y, size: 8, font: helvetica, color: grayText });
    y -= 12;
    page.drawText('agonzalezcruces2004@gmail.com', { x: margin, y, size: 8, font: helvetica, color: grayText });

    // Cliente (columna derecha)
    const clientX = width / 2 + 20;
    let cy = height - 130;
    page.drawText('CLIENTE', { x: clientX, y: cy, size: 9, font: helveticaBold, color: darkBlue });
    cy -= 14;
    page.drawText(data.customerName || 'Cliente', { x: clientX, y: cy, size: 8, font: helvetica, color: grayText });
    cy -= 12;
    page.drawText(data.customerEmail, { x: clientX, y: cy, size: 8, font: helvetica, color: grayText });
    cy -= 12;
    page.drawText(`Ref. Devolución: ${data.returnLabel}`, { x: clientX, y: cy, size: 8, font: helvetica, color: grayText });

    // Línea separadora
    y -= 25;
    page.drawLine({
        start: { x: margin, y }, end: { x: width - margin, y },
        thickness: 0.5, color: lightGray,
    });

    y -= 20;

    // ========== TABLA CABECERA ==========
    const col1 = margin + 5;
    const col2 = margin + contentWidth * 0.50; // Ajustado para dar más espacio
    const col3 = margin + contentWidth * 0.70;
    const col4 = width - margin - 5;

    // Fondo cabecera
    page.drawRectangle({
        x: margin, y: y - 5, width: contentWidth, height: 20,
        color: veryLightGray,
    });

    page.drawText('PRODUCTO', { x: col1, y: y + 2, size: 8, font: helveticaBold, color: darkBlue });
    page.drawText('CANTIDAD', { x: col2, y: y + 2, size: 8, font: helveticaBold, color: darkBlue });
    page.drawText('PRECIO UNIT.', { x: col3, y: y + 2, size: 8, font: helveticaBold, color: darkBlue });

    const totalHeader = 'TOTAL';
    const totalHeaderW = helveticaBold.widthOfTextAtSize(totalHeader, 8);
    page.drawText(totalHeader, { x: col4 - totalHeaderW, y: y + 2, size: 8, font: helveticaBold, color: darkBlue });

    y -= 22;

    // ========== FILAS ==========
    if (data.items && data.items.length > 0) {
        for (const item of data.items) {
            const nombre = item.nombre_producto || item.nombre || 'Producto';
            const cantidad = item.cantidad;
            const precioUnit = item.precio_unitario || 0;
            const subtotal = item.subtotal || precioUnit * cantidad;

            const nombreClean = nombre
                .replace(/[^\x20-\x7E\xA0-\xFF]/g, '?')
                .substring(0, 50);

            page.drawText(nombreClean, { x: col1, y, size: 8, font: helvetica, color: darkBlue });
            page.drawText(String(cantidad), { x: col2, y, size: 8, font: helvetica, color: darkBlue });
            page.drawText(`${precioUnit.toFixed(2)} EUR`, { x: col3, y, size: 8, font: helvetica, color: darkBlue });

            const subtotalText = `${subtotal.toFixed(2)} EUR`;
            const subtotalW = helvetica.widthOfTextAtSize(subtotalText, 8);
            page.drawText(subtotalText, { x: col4 - subtotalW, y, size: 8, font: helvetica, color: darkBlue });

            y -= 5;
            page.drawLine({
                start: { x: margin, y }, end: { x: width - margin, y },
                thickness: 0.2, color: veryLightGray,
            });
            y -= 12;
        }
    } else {
        // Fallback si no hay items detallados
        page.drawText('Reembolso por devolución de productos', { x: col1, y, size: 8, font: helvetica, color: grayText });
        const totalTextFallback = `-${data.refundAmount.toFixed(2)} EUR`;
        const totalWFallback = helvetica.widthOfTextAtSize(totalTextFallback, 8);
        page.drawText(totalTextFallback, { x: col4 - totalWFallback, y, size: 8, font: helvetica, color: red });
        y -= 20;
    }

    y -= 10;

    // ========== RESUMEN ==========
    const summaryX = width - margin - 150;

    if (data.summary) {
        // Subtotal
        page.drawText('Subtotal:', { x: summaryX, y, size: 9, font: helvetica, color: grayText });
        const subText = `${data.summary.subtotal.toFixed(2)} EUR`;
        const subW = helvetica.widthOfTextAtSize(subText, 9);
        page.drawText(subText, { x: col4 - subW, y, size: 9, font: helvetica, color: grayText });
        y -= 16;

        // Descuento
        if (data.summary.descuento > 0) {
            page.drawText('Descuento:', { x: summaryX, y, size: 9, font: helvetica, color: green });
            const descText = `-${data.summary.descuento.toFixed(2)} EUR`;
            const descW = helvetica.widthOfTextAtSize(descText, 9);
            page.drawText(descText, { x: col4 - descW, y, size: 9, font: helvetica, color: green });
            y -= 16;
        }

        // Envío
        page.drawText('Envio:', { x: summaryX, y, size: 9, font: helvetica, color: grayText });
        const envioText = data.summary.envio === 0 ? 'Gratis' : `${data.summary.envio.toFixed(2)} EUR`;
        const envioW = helvetica.widthOfTextAtSize(envioText, 9);
        page.drawText(envioText, { x: col4 - envioW, y, size: 9, font: helvetica, color: grayText });
        y -= 12;
    }

    // Línea total
    page.drawLine({
        start: { x: summaryX, y }, end: { x: width - margin, y },
        thickness: 0.5, color: darkBlue,
    });
    y -= 20;

    // TOTAL REEMBOLSADO
    page.drawText('TOTAL:', { x: summaryX, y, size: 14, font: helveticaBold, color: darkBlue });
    const finalTotalText = `-${data.refundAmount.toFixed(2)} EUR`;
    const finalTotalW = helveticaBold.widthOfTextAtSize(finalTotalText, 14);
    page.drawText(finalTotalText, { x: col4 - finalTotalW, y, size: 14, font: helveticaBold, color: red });

    // ========== PIE ==========
    const footerY = 60;
    page.drawLine({
        start: { x: margin, y: footerY }, end: { x: width - margin, y: footerY },
        thickness: 0.3, color: lightGray,
    });

    const footer1 = '2026 Auto Parts Store. C. Puerto Serrano, 11540 Sanlucar de Barrameda, Cadiz.';
    const footer1W = helvetica.widthOfTextAtSize(footer1, 7);
    page.drawText(footer1, {
        x: (width - footer1W) / 2, y: footerY - 12,
        size: 7, font: helvetica, color: grayText,
    });

    const footer2 = 'Gracias por tu confianza. Este documento sirve como comprobante de tu reembolso.';
    const footer2W = helvetica.widthOfTextAtSize(footer2, 7);
    page.drawText(footer2, {
        x: (width - footer2W) / 2, y: footerY - 22,
        size: 7, font: helvetica, color: grayText,
    });

    // Generar bytes
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
}
