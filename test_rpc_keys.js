// test_rpc_keys.js
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("--- INSPECCIONANDO LLAVES DEL RPC ---");

    const { data, error } = await supabase.rpc('validar_cupon', {
        p_codigo: 'BIENVENIDO10',
        p_usuario_id: null,
        p_subtotal: 100.00
    });

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Resultado crudo (fila 0):", data[0]);
        console.log("Llaves detectadas:", Object.keys(data[0]));
    }
}

test();
