
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data, error } = await supabase.from('ordenes').select('*').limit(1);
    if (error) {
        fs.writeFileSync('db_check.txt', 'Error: ' + JSON.stringify(error));
        return;
    }
    const cols = Object.keys(data[0] || {});
    fs.writeFileSync('db_check.txt', cols.join('\n'));
}

check();
