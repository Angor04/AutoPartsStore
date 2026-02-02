
import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '@/lib/supabase';

export const prerender = false;

// POST: Crear nuevo cupón
export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const {
            codigo,
            tipo_descuento,
            valor_descuento,
            cantidad_minima_compra,
            limite_usos,
            fecha_expiracion,
            uso_unico_por_usuario // Mapped from frontend 'uso_unico'
        } = body;

        // Validaciones básicas
        if (!codigo || !tipo_descuento || !valor_descuento || !fecha_expiracion) {
            return new Response(JSON.stringify({ error: 'Faltan campos requeridos' }), { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        const { data, error } = await supabase
            .from('cupones')
            .insert({
                codigo: codigo.toUpperCase(),
                tipo_descuento,
                valor_descuento,
                cantidad_minima_compra: cantidad_minima_compra || 0,
                limite_usos: limite_usos || null,
                fecha_expiracion,
                uso_unico_por_usuario: !!uso_unico_por_usuario,
                activo: true,
                fecha_inicio: new Date().toISOString() // Activo desde ya
            })
            .select()
            .single();

        if (error) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        return new Response(JSON.stringify({ success: true, data }), { status: 201 });

    } catch (error) {
        return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
    }
};
