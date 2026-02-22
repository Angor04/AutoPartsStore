// check_cupon.js
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("--- VERIFICANDO ESTRUCTURA DE TABLA 'ordenes' ---");
    try {
        const { data: row } = await supabase.from('ordenes').select('*').limit(1).single();
        if (row) {
            console.log("ID de la orden (tipo detectado):", typeof row.id, row.id);
            console.log("Columnas presentes en 'ordenes':", Object.keys(row).join(", "));
        } else {
            console.log("No hay órdenes para inspeccionar.");
        }
    } catch (e) {
        console.error("Error inspeccionando ordenes:", e.message);
    }

    console.log("\n--- VERIFICANDO CUPÓN BIENVENIDO10 ---");
    const { data: cupon, error: errorCupon } = await supabase
        .from('cupones')
        .select('*')
        .eq('codigo', 'BIENVENIDO10')
        .single();

    if (errorCupon) {
        console.error("Error al buscar cupón:", errorCupon.message);
    } else {
        console.log("Configuración actual:");
        console.table({
            ID: cupon.id,
            ID_TYPE: typeof cupon.id,
            Código: cupon.codigo,
            Activo: cupon.activo,
            "Uso Único Usuario": cupon.uso_unico_por_usuario,
            "Usos Totales": cupon.usos_totales,
            "Mínimo Compra": cupon.cantidad_minima_compra
        });
    }

    console.log("\n--- VERIFICANDO REGISTROS DE USO (cupones_uso) ---");
    const { data: usos, error: errorUsos } = await supabase
        .from('cupones_uso')
        .select(`
      id,
      usuario_id,
      orden_id,
      descuento_aplicado,
      usado_en
    `)
        .limit(5);

    if (errorUsos) {
        console.error("Error al buscar usos:", errorUsos.message);
    } else if (usos && usos.length > 0) {
        console.log(`Se encontraron ${usos.length} registros:`);
        console.table(usos);
    } else {
        console.log("No hay registros en cupones_uso.");
    }
}

check();
