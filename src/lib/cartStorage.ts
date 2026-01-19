// src/lib/cartStorage.ts
// Funciones para manejar el carrito en BD o sessionStorage (invitados)

import { supabaseClient } from './supabase';
import type { CartItem } from '@/types';

/**
 * Obtiene el ID del usuario desde la cookie (si está autenticado)
 */
function getUserIdFromCookie(): string | null {
  if (typeof window === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'user-id' && value) {
      console.log('getUserIdFromCookie - Usuario encontrado:', value);
      return value;
    }
  }
  console.log('getUserIdFromCookie - No hay usuario logueado (invitado)');
  return null;
}

/**
 * Verifica si el usuario está autenticado
 */
export async function isUserAuthenticated(): Promise<boolean> {
  const userId = getUserIdFromCookie();
  return userId !== null;
}

/**
 * Obtiene el ID del usuario actual
 */
export async function getCurrentUserId(): Promise<string | null> {
  return getUserIdFromCookie();
}

/**
 * Guarda el carrito en la BD para usuarios autenticados
 */
export async function saveCartToDB(items: CartItem[]): Promise<boolean> {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      console.log('No hay usuario autenticado, guardando en localStorage');
      return false;
    }

    console.log('Guardando carrito en BD para usuario:', userId);

    const { error } = await (supabaseClient as any)
      .from('carrito_temporal')
      .upsert(
        {
          usuario_id: userId,
          items: items,
          actualizado_en: new Date().toISOString(),
        },
        { onConflict: 'usuario_id' }
      );

    if (error) {
      console.error('Error guardando carrito en BD:', error);
      return false;
    }

    console.log('Carrito guardado en BD exitosamente');
    return true;
  } catch (e) {
    console.error('Error en saveCartToDB:', e);
    return false;
  }
}

/**
 * Carga el carrito de la BD para usuarios autenticados
 */
export async function loadCartFromDB(): Promise<CartItem[] | null> {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      console.log('No hay usuario autenticado');
      return null;
    }

    console.log('Cargando carrito de BD para usuario:', userId);

    const { data, error } = await (supabaseClient as any)
      .from('carrito_temporal')
      .select('items')
      .eq('usuario_id', userId)
      .single();

    if (error) {
      console.error('Error cargando carrito de BD:', error);
      return null;
    }

    console.log('Carrito cargado de BD:', (data as any)?.items);
    return (data as any)?.items || [];
  } catch (e) {
    console.error('Error en loadCartFromDB:', e);
    return null;
  }
}

/**
 * Limpia el carrito de la BD
 */
export async function clearCartFromDB(): Promise<boolean> {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return false;
    }

    console.log('Limpiando carrito de BD para usuario:', userId);

    const { error } = await (supabaseClient as any)
      .from('carrito_temporal')
      .delete()
      .eq('usuario_id', userId);

    if (error) {
      console.error('Error limpiando carrito de BD:', error);
      return false;
    }

    return true;
  } catch (e) {
    console.error('Error en clearCartFromDB:', e);
    return false;
  }
}
