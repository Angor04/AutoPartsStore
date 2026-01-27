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
    console.log('cart.ts - Nuevo Guest Session ID creado:', sessionId);
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
    console.log("saveCart - Corriendo en servidor, saliendo");
    return;
  }

  const sessionId = getGuestSessionId();
  const cartKey = `cart-${sessionId}`;

  console.log("saveCart - Guardando carrito de invitado en sessionStorage:", cartKey);
  try {
    const jsonStr = JSON.stringify(items);
    if (items.length === 0) {
      sessionStorage.removeItem(cartKey);
      console.log("saveCart - Carrito vacío, eliminado de sessionStorage");
    } else {
      sessionStorage.setItem(cartKey, jsonStr);
      console.log("saveCart - Guardado en sessionStorage exitosamente");
    }
  } catch (e) {
    console.error('Error al guardar carrito:', e);
  }
}

/**
 * Guarda el carrito en BD o sessionStorage según el usuario
 */
async function saveCart(items: CartItem[]) {
  console.log("saveCart - Intentando guardar:", items);

  if (typeof window === 'undefined') {
    console.log("saveCart - Corriendo en servidor, saliendo");
    return;
  }

  try {
    const isAuthenticated = await isUserAuthenticated();
    console.log("saveCart - ¿Autenticado?:", isAuthenticated);

    if (isAuthenticated) {
      console.log("saveCart - Usuario autenticado, guardando en BD");
      await saveCartToDB(items);
    } else {
      console.log("saveCart - Usuario NO autenticado, guardando en sessionStorage");
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
  console.log("addToCart - Función llamada con:", item);

  // Obtener el estado actual del store
  const currentItems = cartStore.get();
  console.log("addToCart - current state:", currentItems);

  const existingItem = currentItems.find((i) => i.product_id === item.product_id);

  let updated;
  if (existingItem) {
    // Si el producto ya existe, incrementa la cantidad
    updated = currentItems.map((i) =>
      String(i.product_id) === String(item.product_id)
        ? { ...i, quantity: i.quantity + item.quantity, subtotal: (i.quantity + item.quantity) * i.precio }
        : i
    );
  } else {
    // Si no existe, añádelo
    updated = [...currentItems, { ...item, subtotal: item.quantity * item.precio }];
  }

  console.log("addToCart - updated state:", updated);

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
 * Limpia el carrito cuando el usuario cierra sesión
 */
export async function clearCartOnLogout() {
  console.log("clearCartOnLogout - Limpiando carrito");
  clearCart();

  // Limpiar también sessionStorage completamente
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('autopartsstore-cart');
    localStorage.removeItem('autopartsstore-cart');
    console.log("clearCartOnLogout - sessionStorage y localStorage limpiados");
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
  console.log("loadCart - Cargando carrito");

  if (typeof window === 'undefined') {
    console.log("loadCart - En servidor, saliendo");
    return;
  }

  try {
    const isAuthenticated = await isUserAuthenticated();
    console.log("loadCart - ¿Autenticado?:", isAuthenticated);

    if (isAuthenticated) {
      console.log("loadCart - ✅ Usuario autenticado, cargando de BD");
      const cartFromDB = await loadCartFromDB();
      if (cartFromDB && Array.isArray(cartFromDB) && cartFromDB.length > 0) {
        console.log("loadCart - Carrito cargado de BD:", cartFromDB);
        cartStore.set(cartFromDB);
        // Limpiar sessionStorage de invitados
        const sessionId = sessionStorage.getItem('guest-session-id');
        if (sessionId) {
          sessionStorage.removeItem(`cart-${sessionId}`);
        }
        return;
      } else {
        console.log("loadCart - Carrito vacío en BD");
        cartStore.set([]);
        return;
      }
    }

    // Invitado: Recuperar del sessionStorage si existe
    console.log("loadCart - 👤 Invitado, recuperando del sessionStorage");
    const sessionId = sessionStorage.getItem('guest-session-id');
    if (sessionId) {
      const cartKey = `cart-${sessionId}`;
      const savedCart = sessionStorage.getItem(cartKey);
      if (savedCart) {
        try {
          const cartItems = JSON.parse(savedCart);
          console.log("loadCart - Carrito recuperado del sessionStorage:", cartItems);
          cartStore.set(cartItems);
          return;
        } catch (e) {
          console.error('Error parseando carrito del sessionStorage:', e);
        }
      }
    }

    // Si no hay carrito guardado, iniciar vacío
    console.log("loadCart - Sin carrito guardado, iniciando vacío");
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
