// src/components/islands/CartCleaner.tsx
// Componente para limpiar el carrito después del pago exitoso

import React, { useEffect } from 'react';
import { cartStore } from '@/stores/cart';

interface CartCleanerProps {
  sessionId?: string | null;
}

export default function CartCleaner({ sessionId }: CartCleanerProps) {
  useEffect(() => {
    if (sessionId) {
      // Pequeño delay para asegurar que se renderiza completamente
      const timer = setTimeout(() => {
        clearCart();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [sessionId]);

  const clearCart = () => {
    console.log('🛒 Limpiando carrito después de pago exitoso...');
    
    try {
      // 1. Limpiar localStorage
      localStorage.removeItem('autopartsstore-cart');
      localStorage.removeItem(`cart-${sessionId}`);
      console.log('✅ Carrito eliminado de localStorage');
      
      // 2. Limpiar sessionStorage
      sessionStorage.removeItem('autopartsstore-cart');
      sessionStorage.removeItem(`cart-${sessionId}`);
      console.log('✅ Carrito eliminado de sessionStorage');
      
      // 3. Actualizar nanostores
      try {
        cartStore.set([]);
        console.log('✅ Carrito limpiado en nanostores');
      } catch (e) {
        console.warn('⚠️ No se pudo actualizar nanostores:', e);
      }
      
      // 4. Disparar evento personalizado
      window.dispatchEvent(new CustomEvent('cart-cleared', { 
        detail: { sessionId } 
      }));
      console.log('✅ Evento cart-cleared disparado');
    } catch (error) {
      console.error('❌ Error limpiando carrito:', error);
    }
  };

  return null;
}
