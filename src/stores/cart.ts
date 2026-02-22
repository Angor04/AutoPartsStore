// src/stores/cart.ts

import { atom } from 'nanostores';
import { calculateCartTotal, getCartItemCount } from '@/lib/utils';
import { saveCartToDB, loadCartFromDB, clearCartFromDB, isUserAuthenticated } from '@/lib/cartStorage';
import { updateReservedStock, clearReservedStock } from './stock';
import type { CartItem } from '@/types';

// Estado del carrito - comienza vacío, se cargará en CartDisplay
export const cartStore = atom<CartItem[]>([]);

/**
 * Obtiene o crea un ID de sesión único para invitados
 */
function getGuestSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = sessionStorage.getItem('guest-session-id');
  if (!sessionId) {
    sessionId = 'guest-' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('guest-session-id', sessionId);
  }
  return sessionId;
}

/**
 * Guarda el carrito en sessionStorage para invitados
 * Usa una clave única por sesión del navegador
 */
function saveCartToSessionStorage(items: CartItem[]) {
  // Asegurar que solo se ejecute en el navegador
  if (typeof window === 'undefined') {
    return;
  }

  const sessionId = getGuestSessionId();
  const cartKey = `cart-${sessionId}`;

  try {
    const jsonStr = JSON.stringify(items);
    if (items.length === 0) {
      sessionStorage.removeItem(cartKey);
    } else {
      sessionStorage.setItem(cartKey, jsonStr);
    }
  } catch (e) {
    console.error('Error al guardar carrito:', e);
  }
}

/**
 * Guarda el carrito en BD o sessionStorage según el usuario
 */
async function saveCart(items: CartItem[]) {

  if (typeof window === 'undefined') {
    return;
  }

  try {
    const isAuthenticated = await isUserAuthenticated();

    if (isAuthenticated) {
      await saveCartToDB(items);
    } else {
      saveCartToSessionStorage(items);
    }
  } catch (e) {
    console.error('Error en saveCart:', e);
    // Fallback a sessionStorage
    saveCartToSessionStorage(items);
  }
}

/**
 * Añade un producto al carrito
 */
export function addToCart(item: CartItem) {

  // Obtener el estado actual del store
  const currentItems = cartStore.get();

  const existingItem = currentItems.find((i) => i.product_id === item.product_id);

  let updated;
  if (existingItem) {
    // Si el producto ya existe, incrementa la cantidad y ACTUALIZA el precio (por si ha cambiado o estaba mal)
    updated = currentItems.map((i) =>
      String(i.product_id) === String(item.product_id)
        ? {
          ...i,
          quantity: i.quantity + item.quantity,
          precio: item.precio,
          stock: item.stock, // Actualizamos el stock con la información más reciente
          subtotal: (i.quantity + item.quantity) * item.precio
        }
        : i
    );
  } else {
    // Si no existe, añádelo
    updated = [...currentItems, { ...item, subtotal: item.quantity * item.precio }];
  }


  // Actualizar el store PRIMERO (para que el UI se actualice inmediatamente)
  cartStore.set(updated);

  // Actualizar el stock reservado
  updateReservedStock(updated);

  // Luego guardar (puede ser async sin bloquear el UI)
  saveCart(updated);
}

/**
 * Elimina un producto del carrito
 */
export function removeFromCart(productId: string) {
  const current = cartStore.get();
  const updated = current.filter((i) => i.product_id !== productId);
  cartStore.set(updated);
  updateReservedStock(updated);
  saveCart(updated);

  // Disparar evento para actualizar stock en el UI
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  }
}

/**
 * Actualiza la cantidad de un producto en el carrito
 */
export function updateCartItem(productId: string, quantity: number) {
  const current = cartStore.get();
  let updated;
  if (quantity <= 0) {
    updated = current.filter((i) => i.product_id !== productId);
  } else {
    updated = current.map((i) =>
      String(i.product_id) === String(productId) ? { ...i, quantity, subtotal: quantity * i.precio } : i
    );
  }
  cartStore.set(updated);
  updateReservedStock(updated);
  saveCart(updated);

  // Disparar evento para actualizar stock en el UI
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  }
}

/**
 * Limpia el carrito completamente
 */
export function clearCart() {
  const updated: CartItem[] = [];
  cartStore.set(updated);
  clearReservedStock();
  saveCart(updated);

  // Disparar evento para actualizar stock en el UI
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  }
}

/**
 * Limpia el carrito y espera a que la persistencia termine
 */
export async function clearCartPersistent() {
  const updated: CartItem[] = [];
  cartStore.set(updated);
  clearReservedStock();

  // Limpiar en BD y Storage esperando el resultado
  await saveCart(updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cartUpdated'));
    window.dispatchEvent(new CustomEvent('cart-cleared'));
  }
}

/**
 * Limpia el carrito cuando el usuario cierra sesión
 */
export async function clearCartOnLogout() {
  clearCart();

  // Limpiar también sessionStorage completamente
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('autopartsstore-cart');
    localStorage.removeItem('autopartsstore-cart');
  }

  if (typeof window !== 'undefined') {
    // También intentar limpiar de BD
    try {
      await clearCartFromDB();
    } catch (e) {
      console.error('Error limpiando carrito de BD:', e);
    }
  }
}

/**
 * Carga el carrito desde BD (usuario) o sessionStorage (invitado)
 */
export async function loadCart() {

  if (typeof window === 'undefined') {
    return;
  }

  try {
    const isAuthenticated = await isUserAuthenticated();

    if (isAuthenticated) {
      const cartFromDB = await loadCartFromDB();
      if (cartFromDB && Array.isArray(cartFromDB) && cartFromDB.length > 0) {
        cartStore.set(cartFromDB);
        // Limpiar sessionStorage de invitados
        const sessionId = sessionStorage.getItem('guest-session-id');
        if (sessionId) {
          sessionStorage.removeItem(`cart-${sessionId}`);
        }
        return;
      } else {
        cartStore.set([]);
        return;
      }
    }

    // Invitado: Recuperar del sessionStorage si existe
    const sessionId = sessionStorage.getItem('guest-session-id');
    if (sessionId) {
      const cartKey = `cart-${sessionId}`;
      const savedCart = sessionStorage.getItem(cartKey);
      if (savedCart) {
        try {
          const cartItems = JSON.parse(savedCart);

          // VALIDAR PRECIOS Y STOCK PARA INVITADOS
          if (cartItems.length > 0) {
            const res = await fetch('/api/carrito/validar', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ items: cartItems })
            });
            if (res.ok) {
              const validated = await res.json();
              if (validated.items) {
                cartStore.set(validated.items);
                // Guardar de nuevo los precios actualizados en sessionStorage
                saveCartToSessionStorage(validated.items);
                return;
              }
            }
          }

          cartStore.set(cartItems);
          return;
        } catch (e) {
          console.error('Error parseando carrito del sessionStorage:', e);
        }
      }
    }

    // Si no hay carrito guardado, iniciar vacío
    cartStore.set([]);
  } catch (e) {
    console.error('Error en loadCart:', e);
    // Fallback: carrito vacío
    cartStore.set([]);
  }
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
export function getItemQuantity(productId: string | number, items: CartItem[]): number {
  const item = items.find((i) => String(i.product_id) === String(productId));
  return item?.quantity || 0;
}
