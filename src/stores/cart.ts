// src/stores/cart.ts

import { atom } from 'nanostores';
import { calculateCartTotal, getCartItemCount } from '@/lib/utils';
import type { CartItem } from '@/types';

// Estado del carrito
export const cartStore = atom<CartItem[]>(() => {
  // Cargar del localStorage si estamos en el navegador
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('autopartsstore-cart');
    return stored ? JSON.parse(stored) : [];
  }
  return [];
});

/**
 * Guarda el carrito en localStorage
 */
function saveCart(items: CartItem[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('autopartsstore-cart', JSON.stringify(items));
  }
}

/**
 * Añade un producto al carrito
 */
export function addToCart(item: CartItem) {
  cartStore.set((current) => {
    const existingItem = current.find((i) => i.product_id === item.product_id);

    let updated;
    if (existingItem) {
      // Si el producto ya existe, incrementa la cantidad
      updated = current.map((i) =>
        i.product_id === item.product_id
          ? { ...i, quantity: i.quantity + item.quantity }
          : i
      );
    } else {
      // Si no existe, añádelo
      updated = [...current, item];
    }

    saveCart(updated);
    return updated;
  });
}

/**
 * Elimina un producto del carrito
 */
export function removeFromCart(productId: string) {
  cartStore.set((current) => {
    const updated = current.filter((i) => i.product_id !== productId);
    saveCart(updated);
    return updated;
  });
}

/**
 * Actualiza la cantidad de un producto en el carrito
 */
export function updateCartItem(productId: string, quantity: number) {
  cartStore.set((current) => {
    let updated;
    if (quantity <= 0) {
      updated = current.filter((i) => i.product_id !== productId);
    } else {
      updated = current.map((i) =>
        i.product_id === productId ? { ...i, quantity } : i
      );
    }
    saveCart(updated);
    return updated;
  });
}

/**
 * Limpia el carrito completamente
 */
export function clearCart() {
  cartStore.set([]);
  saveCart([]);
}

/**
 * Obtiene el total del carrito en céntimos
 */
export function getCartTotal(items: CartItem[]): number {
  return calculateCartTotal(items);
}

/**
 * Verifica si un producto está en el carrito
 */
export function isInCart(productId: string, items: CartItem[]): boolean {
  return items.some((i) => i.product_id === productId);
}

/**
 * Obtiene la cantidad de un producto específico en el carrito
 */
export function getItemQuantity(productId: string, items: CartItem[]): number {
  const item = items.find((i) => i.product_id === productId);
  return item?.quantity || 0;
}
