import React, { useEffect } from 'react';
import { cartStore, clearCartPersistent } from '@/stores/cart';

interface CartCleanerProps {
  sessionId?: string | null;
}

export default function CartCleaner({ sessionId }: CartCleanerProps) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('🛒 CartCleaner: Iniciando limpieza profunda...');

      const cleanSession = async () => {
        // 1. Usar la función oficial del store y ESPERAR a que termine
        await clearCartPersistent();

        // 2. Limpieza manual extra por si acaso
        localStorage.removeItem('autopartsstore-cart');
        sessionStorage.removeItem('autopartsstore-cart');

        if (sessionId) {
          localStorage.removeItem(`cart-${sessionId}`);
          sessionStorage.removeItem(`cart-${sessionId}`);
        }

        // 3. Limpiar CUALQUIER clave que empiece por 'cart-' en sessionStorage
        // Esto es para invitados que cambiaron de pestaña o perdieron el ID
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith('cart-')) {
            sessionStorage.removeItem(key);
            console.log(`🧹 Clave extra eliminada: ${key}`);
          }
        }

        // 4. Notificar a otros componentes
        window.dispatchEvent(new CustomEvent('cart-cleared'));
        window.dispatchEvent(new CustomEvent('cartUpdated'));

        console.log('Carrito totalmente purgado');
      };

      cleanSession();
    }
  }, []);

  return null;
}
