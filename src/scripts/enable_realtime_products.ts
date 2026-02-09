
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("❌ Missing environment variables!");
    console.log("Current directory:", process.cwd());
    console.log("PUBLIC_SUPABASE_URL:", SUPABASE_URL);
    // Don't log full key for security
    console.log("SUPABASE_SERVICE_ROLE_KEY:", SUPABASE_SERVICE_KEY ? "Set (starts with " + SUPABASE_SERVICE_KEY.substring(0, 5) + ")" : "Not Set");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function enableRealtimeProducts() {
    console.log("Adding 'productos' table to supabase_realtime publication...");

    try {
        const { data, error } = await supabase.rpc('exec_sql', {
            sql_query: "alter publication supabase_realtime add table productos;"
        });

        if (error) {
            console.error("RPC exec_sql failed:", error.message);
            console.log("\n⚠️ IMPORTANT: You must run this SQL in Supabase Dashboard:");
            console.log("alter publication supabase_realtime add table productos;\n");
        } else {
            console.log("✅ Success! Realtime enabled for products.");
        }
    } catch (e) {
        console.error("Exception during RPC call:", e);
    }
}

enableRealtimeProducts();
