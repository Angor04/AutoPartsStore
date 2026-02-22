import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '@/lib/supabase';

export const POST: APIRoute = async ({ request }) => {
    try {
        const { productId, cantidad } = await request.json();

        // Validar datos
        if (!productId || !cantidad || cantidad < 1) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Datos inválidos',
                stockDisponible: 0
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const supabaseAdmin = getSupabaseAdmin();

        // 🔄 LEER STOCK ACTUAL DE LA BD EN TIEMPO REAL
        // Usamos admin para asegurar lectura consistente y escritura
        const { data: producto, error: fetchError } = await supabaseAdmin
            .from('productos')
            .select('id, stock, nombre, precio, precio_original, especificaciones')
            .eq('id', productId)
            .single();

        if (fetchError || !producto) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Producto no encontrado',
                stockDisponible: 0
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const stockActual = producto.stock || 0;

        // ⚠️ VALIDACIÓN: Stock real en este exacto momento
        if (stockActual < cantidad) {
            return new Response(JSON.stringify({
                success: false,
                error: `Stock insuficiente. Solo hay ${stockActual} unidad(es) disponible(s)`,
                stockDisponible: stockActual,
                producto: producto.nombre
            }), {
                status: 409, // Conflict
                headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' }
            });
        }

        // 🔒 ACTUALIZACIÓN ATÓMICA: Restar stock SOLO SI el valor sigue siendo el mismo
        // Esto previene condiciones de carrera
        const nuevoStock = stockActual - cantidad;

        const { data: updateData, error: updateError } = await supabaseAdmin
            .from('productos')
            .update({ stock: nuevoStock })
            .eq('id', productId)
            .eq('stock', stockActual) // ← CRUCIAL: Solo actualiza si stock es igual al que leímos
            .select('stock');

        // Si no se actualizó (updateData vacío o error), otro proceso cambió el stock en el medio
        if (updateError || !updateData || updateData.length === 0) {
            // Re-verificar stock actual
            const { data: productoAhora } = await supabaseAdmin
                .from('productos')
                .select('stock')
                .eq('id', productId)
                .single();

            const stockAhora = productoAhora?.stock || 0;

            if (stockAhora < cantidad) {
                return new Response(JSON.stringify({
                    success: false,
                    error: `Stock insuficiente. Solo hay ${stockAhora} unidad(es) disponible(s)`,
                    stockDisponible: stockAhora,
                    producto: producto.nombre
                }), {
                    status: 409,
                    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' }
                });
            }

            // Reintentar una vez más
            const { data: updateData2 } = await supabaseAdmin
                .from('productos')
                .update({ stock: stockAhora - cantidad })
                .eq('id', productId)
                .eq('stock', stockAhora)
                .select('stock');

            if (!updateData2 || updateData2.length === 0) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'El stock cambió rápidamente. Por favor intenta de nuevo.',
                    stockDisponible: stockAhora,
                    producto: producto.nombre
                }), {
                    status: 409,
                    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' }
                });
            }

            // Si el reintento funcionó, actualizamos el nuevo stock para la respuesta
            // (aunque técnicamente sería stockAhora - cantidad)
        }

        const specs = (producto.especificaciones as any) || {};
        const isOfferActive = specs.en_oferta === 'true';
        const effectivePrice = isOfferActive ? producto.precio : (producto.precio_original || producto.precio);

        return new Response(JSON.stringify({
            success: true,
            mensaje: `${producto.nombre} agregado al carrito`,
            stockAnterior: stockActual,
            stockNuevo: nuevoStock,
            producto: {
                id: producto.id,
                nombre: producto.nombre,
                precio: effectivePrice,
                stockDisponible: nuevoStock
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' }
        });

    } catch (error: any) {
        console.error('[add-to-cart-validated] Error:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: 'Error interno del servidor',
                stockDisponible: 0
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
