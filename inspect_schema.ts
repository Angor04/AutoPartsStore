
import { getSupabaseAdmin } from './src/lib/supabase';

async function checkSchema() {
  const supabase = getSupabaseAdmin();
  
  // Method 1: Get one row to see structure
  const { data: coupons, error } = await supabase
    .from('cupones')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching coupons:', error);
    return;
  }

  if (coupons && coupons.length > 0) {
    console.log('Columns in cupones table:', Object.keys(coupons[0]));
    console.log('Sample row:', coupons[0]);
  } else {
    // If empty, try to insert dummy to see columns if possible, or just guess.
    // Actually, if it's empty we can just see headers? No, empty array has no keys.
    // We can try to rely on the error message if we select a non-existent column?
    console.log('Table is empty, trying to infer schema...');
  }
}

checkSchema();
