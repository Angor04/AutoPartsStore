
import type { APIRoute } from 'astro';
import { supabaseClient } from '@/lib/supabase';

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');

    if (!query || query.length < 1) {
        return new Response(JSON.stringify([]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const { data, error } = await supabaseClient
        .from('productos')
        .select('id, nombre, precio, urls_imagenes')
        .eq('activo', true)
        .or(`nombre.ilike.${query}%,nombre.ilike.% ${query}%`)
        .limit(8);

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        }
    });
}
