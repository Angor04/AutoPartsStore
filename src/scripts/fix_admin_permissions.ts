
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

async function fixAdmin() {
    const userId = '209c04ff-d099-484b-b8ed-eb617d68a502'; // ID from your logs
    const email = 'agonzalezcruces2004@gmail.com';

    console.log(`Checking admin_users for ${userId}...`);

    // 1. Check if table exists and user exists
    const { data: existing, error: fetchError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', userId);

    if (fetchError) {
        console.error("Error fetching admin_users:", fetchError);
        // If table doesn't exist, we might need to create it (though usually we can't via JS client unless using RPC to exec SQL)
    } else {
        console.log("Existing rows:", existing);
    }

    if (!existing || existing.length === 0) {
        console.log("User not found in admin_users. Inserting...");
        const { error: insertError } = await supabase
            .from('admin_users')
            .insert([
                {
                    id: userId,
                    email: email,
                    nombre: 'Admin Principal',
                    activo: true
                }
            ]);

        if (insertError) {
            console.error("Insert failed:", insertError);
        } else {
            console.log("SUCCESS: User added to admin_users table.");
        }
    } else {
        console.log("User already exists. Checking 'activo' status...");
        const user = existing[0];
        if (!user.activo) {
            console.log("User is inactive. Activating...");
            const { error: updateError } = await supabase
                .from('admin_users')
                .update({ activo: true })
                .eq('id', userId);
            if (updateError) console.error("Update failed:", updateError);
            else console.log("SUCCESS: User activated.");
        } else {
            console.log("User is already active.");
        }
    }
}

fixAdmin();
