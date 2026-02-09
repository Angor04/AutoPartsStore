
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

async function checkOrderStructure() {
    console.log("Fetching one order to check structure...");

    const { data, error } = await supabase
        .from('ordenes')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error fetching order:", error);
        return;
    }

    if (data && data.length > 0) {
        data.forEach((o: any) => {
            console.log(`Order ${o.numero_orden}:`);
            console.log("  Root User ID:", o.usuario_id);
            console.log("  Root Name:", o.nombre);
            console.log("  Shipping Address:", JSON.stringify(o.direccion_envio, null, 2));
        });
    } else {
        console.log("No orders found to check.");
    }
}

checkOrderStructure();
