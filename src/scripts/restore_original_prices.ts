
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

const supabaseUrl = env.PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY; // Need admin to update

const supabase = createClient(supabaseUrl!, supabaseKey!);

// Precios originales del SQL (en céntimos -> dividir por 100 para euros)
// Formato: { nombre: { precio: X, precio_original: Y } }
const preciosSQL: Record<string, { precio: number; precio_original: number }> = {
    'Neumático Michelin Pilot Sport 205/55R16': { precio: 89.99, precio_original: 119.99 },
    'Neumático Continental EcoContact 215/60R16': { precio: 65.50, precio_original: 89.99 },
    'Llanta de Aluminio OZ Racing 18 pulgadas': { precio: 150.00, precio_original: 200.00 },
    'Neumático Pirelli Winter Sottozero 195/65R15': { precio: 72.99, precio_original: 99.99 },
    'Pastillas de Freno Brembo Cerámicas 370mm': { precio: 45.50, precio_original: 65.00 },
    'Discos de Freno Zimmermann 330mm': { precio: 89.99, precio_original: 125.00 },
    'Líquido de Frenos DOT 4 Motul': { precio: 12.99, precio_original: 19.99 },
    'Cilindro Maestro de Freno TRW': { precio: 120.00, precio_original: 180.00 },
    'Filtro de Aire Premium Bosch': { precio: 18.50, precio_original: 28.00 },
    'Bujías NGK Iridium': { precio: 8.99, precio_original: 14.99 },
    'Cable de Batería Profesional 4AWG': { precio: 22.50, precio_original: 35.00 },
    'Correa de Distribución Gates': { precio: 65.00, precio_original: 95.00 },
    'Filtro de Habitáculo Bosch Carbón Activado': { precio: 24.99, precio_original: 39.99 },
    'Filtro de Aceite Mann Filter': { precio: 9.99, precio_original: 16.99 },
    'Filtro de Combustible Mahle': { precio: 15.50, precio_original: 24.99 },
    'Juego de Filtros Completo (Aire, Aceite, Habitáculo)': { precio: 45.00, precio_original: 65.00 },
    'Amortiguador Delantero KYB Gas-Adjust': { precio: 78.99, precio_original: 110.00 },
    'Amortiguador Trasero Bilstein B4': { precio: 72.50, precio_original: 100.00 },
    'Kit Muelles de Suspensión Lowering': { precio: 150.00, precio_original: 220.00 },
    'Barra Estabilizadora Delantera': { precio: 45.00, precio_original: 70.00 },
    'Disco de Embrague Valeo Original': { precio: 89.50, precio_original: 130.00 },
    'Plato de Presión Luk Premium': { precio: 95.00, precio_original: 140.00 },
    'Cilindro Esclavo de Embrague Sachs': { precio: 55.00, precio_original: 85.00 },
    'Cable de Embrague Profesional': { precio: 28.50, precio_original: 45.00 },
    'Aceite de Motor Castrol Edge 5W-40': { precio: 32.99, precio_original: 49.99 },
    'Líquido Refrigerante BASF Pentosin': { precio: 15.99, precio_original: 24.99 },
    'Aceite de Dirección Asistida Mobil': { precio: 18.50, precio_original: 28.00 },
    'Fluido de Transmisión Automática Castrol': { precio: 22.50, precio_original: 35.00 },
    'Correa de Distribución Gates de Calidad Premium': { precio: 68.00, precio_original: 98.00 },
    'Rodillo Tensor de Correa SKF': { precio: 35.50, precio_original: 55.00 },
    'Cadena de Distribución Dayco': { precio: 120.00, precio_original: 180.00 },
    'Correa de Accesorios Serpentina': { precio: 28.00, precio_original: 45.00 },
    'Espejo Retrovisor Izquierdo Elemental': { precio: 55.00, precio_original: 85.00 },
    'Panel de Faro Frontal Compatible': { precio: 42.50, precio_original: 70.00 },
    'Sellador de Carrocería 500ml': { precio: 14.99, precio_original: 24.99 },
    'Protector de Parachoques Goma': { precio: 19.50, precio_original: 32.00 },
    'Batería de Coche 12V 80Ah Bosch S5': { precio: 145.00, precio_original: 199.99 },
    'Alternador 120A Bosch': { precio: 189.99, precio_original: 280.00 },
    'Motor de Arranque Profesional': { precio: 125.00, precio_original: 185.00 },
    'Conector de Batería Cobre Puro': { precio: 16.50, precio_original: 27.00 },
    'Rótula de Dirección Lemförder': { precio: 38.50, precio_original: 62.00 },
    'Bieleta Estabilizadora Delantera': { precio: 22.99, precio_original: 38.00 },
    'Rodamiento de Rueda SKF': { precio: 34.99, precio_original: 55.00 },
    'Brazos de Control de Suspensión (par)': { precio: 89.50, precio_original: 135.00 },
    'Mantenedor de Batería Inteligente 2A': { precio: 35.99, precio_original: 55.00 },
    'Compresor de Aire Portátil 12V': { precio: 45.00, precio_original: 69.99 },
    'Kit de Herramientas Básicas 39 piezas': { precio: 58.50, precio_original: 89.99 },
    'Limpiador de Inyectores Gasolina': { precio: 12.50, precio_original: 19.99 },
};

async function restoreAllPrices() {
    console.log('Restaurando precios originales de 48 productos...\n');

    let updated = 0;
    let errors = 0;

    for (const [nombre, precios] of Object.entries(preciosSQL)) {
        const { error } = await supabase
            .from('productos')
            .update({
                precio: precios.precio_original, // Precio de venta = precio original (sin oferta)
                precio_original: null // Sin oferta activa
            })
            .eq('nombre', nombre);

        if (error) {
            console.error(`❌ Error en "${nombre}":`, error.message);
            errors++;
        } else {
            console.log(`✓ ${nombre}: ${precios.precio_original} €`);
            updated++;
        }
    }

    console.log(`\n========================================`);
    console.log(`Actualizados: ${updated}`);
    console.log(`Errores: ${errors}`);
    console.log(`========================================`);
}

restoreAllPrices();
