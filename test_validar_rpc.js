// test_validar_rpc_invalid.js
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("--- PROBANDO RPC validar_cupon (CASOS DE ERROR) ---");

    const testUserId = 'f8924042-9999-4444-8888-000000000000';

    // Caso 1: Cupón inexistente
    console.log("\n1. Probando con cupón inexistente 'NOEXISTE'...");
    const { data: d1, error: e1 } = await supabase.rpc('validar_cupon', {
        p_codigo: 'NOEXISTE',
        p_usuario_id: testUserId,
        p_subtotal: 50.00
    });

    if (e1) console.error("Error d1:", e1.message);
    else console.log("Resultado d1:", JSON.stringify(d1, null, 2));

    // Caso 2: Compra mínima no alcanzada (si el cupón existe)
    // Nota: BIENVENIDO10 suele tener 50 de mínimo. Probamos con 1.
    console.log("\n2. Probando con subtotal insuficiente para 'BIENVENIDO10'...");
    const { data: d2, error: e2 } = await supabase.rpc('validar_cupon', {
        p_codigo: 'BIENVENIDO10',
        p_usuario_id: testUserId,
        p_subtotal: 1.00
    });

    if (e2) console.error("Error d2:", e2.message);
    else console.log("Resultado d2:", JSON.stringify(d2, null, 2));
}

test();
