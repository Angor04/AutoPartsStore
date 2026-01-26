// src/components/islands/CartCleaner.tsx
// Componente para limpiar el carrito después del pago exitoso

import React, { useEffect } from 'react';
import { cartStore } from '@/stores/cart';

interface CartCleanerProps {
  sessionId?: string | null;
}

export default function CartCleaner({ sessionId }: CartCleanerProps) {
  useEffect(() => {
    if (sessionId && typeof window !== 'undefined') {
      console.log('🛒 CartCleaner activado para sesión:', sessionId);
      
      // Ejecutar inmediatamente
      clearCartEverywhere();
      
      // También escuchar por cambios
      const handleCartCleared = () => clearCartEverywhere();
      window.addEventListener('cart-cleared', handleCartCleared);
      
      return () => {
        window.removeEventListener('cart-cleared', handleCartCleared);
      };
    }
  }, [sessionId]);

  const clearCartEverywhere = async () => {
    console.log('🛒 Iniciando limpieza completa del carrito...');
    
    try {
      // 1. Limpiar nanostores PRIMERO (esto es lo más importante)
      console.log('📦 Limpiando nanostores...');
      cartStore.set([]);
      
      // 2. Limpiar localStorage
      console.log('💾 Limpiando localStorage...');
      localStorage.removeItem('autopartsstore-cart');
      if (sessionId) {
        localStorage.removeItem(`cart-${sessionId}`);
      }
      
      // 3. Limpiar sessionStorage
      console.log('🔒 Limpiando sessionStorage...');
      sessionStorage.removeItem('autopartsstore-cart');
      if (sessionId) {
        sessionStorage.removeItem(`cart-${sessionId}`);
      }
      
      // 4. Disparar evento personalizado para otros componentes
      console.log('📡 Disparando evento global...');
      window.dispatchEvent(new CustomEvent('cart-cleared', { 
        detail: { sessionId, timestamp: Date.now() } 
      }));
      
      // 5. Forzar actualización del DOM si existe
      if (typeof window !== 'undefined') {
        // Actualizar cualquier elemento que muestre el contador
        const itemCountEl = document.getElementById('item-count');
        if (itemCountEl) {
          itemCountEl.textContent = '0 productos';
        }
        
        const cartBadge = document.querySelector('[data-cart-count]');
        if (cartBadge) {
          cartBadge.textContent = '0';
          cartBadge.parentElement?.classList.add('hidden');
        }
      }
      
      console.log('✅ Carrito limpiado exitosamente en todas partes');
    } catch (error) {
      console.error('❌ Error limpiando carrito:', error);
    }
  };

  return null;
}
