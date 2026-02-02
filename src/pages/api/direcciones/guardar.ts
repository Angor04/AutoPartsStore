
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

        const body = await request.json();
        const {
            id,
            nombre_completo,
            telefono,
            calle,
            direccion, // Fallback support
            ciudad,
            provincia,
            codigo_postal,
            pais,
            es_principal
        } = body;

        const calleFinal = calle || direccion;

        // Validaciones básicas (quitamos nombre_completo de aquí si vamos a recuperarlo)
        if (!calleFinal || !ciudad || !codigo_postal) {
            return new Response(
                JSON.stringify({ error: 'Dirección, ciudad y código postal son obligatorios' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const supabaseAdmin = getSupabaseAdmin();

        // Si no viene nombre, obtener del perfil
        let nombreFinal = nombre_completo;
        if (!nombreFinal) {
            const { data: perfilData } = await supabaseAdmin
                .from('perfiles_usuario')
                .select('nombre, apellidos')
                .eq('id', userId)
                .single();

            if (perfilData) {
                const nombre = perfilData.nombre || '';
                const apellidos = perfilData.apellidos || '';
                nombreFinal = `${nombre} ${apellidos}`.trim();
            }

            if (!nombreFinal) {
                // Fallback extremo si no tiene perfil
                nombreFinal = 'Usuario';
            }
        }

        // Si se marca como principal, primero desmarcar cualquier otra principal
        if (es_principal) {
            await supabaseAdmin
                .from('direcciones_envio')
                .update({ es_principal: false })
                .eq('usuario_id', userId);
        }

        const direccionData = {
            usuario_id: userId,
            nombre_completo: nombreFinal,
            telefono: telefono || null,
            calle: calleFinal,
            ciudad,
            provincia: provincia || '',
            codigo_postal,
            pais: pais || 'España',
            es_principal: !!es_principal,
            actualizado_en: new Date().toISOString()
        };

        let result;

        if (id) {
            // Actualizar existente
            // Primero verificar que pertenezca al usuario
            const { data: existing } = await supabaseAdmin
                .from('direcciones_envio')
                .select('id')
                .eq('id', id)
                .eq('usuario_id', userId)
                .single();

            if (!existing) {
                return new Response(
                    JSON.stringify({ error: 'Dirección no encontrada o no autorizada' }),
                    { status: 404, headers: { 'Content-Type': 'application/json' } }
                );
            }

            result = await supabaseAdmin
                .from('direcciones_envio')
                .update(direccionData)
                .eq('id', id)
                .select()
                .single();
        } else {
            // Crear nueva
            // Verificar si es la primera, si es así, forzar principal
            const { count } = await supabaseAdmin
                .from('direcciones_envio')
                .select('*', { count: 'exact', head: true })
                .eq('usuario_id', userId);

            if (count === 0) {
                direccionData.es_principal = true;
            }

            result = await supabaseAdmin
                .from('direcciones_envio')
                .insert(direccionData)
                .select()
                .single();
        }

        if (result.error) {
            console.error('Error guardando dirección:', result.error);
            return new Response(
                JSON.stringify({ error: 'Error al guardar dirección: ' + result.error.message + ' (' + result.error.code + ')' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({ success: true, direccion: result.data }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error en guardar dirección:', error);
        return new Response(
            JSON.stringify({ error: 'Error interno del servidor' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
