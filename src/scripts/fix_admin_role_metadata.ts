
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

async function checkAndFixMetadata() {
    const userId = '209c04ff-d099-484b-b8ed-eb617d68a502';
    console.log(`Checking auth metadata for ${userId}...`);

    const { data: { user }, error } = await supabase.auth.admin.getUserById(userId);

    if (error || !user) {
        console.error("User not found:", error);
        return;
    }

    console.log("Current Metadata:", user.user_metadata);

    if (user.user_metadata?.rol !== 'admin') {
        console.log("Rol is NOT admin. Updating...");
        const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(
            userId,
            { user_metadata: { ...user.user_metadata, rol: 'admin' } }
        );

        if (updateError) {
            console.error("Update failed:", updateError);
        } else {
            console.log("SUCCESS: Metadata updated to admin.");
        }
    } else {
        console.log("Metadata is correct.");
    }
}

checkAndFixMetadata();
