
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://aebzgxrpvbwmcktnvkea.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlYnpneHJwdmJ3bWNrdG52a2VhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzg1MzAxNywiZXhwIjoyMDgzNDI5MDE3fQ.3cwsEwM7vEFflXU4woV974nKgAEwbM3TxS-IZIhQs0s';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function main() {
    const { data, error } = await supabaseAdmin
        .from('ordenes')
        .select('id, estado, email')
        .order('creado_en', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        console.error('Error fetching order:', error);
    } else {
        console.log('Latest Order ID:', data.id);
        console.log('Current Status:', data.estado);
        console.log('Email:', data.email);
    }
}

main();
