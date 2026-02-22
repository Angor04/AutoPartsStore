// inspect_schema.js
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log("--- INSPECCIONANDO TABLAS ---");

    // Lista de posibles nombres de tablas
    const tables = ['cupones_uso', 'cupones_usados', 'uso_cupones', 'cupones_registros'];

    for (const table of tables) {
        console.log(`\nProbando tabla: ${table}...`);
        const { data, error } = await supabase.from(table).select('*').limit(1);

        if (error) {
            if (error.code === '42P01') {
                console.log(`La tabla '${table}' no existe.`);
            } else {
                console.error(`Error al acceder a '${table}':`, error.message);
            }
        } else {
            console.log(`✅ ¡Tabla '${table}' encontrada!`);
            if (data.length > 0) {
                console.log("Columnas detectadas:", Object.keys(data[0]).join(", "));
                console.log("Ejemplo de datos:", data[0]);
            } else {
                console.log("La tabla está vacía, pero existe.");
                // Intentar obtener nombres de columnas via RPC si es posible o asumiendo el error
            }
        }
    }

    console.log("\n--- VERIFICANDO RPCs ---");
    const rpcs = ['validar_cupon', 'aplicar_cupon'];
    for (const rpc of rpcs) {
        const { error } = await supabase.rpc(rpc, {});
        if (error && error.message.includes("could not find the function")) {
            console.log(`❌ RPC '${rpc}' no encontrada.`);
        } else {
            console.log(`✅ RPC '${rpc}' existe (aunque haya dado error por parámetros).`);
        }
    }
}

inspect();
