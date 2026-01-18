// src/stores/cart.ts

import { atom } from 'nanostores';
import { calculateCartTotal, getCartItemCount } from '@/lib/utils';
import { saveCartToDB, loadCartFromDB, clearCartFromDB, isUserAuthenticated } from '@/lib/cartStorage';
import { updateReservedStock, clearReservedStock } from './stock';
import type { CartItem } from '@/types';

// Estado del carrito - comienza vacío, se cargará en CartDisplay
export const cartStore = atom<CartItem[]>([]);

/**
 * Guarda el carrito en sessionStorage (para invitados)
 * sessionStorage se borra al cerrar el navegador
 */
function saveCartToSessionStorage(items: CartItem[]) {
  // Asegurar que solo se ejecute en el navegador
  if (typeof window === 'undefined') {
    console.log("saveCart - Corriendo en servidor, saliendo");
    return;
  }
  
  console.log("saveCart - Guardando en sessionStorage:", items);
  try {
    const jsonStr = JSON.stringify(items);
    console.log("saveCart - JSON stringificado:", jsonStr);
    sessionStorage.setItem('autopartsstore-cart', jsonStr);
    console.log("saveCart - Guardado en sessionStorage exitosamente");
    
    // Verificar que se guardó
    const verificar = sessionStorage.getItem('autopartsstore-cart');
    console.log("saveCart - Verificación:", verificar);
  } catch (e) {
    console.error('Error al guardar carrito en sessionStorage:', e);
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
      i.product_id === item.product_id
        ? { ...i, quantity: i.quantity + item.quantity }
        : i
    );
  } else {
    // Si no existe, añádelo
    updated = [...currentItems, item];
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
      i.product_id === productId ? { ...i, quantity } : i
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
 * Carga el carrito desde BD o sessionStorage según el usuario
 */
export async function loadCart() {
  console.log("loadCart - Cargando carrito");
  
  if (typeof window === 'undefined') {
    console.log("loadCart - En servidor, saliendo");
    return;
  }

  try {
    const isAuthenticated = await isUserAuthenticated();
    
    if (isAuthenticated) {
      console.log("loadCart - Usuario autenticado, cargando de BD");
      const cartFromDB = await loadCartFromDB();
      if (cartFromDB) {
        cartStore.set(cartFromDB);
        return;
      }
    }
    
    // Fallback a sessionStorage
    console.log("loadCart - Cargando de sessionStorage");
    const stored = sessionStorage.getItem('autopartsstore-cart');
    const cartItems = stored ? JSON.parse(stored) : [];
    cartStore.set(cartItems);
  } catch (e) {
    console.error('Error en loadCart:', e);
    // Fallback a sessionStorage
    const stored = sessionStorage.getItem('autopartsstore-cart');
    const cartItems = stored ? JSON.parse(stored) : [];
    cartStore.set(cartItems);
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
