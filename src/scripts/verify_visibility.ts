
import * as dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno ANTES de importar supabase
dotenv.config();
dotenv.config({ path: '.env.local' });

console.log("Environment loaded.");
console.log("URL:", process.env.PUBLIC_SUPABASE_URL ? "Defined" : "Missing");

async function verify() {
    console.log("Starting verification...");

    try {
        // Dynamic import to ensure env vars are loaded first
        const { getProducts, getSupabaseAdmin } = await import('../lib/supabase');

        // Check if env vars worked for the module
        try {
            getSupabaseAdmin();
        } catch (e) {
            console.error("Supabase init failed:", e);
            return;
        }

        const admin = getSupabaseAdmin();
        // 1. Get inactive products from DB directly
        const { data: inactiveProducts, error } = await admin.from('productos').select('id, nombre, activo').eq('activo', false);

        if (error) {
            console.error("Error fetching inactive products:", error);
            return;
        }

        console.log(`Found ${inactiveProducts?.length ?? 0} inactive products in DB (via Admin Client).`);
        if (inactiveProducts && inactiveProducts.length > 0) {
            inactiveProducts.forEach((p: any) => console.log(`- [${p.id}] ${p.nombre} (activo: ${p.activo})`));

            // 2. Call public getProducts
            console.log("Calling public getProducts()...");
            const publicProducts = await getProducts(false);
            console.log(`Public getProducts returned ${publicProducts.length} products.`);

            // Check for leaks
            const leaked = publicProducts.filter((p: any) => inactiveProducts.some((i: any) => i.id === p.id));

            if (leaked.length > 0) {
                console.error("CRITICAL: Found inactive products in public list!");
                leaked.forEach(p => console.log(`LEAKED: [${p.id}] ${p.nombre}`));
            } else {
                console.log("SUCCESS: No inactive products found in public list.");

                const logicLeaked = publicProducts.filter(p => p.activo === false);
                if (logicLeaked.length > 0) {
                    console.error("CRITICAL: Public list contains products with activo=false!");
                    logicLeaked.forEach(p => console.log(`LOGIC LEAK: [${p.id}] ${p.nombre}`));
                } else {
                    console.log("SUCCESS: All public products have activo=true.");
                }
            }

        } else {
            console.log("No inactive products found in DB. Please deactivate a product in Admin panel first to test.");
        }

    } catch (e) {
        console.error("Script error:", e);
    }
}

verify();
