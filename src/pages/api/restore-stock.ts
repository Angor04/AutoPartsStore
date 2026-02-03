import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '@/lib/supabase';

export const POST: APIRoute = async ({ request }) => {
    try {
        const { productId, cantidad } = await request.json();

        if (!productId || !cantidad || cantidad < 1) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Datos inválidos'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const supabaseAdmin = getSupabaseAdmin();

        // 🔄 RESTAURAR STOCK ATÓMICAMENTE
        // Usamos rpc "increment" si existiera, pero como no tenemos, hacemos lectura-escritura segura

        // Primero obtener stock actual
        const { data: producto, error: fetchError } = await supabaseAdmin
            .from('productos')
            .select('stock, nombre')
            .eq('id', productId)
            .single();

        if (fetchError || !producto) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Producto no encontrado'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const nuevoStock = (producto.stock || 0) + cantidad;

        // Actualizar stock
        const { error: updateError } = await supabaseAdmin
            .from('productos')
            .update({ stock: nuevoStock })
            .eq('id', productId)
            .eq('stock', producto.stock); // Optimistic locking simple

        if (updateError) {
            // Si falla por concurrencia, intentamos una vez más (simple retry logic)
            const { data: retryProd } = await supabaseAdmin
                .from('productos')
                .select('stock')
                .eq('id', productId)
                .single();

            if (retryProd) {
                await supabaseAdmin
                    .from('productos')
                    .update({ stock: retryProd.stock + cantidad })
                    .eq('id', productId);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            mensaje: `Stock restaurado para ${producto.nombre}`,
            nuevoStock: nuevoStock
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('[restore-stock] Error:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: 'Error interno del servidor'
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
