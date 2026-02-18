// src/pages/api/admin/upload-image.ts
// Sube imágenes al bucket "products-images" de Supabase Storage

import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '@/lib/supabase';
import crypto from 'node:crypto';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return new Response(JSON.stringify({ error: 'No file provided' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Validar tipo de archivo
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return new Response(JSON.stringify({ error: 'Tipo de archivo no permitido. Usa JPG, PNG, WebP o GIF.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Validar tamaño (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return new Response(JSON.stringify({ error: 'El archivo excede el tamaño máximo de 5MB.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const supabaseAdmin = getSupabaseAdmin();

        // Generar nombre único
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${crypto.randomUUID()}.${ext}`;
        const filePath = `products/${fileName}`;

        // Convertir File a ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();

        // Subir a Supabase Storage
        const { data, error } = await supabaseAdmin.storage
            .from('products-images')
            .upload(filePath, arrayBuffer, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: false,
            });

        if (error) {
            console.error('Supabase Storage upload error:', error);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Obtener URL pública
        const { data: urlData } = supabaseAdmin.storage
            .from('products-images')
            .getPublicUrl(filePath);

        return new Response(JSON.stringify({
            success: true,
            url: urlData.publicUrl,
            path: filePath,
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Upload Error:', error);
        return new Response(JSON.stringify({ error: error.message || 'Upload failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
