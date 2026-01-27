// src/stores/stock.ts

import { atom, map } from 'nanostores';
import type { CartItem } from '@/types';

/**
 * Store para rastrear el stock dinámicamente
 * Almacena cuánto stock se ha deducido en la sesión actual
 * Formato: { productId: quantity }
 */
export const stockReservedStore = map<Record<string, number>>({});

/**
 * Calcula el stock disponible actual
 * originalStock - lo que se ha reservado en el carrito
 */
export function getAvailableStock(originalStock: number, productId: string): number {
  const reserved = stockReservedStore.get()[productId] || 0;
  return Math.max(0, originalStock - reserved);
}

/**
 * Actualiza el stock reservado cuando se añade al carrito
 */
export function updateReservedStock(items: CartItem[]) {
  const reserved: Record<string, number> = {};

  items.forEach(item => {
    const pid = String(item.product_id);
    reserved[pid] = (reserved[pid] || 0) + item.quantity;
  });

  stockReservedStore.set(reserved);

  // Guardar también en sessionStorage para que ProductCard lo pueda leer
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('stock-reserved', JSON.stringify(reserved));
  }

  console.log("Stock reservado actualizado:", reserved);
}

/**
 * Limpia el stock reservado (cuando se cierra sesión o limpia carrito)
 */
export function clearReservedStock() {
  stockReservedStore.set({});

  // Limpiar también de sessionStorage
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('stock-reserved');
  }
}
