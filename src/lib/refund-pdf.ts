import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

interface RefundData {
    orderNumber: string;
    returnLabel: string;
    customerEmail: string;
    refundAmount: number;
    refundDate?: string;
    items?: Array<{
        nombre_producto?: string;
        nombre?: string;
        cantidad: number;
        precio_unitario?: number;
        subtotal?: number;
    }>;
}

/**
 * Genera un PDF de comprobante de reembolso usando pdf-lib (puro JS)
 */
export async function generateRefundPDF(data: RefundData): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();

    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const margin = 50;
    const contentWidth = width - margin * 2;

    // Colores
    const darkBlue = rgb(30 / 255, 41 / 255, 59 / 255);
    const grayText = rgb(100 / 255, 116 / 255, 139 / 255);
    const lightGray = rgb(226 / 255, 232 / 255, 240 / 255);
    const veryLightGray = rgb(248 / 255, 250 / 255, 252 / 255);
    const white = rgb(1, 1, 1);
    const green = rgb(16 / 255, 185 / 255, 129 / 255);

    // ========== HEADER ==========
    page.drawRectangle({
        x: 0, y: height - 100, width, height: 100,
        color: darkBlue,
    });

    page.drawText('AUTO PARTS STORE', {
        x: margin, y: height - 40,
        size: 22, font: helveticaBold, color: white,
    });

    page.drawText('COMPROBANTE DE REEMBOLSO', {
        x: margin, y: height - 62,
        size: 11, font: helvetica, color: white,
    });

    // Nro pedido y fecha a la derecha
    const orderText = `Pedido ${data.orderNumber}`;
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

    // ========== DATOS ==========
    let y = height - 130;

    // Etiqueta devolucion
    page.drawText('DATOS DE LA DEVOLUCION', { x: margin, y, size: 9, font: helveticaBold, color: darkBlue });
    y -= 16;

    page.drawText(`Etiqueta: ${data.returnLabel}`, { x: margin, y, size: 9, font: helvetica, color: grayText });
    y -= 14;
    page.drawText(`Cliente: ${data.customerEmail}`, { x: margin, y, size: 9, font: helvetica, color: grayText });
    y -= 14;
    page.drawText(`Pedido original: ${data.orderNumber}`, { x: margin, y, size: 9, font: helvetica, color: grayText });

    y -= 25;

    // Línea separadora
    page.drawLine({
        start: { x: margin, y }, end: { x: width - margin, y },
        thickness: 0.5, color: lightGray,
    });

    y -= 20;

    // ========== ESTADO ==========
    // Recuadro verde de "REEMBOLSADO"
    const reembolsoBoxH = 50;
    page.drawRectangle({
        x: margin, y: y - reembolsoBoxH + 15, width: contentWidth, height: reembolsoBoxH,
        color: rgb(240 / 255, 253 / 255, 244 / 255), // bg-green-50
        borderColor: rgb(187 / 255, 247 / 255, 208 / 255),
        borderWidth: 1,
    });

    page.drawText('REEMBOLSO PROCESADO', {
        x: margin + 15, y: y - 5,
        size: 14, font: helveticaBold, color: green,
    });

    const amountText = `${data.refundAmount.toFixed(2)} EUR`;
    const amountWidth = helveticaBold.widthOfTextAtSize(amountText, 14);
    page.drawText(amountText, {
        x: width - margin - 15 - amountWidth, y: y - 5,
        size: 14, font: helveticaBold, color: green,
    });

    page.drawText('El importe sera devuelto a tu metodo de pago en 5-7 dias habiles.', {
        x: margin + 15, y: y - 25,
        size: 8, font: helvetica, color: grayText,
    });

    y -= reembolsoBoxH + 15;

    // ========== TABLA DE PRODUCTOS (si hay items) ==========
    if (data.items && data.items.length > 0) {
        y -= 10;

        page.drawText('PRODUCTOS DEVUELTOS', { x: margin, y, size: 9, font: helveticaBold, color: darkBlue });
        y -= 18;

        const col1 = margin + 5;
        const col2 = margin + contentWidth * 0.55;
        const col3 = margin + contentWidth * 0.70;
        const col4 = width - margin - 5;

        // Cabecera tabla
        page.drawRectangle({
            x: margin, y: y - 5, width: contentWidth, height: 20,
            color: veryLightGray,
        });

        page.drawText('PRODUCTO', { x: col1, y: y + 2, size: 8, font: helveticaBold, color: darkBlue });
        page.drawText('CANT.', { x: col2, y: y + 2, size: 8, font: helveticaBold, color: darkBlue });
        page.drawText('P. UNIT.', { x: col3, y: y + 2, size: 8, font: helveticaBold, color: darkBlue });

        const subtotalHeader = 'SUBTOTAL';
        const subtotalHeaderW = helveticaBold.widthOfTextAtSize(subtotalHeader, 8);
        page.drawText(subtotalHeader, { x: col4 - subtotalHeaderW, y: y + 2, size: 8, font: helveticaBold, color: darkBlue });

        y -= 22;

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
    }

    // ========== TOTAL REEMBOLSADO ==========
    y -= 15;
    page.drawLine({
        start: { x: width - margin - 200, y }, end: { x: width - margin, y },
        thickness: 0.5, color: darkBlue,
    });
    y -= 18;

    page.drawText('TOTAL REEMBOLSADO:', {
        x: width - margin - 200, y,
        size: 14, font: helveticaBold, color: green,
    });

    const totalText = `${data.refundAmount.toFixed(2)} EUR`;
    const totalW = helveticaBold.widthOfTextAtSize(totalText, 14);
    page.drawText(totalText, {
        x: width - margin - totalW, y,
        size: 14, font: helveticaBold, color: green,
    });

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

    const footer2 = 'Este documento sirve como comprobante de tu reembolso. Gracias por tu confianza.';
    const footer2W = helvetica.widthOfTextAtSize(footer2, 7);
    page.drawText(footer2, {
        x: (width - footer2W) / 2, y: footerY - 22,
        size: 7, font: helvetica, color: grayText,
    });

    // Generar bytes
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
}
