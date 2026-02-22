// inspect_cupones_table.js
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log("--- INSPECCIONANDO COLUMNAS DE LA TABLA 'cupones' ---");
    const { data, error } = await supabase.from('cupones').select('*').limit(1);

    if (error) {
        console.error("Error al acceder a 'cupones':", error.message);
    } else if (data.length > 0) {
        console.log("Columnas detectadas:", Object.keys(data[0]).join(", "));
        console.log("Ejemplo de datos (primera fila):");
        console.log(data[0]);
    } else {
        console.log("La tabla 'cupones' está vacía. Intentando obtener esquema a través de rpc si existe...");
    }
}

inspect();
