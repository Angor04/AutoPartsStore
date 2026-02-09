
import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '@/lib/supabase';

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const dateStr = url.searchParams.get('date');

    if (!dateStr) {
        return new Response(JSON.stringify({ error: 'Date parameter is required' }), {
            status: 400,
        });
    }

    const supabase = getSupabaseAdmin();
    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    // Consultar órdenes del día
    const { data: ordenes, error } = await supabase
        .from('ordenes')
        .select('creado_en, total')
        .gte('creado_en', startOfDay.toISOString())
        .lte('creado_en', endOfDay.toISOString())
        .neq('estado', 'cancelada'); // Excluir canceladas

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
        });
    }

    // Agrupar por hora
    const hourlyData = new Array(24).fill(0);

    ordenes?.forEach((orden: any) => {
        const date = new Date(orden.creado_en);
        // Ajustar a hora local si es necesario, pero aquí asumimos UTC o consistencia
        // Supabase devuelve UTC. Si el usuario está en GMT+1, deberíamos ajustar.
        // Para simplificar, usaremos la hora extraida directamente del string ISO
        // o convertiremos a objeto fecha.
        // Ojo: Si el servidor corre en UTC, getHours() será UTC.
        // Lo ideal seria manejar timezone, pero asumiremos UTC por ahora.
        const hour = date.getHours();
        if (hour >= 0 && hour < 24) {
            hourlyData[hour] += orden.total;
        }
    });

    return new Response(JSON.stringify({
        date: dateStr,
        sales: hourlyData
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
};
