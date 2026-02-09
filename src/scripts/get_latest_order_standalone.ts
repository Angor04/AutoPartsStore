
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env vars manually without dotenv
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split(/\r?\n/).forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^['"]|['"]$/g, ''); // Remove quotes if present
            if (!process.env[key]) {
                process.env[key] = value;
            }
        }
    });
}

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || 'https://aebzgxrpvbwmcktnvkea.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function main() {
    const { data, error } = await supabaseAdmin
        .from('ordenes')
        .select('*')
        .order('creado_en', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        console.error('Error fetching order:', error);
    } else {
        console.log('Order Number:', data.numero_orden);
        console.log('Raw Actualizado En:', data.actualizado_en);
        console.log('Raw Creado En:', data.creado_en);

        // Test formatting
        const dateVal = new Date(data.actualizado_en || data.creado_en);
        console.log('Parsed Date:', dateVal.toString());
        console.log('Formatted Madrid:', dateVal.toLocaleString('es-ES', {
            timeZone: 'Europe/Madrid'
        }));
    }
}

main();
