
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config();
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("URL:", SUPABASE_URL);
if (SUPABASE_SERVICE_KEY) {
    console.log("Service Key (short):", SUPABASE_SERVICE_KEY.substring(0, 10));
    try {
        console.log("Key Role:", JSON.parse(atob(SUPABASE_SERVICE_KEY.split('.')[1])).role);
    } catch (e) {
        console.log("Key Role: ERROR parsing");
    }
} else {
    console.log("Service Key: MISSING");
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Missing environment variables!");
    process.exit(1);
}

// Test with same config as app
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    }
});

async function checkOrders() {
    console.log("Fetching orders with Service Role...");
    const { data, error } = await supabase
        .from('ordenes')
        .select('*')
        .limit(5);

    if (error) {
        console.error("Error fetching orders:", error);
    } else {
        console.log(`Found ${data.length} orders.`);
        if (data.length > 0) {
            console.log("Sample order:", data[0]);
        } else {
            console.log("Table is empty (or RLS issue even for service role?)");
        }
    }
}

checkOrders();
