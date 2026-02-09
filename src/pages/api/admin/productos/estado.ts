
import { getSupabaseAdmin } from '@/lib/supabase';
import type { APIRoute } from 'astro';

export const prerender = false;

export const PUT: APIRoute = async (context) => {
    try {
        const body = await context.request.json();
        const { id, activo } = body;

        if (!id) {
            return new Response(
                JSON.stringify({ error: 'ID de producto es requerido' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (typeof activo !== 'boolean') {
            return new Response(
                JSON.stringify({ error: 'El estado activo debe ser un booleano' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const supabaseAdmin = getSupabaseAdmin();

        const { data, error } = await (supabaseAdmin as any)
            .from('productos')
            .update({ activo })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating producto status:', error);
            return new Response(
                JSON.stringify({ error: error.message }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({ success: true, data }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('Error updating producto status:', error);
        return new Response(
            JSON.stringify({ error: 'Error al actualizar estado del producto' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
