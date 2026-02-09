
export const prerender = false;

export async function GET() {
    const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    return new Response(JSON.stringify({
        serviceKeyPresent: !!serviceKey,
        serviceKeyLength: serviceKey ? serviceKey.length : 0,
        nodeEnv: process.env.NODE_ENV,
        url: import.meta.env.PUBLIC_SUPABASE_URL
    }), {
        headers: {
            "Content-Type": "application/json"
        }
    });
}
