
import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '@/lib/supabase';

export const prerender = false;

// PUT: Actualizar cupón
export const PUT: APIRoute = async ({ request, params }) => {
    try {
        const { id } = params;
        if (!id) return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400 });

        const body = await request.json();

        // Filtramos solo los campos que queremos permitir actualizar explícitamente o todos
        const updateData = { ...body };
        delete updateData.id; // No actualizar ID

        if (updateData.codigo) updateData.codigo = updateData.codigo.toUpperCase();

        const supabase = getSupabaseAdmin();

        const { data, error } = await supabase
            .from('cupones')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        return new Response(JSON.stringify({ success: true, data }), { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
    }
};

// DELETE: Eliminar cupón
export const DELETE: APIRoute = async ({ params }) => {
    try {
        const { id } = params;
        if (!id) return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400 });

        const supabase = getSupabaseAdmin();

        const { error } = await supabase
            .from('cupones')
            .delete()
            .eq('id', id);

        if (error) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
    }
};
