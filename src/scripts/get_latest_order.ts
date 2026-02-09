
import { getSupabaseAdmin } from '../lib/supabase';

async function main() {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('ordenes')
        .select('id, estado, email')
        .order('creado_en', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        console.error('Error fetching order:', error);
    } else {
        console.log('Latest Order:', data);
    }
}

main();
