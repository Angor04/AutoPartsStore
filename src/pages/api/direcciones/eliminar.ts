
import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '@/lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        const userId = cookies.get('user-id')?.value;

        if (!userId) {
            return new Response(
                JSON.stringify({ error: 'No autenticado' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const { id } = await request.json();

        if (!id) {
            return new Response(
                JSON.stringify({ error: 'ID de dirección requerido' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const supabaseAdmin = getSupabaseAdmin();

        // Eliminar solo si pertenece al usuario id
        const { error, count } = await supabaseAdmin
            .from('direcciones_envio')
            .delete({ count: 'exact' })
            .eq('id', id)
            .eq('usuario_id', userId);

        if (error) {
            return new Response(
                JSON.stringify({ error: 'Error al eliminar dirección' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (count === 0) {
            return new Response(
                JSON.stringify({ error: 'Dirección no encontrada' }),
                { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({ success: true }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error eliminando dirección:', error);
        return new Response(
            JSON.stringify({ error: 'Error interno del servidor' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
