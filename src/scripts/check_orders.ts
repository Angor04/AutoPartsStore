import fs from 'fs';
import path from 'path';

// Manual .env loading
try {
    const envPath = path.resolve(process.cwd(), '.env');
    console.log('Loading .env from:', envPath);
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf-8');
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim();
            }
        });
    } else {
        console.log('.env file not found');
    }
} catch (e) {
    console.log('Error loading .env, trying to proceed', e);
}

async function checkOrders() {
    const { getSupabaseAdmin } = await import('../lib/supabase');
    const supabase = getSupabaseAdmin();

    console.log('Fetching recent orders...');
    const { data: orders, error } = await supabase
        .from('ordenes')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching orders:', error);
        return;
    }

    console.log(`Found ${orders.length} orders.`);

    if (orders.length > 0) {
        console.log('Sample Order Date Fields:');
        console.log('creado_en:', orders[0].creado_en);
        console.log('fecha_creacion:', orders[0].fecha_creacion);
        console.log('created_at (if alias):', orders[0].created_at);
    }

    return; // Stop here for now
}

checkOrders();
