// src/pages/api/carrito/validar.ts
// Permite a los invitados validar precios y stock de sus items
import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '@/lib/supabase';

export const POST: APIRoute = async ({ request }) => {
    try {
        const { items } = await request.json();

        if (!items || !Array.isArray(items) || items.length === 0) {
            return new Response(JSON.stringify({ items: [] }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const supabase = getSupabaseAdmin();
        const productIds = items.map((i: any) => i.product_id);

        const { data: currentProducts, error } = await supabase
            .from('productos')
            .select('id, precio, precio_original, stock, nombre, especificaciones')
            .in('id', productIds);

        if (error || !currentProducts) {
            return new Response(JSON.stringify({ items }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const productMap = new Map(currentProducts.map((p: any) => [String(p.id), p]));
        const updatedItems = items.map((item: any) => {
            const actual: any = productMap.get(String(item.product_id));
            if (actual) {
                const specs = (actual.especificaciones as any) || {};
                const isOfferActive = specs.en_oferta === 'true';

                const effectivePrice = isOfferActive
                    ? actual.precio
                    : (actual.precio_original || actual.precio);

                return {
                    ...item,
                    precio: effectivePrice,
                    nombre: actual.nombre,
                    stock: actual.stock
                };
            }
            return item;
        });

        return new Response(JSON.stringify({ items: updatedItems }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error en API validar carrito:', error);
        return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
    }
};
