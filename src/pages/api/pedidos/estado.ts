
import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '@/lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const data = await request.json();
        const { numero_orden, email } = data;

        if (!numero_orden || !email) {
            return new Response(
                JSON.stringify({ error: 'Número de orden y email son requeridos' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const supabaseAdmin = getSupabaseAdmin();

        // Normalizar email
        const normalizedEmail = email.toLowerCase().trim();

        // Buscar la orden
        const { data: orden, error } = await supabaseAdmin
            .from('ordenes')
            .select(`
        *,
        ordenes_items (
          *,
          productos (
            nombre,
            urls_imagenes
          )
        )
      `)
            .eq('numero_orden', numero_orden)
            .ilike('email', normalizedEmail) // Usar ilike para case-insensitive
            .single();

        if (error || !orden) {
            return new Response(
                JSON.stringify({ error: 'No se encontró un pedido con esos datos. Verifica el número y el email.' }),
                { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({ success: true, orden }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (e) {
        console.error('Error fetching order status:', e);
        return new Response(
            JSON.stringify({ error: 'Error interno del servidor' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
