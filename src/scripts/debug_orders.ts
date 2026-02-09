
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkOrders() {
    console.log("Checking orders table...");

    const { count, error } = await supabase
        .from('ordenes')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error("Error fetching orders:", error);
    } else {
        console.log(`Total orders in DB: ${count}`);
    }

    const { data: sample, error: sampleError } = await supabase
        .from('ordenes')
        .select('id, numero_orden, estado')
        .limit(5);

    if (sampleError) {
        console.error("Error fetching sample:", sampleError);
    } else {
        console.log("Sample orders:", sample);
    }
}

checkOrders();
