// src/lib/cartStorage.ts
// Funciones para manejar el carrito en BD (vía API) o sessionStorage (invitados)

import type { CartItem } from '@/types';

// No normalizar precios, usar tal cual vienen de la BD (precio_original)
// Requisito: precio fuente de verdad único.

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
 * Guarda el carrito en la BD para usuarios autenticados (vía API)
 */
export async function saveCartToDB(items: CartItem[]): Promise<boolean> {
  try {
    const userId = getUserIdFromCookie();

    if (!userId) {
      console.log('saveCartToDB - No hay usuario autenticado');
      return false;
    }

    console.log('saveCartToDB - Guardando en BD para usuario:', userId, 'Items:', items.length);

    const response = await fetch('/api/carrito/guardar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      console.error('saveCartToDB - Error:', result.error);
      return false;
    }

    console.log('saveCartToDB - Carrito guardado exitosamente');
    return true;
  } catch (e) {
    console.error('saveCartToDB - Error:', e);
    return false;
  }
}

/**
 * Carga el carrito de la BD para usuarios autenticados (vía API)
 */
export async function loadCartFromDB(): Promise<CartItem[] | null> {
  try {
    console.log('loadCartFromDB - Cargando desde BD...');

    const response = await fetch('/api/carrito/cargar');
    const result = await response.json();

    if (!result.authenticated) {
      console.log('loadCartFromDB - Usuario no autenticado');
      return null;
    }

    let items = result.items || [];

    // Requisito: Los precios ya vienen de la BD como fuente única de verdad.
    // No aplicar ninguna normalización ni división.

    console.log('loadCartFromDB - Carrito cargado:', items?.length, 'items');
    return items;
  } catch (e) {
    console.error('loadCartFromDB - Error:', e);
    return null;
  }
}

/**
 * Limpia el carrito de la BD (vía API)
 */
export async function clearCartFromDB(): Promise<boolean> {
  try {
    console.log('clearCartFromDB - Limpiando carrito...');

    const response = await fetch('/api/carrito/limpiar', {
      method: 'POST',
    });

    const result = await response.json();
    console.log('clearCartFromDB - Resultado:', result.success);
    return result.success;
  } catch (e) {
    console.error('clearCartFromDB - Error:', e);
    return false;
  }
}
