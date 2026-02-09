
import * as dotenv from 'dotenv';
import path from 'path';

// Mimic Astro's environment loading
dotenv.config();
dotenv.config({ path: '.env.local' });

// We need to bypass the alias '@/' which tsx might not understand without config
// So we'll duplicate the getSupabaseAdmin logic here for a clean test of the KEYS
const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("URL:", SUPABASE_URL);
console.log("SERVICE_KEY length:", SUPABASE_SERVICE_KEY ? SUPABASE_SERVICE_KEY.length : 0);

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    SUPABASE_URL!,
    SUPABASE_SERVICE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

async function check() {
    console.log("Attempting to fetch orders with Service Role...");
    const { data, error } = await supabaseAdmin
        .from('ordenes')
        .select('*')
        .limit(5);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log(`Success! Fetched ${data.length} orders.`);
        if (data.length > 0) console.log("Sample:", data[0].id);
    }
}

check();
