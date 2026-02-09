
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables manually
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};

envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const supabaseUrl = env.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = env.PUBLIC_SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetOffers() {
    console.log('Fetching products with active offers...');

    const { data: products, error } = await supabase
        .from('productos')
        .select('id, precio, precio_original')
        .not('precio_original', 'is', null);

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    if (!products || products.length === 0) {
        console.log('No active offers found.');
        return;
    }

    console.log(`Found ${products.length} products with active offers. Resetting...`);

    // Update one by one or bulk? 
    // Supabase doesn't support bulk update with different values easily without RPC.
    // But wait! We want to set `precio = precio_original` and `precio_original = null`.
    // This depends on the row value.
    // We can do it loop.

    let count = 0;
    for (const product of products) {
        // Safety check: preserve value
        const original = product.precio_original;
        if (original === null) continue; // Should not happen due to query

        const { error: updateError } = await supabase
            .from('productos')
            .update({
                precio: original,
                precio_original: null
            })
            .eq('id', product.id);

        if (updateError) {
            console.error(`Failed to reset product ${product.id}:`, updateError);
        } else {
            count++;
        }
    }

    console.log(`Successfully reset ${count} products.`);
}

resetOffers();
