// src/lib/supabase.ts

import { createClient } from '@supabase/supabase-js';
import type { Database, Product, Category, Order } from '@/types';

const getEnv = (key: string) => {
  if (import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return undefined;
};

const SUPABASE_URL = getEnv('PUBLIC_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('PUBLIC_SUPABASE_ANON_KEY');

// Cliente para operaciones públicas (lectura de productos)
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
}

export const supabaseClient = createClient<Database>(
  SUPABASE_URL || '',
  SUPABASE_ANON_KEY || ''
);

// Cliente para operaciones de servidor con permisos de admin
// NOTA: No usamos singleton para evitar problemas de caché con env vars en desarrollo
export const getSupabaseAdmin = () => {
  const serviceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (!serviceKey) {
    throw new Error('Missing Supabase service key for admin operations');
  }

  return createClient<Database>(
    SUPABASE_URL || '',
    serviceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};

// Funciones de utilidad para operaciones comunes
export async function getCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabaseClient
      .from('categorias')
      .select('*');

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    return (data as Category[]) || [];
  } catch (err) {
    console.error('Exception fetching categories:', err);
    return [];
  }
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { data, error } = await supabaseClient
    .from('categorias')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching category:', error);
    return null;
  }

  return (data as Category) || null;
}

export async function getProducts(includeInactive = false): Promise<Product[]> {
  try {
    let query = supabaseClient.from('productos').select('*');

    // Si no se pide explícitamente incluir inactivos, filtrar solo activos
    // Nota: RLS ya debería encargarse, pero esto es doble seguridad y clarificación
    if (!includeInactive) {
      query = query.eq('activo', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return (data as Product[]) || [];
  } catch (err) {
    console.error('Exception fetching products:', err);
    return [];
  }
}

export async function searchProducts(query: string): Promise<Product[]> {
  try {
    const { data, error } = await supabaseClient
      .from('productos')
      .select('*')
      .eq('activo', true) // Solo buscar productos activos
      .or(`nombre.ilike.${query}%,nombre.ilike.% ${query}%`);

    if (error) {
      console.error('Error searching products:', error);
      return [];
    }

    return (data as Product[]) || [];
  } catch (err) {
    console.error('Exception searching products:', err);
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabaseClient
    .from('productos')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching product:', error);
    return null;
  }

  return (data as Product) || null;
}

export async function getProductsByCategory(categoryId: number | string): Promise<Product[]> {
  try {
    const { data, error } = await supabaseClient
      .from('productos')
      .select('*')
      .eq('activo', true)
      .eq('categoria_id', categoryId);

    if (error) {
      console.error('Error fetching products by category:', error);
      return [];
    }

    return (data as Product[]) || [];
  } catch (err) {
    console.error('Exception fetching products by category:', err);
    return [];
  }
}

export async function getFeaturedProducts(limit = 6): Promise<Product[]> {
  try {
    const { data, error } = await supabaseClient
      .from('productos')
      .select('*')
      .eq('activo', true)
      .eq('destacado', true)
      .limit(limit);

    if (error) {
      console.error('Error fetching featured products:', error);
      return [];
    }

    return (data as Product[]) || [];
  } catch (err) {
    console.error('Exception fetching featured products:', err);
    return [];
  }
}

export async function checkAndUpdateStock(productId: string, quantity: number) {
  const admin = getSupabaseAdmin();

  // Obtener el stock actual
  const { data: product, error: fetchError } = await admin
    .from('productos')
    .select('stock')
    .eq('id', productId)
    .single();

  const typedProduct = product as any;
  if (fetchError || !typedProduct) {
    throw new Error('Product not found');
  }

  if (typedProduct.stock < quantity) {
    throw new Error('Insufficient stock');
  }

  // Actualizar el stock de forma atómica
  const { error: updateError } = await (admin as any)
    .from('productos')
    .update({ stock: typedProduct.stock - quantity })
    .eq('id', productId)
    .eq('stock', typedProduct.stock); // Garantizar atomicidad

  if (updateError) {
    throw new Error('Failed to update stock');
  }

  return true;
}

export async function getSetting(key: string) {
  const { data, error } = await supabaseClient
    .from('configuracion')
    .select('valor')
    .eq('clave', key)
    .single();

  if (error) {
    return null;
  }

  return (data as any)?.valor;
}

export async function updateSetting(key: string, value: any) {
  const admin = getSupabaseAdmin();

  const { error } = await (admin as any)
    .from('configuracion')
    .upsert({
      clave: key,
      valor: value,
      actualizada_en: new Date().toISOString(),
    });

  if (error) {
    throw new Error(`Failed to update setting: ${error.message}`);
  }

  return true;
}
