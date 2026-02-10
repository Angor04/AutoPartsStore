
import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async () => {
    try {
        const admin = getSupabaseAdmin();
        const { data, error } = await admin.from('ordenes').select('*').limit(5);

        const token = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
        let role = 'unknown';
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            role = payload.role;
        } catch (e) {
            role = 'invalid_jwt';
        }

        // Bypass singleton
        const url = import.meta.env.PUBLIC_SUPABASE_URL;
        const key = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
        const freshClient = createClient(url, key, {
            auth: { persistSession: false }
        });

        const { data: freshData, error: freshError } = await freshClient.from('ordenes').select('*').limit(5);

        return new Response(JSON.stringify({
            success: true,
            count: freshData?.length,
            firstOrder: freshData?.[0],
            error: freshError,
            singletonCount: data?.length, // Compare with singleton
            envKeyPresent: !!import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
            url: import.meta.env.PUBLIC_SUPABASE_URL,
            keyRole: role,
            keyStart: token ? token.substring(0, 10) : 'MISSING'
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (e: any) {
        return new Response(JSON.stringify({
            success: false,
            error: e.message,
            stack: e.stack
        }), { status: 500 });
    }
}
