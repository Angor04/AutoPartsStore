import type { APIRoute } from 'astro';
import { supabaseClient } from '@/lib/supabase';

export const GET: APIRoute = async ({ url }) => {
    try {
        const productIdsStr = url.searchParams.get('ids');
        const productIds = productIdsStr ? productIdsStr.split(',') : [];

        if (productIds.length === 0) {
            return new Response(
                JSON.stringify({ error: 'Se requieren IDs de productos' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Parsear IDs a números
        const ids = productIds.map(id => parseInt(id)).filter(id => !isNaN(id));

        if (ids.length === 0) {
            return new Response(
                JSON.stringify({ error: 'IDs inválidos' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Obtener stock actual de todos los productos
        const { data, error } = await supabaseClient
            .from('productos')
            .select('id, stock, nombre')
            .in('id', ids);

        const products = data as unknown as { id: number, stock: number, nombre: string }[];

        if (error) {
            console.error('Error fetching real stock:', error);
            return new Response(
                JSON.stringify({ error: 'Error al obtener stock' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const stockMap: Record<string, any> = {};
        products?.forEach(p => {
            stockMap[p.id] = {
                id: p.id,
                nombre: p.nombre,
                stock: p.stock || 0
            };
        });

        return new Response(
            JSON.stringify({ success: true, stock: stockMap }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                }
            }
        );
    } catch (err: any) {
        console.error('Exception in get-real-stock:', err);
        return new Response(
            JSON.stringify({ error: 'Error interno del servidor' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
