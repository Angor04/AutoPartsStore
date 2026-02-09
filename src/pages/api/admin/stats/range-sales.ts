
import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '@/lib/supabase';

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const startDateStr = url.searchParams.get('startDate');
    const endDateStr = url.searchParams.get('endDate');

    if (!startDateStr || !endDateStr) {
        return new Response(JSON.stringify({ error: 'Start and end dates are required' }), {
            status: 400,
        });
    }

    const supabase = getSupabaseAdmin();

    // Asegurar rango completo
    const startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999);

    const { data: ordenes, error } = await supabase
        .from('ordenes')
        .select('creado_en, total')
        .gte('creado_en', startDate.toISOString())
        .lte('creado_en', endDate.toISOString())
        .neq('estado', 'cancelada');

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
        });
    }

    // Agrupar por día
    const salesByDay: Record<string, number> = {};

    // Inicializar días en 0
    const current = new Date(startDate);
    while (current <= endDate) {
        const dayStr = current.toISOString().split('T')[0];
        salesByDay[dayStr] = 0;
        current.setDate(current.getDate() + 1);
    }

    ordenes?.forEach((orden: any) => {
        const dayStr = new Date(orden.creado_en).toISOString().split('T')[0];
        if (salesByDay[dayStr] !== undefined) {
            salesByDay[dayStr] = (salesByDay[dayStr] || 0) + Number(orden.total);
        } else {
            // Por si acaso hay edge cases de timezone, sumamos al existente o creamos
            salesByDay[dayStr] = (salesByDay[dayStr] || 0) + Number(orden.total);
        }
    });

    // Convertir a arrays para Chart.js
    const labels = Object.keys(salesByDay).sort();
    const data = labels.map(label => salesByDay[label]);

    return new Response(JSON.stringify({
        labels,
        data
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
};
