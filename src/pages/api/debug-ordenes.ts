
import { getSupabaseAdmin } from '@/lib/supabase';

export const GET = async () => {
    const supabase = getSupabaseAdmin();
    const { data: ordenes, error } = await supabase
        .from('ordenes')
        .select('*')
        .limit(1);

    if (error) return new Response(JSON.stringify({ error }), { status: 500 });

    const columns = ordenes && ordenes.length > 0 ? Object.keys(ordenes[0]) : [];
    return new Response(columns.join(', '), {
        headers: { 'Content-Type': 'text/plain' }
    });
};
